import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'seu-secret-jwt-aqui-altere-em-producao';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
}

export function generateToken(payload: JWTPayload): string {
  // @ts-expect-error - expiresIn aceita string mas o tipo está muito restritivo
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

