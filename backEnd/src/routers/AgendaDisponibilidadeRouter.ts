import { Router } from "express";
import AgendaDisponibilidadeController from "../controller/AgendaDisponibilidadeController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { isAdminMiddleware } from "../middlewares/isAdminMiddleware";


const routerAgendaDisponivel = Router();
routerAgendaDisponivel.get("/agenda/disponibilidade", authMiddleware, AgendaDisponibilidadeController.listar);
routerAgendaDisponivel.post("/agenda/disponibilidade", authMiddleware, AgendaDisponibilidadeController.criarDisponibilidade);
routerAgendaDisponivel.post("/agenda/disponibilidade/bloqueios", authMiddleware, AgendaDisponibilidadeController.criarBloqueio);
routerAgendaDisponivel.post("/agenda/disponibilidade/consultar", authMiddleware, AgendaDisponibilidadeController.consultarHorario);


export default routerAgendaDisponivel;