import { OAuth2Client } from 'google-auth-library';
import { RequestContext } from '@mikro-orm/core';
import { Usuario } from '../server/entities/usuarios.entity.js';

// Constrói o redirect URI dinamicamente baseado na porta
// Prioriza a porta do PORT sobre o GOOGLE_REDIRECT_URI para evitar inconsistências
const getRedirectUri = () => {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || 'localhost';
  const dynamicUri = `http://${host}:${port}/api/auth/google/callback`;
  
  // Se GOOGLE_REDIRECT_URI estiver definido, usa ele, mas loga um aviso se a porta for diferente
  if (process.env.GOOGLE_REDIRECT_URI) {
    const configuredUri = process.env.GOOGLE_REDIRECT_URI;
    const configuredPort = configuredUri.match(/:(\d+)/)?.[1];
    
    if (configuredPort && configuredPort !== port.toString()) {
      console.warn(`⚠️  AVISO: GOOGLE_REDIRECT_URI usa porta ${configuredPort}, mas servidor está na porta ${port}`);
      console.warn(`⚠️  Usando porta dinâmica (${port}) para evitar erros. Atualize GOOGLE_REDIRECT_URI ou PORT no .env`);
      return dynamicUri;
    }
    return configuredUri;
  }
  
  return dynamicUri;
};

const redirectUri = getRedirectUri();

// Log do redirect URI usado (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔗 Google OAuth Redirect URI configurado:', redirectUri);
  console.log('⚠️  Certifique-se de que este URI está registrado no Google Cloud Console');
}

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

export class GoogleAuthService {
  /**
   * Gera a URL de autorização do Google
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Valida o token ID do Google e retorna os dados do usuário
   */
  async verifyIdToken(idToken: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Payload não encontrado');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        name: payload.name || null,
        picture: payload.picture || null,
      };
    } catch (error) {
      throw new Error('Token do Google inválido');
    }
  }

  /**
   * Troca o código de autorização por tokens
   */
  async getTokensFromCode(code: string) {
    try {
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new Error('Erro ao obter tokens do Google');
    }
  }

  /**
   * Obtém informações do usuário usando o token de acesso
   */
  async getUserInfo(accessToken: string) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Erro ao obter informações do usuário');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Erro ao buscar informações do usuário');
    }
  }

  /**
   * Busca ou cria um usuário baseado nos dados do Google
   */
  async findOrCreateUser(googleData: {
    googleId: string;
    email: string;
    name: string | null;
    picture: string | null;
  }) {
    const em = RequestContext.getEntityManager();
    if (!em) {
      throw new Error('EntityManager não disponível');
    }

    // Busca usuário existente por googleId ou email
    let user = await em.findOne(Usuario, { googleId: googleData.googleId });
    if (!user) {
      user = await em.findOne(Usuario, { email: googleData.email });
    }

    if (user) {
      // Atualiza dados do usuário existente
      if (!user.googleId) {
        user.googleId = googleData.googleId;
      }
      if (!user.name && googleData.name) {
        user.name = googleData.name;
      }
      if (!user.picture && googleData.picture) {
        user.picture = googleData.picture;
      }
      user.lastLogin = new Date();
      await em.flush();
    } else {
      // Cria novo usuário
      user = em.create(Usuario, {
        googleId: googleData.googleId,
        email: googleData.email,
        name: googleData.name || null,
        picture: googleData.picture || null,
        lastLogin: new Date(),
        roles: ['user'],
        comando_geral: [],
        classe: '',
        data_admissao_gost: '',
        patent: 'soldado',
        active: true,
        is_comandante_squad: false,
        nome_squad_subordinado: null,
        nome_guerra: null,
        id_squad_subordinado: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await em.persistAndFlush(user);
    }

    return user;
  }
}

