import session from 'express-session';

export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'gost-airsoft-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // false em desenvolvimento para funcionar com HTTP localhost
    httpOnly: true, // Previne acesso via JavaScript
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    // IMPORTANTE: 'none' permite cookies cross-origin, mas requer secure: true em produção
    // Em desenvolvimento local, usamos 'lax' ou 'none' com secure: false
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    // Não definir domain permite cookies em qualquer domínio
    domain: undefined,
    // Path explícito para garantir que o cookie seja enviado
    path: '/',
  },
  name: 'gost.session', // Nome customizado do cookie
};

