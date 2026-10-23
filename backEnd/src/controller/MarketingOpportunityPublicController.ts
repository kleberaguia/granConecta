import {
  Request,
  Response,
} from "express";

import MarketingOpportunityService from "../services/MarketingOpportunityService";
import MarketingOpportunityConversionService from "../services/MarketingOpportunityConversionService";

const opportunityService =
  new MarketingOpportunityService();

const opportunityConversionService =
  new MarketingOpportunityConversionService();

export class MarketingOpportunityPublicController {
  static async resolver(
    request: Request,
    response: Response,
  ) {
    const token =
      String(
        request.params.token ||
        "",
      ).trim();

    const slug =
      String(
        request.query.slug ||
        "",
      ).trim();

    if (!token) {
      return response.status(400).json({
        success: false,
        message:
          "Token da oportunidade não informado.",
      });
    }

    if (!slug) {
      return response.status(400).json({
        success: false,
        message:
          "Slug do negócio não informado.",
      });
    }

    try {
      const result =
        await opportunityService
          .resolveByToken(
            token,
            slug,
          );

      await opportunityService
        .markBusinessAccessed(
          result.opportunity.id,
        );

      return response.json({
        success: true,

        opportunityId:
          result.opportunity.id,

        store: {
          id:
            result.opportunity
              .selected_store_id,

          name:
            result.opportunity
              .selected_store_name,

          slug:
            result.opportunity
              .selected_store_slug,

          chatbotTipo:
            result.opportunity
              .selected_chatbot_tipo,
        },

        campaign: {
          id:
            result.opportunity
              .campanha_id,

          categoriaId:
            result.opportunity
              .categoria_id,

          playbookId:
            result.opportunity
              .playbook_id,
        },

        status:
          result.opportunity.status,

        score:
          result.opportunity.score,
      });
    } catch (error: any) {
      console.error(
        "[MARKETING OPPORTUNITY PUBLIC] Falha ao resolver oportunidade",
        {
          slug,
          erro:
            error?.message ||
            String(error),
        },
      );

      const message =
        error?.message ||
        "Não foi possível validar esta oportunidade.";

      const normalized =
        String(message)
          .toLowerCase();

      const statusCode =
        normalized.includes("expir")
          ? 410
          : normalized.includes("não pertence") ||
            normalized.includes("nao pertence")
            ? 403
            : 404;

      return response.status(
        statusCode,
      ).json({
        success: false,
        message,
      });
    }
  }
  /**
   * Identifica o cliente da oportunidade sem autenticar automaticamente
   * uma conta apenas porque o e-mail existe.
   *
   * POST /marketing/opportunities/public/:token/identify-customer
   * Body:
   * {
   *   slug,
   *   nome,
   *   email,
   *   telefone?
   * }
   *
   * authenticatedUserId NÃO é aceito do body.
   * Quando integrarmos a rota autenticada, ele deverá vir exclusivamente
   * da sessão/JWT validado pelo middleware.
   */
  static async identifyCustomer(
    request: Request,
    response: Response,
  ) {
    const token =
      String(
        request.params.token || "",
      ).trim();

    const slug =
      String(
        request.body?.slug ||
        request.query.slug ||
        "",
      ).trim();

    const nome =
      String(
        request.body?.nome || "",
      )
        .trim()
        .replace(/\s+/g, " ");

    const email =
      String(
        request.body?.email || "",
      )
        .trim()
        .toLowerCase();

    const telefone =
      request.body?.telefone !== undefined &&
        request.body?.telefone !== null
        ? String(
          request.body.telefone,
        ).trim()
        : null;

    if (!token) {
      return response.status(400).json({
        success: false,
        message:
          "Token da oportunidade não informado.",
      });
    }

    if (!slug) {
      return response.status(400).json({
        success: false,
        message:
          "Slug do negócio não informado.",
      });
    }

    if (!nome) {
      return response.status(400).json({
        success: false,
        message:
          "Nome do cliente é obrigatório.",
      });
    }

    if (!email) {
      return response.status(400).json({
        success: false,
        message:
          "E-mail do cliente é obrigatório.",
      });
    }

    try {
      const result =
        await opportunityService
          .identifyCustomer({
            token,
            storeSlug: slug,
            nome,
            email,
            telefone,

            /*
             * Importante:
             * esta é uma rota pública.
             * Não vinculamos user_id por informação recebida do body.
             */
            authenticatedUserId: null,
          });

      return response.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error(
        "[MARKETING OPPORTUNITY PUBLIC] Falha ao identificar cliente",
        {
          slug,
          email,
          erro:
            error?.message ||
            String(error),
        },
      );

      const message =
        error?.message ||
        "Não foi possível identificar o cliente desta oportunidade.";

      const normalized =
        String(message)
          .toLowerCase();

      const statusCode =
        normalized.includes("expir")
          ? 410
          : normalized.includes(
            "não pertence",
          ) ||
            normalized.includes(
              "nao pertence",
            )
            ? 403
            : normalized.includes(
              "obrigatório",
            ) ||
              normalized.includes(
                "obrigatorio",
              ) ||
              normalized.includes(
                "inválido",
              ) ||
              normalized.includes(
                "invalido",
              )
              ? 400
              : 404;

      return response
        .status(statusCode)
        .json({
          success: false,
          message,
        });
    }
  }


  /**
   * ============================================================
   * VINCULAR CLIENTE AUTENTICADO À OPORTUNIDADE
   * ============================================================
   *
   * POST /marketing/opportunities/public/:token/attach-authenticated-customer
   *
   * Responsabilidade desta rota:
   * - validar o usuário autenticado pelo middleware/JWT;
   * - validar token + slug da oportunidade;
   * - conferir que o e-mail informado corresponde ao usuário autenticado;
   * - vincular opportunity.user_id ao usuário autenticado.
   *
   * IMPORTANTE:
   * - NÃO cria solicitação;
   * - NÃO cria candidatura;
   * - NÃO aceita proposta;
   * - NÃO cria oferta;
   * - NÃO cria pagamento;
   * - NÃO agenda.
   *
   * Depois desta vinculação, o CommercialConversionOrchestrator retoma
   * a MESMA conversationId/CommercialFlow pelo GranConectaChatService.
   */
  static async attachAuthenticatedCustomer(
    request: Request,
    response: Response,
  ) {
    const token = String(
      request.params.token || "",
    ).trim();

    const slug = String(
      request.body?.slug ||
      request.query.slug ||
      "",
    ).trim();

    const nome = String(
      request.body?.nome || "",
    )
      .trim()
      .replace(/\s+/g, " " );

    const email = String(
      request.body?.email || "",
    )
      .trim()
      .toLowerCase();

    const telefone =
      request.body?.telefone !== undefined &&
      request.body?.telefone !== null
        ? String(
            request.body.telefone,
          ).trim()
        : null;

    const authenticatedUser =
      (request as any).user;

    const authenticatedUserId =
      String(
        authenticatedUser?.usuarioId ||
        authenticatedUser?.id ||
        "",
      ).trim();

    if (!authenticatedUserId) {
      return response.status(401).json({
        success: false,
        message:
          "Usuário não autenticado.",
      });
    }

    if (!token) {
      return response.status(400).json({
        success: false,
        message:
          "Token da oportunidade não informado.",
      });
    }

    if (!slug) {
      return response.status(400).json({
        success: false,
        message:
          "Slug do negócio não informado.",
      });
    }

    if (!nome) {
      return response.status(400).json({
        success: false,
        message:
          "Nome do cliente é obrigatório.",
      });
    }

    if (!email) {
      return response.status(400).json({
        success: false,
        message:
          "E-mail do cliente é obrigatório.",
      });
    }

    try {
      const result =
        await opportunityService
          .identifyCustomer({
            token,
            storeSlug: slug,
            nome,
            email,
            telefone,

            /**
             * O ID vem exclusivamente do middleware autenticado.
             * Nunca aceitamos userId enviado livremente pelo body.
             */
            authenticatedUserId,
          });

      if (
        result.status !==
        "IDENTIFIED"
      ) {
        return response.status(409).json({
          success: false,
          message:
            "Não foi possível vincular o usuário autenticado à oportunidade.",
          result,
        });
      }

      console.log(
        "[MARKETING OPPORTUNITY AUTH] Cliente autenticado vinculado à oportunidade",
        {
          opportunityId:
            result.opportunityId,
          authenticatedUserId,
          email:
            result.email || null,

          /**
           * Deixamos explícito no log que nenhuma conversão/pagamento
           * é executado por esta rota.
           */
          commercialSideEffects:
            false,
        },
      );

      return response.status(200).json({
        success: true,
        ...result,

        /**
         * Mantemos um pequeno status de compatibilidade para clientes
         * que já liam commercialFlow, mas sem iniciar o fluxo legado.
         */
        commercialFlow: {
          status:
            "CUSTOMER_ATTACHED",
          requiresCommercialResume:
            true,
        },
      });
    } catch (error: any) {
      console.error(
        "[MARKETING OPPORTUNITY AUTH] Falha ao vincular cliente autenticado",
        {
          slug,
          authenticatedUserId,
          erro:
            error?.message ||
            String(error),
        },
      );

      const message =
        error?.message ||
        "Não foi possível vincular o cliente autenticado.";

      const normalized =
        String(message)
          .toLowerCase();

      const statusCode =
        normalized.includes("expir")
          ? 410
          : normalized.includes(
              "não pertence",
            ) ||
            normalized.includes(
              "nao pertence",
            )
            ? 403
            : normalized.includes(
                "não corresponde",
              ) ||
              normalized.includes(
                "nao corresponde",
              )
              ? 403
              : normalized.includes(
                  "não autenticado",
                ) ||
                normalized.includes(
                  "nao autenticado",
                )
                ? 401
                : normalized.includes(
                    "não encontrado",
                  ) ||
                  normalized.includes(
                    "nao encontrado",
                  )
                  ? 404
                  : 400;

      return response
        .status(statusCode)
        .json({
          success: false,
          message,
        });
    }
  }

  /**
   * ============================================================
   * PREPARAR FLUXO COMERCIAL AUTENTICADO
   * ============================================================
   *
   * POST /marketing/opportunities/:opportunityId/prepare-commercial-flow
   *
   * Segurança:
   * - exige usuário autenticado;
   * - a oportunidade precisa pertencer ao usuário autenticado;
   * - não cria pagamento;
   * - não confirma agenda;
   * - reaproveita solicitação/candidatura existentes quando já criadas.
   */
  static async prepareCommercialFlow(
    request: Request,
    response: Response,
  ) {
    const authenticatedUser =
      (request as any).user;

    const authenticatedUserId =
      String(
        authenticatedUser?.usuarioId ||
          authenticatedUser?.id ||
          "",
      ).trim();

    const opportunityId =
      String(
        request.params.opportunityId ||
          request.params.id ||
          "",
      ).trim();

    if (!authenticatedUserId) {
      return response.status(401).json({
        success: false,
        message:
          "Usuário não autenticado.",
      });
    }

    if (!opportunityId) {
      return response.status(400).json({
        success: false,
        message:
          "ID da oportunidade não informado.",
      });
    }

    try {
      const opportunity =
        await opportunityService.findById(
          opportunityId,
        );

      if (!opportunity) {
        return response.status(404).json({
          success: false,
          message:
            "Oportunidade não encontrada.",
        });
      }

      const opportunityUserId =
        String(
          opportunity.user_id || "",
        ).trim();

      if (!opportunityUserId) {
        return response.status(409).json({
          success: false,
          message:
            "A oportunidade ainda não está vinculada a um usuário autenticado.",
          code:
            "OPPORTUNITY_CUSTOMER_NOT_ATTACHED",
        });
      }

      if (
        opportunityUserId !==
        authenticatedUserId
      ) {
        return response.status(403).json({
          success: false,
          message:
            "Você não tem permissão para preparar o fluxo comercial desta oportunidade.",
        });
      }

      const result =
        await opportunityConversionService
          .prepareFromOpportunity(
            opportunityId,
            {
              metadata: {
                preparedBy:
                  "AUTHENTICATED_CUSTOMER",

                authenticatedUserId,

                preparedAt:
                  new Date().toISOString(),
              },
            },
          );

      if (
        result.status ===
        "REQUIRES_REGISTRATION"
      ) {
        return response.status(409).json({
          success: false,
          status:
            result.status,
          requiresRegistration:
            true,
          reason:
            result.reason,
          opportunityId:
            result.opportunity.id,
          suggestedData:
            result.suggestedData,
        });
      }

      const {
        opportunity:
          commercialOpportunity,
        solicitacao,
        candidatura,
        createdSolicitacao,
        createdCandidatura,
      } = result.result;

      console.log(
        "[MARKETING OPPORTUNITY AUTH] Fluxo comercial preparado",
        {
          opportunityId:
            commercialOpportunity.id,

          authenticatedUserId,

          solicitacaoId:
            solicitacao.id,

          candidaturaId:
            candidatura.id,

          createdSolicitacao,
          createdCandidatura,

          catalogItemId:
            commercialOpportunity
              .catalog_item_id,

          catalogItemType:
            commercialOpportunity
              .catalog_item_type,
        },
      );

      return response.status(200).json({
        success: true,
        status: "READY",

        opportunityId:
          commercialOpportunity.id,

        catalogItem: {
          id:
            commercialOpportunity
              .catalog_item_id,

          name:
            commercialOpportunity
              .catalog_item_name,

          type:
            commercialOpportunity
              .catalog_item_type,

          price:
            commercialOpportunity
              .catalog_item_promotional_price ??
            commercialOpportunity
              .catalog_item_price,

          sessions:
            commercialOpportunity
              .catalog_item_sessions,

          durationMinutes:
            commercialOpportunity
              .catalog_item_duration_minutes,

          modality:
            commercialOpportunity
              .catalog_item_modality,
        },

        solicitacaoId:
          solicitacao.id,

        candidaturaId:
          candidatura.id,

        createdSolicitacao,
        createdCandidatura,
      });
    } catch (error: any) {
      console.error(
        "[MARKETING OPPORTUNITY AUTH] Falha ao preparar fluxo comercial",
        {
          opportunityId,
          authenticatedUserId,
          erro:
            error?.message ||
            String(error),
        },
      );

      const message =
        error?.message ||
        "Não foi possível preparar o fluxo comercial da oportunidade.";

      const normalized =
        String(message)
          .toLowerCase();

      const statusCode =
        normalized.includes(
          "nao_encontrada",
        ) ||
        normalized.includes(
          "não encontrada",
        )
          ? 404
          : normalized.includes(
                "sem_item_catalogo",
              ) ||
              normalized.includes(
                "sem_negocio_selecionado",
              ) ||
              normalized.includes(
                "sem_categoria",
              ) ||
              normalized.includes(
                "sem_usuario_responsavel",
              )
            ? 409
            : normalized.includes(
                  "sem_cadastro",
                )
              ? 409
              : 400;

      return response
        .status(statusCode)
        .json({
          success: false,
          message,
        });
    }
  }

}

export default MarketingOpportunityPublicController;