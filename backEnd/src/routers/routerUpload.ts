import { Router } from 'express';
import { upload, processImage } from '../config/multerConfig';
import UploadController from '../controller/uploadController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routerUploadImg = Router();

/**
 * Upload genérico (IMAGEM + VIDEO + MATERIAIS DE LANDING PAGE)
 *
 * Compatível com:
 * - files (múltiplas imagens/vídeos genéricos)
 * - video_perfil (1 vídeo)
 * - landing_materials (materiais visuais da Landing Page)
 *
 * Observação:
 * - landing_materials preserva a proporção das imagens no multerConfig.
 * - A classificação semântica do material (profissional, espaço, serviço,
 *   produto, logo etc.) será feita pelo Gerador/payload da Landing Page.
 */
routerUploadImg.post(
  "/upload",
  authMiddleware,
  upload.fields([
    { name: "files", maxCount: 10 },
    { name: "video_perfil", maxCount: 1 },
    { name: "landing_materials", maxCount: 20 },
  ]),
  processImage,
  UploadController.handleUpload
);

/**
 * Upload apenas de imagens (mantido por compatibilidade)
 */
routerUploadImg.post(
  '/images',
  authMiddleware,
  upload.fields([{ name: 'files', maxCount: 10 }]),
  processImage,
  UploadController.uploadImages
);

/**
 * Upload apenas de vídeo (mantido por compatibilidade)
 */
routerUploadImg.post(
  '/videos',
  authMiddleware,
  upload.fields([{ name: 'video_perfil', maxCount: 1 }]),
  processImage,
  UploadController.uploadVideo
);

export default routerUploadImg;