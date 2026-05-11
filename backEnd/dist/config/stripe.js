"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY não definida para o ambiente atual');
}
const isProd = process.env.NODE_ENV === 'production';
if (isProd && process.env.STRIPE_SECRET_KEY.startsWith('sk_test')) {
    throw new Error('Você está usando chave de TESTE em PRODUÇÃO');
}
if (!isProd && process.env.STRIPE_SECRET_KEY.startsWith('sk_live')) {
    console.warn('Atenção: chave LIVE fora de produção');
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
});
exports.default = stripe;
