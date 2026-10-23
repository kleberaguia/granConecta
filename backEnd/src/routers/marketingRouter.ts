import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";

import MarketingAdminController from "../controller/MarketingAdminController";
import MetaWhatsAppWebhookController from "../controller/MetaWhatsAppWebhookController";
import MetaInstagramWebhookController from "../controller/MetaInstagramWebhookController";
import MarketingOpportunityPublicController from "../controller/MarketingOpportunityPublicController";

export type MarketingRouterMiddlewares = {
  autenticar: RequestHandler;
  somenteAdmin: RequestHandler;
  limitarWebhook?: RequestHandler;
};

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
      handler(request, response),
    ).catch(next);
  };
}

export function criarMarketingRouter(
  middlewares: MarketingRouterMiddlewares,
) {
  if (
    !middlewares?.autenticar ||
    !middlewares?.somenteAdmin
  ) {
    throw new Error(
      "marketingRouter exige os middlewares autenticar e somenteAdmin.",
    );
  }

  const router = Router();

  /*
   * Rotas públicas exigidas pela Meta.
   * O POST ainda é protegido internamente pela assinatura
   * X-Hub-Signature-256.
   */
  router.get(
    "/webhooks/meta/whatsapp",
    MetaWhatsAppWebhookController.verificar,
  );

  if (middlewares.limitarWebhook) {
    router.post(
      "/webhooks/meta/whatsapp",
      middlewares.limitarWebhook,
      MetaWhatsAppWebhookController.receber,
    );
  } else {
    router.post(
      "/webhooks/meta/whatsapp",
      MetaWhatsAppWebhookController.receber,
    );
  }


  router.get(
    "/meta/whatsapp/oauth/callback",
    MetaWhatsAppWebhookController.oauthCallback,
  );


  router.get(
    "/webhooks/meta/instagram",
    MetaInstagramWebhookController.verificar,
  );

  if (middlewares.limitarWebhook) {
    router.post(
      "/webhooks/meta/instagram",
      middlewares.limitarWebhook,
      MetaInstagramWebhookController.receber,
    );
  } else {
    router.post(
      "/webhooks/meta/instagram",
      MetaInstagramWebhookController.receber,
    );
  }

  router.get(
    "/meta/instagram/callback",
    MetaInstagramWebhookController.callback,
  );

  /*
   * ============================================================
   * OPORTUNIDADE PÚBLICA
   * ============================================================
   *
   * Valida o token recebido no link da campanha e confirma
   * que ele pertence ao slug acessado. Não expõe as respostas
   * do playbook para o navegador.
   */
  router.get(
    "/marketing/opportunities/public/:token",
    asyncRoute(
      MarketingOpportunityPublicController.resolver,
    ),
  );


  /*
 * ============================================================
 * OPORTUNIDADE PÚBLICA
 * ============================================================
 *
 * Valida o token recebido no link da campanha e confirma
 * que ele pertence ao slug acessado.
 */
  router.get(
    "/marketing/opportunities/public/:token",
    asyncRoute(
      MarketingOpportunityPublicController.resolver,
    ),
  );


  router.post(
    "/marketing/opportunities/public/:token/attach-authenticated-customer",
    middlewares.autenticar,
    asyncRoute(
      MarketingOpportunityPublicController.attachAuthenticatedCustomer,
    ),
  );

  /*
   * ============================================================
   * IDENTIFICAÇÃO DO CLIENTE DA OPORTUNIDADE
   * ============================================================
   *
   * Essa rota NÃO autentica automaticamente um usuário.
   *
   * Resultados:
   *
   * LOGIN_REQUIRED
   * - e-mail já existe;
   * - cliente precisa autenticar.
   *
   * REGISTRATION_REQUIRED
   * - e-mail não existe;
   * - cliente pode seguir para cadastro rápido.
   */
  router.post(
    "/marketing/opportunities/public/:token/identify-customer",
    asyncRoute(
      MarketingOpportunityPublicController.identifyCustomer,
    ),
  );

  /*
   * Tudo abaixo deste ponto exige autenticação
   * e permissão administrativa.
   */
  router.use(
    "/admin/marketing",
    middlewares.autenticar,
    middlewares.somenteAdmin,
  );

  /*
   * Tudo abaixo deste ponto exige autenticação
   * e permissão administrativa.
   */
  router.use(
    "/admin/marketing",
    middlewares.autenticar,
    middlewares.somenteAdmin,
  );

  router.post(
    "/admin/marketing/banners",
    asyncRoute(
      MarketingAdminController.criarBannerInstitucional,
    ),
  );

  router.get(
    "/admin/marketing/condominios",
    asyncRoute(
      MarketingAdminController.listarCondominios,
    ),
  );

  router.post(
    "/admin/marketing/campanhas",
    asyncRoute(
      MarketingAdminController.criarCampanha,
    ),
  );

  router.get(
    "/admin/marketing/campanhas",
    asyncRoute(
      MarketingAdminController.listarCampanhas,
    ),
  );

  router.get(
    "/admin/marketing/campanhas/:id",
    asyncRoute(
      MarketingAdminController.buscarCampanha,
    ),
  );

  router.put(
    "/admin/marketing/campanhas/:id",
    asyncRoute(
      MarketingAdminController.atualizarCampanha,
    ),
  );

  /*
   * Canais omnichannel da campanha.
   */
  router.put(
    "/admin/marketing/campanhas/:id/canais",
    asyncRoute(
      MarketingAdminController.configurarCanais,
    ),
  );

  router.get(
    "/admin/marketing/campanhas/:id/canais",
    asyncRoute(
      MarketingAdminController.listarCanais,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/canais/:canal/executar",
    asyncRoute(
      MarketingAdminController.executarCanal,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/canais/:canal/cancelar",
    asyncRoute(
      MarketingAdminController.cancelarCanal,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/contratar",
    asyncRoute(
      MarketingAdminController.solicitarContratacao,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/confirmar-pagamento",
    asyncRoute(
      MarketingAdminController.confirmarPagamento,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/aprovar",
    asyncRoute(
      MarketingAdminController.aprovarCampanha,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/agendar",
    asyncRoute(
      MarketingAdminController.agendarCampanha,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/cancelar",
    asyncRoute(
      MarketingAdminController.cancelarCampanha,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/gerar-fila",
    asyncRoute(
      MarketingAdminController.gerarFila,
    ),
  );

  router.post(
    "/admin/marketing/campanhas/:id/recalcular",
    asyncRoute(
      MarketingAdminController.recalcularTotais,
    ),
  );

  router.post(
    "/admin/marketing/processar-fila",
    asyncRoute(
      MarketingAdminController.processarFila,
    ),
  );

  router.post(
    "/admin/marketing/executar-ciclo",
    asyncRoute(
      MarketingAdminController.executarCiclo,
    ),
  );

  router.post(
    "/admin/marketing/testar-envio",
    asyncRoute(
      MarketingAdminController.testarEnvio,
    ),
  );

  router.post(
    "/admin/marketing/leads",
    asyncRoute(
      MarketingAdminController.capturarLead,
    ),
  );

  router.get(
    "/admin/marketing/leads",
    asyncRoute(
      MarketingAdminController.listarLeads,
    ),
  );


  router.get(
    "/admin/marketing/condominios",
    asyncRoute(
      MarketingAdminController.listarCondominios,
    ),
  );

  router.get(
    "/admin/marketing/prestadores",
    asyncRoute(
      MarketingAdminController.listarPrestadores,
    ),
  );

  router.get(
    "/admin/marketing/lojas",
    asyncRoute(
      MarketingAdminController.listarLojas,
    ),
  );

  router.post(
    "/admin/marketing/campanhas",
    asyncRoute(
      MarketingAdminController.criarCampanha,
    ),
  );

  return router;
}

export default criarMarketingRouter;