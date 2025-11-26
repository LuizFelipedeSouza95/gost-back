import session from 'express-session';
import type { Pool } from 'pg';

// Import dinâmico do connect-pg-simple (compatível com ES modules)
let PgStore: any;
try {
  const connectPgSimple = require('connect-pg-simple');
  PgStore = connectPgSimple(session);
} catch (error) {
  console.warn('⚠️  connect-pg-simple não encontrado, usando MemoryStore');
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cria a configuração de sessão com store persistente no PostgreSQL
 * 
 * BOAS PRÁTICAS:
 * - Usa PostgreSQL como store persistente (não MemoryStore)
 * - Sessões persistem após reinicializações do servidor
 * - Funciona com múltiplas instâncias do servidor
 * - Limpeza automática de sessões expiradas
 */
export function createSessionConfig(pool?: Pool): session.SessionOptions {
  // Configura o store PostgreSQL se um pool for fornecido
  // Em desenvolvimento, pode usar MemoryStore se preferir
  let store: session.Store | undefined;
  
  if (pool && PgStore) {
    store = new PgStore({
      pool: pool as any, // connect-pg-simple aceita Pool do pg
      tableName: 'gost_sessions', // Nome da tabela de sessões
      createTableIfMissing: true, // Cria a tabela automaticamente se não existir
      pruneSessionInterval: 60, // Limpa sessões expiradas a cada 60 segundos
    });
    console.log('✅ Store de sessão PostgreSQL configurado');
  } else {
    if (!pool) {
      console.warn('⚠️  Pool PostgreSQL não fornecido, usando MemoryStore (não recomendado para produção)');
    } else {
      console.warn('⚠️  connect-pg-simple não disponível, usando MemoryStore');
    }
  }

  return {
    store,
    secret: process.env.SESSION_SECRET || 'gost-airsoft-secret-key-change-in-production',
    resave: false, // Não salva sessão se não foi modificada
    saveUninitialized: false, // Não cria sessão até que algo seja salvo
    rolling: true, // Renova o cookie a cada requisição
    cookie: {
      // CRÍTICO: Em produção com HTTPS, secure DEVE ser true
      // Quando sameSite: 'none', o navegador EXIGE secure: true
      secure: isProduction, // true em produção (HTTPS), false em desenvolvimento (HTTP)
      httpOnly: true, // Previne acesso via JavaScript (proteção XSS)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      // IMPORTANTE: 'none' permite cookies cross-origin (necessário para api.gosttactical.com.br -> www.gosttactical.com.br)
      // Mas 'none' REQUER secure: true, caso contrário o navegador rejeita o cookie
      // Em desenvolvimento, usamos 'lax' com secure: false
      sameSite: isProduction ? 'none' : 'lax',
      // Em produção, define domain como '.gosttactical.com.br' para permitir cookies entre subdomínios
      // Isso permite que o cookie seja acessível tanto em api.gosttactical.com.br quanto em www.gosttactical.com.br
      // O ponto inicial (.) é importante para permitir todos os subdomínios
      domain: isProduction ? '.gosttactical.com.br' : undefined,
      // Path explícito para garantir que o cookie seja enviado
      path: '/',
    },
    name: 'gost.session', // Nome customizado do cookie
  };
}

/**
 * Configuração de sessão padrão (para compatibilidade)
 * @deprecated Use createSessionConfig() com pool PostgreSQL
 */
export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'gost-airsoft-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'none' : 'lax',
    domain: isProduction ? '.gosttactical.com.br' : undefined,
    path: '/',
  },
  name: 'gost.session',
};

