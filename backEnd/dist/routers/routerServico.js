"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/routerServico.ts
const express_1 = require("express");
const ServicoController_1 = __importDefault(require("../controller/ServicoController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerServico = (0, express_1.Router)();
routerServico.post("/", authMiddleware_1.authMiddleware, ServicoController_1.default.criar);
// routerServico.get("/meus", authMiddleware, ServicoController.meusComoMorador);
routerServico.get("/disponiveis", authMiddleware_1.authMiddleware, ServicoController_1.default.disponiveis);
// routerServico.get("/meus-como-prestador", authMiddleware, ServicoController.meusComoPrestador);
routerServico.get("/:id", authMiddleware_1.authMiddleware, ServicoController_1.default.getById);
exports.default = routerServico;
