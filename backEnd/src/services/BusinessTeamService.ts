import { AppDataSource } from "../config/data-source";
import BusinessTeamMember, {
  BusinessTeamMemberRole,
} from "../models/BusinessTeamMemberModel";
import { Usuario } from "../models/UserModels";

export type BusinessPermission =
  | "CHAT"
  | "CENTRAL_COMERCIAL"
  | "AGENDA"
  | "ORDERS"
  | "CATALOG"
  | "FINANCE"
  | "SETTINGS";

export type BusinessAccess = {
  storeId: string;
  userId: string;
  isOwner: boolean;
  role: BusinessTeamMemberRole;
  memberId: string | null;
  permissions: {
    chat: boolean;
    centralComercial: boolean;
    agenda: boolean;
    orders: boolean;
    catalog: boolean;
    finance: boolean;
    settings: boolean;
  };
};

type AddMemberInput = {
  storeId: string;
  actorUserId: string;
  email: string;
  role?: BusinessTeamMemberRole;
  canChat?: boolean;
  canCentralComercial?: boolean;
  canAgenda?: boolean;
  canOrders?: boolean;
  canCatalog?: boolean;
  canFinance?: boolean;
  canSettings?: boolean;
};

type UpdateMemberInput = {
  storeId: string;
  actorUserId: string;
  memberId: string;
  role?: BusinessTeamMemberRole;
  canChat?: boolean;
  canCentralComercial?: boolean;
  canAgenda?: boolean;
  canOrders?: boolean;
  canCatalog?: boolean;
  canFinance?: boolean;
  canSettings?: boolean;
  active?: boolean;
};

const normalizeId = (value: unknown): string =>
  String(value || "").trim();

const normalizeEmail = (value: unknown): string =>
  String(value || "").trim().toLowerCase();

class BusinessTeamService {
  private memberRepo() {
    return AppDataSource.getRepository(BusinessTeamMember);
  }

  private userRepo() {
    return AppDataSource.getRepository(Usuario);
  }

  /**
   * Resolve os IDs que historicamente podem aparecer em stores.usuarioId
   * para um mesmo usuário autenticado:
   * - usuarios.id
   * - perfil_prestador.id do mesmo usuarioId
   *
   * Não usa relation TypeORM para não depender do join histórico Store/PerfilPrestador.
   */
  private async resolveOwnerReferenceIds(userId: string): Promise<string[]> {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];

    const rows: any[] = await AppDataSource.query(
      `
      SELECT id
      FROM perfil_prestador
      WHERE usuarioId = ?
      `,
      [normalizedUserId],
    );

    const ids = new Set<string>([normalizedUserId]);

    for (const row of rows || []) {
      const id = normalizeId(row?.id);
      if (id) ids.add(id);
    }

    return Array.from(ids);
  }

  private async isStoreOwner(
    storeId: string,
    userId: string,
  ): Promise<boolean> {
    const normalizedStoreId = normalizeId(storeId);
    const normalizedUserId = normalizeId(userId);

    if (!normalizedStoreId || !normalizedUserId) return false;

    const ownerReferenceIds =
      await this.resolveOwnerReferenceIds(normalizedUserId);

    if (!ownerReferenceIds.length) return false;

    const placeholders = ownerReferenceIds.map(() => "?").join(",");

    const rows: any[] = await AppDataSource.query(
      `
      SELECT id
      FROM stores
      WHERE id = ?
        AND usuarioId IN (${placeholders})
      LIMIT 1
      `,
      [normalizedStoreId, ...ownerReferenceIds],
    );

    return Boolean(rows?.length);
  }

  private ownerAccess(storeId: string, userId: string): BusinessAccess {
    return {
      storeId,
      userId,
      isOwner: true,
      role: BusinessTeamMemberRole.OWNER,
      memberId: null,
      permissions: {
        chat: true,
        centralComercial: true,
        agenda: true,
        orders: true,
        catalog: true,
        finance: true,
        settings: true,
      },
    };
  }

  private memberAccess(member: BusinessTeamMember): BusinessAccess {
    return {
      storeId: member.storeId,
      userId: member.userId,
      isOwner: false,
      role: member.role,
      memberId: member.id,
      permissions: {
        chat: Boolean(member.canChat),
        centralComercial: Boolean(member.canCentralComercial),
        agenda: Boolean(member.canAgenda),
        orders: Boolean(member.canOrders),
        catalog: Boolean(member.canCatalog),
        finance: Boolean(member.canFinance),
        settings: Boolean(member.canSettings),
      },
    };
  }

  async resolveAccess(
    storeId: string,
    userId: string,
  ): Promise<BusinessAccess | null> {
    const normalizedStoreId = normalizeId(storeId);
    const normalizedUserId = normalizeId(userId);

    if (!normalizedStoreId || !normalizedUserId) return null;

    if (await this.isStoreOwner(normalizedStoreId, normalizedUserId)) {
      return this.ownerAccess(normalizedStoreId, normalizedUserId);
    }

    const member = await this.memberRepo().findOne({
      where: {
        storeId: normalizedStoreId,
        userId: normalizedUserId,
        active: true,
      },
    });

    if (!member) return null;

    return this.memberAccess(member);
  }

  /**
   * Retorna todos os negócios aos quais o usuário autenticado possui acesso.
   *
   * Segurança:
   * - o userId vem do JWT no controller;
   * - o frontend não informa quais negócios pertencem ao usuário;
   * - considera tanto negócios próprios quanto memberships ativas;
   * - em caso de duplicidade, o acesso de OWNER prevalece.
   *
   * Esse endpoint é a base da Central de Atendimento sem ?storeId=...
   */
  async myBusinesses(userId: string) {
    const normalizedUserId = normalizeId(userId);

    if (!normalizedUserId) {
      const error: any = new Error("Usuário autenticado inválido.");
      error.statusCode = 401;
      throw error;
    }

    const result = new Map<string, any>();

    // ----------------------------------------------------------
    // 1. Negócios dos quais o usuário é proprietário
    // ----------------------------------------------------------
    const ownerReferenceIds =
      await this.resolveOwnerReferenceIds(normalizedUserId);

    if (ownerReferenceIds.length > 0) {
      const placeholders = ownerReferenceIds.map(() => "?").join(",");

      const ownedStores: any[] = await AppDataSource.query(
        `
          SELECT
            id,
            name,
            slug,
            tipo,
            ativa
          FROM stores
          WHERE usuarioId IN (${placeholders})
            AND COALESCE(ativa, 1) = 1
          ORDER BY name ASC
        `,
        ownerReferenceIds,
      );

      for (const store of ownedStores || []) {
        const storeId = normalizeId(store?.id);
        if (!storeId) continue;

        result.set(storeId, {
          store: {
            id: storeId,
            name: store?.name || null,
            slug: store?.slug || null,
            tipo: store?.tipo || null,
            ativa: Boolean(Number(store?.ativa ?? 1)),
          },
          access: this.ownerAccess(storeId, normalizedUserId),
        });
      }
    }

    // ----------------------------------------------------------
    // 2. Negócios em que o usuário é membro ativo da equipe
    // ----------------------------------------------------------
    const memberships = await this.memberRepo().find({
      where: {
        userId: normalizedUserId,
        active: true,
      },
      order: {
        createdAt: "ASC",
      },
    });

    const membershipByStoreId = new Map<string, BusinessTeamMember>();

    for (const member of memberships || []) {
      const storeId = normalizeId(member?.storeId);
      if (!storeId) continue;

      // Se já é OWNER, não substitui por membership.
      if (result.has(storeId)) continue;

      membershipByStoreId.set(storeId, member);
    }

    const memberStoreIds = Array.from(membershipByStoreId.keys());

    if (memberStoreIds.length > 0) {
      const placeholders = memberStoreIds.map(() => "?").join(",");

      const memberStores: any[] = await AppDataSource.query(
        `
          SELECT
            id,
            name,
            slug,
            tipo,
            ativa
          FROM stores
          WHERE id IN (${placeholders})
            AND COALESCE(ativa, 1) = 1
          ORDER BY name ASC
        `,
        memberStoreIds,
      );

      for (const store of memberStores || []) {
        const storeId = normalizeId(store?.id);
        const member = membershipByStoreId.get(storeId);

        if (!storeId || !member || result.has(storeId)) continue;

        result.set(storeId, {
          store: {
            id: storeId,
            name: store?.name || null,
            slug: store?.slug || null,
            tipo: store?.tipo || null,
            ativa: Boolean(Number(store?.ativa ?? 1)),
          },
          access: this.memberAccess(member),
        });
      }
    }

    return Array.from(result.values()).sort((a, b) =>
      String(a?.store?.name || "").localeCompare(
        String(b?.store?.name || ""),
        "pt-BR",
      ),
    );
  }

  async requireAccess(
    storeId: string,
    userId: string,
  ): Promise<BusinessAccess> {
    const access = await this.resolveAccess(storeId, userId);

    if (!access) {
      const error: any = new Error(
        "Você não pertence à equipe deste negócio.",
      );
      error.statusCode = 403;
      throw error;
    }

    return access;
  }

  async requirePermission(
    storeId: string,
    userId: string,
    permission: BusinessPermission,
  ): Promise<BusinessAccess> {
    const access = await this.requireAccess(storeId, userId);

    const allowed =
      permission === "CHAT"
        ? access.permissions.chat
        : permission === "CENTRAL_COMERCIAL"
          ? access.permissions.centralComercial
          : permission === "AGENDA"
            ? access.permissions.agenda
            : permission === "ORDERS"
              ? access.permissions.orders
              : permission === "CATALOG"
                ? access.permissions.catalog
                : permission === "FINANCE"
                  ? access.permissions.finance
                  : access.permissions.settings;

    if (!allowed) {
      const error: any = new Error(
        "Você não possui permissão para executar esta ação.",
      );
      error.statusCode = 403;
      throw error;
    }

    return access;
  }

  private async requireCanManageTeam(
    storeId: string,
    actorUserId: string,
  ): Promise<BusinessAccess> {
    const access = await this.requireAccess(storeId, actorUserId);

    if (
      access.isOwner ||
      access.role === BusinessTeamMemberRole.MANAGER ||
      access.permissions.settings
    ) {
      return access;
    }

    const error: any = new Error(
      "Você não possui permissão para administrar a equipe.",
    );
    error.statusCode = 403;
    throw error;
  }

  async listMembers(storeId: string, actorUserId: string) {
    await this.requireCanManageTeam(storeId, actorUserId);

    const members = await this.memberRepo().find({
      where: { storeId: normalizeId(storeId) },
      order: { createdAt: "ASC" },
    });

    const userIds = Array.from(
      new Set(
        members
          .map((member) => normalizeId(member.userId))
          .filter(Boolean),
      ),
    );

    const users =
      userIds.length === 0
        ? []
        : await this.userRepo()
            .createQueryBuilder("u")
            .select(["u.id", "u.name", "u.email", "u.tipo"])
            .where("u.id IN (:...ids)", { ids: userIds })
            .getMany();

    const userMap = new Map(
      users.map((user: any) => [String(user.id), user]),
    );

    return members.map((member) => {
      const user: any = userMap.get(String(member.userId));

      return {
        id: member.id,
        storeId: member.storeId,
        userId: member.userId,
        name: user?.name || null,
        email: user?.email || null,
        userType: user?.tipo || null,
        role: member.role,
        permissions: {
          chat: Boolean(member.canChat),
          centralComercial: Boolean(member.canCentralComercial),
          agenda: Boolean(member.canAgenda),
          orders: Boolean(member.canOrders),
          catalog: Boolean(member.canCatalog),
          finance: Boolean(member.canFinance),
          settings: Boolean(member.canSettings),
        },
        active: Boolean(member.active),
        acceptedAt: member.acceptedAt,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      };
    });
  }

  /**
   * Regra de elegibilidade para ATTENDANT:
   * - aceita MORADOR ou VISITANTE;
   * - rejeita PRESTADOR/EMPREENDEDOR;
   * - rejeita qualquer usuário que já seja proprietário de alguma Store,
   *   inclusive no formato legado via perfil_prestador.id.
   *
   * MANAGER permanece fora desta regra por enquanto, pois é uma função
   * administrativa que deve ser tratada explicitamente pelo proprietário.
   */
  private async assertEligibleAttendant(user: Usuario): Promise<void> {
    const userId = normalizeId((user as any).id);
    const userType = String((user as any).tipo || "").trim().toUpperCase();
    const isEmpreendedor = Number((user as any).is_empreendedor || 0) === 1;
    const isPrestador = Number((user as any).is_prestador || 0) === 1;

    if (!userId) {
      const error: any = new Error("Usuário inválido para associação.");
      error.statusCode = 400;
      throw error;
    }

    if (userType !== "MORADOR" && userType !== "VISITANTE") {
      const error: any = new Error(
        "Somente moradores ou visitantes sem negócio próprio podem ser associados como Atendente.",
      );
      error.statusCode = 409;
      throw error;
    }

    if (isEmpreendedor || isPrestador) {
      const error: any = new Error(
        "Este usuário possui vínculo como empreendedor ou prestador e não pode ser associado como Atendente.",
      );
      error.statusCode = 409;
      throw error;
    }

    const ownerReferenceIds = await this.resolveOwnerReferenceIds(userId);

    if (ownerReferenceIds.length > 0) {
      const placeholders = ownerReferenceIds.map(() => "?").join(",");

      const ownedStores: any[] = await AppDataSource.query(
        `
          SELECT id
          FROM stores
          WHERE usuarioId IN (${placeholders})
          LIMIT 1
        `,
        ownerReferenceIds,
      );

      if (ownedStores?.length) {
        const error: any = new Error(
          "Este usuário já possui um negócio próprio no GranConecta e não pode ser associado como Atendente.",
        );
        error.statusCode = 409;
        throw error;
      }
    }
  }

  /**
   * Lista pessoas já cadastradas que podem ser escolhidas pelo proprietário
   * na futura tela Equipe. Não cria vínculo; apenas retorna candidatos.
   *
   * A validação definitiva continua sendo feita em addMember(), portanto
   * ninguém consegue contornar a regra chamando a API diretamente.
   */
  async listEligibleAttendants(
    storeId: string,
    actorUserId: string,
    search?: string,
  ) {
    await this.requireCanManageTeam(storeId, actorUserId);

    const normalizedSearch = String(search || "").trim().toLowerCase();
    const params: any[] = [];

    let searchSql = "";

    if (normalizedSearch) {
      searchSql = `
        AND (
          LOWER(u.name) LIKE ?
          OR LOWER(u.email) LIKE ?
        )
      `;
      const like = `%${normalizedSearch}%`;
      params.push(like, like);
    }

    const rows: any[] = await AppDataSource.query(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.tipo,
          u.is_empreendedor,
          u.is_prestador
        FROM usuarios u
        WHERE UPPER(u.tipo) IN ('MORADOR', 'VISITANTE')
          AND COALESCE(u.is_empreendedor, 0) = 0
          AND COALESCE(u.is_prestador, 0) = 0
          ${searchSql}
        ORDER BY u.name ASC
        LIMIT 100
      `,
      params,
    );

    const result: any[] = [];

    for (const user of rows || []) {
      const candidateUserId = normalizeId(user?.id);
      if (!candidateUserId) continue;

      const ownerReferenceIds =
        await this.resolveOwnerReferenceIds(candidateUserId);

      const placeholders = ownerReferenceIds.map(() => "?").join(",");

      const ownedStores: any[] = ownerReferenceIds.length
        ? await AppDataSource.query(
            `
              SELECT id
              FROM stores
              WHERE usuarioId IN (${placeholders})
              LIMIT 1
            `,
            ownerReferenceIds,
          )
        : [];

      if (ownedStores?.length) continue;

      const existing = await this.memberRepo().findOne({
        where: {
          storeId: normalizeId(storeId),
          userId: candidateUserId,
          active: true,
        },
      });

      if (existing) continue;

      result.push({
        id: candidateUserId,
        name: user?.name || null,
        email: user?.email || null,
        tipo: user?.tipo || null,
        isEmpreendedor: Boolean(Number(user?.is_empreendedor || 0)),
        isPrestador: Boolean(Number(user?.is_prestador || 0)),
      });
    }

    return result;
  }

  async addMember(input: AddMemberInput) {
    const storeId = normalizeId(input.storeId);
    const actorUserId = normalizeId(input.actorUserId);
    const email = normalizeEmail(input.email);

    if (!storeId || !actorUserId) {
      const error: any = new Error("Negócio ou usuário inválido.");
      error.statusCode = 400;
      throw error;
    }

    if (!email) {
      const error: any = new Error("Informe o e-mail do usuário.");
      error.statusCode = 400;
      throw error;
    }

    const actorAccess =
      await this.requireCanManageTeam(storeId, actorUserId);

    const requestedRole =
      input.role || BusinessTeamMemberRole.ATTENDANT;

    if (requestedRole === BusinessTeamMemberRole.OWNER) {
      const error: any = new Error(
        "O proprietário do negócio é definido pela própria Store e não pode ser criado como membro da equipe.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      !actorAccess.isOwner &&
      requestedRole === BusinessTeamMemberRole.MANAGER
    ) {
      const error: any = new Error(
        "Somente o proprietário pode cadastrar outro gerente.",
      );
      error.statusCode = 403;
      throw error;
    }

    const user = await this.userRepo()
      .createQueryBuilder("u")
      .where("LOWER(u.email) = :email", { email })
      .getOne();

    if (!user) {
      const error: any = new Error(
        "Nenhum usuário cadastrado foi encontrado com este e-mail.",
      );
      error.statusCode = 404;
      throw error;
    }

    const memberUserId = normalizeId((user as any).id);

    if (requestedRole === BusinessTeamMemberRole.ATTENDANT) {
      await this.assertEligibleAttendant(user);
    }

    if (memberUserId === actorUserId && actorAccess.isOwner) {
      const error: any = new Error(
        "O proprietário já possui acesso total ao negócio.",
      );
      error.statusCode = 409;
      throw error;
    }

    if (await this.isStoreOwner(storeId, memberUserId)) {
      const error: any = new Error(
        "Este usuário já é o proprietário do negócio.",
      );
      error.statusCode = 409;
      throw error;
    }

    const existing = await this.memberRepo().findOne({
      where: {
        storeId,
        userId: memberUserId,
      },
    });

    const defaults =
      requestedRole === BusinessTeamMemberRole.MANAGER
        ? {
            canChat: true,
            canCentralComercial: true,
            canAgenda: true,
            canOrders: true,
            canCatalog: true,
            canFinance: false,
            canSettings: true,
          }
        : {
            canChat: true,
            canCentralComercial: true,
            canAgenda: false,
            canOrders: false,
            canCatalog: false,
            canFinance: false,
            canSettings: false,
          };

    const values = {
      role: requestedRole,
      canChat: input.canChat ?? defaults.canChat,
      canCentralComercial:
        input.canCentralComercial ?? defaults.canCentralComercial,
      canAgenda: input.canAgenda ?? defaults.canAgenda,
      canOrders: input.canOrders ?? defaults.canOrders,
      canCatalog: input.canCatalog ?? defaults.canCatalog,
      canFinance: input.canFinance ?? defaults.canFinance,
      canSettings: input.canSettings ?? defaults.canSettings,
      active: true,
      invitedByUserId: actorUserId,
      acceptedAt: new Date(),
    };

    if (existing) {
      Object.assign(existing, values);
      const saved = await this.memberRepo().save(existing);

      return {
        member: saved,
        user: {
          id: (user as any).id,
          name: (user as any).name,
          email: (user as any).email,
          tipo: (user as any).tipo,
        },
        restored: true,
      };
    }

    const member = this.memberRepo().create({
      storeId,
      userId: memberUserId,
      ...values,
    });

    const saved = await this.memberRepo().save(member);

    return {
      member: saved,
      user: {
        id: (user as any).id,
        name: (user as any).name,
        email: (user as any).email,
        tipo: (user as any).tipo,
      },
      restored: false,
    };
  }

  async updateMember(input: UpdateMemberInput) {
    const storeId = normalizeId(input.storeId);
    const actorUserId = normalizeId(input.actorUserId);
    const memberId = normalizeId(input.memberId);

    const actorAccess =
      await this.requireCanManageTeam(storeId, actorUserId);

    const member = await this.memberRepo().findOne({
      where: {
        id: memberId,
        storeId,
      },
    });

    if (!member) {
      const error: any = new Error("Membro da equipe não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    if (input.role === BusinessTeamMemberRole.OWNER) {
      const error: any = new Error(
        "Não é permitido transformar um membro em proprietário por esta rota.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      !actorAccess.isOwner &&
      (member.role === BusinessTeamMemberRole.MANAGER ||
        input.role === BusinessTeamMemberRole.MANAGER)
    ) {
      const error: any = new Error(
        "Somente o proprietário pode alterar permissões de gerentes.",
      );
      error.statusCode = 403;
      throw error;
    }

    if (input.role !== undefined) member.role = input.role;
    if (input.canChat !== undefined) member.canChat = input.canChat;
    if (input.canCentralComercial !== undefined) {
      member.canCentralComercial = input.canCentralComercial;
    }
    if (input.canAgenda !== undefined) member.canAgenda = input.canAgenda;
    if (input.canOrders !== undefined) member.canOrders = input.canOrders;
    if (input.canCatalog !== undefined) member.canCatalog = input.canCatalog;
    if (input.canFinance !== undefined) member.canFinance = input.canFinance;
    if (input.canSettings !== undefined) member.canSettings = input.canSettings;
    if (input.active !== undefined) member.active = input.active;

    return this.memberRepo().save(member);
  }

  async removeMember(
    storeId: string,
    actorUserId: string,
    memberId: string,
  ) {
    const actorAccess =
      await this.requireCanManageTeam(storeId, actorUserId);

    const member = await this.memberRepo().findOne({
      where: {
        id: normalizeId(memberId),
        storeId: normalizeId(storeId),
      },
    });

    if (!member) {
      const error: any = new Error("Membro da equipe não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    if (
      !actorAccess.isOwner &&
      member.role === BusinessTeamMemberRole.MANAGER
    ) {
      const error: any = new Error(
        "Somente o proprietário pode remover um gerente.",
      );
      error.statusCode = 403;
      throw error;
    }

    member.active = false;

    await this.memberRepo().save(member);

    return {
      success: true,
      memberId: member.id,
    };
  }
}

export default new BusinessTeamService();