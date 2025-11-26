import session from 'express-session';

const isProduction = process.env.NODE_ENV === 'production';

export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'gost-airsoft-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // CRÍTICO: Em produção com HTTPS, secure DEVE ser true
    // Quando sameSite: 'none', o navegador EXIGE secure: true
    secure: isProduction, // true em produção (HTTPS), false em desenvolvimento (HTTP)
    httpOnly: true, // Previne acesso via JavaScript
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

