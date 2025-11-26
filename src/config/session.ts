import session from 'express-session';
import type { Pool } from 'pg';

let PgStore: any;
try {
  const connectPgSimple = require('connect-pg-simple');
  PgStore = connectPgSimple.default ? connectPgSimple.default(session) : connectPgSimple(session);
  console.log('✅ connect-pg-simple carregado com sucesso');
} catch (error: any) {
  console.warn('⚠️ connect-pg-simple não encontrado, usando MemoryStore:', error?.message || error);
}

const isProduction = process.env.NODE_ENV === 'production';

export function createSessionConfig(pool?: Pool): session.SessionOptions {
  let store: session.Store | undefined;
  
  if (pool && PgStore) {
    store = new PgStore({
      pool: pool as any,
      tableName: 'gost_sessions',
      createTableIfMissing: true,
      pruneSessionInterval: 60,
    });
  }

  return {
    store,
    secret: process.env.SESSION_SECRET || 'gost-airsoft-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
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
}

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

