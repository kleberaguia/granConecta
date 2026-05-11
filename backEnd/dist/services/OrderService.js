"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
// src/services/OrderService.ts
const data_source_1 = require("../config/data-source");
const OrderModels_1 = require("../models/OrderModels");
const OrderItemModels_1 = require("../models/OrderItemModels");
const UserModels_1 = require("../models/UserModels");
const StoreModels_1 = require("../models/StoreModels");
const socket_1 = require("../socket/socket");
const twilio_1 = require("twilio");
const PaymentGatewayService_1 = require("./PaymentGatewayService");
class OrderService {
    async execute({ userId, storeId, paymentMethod, deliveryAddress, items }) {
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // 1. Buscar o usuário/visitante
            const userRepo = queryRunner.manager.getRepository(UserModels_1.Usuario);
            const customer = await userRepo.findOne({
                where: { id: userId },
                select: ["id", "condominio_id", "tipo"]
            });
            if (!customer) {
                throw new Error("Cliente não encontrado.");
            }
            // 2. Definir o condominioId do pedido
            let finalCondominioId = customer.condominio_id;
            // Se for VISITANTE e não tiver condomínio, pegamos o condomínio da LOJA
            if (!finalCondominioId) {
                const storeRepo = queryRunner.manager.getRepository(StoreModels_1.Store);
                const store = await storeRepo.findOne({
                    where: { id: storeId }
                    // Remova o select se estiver dando erro de tipo
                });
                finalCondominioId = store?.condominio_id || null;
            }
            // 3. Calcular o total (garantindo que o preço seja número)
            const totalAmount = items.reduce((acc, item) => {
                return acc + (Number(item.price) * item.quantity);
            }, 0);
            // 4. Criar o Pedido (Order)
            const orderRepo = queryRunner.manager.getRepository(OrderModels_1.Order);
            const order = orderRepo.create({
                customerId: { id: userId },
                store: { id: storeId },
                condominio_Id: finalCondominioId,
                totalAmount,
                paymentMethod,
                deliveryAddress,
                status: OrderModels_1.OrderStatus.PENDING
            });
            const savedOrder = await orderRepo.save(order);
            // 5. Criar os Itens do Pedido (OrderItems)
            const itemRepo = queryRunner.manager.getRepository(OrderItemModels_1.OrderItem);
            const orderItems = items.map(item => {
                return itemRepo.create({
                    order: savedOrder,
                    product: { id: item.productId },
                    name: item.name || "Produto sem nome", // Fallback para evitar erro de DEFAULT
                    image: item.image || "",
                    quantity: item.quantity,
                    price: item.price
                });
            });
            await itemRepo.save(orderItems);
            // 6. Busca o pedido completo para o retorno
            const orderComplete = await queryRunner.manager.getRepository(OrderModels_1.Order).findOne({
                where: { id: savedOrder.id },
                relations: ["store", "items", "items.product", "customer"]
            });
            await queryRunner.commitTransaction();
            return orderComplete;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            console.error("ERRO NO SERVICE:", err.message);
            throw new Error(err.message);
        }
        finally {
            await queryRunner.release();
        }
    }
    async notifyStatusChange(order, newStatus) {
        const io = (0, socket_1.getIO)();
        const storeName = order.store?.name || "nossa loja";
        const customerName = order.customer?.name || "cliente";
        const msgStatus = this.getStatusMessage(newStatus); // Aqui resolve o "msgStatus"
        // 1. Notificação Socket
        io.to(`order_customer_${order.customerId}`).emit("status_changed", {
            orderId: order.id,
            status: newStatus,
            message: this.getStatusMessage(newStatus)
        });
        // 2. 🛡️ RESOLVENDO: 'order.customer' is possibly 'undefined'
        // Usamos um Type Guard para garantir que o cliente existe antes de prosseguir
        if (order.customer && order.customer.telefone) {
            const linkAcompanhamento = `https://granconecta.com.br/pedido/${order.id}`;
            // Criando uma mensagem bem profissional
            const mensagemZap = `*GranConecta: Atualização de Pedido*\n\n` +
                `Olá, ${customerName}!\n` +
                `O seu pedido na loja *${storeName}* agora está: *${newStatus.toUpperCase()}*.\n\n` +
                `${msgStatus}\n\n` +
                `🔗 Acompanhe aqui: ${linkAcompanhamento}`;
            // ✅ Chamando o método correto
            await this.sendWhatsApp(order.customer.telefone, mensagemZap);
        }
    }
    getStatusMessage(status) {
        const messages = {
            pago: "Seu pagamento foi confirmado! 🚀",
            preparando: "Seu pedido está sendo preparado com carinho! 📦",
            saiu_entrega: "Opa! Seu pedido saiu para entrega. Prepare o QR Code! 🛵",
            entregue: "Pedido entregue. Aproveite! ✅"
        };
        return messages[status] || "Status atualizado!";
    }
    async sendWhatsApp(telefone, mensagem) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = new twilio_1.Twilio(accountSid, authToken);
        try {
            await client.messages.create({
                from: 'whatsapp:+14155238886', // Número padrão do sandbox
                to: `whatsapp:${telefone}`,
                body: mensagem
            });
            console.log("WhatsApp enviado via Twilio");
        }
        catch (error) {
            console.error("Erro Twilio:", error);
        }
    }
    async generateInitialPayment(order) {
        // Convertemos a store para 'any' para o TS não reclamar da propriedade inexistente
        const store = order.store;
        const paymentConfig = store?.paymentConfig;
        console.log('paymentConfigggggggggggggggggggg ', paymentConfig);
        if (!paymentConfig) {
            throw new Error("Loja não possui configuração de pagamento ativa.");
        }
        return await PaymentGatewayService_1.PaymentGatewayService.createPayment(order, paymentConfig);
    }
}
exports.OrderService = OrderService;
