"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSubscription = void 0;
const data_source_1 = require("../config/data-source");
const SubscriptionModel_1 = require("../models/SubscriptionModel");
const checkSubscription = async (req, res, next) => {
    try {
        const userId = req.user?.usuarioId; // ID vindo do middleware de login (JWT)
        const subRepo = data_source_1.AppDataSource.getRepository(SubscriptionModel_1.Subscription);
        if (!userId) {
            return res.status(401).json({ message: "Usuário não identificado." });
        }
        // Busca a assinatura mais recente deste cliente
        const subscription = await subRepo.findOne({
            where: { usuarioId: userId },
            order: { createdAt: 'DESC' }
        });
        // 1. Verifica se existe assinatura
        if (!subscription) {
            return res.status(403).json({
                message: "Assinatura não encontrada. Por favor, escolha um plano."
            });
        }
        // 2. Verifica se o status é ATIVO
        if (subscription.status !== SubscriptionModel_1.SubscriptionStatus.ACTIVE) {
            // Caso esteja atrasado (PAST_DUE), você pode enviar uma mensagem específica
            const message = subscription.status === SubscriptionModel_1.SubscriptionStatus.PAST_DUE
                ? "Pagamento pendente. Regularize sua assinatura para acessar."
                : "Sua assinatura está cancelada ou expirada.";
            return res.status(403).json({
                status: subscription.status,
                message
            });
        }
        // 3. Tudo certo! Prossegue para a rota
        next();
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao verificar assinatura." });
    }
};
exports.checkSubscription = checkSubscription;
