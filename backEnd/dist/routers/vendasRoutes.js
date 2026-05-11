"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/vendasRoutes.ts
const express_1 = require("express");
const VendasController_1 = require("../controller/VendasController");
const vendasRoutes = (0, express_1.Router)();
vendasRoutes.post('/tracking-checkout', VendasController_1.VendasController.trackingCheckout);
exports.default = vendasRoutes;
