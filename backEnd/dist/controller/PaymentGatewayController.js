"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayController = void 0;
const PaymentGatewayService_1 = require("../services/PaymentGatewayService");
const data_source_1 = require("../config/data-source");
const OrderModels_1 = require("../models/OrderModels");
const StorePaymentConfigModels_1 = require("../models/StorePaymentConfigModels");
const mercadopago_1 = __importStar(require("mercadopago"));
// ✅ Importação correta da sua ferramenta de segurança
const crypto_1 = require("../utils/crypto");
const orderRepo = data_source_1.AppDataSource.getRepository(OrderModels_1.Order);
const configRepo = data_source_1.AppDataSource.getRepository(StorePaymentConfigModels_1.StorePaymentConfig);
class PaymentGatewayController {
    /**
     * 🔹 Criar pagamento para um pedido já existente
     */
    static async createPayment(req, res) {
        try {
            const orderId = Number(req.params.orderId);
            if (!orderId) {
                return res.status(400).json({ message: "orderId inválido" });
            }
            // 1. Busca o pedido para identificar a loja (storeId)
            const order = await orderRepo.findOne({
                where: { id: orderId }
            });
            if (!order) {
                return res.status(404).json({ message: "Pedido não encontrado" });
            }
            // Validação de segurança do TypeScript
            if (!order.storeId) {
                return res.status(400).json({ message: "O pedido não possui um storeId associado." });
            }
            // 2. Busca a configuração de pagamento da loja específica
            const config = await configRepo.findOne({
                where: { store_id: order.storeId }
            });
            if (!config) {
                return res.status(404).json({
                    message: "Configuração de pagamento não encontrada para esta loja"
                });
            }
            // 🔒 DESCRIPTOGRAFIA: Se houver token, precisamos do valor real para o Gateway
            if (config.mercadoPagoAccessToken) {
                try {
                    config.mercadoPagoAccessToken = (0, crypto_1.decrypt)(config.mercadoPagoAccessToken);
                }
                catch (error) {
                    console.error("Erro ao descriptografar token no createPayment:", error);
                    return res.status(500).json({ message: "Erro nas credenciais da loja" });
                }
            }
            // 3. Solicita a criação do pagamento ao Service (PIX, etc)
            const payment = await PaymentGatewayService_1.PaymentGatewayService.createPayment(order, config);
            // 4. Atualiza o pedido com os dados de pagamento (QR Code, link, etc)
            order.payment_data = payment;
            order.status = OrderModels_1.OrderStatus.PENDING;
            await orderRepo.save(order);
            return res.json({
                orderId: order.id,
                payment
            });
        }
        catch (error) {
            console.error("createPayment error:", error);
            return res.status(500).json({
                message: "Erro ao criar pagamento"
            });
        }
    }
    /**
     * 🔹 Buscar status do pagamento (polling do frontend)
     */
    static async getPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;
            if (!orderId) {
                return res.status(400).json({ message: "OrderId é obrigatório" });
            }
            const order = await orderRepo.findOne({
                where: { id: Number(orderId) }
            });
            if (!order) {
                return res.status(404).json({ message: "Pedido não encontrado" });
            }
            return res.json({
                orderId: order.id,
                status: order.status,
                payment: order.payment_data
            });
        }
        catch (error) {
            console.error("getPaymentStatus error:", error);
            return res.status(500).json({
                message: "Erro ao buscar status do pagamento"
            });
        }
    }
    /**
     * 🔹 Regerar pagamento caso tenha expirado
     */
    static async regeneratePayment(req, res) {
        try {
            const { orderId } = req.params;
            const order = await orderRepo.findOne({
                where: { id: Number(orderId) },
                relations: ["items"]
            });
            if (!order || !order.storeId) {
                return res.status(404).json({ message: "Pedido não encontrado ou inválido" });
            }
            const config = await configRepo.findOne({
                where: { store_id: order.storeId }
            });
            if (!config) {
                return res.status(404).json({ message: "Configuração de pagamento não encontrada" });
            }
            // 🔒 Descriptografia para regeneração
            if (config.mercadoPagoAccessToken) {
                config.mercadoPagoAccessToken = (0, crypto_1.decrypt)(config.mercadoPagoAccessToken);
            }
            const payment = await PaymentGatewayService_1.PaymentGatewayService.createPayment(order, config);
            order.payment_data = payment;
            order.status = OrderModels_1.OrderStatus.PENDING;
            await orderRepo.save(order);
            return res.json({
                message: "Pagamento regenerado com sucesso",
                payment
            });
        }
        catch (error) {
            console.error("regeneratePayment error:", error);
            return res.status(500).json({
                message: "Erro ao regenerar pagamento"
            });
        }
    }
    /**
     * 🔹 Webhook do Mercado Pago (Notificação IPN)
     */
    static async mercadoPago(req, res) {
        try {
            const body = req.body;
            // Se não for evento de pagamento, ignoramos mas retornamos 200
            if (body.type !== "payment") {
                return res.sendStatus(200);
            }
            const paymentId = body.data?.id;
            if (!paymentId)
                return res.sendStatus(200);
            // 1. Localizar o pedido para saber de qual loja é o pagamento
            // Buscamos o ID do pagamento dentro do campo JSON payment_data
            const order = await orderRepo.createQueryBuilder("order")
                .where("order.payment_data->>'$.id' = :paymentId", { paymentId: String(paymentId) })
                .getOne();
            if (!order || !order.storeId) {
                console.warn("⚠️ Pedido não localizado para o pagamento:", paymentId);
                return res.sendStatus(200);
            }
            // 2. Buscar as credenciais da loja dona do pedido
            const config = await configRepo.findOne({
                where: { store_id: order.storeId }
            });
            if (!config || !config.mercadoPagoAccessToken) {
                console.error("❌ Token da loja não encontrado no Webhook.");
                return res.sendStatus(200);
            }
            // 🔒 DESCRIPTOGRAFIA: Necessário para consultar a API do MP
            const decryptedToken = (0, crypto_1.decrypt)(config.mercadoPagoAccessToken);
            // 3. Consultar detalhes do pagamento no Mercado Pago
            const mp = new mercadopago_1.default({ accessToken: decryptedToken });
            const paymentDetails = await new mercadopago_1.Payment(mp).get({ id: paymentId });
            // 4. Atualizar o status do pedido no nosso banco
            if (paymentDetails.status === "approved") {
                order.status = OrderModels_1.OrderStatus.PAID;
            }
            else if (["rejected", "cancelled", "expired"].includes(paymentDetails.status || "")) {
                order.status = OrderModels_1.OrderStatus.CANCELED;
            }
            else {
                order.status = OrderModels_1.OrderStatus.PENDING;
            }
            // Atualiza o log de dados do pagamento
            order.payment_data = paymentDetails;
            await orderRepo.save(order);
            console.log(`✅ Webhook: Pedido ${order.id} atualizado para ${order.status}`);
            return res.sendStatus(200);
        }
        catch (error) {
            console.error("❌ Erro crítico no Webhook Mercado Pago:", error);
            // Sempre retornar 200 para evitar que o MP tente reenviar eternamente o erro
            return res.sendStatus(200);
        }
    }
}
exports.PaymentGatewayController = PaymentGatewayController;
