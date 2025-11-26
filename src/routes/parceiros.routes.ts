import { Router } from 'express';
import { ParceirosController } from '../controllers/parceiros.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const parceirosController = new ParceirosController();

// Listar é público, criar/editar/excluir requer autenticação
router.get('/', parceirosController.list.bind(parceirosController));

router.use(requireAuth);
router.post('/', parceirosController.create.bind(parceirosController));
router.put('/:id', parceirosController.update.bind(parceirosController));
router.delete('/:id', parceirosController.delete.bind(parceirosController));

export default router;

