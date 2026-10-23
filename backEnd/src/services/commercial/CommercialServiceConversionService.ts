import { AppDataSource } from "../../config/data-source";

import {
  BusinessCatalogItem,
  BusinessCatalogItemType,
} from "../../models/BusinessCatalogItemModel";

import {
  CommercialFlow,
  CommercialFlowSourceType,
  CommercialFlowState,
} from "../../models/CommercialFlowModel";

import { ServicoOferta } from "../../models/servicoOfertaModels";

import MarketingOpportunityConversionService from "../MarketingOpportunityConversionService";
import ServicoOfertaService from "../ServicoOfertaService";

import CommercialFlowStateService from "./CommercialFlowStateService";

export type CommercialServiceConversionInput = {
  flowId: string;

  /**
   * Origem da conversão.
   */
  origem?:
    | "WHATSAPP"
    | "INSTAGRAM"
    | "FACEBOOK"
    | "LANDING_PAGE"
    | "CHAT_HOME"
    | "OUTRO";

  metadata?: Record<string, unknown>;
};

export type CommercialServiceConversionResult = {
  status: "OFFER_READY";

  flow: CommercialFlow;

  solicitacaoId: string;

  candidaturaId: string;

  ofertaId: string;

  amount: number;

  totalSessions: number;

  createdSolicitacao: boolean;

  createdCandidatura: boolean;

  createdOferta: boolean;
};

/**
 * ================================================================
 * COMMERCIAL SERVICE CONVERSION SERVICE
 * ================================================================
 *
 * Responsabilidade:
 *
 * CommercialFlow
 *      ↓
 * MarketingOpportunity
 *      ↓
 * ServicoSolicitacao DIRECIONADA
 *      ↓
 * ServicoCandidatura
 *      ↓
 * ServicoOferta
 *
 * Ainda NÃO:
 *
 * - cria checkout;
 * - confirma pagamento;
 * - cria agenda.
 *
 * Isso será responsabilidade das próximas etapas.
 */
export class CommercialServiceConversionService {
  constructor(
    private readonly flowState =
      new CommercialFlowStateService(),

    private readonly opportunityConversion =
      new MarketingOpportunityConversionService(),
  ) {}

  private get catalogRepository() {
    return AppDataSource.getRepository(
      BusinessCatalogItem,
    );
  }

  private get ofertaRepository() {
    return AppDataSource.getRepository(
      ServicoOferta,
    );
  }

  /**
   * ================================================================
   * CONVERTER
   * ================================================================
   */
  async convert(
    input: CommercialServiceConversionInput,
  ): Promise<CommercialServiceConversionResult> {
    const flowId =
      String(
        input.flowId || "",
      ).trim();

    if (!flowId) {
      throw new Error(
        "COMMERCIAL_SERVICE_FLOW_ID_OBRIGATORIO",
      );
    }

    let flow =
      await this.flowState.findById(
        flowId,
      );

    if (!flow) {
      throw new Error(
        "COMMERCIAL_FLOW_NAO_ENCONTRADO",
      );
    }

    try {
      /**
       * ============================================================
       * 1. VALIDA O FLUXO
       * ============================================================
       */
      this.validateFlow(
        flow,
      );

      /**
       * ============================================================
       * 2. ITEM OFICIAL DO CATÁLOGO
       * ============================================================
       *
       * Preço, sessões e prestador sempre vêm do banco.
       * Nunca da IA.
       */
      const catalogItem =
        await this.loadCatalogItem(
          flow.catalogItemId!,
          flow.storeId,
        );

      if (
        catalogItem.tipo !==
          BusinessCatalogItemType.SERVICO &&
        catalogItem.tipo !==
          BusinessCatalogItemType.PACOTE
      ) {
        throw new Error(
          "COMMERCIAL_SERVICE_ITEM_NAO_E_SERVICO_OU_PACOTE",
        );
      }

      const prestadorUsuarioId =
        String(
          catalogItem.ownerUserId ||
          "",
        ).trim();

      if (!prestadorUsuarioId) {
        throw new Error(
          "COMMERCIAL_SERVICE_PRESTADOR_NAO_IDENTIFICADO",
        );
      }

      /**
       * Valor já foi congelado no CommercialFlow no momento
       * em que o item foi selecionado.
       *
       * Isso é importante porque o preço do catálogo pode
       * mudar depois.
       */
      const amount =
        Number(
          flow.amount,
        );

      if (
        !Number.isFinite(
          amount,
        ) ||
        amount < 0
      ) {
        throw new Error(
          "COMMERCIAL_SERVICE_VALOR_INVALIDO",
        );
      }

      const totalSessions =
        Math.max(
          1,
          Number(
            flow.totalSessions ||
            catalogItem.totalSessoes ||
            1,
          ),
        );

      console.log(
        "[COMMERCIAL SERVICE] Iniciando conversão",
        {
          flowId:
            flow.id,

          opportunityId:
            flow.opportunityId,

          customerUserId:
            flow.customerUserId,

          storeId:
            flow.storeId,

          catalogItemId:
            catalogItem.id,

          catalogItemName:
            catalogItem.nome,

          prestadorUsuarioId,

          amount,

          totalSessions,
        },
      );

      /**
       * ============================================================
       * 3. SOLICITAÇÃO + CANDIDATURA
       * ============================================================
       *
       * Usamos ensureCommercialFlow() diretamente porque
       * neste ponto já temos customerUserId real.
       *
       * Não precisamos mais pedir ao
       * prepareFromOpportunity() para descobrir se o cliente
       * possui cadastro.
       */
      const commercial =
        await this.opportunityConversion
          .ensureCommercialFlow({
            opportunityId:
              flow.opportunityId!,

            usuarioId:
              flow.customerUserId!,

            prestadorUsuarioId,

            titulo:
              `Atendimento - ${catalogItem.nome}`,

            descricao:
              this.buildDescription(
                flow,
                catalogItem,
              ),

            valorSugerido:
              amount,

            totalSessoes:
              totalSessions,

            origem:
              input.origem ||
              "OUTRO",

            metadata: {
              commercialFlowId:
                flow.id,

              conversationId:
                flow.conversationId,

              storeId:
                flow.storeId,

              catalogItemId:
                catalogItem.id,

              catalogItemName:
                catalogItem.nome,

              preferredDate:
                flow.preferredDate,

              preferredTime:
                flow.preferredTime,

              ...input.metadata,
            },
          });

      /**
       * Agora temos IDs reais.
       */
      flow =
        await this.flowState
          .setServiceReferences(
            flow.id,
            {
              solicitacaoId:
                commercial
                  .solicitacao
                  .id,

              candidaturaId:
                commercial
                  .candidatura
                  .id,
            },
          );

      // O fluxo comercial conhece a quantidade oficial de sessões do catálogo.
      // ensureCommercialFlow pode reutilizar uma candidatura antiga/criada por outro caminho
      // com o default 1. Antes de gerar a oferta, sincronizamos fisicamente a candidatura.
      const candidaturaTotalAtual = Number(
        (commercial.candidatura as any).total_sessoes ??
        (commercial.candidatura as any).totalSessoes ??
        1,
      );

      if (candidaturaTotalAtual !== totalSessions) {
        await AppDataSource
          .getRepository((commercial.candidatura as any).constructor)
          .update(commercial.candidatura.id, {
            total_sessoes: totalSessions,
          } as any);

        (commercial.candidatura as any).total_sessoes = totalSessions;

        console.log(
          "[COMMERCIAL SERVICE] Total de sessões sincronizado na candidatura",
          {
            candidaturaId: commercial.candidatura.id,
            anterior: candidaturaTotalAtual,
            totalSessions,
          },
        );
      }

      console.log(
        "[COMMERCIAL SERVICE] Solicitação/candidatura prontas",
        {
          flowId:
            flow.id,

          solicitacaoId:
            commercial
              .solicitacao
              .id,

          candidaturaId:
            commercial
              .candidatura
              .id,

          createdSolicitacao:
            commercial
              .createdSolicitacao,

          createdCandidatura:
            commercial
              .createdCandidatura,
        },
      );

      /**
       * ============================================================
       * 4. OFERTA
       * ============================================================
       *
       * Antes de criar, procuramos uma oferta já existente.
       *
       * Isso é essencial porque uma mensagem pode ser processada
       * novamente, o usuário pode atualizar a página ou o webhook
       * pode disparar repetidamente.
       */
      let oferta =
        await this.findExistingOffer({
          solicitacaoId:
            commercial
              .solicitacao
              .id,

          prestadorId:
            prestadorUsuarioId,

          customerUserId:
            flow.customerUserId!,
        });

      let createdOferta =
        false;

      if (!oferta) {
        oferta =
          await ServicoOfertaService
            .criarOfertaPorCandidatura(
              commercial
                .candidatura
                .id,

              flow.customerUserId!,

              amount,
            );

        createdOferta =
          true;
      }

      if (!oferta?.id) {
        throw new Error(
          "COMMERCIAL_SERVICE_OFERTA_NAO_FOI_CRIADA",
        );
      }

      /**
       * ============================================================
       * 5. SALVA OFERTA NO COMMERCIAL FLOW
       * ============================================================
       */
      flow =
        await this.flowState
          .setServiceReferences(
            flow.id,
            {
              solicitacaoId:
                commercial
                  .solicitacao
                  .id,

              candidaturaId:
                commercial
                  .candidatura
                  .id,

              ofertaId:
                oferta.id,
            },
          );

      /**
       * Garantimos explicitamente a origem transacional.
       */
      flow =
        await this.flowState.update(
          flow.id,
          {
            sourceType:
              CommercialFlowSourceType
                .SERVICE_OFFER,

            sourceId:
              oferta.id,

            state:
              CommercialFlowState
                .OFERTA_CRIADA,

            metadata: {
              serviceConversionCompletedAt:
                new Date()
                  .toISOString(),

              createdSolicitacao:
                commercial
                  .createdSolicitacao,

              createdCandidatura:
                commercial
                  .createdCandidatura,

              createdOferta,
            },
          },
        );

      console.log(
        "[COMMERCIAL SERVICE] Oferta pronta",
        {
          flowId:
            flow.id,

          solicitacaoId:
            flow.solicitacaoId,

          candidaturaId:
            flow.candidaturaId,

          ofertaId:
            flow.ofertaId,

          amount,

          totalSessions,

          createdOferta,
        },
      );

      return {
        status:
          "OFFER_READY",

        flow,

        solicitacaoId:
          commercial
            .solicitacao
            .id,

        candidaturaId:
          commercial
            .candidatura
            .id,

        ofertaId:
          oferta.id,

        amount,

        totalSessions,

        createdSolicitacao:
          commercial
            .createdSolicitacao,

        createdCandidatura:
          commercial
            .createdCandidatura,

        createdOferta,
      };
    } catch (error) {
      await this.flowState
        .markError(
          flow.id,
          error,
        );

      console.error(
        "[COMMERCIAL SERVICE] Erro na conversão",
        {
          flowId:
            flow.id,

          error:
            error instanceof Error
              ? error.message
              : error,
        },
      );

      throw error;
    }
  }

  /**
   * ================================================================
   * VALIDAR FLUXO
   * ================================================================
   */
  private validateFlow(
    flow: CommercialFlow,
  ): void {
    if (!flow.ativo) {
      throw new Error(
        "COMMERCIAL_SERVICE_FLOW_INATIVO",
      );
    }

    if (!flow.opportunityId) {
      throw new Error(
        "COMMERCIAL_SERVICE_OPORTUNIDADE_OBRIGATORIA",
      );
    }

    if (!flow.customerUserId) {
      throw new Error(
        "COMMERCIAL_SERVICE_CLIENTE_NAO_IDENTIFICADO",
      );
    }

    if (!flow.catalogItemId) {
      throw new Error(
        "COMMERCIAL_SERVICE_ITEM_NAO_SELECIONADO",
      );
    }

    /**
     * Para serviço com agenda:
     *
     * só deixamos avançar depois que a disponibilidade
     * tiver sido realmente validada.
     *
     * PACOTES e tipos especiais poderão ganhar regras
     * adicionais posteriormente.
     */
    if (
      !flow.preferredDate ||
      !flow.preferredTime
    ) {
      throw new Error(
        "COMMERCIAL_SERVICE_DATA_HORARIO_NAO_DEFINIDOS",
      );
    }

    /**
     * HORARIO_DISPONIVEL normalmente muda depois para
     * CLIENTE_IDENTIFICADO quando cadastro/login termina.
     *
     * Por isso validamos a marca persistida da consulta.
     */
    const metadata =
      flow.metadata &&
      typeof flow.metadata ===
        "object"
        ? flow.metadata
        : {};

    const availabilityConfirmed =
      (
        metadata as Record<
          string,
          unknown
        >
      ).availabilityConfirmed ===
        true;

    if (!availabilityConfirmed) {
      throw new Error(
        "COMMERCIAL_SERVICE_HORARIO_NAO_VALIDADO",
      );
    }
  }

  /**
   * ================================================================
   * CARREGAR ITEM OFICIAL
   * ================================================================
   */
  private async loadCatalogItem(
    catalogItemId: string,
    storeId: string,
  ): Promise<BusinessCatalogItem> {
    const item =
      await this.catalogRepository
        .findOne({
          where: {
            id:
              catalogItemId,

            storeId,

            ativo:
              true,
          },
        });

    if (!item) {
      throw new Error(
        "COMMERCIAL_SERVICE_ITEM_CATALOGO_NAO_ENCONTRADO",
      );
    }

    return item;
  }

  /**
   * ================================================================
   * LOCALIZAR OFERTA EXISTENTE
   * ================================================================
   *
   * ServicoOfertaService.criarOfertaPorCandidatura()
   * não possui idempotência própria.
   *
   * Então fazemos essa proteção antes de chamá-lo.
   */
  private async findExistingOffer(
    input: {
      solicitacaoId: string;

      prestadorId: string;

      customerUserId: string;
    },
  ): Promise<ServicoOferta | null> {
    return this.ofertaRepository
      .findOne({
        where: {
          solicitacaoId:
            input.solicitacaoId,

          prestadorId:
            input.prestadorId,

          usuarioId:
            input.customerUserId,
        } as any,

        order: {
          createdAt:
            "DESC",
        } as any,
      });
  }

  /**
   * ================================================================
   * DESCRIÇÃO DA SOLICITAÇÃO
   * ================================================================
   */
  private buildDescription(
    flow: CommercialFlow,
    item: BusinessCatalogItem,
  ): string {
    const lines: string[] = [
      "Solicitação criada pelo Motor Comercial do GranConecta.",
      `Item: ${item.nome}.`,
    ];

    if (item.descricao) {
      lines.push(
        `Descrição: ${item.descricao}`,
      );
    }

    if (flow.preferredDate) {
      lines.push(
        `Data pretendida: ${flow.preferredDate}.`,
      );
    }

    if (flow.preferredTime) {
      lines.push(
        `Horário pretendido: ${flow.preferredTime}.`,
      );
    }

    if (
      flow.totalSessions &&
      flow.totalSessions > 1
    ) {
      lines.push(
        `Quantidade de sessões: ${flow.totalSessions}.`,
      );
    }

    lines.push(
      `CommercialFlow: ${flow.id}.`,
    );

    return lines.join(
      "\n",
    );
  }
}

export default CommercialServiceConversionService;