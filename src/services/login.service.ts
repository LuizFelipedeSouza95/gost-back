import { Usuario } from '../server/entities/usuarios.entity.js';
import { RequestContext } from '@mikro-orm/core';
import { GoogleAuthService } from './google-auth.service.js';
import { generateToken } from '../utils/jwt.js';

export class LoginService {
    private googleAuthService: GoogleAuthService;

    constructor() {
        this.googleAuthService = new GoogleAuthService();
    }

    /**
     * Login tradicional com email e senha (se necessário no futuro)
     */
    async execute({ email, password }: { email: string, password: string }) {
        const em = RequestContext.getEntityManager();
        if (!em) {
            return { status: 500, message: 'Erro ao obter o EntityManager' };
        }
        const user = await em.findOne(Usuario, { email: email });
        if (!user) {
            return { status: 401, message: 'Usuário não encontrado' };
        }
        return { status: 200, message: 'Login realizado com sucesso', user: user };
    }

    /**
     * Inicia o fluxo de autenticação Google
     */
    getGoogleAuthUrl(): string {
        return this.googleAuthService.getAuthUrl();
    }

    /**
     * Processa o callback do Google OAuth
     */
    async handleGoogleCallback(code: string) {
        try {
            // Obtém tokens do Google
            const tokens = await this.googleAuthService.getTokensFromCode(code);
            
            if (!tokens.id_token) {
                throw new Error('Token ID não recebido do Google');
            }

            // Valida o token ID e obtém dados do usuário
            const googleData = await this.googleAuthService.verifyIdToken(tokens.id_token);

            // Busca ou cria o usuário
            const user = await this.googleAuthService.findOrCreateUser(googleData);

            // Gera token JWT
            const jwtToken = generateToken({
                userId: user.id,
                email: user.email,
                roles: user.roles,
            });

            return {
                success: true,
                token: jwtToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    roles: user.roles,
                },
            };
        } catch (error: any) {
            throw new Error(`Erro ao processar autenticação Google: ${error.message}`);
        }
    }

    /**
     * Autentica usando token ID do Google (para uso direto do frontend)
     */
    async authenticateWithGoogleIdToken(idToken: string) {
        try {
            // Valida o token ID e obtém dados do usuário
            const googleData = await this.googleAuthService.verifyIdToken(idToken);

            // Busca ou cria o usuário
            const user = await this.googleAuthService.findOrCreateUser(googleData);

            // Gera token JWT
            const jwtToken = generateToken({
                userId: user.id,
                email: user.email,
                roles: user.roles,
            });

            return {
                success: true,
                token: jwtToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    roles: user.roles,
                },
            };
        } catch (error: any) {
            throw new Error(`Erro ao autenticar com Google: ${error.message}`);
        }
    }
}