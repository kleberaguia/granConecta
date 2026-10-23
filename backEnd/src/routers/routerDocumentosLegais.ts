import { Router } from "express";
import { DocumentoLegalController } from "../controller/DocumentoLegalController";

const routerDocumentoLegal = Router();
const controller = new DocumentoLegalController();

routerDocumentoLegal.get("/", controller.listar.bind(controller));
routerDocumentoLegal.get("/:id", controller.visualizar.bind(controller));
routerDocumentoLegal.post("/aceitar", controller.aceitar.bind(controller));

export default routerDocumentoLegal;