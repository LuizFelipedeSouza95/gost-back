const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3001', 10);

export function getBackendUrl(): string {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  if (process.env.API_URL) return process.env.API_URL;
  if (isProduction) return 'https://api.gosttactical.com.br';
  return `http://localhost:${port}`;
}

export function getFrontendUrl(): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (isProduction) return 'https://www.gosttactical.com.br';
  return 'http://localhost:3000';
}

export function getFrontendUrlFromRequest(origin?: string, host?: string, protocol?: string): string {
  if (isProduction) {
    if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
    return 'https://www.gosttactical.com.br';
  }

  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;

  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin;
  }

  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    if (host.startsWith('api.')) {
      const frontendHost = host.replace('api.', 'www.');
      const httpProtocol = protocol === 'https' ? 'https' : 'http';
      return `${httpProtocol}://${frontendHost}`;
    }
    
    if (host.includes('gosttactical.com.br')) {
      const httpProtocol = protocol === 'https' ? 'https' : 'http';
      return `${httpProtocol}://${host}`;
    }
  }

  return getFrontendUrl();
}

export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    const configuredUri = process.env.GOOGLE_REDIRECT_URI;
    if (configuredUri.includes('0.0.0.0') || configuredUri.includes(':3000') || configuredUri.includes('www.gosttactical.com.br')) {
      return `${getBackendUrl()}/api/auth/google/callback`;
    }
    return configuredUri;
  }
  return `${getBackendUrl()}/api/auth/google/callback`;
}

export function getCorsOrigins(): string[] {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  if (isProduction) {
    return ['https://www.gosttactical.com.br', 'https://gosttactical.com.br'];
  }
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

