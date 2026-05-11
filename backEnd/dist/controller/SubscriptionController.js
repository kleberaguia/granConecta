"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const SubscriptionService_1 = require("../services/SubscriptionService");
class SubscriptionController {
    constructor() {
        this.subService = new SubscriptionService_1.SubscriptionService();
        // 1. CRIAR ASSINATURA (PIX)
        this.createPixAssinatura = async (req, res) => {
            try {
                const { itens, frequencia } = req.body;
                const userId = req.user?.usuarioId; // Padronizado
                if (!userId) {
                    return res.status(401).json({ error: "Usuário não identificado. Faça login novamente." });
                }
                if (!itens || !Array.isArray(itens) || itens.length === 0) {
                    return res.status(400).json({ error: "Nenhum plano foi selecionado." });
                }
                const result = await this.subService.createMultipleSubscriptions(userId, itens, frequencia);
                return res.status(200).json(result);
            }
            catch (error) {
                console.error("Erro ao criar assinatura PIX:", error);
                return res.status(500).json({
                    error: "Erro interno ao processar seu pedido de assinatura.",
                    details: error.message
                });
            }
        };
        // 2. RENOVAÇÃO MANUAL (TRIGGER)
        this.triggerManualRenewal = async (req, res) => {
            try {
                await this.subService.processDailyRenewals();
                return res.status(200).json({
                    message: "Processamento de renovações concluído com sucesso."
                });
            }
            catch (error) {
                console.error("Erro no processamento manual:", error);
                return res.status(500).json({ error: "Falha ao processar renovações manualmente." });
            }
        };
        // 3. CANCELAR ASSINATURA E GERAR CRÉDITO
        this.cancelSubscription = async (req, res) => {
            const { subscriptionId } = req.params;
            if (!subscriptionId) {
                return res.status(400).json({ error: "O ID da assinatura é obrigatório." });
            }
            const userId = req.user?.usuarioId;
            if (!userId) {
                return res.status(401).json({ error: "Usuário não autenticado." });
            }
            try {
                const result = await this.subService.changeOrCancelSubscription(subscriptionId, userId, 'CANCEL');
                return res.json(result);
            }
            catch (err) {
                return res.status(400).json({ error: err.message });
            }
        };
        // 4. SIMULAR VALOR DE REEMBOLSO (PREVIEW)
        this.getRefundPreview = async (req, res) => {
            const { subscriptionId } = req.params;
            const userId = req.user?.usuarioId;
            if (!subscriptionId) {
                return res.status(400).json({ error: "O ID da assinatura é obrigatório." });
            }
            if (!userId) {
                return res.status(401).json({ error: "Usuário não autenticado." });
            }
            try {
                // Chamamos o novo método que deve estar no seu Service
                const preview = await this.subService.getSubscriptionRefundPreview(subscriptionId, userId);
                return res.json(preview);
            }
            catch (err) {
                return res.status(400).json({ error: err.message });
            }
        };
        this.getMyBalance = async (req, res) => {
            try {
                const userId = req.user?.usuarioId;
                // Chamada ao service que busca na tabela user_credits
                const balance = await this.subService.getUserBalance(userId);
                return res.json({ balance });
            }
            catch (error) {
                return res.status(500).json({ error: error.message });
            }
        };
        // 6. SOLICITAR SAQUE (PIX)
        this.requestWithdrawal = async (req, res) => {
            try {
                const userId = req.user?.usuarioId;
                const { pixKey } = req.body;
                if (!pixKey)
                    return res.status(400).json({ error: "Chave PIX obrigatória" });
                const result = await this.subService.requestRefund(userId, pixKey);
                return res.json(result);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
    }
}
exports.SubscriptionController = SubscriptionController;
