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
import { corsOptions } from '../config/cors.js';
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

  // Security middleware
  app.use(helmet());

  // Session middleware (deve vir antes do CORS para configurar cookies corretamente)
  app.use(session(sessionConfig) as unknown as express.RequestHandler);

  // CORS (deve vir depois da sessão)
  app.use(cors({
    ...corsOptions,
    credentials: true, // Importante para cookies de sessão
  }));

  // Compression
  app.use(compression() as unknown as express.RequestHandler);

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // Healthcheck
  app.get('/health', async (_req, res) => {
    try {
      await orm.em.getConnection().execute('select 1');
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
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

