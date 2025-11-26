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

  // CORS - ABSOLUTAMENTE PRIMEIRO (antes de QUALQUER outro middleware)
  // Configuração permissiva para desenvolvimento e produção
  app.use(cors({
    origin: (origin, callback) => {
      // SEMPRE permite qualquer origem (incluindo null/undefined)
      // Isso permite que funcione tanto com credentials quanto sem
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Cookie',
      'Set-Cookie',
      'X-Request-Id',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['*'],
    credentials: true, // CRÍTICO: Permite credenciais (cookies, sessões)
    maxAge: 86400, // Cache por 24 horas
    preflightContinue: false, // Não continua para outros handlers após preflight
    optionsSuccessStatus: 204, // Status code para OPTIONS bem-sucedido
  }));

  // Log para debug de requisições OPTIONS
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      logger.info({
        method: 'OPTIONS',
        url: req.url,
        origin: req.headers.origin || 'no-origin',
        requestedMethod: req.headers['access-control-request-method'] || 'N/A',
        requestedHeaders: req.headers['access-control-request-headers'] || 'N/A',
      }, '✅ Preflight OPTIONS recebido');
    }
    next();
  });

  // Request ID middleware - pula para OPTIONS
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    requestIdMiddleware(req, res, next);
  });

  // Logging middleware - pula para OPTIONS
  const pinoMiddleware = pinoHttp({
    logger,
    redact: ['req.headers.authorization'],
    autoLogging: {
      ignore: (req) => req.method === 'OPTIONS',
    },
    customProps: (req: Request) => ({ requestId: req.requestId }),
  });
  app.use(pinoMiddleware);

  // MikroORM Request Context - pula para OPTIONS
  app.use((req, _res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    RequestContext.create(orm.em, next);
  });

  // Security middleware - configurado para NÃO interferir com CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  // Session middleware
  app.use(session(sessionConfig) as unknown as express.RequestHandler);

  // Middleware para logar informações da sessão (apenas para debug)
  app.use((req, res, next) => {
    if (req.method !== 'OPTIONS' && req.path.startsWith('/api/auth')) {
      console.log('🍪 [Session Debug]', {
        path: req.path,
        sessionId: req.session?.id,
        hasSession: !!req.session,
        hasUserId: !!req.session?.userId,
        hasUser: !!req.session?.user,
        cookieHeader: req.headers.cookie ? 'presente' : 'ausente',
        cookieValue: req.headers.cookie?.includes('gost.session') ? 'gost.session presente' : 'gost.session ausente',
      });
    }
    next();
  });

  // Compression
  app.use(compression() as unknown as express.RequestHandler);

  // Body parser - Limites aumentados para suportar upload de vídeos grandes (até 5GB)
  app.use(express.urlencoded({ limit: '5120mb', extended: true }));
  app.use(express.json({ limit: '5120mb' }));

  // Middleware de logging do tamanho do body - pula para OPTIONS
  app.use((req, _, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    const bodySize = JSON.stringify(req.body || {}).length;
    logger.debug({
      method: req.method,
      url: req.url,
      bodySize: `${bodySize} bytes`,
    }, 'Request recebido');
    next();
  });

  // Rate limiting - NÃO aplica para OPTIONS (preflight)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // máximo de 300 requisições por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    skip: (req) => req.method === 'OPTIONS', // Pula rate limiting para OPTIONS
  });
  app.use(limiter);

  // Rotas da API
  // O middleware ensureCorsHeaders não é mais necessário pois o primeiro middleware já trata tudo
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

