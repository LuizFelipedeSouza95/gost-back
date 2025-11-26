import { Router } from 'express';
import multer from 'multer';
import { GaleriaController } from '../controllers/galeria.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const galeriaController = new GaleriaController();

// Configuração do multer para upload de arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Aceita apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
  },
});

// Listar é público, criar/deletar requerem autenticação
router.get('/', galeriaController.list.bind(galeriaController));

router.use(requireAuth);
router.post('/', upload.single('image') as any, galeriaController.create.bind(galeriaController));
router.delete('/:id', galeriaController.delete.bind(galeriaController));

export default router;