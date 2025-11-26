import { Router } from 'express';
import { LoginController } from '../controllers/login.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const loginController = new LoginController();

// Rotas públicas de autenticação
router.get('/google', loginController.googleAuth.bind(loginController));
router.get('/google/callback', loginController.googleCallback.bind(loginController));
router.post('/google/signin', loginController.googleSignIn.bind(loginController));

// Rotas protegidas de autenticação
router.get('/me', requireAuth, loginController.getCurrentUser.bind(loginController));
router.post('/logout', loginController.logout.bind(loginController));

export default router;

