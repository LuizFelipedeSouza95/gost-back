import { Router } from 'express';
import { TreinamentosController } from '../controllers/treinamentos.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const treinamentosController = new TreinamentosController();

// Listar é público, criar e inscrever requerem autenticação
router.get('/', treinamentosController.list.bind(treinamentosController));

router.use(requireAuth);
router.post('/', treinamentosController.create.bind(treinamentosController));
router.post('/:id/subscribe', treinamentosController.subscribe.bind(treinamentosController));

export default router;

