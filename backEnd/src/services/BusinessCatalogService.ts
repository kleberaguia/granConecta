import { AppDataSource } from "../config/data-source";
import {
  BusinessCatalogItem,
  BusinessCatalogItemType,
  BusinessCatalogModality,
  BusinessCatalogSchedulingPolicy,
  BusinessCatalogDuplicatePurchasePolicy,
} from "../models/BusinessCatalogItemModel";



type CreateBusinessCatalogItemInput = {
  storeId: string;
  ownerUserId?: string | null;

  tipo: BusinessCatalogItemType;

  nome: string;
  descricao?: string | null;

  categoriaId?: number | null;

  preco: number;
  precoPromocional?: number | null;

  duracaoMinutos?: number | null;
  totalSessoes?: number;

  schedulingPolicy?: BusinessCatalogSchedulingPolicy;
  maxSessionsPerWeek?: number | null;
  allowStandalonePurchase?: boolean;
  duplicatePurchasePolicy?: BusinessCatalogDuplicatePurchasePolicy;

  modalidade?: BusinessCatalogModality;

  validadeInicio?: Date | string | null;
  validadeFim?: Date | string | null;

  ativo?: boolean;
  destaque?: boolean;

  metadata?: Record<string, unknown> | null;
};

type UpdateBusinessCatalogItemInput = Partial<
  Omit<CreateBusinessCatalogItemInput, "storeId">
> & {
  storeId?: string;
};

type ListBusinessCatalogItemsFilters = {
  storeId: string;

  tipo?: BusinessCatalogItemType;
  tipos?: BusinessCatalogItemType[];

  modalidade?: BusinessCatalogModality;

  categoriaId?: number;

  somenteAtivos?: boolean;
  somenteVigentes?: boolean;
  destaque?: boolean;

  search?: string;
};

type CatalogPriceResult = {
  precoBase: number;
  precoPromocional: number | null;
  precoVigente: number;
  promocaoAtiva: boolean;
};

export class BusinessCatalogService {
  private get repo() {
    return AppDataSource.getRepository(
      BusinessCatalogItem,
    );
  }

  /**
   * ============================================================
   * CRIAR ITEM
   * ============================================================
   */
  async criar(
    input: CreateBusinessCatalogItemInput,
  ): Promise<BusinessCatalogItem> {
    const storeId =
      String(input.storeId || "").trim();

    const nome =
      String(input.nome || "").trim();

    if (!storeId) {
      throw new Error(
        "storeId é obrigatório.",
      );
    }

    if (!nome) {
      throw new Error(
        "nome é obrigatório.",
      );
    }

    const preco =
      Number(input.preco);

    if (
      !Number.isFinite(preco) ||
      preco < 0
    ) {
      throw new Error(
        "preço inválido.",
      );
    }

    const precoPromocional =
      input.precoPromocional === null ||
      input.precoPromocional === undefined
        ? null
        : Number(input.precoPromocional);

    if (
      precoPromocional !== null &&
      (
        !Number.isFinite(precoPromocional) ||
        precoPromocional < 0
      )
    ) {
      throw new Error(
        "preço promocional inválido.",
      );
    }

    const totalSessoes =
      Math.max(
        1,
        Number(
          input.totalSessoes ?? 1,
        ),
      );

    const maxSessionsPerWeek =
      input.maxSessionsPerWeek === null ||
      input.maxSessionsPerWeek === undefined
        ? null
        : Math.floor(Number(input.maxSessionsPerWeek));

    if (
      maxSessionsPerWeek !== null &&
      (!Number.isFinite(maxSessionsPerWeek) || maxSessionsPerWeek < 1)
    ) {
      throw new Error("máximo de sessões por semana inválido.");
    }

    const schedulingPolicy =
      input.schedulingPolicy ||
      (
        input.tipo === BusinessCatalogItemType.PRODUTO ||
        input.tipo === BusinessCatalogItemType.CARDAPIO
          ? BusinessCatalogSchedulingPolicy.NO_SCHEDULING
          : BusinessCatalogSchedulingPolicy.DAILY_ALLOWED
      );

    const duracaoMinutos =
      input.duracaoMinutos === null ||
      input.duracaoMinutos === undefined
        ? null
        : Number(input.duracaoMinutos);

    if (
      duracaoMinutos !== null &&
      (
        !Number.isFinite(duracaoMinutos) ||
        duracaoMinutos <= 0
      )
    ) {
      throw new Error(
        "duração em minutos inválida.",
      );
    }

    const item =
      this.repo.create({
        storeId,
        ownerUserId:
          input.ownerUserId
            ? String(
                input.ownerUserId,
              ).trim()
            : null,

        tipo:
          input.tipo,

        nome,

        descricao:
          input.descricao
            ? String(
                input.descricao,
              ).trim()
            : null,

        categoriaId:
          input.categoriaId ??
          null,

        preco,

        precoPromocional,

        duracaoMinutos,

        totalSessoes,

        schedulingPolicy,
        maxSessionsPerWeek,
        allowStandalonePurchase:
          input.allowStandalonePurchase ?? true,
        duplicatePurchasePolicy:
          input.duplicatePurchasePolicy ||
          BusinessCatalogDuplicatePurchasePolicy.CONFIRM_IDENTICAL_PAID_ORDER,

        modalidade:
          input.modalidade ||
          BusinessCatalogModality.NAO_APLICA,

        validadeInicio:
          this.parseDate(
            input.validadeInicio,
          ),

        validadeFim:
          this.parseDate(
            input.validadeFim,
          ),

        ativo:
          input.ativo ??
          true,

        destaque:
          input.destaque ??
          false,

        metadata:
          input.metadata ||
          null,
      });

    const saved =
      await this.repo.save(item);

    console.log(
      "[BUSINESS CATALOG] Item criado",
      {
        itemId:
          saved.id,
        storeId:
          saved.storeId,
        tipo:
          saved.tipo,
        nome:
          saved.nome,
      },
    );

    return saved;
  }

  /**
   * ============================================================
   * ATUALIZAR ITEM
   * ============================================================
   */
  async atualizar(
    id: string,
    input: UpdateBusinessCatalogItemInput,
  ): Promise<BusinessCatalogItem> {
    const item =
      await this.buscarPorId(id);

    if (!item) {
      throw new Error(
        "ITEM_CATALOGO_NAO_ENCONTRADO",
      );
    }

    if (
      input.storeId !== undefined
    ) {
      const storeId =
        String(
          input.storeId || "",
        ).trim();

      if (!storeId) {
        throw new Error(
          "storeId inválido.",
        );
      }

      item.storeId =
        storeId;
    }

    if (
      input.ownerUserId !== undefined
    ) {
      item.ownerUserId =
        input.ownerUserId
          ? String(
              input.ownerUserId,
            ).trim()
          : null;
    }

    if (
      input.tipo !== undefined
    ) {
      item.tipo =
        input.tipo;
    }

    if (
      input.nome !== undefined
    ) {
      const nome =
        String(
          input.nome || "",
        ).trim();

      if (!nome) {
        throw new Error(
          "nome é obrigatório.",
        );
      }

      item.nome =
        nome;
    }

    if (
      input.descricao !== undefined
    ) {
      item.descricao =
        input.descricao
          ? String(
              input.descricao,
            ).trim()
          : null;
    }

    if (
      input.categoriaId !== undefined
    ) {
      item.categoriaId =
        input.categoriaId ??
        null;
    }

    if (
      input.preco !== undefined
    ) {
      const preco =
        Number(
          input.preco,
        );

      if (
        !Number.isFinite(preco) ||
        preco < 0
      ) {
        throw new Error(
          "preço inválido.",
        );
      }

      item.preco =
        preco;
    }

    if (
      input.precoPromocional !== undefined
    ) {
      const precoPromocional =
        input.precoPromocional === null
          ? null
          : Number(
              input.precoPromocional,
            );

      if (
        precoPromocional !== null &&
        (
          !Number.isFinite(
            precoPromocional,
          ) ||
          precoPromocional < 0
        )
      ) {
        throw new Error(
          "preço promocional inválido.",
        );
      }

      item.precoPromocional =
        precoPromocional;
    }

    if (
      input.duracaoMinutos !== undefined
    ) {
      const duracaoMinutos =
        input.duracaoMinutos === null
          ? null
          : Number(
              input.duracaoMinutos,
            );

      if (
        duracaoMinutos !== null &&
        (
          !Number.isFinite(
            duracaoMinutos,
          ) ||
          duracaoMinutos <= 0
        )
      ) {
        throw new Error(
          "duração em minutos inválida.",
        );
      }

      item.duracaoMinutos =
        duracaoMinutos;
    }

    if (
      input.totalSessoes !== undefined
    ) {
      const totalSessoes =
        Number(
          input.totalSessoes,
        );

      if (
        !Number.isFinite(
          totalSessoes,
        ) ||
        totalSessoes < 1
      ) {
        throw new Error(
          "total de sessões inválido.",
        );
      }

      item.totalSessoes =
        Math.floor(
          totalSessoes,
        );
    }

    if (input.schedulingPolicy !== undefined) {
      item.schedulingPolicy = input.schedulingPolicy;
    }

    if (input.maxSessionsPerWeek !== undefined) {
      if (input.maxSessionsPerWeek === null) {
        item.maxSessionsPerWeek = null;
      } else {
        const maxSessionsPerWeek =
          Math.floor(Number(input.maxSessionsPerWeek));

        if (
          !Number.isFinite(maxSessionsPerWeek) ||
          maxSessionsPerWeek < 1
        ) {
          throw new Error("máximo de sessões por semana inválido.");
        }

        item.maxSessionsPerWeek = maxSessionsPerWeek;
      }
    }

    if (input.allowStandalonePurchase !== undefined) {
      item.allowStandalonePurchase =
        Boolean(input.allowStandalonePurchase);
    }

    if (input.duplicatePurchasePolicy !== undefined) {
      item.duplicatePurchasePolicy =
        input.duplicatePurchasePolicy;
    }

    if (
      input.modalidade !== undefined
    ) {
      item.modalidade =
        input.modalidade;
    }

    if (
      input.validadeInicio !== undefined
    ) {
      item.validadeInicio =
        this.parseDate(
          input.validadeInicio,
        );
    }

    if (
      input.validadeFim !== undefined
    ) {
      item.validadeFim =
        this.parseDate(
          input.validadeFim,
        );
    }

    if (
      input.ativo !== undefined
    ) {
      item.ativo =
        Boolean(
          input.ativo,
        );
    }

    if (
      input.destaque !== undefined
    ) {
      item.destaque =
        Boolean(
          input.destaque,
        );
    }

    if (
      input.metadata !== undefined
    ) {
      item.metadata =
        input.metadata ||
        null;
    }

    this.validateValidityWindow(
      item.validadeInicio,
      item.validadeFim,
    );

    return this.repo.save(
      item,
    );
  }

  /**
   * ============================================================
   * BUSCAR POR ID
   * ============================================================
   */
  async buscarPorId(
    id: string,
  ): Promise<BusinessCatalogItem | null> {
    const normalizedId =
      String(id || "").trim();

    if (!normalizedId) {
      return null;
    }

    return this.repo.findOne({
      where: {
        id:
          normalizedId,
      },
    });
  }

  /**
   * ============================================================
   * LISTAR POR STORE / FILTROS
   * ============================================================
   */
  async listar(
    filters: ListBusinessCatalogItemsFilters,
  ): Promise<BusinessCatalogItem[]> {
    const storeId =
      String(
        filters.storeId || "",
      ).trim();

    if (!storeId) {
      throw new Error(
        "storeId é obrigatório.",
      );
    }

    const qb =
      this.repo
        .createQueryBuilder(
          "item",
        )
        .where(
          "item.store_id = :storeId",
          {
            storeId,
          },
        );

    if (
      filters.somenteAtivos !==
      false
    ) {
      qb.andWhere(
        "item.ativo = :ativo",
        {
          ativo:
            true,
        },
      );
    }

    if (
      filters.tipo
    ) {
      qb.andWhere(
        "item.tipo = :tipo",
        {
          tipo:
            filters.tipo,
        },
      );
    }

    if (
      filters.tipos?.length
    ) {
      qb.andWhere(
        "item.tipo IN (:...tipos)",
        {
          tipos:
            filters.tipos,
        },
      );
    }

    if (
      filters.modalidade
    ) {
      qb.andWhere(
        `(
          item.modalidade = :modalidade
          OR item.modalidade = :ambos
          OR item.modalidade = :naoAplica
        )`,
        {
          modalidade:
            filters.modalidade,

          ambos:
            BusinessCatalogModality.AMBOS,

          naoAplica:
            BusinessCatalogModality.NAO_APLICA,
        },
      );
    }

    if (
      filters.categoriaId !==
      undefined
    ) {
      qb.andWhere(
        "item.categoria_id = :categoriaId",
        {
          categoriaId:
            filters.categoriaId,
        },
      );
    }

    if (
      filters.destaque !==
      undefined
    ) {
      qb.andWhere(
        "item.destaque = :destaque",
        {
          destaque:
            filters.destaque,
        },
      );
    }

    if (
      filters.search
    ) {
      const search =
        `%${String(
          filters.search,
        )
          .trim()
          .toLowerCase()}%`;

      qb.andWhere(
        `(
          LOWER(item.nome) LIKE :search
          OR LOWER(COALESCE(item.descricao, '')) LIKE :search
        )`,
        {
          search,
        },
      );
    }

    if (
      filters.somenteVigentes
    ) {
      const now =
        new Date();

      qb.andWhere(
        `(
          item.validade_inicio IS NULL
          OR item.validade_inicio <= :now
        )`,
        {
          now,
        },
      );

      qb.andWhere(
        `(
          item.validade_fim IS NULL
          OR item.validade_fim >= :now
        )`,
        {
          now,
        },
      );
    }

    return qb
      .orderBy(
        "item.destaque",
        "DESC",
      )
      .addOrderBy(
        "item.tipo",
        "ASC",
      )
      .addOrderBy(
        "item.nome",
        "ASC",
      )
      .getMany();
  }

  /**
   * ============================================================
   * LISTAR OPÇÕES COMERCIAIS DO CHATBOT
   * ============================================================
   *
   * Serviços/pacotes/promoções são os itens relevantes para
   * contratação de PRESTADOR.
   */
  async listarOpcoesServico(
    storeId: string,
    options?: {
      categoriaId?: number;
      modalidade?: BusinessCatalogModality;
    },
  ): Promise<BusinessCatalogItem[]> {
    return this.listar({
      storeId,

      tipos: [
        BusinessCatalogItemType.SERVICO,
        BusinessCatalogItemType.PACOTE,
        BusinessCatalogItemType.PROMOCAO,
      ],

      categoriaId:
        options?.categoriaId,

      modalidade:
        options?.modalidade,

      somenteAtivos:
        true,

      somenteVigentes:
        true,
    });
  }

  /**
   * ============================================================
   * LISTAR CARDÁPIO / PRODUTOS
   * ============================================================
   */
  async listarProdutos(
    storeId: string,
  ): Promise<BusinessCatalogItem[]> {
    return this.listar({
      storeId,

      tipos: [
        BusinessCatalogItemType.PRODUTO,
        BusinessCatalogItemType.CARDAPIO,
        BusinessCatalogItemType.PROMOCAO,
      ],

      somenteAtivos:
        true,

      somenteVigentes:
        true,
    });
  }

  /**
   * ============================================================
   * PREÇO VIGENTE
   * ============================================================
   */
  getPrecoVigente(
    item: BusinessCatalogItem,
    referenceDate =
      new Date(),
  ): CatalogPriceResult {
    const precoBase =
      Number(
        item.preco || 0,
      );

    const precoPromocional =
      item.precoPromocional === null ||
      item.precoPromocional === undefined
        ? null
        : Number(
            item.precoPromocional,
          );

    const dentroDaValidade =
      this.isWithinValidity(
        item.validadeInicio,
        item.validadeFim,
        referenceDate,
      );

    const promocaoAtiva =
      Boolean(
        item.ativo &&
        precoPromocional !== null &&
        dentroDaValidade,
      );

    return {
      precoBase,

      precoPromocional,

      precoVigente:
        promocaoAtiva
          ? Number(
              precoPromocional,
            )
          : precoBase,

      promocaoAtiva,
    };
  }

  /**
   * ============================================================
   * DESATIVAR
   * ============================================================
   */
  async desativar(
    id: string,
  ): Promise<BusinessCatalogItem> {
    const item =
      await this.buscarPorId(
        id,
      );

    if (!item) {
      throw new Error(
        "ITEM_CATALOGO_NAO_ENCONTRADO",
      );
    }

    item.ativo =
      false;

    return this.repo.save(
      item,
    );
  }

  /**
   * ============================================================
   * ATIVAR
   * ============================================================
   */
  async ativar(
    id: string,
  ): Promise<BusinessCatalogItem> {
    const item =
      await this.buscarPorId(
        id,
      );

    if (!item) {
      throw new Error(
        "ITEM_CATALOGO_NAO_ENCONTRADO",
      );
    }

    item.ativo =
      true;

    return this.repo.save(
      item,
    );
  }

  /**
   * ============================================================
   * FORMATAÇÃO PARA O CONTEXTO DA IA
   * ============================================================
   *
   * O chatbot não precisa receber a entidade inteira.
   * Recebe somente fatos comerciais confirmados pelo banco.
   */
  buildChatContext(
    items: BusinessCatalogItem[],
  ): string {
    if (!items.length) {
      return [
        "CATÁLOGO COMERCIAL DO NEGÓCIO",
        "Nenhum serviço, pacote, produto, cardápio ou promoção ativa foi cadastrado.",
        "Não invente preços, pacotes ou condições comerciais.",
      ].join("\n");
    }

    const lines =
      items.map(
        (
          item,
          index,
        ) => {
          const price =
            this.getPrecoVigente(
              item,
            );

          const details: string[] = [
            `${index + 1}. ${item.nome}`,
            `Tipo: ${item.tipo}`,
            `Preço vigente: R$ ${price.precoVigente.toFixed(2).replace(".", ",")}`,
          ];

          if (
            price.promocaoAtiva &&
            price.precoPromocional !== null
          ) {
            details.push(
              `Preço normal: R$ ${price.precoBase.toFixed(2).replace(".", ",")}`,
            );
          }

          if (
            item.totalSessoes > 1
          ) {
            details.push(
              `Sessões incluídas: ${item.totalSessoes}`,
            );
          }

          if (
            item.duracaoMinutos
          ) {
            details.push(
              `Duração: ${item.duracaoMinutos} minutos`,
            );
          }

          if (
            item.schedulingPolicy ===
            BusinessCatalogSchedulingPolicy.ONE_PER_WEEK
          ) {
            details.push(
              `Política de agenda: no máximo ${item.maxSessionsPerWeek || 1} sessão(ões) por semana`,
            );
          } else if (
            item.schedulingPolicy ===
            BusinessCatalogSchedulingPolicy.DAILY_ALLOWED
          ) {
            details.push(
              "Política de agenda: atendimentos em dias consecutivos são permitidos",
            );
          } else if (
            item.schedulingPolicy ===
            BusinessCatalogSchedulingPolicy.MULTIPLE_PER_DAY
          ) {
            details.push(
              "Política de agenda: múltiplos atendimentos no mesmo dia são permitidos",
            );
          }

          if (item.allowStandalonePurchase) {
            details.push("Contratação avulsa: permitida");
          }

          if (
            item.duplicatePurchasePolicy ===
            BusinessCatalogDuplicatePurchasePolicy.CONFIRM_IDENTICAL_PAID_ORDER
          ) {
            details.push(
              "Compra idêntica já paga: confirmar com o cliente antes de repetir",
            );
          }

          if (
            item.modalidade !==
            BusinessCatalogModality.NAO_APLICA
          ) {
            details.push(
              `Modalidade: ${item.modalidade}`,
            );
          }

          if (
            item.descricao
          ) {
            details.push(
              `Descrição: ${item.descricao}`,
            );
          }

          return details.join(
            "\n",
          );
        },
      );

    return [
      "CATÁLOGO COMERCIAL DO NEGÓCIO",
      "Use SOMENTE os itens e valores abaixo para apresentar opções comerciais.",
      "",
      ...lines,
      "",
      "REGRAS:",
      "- não invente preços ou pacotes;",
      "- não altere quantidade de sessões sem uma nova proposta formal;",
      "- promoção só pode ser apresentada quando estiver vigente;",
      "- se o cliente quiser contratar, use o fluxo comercial do GranConecta.",
    ].join("\n");
  }

  /**
   * ============================================================
   * HELPERS
   * ============================================================
   */
  private parseDate(
    value?: Date | string | null,
  ): Date | null {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    if (
      value instanceof Date
    ) {
      if (
        Number.isNaN(
          value.getTime(),
        )
      ) {
        throw new Error(
          "data inválida.",
        );
      }

      return value;
    }

    const parsed =
      new Date(
        value,
      );

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      throw new Error(
        "data inválida.",
      );
    }

    return parsed;
  }

  private validateValidityWindow(
    start?: Date | null,
    end?: Date | null,
  ): void {
    if (
      start &&
      end &&
      start.getTime() >
        end.getTime()
    ) {
      throw new Error(
        "validadeInicio não pode ser posterior a validadeFim.",
      );
    }
  }

  private isWithinValidity(
    start?: Date | null,
    end?: Date | null,
    referenceDate =
      new Date(),
  ): boolean {
    if (
      start &&
      referenceDate.getTime() <
        start.getTime()
    ) {
      return false;
    }

    if (
      end &&
      referenceDate.getTime() >
        end.getTime()
    ) {
      return false;
    }

    return true;
  }
}

export default BusinessCatalogService;