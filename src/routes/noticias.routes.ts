import { Router } from 'express';
import { NoticiasController } from '../controllers/noticias.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const noticiasController = new NoticiasController();

// Listar e obter são públicos, criar requer autenticação
router.get('/', noticiasController.list.bind(noticiasController));
router.get('/:id', noticiasController.getById.bind(noticiasController));

router.use(requireAuth);
router.post('/', noticiasController.create.bind(noticiasController));
router.put('/:id', noticiasController.update.bind(noticiasController));
router.delete('/:id', noticiasController.delete.bind(noticiasController));

export default router;

