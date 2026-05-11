"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorePaymentConfigController = void 0;
const data_source_1 = require("../config/data-source");
const StorePaymentConfigModels_1 = require("../models/StorePaymentConfigModels");
const crypto_1 = require("../utils/crypto");
const repo = data_source_1.AppDataSource.getRepository(StorePaymentConfigModels_1.StorePaymentConfig);
class StorePaymentConfigController {
    static async getByStore(req, res) {
        try {
            const { storeId } = req.params;
            if (!storeId) {
                return res.status(400).json({ message: "storeId é obrigatório" });
            }
            const config = await repo.findOne({
                where: { store_id: storeId }
            });
            if (!config) {
                return res.status(404).json({ message: "Configuração de pagamento não encontrada" });
            }
            const sanitizedConfig = { ...config };
            if (sanitizedConfig.mercadoPagoAccessToken) {
                const token = sanitizedConfig.mercadoPagoAccessToken;
                sanitizedConfig.mercadoPagoAccessToken = `************${token.substring(token.length - 4)}`;
            }
            if (sanitizedConfig.stripe_secret_key) {
                const key = sanitizedConfig.stripe_secret_key;
                sanitizedConfig.stripe_secret_key = `************${key.substring(key.length - 4)}`;
            }
            return res.json(sanitizedConfig);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno" });
        }
    }
    static async upsert(req, res) {
        try {
            const { storeId } = req.params;
            if (!storeId) {
                return res.status(400).json({ message: "storeId é obrigatório" });
            }
            const { pix_enabled, pix_key, cash_enabled, card_terminal_enabled, mercado_pago_enabled, mercadoPagoAccessToken, stripe_enabled, stripe_secret_key, accepted_methods } = req.body;
            let config = await repo.findOne({
                where: { store_id: storeId }
            });
            if (!config) {
                config = repo.create({ store_id: storeId });
            }
            // --- ATUALIZAÇÃO DOS CAMPOS NORMAIS ---
            config.pix_enabled = pix_enabled ?? config.pix_enabled;
            config.pix_key = pix_key ?? config.pix_key;
            config.cash_enabled = cash_enabled ?? config.cash_enabled;
            config.card_terminal_enabled = card_terminal_enabled ?? config.card_terminal_enabled;
            config.mercado_pago_enabled = mercado_pago_enabled ?? config.mercado_pago_enabled;
            config.stripe_enabled = stripe_enabled ?? config.stripe_enabled;
            config.accepted_methods = accepted_methods ?? config.accepted_methods;
            if (mercadoPagoAccessToken && !mercadoPagoAccessToken.includes('***')) {
                config.mercadoPagoAccessToken = (0, crypto_1.encrypt)(mercadoPagoAccessToken);
                console.log("🔒 Token Mercado Pago criptografado com sucesso.");
            }
            if (stripe_secret_key && !stripe_secret_key.includes('***')) {
                config.stripe_secret_key = (0, crypto_1.encrypt)(stripe_secret_key);
                console.log("🔒 Token Stripe criptografado com sucesso.");
            }
            const saved = await repo.save(config);
            const sanitized = { ...saved };
            if (sanitized.mercadoPagoAccessToken) {
                sanitized.mercadoPagoAccessToken = "********";
            }
            if (sanitized.stripe_secret_key) {
                sanitized.stripe_secret_key = "********";
            }
            return res.json(sanitized);
        }
        catch (error) {
            console.error("UPSERT payment config error:", error);
            return res.status(500).json({ message: "Erro ao salvar configuração" });
        }
    }
}
exports.StorePaymentConfigController = StorePaymentConfigController;
