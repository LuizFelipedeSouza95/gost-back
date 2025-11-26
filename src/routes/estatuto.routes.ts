import { Router } from 'express';
import { EstatutoController } from '../controllers/estatuto.controller.js';
import { requireAdminOrReadOnly } from '../middlewares/auth.middleware.js';

const router = Router();
const estatutoController = new EstatutoController();

// GET permite acesso público
router.get('/', estatutoController.get.bind(estatutoController));

// POST/PUT exige admin
router.post('/', requireAdminOrReadOnly, estatutoController.createOrUpdate.bind(estatutoController));
router.put('/', requireAdminOrReadOnly, estatutoController.createOrUpdate.bind(estatutoController));

export default router;

