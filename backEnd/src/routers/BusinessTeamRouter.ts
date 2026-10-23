import { Router } from "express";
import type { RequestHandler } from "express";
import BusinessTeamController from "../controller/BusinessTeamController";

type BusinessTeamRouterDependencies = {
  autenticar: RequestHandler;
};

export const criarBusinessTeamRouter = ({
  autenticar,
}: BusinessTeamRouterDependencies) => {
  const router = Router();


  // ------------------------------------------------------------
  // Convite externo - consulta pública pelo token
  // Não exige autenticação.
  // ------------------------------------------------------------
  router.get(
    "/business-team/invitations/public/:token",
    (req, res) =>
      BusinessTeamController.getPublicInvitation(req, res),
  );

  // ------------------------------------------------------------
  // Convite externo - aceite pelo usuário autenticado
  // O backend usa a identidade do JWT, nunca userId do frontend.
  // ------------------------------------------------------------
  router.post(
    "/business-team/invitations/accept",
    autenticar,
    (req, res) =>
      BusinessTeamController.acceptInvitation(req as any, res),
  );

  // ------------------------------------------------------------
  // Negócios acessíveis pelo usuário autenticado.
  // IMPORTANTE: deve ficar antes das rotas dinâmicas /:storeId.
  // ------------------------------------------------------------
  router.get(
    "/business-team/my-businesses",
    autenticar,
    (req, res) =>
      BusinessTeamController.myBusinesses(req as any, res),
  );

  router.get(
    "/business-team/:storeId/access",
    autenticar,
    (req, res) =>
      BusinessTeamController.myAccess(req as any, res),
  );

  router.get(
    "/business-team/:storeId/members",
    autenticar,
    (req, res) =>
      BusinessTeamController.list(req as any, res),
  );

  router.get(
    "/business-team/:storeId/eligible-attendants",
    autenticar,
    (req, res) =>
      BusinessTeamController.eligibleAttendants(req as any, res),
  );

  router.get(
    "/business-team/:storeId/invitations",
    autenticar,
    (req, res) =>
      BusinessTeamController.listInvitations(req as any, res),
  );

  router.patch(
    "/business-team/:storeId/invitations/:invitationId/cancel",
    autenticar,
    (req, res) =>
      BusinessTeamController.cancelInvitation(req as any, res),
  );

  router.post(
    "/business-team/:storeId/invitations/:invitationId/resend",
    autenticar,
    (req, res) =>
      BusinessTeamController.resendInvitation(req as any, res),
  );

  router.post(
    "/business-team/:storeId/invitations",
    autenticar,
    (req, res) =>
      BusinessTeamController.createInvitation(req as any, res),
  );

  router.post(
    "/business-team/:storeId/members",
    autenticar,
    (req, res) =>
      BusinessTeamController.add(req as any, res),
  );

  router.patch(
    "/business-team/:storeId/members/:memberId",
    autenticar,
    (req, res) =>
      BusinessTeamController.update(req as any, res),
  );

  router.delete(
    "/business-team/:storeId/members/:memberId",
    autenticar,
    (req, res) =>
      BusinessTeamController.remove(req as any, res),
  );

  return router;
};

export default criarBusinessTeamRouter;