import { Router } from 'express';
import { SquadsController } from '../controllers/squads.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const squadsController = new SquadsController();

// Listar é público, criar/atualizar/deletar requer autenticação
router.get('/', squadsController.list.bind(squadsController));
router.get('/:id', squadsController.getById.bind(squadsController));

router.use(requireAuth);
router.post('/', squadsController.create.bind(squadsController));
router.put('/:id', squadsController.update.bind(squadsController));
router.delete('/:id', squadsController.delete.bind(squadsController));

export default router;

