import { Router } from 'express';
import { EquipeController } from '../controllers/equipe.controller.js';
import { requireAuth, requireAdminOrReadOnly } from '../middlewares/auth.middleware.js';

const router = Router();
const equipeController = new EquipeController();

// GET permite acesso público
router.get('/', equipeController.get.bind(equipeController));

// POST/PUT exige admin
router.post('/', requireAdminOrReadOnly, equipeController.createOrUpdate.bind(equipeController));
router.put('/', requireAdminOrReadOnly, equipeController.createOrUpdate.bind(equipeController));

export default router;

