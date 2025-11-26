import { Router } from 'express';
import { JogosController } from '../controllers/jogos.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const jogosController = new JogosController();

// Listar e obter são públicos, criar e confirmar presença requerem autenticação
router.get('/', jogosController.list.bind(jogosController));
router.get('/:id', jogosController.getById.bind(jogosController));

router.use(requireAuth);
router.post('/', jogosController.create.bind(jogosController));
router.post('/:id/confirm', jogosController.confirmPresence.bind(jogosController));
router.delete('/:id/confirm', jogosController.removePresence.bind(jogosController));

// Atualizar e deletar requerem admin
router.use(requireAdmin);
router.put('/:id', jogosController.update.bind(jogosController));
router.delete('/:id', jogosController.delete.bind(jogosController));

export default router;

