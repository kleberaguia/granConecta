"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multerConfig_1 = require("../config/multerConfig");
const ProdutoController_1 = require("../controller/ProdutoController");
const contentValidator_1 = require("../middlewares/contentValidator");
const routerProduto = (0, express_1.Router)();
const productController = new ProdutoController_1.ProductController();
routerProduto.post('/', authMiddleware_1.authMiddleware, multerConfig_1.upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'foto_hero', maxCount: 1 },
    { name: 'hero_video', maxCount: 1 },
    { name: 'section_image', maxCount: 1 },
    { name: 'hero_carousel', maxCount: 3 },
    { name: 'galeria', maxCount: 20 }
]), multerConfig_1.processImage, productController.createProduto);
routerProduto.get('/meus-produtos', authMiddleware_1.authMiddleware, productController.getMeusProdutos);
routerProduto.get('/meus-produtos/:store_id', authMiddleware_1.authMiddleware, productController.getEditorContext);
routerProduto.post('/generate-ai', authMiddleware_1.authMiddleware, productController.createWithAI);
routerProduto.put('/:id', authMiddleware_1.authMiddleware, multerConfig_1.upload.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'foto_hero', maxCount: 1 }
]), contentValidator_1.validateContent, multerConfig_1.processImage, productController.updateProduto);
routerProduto.delete('/:id', authMiddleware_1.authMiddleware, productController.delete);
exports.default = routerProduto;
