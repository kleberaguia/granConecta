"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controller/categoryController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerCategory = (0, express_1.Router)();
const categoryController = new categoryController_1.CategoryController();
routerCategory.get('/global', authMiddleware_1.authMiddleware, categoryController.listAll); // Todos usam para preencher o Select
routerCategory.get('/store/:storeId', authMiddleware_1.authMiddleware, categoryController.listByStore); // Categorias da loja
routerCategory.get('/:categoriaId', authMiddleware_1.authMiddleware, categoryController.CategoriaById);
// Rotas protegidas (Apenas Admin do App deve conseguir criar/deletar categorias globais)
routerCategory.post('/', authMiddleware_1.authMiddleware, categoryController.create);
routerCategory.delete('/:id', authMiddleware_1.authMiddleware, categoryController.delete);
exports.default = routerCategory;
