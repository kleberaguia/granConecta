import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";

import CentralComercialController from "../controller/CentralComercialController";

type ControllerHandler = (
  request: Request,
  response: Response,
) => unknown | Promise<unknown>;

function asyncRoute(
  handler: ControllerHandler,
): RequestHandler {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    Promise.resolve(
      handler(
        request,
        response,
      ),
    ).catch(next);
  };
}

export type CentralComercialRouterMiddlewares = {
  autenticar: RequestHandler;
};

export function criarCentralComercialRouter(
  middlewares: CentralComercialRouterMiddlewares,
) {
  if (!middlewares?.autenticar) {
    throw new Error(
      "CentralComercialRouter exige o middleware autenticar.",
    );
  }

  const router =
    Router();

  /*
   * Todas as rotas da Central Comercial são autenticadas.
   *
   * A identificação do parceiro é feita por request.user,
   * preenchido pelo middleware de autenticação.
   */
  router.use(
    "/central-comercial",
    middlewares.autenticar,
  );

  /*
   * Resumo + lista normalizada.
   *
   * Filtros opcionais:
   * ?stage=EM_NEGOCIACAO
   * ?channel=WHATSAPP
   * ?campaignId=10
   * ?search=psicopedagogia
   * ?page=1
   * ?limit=25
   */
  router.get(
    "/central-comercial",
    asyncRoute(
      CentralComercialController.listar,
    ),
  );

  /*
   * Alias semântico para a mesma listagem.
   */
  router.get(
    "/central-comercial/oportunidades",
    asyncRoute(
      CentralComercialController.listar,
    ),
  );

  /*
   * Detalhe de uma oportunidade.
   * O Service confirma que ela pertence a um negócio
   * do usuário autenticado.
   */
  router.get(
    "/central-comercial/oportunidades/:id",
    asyncRoute(
      CentralComercialController.buscarPorId,
    ),
  );

  return router;
}

export default criarCentralComercialRouter;