import { Router } from "express";
import PaymentController from "../controller/PaymentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { PaymentGatewayController } from "../controller/PaymentGatewayController";

const routerPayment = Router();

// CREATE SESSION
routerPayment.post("/create-session", (req, res) => {
  console.log("[PAYMENT ROUTE] POST /create-session chamada");

  return PaymentController.handleCreateSession(req, res);
});

// CREATE SUBSCRIPTION
routerPayment.post(
  "/payments/subscription",
  authMiddleware,
  (req, res, next) => {
    console.log("[PAYMENT ROUTE] POST /payments/subscription chamada");
    next();
  },
  PaymentController.handleCreateSubscription
);

// WEBHOOK SUBSCRIPTION MERCADO PAGO
routerPayment.post(
  "/webhook/mercadopago/subscription",
  (req, res, next) => {
    console.log(
      "[PAYMENT ROUTE] POST /webhook/mercadopago/subscription chamada"
    );

    console.log("BODY:", req.body);

    next();
  },
  PaymentController.handleMercadoPagoSubscriptionWebhook
);

// WEBHOOK MERCADO PAGO
routerPayment.post(
  "/webhook/mercadopago",
  (req, res, next) => {
    console.log("[PAYMENT ROUTE] POST /webhook/mercadopago chamada");

    console.log("BODY:", req.body);

    next();
  },
  PaymentController.handleMercadoPagoWebhook.bind(PaymentController)
);

// PIX STATUS
routerPayment.get(
  "/pix-status/:id",
  authMiddleware,
  (req, res, next) => {
    console.log(
      `[PAYMENT ROUTE] GET /pix-status/${req.params.id} chamada`
    );

    next();
  },
  PaymentController.checkPixStatus
);

// MEUS CREDITOS
routerPayment.get(
  "/meus-creditos",
  authMiddleware,
  (req, res, next) => {
    console.log("[PAYMENT ROUTE] GET /meus-creditos chamada");

    next();
  },
  PaymentController.getBalanceAndTransactions
);

export default routerPayment;