import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Garantir headers CORS mesmo em caso de 404 - LIBERA TUDO
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  res.status(404).json({
    error: 'Not Found',
    message: `Rota ${req.method} ${req.path} não encontrada`,
    requestId: req.requestId,
  });
};