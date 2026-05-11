"use strict";
// src/routes/uploadRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multerConfig_1 = require("../config/multerConfig");
const uploadController_1 = __importDefault(require("../controller/uploadController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerUploadImg = (0, express_1.Router)();
/**
 * Upload genérico (IMAGEM + VIDEO + CAMPOS ESPECÍFICOS)
 * Compatível com:
 * - files (múltiplas imagens)
 * - video_perfil (1 vídeo)
 * - foto_perfil (1 imagem)
 * - foto_hero (1 imagem)
 */
routerUploadImg.post("/upload", authMiddleware_1.authMiddleware, multerConfig_1.upload.fields([
    { name: "files", maxCount: 10 },
    { name: "video_perfil", maxCount: 1 }
]), multerConfig_1.processImage, uploadController_1.default.handleUpload);
/**
 * Upload apenas de imagens (mantido por compatibilidade)
 */
routerUploadImg.post('/images', authMiddleware_1.authMiddleware, multerConfig_1.upload.fields([{ name: 'files', maxCount: 10 }]), multerConfig_1.processImage, uploadController_1.default.uploadImages);
/**
 * Upload apenas de vídeo (mantido por compatibilidade)
 */
routerUploadImg.post('/videos', multerConfig_1.upload.fields([{ name: 'video_perfil', maxCount: 1 }]), // O NOME DEVE SER ESTE
multerConfig_1.processImage, uploadController_1.default.uploadVideo);
exports.default = routerUploadImg;
