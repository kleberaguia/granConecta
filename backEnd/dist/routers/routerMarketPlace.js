"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const MarketplaceController_1 = __importDefault(require("../controller/MarketplaceController"));
const multerConfig_1 = require("../config/multerConfig");
const routerMarketplace = (0, express_1.Router)();
routerMarketplace.post('/marketplace/banners/solicitar', multerConfig_1.upload.single('image'), authMiddleware_1.authMiddleware, MarketplaceController_1.default.createBanner);
// Rota de listagem que criamos antes
//routerMarketplace.get('/meus/:lojaId', MarketplaceController.listByStore);
// Listagem pública para o carrossel (Filtra por condomínio e aprovados)
routerMarketplace.get('/marketplace/banners/:condominioId', MarketplaceController_1.default.listActive);
routerMarketplace.get('/marketplace/banners/meus/:lojaId', authMiddleware_1.authMiddleware, MarketplaceController_1.default.listByStore);
// Admin gerencia (aprova/paga)
routerMarketplace.patch('/admin/banners/:id/status', authMiddleware_1.authMiddleware, MarketplaceController_1.default.updateStatus);
exports.default = routerMarketplace;
