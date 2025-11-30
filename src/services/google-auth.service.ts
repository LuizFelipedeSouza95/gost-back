import { OAuth2Client } from 'google-auth-library';
import { RequestContext } from '@mikro-orm/core';
import { Usuario } from '../server/entities/usuarios.entity.js';
import { getGoogleRedirectUri } from '../config/urls.js';

const redirectUri = getGoogleRedirectUri();
console.log('🔗 Google OAuth Redirect URI:', redirectUri);
console.log('🔑 Google Client ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NÃO CONFIGURADO');
console.log('🔐 Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'NÃO CONFIGURADO');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

export class GoogleAuthService {
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ];

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    console.log('🔗 Google Auth URL gerada:', authUrl.substring(0, 150) + '...');
    console.log('📍 Redirect URI configurado:', redirectUri);
    return authUrl;
  }

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

  async getTokensFromCode(code: string) {
    try {
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new Error('Erro ao obter tokens do Google');
    }
  }

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

    let user = await em.findOne(Usuario, { googleId: googleData.googleId });
    if (!user) {
      user = await em.findOne(Usuario, { email: googleData.email });
    }

    if (user) {
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
        patent: 'interessado', // Patente genérica para novos usuários que fazem login
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


