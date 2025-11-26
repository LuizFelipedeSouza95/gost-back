import { Router } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { requireAuth, requireAdminOrReadOnly } from '../middlewares/auth.middleware.js';

const router = Router();
const usuariosController = new UsuariosController();

// Exemplo de uso do middleware requireAdminOrReadOnly:
// - GET permite para qualquer usuário autenticado
// - POST/PUT/DELETE exige admin
router.get('/', requireAuth, usuariosController.list.bind(usuariosController));
router.get('/:id', requireAuth, usuariosController.getById.bind(usuariosController));
router.post('/', requireAdminOrReadOnly, usuariosController.create.bind(usuariosController));
router.put('/:id', requireAdminOrReadOnly, usuariosController.update.bind(usuariosController));
router.delete('/:id', requireAdminOrReadOnly, usuariosController.delete.bind(usuariosController));

export default router;

