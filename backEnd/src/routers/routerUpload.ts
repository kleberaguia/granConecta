// src/routes/uploadRoutes.ts

import { Router } from 'express';
import { upload, processImage } from '../config/multerConfig';
import UploadController from '../controller/uploadController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routerUploadImg = Router();

/**
 * Upload genérico (IMAGEM + VIDEO + CAMPOS ESPECÍFICOS)
 * Compatível com:
 * - files (múltiplas imagens)
 * - video_perfil (1 vídeo)
 * - foto_perfil (1 imagem)
 * - foto_hero (1 imagem)
 */
routerUploadImg.post(
  "/upload",
  authMiddleware,
  upload.fields([
    { name: "files", maxCount: 10 },
    { name: "video_perfil", maxCount: 1 }
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
  upload.fields([{ name: 'video_perfil', maxCount: 1 }]), // O NOME DEVE SER ESTE
  processImage, 
  UploadController.uploadVideo
);

export default routerUploadImg;