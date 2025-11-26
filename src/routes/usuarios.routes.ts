import { Router, Request, Response } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { requireAuth, requireAdminOrReadOnly } from '../middlewares/auth.middleware.js';

const router = Router();
const usuariosController = new UsuariosController();

// Função helper para tratar OPTIONS (preflight)
const handleOptions = (req: Request, res: Response): void => {
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
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
};

// Trata requisições OPTIONS (preflight) ANTES de qualquer middleware de autenticação
// IMPORTANTE: Estas rotas devem vir ANTES das outras rotas para garantir que OPTIONS seja tratado primeiro
router.options('*', handleOptions);
router.options('/', handleOptions);
router.options('/:id', handleOptions);

// Rotas públicas (visualização de membros)
// GET permite visualização pública para membros ativos
router.get('/', usuariosController.list.bind(usuariosController));
router.get('/:id', usuariosController.getById.bind(usuariosController));

// Rotas protegidas (criação, atualização e exclusão requerem admin)
router.post('/', requireAdminOrReadOnly, usuariosController.create.bind(usuariosController));
router.put('/:id', requireAdminOrReadOnly, usuariosController.update.bind(usuariosController));
router.delete('/:id', requireAdminOrReadOnly, usuariosController.delete.bind(usuariosController));

export default router;

