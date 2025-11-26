import { Request, Response } from 'express';
import { LoginService } from '../services/login.service.js';

export class LoginController {
    private loginService: LoginService;

    constructor() {
        this.loginService = new LoginService();
    }

    /**
     * Login tradicional (se necessário)
     */
    async handle(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const login = await this.loginService.execute({ email, password });
            return res.status(login.status).json(login);
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao fazer login',
            });
        }
    }

    /**
     * Inicia o fluxo de autenticação Google
     * Redireciona para a página de autorização do Google
     */
    async googleAuth(req: Request, res: Response) {
        try {
            // Garantir headers CORS
            const origin = req.headers.origin;
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }
            
            const authUrl = this.loginService.getGoogleAuthUrl();
            res.redirect(authUrl);
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao iniciar autenticação Google',
            });
        }
    }

    /**
     * Callback do Google OAuth
     * Processa o código de autorização e retorna o token JWT
     */
    async googleCallback(req: Request, res: Response) {
        try {
            // Garantir headers CORS
            const origin = req.headers.origin;
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }

            const { code } = req.query;

            if (!code || typeof code !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Código de autorização não fornecido',
                });
            }

            console.log('🔄 Processando callback do Google...');
            const result = await this.loginService.handleGoogleCallback(code);
            console.log('✅ Autenticação processada com sucesso');
            console.log('👤 Dados do usuário:', {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                hasPicture: !!result.user.picture,
            });

            // Salva dados do usuário na sessão
            req.session.userId = result.user.id;
            req.session.user = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name || null,
                picture: result.user.picture || null,
                roles: result.user.roles,
            };

            // Salva a sessão antes de redirecionar
            req.session.save((err) => {
                if (err) {
                    console.error('❌ Erro ao salvar sessão:', err);
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    // Redireciona para a URL base, o erro será tratado pelo frontend verificando a sessão
                    return res.redirect(frontendUrl);
                }

                console.log('✅ Sessão criada com sucesso');
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                // Redireciona para a URL base sem query parameters
                res.redirect(frontendUrl);
            });
        } catch (error: any) {
            console.error('❌ Erro no callback do Google:', error);
            console.error('❌ Stack:', error.stack);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            // Redireciona para a URL base, o erro será tratado pelo frontend verificando a sessão
            res.redirect(frontendUrl);
        }
    }

    /**
     * Autentica usando token ID do Google (para uso direto do frontend)
     * Útil quando o frontend já tem o token ID do Google
     */
    async googleSignIn(req: Request, res: Response) {
        try {
            // Garantir headers CORS
            const origin = req.headers.origin;
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            } else {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Access-Control-Expose-Headers', '*');

            const { idToken } = req.body;

            if (!idToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Token ID do Google não fornecido',
                });
            }

            const result = await this.loginService.authenticateWithGoogleIdToken(idToken);

            // Salva dados do usuário na sessão
            req.session.userId = result.user.id;
            req.session.user = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name || null,
                picture: result.user.picture || null,
                roles: result.user.roles,
            };

            return res.status(200).json({
                success: true,
                user: result.user,
            });
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                message: error.message || 'Erro ao autenticar com Google',
            });
        }
    }

    /**
     * Retorna os dados do usuário autenticado
     */
    async getCurrentUser(req: Request, res: Response) {
        try {
            // Garantir headers CORS
            const origin = req.headers.origin;
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            } else {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Access-Control-Expose-Headers', '*');

            if (!req.session || !req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado',
                });
            }

            return res.status(200).json({
                success: true,
                user: req.session.user,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao obter dados do usuário',
            });
        }
    }

    /**
     * Faz logout do usuário
     */
    async logout(req: Request, res: Response) {
        try {
            req.session.destroy((err) => {
                if (err) {
                    console.error('❌ Erro ao destruir sessão:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Erro ao fazer logout',
                    });
                }

                res.clearCookie('gost.session');
                return res.status(200).json({
                    success: true,
                    message: 'Logout realizado com sucesso',
                });
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao fazer logout',
            });
        }
    }
}