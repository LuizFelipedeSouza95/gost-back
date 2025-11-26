import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { Pool } from 'pg';
import { RequestContext, MikroORM } from '@mikro-orm/core';
import type { Request } from 'express';
import mainRoutes from '../routes/index.js';
import { globalErrorHandler } from '../middlewares/errorHandler.middleware.js';
import { notFoundHandler } from '../middlewares/notFound.middleware.js';
import { requestIdMiddleware } from '../middlewares/requestId.middleware.js';
import { createSessionConfig } from '../config/session.js';
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

  const databaseUrl = process.env.DATABASE_URL || process.env.GOST_DATABASE_URL;
  const sessionPool = databaseUrl ? new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }) : undefined;

  if (sessionPool) {
    sessionPool.on('error', (err) => {
      logger.error({ err }, 'Erro no pool de sessões PostgreSQL');
    });
  }

  app.use(cors({
    origin: (origin, callback) => {
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
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    requestIdMiddleware(req, res, next);
  });

  const pinoMiddleware = pinoHttp({
    logger,
    redact: ['req.headers.authorization'],
    autoLogging: {
      ignore: (req) => req.method === 'OPTIONS',
    },
    customProps: (req: Request) => ({ requestId: req.requestId }),
  });
  app.use(pinoMiddleware);

  app.use((req, _res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    RequestContext.create(orm.em, next);
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  const sessionConfig = createSessionConfig(sessionPool);
  const sessionMiddleware = session(sessionConfig) as unknown as express.RequestHandler;
  
  app.use((req, res, next) => {
    sessionMiddleware(req, res, () => {
      if (req.path === '/api/auth/me' || req.path.includes('/api/auth/')) {
        console.log('🔍 [Session Middleware] Sessão após middleware:', {
          hasSession: !!req.session,
          sessionID: req.sessionID,
          sessionId: req.session?.id,
          hasUserId: !!req.session?.userId,
          hasUser: !!req.session?.user,
        });
      }
      next();
    });
  });

  app.use(compression() as unknown as express.RequestHandler);

  app.use(express.urlencoded({ limit: '5120mb', extended: true }));
  app.use(express.json({ limit: '5120mb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    skip: (req) => req.method === 'OPTIONS',
  });
  app.use(limiter);

  app.use('/api', mainRoutes);

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

  app.get('/', (_req, res) => {
    res.json({
      message: 'Servidor Airsoft Backend está no ar!',
      version: '0.0.1',
      docs: '/api',
    });
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

