import { Router } from "express";
import { PaymentWebhookController } from "../controller/PaymentWebhookController";

const PaymentWebhook = Router();

PaymentWebhook.post("/webhook/payment", PaymentWebhookController.handleWebhook);

export default PaymentWebhook;