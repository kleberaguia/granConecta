// src/routes/auth.routes.ts
import { Router } from "express";
import AuthController from "../controller/AuthController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { isAdminMiddleware } from "../middlewares/isAdminMiddleware";


const routerAuth = Router();

routerAuth.get('/me', authMiddleware,isAdminMiddleware, AuthController.getMe);
routerAuth.post("/register", AuthController.register);
routerAuth.post("/verificar-email", AuthController.verificarEmail);
routerAuth.post("/login", AuthController.login);
routerAuth.post("/forgot-password", AuthController.forgotPassword);
routerAuth.post("/reset-password", AuthController.resetPassword);
routerAuth.post("/reenviar-codigo",AuthController.reenviarCodigo);

export default routerAuth;



