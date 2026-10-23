import {
  NextFunction,
  Request,
  Response,
  Router,
} from "express";

import PaymentController from "../controller/PaymentController";
import { AppDataSource } from "../config/data-source";
import { Payment } from "../models/PaymentModel";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerPayment = Router();

/**
 * Obtém o usuarioId diretamente do token JWT.
 *
 * O ID autenticado sobrescreve qualquer usuarioId enviado no body,
 * impedindo que alguém crie uma assinatura para outro usuário.
 */
function usarUsuarioAutenticado(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const usuarioId =
    req.user?.usuarioId ||
    req.user?.id;

  if (!usuarioId) {
    return res.status(401).json({
      codigo: "NAO_AUTORIZADO",
      error: "Usuário não autenticado.",
    });
  }

  req.body = {
    ...(req.body || {}),
    usuarioId,
  };

  next();
}

/**
 * Permite consultar o PIX somente do próprio usuário.
 * Administradores podem consultar outros usuários.
 */
function validarConsultaPix(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const usuarioAutenticadoId =
    req.user?.usuarioId ||
    req.user?.id;

  const usuarioConsultadoId =
    String(req.params.id || "");

  const isAdmin =
    String(req.user?.role || "")
      .trim()
      .toUpperCase() === "ADMIN";

  if (!usuarioAutenticadoId) {
    return res.status(401).json({
      codigo: "NAO_AUTORIZADO",
      error: "Usuário não autenticado.",
    });
  }

  if (
    !isAdmin &&
    String(usuarioAutenticadoId) !== usuarioConsultadoId
  ) {
    return res.status(403).json({
      codigo: "ACESSO_NEGADO",
      error:
        "Você não pode consultar o pagamento de outro usuário.",
    });
  }

  next();
}

// ================================================================
// CRIAR CHECKOUT PRO / SESSÃO DE PAGAMENTO
// ================================================================

routerPayment.post(
  "/create-session",

  authMiddleware,

  usarUsuarioAutenticado,

  (
    _req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      "[PAYMENT ROUTE] POST /create-session chamada"
    );

    next();
  },

  PaymentController.handleCreateSession
);

// ================================================================
// CRIAR ASSINATURA RECORRENTE
// ================================================================

routerPayment.post(
  "/payments/subscription",

  authMiddleware,

  usarUsuarioAutenticado,

  (
    _req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      "[PAYMENT ROUTE] POST /payments/subscription chamada"
    );

    next();
  },

  PaymentController.handleCreateSubscription
);

// ================================================================
// WEBHOOK DE ASSINATURA DO MERCADO PAGO
//
// Esta rota não deve usar authMiddleware.
// A chamada é realizada pelo próprio Mercado Pago.
// ================================================================

routerPayment.post(
  "/webhook/mercadopago/subscription",

  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      "[PAYMENT ROUTE] POST /webhook/mercadopago/subscription chamada",
      {
        type:
          req.body?.type ||
          req.query?.type ||
          null,

        dataId:
          req.body?.data?.id ||
          req.query?.id ||
          null,
      }
    );

    next();
  },

  PaymentController
    .handleMercadoPagoSubscriptionWebhook
);

// ================================================================
// WEBHOOK GERAL DO MERCADO PAGO
//
// Esta rota também não deve usar authMiddleware.
// ================================================================

routerPayment.post(
  "/webhook/mercadopago",

  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      "[PAYMENT ROUTE] POST /webhook/mercadopago chamada",
      {
        topic:
          req.query?.topic ||
          req.body?.topic ||
          req.body?.type ||
          null,

        dataId:
          req.query?.id ||
          req.body?.data?.id ||
          null,
      }
    );

    next();
  },

  PaymentController.handleMercadoPagoWebhook
);

// ================================================================
// CONSULTAR STATUS DO PIX
// ================================================================

routerPayment.get(
  "/pix-status/:id",

  authMiddleware,

  validarConsultaPix,

  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      `[PAYMENT ROUTE] GET /pix-status/${req.params.id} chamada`
    );

    next();
  },

  PaymentController.checkPixStatus
);

// ================================================================
// CONFIRMAÇÃO SIMULADA - SOMENTE AMBIENTE LOCAL E ADMIN
// ================================================================
routerPayment.post(
  "/local/confirmar-pagamento",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "local") {
      return res.status(404).json({ error: "Rota indisponível." });
    }

    if (String(req.user?.role || "").toUpperCase() !== "ADMIN") {
      return res.status(403).json({ error: "Acesso restrito ao administrador." });
    }

    const pagamentoId = String(req.body?.pagamentoId || "").trim();
    const usuarioId = String(req.body?.usuarioId || "").trim();
    if (!pagamentoId || !usuarioId) {
      return res.status(400).json({ error: "pagamentoId e usuarioId são obrigatórios." });
    }

    try {
      const pagamento = await AppDataSource.getRepository(Payment).findOne({
        where: { id: pagamentoId },
      });
      if (!pagamento || String(pagamento.usuarioId) !== usuarioId) {
        return res.status(404).json({ error: "Pagamento não encontrado para esse usuário." });
      }

      const checkoutId = String(pagamento.stripeSessionId || "");
      if (!/^LOCAL_(CHECKOUT|SUBSCRIPTION)_[0-9a-f-]{36}$/i.test(checkoutId)) {
        return res.status(400).json({ error: "O pagamento não é um checkout simulado válido." });
      }

      await PaymentController.confirmarPagamentoUniversal(usuarioId, checkoutId);
      const atualizado = await AppDataSource.getRepository(Payment).findOne({
        where: { id: pagamentoId },
      });
      return res.status(200).json({
        message: "Confirmação local processada.",
        pagamentoId,
        status: atualizado?.status || null,
      });
    } catch (error: any) {
      console.error("[LOCAL] Falha ao confirmar pagamento:", error);
      return res.status(500).json({ error: "Falha na confirmação local. Consulte os logs." });
    }
  }
);

// ================================================================
// CRÉDITOS DO USUÁRIO AUTENTICADO
// ================================================================

routerPayment.get(
  "/meus-creditos",

  authMiddleware,

  (
    _req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      "[PAYMENT ROUTE] GET /meus-creditos chamada"
    );

    next();
  },

  PaymentController.getBalanceAndTransactions
);

export default routerPayment;