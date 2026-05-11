"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/routerWebhook.ts
const express_1 = require("express");
const PagamentoService_1 = __importDefault(require("../services/PagamentoService"));
const router = (0, express_1.Router)();
// Mercado Pago posts here
router.post("/mercadopago", async (req, res) => {
    try {
        const body = req.body;
        await PagamentoService_1.default.processarWebhookMercadoPago(body);
        // responder 200 rápido
        return res.status(200).send("OK");
    }
    catch (err) {
        console.error("Erro webhook MP:", err);
        return res.status(500).send("ERROR");
    }
});
exports.default = router;
