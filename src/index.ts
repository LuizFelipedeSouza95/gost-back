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

/**
 * Verifica se uma porta está em uso
 */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

/**
 * Mata o processo que está usando a porta (Windows)
 */
async function killProcessOnPort(port: number): Promise<boolean> {
  try {
    // Encontra o PID do processo usando a porta - tenta múltiplas formas
    let stdout = '';
    try {
      const result = await execAsync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      stdout = result.stdout || '';
    } catch (error: any) {
      // Se não encontrar nada, pode ser que não há processo
      if (error.code === 1 || error.stderr?.includes('não encontrado')) {
        return false;
      }
      throw error;
    }
    
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return false;
    }
    
    const pids = new Set<string>();
    
    for (const line of lines) {
      // Procura por LISTENING ou ESTABLISHED que podem estar usando a porta
      if (line.includes('LISTENING') || line.includes('ESTABLISHED')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        // Valida que é um número válido
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }
    }
    
    if (pids.size === 0) {
      logger.warn(`⚠️ Nenhum processo encontrado na porta ${port}`);
      return false;
    }
    
    logger.info(`🔍 Encontrados ${pids.size} processo(s) usando a porta ${port}`);
    
    let killed = false;
    for (const pid of pids) {
      try {
        // Tenta matar o processo
        await execAsync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' });
        logger.info(`✅ Processo ${pid} encerrado com sucesso`);
        killed = true;
      } catch (error: any) {
        const errorMsg = error.message || error.stderr || '';
        // Ignora erros se o processo já não existir ou não tiver permissão
        if (errorMsg.includes('não encontrado') || 
            errorMsg.includes('not found') || 
            errorMsg.includes('não existe') ||
            errorMsg.includes('does not exist') ||
            error.code === 128) {
          // Processo já não existe, considera como sucesso
          killed = true;
        } else if (errorMsg.includes('Acesso negado') || errorMsg.includes('Access is denied')) {
          logger.error(`❌ Acesso negado para encerrar processo ${pid}. Execute como administrador.`);
        } else {
          logger.warn(`⚠️ Erro ao encerrar processo ${pid}: ${errorMsg}`);
        }
      }
    }
    
    return killed;
  } catch (error: any) {
    const errorMsg = error.message || error.stderr || '';
    // Se não encontrar nenhum processo, retorna false
    if (error.code === 1 || 
        errorMsg.includes('não encontrado') || 
        errorMsg.includes('not found')) {
      return false;
    }
    logger.warn(`⚠️ Erro ao verificar processos na porta ${port}: ${errorMsg}`);
    return false;
  }
}

/**
 * Garante que a porta está disponível
 */
async function ensurePortAvailable(port: number): Promise<void> {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    const inUse = await isPortInUse(port);
    
    if (!inUse) {
      // Porta está livre
      return;
    }
    
    attempts++;
    logger.warn(`⚠️ Porta ${port} está em uso (tentativa ${attempts}/${maxAttempts}). Tentando liberar...`);
    
    const killed = await killProcessOnPort(port);
    
    if (killed) {
      // Aguarda progressivamente mais tempo a cada tentativa
      const waitTime = attempts * 1500; // 1.5s, 3s, 4.5s
      logger.info(`⏳ Aguardando ${waitTime}ms para o sistema liberar a porta...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Verifica novamente
      const stillInUse = await isPortInUse(port);
      
      if (!stillInUse) {
        logger.info(`✅ Porta ${port} liberada com sucesso após ${attempts} tentativa(s)`);
        return;
      }
      
      logger.warn(`⚠️ Porta ${port} ainda está em uso após tentativa ${attempts}`);
    } else {
      logger.warn(`⚠️ Não foi possível encontrar/encerrar processos na porta ${port} (tentativa ${attempts})`);
    }
    
    // Se ainda não funcionou e não é a última tentativa, aguarda um pouco antes de tentar novamente
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw new Error(
    `❌ Porta ${port} está em uso e não foi possível liberar automaticamente após ${maxAttempts} tentativas.\n` +
    `💡 Soluções:\n` +
    `   1. Execute o script kill-port.bat manualmente\n` +
    `   2. Encerre o processo manualmente usando o Gerenciador de Tarefas\n` +
    `   3. Execute este comando no PowerShell como administrador: Get-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess | Stop-Process -Force`
  );
}

async function bootstrap() {
  try {
    logger.info('Inicializando servidor...');

    // Verificar e liberar porta se necessário
    await ensurePortAvailable(PORT);

    // Verificar variáveis de ambiente
    const databaseUrl = process.env.DATABASE_URL || process.env.GOST_DATABASE_URL;
    if (!databaseUrl) {
      logger.error('❌ DATABASE_URL ou GOST_DATABASE_URL não está configurada no arquivo .env');
      // logger.error('Por favor, configure a variável DATABASE_URL no arquivo .env');
      process.exit(1);
    }

    // Inicializar MikroORM
    logger.info('Conectando ao banco de dados...');
    logger.debug(`Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`); // Mascara senha no log
    const orm = await MikroORM.init(config);
    logger.info('✅ Conexão com banco de dados estabelecida');

    // Executar migrações pendentes
    const migrator = orm.getMigrator();
    const pendingMigrations = await migrator.getPendingMigrations();
    if (pendingMigrations.length > 0) {
      logger.info(`Executando ${pendingMigrations.length} migração(ões) pendente(s)...`);
      await migrator.up();
      logger.info('Migrações executadas com sucesso');
    }

    // Criar aplicação Express
    const app = createApp(orm);

    // Iniciar servidor com tratamento de erro de porta
    // IMPORTANTE: Escuta em 0.0.0.0 para aceitar conexões de qualquer interface de rede
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      logger.info(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Healthcheck: http://localhost:${PORT}/health`);
      logger.info(`🌐 API: http://localhost:${PORT}/api`);
      logger.info(`✅ CORS configurado para aceitar todas as origens`);
    });

    // Tratamento de erro caso ainda ocorra EADDRINUSE
    server.on('error', async (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Erro: Porta ${PORT} ainda está em uso após tentativas de liberação`);
        logger.info('🔄 Tentando liberar novamente...');
        
        try {
          await ensurePortAvailable(PORT);
          // Tenta iniciar novamente após um breve delay
          setTimeout(() => {
            logger.info('🔄 Reiniciando servidor...');
            process.exit(1); // Força reinicialização
          }, 2000);
        } catch (retryError: any) {
          logger.error('❌ Não foi possível liberar a porta. Encerrando...');
          logger.error(retryError.message);
          process.exit(1);
        }
      } else {
        logger.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Recebido sinal ${signal}, encerrando servidor...`);
      await orm.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error: any) {
    logger.error('❌ Erro ao inicializar servidor');
    logger.error({
      message: error?.message || 'Erro desconhecido',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      code: error?.code,
      name: error?.name,
    }, 'Detalhes do erro:');

    // Mensagens de ajuda específicas
    if (error?.message?.includes('ECONNREFUSED')) {
      logger.error('💡 Dica: Verifique se o PostgreSQL está rodando');
    } else if (error?.message?.includes('password authentication failed')) {
      logger.error('💡 Dica: Verifique as credenciais do banco de dados no arquivo .env');
    } else if (error?.message?.includes('database') && error?.message?.includes('does not exist')) {
      logger.error('💡 Dica: O banco de dados especificado não existe. Crie-o primeiro.');
    } else if (!process.env.DATABASE_URL && !process.env.GOST_DATABASE_URL) {
      logger.error('💡 Dica: Configure DATABASE_URL no arquivo .env');
    }

    process.exit(1);
  }
}

bootstrap();

