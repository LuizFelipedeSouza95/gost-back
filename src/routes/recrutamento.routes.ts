import { Router } from 'express';
import { RecrutamentoController } from '../controllers/recrutamento.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();
const recrutamentoController = new RecrutamentoController();

// Criar recrutamento é público (qualquer um pode se inscrever)
router.post('/', recrutamentoController.create.bind(recrutamentoController));

// Listar e obter requerem autenticação
router.use(requireAuth);
router.get('/me', recrutamentoController.getMyRecrutamento.bind(recrutamentoController));
router.get('/', recrutamentoController.list.bind(recrutamentoController));
router.get('/:id', recrutamentoController.getById.bind(recrutamentoController));

// Adicionar voto requer autenticação (comando pode votar)
router.post('/:id/vote', recrutamentoController.addVote.bind(recrutamentoController));

// Atualizar etapas e atribuir responsável requerem admin
router.use(requireAdmin);
router.put('/:id/stage', recrutamentoController.updateStage.bind(recrutamentoController));
router.put('/:id/responsible', recrutamentoController.assignResponsible.bind(recrutamentoController));
router.delete('/:id', recrutamentoController.delete.bind(recrutamentoController));

export default router;

