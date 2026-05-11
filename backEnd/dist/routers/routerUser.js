"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = __importDefault(require("../controller/UserController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multerConfig_1 = require("../config/multerConfig");
const routerUser = (0, express_1.Router)();
/**
 * =========================
 * ROTAS BÁSICAS
 * =========================
 */
routerUser.get("/me", authMiddleware_1.authMiddleware, UserController_1.default.getMe);
routerUser.get("/vitrine/:slug", UserController_1.default.getVitrineBySlug);
routerUser.get("/pendentes-aprovacao", authMiddleware_1.authMiddleware, UserController_1.default.listarPendentes);
routerUser.get("/:id", UserController_1.default.getById);
routerUser.get("/", UserController_1.default.getAll);
routerUser.post("/", authMiddleware_1.authMiddleware, UserController_1.default.create);
routerUser.patch('/track/:id', UserController_1.default.trackAction);
/**
 * =========================
 * ATUALIZAÇÃO PERFIL GERAL
 * =========================
 */
routerUser.put("/me/perfil-geral", authMiddleware_1.authMiddleware, 
// DEBUG CONTROLADO
(req, res, next) => {
    console.log("➡️ [PERFIL GERAL] Usuário:", req.user?.usuarioId);
    next();
}, multerConfig_1.upload.fields([
    { name: 'foto_perfil_url', maxCount: 1 },
    { name: 'foto_hero_url', maxCount: 1 }
]), 
// DEBUG DE UPLOAD (CRUCIAL)
(req, res, next) => {
    console.log("📦 FILES RECEBIDOS:", req.files);
    next();
}, multerConfig_1.processImage, UserController_1.default.atualizarDadosPessoais);
/**
 * =========================
 * ATUALIZAÇÃO PERFIL PROFISSIONAL
 * =========================
 */
routerUser.put("/me/perfil-profissional", authMiddleware_1.authMiddleware, (req, res, next) => {
    console.log("➡️ [PERFIL PROFISSIONAL] Usuário:", req.user?.usuarioId);
    next();
}, multerConfig_1.upload.fields([
    { name: 'foto_perfil_url', maxCount: 1 },
    { name: 'foto_hero_url', maxCount: 1 }
]), (req, res, next) => {
    console.log("📦 FILES RECEBIDOS:", req.files);
    next();
}, multerConfig_1.processImage, UserController_1.default.atualizarPerfilProfissional);
/**
 * =========================
 * OUTRAS ROTAS
 * =========================
 */
routerUser.patch("/analisar/:id", authMiddleware_1.authMiddleware, UserController_1.default.analisarPerfil);
// Rota genérica de update
routerUser.put("/:id", authMiddleware_1.authMiddleware, UserController_1.default.update);
routerUser.delete("/:id", authMiddleware_1.authMiddleware, UserController_1.default.delete);
exports.default = routerUser;
