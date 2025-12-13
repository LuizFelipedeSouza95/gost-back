import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import { createApp } from '../dist/src/server/app.js';
import config from '../dist/src/config/orm.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

// Cache da conexão ORM e app para evitar reinicialização a cada requisição
let cachedOrm: MikroORM | null = null;
let cachedApp: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (cachedApp && cachedOrm) {
    return cachedApp;
  }

  try {
    // Inicializar ORM se ainda não foi inicializado
    if (!cachedOrm) {
      logger.info('Inicializando MikroORM...');
      cachedOrm = await MikroORM.init(config);
      logger.info('MikroORM inicializado');

      // Executar migrações pendentes
      const migrator = cachedOrm.getMigrator();
      const pendingMigrations = await migrator.getPendingMigrations();
      if (pendingMigrations.length > 0) {
        logger.info(`Executando ${pendingMigrations.length} migração(ões) pendente(s)...`);
        await migrator.up();
        logger.info('Migrações executadas com sucesso');
      }
    }

    // Criar app Express se ainda não foi criado
    if (!cachedApp) {
      logger.info('Criando app Express...');
      cachedApp = createApp(cachedOrm);
      logger.info('App Express criado');
    }

    return cachedApp;
  } catch (error: any) {
    logger.error({ error }, 'Erro ao inicializar app');
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    
    // Converter Vercel request/response para Express
    return new Promise<void>((resolve, reject) => {
      app(req as any, res as any, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error: any) {
    logger.error({ error }, 'Erro no handler do Vercel');
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
}

