"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controller/AuthController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const isAdminMiddleware_1 = require("../middlewares/isAdminMiddleware");
const routerAuth = (0, express_1.Router)();
routerAuth.get('/me', authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, AuthController_1.default.getMe);
routerAuth.post("/register", AuthController_1.default.register);
routerAuth.post("/verificar-email", AuthController_1.default.verificarEmail);
routerAuth.post("/login", AuthController_1.default.login);
routerAuth.post("/forgot-password", AuthController_1.default.forgotPassword);
routerAuth.post("/reset-password", AuthController_1.default.resetPassword);
routerAuth.post("/reenviar-codigo", AuthController_1.default.reenviarCodigo);
exports.default = routerAuth;
