import { Router } from "express";
import NotificationController from "../controller/NotificationController";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerNotificacao = Router();

routerNotificacao.post("/notificacoes", authMiddleware, NotificationController.enviar);
routerNotificacao.get("/notificacoes", authMiddleware, NotificationController.listar);
routerNotificacao.put("/marcar/:id", authMiddleware, NotificationController.marcarComoLida);
routerNotificacao.put("/marcar-todas", authMiddleware, NotificationController.marcarTodas);
routerNotificacao.delete("/:id", authMiddleware, NotificationController.excluir);

export default routerNotificacao;
