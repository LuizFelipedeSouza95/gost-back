import { Router } from 'express';
import { FAQsController } from '../controllers/faqs.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const faqsController = new FAQsController();

// Listar é público, criar requer autenticação
router.get('/', faqsController.list.bind(faqsController));

router.use(requireAuth);
router.post('/', faqsController.create.bind(faqsController));

export default router;

