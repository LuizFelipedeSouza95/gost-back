import { Router } from 'express';
import { AgendaController } from '../controllers/agenda.controller.js';
import { requireAuth, requireAdminOrReadOnly } from '../middlewares/auth.middleware.js';

const router = Router();
const agendaController = new AgendaController();

// Rotas específicas primeiro (antes das rotas com parâmetros)
// GET permite acesso público
router.get('/', agendaController.list.bind(agendaController));

// GET all (incluindo inativos) - admin
router.get('/all', requireAdminOrReadOnly, agendaController.listAll.bind(agendaController));

// POST exige admin (rota específica antes das rotas com parâmetros)
router.post('/', requireAdminOrReadOnly, agendaController.create.bind(agendaController));

// Rotas com parâmetros depois
// GET por ID - público
router.get('/:id', agendaController.getById.bind(agendaController));

// PUT/DELETE exige admin
router.put('/:id', requireAdminOrReadOnly, agendaController.update.bind(agendaController));
router.delete('/:id', requireAdminOrReadOnly, agendaController.delete.bind(agendaController));

export default router;