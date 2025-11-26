import { Request, Response } from 'express';
import { LoginService } from '../services/login.service.js';
import { getFrontendUrlFromRequest } from '../config/urls.js';

export class LoginController {
    private loginService: LoginService;

    constructor() {
        this.loginService = new LoginService();
    }

    private getFrontendUrl(req: Request): string {
        const origin = req.headers.origin;
        const host = req.headers.host;
        
        let protocol = 'http';
        if (req.get('x-forwarded-proto') === 'https' || req.get('x-forwarded-proto') === 'https,http') {
            protocol = 'https';
        } else if (req.protocol === 'https') {
            protocol = 'https';
        } else if (process.env.NODE_ENV === 'production') {
            protocol = 'https';
        }
        
        return getFrontendUrlFromRequest(origin, host, protocol);
    }

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

    async googleAuth(req: Request, res: Response) {
        try {
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

    async googleCallback(req: Request, res: Response) {
        try {
            const origin = req.headers.origin;
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }

            const { code, error, error_description } = req.query;
            
            if (error) {
                console.error('❌ Erro do Google OAuth:', {
                    error,
                    error_description,
                    query: req.query,
                });
                const frontendUrl = this.getFrontendUrl(req);
                return res.redirect(`${frontendUrl}?error=${error}&error_description=${error_description || 'Erro na autenticação'}`);
            }

            if (!code || typeof code !== 'string') {
                console.error('❌ Código de autorização não fornecido:', req.query);
                return res.status(400).json({
                    success: false,
                    message: 'Código de autorização não fornecido',
                });
            }

            console.log('✅ Processando callback do Google com código:', code.substring(0, 20) + '...');
            const result = await this.loginService.handleGoogleCallback(code);

            console.log('👤 Dados do usuário obtidos:', {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
            });

            req.session.userId = result.user.id;
            req.session.user = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name || null,
                picture: result.user.picture || null,
                roles: result.user.roles,
            };

            const frontendUrl = this.getFrontendUrl(req);
            console.log('💾 Salvando sessão antes do redirect...', {
                sessionId: req.sessionID,
                userId: req.session.userId,
                frontendUrl,
            });

            req.session.touch();
            
            await new Promise<void>((resolve, reject) => {
                req.session.save((saveErr) => {
                    if (saveErr) {
                        console.error('❌ Erro ao salvar sessão:', saveErr);
                        reject(saveErr);
                        return;
                    }
                    console.log('✅ Sessão salva com sucesso!', {
                        sessionId: req.sessionID,
                        userId: req.session.userId,
                        cookieConfig: {
                            secure: req.session.cookie.secure,
                            sameSite: req.session.cookie.sameSite,
                            domain: req.session.cookie.domain,
                            path: req.session.cookie.path,
                        },
                    });
                    resolve();
                });
            });

            const redirectUrl = `${frontendUrl}?auth=success&sessionId=${req.sessionID}`;
            console.log('🔄 Redirecionando para:', redirectUrl);
            console.log('🍪 Configuração do cookie:', {
                name: 'gost.session',
                domain: req.session.cookie.domain,
                secure: req.session.cookie.secure,
                sameSite: req.session.cookie.sameSite,
                httpOnly: req.session.cookie.httpOnly,
                path: req.session.cookie.path,
            });
            
            res.redirect(redirectUrl);
        } catch (error: any) {
            console.error('❌ Erro no callback do Google:', {
                message: error.message,
                stack: error.stack,
                query: req.query,
            });
            const frontendUrl = this.getFrontendUrl(req);
            res.redirect(`${frontendUrl}?error=auth_failed&message=${encodeURIComponent(error.message || 'Erro ao autenticar')}`);
        }
    }

    async googleSignIn(req: Request, res: Response) {
        try {
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

    async getCurrentUser(req: Request, res: Response) {
        try {
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

            console.log('🔍 Verificando sessão em /api/auth/me:', {
                hasSession: !!req.session,
                sessionId: req.session?.id,
                hasUserId: !!req.session?.userId,
                hasUser: !!req.session?.user,
                cookies: req.headers.cookie ? 'presente' : 'ausente',
                cookieHeader: req.headers.cookie?.substring(0, 50),
            });

            if (!req.session || !req.session.user) {
                console.warn('⚠️ Sessão não encontrada ou usuário não autenticado');
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado',
                });
            }

            console.log('✅ Usuário autenticado encontrado:', {
                id: req.session.user.id,
                email: req.session.user.email,
            });

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

    async logout(req: Request, res: Response) {
        try {
            req.session.destroy((err) => {
                if (err) {
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