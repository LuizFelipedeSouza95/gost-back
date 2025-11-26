import { Request, Response } from 'express';
import { LoginService } from '../services/login.service.js';
import { getFrontendUrlFromRequest } from '../config/urls.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

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

            logger.info({ code: code.substring(0, 20) }, '✅ Processando callback do Google');
            const result = await this.loginService.handleGoogleCallback(code);

            logger.info({
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
            }, '👤 Dados do usuário obtidos');

            req.session.userId = result.user.id;
            req.session.user = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name || null,
                picture: result.user.picture || null,
                roles: result.user.roles,
            };

            const frontendUrl = this.getFrontendUrl(req);
            logger.info({
                sessionId: req.sessionID,
                userId: req.session.userId,
                frontendUrl,
            }, '💾 Salvando sessão antes do redirect');

            req.session.touch();
            
            await new Promise<void>((resolve, reject) => {
                req.session.save((saveErr) => {
                    if (saveErr) {
                        logger.error({ err: saveErr }, '❌ Erro ao salvar sessão');
                        reject(saveErr);
                        return;
                    }
                    logger.info({
                        sessionId: req.sessionID,
                        userId: req.session.userId,
                        userEmail: req.session.user?.email,
                        userRoles: req.session.user?.roles,
                        cookieConfig: {
                            secure: req.session.cookie.secure,
                            sameSite: req.session.cookie.sameSite,
                            domain: req.session.cookie.domain,
                            path: req.session.cookie.path,
                        },
                    }, '✅ Sessão salva com sucesso');
                    
                    req.session.reload((reloadErr) => {
                        if (reloadErr) {
                            logger.error({ err: reloadErr }, '❌ Erro ao recarregar sessão após salvar');
                            resolve();
                        } else {
                            logger.info({
                                sessionId: req.sessionID,
                                userId: req.session.userId,
                                hasUser: !!req.session.user,
                            }, '✅ Sessão recarregada com sucesso após salvar');
                            resolve();
                        }
                    });
                });
            });

            const redirectUrl = `${frontendUrl}?auth=success&sessionId=${req.sessionID}`;
            logger.info({
                redirectUrl,
                sessionId: req.sessionID,
                cookieConfig: {
                    name: 'gost.session',
                    domain: req.session.cookie.domain,
                    secure: req.session.cookie.secure,
                    sameSite: req.session.cookie.sameSite,
                    httpOnly: req.session.cookie.httpOnly,
                    path: req.session.cookie.path,
                },
                setCookieHeader: res.getHeader('Set-Cookie'),
            }, '🔄 Redirecionando após autenticação');
            
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

            const cookieValue = req.headers.cookie?.split(';').find(c => c.trim().startsWith('gost.session='));
            const sessionIdFromCookie = cookieValue?.split('=')[1];
            
            logger.info({
                hasSession: !!req.session,
                sessionId: req.session?.id,
                sessionID: req.sessionID,
                sessionIdFromCookie: sessionIdFromCookie?.substring(0, 50),
                hasUserId: !!req.session?.userId,
                hasUser: !!req.session?.user,
                sessionData: req.session ? {
                    userId: req.session.userId,
                    userEmail: req.session.user?.email,
                    userRoles: req.session.user?.roles,
                } : null,
                cookies: req.headers.cookie ? 'presente' : 'ausente',
                cookieHeader: req.headers.cookie?.substring(0, 200),
                origin: req.headers.origin,
                referer: req.headers.referer,
            }, '🔍 Verificando sessão em /api/auth/me');

            if (!req.session) {
                logger.warn('⚠️ req.session é null/undefined');
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado - sessão não encontrada',
                });
            }

            if (!req.session.user || !req.session.userId) {
                logger.warn({
                    hasUserId: !!req.session.userId,
                    hasUser: !!req.session.user,
                    sessionId: req.session.id,
                    sessionID: req.sessionID,
                    sessionKeys: Object.keys(req.session),
                }, '⚠️ Sessão encontrada mas sem dados do usuário');
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado - dados do usuário não encontrados na sessão',
                });
            }

            logger.info({
                id: req.session.user.id,
                email: req.session.user.email,
            }, '✅ Usuário autenticado encontrado');

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