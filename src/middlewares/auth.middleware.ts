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
  if (req.session && req.session.userId && req.session.user) {
    return next();
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
  // Primeiro verifica se está autenticado
  if (!req.session || !req.session.userId || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado. Por favor, faça login.',
    });
  }

  // Verifica se o usuário tem o role 'admin'
  const userRoles = req.session.user.roles || [];
  if (!userRoles.includes('admin')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem realizar esta ação.',
    });
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
  // Verifica se está autenticado
  if (!req.session || !req.session.userId || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado. Por favor, faça login.',
    });
  }

  // Se for GET, permite para qualquer usuário autenticado
  if (req.method === 'GET') {
    return next();
  }

  // Para outros métodos (POST, PUT, DELETE, PATCH), exige admin
  const userRoles = req.session.user.roles || [];
  if (!userRoles.includes('admin')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem realizar esta ação. Você pode apenas visualizar (GET) os dados.',
    });
  }

  next();
};

