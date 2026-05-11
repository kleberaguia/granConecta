"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentWebhookController_1 = require("../controller/PaymentWebhookController");
const PaymentWebhook = (0, express_1.Router)();
PaymentWebhook.post("/webhook/payment", PaymentWebhookController_1.PaymentWebhookController.handleWebhook);
exports.default = PaymentWebhook;
