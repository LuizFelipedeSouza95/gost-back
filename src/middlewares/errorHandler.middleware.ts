import { Request, Response, NextFunction } from 'express';
import { NotFoundError, ValidationError } from '@mikro-orm/core';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const globalErrorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';

  // Garantir headers CORS mesmo em caso de erro - LIBERA TUDO
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  // Log do erro
  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro de JSON inválido
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'JSON inválido',
      message: 'O corpo da requisição contém JSON mal formatado',
      requestId,
    });
    return;
  }

  // Erro de CORS
  if (err.message === 'Origem não permitida pelo CORS' || err.message.includes('CORS')) {
    res.status(403).json({
      error: 'Erro de CORS',
      message: 'Origem da requisição não permitida',
      requestId,
    });
    return;
  }

  // Erro do MikroORM - Entidade não encontrada
  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Recurso não encontrado',
      requestId,
    });
    return;
  }

  // Erro de validação do MikroORM
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      requestId,
    });
    return;
  }

  // Erro customizado com statusCode
  if ('statusCode' in err && err.statusCode) {
    res.status(err.statusCode).json({
      error: err.name || 'Error',
      message: err.message,
      requestId,
    });
    return;
  }

  // Erro padrão
  res.status(500).json({
    error: 'Erro interno',
    message: process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno no servidor'
      : err.message,
    requestId,
  });
};

