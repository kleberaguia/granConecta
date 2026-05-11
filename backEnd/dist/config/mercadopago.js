"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preference = void 0;
const mercadopago_1 = require("mercadopago");
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});
exports.preference = new mercadopago_1.Preference(client);
exports.default = client;
