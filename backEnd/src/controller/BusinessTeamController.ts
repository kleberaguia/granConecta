import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware";
import BusinessTeamService from "../services/BusinessTeamService";
import BusinessTeamInvitationService from "../services/BusinessTeamInvitationService";

const authenticatedUserId = (req: AuthenticatedRequest): string =>
  String(req.user?.usuarioId || req.user?.id || "").trim();

const sendError = (res: Response, error: any) => {
  console.error("[BUSINESS TEAM]", error);

  const status =
    Number(error?.statusCode) >= 400
      ? Number(error.statusCode)
      : 500;

  return res.status(status).json({
    message:
      error?.message || "Erro interno ao processar equipe do negócio.",
  });
};

class BusinessTeamController {
  async myBusinesses(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = authenticatedUserId(req);

      const businesses =
        await BusinessTeamService.myBusinesses(userId);

      return res.json({ businesses });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async myAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();

      const access = await BusinessTeamService.requireAccess(
        storeId,
        userId,
      );

      return res.json({ access });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();

      const members = await BusinessTeamService.listMembers(
        storeId,
        userId,
      );

      return res.json({ members });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async eligibleAttendants(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();
      const search = String(req.query?.search || "").trim();

      const attendants =
        await BusinessTeamService.listEligibleAttendants(
          storeId,
          userId,
          search,
        );

      return res.json({ attendants });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async listInvitations(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();

      const invitations =
        await BusinessTeamInvitationService.listInvitations(
          storeId,
          userId,
        );

      return res.json({ invitations });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async cancelInvitation(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();
      const invitationId = String(
        req.params.invitationId || "",
      ).trim();

      const result =
        await BusinessTeamInvitationService.cancelInvitation(
          storeId,
          userId,
          invitationId,
        );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async resendInvitation(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();
      const invitationId = String(
        req.params.invitationId || "",
      ).trim();

      const result =
        await BusinessTeamInvitationService.resendInvitation(
          storeId,
          userId,
          invitationId,
        );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async createInvitation(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();

      const result =
        await BusinessTeamInvitationService.createInvitation({
          storeId,
          actorUserId: userId,
          name: req.body?.name,
          email: req.body?.email,
          canChat: req.body?.canChat,
          canCentralComercial: req.body?.canCentralComercial,
        });

      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }


  async getPublicInvitation(req: Request, res: Response) {
    try {
      const token = String(
        req.params.token ||
        req.query?.token ||
        "",
      ).trim();

      const result =
        await BusinessTeamInvitationService.getPublicInvitation(
          token,
        );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async acceptInvitation(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const userId = authenticatedUserId(req);

      const token = String(
        req.body?.token ||
        req.params.token ||
        "",
      ).trim();

      const result =
        await BusinessTeamInvitationService.acceptInvitation(
          token,
          userId,
        );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async add(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();

      const result = await BusinessTeamService.addMember({
        storeId,
        actorUserId: userId,
        email: req.body?.email,
        role: req.body?.role,
        canChat: req.body?.canChat,
        canCentralComercial: req.body?.canCentralComercial,
        canAgenda: req.body?.canAgenda,
        canOrders: req.body?.canOrders,
        canCatalog: req.body?.canCatalog,
        canFinance: req.body?.canFinance,
        canSettings: req.body?.canSettings,
      });

      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();
      const memberId = String(req.params.memberId || "").trim();

      const member = await BusinessTeamService.updateMember({
        storeId,
        actorUserId: userId,
        memberId,
        role: req.body?.role,
        canChat: req.body?.canChat,
        canCentralComercial: req.body?.canCentralComercial,
        canAgenda: req.body?.canAgenda,
        canOrders: req.body?.canOrders,
        canCatalog: req.body?.canCatalog,
        canFinance: req.body?.canFinance,
        canSettings: req.body?.canSettings,
        active: req.body?.active,
      });

      return res.json({ member });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = authenticatedUserId(req);
      const storeId = String(req.params.storeId || "").trim();
      const memberId = String(req.params.memberId || "").trim();

      const result = await BusinessTeamService.removeMember(
        storeId,
        userId,
        memberId,
      );

      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }
}

export default new BusinessTeamController();