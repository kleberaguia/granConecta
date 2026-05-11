"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ServicoTipoController_1 = __importDefault(require("../controller/ServicoTipoController"));
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Se quiser proteger
const routerTipoServico = (0, express_1.Router)();
routerTipoServico.post("/tipos", ServicoTipoController_1.default.criar);
routerTipoServico.post("/servico-tipo/find-or-create", ServicoTipoController_1.default.findOrCreate);
routerTipoServico.get('/grupos-home', ServicoTipoController_1.default.listAllGrupos);
routerTipoServico.get("/tipos-combo", ServicoTipoController_1.default.listar);
routerTipoServico.put("/tipos/:id", authMiddleware_1.authMiddleware, ServicoTipoController_1.default.atualizar);
routerTipoServico.delete("/tipos/:id", authMiddleware_1.authMiddleware, ServicoTipoController_1.default.excluir);
exports.default = routerTipoServico;
