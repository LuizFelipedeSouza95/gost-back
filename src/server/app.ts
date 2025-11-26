import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { RequestContext, MikroORM } from '@mikro-orm/core';
import type { Request } from 'express';
import mainRoutes from '../routes/index.js';
import { globalErrorHandler } from '../middlewares/errorHandler.middleware.js';
import { notFoundHandler } from '../middlewares/notFound.middleware.js';
import { requestIdMiddleware } from '../middlewares/requestId.middleware.js';
import { ensureCorsHeaders } from '../middlewares/cors.middleware.js';
import { sessionConfig } from '../config/session.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

export function createApp(orm: MikroORM) {
  const app = express();

  // CORS - ABSOLUTAMENTE PRIMEIRO (antes de QUALQUER outro middleware)
  // LIBERA TODAS AS ORIGENS SEM RESTRIÇÕES
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // IMPORTANTE: Quando credentials: true, NÃO podemos usar '*'
    // Precisamos usar a origem específica ou permitir todas usando uma função callback
    // Se houver origin, usa ela; se não, permite qualquer origem (mas sem credentials)
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Se não houver origin (ex: requisições do mesmo domínio), permite todas
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Sem credentials quando não há origin
    }
    
    // Permite TODOS os métodos HTTP
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    
    // Permite TODOS os headers
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // Expõe TODOS os headers na resposta
    res.setHeader('Access-Control-Expose-Headers', '*');
    
    // Cache do preflight por 24 horas
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Responde preflight OPTIONS IMEDIATAMENTE, sem passar por outros middlewares
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  });

  // Rota explícita para OPTIONS em TODAS as rotas (backup adicional)
  app.options('*', (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  });

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Logging middleware
  const pinoMiddleware = pinoHttp({
    logger,
    redact: ['req.headers.authorization'],
    autoLogging: true,
    customProps: (req: Request) => ({ requestId: req.requestId }),
  });
  app.use(pinoMiddleware);

  // MikroORM Request Context
  app.use((req, _res, next) => RequestContext.create(orm.em, next));

  // CORS - Middleware do pacote (segunda camada - LIBERA TUDO)
  // IMPORTANTE: Quando credentials: true, não podemos usar origin: '*'
  // Usamos uma função que sempre retorna true para permitir todas as origens
  app.use(cors({
    origin: (origin, callback) => {
      // SEMPRE permite qualquer origem (incluindo null/undefined)
      // Isso permite que funcione tanto com credentials quanto sem
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'], // Lista explícita de métodos
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept', 'Origin', 'X-Requested-With', 'Cookie', 'Set-Cookie', '*'], // Permite todos os headers
    exposedHeaders: ['*'], // Expõe todos os headers
    credentials: true, // CRÍTICO: Permite credenciais (cookies, sessões)
    maxAge: 86400, // Cache por 24 horas
    preflightContinue: false, // Não continua para outros handlers após preflight
    optionsSuccessStatus: 204, // Status code para OPTIONS bem-sucedido
  }));

  // Security middleware - configurado para NÃO interferir com CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    // IMPORTANTE: Não remover headers CORS
    crossOriginOpenerPolicy: false,
  }));

  // Session middleware
  app.use(session(sessionConfig) as unknown as express.RequestHandler);

  // Compression
  app.use(compression() as unknown as express.RequestHandler);

  // Body parser - Limites aumentados para suportar upload de vídeos grandes (até 5GB)
  app.use(express.urlencoded({ limit: '5120mb', extended: true }));
  app.use(express.json({ limit: '5120mb' }));

  // Middleware de logging do tamanho do body
  app.use((req, _, next) => {
    const bodySize = JSON.stringify(req.body || {}).length;
    logger.debug({
      method: req.method,
      url: req.url,
      bodySize: `${bodySize} bytes`,
    }, 'Request recebido');
    next();
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // máximo de 300 requisições por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  });
  app.use(limiter);

  // Middleware adicional de CORS para garantir que todas as rotas tenham headers CORS
  app.use('/api', ensureCorsHeaders);
  
  // Rotas da API
  app.use('/api', mainRoutes);

  // Healthcheck - versão simplificada e rápida
  app.get('/health', async (_req, res) => {
    try {
      await orm.em.getConnection().execute('select 1');
      res.status(200).json({ status: 'ok' });
    } catch (e: any) {
      res.status(500).json({
        status: 'error',
        message: e?.message || 'Erro ao conectar com o banco de dados'
      });
    }
  });

  // Rota raiz
  app.get('/', (_req, res) => {
    res.json({
      message: 'Servidor Airsoft Backend está no ar!',
      version: '0.0.1',
      docs: '/api',
    });
  });

  // Middleware de 404 (deve vir antes do error handler)
  app.use(notFoundHandler);

  // Error handler (deve ser o último)
  app.use(globalErrorHandler);

  return app;
}

