"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AvisoController_1 = __importDefault(require("../controller/AvisoController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerAviso = (0, express_1.Router)();
// Tudo em /api/avisos exige auth
routerAviso.use(authMiddleware_1.authMiddleware);
/**
 * GET /api/avisos
 * Lista avisos visíveis para o usuário logado (CONDOMINIO/REDE/ALVO)
 * Obs: não exponha condominio_id via query para morador (deixe o controller bloquear)
 */
routerAviso.get("/", AvisoController_1.default.index);
/**
 * POST /api/avisos
 * Cria um aviso.
 * Body pode ter: titulo, conteudo, tipo, prioridade, visibilidade, targets[]
 */
routerAviso.post("/", AvisoController_1.default.store);
/**
 * PATCH /api/avisos/:id/status
 * Atualiza status do aviso (ATIVO/ENCERRADO/ARQUIVADO).
 */
routerAviso.patch("/:id/status", AvisoController_1.default.updateStatus);
/**
 * POST /api/avisos/:id/visto
 * Marca como visto (para sumir da Home e diminuir contador)
 */
routerAviso.post("/:id/visto", AvisoController_1.default.marcarVisto);
exports.default = routerAviso;
