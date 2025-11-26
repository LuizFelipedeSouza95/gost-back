import { Request, Response } from 'express';
import { LoginService } from '../services/login.service.js';
import { getFrontendUrlFromRequest } from '../config/urls.js';

export class LoginController {
    private loginService: LoginService;

    constructor() {
        this.loginService = new LoginService();
    }

    /**
     * Determina a URL do frontend para redirecionamento
     */
    private getFrontendUrl(req: Request): string {
        const origin = req.headers.origin;
        const host = req.headers.host;
        
        // Detecta protocolo: prioriza x-forwarded-proto (útil em proxies/load balancers)
        // depois verifica req.protocol e finalmente usa https se estiver em produção
        let protocol = 'http';
        if (req.get('x-forwarded-proto') === 'https' || 
            req.get('x-forwarded-proto') === 'https,http') {
            protocol = 'https';
        } else if (req.protocol === 'https') {
            protocol = 'https';
        } else if (process.env.NODE_ENV === 'production') {
            // Em produção, assume HTTPS por padrão
            protocol = 'https';
        }
        
        console.log('🔍 Detectando URL do frontend:', {
            origin,
            host,
            protocol,
            'x-forwarded-proto': req.get('x-forwarded-proto'),
            'req.protocol': req.protocol,
            'NODE_ENV': process.env.NODE_ENV,
        });
        
        return getFrontendUrlFromRequest(origin, host, protocol);
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

            console.log('💾 Salvando sessão...', {
                sessionId: req.sessionID,
                userId: req.session.userId,
                hasUser: !!req.session.user,
            });

            const frontendUrl = this.getFrontendUrl(req);
            
            // Marca a sessão como modificada para garantir que seja salva
            req.session.touch();
            
            // Salva a sessão ANTES de fazer o redirect
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('❌ Erro ao salvar sessão:', saveErr);
                    return res.redirect(frontendUrl);
                }

                console.log('✅ Sessão salva com sucesso!', {
                    sessionId: req.sessionID,
                    userId: req.session.userId,
                    email: req.session.user?.email,
                });
                
                // Verifica se o cookie está sendo enviado
                const setCookieHeader = res.getHeader('Set-Cookie');
                console.log('🍪 Set-Cookie header:', setCookieHeader ? 'presente' : 'ausente');
                if (setCookieHeader) {
                    console.log('🍪 Cookie sendo enviado:', Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader);
                }
                
                console.log('🍪 Configuração do cookie:', {
                    secure: req.session.cookie.secure,
                    sameSite: req.session.cookie.sameSite,
                    httpOnly: req.session.cookie.httpOnly,
                    domain: req.session.cookie.domain,
                    path: req.session.cookie.path,
                });
                
                console.log('🔄 Redirecionando para:', frontendUrl);
                
                // Faz o redirect - o cookie já foi salvo e será enviado automaticamente
                res.redirect(frontendUrl);
            });
        } catch (error: any) {
            console.error('❌ Erro no callback do Google:', error);
            console.error('❌ Stack:', error.stack);
            const frontendUrl = this.getFrontendUrl(req);
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

            // Log para debug da sessão
            console.log('🔍 [getCurrentUser] Verificando sessão:', {
                hasSession: !!req.session,
                sessionId: req.session?.id,
                hasUserId: !!req.session?.userId,
                hasUser: !!req.session?.user,
                cookie: req.headers.cookie?.includes('gost.session') ? 'presente' : 'ausente',
            });

            if (!req.session || !req.session.user) {
                console.warn('⚠️ [getCurrentUser] Sessão inválida ou usuário não encontrado');
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado',
                });
            }

            console.log('✅ [getCurrentUser] Usuário encontrado:', {
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