import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que garante headers CORS em TODAS as respostas
 * Deve ser usado após o middleware principal de CORS para garantir
 * que todas as rotas tenham headers CORS, mesmo as que não passam
 * pelo middleware padrão
 */
export const ensureCorsHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  
  // Sempre define headers CORS antes de enviar qualquer resposta
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
  
  // Trata requisições OPTIONS (preflight) antes de passar para outras rotas
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
};

/**
 * Função helper para adicionar headers CORS em qualquer resposta
 * Útil para usar dentro de controllers
 */
export const addCorsHeaders = (req: Request, res: Response): void => {
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
};

