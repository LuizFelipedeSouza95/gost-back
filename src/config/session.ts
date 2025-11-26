import session from 'express-session';

export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'gost-airsoft-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    httpOnly: true, // Previne acesso via JavaScript
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    sameSite: 'lax', // Proteção CSRF
  },
  name: 'gost.session', // Nome customizado do cookie
};

