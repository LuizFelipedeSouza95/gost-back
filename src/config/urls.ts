const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3001', 10);

export function getBackendUrl(): string {
  // Prioridade máxima: variáveis de ambiente
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  if (process.env.API_URL) return process.env.API_URL;
  
  // Se não estiver em produção ou não tiver variável de ambiente, usa localhost
  if (!isProduction) return `http://localhost:${port}`;
  
  // Em produção sem variável de ambiente, usa o padrão (mas é recomendado configurar via env)
  return 'https://api.gosttactical.com.br';
}

export function getFrontendUrl(): string {
  // Prioridade máxima: variáveis de ambiente
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  
  // Se não estiver em produção ou não tiver variável de ambiente, usa localhost
  if (!isProduction) return 'http://localhost:3000';
  
  // Em produção sem variável de ambiente, usa o padrão (mas é recomendado configurar via env)
  return 'https://www.gosttactical.com.br';
}

export function getFrontendUrlFromRequest(origin?: string, host?: string, protocol?: string): string {
  // Prioridade máxima: variáveis de ambiente
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;

  // Em produção, tenta usar origin/host da requisição se disponível
  if (isProduction) {
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }

    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const httpProtocol = protocol === 'https' ? 'https' : 'http';
      // Se o host começar com 'api.', substitui por 'www.'
      if (host.startsWith('api.')) {
        const frontendHost = host.replace('api.', 'www.');
        return `${httpProtocol}://${frontendHost}`;
      }
      return `${httpProtocol}://${host}`;
    }
    
    // Fallback para padrão em produção
    return 'https://www.gosttactical.com.br';
  }

  // Em desenvolvimento, usa origin se disponível
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin;
  }

  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const httpProtocol = protocol === 'https' ? 'https' : 'http';
    return `${httpProtocol}://${host}`;
  }

  return getFrontendUrl();
}

export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    const configuredUri = process.env.GOOGLE_REDIRECT_URI.trim();
    if (configuredUri.includes('0.0.0.0') || configuredUri.includes(':3000') || configuredUri.includes('www.gosttactical.com.br')) {
      const fallbackUri = `${getBackendUrl()}/api/auth/google/callback`;
      console.warn('⚠️ GOOGLE_REDIRECT_URI inválido, usando:', fallbackUri);
      return fallbackUri;
    }
    console.log('✅ Usando GOOGLE_REDIRECT_URI configurado:', configuredUri);
    return configuredUri;
  }
  const defaultUri = `${getBackendUrl()}/api/auth/google/callback`;
  console.log('📍 Usando GOOGLE_REDIRECT_URI padrão:', defaultUri);
  return defaultUri;
}

export function getCorsOrigins(): string[] {
  // Prioridade máxima: variáveis de ambiente
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0);
  }
  
  // Se tiver FRONTEND_URL configurado, usa ele também
  if (process.env.FRONTEND_URL) {
    const origins = [process.env.FRONTEND_URL];
    // Adiciona versão sem www se tiver www
    if (process.env.FRONTEND_URL.includes('www.')) {
      origins.push(process.env.FRONTEND_URL.replace('www.', ''));
    }
    return origins;
  }
  
  // Em produção sem variáveis, usa padrão
  if (isProduction) {
    return ['https://www.gosttactical.com.br', 'https://gosttactical.com.br'];
  }
  
  // Desenvolvimento
  return ['http://localhost:3000'];
}

export const urlConfig = {
  backend: getBackendUrl(),
  frontend: getFrontendUrl(),
  googleRedirectUri: getGoogleRedirectUri(),
  corsOrigins: getCorsOrigins(),
  isProduction,
  port,
} as const;

