// src/routers/routerServico.ts
import { Router } from "express";
import ServicoController from "../controller/ServicoController";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerServico = Router();

routerServico.post("/", authMiddleware, ServicoController.criar);
// routerServico.get("/meus", authMiddleware, ServicoController.meusComoMorador);
routerServico.get("/disponiveis", authMiddleware, ServicoController.disponiveis);
// routerServico.get("/meus-como-prestador", authMiddleware, ServicoController.meusComoPrestador);
routerServico.get("/:id", authMiddleware, ServicoController.getById);

export default routerServico;
