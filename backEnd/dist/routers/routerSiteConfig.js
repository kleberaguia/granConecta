"use strict";
// src/routers/routerSiteConfig.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerSiteConfig = void 0;
const express_1 = require("express");
const SiteConfigController_1 = require("../controller/SiteConfigController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const PaymentGatewayController_1 = require("../controller/PaymentGatewayController");
const routerSiteConfig = (0, express_1.Router)();
exports.routerSiteConfig = routerSiteConfig;
const configController = new SiteConfigController_1.SiteConfigController();
routerSiteConfig.get("/", configController.get);
routerSiteConfig.post("/home", configController.save);
routerSiteConfig.post('/gateway/create-payment/:orderId', authMiddleware_1.authMiddleware, PaymentGatewayController_1.PaymentGatewayController.createPayment // Sem parênteses, sem instância
);
