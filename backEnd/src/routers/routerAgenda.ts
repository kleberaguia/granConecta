import { RequestHandler, Router } from "express";
import AgendaController from "../controller/AgendaController";
import {authMiddleware} from "../middlewares/authMiddleware";

const router = Router();

router.post("/agenda/sugerir", authMiddleware, AgendaController.sugerir as RequestHandler);
router.post("/agenda/:agendaId/confirmar", authMiddleware, AgendaController.confirmar as RequestHandler);

export default router;
