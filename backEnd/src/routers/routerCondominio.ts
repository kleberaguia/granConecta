import { Router } from "express";

import CondominioController from "../controller/CondominioController";

import { authMiddleware } from "../middlewares/authMiddleware";
import { isAdminMiddleware } from "../middlewares/isAdminMiddleware";

const routerCondominio = Router();

const condominioController =
  new CondominioController();

/**
 * ============================================================
 * ROTAS PÚBLICAS
 * ============================================================
 */

routerCondominio.get(
  "/",
  condominioController.index
);

/**
 * Precisa ser pública porque o usuário consulta
 * o CEP antes de possuir conta/token.
 */
routerCondominio.get(
  "/consultar-cep/:cep",
  condominioController.consultarCep
);

/**
 * Cadastro controlado de condomínio/unidade
 * durante o registro do morador.
 */
routerCondominio.post(
  "/solicitar-cadastro",
  condominioController.solicitarCadastro
);

/**
 * Mantida por compatibilidade com o fluxo legado.
 */
routerCondominio.post(
  "/validar-codigo",
  condominioController.validarCodigo
);

/**
 * ============================================================
 * ROTAS ADMINISTRATIVAS
 * ============================================================
 */

routerCondominio.post(
  "/novo",
  authMiddleware,
  isAdminMiddleware,
  condominioController.create
);

/**
 * IMPORTANTE:
 *
 * rota dinâmica sempre depois das rotas específicas.
 */
routerCondominio.get(
  "/:id",
  condominioController.getIdCondominio
);

export default routerCondominio;