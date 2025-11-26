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

  // Request ID middleware (deve ser o primeiro)
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

  // CORS - Headers manuais (PRIMEIRA CAMADA - mais permissivo)
  app.use((req, res, next) => {
    // Permite TODAS as origens
    res.header('Access-Control-Allow-Origin', '*');
    
    // Permite TODOS os métodos HTTP
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    
    // Permite TODOS os headers que o cliente quiser enviar
    res.header('Access-Control-Allow-Headers', '*');
    
    // Expõe TODOS os headers na resposta
    res.header('Access-Control-Expose-Headers', '*');
    
    // Cache do preflight por 24 horas (86400 segundos)
    res.header('Access-Control-Max-Age', '86400');
    
    // Se for uma requisição OPTIONS (preflight), responde imediatamente
    if (req.method === 'OPTIONS') {
      return res.status(204).send();
    }
    
    next();
  });

  // CORS - Middleware do pacote (SEGUNDA CAMADA - backup)
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: '*',
    exposedHeaders: '*',
    credentials: false, // false quando origin é '*'
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));

  // Security middleware - configurado para não interferir com CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
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

