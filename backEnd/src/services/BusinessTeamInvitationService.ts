import crypto from "crypto";
import { AppDataSource } from "../config/data-source";
import BusinessTeamInvitation, {
  BusinessTeamInvitationStatus,
} from "../models/BusinessTeamInvitationModel";
import BusinessTeamMember, {
  BusinessTeamMemberRole,
} from "../models/BusinessTeamMemberModel";
import { Usuario } from "../models/UserModels";
import BusinessTeamService from "./BusinessTeamService";

type CreateInvitationInput = {
  storeId: string;
  actorUserId: string;
  name: string;
  email: string;
  canChat?: boolean;
  canCentralComercial?: boolean;
};

const normalizeId = (value: unknown): string =>
  String(value || "").trim();

const normalizeEmail = (value: unknown): string =>
  String(value || "").trim().toLowerCase();

const normalizeName = (value: unknown): string =>
  String(value || "").trim();

class BusinessTeamInvitationService {
  private invitationRepo() {
    return AppDataSource.getRepository(BusinessTeamInvitation);
  }

  private userRepo() {
    return AppDataSource.getRepository(Usuario);
  }

  private createToken() {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    return { token, tokenHash };
  }


  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private invitationView(invitation: BusinessTeamInvitation) {
    return {
      id: invitation.id,
      storeId: invitation.storeId,
      name: invitation.name,
      email: invitation.email,
      role: invitation.role,
      permissions: {
        chat: Boolean(invitation.canChat),
        centralComercial: Boolean(invitation.canCentralComercial),
        agenda: Boolean(invitation.canAgenda),
        orders: Boolean(invitation.canOrders),
        catalog: Boolean(invitation.canCatalog),
        finance: Boolean(invitation.canFinance),
        settings: Boolean(invitation.canSettings),
      },
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt || null,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }

  private isExpired(value: Date | string | null | undefined) {
    if (!value) return true;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) || date.getTime() <= Date.now();
  }

  private async assertEligibleExternalAttendant(user: Usuario) {
    const tipo = String(user.tipo || "").trim().toUpperCase();

    if (tipo !== "MORADOR" && tipo !== "VISITANTE") {
      const error: any = new Error(
        "O convite de atendente só pode ser aceito por MORADOR ou VISITANTE.",
      );
      error.statusCode = 403;
      throw error;
    }

    if (
      Number((user as any).is_empreendedor || 0) === 1 ||
      Number((user as any).is_prestador || 0) === 1
    ) {
      const error: any = new Error(
        "Prestador ou empreendedor não pode aceitar convite de atendente.",
      );
      error.statusCode = 403;
      throw error;
    }

    const profiles: Array<{ id: string }> = await AppDataSource.query(
      "SELECT id FROM perfil_prestador WHERE usuarioId = ?",
      [user.id],
    );

    const refs = [
      user.id,
      ...profiles.map((row) => String(row.id || "").trim()).filter(Boolean),
    ];

    const placeholders = refs.map(() => "?").join(",");
    const stores: Array<{ id: string }> = await AppDataSource.query(
      `SELECT id FROM stores WHERE usuarioId IN (${placeholders}) LIMIT 1`,
      refs,
    );

    if (stores.length > 0) {
      const error: any = new Error(
        "Proprietário de negócio não pode aceitar convite de atendente.",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  async getPublicInvitation(tokenValue: string) {
    const token = String(tokenValue || "").trim();

    if (!token) {
      const error: any = new Error("Token do convite é obrigatório.");
      error.statusCode = 400;
      throw error;
    }

    const invitation = await this.invitationRepo().findOne({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!invitation) {
      const error: any = new Error("Convite inválido.");
      error.statusCode = 404;
      throw error;
    }

    if (invitation.status === BusinessTeamInvitationStatus.CANCELLED) {
      const error: any = new Error("Este convite foi cancelado.");
      error.statusCode = 410;
      throw error;
    }

    if (
      invitation.status === BusinessTeamInvitationStatus.EXPIRED ||
      this.isExpired(invitation.expiresAt)
    ) {
      if (invitation.status === BusinessTeamInvitationStatus.PENDING) {
        invitation.status = BusinessTeamInvitationStatus.EXPIRED;
        await this.invitationRepo().save(invitation);
      }

      const error: any = new Error("Este convite expirou.");
      error.statusCode = 410;
      throw error;
    }

    const stores: Array<{
      id: string;
      name?: string | null;
      slug?: string | null;
    }> = await AppDataSource.query(
      "SELECT id, name, slug FROM stores WHERE id = ? LIMIT 1",
      [invitation.storeId],
    );

    const store = stores[0];

    return {
      invitation: this.invitationView(invitation),
      business: {
        id: invitation.storeId,
        name: store?.name || "Negócio GranConecta",
        slug: store?.slug || null,
      },
      alreadyAccepted:
        invitation.status === BusinessTeamInvitationStatus.ACCEPTED,
    };
  }

  async acceptInvitation(tokenValue: string, authenticatedUserId: string) {
    const token = String(tokenValue || "").trim();
    const userId = normalizeId(authenticatedUserId);

    if (!token) {
      const error: any = new Error("Token do convite é obrigatório.");
      error.statusCode = 400;
      throw error;
    }

    if (!userId) {
      const error: any = new Error("Usuário não autenticado.");
      error.statusCode = 401;
      throw error;
    }

    const tokenHash = this.hashToken(token);

    return AppDataSource.transaction(async (manager) => {
      const invitationRepo = manager.getRepository(BusinessTeamInvitation);
      const memberRepo = manager.getRepository(BusinessTeamMember);
      const userRepo = manager.getRepository(Usuario);

      const invitation = await invitationRepo
        .createQueryBuilder("inv")
        .setLock("pessimistic_write")
        .where("inv.token_hash = :tokenHash", { tokenHash })
        .getOne();

      if (!invitation) {
        const error: any = new Error("Convite inválido.");
        error.statusCode = 404;
        throw error;
      }

      if (invitation.status === BusinessTeamInvitationStatus.CANCELLED) {
        const error: any = new Error("Este convite foi cancelado.");
        error.statusCode = 410;
        throw error;
      }

      if (
        invitation.status === BusinessTeamInvitationStatus.EXPIRED ||
        this.isExpired(invitation.expiresAt)
      ) {
        const error: any = new Error("Este convite expirou.");
        error.statusCode = 410;
        throw error;
      }

      const user = await userRepo.findOne({ where: { id: userId } });

      if (!user) {
        const error: any = new Error("Usuário autenticado não encontrado.");
        error.statusCode = 404;
        throw error;
      }

      if (
        normalizeEmail((user as any).email) !== normalizeEmail(invitation.email)
      ) {
        const error: any = new Error(
          "O e-mail da conta autenticada é diferente do e-mail do convite.",
        );
        error.statusCode = 403;
        throw error;
      }

      if (invitation.status === BusinessTeamInvitationStatus.ACCEPTED) {
        const member = await memberRepo.findOne({
          where: { storeId: invitation.storeId, userId },
        });

        return {
          invitation: this.invitationView(invitation),
          member,
          alreadyAccepted: true,
        };
      }

      if (invitation.status !== BusinessTeamInvitationStatus.PENDING) {
        const error: any = new Error("Este convite não está disponível.");
        error.statusCode = 409;
        throw error;
      }

      await this.assertEligibleExternalAttendant(user);

      let member = await memberRepo.findOne({
        where: { storeId: invitation.storeId, userId },
      });

      const memberValues = {
        role: BusinessTeamMemberRole.ATTENDANT,
        canChat: invitation.canChat,
        canCentralComercial: invitation.canCentralComercial,
        canAgenda: invitation.canAgenda,
        canOrders: invitation.canOrders,
        canCatalog: invitation.canCatalog,
        canFinance: invitation.canFinance,
        canSettings: invitation.canSettings,
        active: true,
        invitedByUserId: invitation.invitedByUserId,
        acceptedAt: new Date(),
      };

      if (member) {
        Object.assign(member, memberValues);
      } else {
        member = memberRepo.create({
          storeId: invitation.storeId,
          userId,
          ...memberValues,
        });
      }

      const savedMember = await memberRepo.save(member);

      invitation.status = BusinessTeamInvitationStatus.ACCEPTED;
      invitation.acceptedByUserId = userId;
      invitation.acceptedAt = new Date();

      const savedInvitation = await invitationRepo.save(invitation);

      return {
        invitation: this.invitationView(savedInvitation),
        member: savedMember,
        alreadyAccepted: false,
      };
    });
  }

  /**
   * Lista os convites do negócio para a tela Equipe.
   * O usuário autenticado precisa possuir permissão SETTINGS.
   */
  async listInvitations(storeIdValue: string, actorUserIdValue: string) {
    const storeId = normalizeId(storeIdValue);
    const actorUserId = normalizeId(actorUserIdValue);

    if (!storeId || !actorUserId) {
      const error: any = new Error("Negócio ou usuário inválido.");
      error.statusCode = 400;
      throw error;
    }

    await BusinessTeamService.requirePermission(
      storeId,
      actorUserId,
      "SETTINGS",
    );

    const invitations = await this.invitationRepo().find({
      where: { storeId },
      order: { createdAt: "DESC" },
    });

    // Marca como expirado qualquer convite pendente que já venceu.
    let needsSave = false;

    for (const invitation of invitations) {
      if (
        invitation.status === BusinessTeamInvitationStatus.PENDING &&
        this.isExpired(invitation.expiresAt)
      ) {
        invitation.status = BusinessTeamInvitationStatus.EXPIRED;
        needsSave = true;
      }
    }

    if (needsSave) {
      await this.invitationRepo().save(invitations);
    }

    return invitations.map((invitation) =>
      this.invitationView(invitation),
    );
  }

  /**
   * Cancela um convite ainda pendente.
   * Não remove histórico do banco.
   */
  async cancelInvitation(
    storeIdValue: string,
    actorUserIdValue: string,
    invitationIdValue: string,
  ) {
    const storeId = normalizeId(storeIdValue);
    const actorUserId = normalizeId(actorUserIdValue);
    const invitationId = normalizeId(invitationIdValue);

    if (!storeId || !actorUserId || !invitationId) {
      const error: any = new Error("Dados inválidos para cancelar convite.");
      error.statusCode = 400;
      throw error;
    }

    await BusinessTeamService.requirePermission(
      storeId,
      actorUserId,
      "SETTINGS",
    );

    const invitation = await this.invitationRepo().findOne({
      where: {
        id: invitationId,
        storeId,
      },
    });

    if (!invitation) {
      const error: any = new Error("Convite não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    if (invitation.status === BusinessTeamInvitationStatus.ACCEPTED) {
      const error: any = new Error(
        "Este convite já foi aceito. Desative o membro pela lista da equipe.",
      );
      error.statusCode = 409;
      throw error;
    }

    if (invitation.status === BusinessTeamInvitationStatus.CANCELLED) {
      return {
        invitation: this.invitationView(invitation),
        alreadyCancelled: true,
      };
    }

    invitation.status = BusinessTeamInvitationStatus.CANCELLED;
    invitation.cancelledAt = new Date();

    const saved = await this.invitationRepo().save(invitation);

    return {
      invitation: this.invitationView(saved),
      alreadyCancelled: false,
    };
  }

  /**
   * Gera um novo token e renova a validade por 7 dias.
   * Por enquanto retorna o token somente para os testes do fluxo.
   * No envio real por e-mail, o token deve ser usado apenas para montar o link.
   */
  async resendInvitation(
    storeIdValue: string,
    actorUserIdValue: string,
    invitationIdValue: string,
  ) {
    const storeId = normalizeId(storeIdValue);
    const actorUserId = normalizeId(actorUserIdValue);
    const invitationId = normalizeId(invitationIdValue);

    if (!storeId || !actorUserId || !invitationId) {
      const error: any = new Error("Dados inválidos para reenviar convite.");
      error.statusCode = 400;
      throw error;
    }

    await BusinessTeamService.requirePermission(
      storeId,
      actorUserId,
      "SETTINGS",
    );

    const invitation = await this.invitationRepo().findOne({
      where: {
        id: invitationId,
        storeId,
      },
    });

    if (!invitation) {
      const error: any = new Error("Convite não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    if (invitation.status === BusinessTeamInvitationStatus.ACCEPTED) {
      const error: any = new Error(
        "Este convite já foi aceito e não pode ser reenviado.",
      );
      error.statusCode = 409;
      throw error;
    }

    const existingUser = await this.userRepo()
      .createQueryBuilder("u")
      .select(["u.id", "u.email"])
      .where("LOWER(u.email) = :email", {
        email: normalizeEmail(invitation.email),
      })
      .getOne();

    if (existingUser) {
      const error: any = new Error(
        "Este e-mail agora já possui cadastro no GranConecta. Associe a pessoa pela opção de usuário existente.",
      );
      error.statusCode = 409;
      throw error;
    }

    const { token, tokenHash } = this.createToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    invitation.tokenHash = tokenHash;
    invitation.status = BusinessTeamInvitationStatus.PENDING;
    invitation.expiresAt = expiresAt;
    invitation.cancelledAt = null;
    invitation.acceptedAt = null;
    invitation.acceptedByUserId = null;
    invitation.invitedByUserId = actorUserId;

    const saved = await this.invitationRepo().save(invitation);

    return {
      invitation: this.invitationView(saved),
      token,
      renewed: true,
    };
  }

  async createInvitation(input: CreateInvitationInput) {
    const storeId = normalizeId(input.storeId);
    const actorUserId = normalizeId(input.actorUserId);
    const name = normalizeName(input.name);
    const email = normalizeEmail(input.email);

    if (!storeId || !actorUserId) {
      const error: any = new Error("Negócio ou usuário inválido.");
      error.statusCode = 400;
      throw error;
    }

    if (!name) {
      const error: any = new Error("Informe o nome da pessoa convidada.");
      error.statusCode = 400;
      throw error;
    }

    if (!email || !email.includes("@")) {
      const error: any = new Error("Informe um e-mail válido.");
      error.statusCode = 400;
      throw error;
    }

    /**
     * Somente proprietário/gerente com SETTINGS pode convidar equipe.
     * A autorização continua sendo derivada do usuário autenticado no backend.
     */
    await BusinessTeamService.requirePermission(
      storeId,
      actorUserId,
      "SETTINGS",
    );

    /**
     * Este fluxo é exclusivamente para pessoa ainda não cadastrada.
     * Usuário existente deve ser associado pelo combo de moradores/visitantes.
     */
    const existingUser = await this.userRepo()
      .createQueryBuilder("u")
      .select([
        "u.id",
        "u.name",
        "u.email",
        "u.tipo",
        "u.is_empreendedor",
        "u.is_prestador",
      ])
      .where("LOWER(u.email) = :email", { email })
      .getOne();

    if (existingUser) {
      const error: any = new Error(
        "Este e-mail já possui cadastro no GranConecta. Use a opção de selecionar um morador ou visitante já cadastrado.",
      );
      error.statusCode = 409;
      throw error;
    }

    /**
     * Se já houver convite pendente para este e-mail neste negócio,
     * renovamos o mesmo registro em vez de criar convites duplicados.
     */
    const existingInvitation = await this.invitationRepo().findOne({
      where: {
        storeId,
        email,
        status: BusinessTeamInvitationStatus.PENDING,
      },
    });

    const { token, tokenHash } = this.createToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const values = {
      name,
      email,
      role: BusinessTeamMemberRole.ATTENDANT,
      canChat: input.canChat ?? true,
      canCentralComercial: input.canCentralComercial ?? true,
      canAgenda: false,
      canOrders: false,
      canCatalog: false,
      canFinance: false,
      canSettings: false,
      tokenHash,
      status: BusinessTeamInvitationStatus.PENDING,
      expiresAt,
      acceptedAt: null,
      cancelledAt: null,
      invitedByUserId: actorUserId,
      acceptedByUserId: null,
    };

    let invitation: BusinessTeamInvitation;
    let renewed = false;

    if (existingInvitation) {
      Object.assign(existingInvitation, values);
      invitation = await this.invitationRepo().save(existingInvitation);
      renewed = true;
    } else {
      const created = this.invitationRepo().create({
        storeId,
        ...values,
      });

      invitation = await this.invitationRepo().save(created);
    }

    return {
      invitation: {
        id: invitation.id,
        storeId: invitation.storeId,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        permissions: {
          chat: Boolean(invitation.canChat),
          centralComercial: Boolean(
            invitation.canCentralComercial,
          ),
          agenda: Boolean(invitation.canAgenda),
          orders: Boolean(invitation.canOrders),
          catalog: Boolean(invitation.canCatalog),
          finance: Boolean(invitation.canFinance),
          settings: Boolean(invitation.canSettings),
        },
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
      },

      /**
       * Por enquanto retornamos o token para conseguirmos testar o fluxo.
       * Na etapa do envio real por e-mail, este token será usado apenas
       * para montar o link e não deverá ser armazenado em texto puro.
       */
      token,
      renewed,
    };
  }
}

export default new BusinessTeamInvitationService();
