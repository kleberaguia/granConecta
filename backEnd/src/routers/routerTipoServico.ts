import { Router } from "express";
import ServicoTipoController from "../controller/ServicoTipoController";
import { authMiddleware } from "../middlewares/authMiddleware"; // Se quiser proteger

const routerTipoServico = Router();

routerTipoServico.post("/tipos", ServicoTipoController.criar);
routerTipoServico.post("/servico-tipo/find-or-create", ServicoTipoController.findOrCreate);
routerTipoServico.get('/grupos-home', ServicoTipoController.listAllGrupos);
routerTipoServico.get("/tipos-combo", ServicoTipoController.listar);
routerTipoServico.put("/tipos/:id", authMiddleware, ServicoTipoController.atualizar);
routerTipoServico.delete("/tipos/:id", authMiddleware, ServicoTipoController.excluir);

export default routerTipoServico;