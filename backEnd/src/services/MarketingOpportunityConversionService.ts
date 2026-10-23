import { AppDataSource } from "../config/data-source";

import MarketingOpportunity, {
  MarketingOpportunityStatus,
} from "../models/MarketingOpportunityModel";

import { ServicoSolicitacao } from "../models/servicoSolicitacaoModels";
import { ServicoCandidatura } from "../models/servicoCandidatura";
import { Store } from "../models/StoreModels";

import { ServicoSolicitacaoService } from "./ServicoSolicitacaoService";
import ServicoCandidaturaService from "./ServicoCandidaturaService";

export type ConversionOrigin =
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LANDING_PAGE"
  | "CHAT_HOME"
  | "OUTRO";

export type EnsureCommercialFlowInput = {
  opportunityId: string;

  /**
   * Usuário GranConecta quando já existe cadastro.
   * Para visitante externo, deixe null/undefined por enquanto.
   */
  usuarioId?: string | null;

  /**
   * ID do usuário PRESTADOR dono do perfil escolhido.
   * selected_store_id é o ID da Store e não necessariamente usuarioId.
   */
  prestadorUsuarioId: string;

  /**
   * Estes campos continuam disponíveis para compatibilidade,
   * porém o catálogo é a fonte comercial principal.
   */
  titulo?: string;
  descricao?: string;

  valorSugerido?: number;
  totalSessoes?: number;

  origem?: ConversionOrigin;

  /**
   * Dados extras que ajudam a rastrear o funil sem perder contexto.
   */
  metadata?: Record<string, unknown>;
};

export type EnsureCommercialFlowResult = {
  opportunity: MarketingOpportunity;
  solicitacao: ServicoSolicitacao;
  candidatura: ServicoCandidatura;
  createdSolicitacao: boolean;
  createdCandidatura: boolean;
};

export type PrepareCommercialFlowResult =
  | {
      status: "READY";
      result: EnsureCommercialFlowResult;
      requiresRegistration: false;
    }
  | {
      status: "REQUIRES_REGISTRATION";
      opportunity: MarketingOpportunity;
      requiresRegistration: true;
      reason: "CLIENTE_SEM_CADASTRO_GRANCONECTA";
      suggestedData: {
        telefone?: string | null;
        nome?: string | null;
        canalOrigem?: string | null;
      };
    };

/**
 * Ponte entre MarketingOpportunity e o motor comercial já existente:
 *
 * MarketingOpportunity
 *   -> Item do catálogo
 *   -> ServicoSolicitacao DIRECIONADA
 *   -> ServicoCandidatura
 *   -> servico_negociacao / oferta / pagamento / agenda
 *
 * Regras:
 *
 * - NÃO cria pagamento aqui.
 * - NÃO aceita proposta automaticamente.
 * - NÃO agenda nada automaticamente.
 * - NÃO duplica solicitação/candidatura.
 * - catálogo é a fonte oficial de preço/sessões.
 * - preserva os services existentes.
 */
export class MarketingOpportunityConversionService {
  private get opportunityRepo() {
    return AppDataSource.getRepository(MarketingOpportunity);
  }

  private get solicitacaoRepo() {
    return AppDataSource.getRepository(ServicoSolicitacao);
  }

  private get candidaturaRepo() {
    return AppDataSource.getRepository(ServicoCandidatura);
  }

  private get storeRepo() {
    return AppDataSource.getRepository(Store);
  }

  /**
   * ============================================================
   * PREPARAR FLUXO COMERCIAL A PARTIR DA OPORTUNIDADE
   * ============================================================
   *
   * Resolve automaticamente:
   *
   * - Store escolhida;
   * - usuário PRESTADOR dono da Store;
   * - usuário GranConecta do cliente;
   * - necessidade de cadastro rápido;
   * - item de catálogo escolhido;
   * - preço real;
   * - quantidade real de sessões.
   *
   * Não cria usuário automaticamente.
   */
  async prepareFromOpportunity(
    opportunityId: string,
    options?: {
      titulo?: string;
      descricao?: string;
      valorSugerido?: number;
      totalSessoes?: number;
      origem?: ConversionOrigin;
      metadata?: Record<string, unknown>;
    },
  ): Promise<PrepareCommercialFlowResult> {
    const id = String(opportunityId || "").trim();

    if (!id) {
      throw new Error("opportunityId é obrigatório.");
    }

    const opportunity = await this.opportunityRepo.findOne({
      where: {
        id,
      },
    });

    if (!opportunity) {
      throw new Error("OPORTUNIDADE_NAO_ENCONTRADA");
    }

    if (!opportunity.selected_store_id) {
      throw new Error("OPORTUNIDADE_SEM_NEGOCIO_SELECIONADO");
    }

    /**
     * A partir deste ponto o catálogo passa a ser obrigatório.
     *
     * Não permitimos criar solicitação comercial baseada apenas
     * em texto gerado pela IA.
     */
    if (!opportunity.catalog_item_id) {
      throw new Error("OPORTUNIDADE_SEM_ITEM_CATALOGO");
    }

    const store = await this.storeRepo.findOne({
      where: {
        id: opportunity.selected_store_id,
      },
    });

    if (!store) {
      throw new Error("STORE_DA_OPORTUNIDADE_NAO_ENCONTRADA");
    }

    const prestadorUsuarioId = String(
      (store as any).usuarioId ||
        (store as any).userId ||
        "",
    ).trim();

    if (!prestadorUsuarioId) {
      throw new Error("STORE_SEM_USUARIO_RESPONSAVEL");
    }

    const usuarioId = this.resolveRegisteredUserId(
      opportunity.user_id,
    );

    /**
     * Visitante externo:
     *
     * ainda não entra no motor legado porque ServicoSolicitacao
     * exige usuarioId GranConecta.
     */
    if (!usuarioId) {
      return {
        status: "REQUIRES_REGISTRATION",
        opportunity,
        requiresRegistration: true,
        reason: "CLIENTE_SEM_CADASTRO_GRANCONECTA",
        suggestedData: {
          telefone: this.extractPhoneFromExternalUserId(
            opportunity.user_id,
          ),
          nome: null,
          canalOrigem:
            opportunity.canal_origem || null,
        },
      };
    }

    /**
     * ============================================================
     * FONTE COMERCIAL OFICIAL
     * ============================================================
     *
     * O valor e a quantidade de sessões vêm da oportunidade,
     * que contém o snapshot do BusinessCatalogItem selecionado.
     */

    const valorCatalogo =
      this.resolveCatalogPrice(opportunity);

    const totalSessoesCatalogo =
      this.resolveCatalogSessions(opportunity);

    const result = await this.ensureCommercialFlow({
      opportunityId: opportunity.id,
      usuarioId,
      prestadorUsuarioId,

      titulo: options?.titulo,
      descricao: options?.descricao,

      /**
       * Catálogo sempre tem prioridade.
       *
       * options continuam somente para compatibilidade.
       */
      valorSugerido:
        valorCatalogo ??
        options?.valorSugerido,

      totalSessoes:
        totalSessoesCatalogo ??
        options?.totalSessoes,

      origem:
        options?.origem ||
        (opportunity.canal_origem as ConversionOrigin | null) ||
        "OUTRO",

      metadata: options?.metadata,
    });

    return {
      status: "READY",
      result,
      requiresRegistration: false,
    };
  }

  /**
   * ============================================================
   * GARANTIR SOLICITAÇÃO + CANDIDATURA
   * ============================================================
   */
  async ensureCommercialFlow(
    input: EnsureCommercialFlowInput,
  ): Promise<EnsureCommercialFlowResult> {
    const opportunityId = String(
      input.opportunityId || "",
    ).trim();

    const prestadorUsuarioId = String(
      input.prestadorUsuarioId || "",
    ).trim();

    if (!opportunityId) {
      throw new Error("opportunityId é obrigatório.");
    }

    if (!prestadorUsuarioId) {
      throw new Error("prestadorUsuarioId é obrigatório.");
    }

    const opportunity = await this.opportunityRepo.findOne({
      where: {
        id: opportunityId,
      },
    });

    if (!opportunity) {
      throw new Error("OPORTUNIDADE_NAO_ENCONTRADA");
    }

    if (!opportunity.selected_store_id) {
      throw new Error(
        "OPORTUNIDADE_SEM_NEGOCIO_SELECIONADO",
      );
    }

    if (!opportunity.catalog_item_id) {
      throw new Error(
        "OPORTUNIDADE_SEM_ITEM_CATALOGO",
      );
    }

    if (
      opportunity.status ===
        MarketingOpportunityStatus.PERDIDA ||
      opportunity.status ===
        MarketingOpportunityStatus.EXPIRADA
    ) {
      throw new Error("OPORTUNIDADE_INATIVA");
    }

    /**
     * Motor legado ainda exige usuário cadastrado.
     */
    const usuarioId = String(
      input.usuarioId || "",
    ).trim();

    if (!usuarioId) {
      throw new Error(
        "CLIENTE_SEM_CADASTRO_GRANCONECTA",
      );
    }

    /**
     * ============================================================
     * DADOS COMERCIAIS
     * ============================================================
     */

    const valorCatalogo =
      this.resolveCatalogPrice(opportunity);

    const totalSessoesCatalogo =
      this.resolveCatalogSessions(opportunity);

    if (
      valorCatalogo === null ||
      valorCatalogo === undefined
    ) {
      throw new Error(
        "ITEM_CATALOGO_SEM_PRECO_VALIDO",
      );
    }

    const valorFinal = Number(valorCatalogo);

    if (
      !Number.isFinite(valorFinal) ||
      valorFinal < 0
    ) {
      throw new Error(
        "ITEM_CATALOGO_PRECO_INVALIDO",
      );
    }

    const totalSessoes = Math.max(
      1,
      Number(totalSessoesCatalogo || 1),
    );

    const metadata = this.buildMetadata(
      opportunity,
      {
        ...input,
        valorSugerido: valorFinal,
        totalSessoes,
      },
    );

    /**
     * ============================================================
     * IDEMPOTÊNCIA
     * ============================================================
     *
     * Uma oportunidade não deve criar duas solicitações.
     */
    let solicitacao =
      await this.findSolicitacaoByOpportunityId(
        opportunity.id,
      );

    let createdSolicitacao = false;

    if (!solicitacao) {
      const categoriaId = Number(
        opportunity.categoria_id || 0,
      );

      if (!categoriaId) {
        throw new Error(
          "OPORTUNIDADE_SEM_CATEGORIA",
        );
      }

      const titulo =
        String(input.titulo || "").trim() ||
        this.buildDefaultTitle(opportunity);

      const descricao =
        String(input.descricao || "").trim() ||
        this.buildDefaultDescription(opportunity);

      solicitacao =
        await ServicoSolicitacaoService.criarSolicitacao(
          {
            titulo,
            descricao,
            categoriaId,
            usuarioId,

            condominio_id:
              opportunity.condominio_id ||
              undefined,

            /**
             * Preço real do catálogo.
             */
            valor_sugerido: valorFinal,

            metadata,

            /**
             * Solicitação direcionada ao negócio escolhido.
             */
            prestadorId: prestadorUsuarioId,
          },
        );

      createdSolicitacao = true;

      console.log(
        "[MARKETING OPPORTUNITY CONVERSION] Solicitação direcionada criada",
        {
          opportunityId: opportunity.id,
          catalogItemId:
            opportunity.catalog_item_id,
          catalogItemName:
            opportunity.catalog_item_name,
          valorFinal,
          totalSessoes,
          solicitacaoId: solicitacao.id,
          prestadorUsuarioId,
          usuarioId,
        },
      );
    }

    /**
     * criarSolicitacao() pode já criar candidatura automática.
     *
     * Procuramos primeiro para evitar duplicidade.
     */
    let candidatura =
      await this.candidaturaRepo.findOne({
        where: {
          solicitacaoId: solicitacao.id,
          prestadorId: prestadorUsuarioId,
        },
        order: {
          createdAt: "ASC",
        },
      });

    let createdCandidatura = false;

    if (!candidatura) {
      const candidaturaCriada =
        await ServicoCandidaturaService.candidatar({
          solicitacaoId: solicitacao.id,
          prestadorId: prestadorUsuarioId,

          mensagem:
            "Solicitação originada de oportunidade qualificada do GranConecta.",

          /**
           * Preço real do catálogo.
           */
          proposta_valor: valorFinal,

          /**
           * Quantidade real de sessões.
           */
          totalSessoes,
        });

      /**
       * O service legado pode causar inferência de array
       * por conta das overloads do TypeORM.
       */
      candidatura = (
        Array.isArray(candidaturaCriada)
          ? candidaturaCriada[0] ?? null
          : candidaturaCriada
      ) as ServicoCandidatura | null;

      if (!candidatura) {
        throw new Error(
          "CANDIDATURA_NAO_FOI_CRIADA",
        );
      }

      createdCandidatura = true;

      console.log(
        "[MARKETING OPPORTUNITY CONVERSION] Candidatura criada",
        {
          opportunityId: opportunity.id,
          catalogItemId:
            opportunity.catalog_item_id,
          catalogItemName:
            opportunity.catalog_item_name,
          valorFinal,
          totalSessoes,
          solicitacaoId: solicitacao.id,
          candidaturaId: candidatura.id,
          prestadorUsuarioId,
        },
      );
    }

    /**
     * A oportunidade entrou no motor comercial.
     *
     * Ainda NÃO marcamos CONVERTIDA.
     *
     * CONVERTIDA ficará para o evento comercial que definirmos
     * posteriormente, provavelmente pagamento confirmado/contrato.
     */
    if (
      opportunity.status !==
      MarketingOpportunityStatus.CONVERTIDA
    ) {
      opportunity.status =
        MarketingOpportunityStatus.NEGOCIANDO;

      opportunity.negociacao_iniciada_em =
        opportunity.negociacao_iniciada_em ||
        new Date();

      await this.opportunityRepo.save(
        opportunity,
      );
    }

    return {
      opportunity,
      solicitacao,
      candidatura,
      createdSolicitacao,
      createdCandidatura,
    };
  }

  /**
   * ============================================================
   * BUSCAR SOLICITAÇÃO DA OPORTUNIDADE
   * ============================================================
   *
   * Compatível com metadata:
   *
   * - JSON nativo MySQL;
   * - string JSON;
   * - objeto retornado pelo driver.
   */
  async findSolicitacaoByOpportunityId(
    opportunityId: string,
  ): Promise<ServicoSolicitacao | null> {
    const id = String(
      opportunityId || "",
    ).trim();

    if (!id) {
      return null;
    }

    /**
     * Primeiro tentamos JSON_EXTRACT.
     */
    try {
      const rows =
        await AppDataSource.query(
          `
            SELECT id
            FROM servico_solicitacao
            WHERE JSON_UNQUOTE(
              JSON_EXTRACT(
                metadata,
                '$.marketingOpportunityId'
              )
            ) = ?
            ORDER BY createdAt DESC
            LIMIT 1
          `,
          [id],
        );

      const solicitacaoId =
        rows?.[0]?.id
          ? String(rows[0].id)
          : "";

      if (solicitacaoId) {
        return await this.solicitacaoRepo.findOne({
          where: {
            id: solicitacaoId,
          },
        });
      }
    } catch (error: any) {
      console.warn(
        "[MARKETING OPPORTUNITY CONVERSION] JSON_EXTRACT indisponível para metadata; usando fallback.",
        error?.message || error,
      );
    }

    /**
     * Fallback para metadata não nativo JSON.
     */
    const recentes =
      await this.solicitacaoRepo.find({
        order: {
          createdAt: "DESC",
        },
        take: 200,
      });

    for (const item of recentes) {
      const metadata =
        this.normalizeMetadata(
          (item as any).metadata,
        );

      if (
        metadata?.marketingOpportunityId === id
      ) {
        return item;
      }
    }

    return null;
  }

  /**
   * ============================================================
   * CONTEXTO COMERCIAL
   * ============================================================
   *
   * Retorna solicitação/candidatura já vinculadas.
   */
  async getCommercialContext(
    opportunityId: string,
  ): Promise<{
    opportunity: MarketingOpportunity;
    solicitacao: ServicoSolicitacao | null;
    candidatura: ServicoCandidatura | null;
  }> {
    const opportunity =
      await this.opportunityRepo.findOne({
        where: {
          id: opportunityId,
        },
      });

    if (!opportunity) {
      throw new Error(
        "OPORTUNIDADE_NAO_ENCONTRADA",
      );
    }

    const solicitacao =
      await this.findSolicitacaoByOpportunityId(
        opportunity.id,
      );

    if (!solicitacao) {
      return {
        opportunity,
        solicitacao: null,
        candidatura: null,
      };
    }

    /**
     * Tentamos resolver o prestador da Store para buscar
     * exatamente a candidatura relacionada ao negócio escolhido.
     */
    let prestadorUsuarioId: string | null =
      null;

    if (opportunity.selected_store_id) {
      const store =
        await this.storeRepo.findOne({
          where: {
            id: opportunity.selected_store_id,
          },
        });

      if (store) {
        prestadorUsuarioId =
          String(
            (store as any).usuarioId ||
              (store as any).userId ||
              "",
          ).trim() || null;
      }
    }

    let candidatura:
      | ServicoCandidatura
      | null = null;

    if (prestadorUsuarioId) {
      candidatura =
        await this.candidaturaRepo.findOne({
          where: {
            solicitacaoId: solicitacao.id,
            prestadorId:
              prestadorUsuarioId,
          },
          order: {
            createdAt: "ASC",
          },
        });
    }

    /**
     * Fallback para registros legados.
     */
    if (!candidatura) {
      candidatura =
        await this.candidaturaRepo.findOne({
          where: {
            solicitacaoId: solicitacao.id,
          },
          order: {
            createdAt: "ASC",
          },
        });
    }

    return {
      opportunity,
      solicitacao,
      candidatura,
    };
  }

  /**
   * ============================================================
   * PREÇO REAL DO ITEM
   * ============================================================
   *
   * Primeiro verifica preço promocional.
   *
   * Como o snapshot comercial deve representar o momento da escolha,
   * usamos prioritariamente os campos persistidos na oportunidade.
   */
  private resolveCatalogPrice(
    opportunity: MarketingOpportunity,
  ): number | null {
    const promotional =
      this.toMoneyNumber(
        opportunity.catalog_item_promotional_price,
      );

    if (promotional !== null) {
      return promotional;
    }

    const normal =
      this.toMoneyNumber(
        opportunity.catalog_item_price,
      );

    return normal;
  }

  /**
   * ============================================================
   * TOTAL DE SESSÕES
   * ============================================================
   */
  private resolveCatalogSessions(
    opportunity: MarketingOpportunity,
  ): number {
    const value = Number(
      opportunity.catalog_item_sessions || 1,
    );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return 1;
    }

    return Math.max(
      1,
      Math.trunc(value),
    );
  }

  /**
   * Conversão segura de decimal/string/number.
   */
  private toMoneyNumber(
    value: unknown,
  ): number | null {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const normalized =
      typeof value === "string"
        ? value
            .trim()
            .replace(",", ".")
        : value;

    const numberValue =
      Number(normalized);

    if (
      !Number.isFinite(numberValue)
    ) {
      return null;
    }

    return numberValue;
  }

  /**
   * ============================================================
   * USUÁRIO GRANCONNECTA
   * ============================================================
   *
   * IDs externos como whatsapp:5511...
   * não podem ser usados como usuarioId.
   */
  private resolveRegisteredUserId(
    value?: string | null,
  ): string | null {
    const id = String(
      value || "",
    ).trim();

    if (!id) {
      return null;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(id)
      ? id
      : null;
  }

  /**
   * Extrai telefone de:
   *
   * whatsapp:5511999999999
   */
  private extractPhoneFromExternalUserId(
    value?: string | null,
  ): string | null {
    const id = String(
      value || "",
    ).trim();

    const match =
      id.match(
        /^whatsapp:(\d+)$/i,
      );

    return match?.[1] || null;
  }

  /**
   * ============================================================
   * METADATA COMERCIAL
   * ============================================================
   *
   * Esse metadata acompanha a solicitação.
   *
   * Assim conseguimos reconstruir:
   *
   * Campanha
   * -> oportunidade
   * -> Store
   * -> item
   * -> solicitação
   * -> candidatura
   */
  private buildMetadata(
    opportunity: MarketingOpportunity,
    input: EnsureCommercialFlowInput,
  ): Record<string, unknown> {
    return {
      marketingOpportunityId:
        opportunity.id,

      campanhaId:
        opportunity.campanha_id ||
        null,

      categoriaId:
        opportunity.categoria_id ||
        null,

      sourceConversationId:
        opportunity.source_conversation_id ||
        null,

      destinationConversationId:
        opportunity.destination_conversation_id ||
        null,

      selectedStoreId:
        opportunity.selected_store_id ||
        null,

      selectedStoreName:
        opportunity.selected_store_name ||
        null,

      selectedStoreSlug:
        opportunity.selected_store_slug ||
        null,

      selectedChatbotTipo:
        opportunity.selected_chatbot_tipo ||
        null,

      /**
       * ========================================================
       * CATÁLOGO
       * ========================================================
       */
      catalogItemId:
        opportunity.catalog_item_id ||
        null,

      catalogItemName:
        opportunity.catalog_item_name ||
        null,

      catalogItemType:
        opportunity.catalog_item_type ||
        null,

      catalogItemPrice:
        opportunity.catalog_item_price ||
        null,

      catalogItemPromotionalPrice:
        opportunity.catalog_item_promotional_price ||
        null,

      catalogItemSessions:
        opportunity.catalog_item_sessions ||
        null,

      catalogItemDurationMinutes:
        opportunity.catalog_item_duration_minutes ||
        null,

      catalogItemModality:
        opportunity.catalog_item_modality ||
        null,

      catalogItemSelectedAt:
        opportunity.catalog_item_selected_at ||
        null,

      catalogItemSnapshot:
        opportunity.catalog_item_snapshot ||
        null,

      /**
       * Dados do funil.
       */
      canalOrigem:
        input.origem ||
        opportunity.canal_origem ||
        "OUTRO",

      qualificationScore:
        opportunity.score || 0,

      qualificationSummary:
        opportunity.resumo_qualificacao ||
        null,

      /**
       * Valor que efetivamente entrou no motor comercial.
       */
      commercialValue:
        input.valorSugerido ??
        null,

      commercialSessions:
        input.totalSessoes ??
        null,

      ...input.metadata,
    };
  }

  /**
   * ============================================================
   * TÍTULO DA SOLICITAÇÃO
   * ============================================================
   */
  private buildDefaultTitle(
    opportunity: MarketingOpportunity,
  ): string {
    const storeName =
      opportunity.selected_store_name ||
      "Prestador selecionado";

    const itemName =
      String(
        opportunity.catalog_item_name ||
          "",
      ).trim();

    if (itemName) {
      return `${itemName} - ${storeName}`;
    }

    return `Atendimento solicitado - ${storeName}`;
  }

  /**
   * ============================================================
   * DESCRIÇÃO DA SOLICITAÇÃO
   * ============================================================
   */
  private buildDefaultDescription(
    opportunity: MarketingOpportunity,
  ): string {
    const resumo = String(
      opportunity.resumo_qualificacao ||
        "",
    ).trim();

    const lines: string[] = [
      "Solicitação criada a partir de uma oportunidade qualificada pelo GranConecta.",
    ];

    if (
      opportunity.catalog_item_name
    ) {
      lines.push(
        `Item escolhido: ${opportunity.catalog_item_name}`,
      );
    }

    if (
      opportunity.catalog_item_type
    ) {
      lines.push(
        `Tipo: ${opportunity.catalog_item_type}`,
      );
    }

    const valor =
      this.resolveCatalogPrice(
        opportunity,
      );

    if (valor !== null) {
      lines.push(
        `Valor: R$ ${valor.toFixed(2)}`,
      );
    }

    const sessoes =
      this.resolveCatalogSessions(
        opportunity,
      );

    if (sessoes > 1) {
      lines.push(
        `Quantidade de sessões: ${sessoes}`,
      );
    }

    if (
      opportunity
        .catalog_item_duration_minutes
    ) {
      lines.push(
        `Duração aproximada: ${opportunity.catalog_item_duration_minutes} minutos`,
      );
    }

    if (
      opportunity.catalog_item_modality
    ) {
      lines.push(
        `Modalidade: ${opportunity.catalog_item_modality}`,
      );
    }

    if (resumo) {
      lines.push(
        `Qualificação: ${resumo}`,
      );
    }

    if (
      opportunity.campanha_id
    ) {
      lines.push(
        `Campanha: ${opportunity.campanha_id}`,
      );
    }

    if (
      opportunity.selected_store_name
    ) {
      lines.push(
        `Negócio escolhido: ${opportunity.selected_store_name}`,
      );
    }

    return lines.join("\n");
  }

  /**
   * ============================================================
   * NORMALIZAR METADATA
   * ============================================================
   */
  private normalizeMetadata(
    value: unknown,
  ): Record<string, any> | null {
    if (!value) {
      return null;
    }

    if (
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value as Record<
        string,
        any
      >;
    }

    if (
      typeof value === "string"
    ) {
      try {
        const parsed =
          JSON.parse(value);

        return parsed &&
          typeof parsed === "object"
          ? parsed
          : null;
      } catch {
        return null;
      }
    }

    return null;
  }
}

export default MarketingOpportunityConversionService;