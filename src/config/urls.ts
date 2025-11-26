/**
 * Configuração centralizada de URLs para diferentes ambientes
 * 
 * Prioridade das variáveis de ambiente:
 * 1. Variáveis específicas (ex: FRONTEND_URL, BACKEND_URL)
 * 2. Variáveis genéricas (ex: API_URL)
 * 3. Valores padrão baseados no ambiente
 */

const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3001', 10);

/**
 * Obtém a URL do backend
 */
export function getBackendUrl(): string {
  // Prioridade: BACKEND_URL > API_URL > inferência do ambiente
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  if (isProduction) {
    return 'https://api.gosttactical.com.br';
  }

  return `http://localhost:${port}`;
}

/**
 * Obtém a URL do frontend
 */
export function getFrontendUrl(): string {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  if (isProduction) {
    return 'https://www.gosttactical.com.br';
  }

  return 'http://localhost:3000';
}

/**
 * Obtém a URL do frontend baseada na requisição HTTP
 * Usa a origem da requisição quando disponível, caso contrário usa configuração padrão
 */
export function getFrontendUrlFromRequest(origin?: string, host?: string, protocol?: string): string {
  // Prioridade: FRONTEND_URL > origin da requisição > inferência do host > padrão
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  // Se houver origin e não for localhost, usa ela
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin;
  }

  // Tenta inferir do host header (útil em redirects do Google OAuth)
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    if (host.startsWith('api.')) {
      const frontendHost = host.replace('api.', 'www.');
      const httpProtocol = protocol === 'https' ? 'https' : 'http';
      return `${httpProtocol}://${frontendHost}`;
    }
  }

  return getFrontendUrl();
}

/**
 * Obtém a URL de callback do Google OAuth
 * IMPORTANTE: Deve apontar para o BACKEND, não para o frontend
 */
export function getGoogleRedirectUri(): string {
  // Prioridade: GOOGLE_REDIRECT_URI > BACKEND_URL/API_URL > padrão
  if (process.env.GOOGLE_REDIRECT_URI) {
    const configuredUri = process.env.GOOGLE_REDIRECT_URI;

    // Validação: Google OAuth não aceita 0.0.0.0
    if (configuredUri.includes('0.0.0.0')) {
      console.warn('⚠️  GOOGLE_REDIRECT_URI contém 0.0.0.0, usando URL padrão');
      return `${getBackendUrl()}/api/auth/google/callback`;
    }

    // Validação: não deve apontar para o frontend
    if (configuredUri.includes(':3000') || configuredUri.includes('www.gosttactical.com.br')) {
      console.warn('⚠️  GOOGLE_REDIRECT_URI aponta para o frontend, usando URL do backend');
      return `${getBackendUrl()}/api/auth/google/callback`;
    }

    return configuredUri;
  }

  return `${getBackendUrl()}/api/auth/google/callback`;
}

/**
 * Obtém as origens permitidas para CORS
 */
export function getCorsOrigins(): string[] {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }

  if (isProduction) {
    return [
      'https://www.gosttactical.com.br',
      'https://gosttactical.com.br',
    ];
  }

  return ['http://localhost:3000'];
}

/**
 * Configuração consolidada de URLs
 */
export const urlConfig = {
  backend: getBackendUrl(),
  frontend: getFrontendUrl(),
  googleRedirectUri: getGoogleRedirectUri(),
  corsOrigins: getCorsOrigins(),
  isProduction,
  port,
} as const;

