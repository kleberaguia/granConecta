"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_1 = __importDefault(require("../controller/PaymentController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerPayment = (0, express_1.Router)();
// CREATE SESSION
routerPayment.post("/create-session", (req, res) => {
    console.log("[PAYMENT ROUTE] POST /create-session chamada");
    return PaymentController_1.default.handleCreateSession(req, res);
});
// CREATE SUBSCRIPTION
routerPayment.post("/payments/subscription", authMiddleware_1.authMiddleware, (req, res, next) => {
    console.log("[PAYMENT ROUTE] POST /payments/subscription chamada");
    next();
}, PaymentController_1.default.handleCreateSubscription);
// WEBHOOK SUBSCRIPTION MERCADO PAGO
routerPayment.post("/webhook/mercadopago/subscription", (req, res, next) => {
    console.log("[PAYMENT ROUTE] POST /webhook/mercadopago/subscription chamada");
    console.log("BODY:", req.body);
    next();
}, PaymentController_1.default.handleMercadoPagoSubscriptionWebhook);
// WEBHOOK MERCADO PAGO
routerPayment.post("/webhook/mercadopago", (req, res, next) => {
    console.log("[PAYMENT ROUTE] POST /webhook/mercadopago chamada");
    console.log("BODY:", req.body);
    next();
}, PaymentController_1.default.handleMercadoPagoWebhook.bind(PaymentController_1.default));
// PIX STATUS
routerPayment.get("/pix-status/:id", authMiddleware_1.authMiddleware, (req, res, next) => {
    console.log(`[PAYMENT ROUTE] GET /pix-status/${req.params.id} chamada`);
    next();
}, PaymentController_1.default.checkPixStatus);
// MEUS CREDITOS
routerPayment.get("/meus-creditos", authMiddleware_1.authMiddleware, (req, res, next) => {
    console.log("[PAYMENT ROUTE] GET /meus-creditos chamada");
    next();
}, PaymentController_1.default.getBalanceAndTransactions);
exports.default = routerPayment;
