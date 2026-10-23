import { AppDataSource } from "../config/data-source";

import type {
  CentralComercialCampaign,
  CentralComercialChannel,
  CentralComercialConversation,
  CentralComercialFilters,
  CentralComercialFlow,
  CentralComercialListResponse,
  CentralComercialOpportunity,
  CentralComercialStage,
  CentralComercialSummary,
} from "../models/CentralComercialTypes";

type AuthenticatedPartner = {
  userId: string;
  role?: string | null;
};

type RawRow = Record<string, any>;

const CLOSED_OPPORTUNITY_STATUSES = new Set([
  "CONVERTIDA",
  "PERDIDA",
  "EXPIRADA",
]);

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function nullableText(value: unknown): string | null {
  const normalized = text(value);
  return normalized || null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integer(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function boolOrNull(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Boolean(Number(value) || value === true);
}

function iso(value: unknown): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeChannel(value: unknown): CentralComercialChannel {
  const channel = text(value).toUpperCase();

  switch (channel) {
    case "WHATSAPP":
      return "WHATSAPP";

    case "INSTAGRAM":
      return "INSTAGRAM";

    case "FACEBOOK":
      return "FACEBOOK";

    case "LANDING_PAGE":
      return "LANDING_PAGE";

    case "CHAT_LOJA":
      return "CHAT_LOJA";

    case "CHAT_PRESTADOR":
      return "CHAT_PRESTADOR";

    case "CHAT_HOME":
    case "GRANCONECTA":
      return "GRANCONECTA";

    case "CAMPANHA":
      return "CAMPANHA";

    case "DIRETO":
      return "DIRETO";

    default:
      return "OUTRO";
  }
}

function mapStage(
  opportunityStatus: unknown,
  flowState: unknown,
): CentralComercialStage {
  const opportunity = text(opportunityStatus).toUpperCase();
  const flow = text(flowState).toUpperCase();

  if (
    flow === "CANCELADO" ||
    opportunity === "CANCELADA"
  ) {
    return "CANCELADA";
  }

  if (
    flow === "ERRO"
  ) {
    return "ERRO";
  }

  if (
    opportunity === "EXPIRADA"
  ) {
    return "EXPIRADA";
  }

  if (
    opportunity === "PERDIDA"
  ) {
    return "PERDIDA";
  }

  if (
    opportunity === "CONVERTIDA" ||
    flow === "CONCLUIDO" ||
    flow === "FINALIZADO" ||
    flow === "ENTREGUE"
  ) {
    return "CONVERTIDA";
  }

  if (
    flow === "EM_PREPARACAO" ||
    flow === "PRONTO" ||
    flow === "AGENDADO" ||
    flow === "PEDIDO_PAGO"
  ) {
    return "EM_EXECUCAO";
  }

  if (
    flow === "PAGAMENTO_APROVADO" ||
    flow === "AGUARDANDO_AGENDAMENTO"
  ) {
    return "PAGAMENTO_APROVADO";
  }

  if (
    flow === "PAGAMENTO_CRIADO" ||
    flow === "AGUARDANDO_PAGAMENTO"
  ) {
    return "AGUARDANDO_PAGAMENTO";
  }

  if (
    flow === "AGUARDANDO_LOGIN" ||
    flow === "AGUARDANDO_CADASTRO_RAPIDO" ||
    flow === "IDENTIFICANDO_CLIENTE" ||
    flow === "AGUARDANDO_CONFIRMACAO_COMPRA" ||
    flow === "AGUARDANDO_DECISAO_PACOTE"
  ) {
    return "AGUARDANDO_CLIENTE";
  }

  if (
    opportunity === "NEGOCIANDO" ||
    flow === "SOLICITACAO_CRIADA" ||
    flow === "CANDIDATURA_CRIADA" ||
    flow === "OFERTA_CRIADA" ||
    flow === "CARRINHO_ABERTO" ||
    flow === "PEDIDO_CRIADO" ||
    flow === "ITEM_SELECIONADO" ||
    flow === "AGUARDANDO_DATA" ||
    flow === "AGUARDANDO_HORARIO" ||
    flow === "VERIFICANDO_DISPONIBILIDADE" ||
    flow === "HORARIO_DISPONIVEL" ||
    flow === "HORARIO_INDISPONIVEL"
  ) {
    return "EM_NEGOCIACAO";
  }

  if (
    opportunity === "NEGOCIO_SELECIONADO"
  ) {
    return "NEGOCIO_SELECIONADO";
  }

  if (
    opportunity === "OPCOES_APRESENTADAS"
  ) {
    return "OPCOES_APRESENTADAS";
  }

  if (
    opportunity === "QUALIFICADA"
  ) {
    return "QUALIFICADA";
  }

  if (
    opportunity === "QUALIFICANDO"
  ) {
    return "QUALIFICANDO";
  }

  return "NOVA";
}

function emptySummary(): CentralComercialSummary {
  return {
    total: 0,
    novas: 0,
    qualificando: 0,
    qualificadas: 0,
    emNegociacao: 0,
    aguardandoPagamento: 0,
    pagamentoAprovado: 0,
    emExecucao: 0,
    convertidas: 0,
    perdidas: 0,
    valorEmNegociacao: 0,
    valorConvertido: 0,
  };
}

function addSummary(
  summary: CentralComercialSummary,
  item: CentralComercialOpportunity,
): void {
  summary.total += 1;

  switch (item.stage) {
    case "NOVA":
      summary.novas += 1;
      break;

    case "QUALIFICANDO":
      summary.qualificando += 1;
      break;

    case "QUALIFICADA":
      summary.qualificadas += 1;
      break;

    case "EM_NEGOCIACAO":
    case "NEGOCIO_SELECIONADO":
    case "OPCOES_APRESENTADAS":
    case "AGUARDANDO_CLIENTE":
      summary.emNegociacao += 1;
      break;

    case "AGUARDANDO_PAGAMENTO":
      summary.aguardandoPagamento += 1;
      break;

    case "PAGAMENTO_APROVADO":
      summary.pagamentoAprovado += 1;
      break;

    case "EM_EXECUCAO":
      summary.emExecucao += 1;
      break;

    case "CONVERTIDA":
      summary.convertidas += 1;
      break;

    case "PERDIDA":
      summary.perdidas += 1;
      break;
  }

  const amount = item.flow.amount || 0;

  if (
    item.stage === "EM_NEGOCIACAO" ||
    item.stage === "AGUARDANDO_CLIENTE" ||
    item.stage === "AGUARDANDO_PAGAMENTO"
  ) {
    summary.valorEmNegociacao += amount;
  }

  if (
    item.stage === "PAGAMENTO_APROVADO" ||
    item.stage === "EM_EXECUCAO" ||
    item.stage === "CONVERTIDA"
  ) {
    summary.valorConvertido += amount;
  }
}

export class CentralComercialService {
  /**
   * Resolve todos os stores que pertencem ao usuário autenticado.
   *
   * IMPORTANTE:
   * O projeto possui código legado em que stores.usuarioId aparece ora como
   * Usuario.id, ora relacionado ao PerfilPrestador. Para não abrir brecha de
   * segurança e também não quebrar os dados existentes, aceitamos somente:
   *
   * 1) stores.usuarioId = usuário autenticado; ou
   * 2) stores.usuarioId = perfil_prestador.id cujo usuarioId é o autenticado.
   *
   * Nunca aceitamos storeId vindo do frontend como autorização.
   */
  private async resolveAccessibleStores(
    authenticatedUserId: string,
  ): Promise<RawRow[]> {
    const userId = text(authenticatedUserId);

    if (!userId) {
      throw new Error("CENTRAL_COMERCIAL_USUARIO_NAO_AUTENTICADO");
    }

    // Lojas próprias: suporta Usuario.id e o legado PerfilPrestador.id.
    const profileRows: RawRow[] = await AppDataSource.query(
      `
        SELECT id
        FROM perfil_prestador
        WHERE usuarioId = ?
      `,
      [userId],
    );

    const allowedOwnerIds = Array.from(
      new Set([
        userId,
        ...profileRows.map((row) => text(row.id)).filter(Boolean),
      ]),
    );

    const ownerPlaceholders = allowedOwnerIds.map(() => "?").join(", ");

    const ownedStores: RawRow[] = await AppDataSource.query(
      `
        SELECT
          id, usuarioId, name, slug, tipo, ativa,
          condominio_id, categoriaid, categoria
        FROM stores
        WHERE usuarioId IN (${ownerPlaceholders})
      `,
      allowedOwnerIds,
    );

    /*
     * Lojas da equipe:
     * usuarios.tipo continua sendo a identidade global da pessoa.
     * O acesso profissional ao negócio vem de business_team_members.
     */
    const membershipRows: RawRow[] = await AppDataSource.query(
      `
        SELECT store_id
        FROM business_team_members
        WHERE user_id = ?
          AND active = 1
          AND can_central_comercial = 1
      `,
      [userId],
    );

    const teamStoreIds = Array.from(
      new Set(
        membershipRows.map((row) => text(row.store_id)).filter(Boolean),
      ),
    );

    let teamStores: RawRow[] = [];

    if (teamStoreIds.length > 0) {
      const placeholders = teamStoreIds.map(() => "?").join(", ");

      teamStores = await AppDataSource.query(
        `
          SELECT
            id, usuarioId, name, slug, tipo, ativa,
            condominio_id, categoriaid, categoria
          FROM stores
          WHERE id IN (${placeholders})
        `,
        teamStoreIds,
      );
    }

    // Evita duplicação caso o owner também possua membership.
    const storeMap = new Map<string, RawRow>();

    for (const store of [...ownedStores, ...teamStores]) {
      const storeId = text(store.id);
      if (storeId) storeMap.set(storeId, store);
    }

    return Array.from(storeMap.values());
  }

  private async requirePartner(
    auth: AuthenticatedPartner,
  ): Promise<{
    user: RawRow;
    stores: RawRow[];
  }> {
    const userId = text(auth?.userId);

    if (!userId) {
      throw new Error("CENTRAL_COMERCIAL_USUARIO_NAO_AUTENTICADO");
    }

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT
            id,
            name,
            email,
            tipo,
            is_empreendedor,
            is_prestador,
            status_conta,
            condominio_id
          FROM usuarios
          WHERE id = ?
          LIMIT 1
        `,
        [userId],
      );

    const user = rows[0];

    if (!user) {
      throw new Error("CENTRAL_COMERCIAL_USUARIO_NAO_ENCONTRADO");
    }

    /*
     * A identidade global (MORADOR, VISITANTE, PRESTADOR, EMPREENDEDOR...)
     * não concede nem bloqueia, sozinha, acesso à Central Comercial.
     *
     * A autorização efetiva é possuir uma loja própria OU membership ativo
     * com can_central_comercial = 1.
     */
    const stores =
      await this.resolveAccessibleStores(userId);

    if (stores.length === 0) {
      throw new Error("CENTRAL_COMERCIAL_SEM_ACESSO_A_NEGOCIO");
    }

    return {
      user,
      stores,
    };
  }

  private async loadFlows(
    opportunityIds: string[],
  ): Promise<Map<string, RawRow>> {
    const result = new Map<string, RawRow>();

    if (opportunityIds.length === 0) {
      return result;
    }

    const placeholders =
      opportunityIds.map(() => "?").join(", ");

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT *
          FROM commercial_flows
          WHERE opportunity_id IN (${placeholders})
          ORDER BY updatedAt DESC
        `,
        opportunityIds,
      );

    for (const row of rows) {
      const opportunityId =
        text(row.opportunity_id);

      if (
        opportunityId &&
        !result.has(opportunityId)
      ) {
        result.set(
          opportunityId,
          row,
        );
      }
    }

    return result;
  }

  private async loadCustomers(
    userIds: string[],
  ): Promise<Map<string, RawRow>> {
    const result = new Map<string, RawRow>();

    const ids = Array.from(
      new Set(
        userIds
          .map(text)
          .filter(Boolean),
      ),
    );

    if (ids.length === 0) {
      return result;
    }

    const placeholders =
      ids.map(() => "?").join(", ");

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT
          id,
          name,
          email,
          telefone,
          tipo,
          condominio_id,
          foto_perfil_url
          FROM usuarios
          WHERE id IN (${placeholders})
        `,
        ids,
      );

    for (const row of rows) {
      result.set(
        text(row.id),
        row,
      );
    }

    return result;
  }

  private async loadCampaigns(
    campaignIds: number[],
  ): Promise<Map<number, RawRow>> {
    const result = new Map<number, RawRow>();

    const ids = Array.from(
      new Set(
        campaignIds
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0,
          ),
      ),
    );

    if (ids.length === 0) {
      return result;
    }

    const placeholders =
      ids.map(() => "?").join(", ");

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT *
          FROM marketing_campanhas
          WHERE id IN (${placeholders})
        `,
        ids,
      );

    for (const row of rows) {
      result.set(
        Number(row.id),
        row,
      );
    }

    return result;
  }

  private async loadCatalogItems(
    itemIds: string[],
  ): Promise<Map<string, RawRow>> {
    const result = new Map<string, RawRow>();

    const ids = Array.from(
      new Set(
        itemIds
          .map(text)
          .filter(Boolean),
      ),
    );

    if (ids.length === 0) {
      return result;
    }

    const placeholders =
      ids.map(() => "?").join(", ");

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT *
          FROM business_catalog_items
          WHERE id IN (${placeholders})
        `,
        ids,
      );

    for (const row of rows) {
      result.set(
        text(row.id),
        row,
      );
    }

    return result;
  }

  private async loadAnswerCounts(
    opportunityIds: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    if (opportunityIds.length === 0) {
      return result;
    }

    const placeholders =
      opportunityIds.map(() => "?").join(", ");

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT
            opportunity_id,
            COUNT(*) AS total
          FROM marketing_opportunity_answers
          WHERE opportunity_id IN (${placeholders})
          GROUP BY opportunity_id
        `,
        opportunityIds,
      );

    for (const row of rows) {
      result.set(
        text(row.opportunity_id),
        integer(row.total),
      );
    }

    return result;
  }

  private async loadConversations(
    conversationIds: string[],
  ): Promise<Map<string, RawRow>> {
    const result = new Map<string, RawRow>();

    const ids = Array.from(
      new Set(
        conversationIds
          .map(text)
          .filter(Boolean),
      ),
    );

    if (ids.length === 0) {
      return result;
    }

    const placeholders =
      ids.map(() => "?").join(", ");

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT
            id,
            userId,
            userName,
            userType,
            condominioId,
            chatbot_tipo,
            chatbot_owner_id,
            origem,
            status,
            atendente_id,
            updatedAt
          FROM chat_conversations
          WHERE id IN (${placeholders})
        `,
        ids,
      );

    for (const row of rows) {
      result.set(
        text(row.id),
        row,
      );
    }

    return result;
  }

  private buildFlow(
    row?: RawRow,
  ): CentralComercialFlow {
    return {
      flowId:
        nullableText(row?.id),

      state:
        nullableText(row?.state),

      type:
        nullableText(
          row?.catalog_item_type,
        ),

      amount:
        numberOrNull(row?.amount),

      quantity:
        integer(row?.quantity, 1),

      totalSessions:
        numberOrNull(
          row?.total_sessions,
        ),

      solicitacaoId:
        nullableText(
          row?.solicitacao_id,
        ),

      candidaturaId:
        nullableText(
          row?.candidatura_id,
        ),

      ofertaId:
        nullableText(
          row?.oferta_id,
        ),

      orderId:
        nullableText(
          row?.order_id,
        ),

      paymentId:
        nullableText(
          row?.payment_id,
        ),

      agendaId:
        nullableText(
          row?.agenda_id,
        ),

      preferredDate:
        nullableText(
          row?.preferred_date,
        ),

      preferredTime:
        nullableText(
          row?.preferred_time,
        ),

      ativo:
        boolOrNull(row?.ativo),
    };
  }

  private buildConversation(
    row?: RawRow,
  ): CentralComercialConversation {
    const status =
      nullableText(row?.status) as
      CentralComercialConversation["status"];

    return {
      conversationId:
        nullableText(row?.id),

      status,

      origem:
        nullableText(row?.origem),

      waitingHuman:
        status ===
        "AGUARDANDO_ATENDENTE",

      atendenteId:
        nullableText(
          row?.atendente_id,
        ),

      updatedAt:
        iso(row?.updatedAt),
    };
  }

  private buildCampaign(
    campaignId: number | null,
    row?: RawRow,
  ): CentralComercialCampaign {
    return {
      id:
        campaignId,

      name:
        nullableText(row?.nome),

      status:
        nullableText(row?.status),

      destinationType:
        nullableText(
          row?.destino_tipo,
        ),

      scheduledAt:
        iso(row?.data_agendamento),

      totalRecipients:
        integer(
          row?.total_destinatarios,
        ),

      totalSent:
        integer(
          row?.total_enviados,
        ),

      totalDelivered:
        integer(
          row?.total_entregues,
        ),

      totalRead:
        integer(
          row?.total_lidos,
        ),

      totalFailures:
        integer(
          row?.total_falhas,
        ),
    };
  }

  async list(
    auth: AuthenticatedPartner,
    filters: CentralComercialFilters = {},
  ): Promise<CentralComercialListResponse> {
    const {
      stores,
    } = await this.requirePartner(auth);

    const page =
      Math.max(
        1,
        integer(filters.page, 1),
      );

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          integer(filters.limit, 25),
        ),
      );

    if (stores.length === 0) {
      return {
        summary:
          emptySummary(),

        items: [],

        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const storeMap =
      new Map<string, RawRow>();

    for (const store of stores) {
      storeMap.set(
        text(store.id),
        store,
      );
    }

    const storeIds =
      Array.from(storeMap.keys());

    const storePlaceholders =
      storeIds.map(() => "?").join(", ");

    /*
     * Segurança:
     * A oportunidade só entra na Central se selected_store_id pertencer
     * a um store resolvido pelo usuário autenticado.
     *
     * Não confiamos em storeId enviado pelo navegador.
     */
    const opportunities: RawRow[] =
      await AppDataSource.query(
        `
          SELECT *
          FROM marketing_opportunities
          WHERE selected_store_id IN (${storePlaceholders})
          ORDER BY updatedAt DESC
        `,
        storeIds,
      );

    const opportunityIds =
      opportunities
        .map((row) => text(row.id))
        .filter(Boolean);

    const [
      flows,
      campaigns,
      answerCounts,
      catalogItems,
    ] = await Promise.all([
      this.loadFlows(
        opportunityIds,
      ),

      this.loadCampaigns(
        opportunities
          .map(
            (row) =>
              Number(row.campanha_id),
          )
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0,
          ),
      ),

      this.loadAnswerCounts(
        opportunityIds,
      ),

      this.loadCatalogItems(
        opportunities
          .map(
            (row) =>
              text(row.catalog_item_id),
          )
          .filter(Boolean),
      ),
    ]);

    const customerIds =
      Array.from(
        new Set(
          opportunities
            .map((opportunity) => {
              const flow =
                flows.get(
                  text(opportunity.id),
                );

              return text(
                flow?.customer_user_id ||
                opportunity.user_id,
              );
            })
            .filter(Boolean),
        ),
      );

    const customers =
      await this.loadCustomers(
        customerIds,
      );

    const destinationConversationIds =
      opportunities
        .map(
          (row) =>
            text(
              row.destination_conversation_id,
            ),
        )
        .filter(Boolean);

    const conversations =
      await this.loadConversations(
        destinationConversationIds,
      );

    const normalized: CentralComercialOpportunity[] =
      opportunities.map(
        (opportunity) => {
          const opportunityId =
            text(opportunity.id);

          const storeId =
            text(
              opportunity.selected_store_id,
            );

          const store =
            storeMap.get(storeId);

          const flowRow =
            flows.get(opportunityId);

          const flow =
            this.buildFlow(flowRow);

          const customerId =
            text(
              flowRow?.customer_user_id ||
              opportunity.user_id,
            );

          const customer =
            customers.get(customerId);

          const destinationConversationId =
            text(
              opportunity
                .destination_conversation_id,
            );

          const conversationRow =
            conversations.get(
              destinationConversationId,
            );

          const campaignId =
            numberOrNull(
              opportunity.campanha_id,
            );

          const campaign =
            this.buildCampaign(
              campaignId,
              campaignId
                ? campaigns.get(
                  campaignId,
                )
                : undefined,
            );

          const catalogItemId =
            nullableText(
              opportunity.catalog_item_id,
            );

          const catalog =
            catalogItemId
              ? catalogItems.get(
                catalogItemId,
              )
              : undefined;

          const rawChannel =
            nullableText(
              opportunity.canal_origem,
            ) ||
            nullableText(
              conversationRow?.origem,
            );

          const stage =
            mapStage(
              opportunity.status,
              flow.state,
            );

          return {
            id:
              opportunityId,

            status:
              text(
                opportunity.status,
              ),

            stage,

            customer: {
              userId:
                customerId || null,

              name:
                nullableText(
                  customer?.name,
                ),

              email:
                nullableText(
                  customer?.email,
                ),

              phone:
                nullableText(
                  customer?.telefone,
                ),

              userType:
                nullableText(
                  customer?.tipo,
                ),

              condominioId:
                nullableText(
                  customer?.condominio_id,
                ),

              photoUrl:
                nullableText(
                  customer?.foto_perfil_url,
                ),
            },

            business: {
              storeId,

              storeName:
                nullableText(
                  opportunity
                    .selected_store_name,
                ) ||
                nullableText(
                  store?.name,
                ),

              storeSlug:
                nullableText(
                  opportunity
                    .selected_store_slug,
                ) ||
                nullableText(
                  store?.slug,
                ),

              chatbotTipo:
                (
                  nullableText(
                    opportunity
                      .selected_chatbot_tipo,
                  ) ||
                  (
                    text(store?.tipo)
                      .toLowerCase() ===
                      "loja"
                      ? "LOJA"
                      : "PRESTADOR"
                  )
                ) as
                | "LOJA"
                | "PRESTADOR",
            },

            origin: {
              channel:
                normalizeChannel(
                  rawChannel,
                ),

              rawChannel,

              campaignId,

              campaignName:
                campaign.name,

              sourceConversationId:
                text(
                  opportunity
                    .source_conversation_id,
                ),

              destinationConversationId:
                destinationConversationId ||
                null,
            },

            interest: {
              categoryId:
                numberOrNull(
                  opportunity.categoria_id,
                ),

              catalogItemId,

              catalogItemName:
                nullableText(
                  opportunity
                    .catalog_item_name,
                ) ||
                nullableText(
                  catalog?.nome,
                ),

              catalogItemType:
                nullableText(
                  opportunity
                    .catalog_item_type,
                ) ||
                nullableText(
                  catalog?.tipo,
                ),

              catalogItemPrice:
                numberOrNull(
                  opportunity
                    .catalog_item_price ??
                  catalog?.preco,
                ),

              catalogItemPromotionalPrice:
                numberOrNull(
                  opportunity
                    .catalog_item_promotional_price ??
                  catalog?.precoPromocional ??
                  catalog?.preco_promocional,
                ),

              qualificationScore:
                integer(
                  opportunity.score,
                ),

              qualificationSummary:
                nullableText(
                  opportunity
                    .resumo_qualificacao,
                ),

              answersCount:
                answerCounts.get(
                  opportunityId,
                ) || 0,
            },

            flow,

            conversation:
              this.buildConversation(
                conversationRow,
              ),

            campaign,

            createdAt:
              iso(
                opportunity.createdAt,
              ) || "",

            updatedAt:
              iso(
                opportunity.updatedAt,
              ) || "",

            qualificationStartedAt:
              iso(
                opportunity
                  .qualificacao_iniciada_em,
              ),

            qualificationCompletedAt:
              iso(
                opportunity
                  .qualificacao_concluida_em,
              ),

            optionsPresentedAt:
              iso(
                opportunity
                  .opcoes_apresentadas_em,
              ),

            businessSelectedAt:
              iso(
                opportunity
                  .negocio_selecionado_em,
              ),

            businessAccessedAt:
              iso(
                opportunity
                  .negocio_acessado_em,
              ),

            negotiationStartedAt:
              iso(
                opportunity
                  .negociacao_iniciada_em,
              ),

            convertedAt:
              iso(
                opportunity
                  .convertido_em,
              ),

            lostAt:
              iso(
                opportunity
                  .perdido_em,
              ),
          };
        },
      );

    /*
     * Resumo é calculado ANTES da paginação.
     * Assim os cards do dashboard representam todo o conjunto filtrado.
     */
    let filtered =
      normalized;

    if (filters.stage) {
      filtered =
        filtered.filter(
          (item) =>
            item.stage ===
            filters.stage,
        );
    }

    if (filters.channel) {
      filtered =
        filtered.filter(
          (item) =>
            item.origin.channel ===
            filters.channel,
        );
    }

    if (
      filters.campaignId &&
      Number(filters.campaignId) > 0
    ) {
      filtered =
        filtered.filter(
          (item) =>
            item.origin.campaignId ===
            Number(
              filters.campaignId,
            ),
        );
    }

    const search =
      text(filters.search)
        .toLowerCase();

    if (search) {
      filtered =
        filtered.filter(
          (item) => {
            const haystack = [
              item.customer.name,
              item.customer.email,
              item.customer.phone,
              item.business.storeName,
              item.interest
                .catalogItemName,
              item.interest
                .qualificationSummary,
              item.campaign.name,
              item.origin.rawChannel,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(
              search,
            );
          },
        );
    }

    const summary =
      emptySummary();

    for (const item of filtered) {
      addSummary(
        summary,
        item,
      );
    }

    const total =
      filtered.length;

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
          total / limit,
        );

    const offset =
      (page - 1) * limit;

    const items =
      filtered.slice(
        offset,
        offset + limit,
      );

    return {
      summary,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getById(
    auth: AuthenticatedPartner,
    opportunityId: string,
  ): Promise<CentralComercialOpportunity | null> {
    const normalizedId =
      text(opportunityId);

    if (!normalizedId) {
      throw new Error(
        "CENTRAL_COMERCIAL_OPORTUNIDADE_OBRIGATORIA",
      );
    }

    /*
     * IMPORTANTE:
     * Esta consulta é direta por ID e mantém a mesma autorização usada
     * pela listagem: a oportunidade só pode ser vista se selected_store_id
     * pertencer a um store do parceiro autenticado.
     *
     * Não usamos mais list({ limit: 100 }), portanto uma oportunidade antiga
     * continua acessível mesmo quando o parceiro possuir mais de 100 registros.
     */
    const {
      stores,
    } = await this.requirePartner(auth);

    if (stores.length === 0) {
      return null;
    }

    const storeMap =
      new Map<string, RawRow>();

    for (const store of stores) {
      storeMap.set(
        text(store.id),
        store,
      );
    }

    const storeIds =
      Array.from(
        storeMap.keys(),
      );

    if (storeIds.length === 0) {
      return null;
    }

    const storePlaceholders =
      storeIds.map(() => "?").join(", ");

    const rows: RawRow[] =
      await AppDataSource.query(
        `
          SELECT *
          FROM marketing_opportunities
          WHERE id = ?
            AND selected_store_id IN (${storePlaceholders})
          LIMIT 1
        `,
        [
          normalizedId,
          ...storeIds,
        ],
      );

    const opportunity =
      rows[0];

    if (!opportunity) {
      /*
       * Retornamos null tanto para inexistente quanto para oportunidade
       * pertencente a outro parceiro. Assim o endpoint não revela a existência
       * de oportunidades de terceiros.
       */
      return null;
    }

    const opportunityIds = [
      normalizedId,
    ];

    const [
      flows,
      campaigns,
      answerCounts,
      catalogItems,
    ] = await Promise.all([
      this.loadFlows(
        opportunityIds,
      ),

      this.loadCampaigns(
        Number(opportunity.campanha_id) > 0
          ? [Number(opportunity.campanha_id)]
          : [],
      ),

      this.loadAnswerCounts(
        opportunityIds,
      ),

      this.loadCatalogItems(
        text(opportunity.catalog_item_id)
          ? [text(opportunity.catalog_item_id)]
          : [],
      ),
    ]);

    const flowRow =
      flows.get(
        normalizedId,
      );

    const customerId =
      text(
        flowRow?.customer_user_id ||
        opportunity.user_id,
      );

    const customers =
      await this.loadCustomers(
        customerId
          ? [customerId]
          : [],
      );

    const destinationConversationId =
      text(
        opportunity
          .destination_conversation_id,
      );

    const conversations =
      await this.loadConversations(
        destinationConversationId
          ? [destinationConversationId]
          : [],
      );

    const storeId =
      text(
        opportunity.selected_store_id,
      );

    const store =
      storeMap.get(
        storeId,
      );

    /*
     * A query acima já garantiu que selected_store_id pertence ao parceiro.
     * A checagem abaixo é defesa adicional contra inconsistência de dados.
     */
    if (!store) {
      return null;
    }

    const flow =
      this.buildFlow(
        flowRow,
      );

    const customer =
      customers.get(
        customerId,
      );

    const conversationRow =
      conversations.get(
        destinationConversationId,
      );

    const campaignId =
      numberOrNull(
        opportunity.campanha_id,
      );

    const campaign =
      this.buildCampaign(
        campaignId,
        campaignId
          ? campaigns.get(
            campaignId,
          )
          : undefined,
      );

    const catalogItemId =
      nullableText(
        opportunity.catalog_item_id,
      );

    const catalog =
      catalogItemId
        ? catalogItems.get(
          catalogItemId,
        )
        : undefined;

    const rawChannel =
      nullableText(
        opportunity.canal_origem,
      ) ||
      nullableText(
        conversationRow?.origem,
      );

    const stage =
      mapStage(
        opportunity.status,
        flow.state,
      );

    return {
      id:
        normalizedId,

      status:
        text(
          opportunity.status,
        ),

      stage,

      customer: {
        userId:
          customerId || null,

        name:
          nullableText(
            customer?.name,
          ),

        email:
          nullableText(
            customer?.email,
          ),

        phone:
          nullableText(
            customer?.telefone,
          ),

        userType:
          nullableText(
            customer?.tipo,
          ),

        condominioId:
          nullableText(
            customer?.condominio_id,
          ),

        photoUrl:
          nullableText(
            customer?.foto_perfil_url,
          ),
      },
      business: {
        storeId,

        storeName:
          nullableText(
            opportunity
              .selected_store_name,
          ) ||
          nullableText(
            store?.name,
          ),

        storeSlug:
          nullableText(
            opportunity
              .selected_store_slug,
          ) ||
          nullableText(
            store?.slug,
          ),

        chatbotTipo:
          (
            nullableText(
              opportunity
                .selected_chatbot_tipo,
            ) ||
            (
              text(store?.tipo)
                .toLowerCase() ===
                "loja"
                ? "LOJA"
                : "PRESTADOR"
            )
          ) as
          | "LOJA"
          | "PRESTADOR",
      },

      origin: {
        channel:
          normalizeChannel(
            rawChannel,
          ),

        rawChannel,

        campaignId,

        campaignName:
          campaign.name,

        sourceConversationId:
          text(
            opportunity
              .source_conversation_id,
          ),

        destinationConversationId:
          destinationConversationId ||
          null,
      },

      interest: {
        categoryId:
          numberOrNull(
            opportunity.categoria_id,
          ),

        catalogItemId,

        catalogItemName:
          nullableText(
            opportunity
              .catalog_item_name,
          ) ||
          nullableText(
            catalog?.nome,
          ),

        catalogItemType:
          nullableText(
            opportunity
              .catalog_item_type,
          ) ||
          nullableText(
            catalog?.tipo,
          ),

        catalogItemPrice:
          numberOrNull(
            opportunity
              .catalog_item_price ??
            catalog?.preco,
          ),

        catalogItemPromotionalPrice:
          numberOrNull(
            opportunity
              .catalog_item_promotional_price ??
            catalog?.precoPromocional ??
            catalog?.preco_promocional,
          ),

        qualificationScore:
          integer(
            opportunity.score,
          ),

        qualificationSummary:
          nullableText(
            opportunity
              .resumo_qualificacao,
          ),

        answersCount:
          answerCounts.get(
            normalizedId,
          ) || 0,
      },

      flow,

      conversation:
        this.buildConversation(
          conversationRow,
        ),

      campaign,

      createdAt:
        iso(
          opportunity.createdAt,
        ) || "",

      updatedAt:
        iso(
          opportunity.updatedAt,
        ) || "",

      qualificationStartedAt:
        iso(
          opportunity
            .qualificacao_iniciada_em,
        ),

      qualificationCompletedAt:
        iso(
          opportunity
            .qualificacao_concluida_em,
        ),

      optionsPresentedAt:
        iso(
          opportunity
            .opcoes_apresentadas_em,
        ),

      businessSelectedAt:
        iso(
          opportunity
            .negocio_selecionado_em,
        ),

      businessAccessedAt:
        iso(
          opportunity
            .negocio_acessado_em,
        ),

      negotiationStartedAt:
        iso(
          opportunity
            .negociacao_iniciada_em,
        ),

      convertedAt:
        iso(
          opportunity
            .convertido_em,
        ),

      lostAt:
        iso(
          opportunity
            .perdido_em,
        ),
    };
  }
}

export default CentralComercialService;