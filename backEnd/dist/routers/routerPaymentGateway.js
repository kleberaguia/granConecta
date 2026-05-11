"use strict";
// src/routers/routerSiteConfig.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerGateWayLojista = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const PaymentGatewayController_1 = require("../controller/PaymentGatewayController");
const routerGateWayLojista = (0, express_1.Router)();
exports.routerGateWayLojista = routerGateWayLojista;
routerGateWayLojista.post('/gateway/create-payment/:orderId', authMiddleware_1.authMiddleware, PaymentGatewayController_1.PaymentGatewayController.createPayment);
