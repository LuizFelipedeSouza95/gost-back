import { Request, Response, NextFunction } from 'express';

// Estende o tipo Request para incluir user na sessão
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      email: string;
      name?: string | null;
      picture?: string | null;
      roles: string[];
    };
  }
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Garantir headers CORS antes de verificar autenticação
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Trata requisições OPTIONS (preflight) antes de verificar autenticação
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.session && req.session.userId && req.session.user) {
    next();
    return;
  }

  res.status(401).json({
    success: false,
    message: 'Não autenticado. Por favor, faça login.',
  });
};

/**
 * Middleware opcional - adiciona user ao request se estiver autenticado
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Apenas passa adiante, não bloqueia se não estiver autenticado
  next();
};

/**
 * Middleware para verificar se o usuário é admin
 * Requer autenticação e role 'admin'
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Garantir headers CORS antes de qualquer verificação
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Trata requisições OPTIONS (preflight) antes de verificar autenticação
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Primeiro verifica se está autenticado
  if (!req.session || !req.session.userId || !req.session.user) {
    res.status(401).json({
      success: false,
      message: 'Não autenticado. Por favor, faça login.',
    });
    return;
  }

  // Verifica se o usuário tem o role 'admin'
  const userRoles = req.session.user.roles || [];
  if (!userRoles.includes('admin')) {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem realizar esta ação.',
    });
    return;
  }

  next();
};

/**
 * Middleware que permite GET para todos autenticados, mas exige admin para outros métodos
 * Se não estiver autenticado, retorna erro 401
 * Se estiver autenticado mas não for admin e tentar fazer POST/PUT/DELETE, retorna erro 403
 * Se for GET, permite para qualquer usuário autenticado
 */
export const requireAdminOrReadOnly = (req: Request, res: Response, next: NextFunction): void => {
  // Garantir headers CORS antes de qualquer verificação
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Trata requisições OPTIONS (preflight) antes de verificar autenticação
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Verifica se está autenticado
  if (!req.session || !req.session.userId || !req.session.user) {
    res.status(401).json({
      success: false,
      message: 'Não autenticado. Por favor, faça login.',
    });
    return;
  }

  // Se for GET, permite para qualquer usuário autenticado
  if (req.method === 'GET') {
    next();
    return;
  }

  // Para outros métodos (POST, PUT, DELETE, PATCH), exige admin
  const userRoles = req.session.user.roles || [];
  if (!userRoles.includes('admin')) {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem realizar esta ação. Você pode apenas visualizar (GET) os dados.',
    });
    return;
  }

  next();
};

