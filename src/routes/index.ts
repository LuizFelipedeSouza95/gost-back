import { Router } from 'express';
import { LoginController } from '../controllers/login.controller.js';
import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import squadsRoutes from './squads.routes.js';
import jogosRoutes from './jogos.routes.js';
import galeriaRoutes from './galeria.routes.js';
import noticiasRoutes from './noticias.routes.js';
import parceirosRoutes from './parceiros.routes.js';
import treinamentosRoutes from './treinamentos.routes.js';
import faqsRoutes from './faqs.routes.js';
import equipeRoutes from './equipe.routes.js';
import estatutoRoutes from './estatuto.routes.js';
import recrutamentoRoutes from './recrutamento.routes.js';

const router = Router();
const loginController = new LoginController();

router.post('/login', loginController.handle.bind(loginController));
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/squads', squadsRoutes);
router.use('/jogos', jogosRoutes);
router.use('/galeria', galeriaRoutes);
router.use('/noticias', noticiasRoutes);
router.use('/parceiros', parceirosRoutes);
router.use('/treinamentos', treinamentosRoutes);
router.use('/faqs', faqsRoutes);
router.use('/equipe', equipeRoutes);
router.use('/estatuto', estatutoRoutes);
router.use('/recrutamento', recrutamentoRoutes);

export default router;
