"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PagamentoController_1 = __importDefault(require("../controller/PagamentoController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multerConfig_1 = require("../config/multerConfig");
const routerPagamento = (0, express_1.Router)();
routerPagamento.get("/meus", authMiddleware_1.authMiddleware, PagamentoController_1.default.listarMeusPagamentos);
routerPagamento.get("/:id", authMiddleware_1.authMiddleware, PagamentoController_1.default.getById);
routerPagamento.post("/", authMiddleware_1.authMiddleware, PagamentoController_1.default.criar); // cria cobrança e retorna link
// 1. Rota para atualizar a Chave PIX (Texto)
routerPagamento.patch("/config/chave-pix", authMiddleware_1.authMiddleware, PagamentoController_1.default.updatePixKey);
// 2. Rota para upload do QR Code (Imagem)
// O 'upload.single("file")' usa a lógica que você já tem de criar pastas e validar tipo
routerPagamento.post("/config/upload-qrcode", authMiddleware_1.authMiddleware, multerConfig_1.upload.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'foto_hero', maxCount: 1 }
]), multerConfig_1.processImage, PagamentoController_1.default.uploadQRCode);
exports.default = routerPagamento;
