import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import { createApp } from './server/app.js';
import config from './config/orm.js';
import pino from 'pino';
import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

const PORT = parseInt(process.env.PORT || '3001', 10);

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: any) => {
      resolve(err.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

async function killProcessOnPort(port: number): Promise<boolean> {
  try {
    let stdout = '';
    try {
      const result = await execAsync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      stdout = result.stdout || '';
    } catch (error: any) {
      if (error.code === 1 || error.stderr?.includes('não encontrado')) {
        return false;
      }
      throw error;
    }
    
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return false;
    
    const pids = new Set<string>();
    for (const line of lines) {
      if (line.includes('LISTENING') || line.includes('ESTABLISHED')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }
    }
    
    if (pids.size === 0) return false;
    
    let killed = false;
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' });
        killed = true;
      } catch (error: any) {
        const errorMsg = error.message || error.stderr || '';
        if (errorMsg.includes('não encontrado') || errorMsg.includes('not found') || 
            errorMsg.includes('não existe') || errorMsg.includes('does not exist') || error.code === 128) {
          killed = true;
        }
      }
    }
    
    return killed;
  } catch (error: any) {
    const errorMsg = error.message || error.stderr || '';
    if (error.code === 1 || errorMsg.includes('não encontrado') || errorMsg.includes('not found')) {
      return false;
    }
    return false;
  }
}

async function ensurePortAvailable(port: number): Promise<void> {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    const inUse = await isPortInUse(port);
    if (!inUse) return;
    
    attempts++;
    logger.warn(`Porta ${port} está em uso (tentativa ${attempts}/${maxAttempts})`);
    
    const killed = await killProcessOnPort(port);
    if (killed) {
      const waitTime = attempts * 1500;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      const stillInUse = await isPortInUse(port);
      if (!stillInUse) return;
    }
    
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Porta ${port} está em uso após ${maxAttempts} tentativas`);
}

async function bootstrap() {
  try {
    logger.info('Inicializando servidor...');

    await ensurePortAvailable(PORT);

    const databaseUrl = process.env.DATABASE_URL || process.env.GOST_DATABASE_URL;
    if (!databaseUrl) {
      logger.error('DATABASE_URL não está configurada no arquivo .env');
      process.exit(1);
    }

    logger.info('Conectando ao banco de dados...');
    const orm = await MikroORM.init(config);
    logger.info('Conexão com banco de dados estabelecida');

    const migrator = orm.getMigrator();
    const pendingMigrations = await migrator.getPendingMigrations();
    if (pendingMigrations.length > 0) {
      logger.info(`Executando ${pendingMigrations.length} migração(ões) pendente(s)...`);
      await migrator.up();
      logger.info('Migrações executadas com sucesso');
    }

    const app = createApp(orm);

    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      logger.info(`Servidor rodando em http://${HOST}:${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Healthcheck: http://localhost:${PORT}/health`);
      logger.info(`API: http://localhost:${PORT}/api`);
    });

    server.on('error', async (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Porta ${PORT} ainda está em uso`);
        process.exit(1);
      } else {
        logger.error('Erro ao iniciar servidor:', error);
        process.exit(1);
      }
    });

    const shutdown = async (signal: string) => {
      logger.info(`Recebido sinal ${signal}, encerrando servidor...`);
      await orm.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error: any) {
    logger.error('Erro ao inicializar servidor');
    logger.error({
      message: error?.message || 'Erro desconhecido',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      code: error?.code,
      name: error?.name,
    });

    if (error?.message?.includes('ECONNREFUSED')) {
      logger.error('Verifique se o PostgreSQL está rodando');
    } else if (error?.message?.includes('password authentication failed')) {
      logger.error('Verifique as credenciais do banco de dados no arquivo .env');
    } else if (error?.message?.includes('database') && error?.message?.includes('does not exist')) {
      logger.error('O banco de dados especificado não existe. Crie-o primeiro.');
    }

    process.exit(1);
  }
}

bootstrap();

