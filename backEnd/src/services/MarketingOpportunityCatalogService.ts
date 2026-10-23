import { AppDataSource } from "../config/data-source";

import {
  MarketingOpportunity,
  MarketingOpportunityStatus,
} from "../models/MarketingOpportunityModel";

import { BusinessCatalogItem } from "../models/BusinessCatalogItemModel";

type SelectCatalogItemInput = {
  opportunityId: string;
  catalogItemId: string;
};

export class MarketingOpportunityCatalogService {
  private get opportunityRepository() {
    return AppDataSource.getRepository(MarketingOpportunity);
  }

  private get catalogRepository() {
    return AppDataSource.getRepository(BusinessCatalogItem);
  }

  /**
   * Persiste formalmente o item comercial escolhido pelo cliente.
   *
   * Regras:
   * - a oportunidade precisa existir;
   * - a oportunidade precisa ter Store selecionada;
   * - o item precisa estar ativo;
   * - o item precisa pertencer à Store da oportunidade;
   * - o preço promocional só é persistido como aplicável se estiver vigente;
   * - é criado um snapshot comercial para preservar o acordo daquele momento.
   */
  async selectCatalogItem(
    input: SelectCatalogItemInput,
  ): Promise<MarketingOpportunity> {
    const opportunityId = String(
      input?.opportunityId || "",
    ).trim();

    const catalogItemId = String(
      input?.catalogItemId || "",
    ).trim();

    if (!opportunityId) {
      throw new Error("opportunityId é obrigatório.");
    }

    if (!catalogItemId) {
      throw new Error("catalogItemId é obrigatório.");
    }

    const opportunity =
      await this.opportunityRepository.findOne({
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

    if (
      opportunity.status ===
        MarketingOpportunityStatus.PERDIDA ||
      opportunity.status ===
        MarketingOpportunityStatus.EXPIRADA
    ) {
      throw new Error("OPORTUNIDADE_INATIVA");
    }

    const catalogItem =
      await this.catalogRepository.findOne({
        where: {
          id: catalogItemId,
          storeId: opportunity.selected_store_id,
          ativo: true,
        },
      });

    if (!catalogItem) {
      throw new Error(
        "ITEM_CATALOGO_NAO_ENCONTRADO_OU_NAO_PERTENCE_A_STORE",
      );
    }

    const now = new Date();

    /**
     * Verifica se eventual preço promocional está realmente vigente.
     */
    const promocaoVigente =
      this.isPromotionalPriceValid(
        catalogItem.precoPromocional,
        catalogItem.validadeInicio,
        catalogItem.validadeFim,
        now,
      );

    const precoPromocionalAplicavel =
      promocaoVigente &&
      catalogItem.precoPromocional !== null &&
      catalogItem.precoPromocional !== undefined
        ? String(catalogItem.precoPromocional)
        : null;

    const precoNormal =
      catalogItem.preco !== null &&
      catalogItem.preco !== undefined
        ? String(catalogItem.preco)
        : null;

    if (precoNormal === null) {
      throw new Error(
        "ITEM_CATALOGO_SEM_PRECO",
      );
    }

    /**
     * Snapshot completo da condição comercial no momento da escolha.
     *
     * Mesmo que o negócio altere o catálogo posteriormente,
     * esta oportunidade continua sabendo exatamente o que
     * o cliente escolheu.
     */
    const snapshot: Record<string, unknown> = {
      id: catalogItem.id,

      storeId: catalogItem.storeId,
      ownerUserId: catalogItem.ownerUserId,

      tipo: catalogItem.tipo,
      nome: catalogItem.nome,
      descricao: catalogItem.descricao,

      categoriaId: catalogItem.categoriaId,

      preco: precoNormal,

      precoPromocional:
        precoPromocionalAplicavel,

      precoPromocionalOriginal:
        catalogItem.precoPromocional !== null &&
        catalogItem.precoPromocional !== undefined
          ? String(catalogItem.precoPromocional)
          : null,

      promocaoVigente,

      duracaoMinutos:
        catalogItem.duracaoMinutos,

      totalSessoes:
        catalogItem.totalSessoes,

      modalidade:
        catalogItem.modalidade,

      validadeInicio:
        catalogItem.validadeInicio
          ? catalogItem.validadeInicio.toISOString()
          : null,

      validadeFim:
        catalogItem.validadeFim
          ? catalogItem.validadeFim.toISOString()
          : null,

      destaque:
        catalogItem.destaque,

      metadata:
        catalogItem.metadata,

      selectedAt:
        now.toISOString(),
    };

    /**
     * ============================================================
     * PERSISTÊNCIA DA ESCOLHA
     * ============================================================
     */

    opportunity.catalog_item_id =
      catalogItem.id;

    opportunity.catalog_item_name =
      catalogItem.nome;

    opportunity.catalog_item_type =
      catalogItem.tipo;

    opportunity.catalog_item_price =
      precoNormal;

    opportunity.catalog_item_promotional_price =
      precoPromocionalAplicavel;

    opportunity.catalog_item_sessions =
      Math.max(
        1,
        Number(catalogItem.totalSessoes || 1),
      );

    opportunity.catalog_item_duration_minutes =
      catalogItem.duracaoMinutos ?? null;

    opportunity.catalog_item_modality =
      catalogItem.modalidade;

    opportunity.catalog_item_snapshot =
      snapshot;

    opportunity.catalog_item_selected_at =
      now;

    /**
     * ============================================================
     * CATEGORIA DA OPORTUNIDADE
     * ============================================================
     *
     * O catálogo é a fonte oficial do item comercial escolhido.
     *
     * Em oportunidades originadas diretamente da landing page/chatbot
     * do negócio, categoria_id pode nascer null porque não existe campanha
     * ou playbook informando a categoria.
     *
     * Quando o cliente escolhe um SERVICO/PACOTE, a categoria do próprio
     * BusinessCatalogItem passa a ser a fonte correta para completar
     * a MarketingOpportunity antes da conversão para ServicoSolicitacao.
     */
    const catalogCategoryId =
      catalogItem.categoriaId !== null &&
      catalogItem.categoriaId !== undefined
        ? Number(catalogItem.categoriaId)
        : null;

    const requiresCategory =
      catalogItem.tipo === "SERVICO" ||
      catalogItem.tipo === "PACOTE";

    if (
      requiresCategory &&
      (
        catalogCategoryId === null ||
        !Number.isFinite(catalogCategoryId) ||
        catalogCategoryId <= 0
      )
    ) {
      throw new Error(
        "ITEM_CATALOGO_SEM_CATEGORIA",
      );
    }

    if (
      catalogCategoryId !== null &&
      Number.isFinite(catalogCategoryId) &&
      catalogCategoryId > 0
    ) {
      /**
       * Se a oportunidade já veio de uma campanha com categoria,
       * não permitimos que um item de outra categoria altere silenciosamente
       * o contexto comercial.
       */
      if (
        opportunity.categoria_id !== null &&
        opportunity.categoria_id !== undefined &&
        Number(opportunity.categoria_id) !==
          catalogCategoryId
      ) {
        throw new Error(
          "ITEM_CATALOGO_CATEGORIA_DIVERGENTE_DA_OPORTUNIDADE",
        );
      }

      opportunity.categoria_id =
        catalogCategoryId;
    }

    /**
     * A partir da escolha formal do item,
     * a oportunidade pode entrar no estágio de negociação.
     *
     * Ainda NÃO é conversão.
     * Ainda NÃO é pagamento.
     * Ainda NÃO é agendamento.
     */
    if (
      opportunity.status !==
        MarketingOpportunityStatus.CONVERTIDA
    ) {
      opportunity.status =
        MarketingOpportunityStatus.NEGOCIANDO;

      opportunity.negociacao_iniciada_em =
        opportunity.negociacao_iniciada_em ||
        now;
    }

    const saved =
      await this.opportunityRepository.save(
        opportunity,
      );

    console.log(
      "[MARKETING OPPORTUNITY CATALOG] Item selecionado",
      {
        opportunityId: saved.id,

        storeId:
          saved.selected_store_id,

        catalogItemId:
          saved.catalog_item_id,

        catalogItemName:
          saved.catalog_item_name,

        catalogItemType:
          saved.catalog_item_type,

        categoriaId:
          saved.categoria_id,

        preco:
          saved.catalog_item_price,

        precoPromocional:
          saved.catalog_item_promotional_price,

        sessoes:
          saved.catalog_item_sessions,

        modalidade:
          saved.catalog_item_modality,
      },
    );

    return saved;
  }

  /**
   * Verifica se o preço promocional pode ser aplicado.
   *
   * Regras:
   *
   * - sem precoPromocional => false
   * - sem datas => promoção válida
   * - antes de validadeInicio => false
   * - depois de validadeFim => false
   */
  private isPromotionalPriceValid(
    precoPromocional: number | null,
    validadeInicio: Date | null,
    validadeFim: Date | null,
    now: Date,
  ): boolean {
    if (
      precoPromocional === null ||
      precoPromocional === undefined
    ) {
      return false;
    }

    if (
      validadeInicio &&
      now.getTime() <
        new Date(validadeInicio).getTime()
    ) {
      return false;
    }

    if (
      validadeFim &&
      now.getTime() >
        new Date(validadeFim).getTime()
    ) {
      return false;
    }

    return true;
  }
}

export default new MarketingOpportunityCatalogService();