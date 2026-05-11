"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StorePaymentConfigController_1 = require("../controller/StorePaymentConfigController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerPaymentconfig = (0, express_1.Router)();
// buscar config
routerPaymentconfig.get("/stores/:storeId/payment-config", authMiddleware_1.authMiddleware, StorePaymentConfigController_1.StorePaymentConfigController.getByStore);
// criar/atualizar config
routerPaymentconfig.put("/stores/:storeId/payment-config", authMiddleware_1.authMiddleware, StorePaymentConfigController_1.StorePaymentConfigController.upsert);
exports.default = routerPaymentconfig;
