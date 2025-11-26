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
  // PRIORIDADE 1: Se estiver em produção, SEMPRE usa URL de produção (mesmo que headers indiquem localhost)
  // Isso previne problemas quando Google OAuth está configurado incorretamente ou em testes
  if (isProduction) {
    if (process.env.FRONTEND_URL) {
      console.log('📍 [PRODUÇÃO] Usando FRONTEND_URL da variável de ambiente:', process.env.FRONTEND_URL);
      return process.env.FRONTEND_URL;
    }
    
    // Em produção, sempre usa HTTPS e domínio de produção
    console.log('📍 [PRODUÇÃO] Usando URL padrão de produção:', 'https://www.gosttactical.com.br');
    return 'https://www.gosttactical.com.br';
  }

  // PRIORIDADE 2: Variável de ambiente (desenvolvimento)
  if (process.env.FRONTEND_URL) {
    console.log('📍 [DEV] Usando FRONTEND_URL da variável de ambiente:', process.env.FRONTEND_URL);
    return process.env.FRONTEND_URL;
  }

  // PRIORIDADE 3: Origin da requisição (se não for localhost)
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    console.log('📍 [DEV] Usando origin da requisição:', origin);
    return origin;
  }

  // PRIORIDADE 4: Inferir do host header (útil em redirects do Google OAuth)
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    // Se o host é api.gosttactical.com.br, converte para www.gosttactical.com.br
    if (host.startsWith('api.')) {
      const frontendHost = host.replace('api.', 'www.');
      const httpProtocol = protocol === 'https' ? 'https' : 'http';
      const inferredUrl = `${httpProtocol}://${frontendHost}`;
      console.log('📍 [DEV] Inferindo URL do frontend do host:', inferredUrl);
      return inferredUrl;
    }
    
    // Se o host já é um domínio de produção (gosttactical.com.br), usa ele
    if (host.includes('gosttactical.com.br')) {
      const httpProtocol = protocol === 'https' ? 'https' : 'http';
      const inferredUrl = `${httpProtocol}://${host}`;
      console.log('📍 [DEV] Inferindo URL do frontend do domínio:', inferredUrl);
      return inferredUrl;
    }
  }

  // PRIORIDADE 5: Fallback para desenvolvimento
  console.log('📍 [DEV] Usando URL padrão de desenvolvimento:', 'http://localhost:3000');
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

