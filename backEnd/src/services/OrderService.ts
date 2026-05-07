// src/services/OrderService.ts
import { AppDataSource } from "../config/data-source";
import { Order, OrderStatus } from "../models/OrderModels";
import { OrderItem } from "../models/OrderItemModels";
import { Usuario } from "../models/UserModels";
import { Store } from "../models/StoreModels";
import { getIO } from "../socket/socket";
import { Twilio } from 'twilio';
import { PaymentGatewayService } from "./PaymentGatewayService";

interface IOrderRequest {
    userId: string;
    storeId: string;
    paymentMethod: string;
    deliveryAddress: string;
    items: {
        productId: string;
        name: string;     // <--- O ERRO ESTÁ AQUI: Verifique se este valor existe
        image: string;
        quantity: number; price: number
    }[];
}

export class OrderService {
    async execute({ userId, storeId, paymentMethod, deliveryAddress, items }: IOrderRequest) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Buscar o usuário/visitante
            const userRepo = queryRunner.manager.getRepository(Usuario);
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
                const storeRepo = queryRunner.manager.getRepository(Store);
                const store = await storeRepo.findOne({
                    where: { id: storeId }
                    // Remova o select se estiver dando erro de tipo
                });

                finalCondominioId = (store as any)?.condominio_id || null;
            }

            // 3. Calcular o total (garantindo que o preço seja número)
            const totalAmount = items.reduce((acc, item) => {
                return acc + (Number(item.price) * item.quantity);
            }, 0);

            // 4. Criar o Pedido (Order)
            const orderRepo = queryRunner.manager.getRepository(Order);
            const order = orderRepo.create({
                customerId: { id: userId } as any,
                store: { id: storeId } as any,
                condominio_Id: finalCondominioId,
                totalAmount,
                paymentMethod,
                deliveryAddress,
                status: OrderStatus.PENDING
            });

            const savedOrder = await orderRepo.save(order);

            // 5. Criar os Itens do Pedido (OrderItems)
            const itemRepo = queryRunner.manager.getRepository(OrderItem);
            const orderItems = items.map(item => {
                return itemRepo.create({
                    order: savedOrder,
                    product: { id: item.productId } as any,
                    name: item.name || "Produto sem nome", // Fallback para evitar erro de DEFAULT
                    image: item.image || "",
                    quantity: item.quantity,
                    price: item.price
                });
            });

            await itemRepo.save(orderItems);

            // 6. Busca o pedido completo para o retorno
            const orderComplete = await queryRunner.manager.getRepository(Order).findOne({
                where: { id: savedOrder.id },
                relations: ["store", "items", "items.product", "customer"]
            });

            await queryRunner.commitTransaction();
            return orderComplete;

        } catch (err: any) {
            await queryRunner.rollbackTransaction();
            console.error("ERRO NO SERVICE:", err.message);
            throw new Error(err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async notifyStatusChange(order: Order, newStatus: string) {
        const io = getIO();

        const storeName: string = order.store?.name || "nossa loja";
        const customerName: string = order.customer?.name || "cliente";
        const msgStatus: string = this.getStatusMessage(newStatus); // Aqui resolve o "msgStatus"

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
            const mensagemZap =
                `*GranConecta: Atualização de Pedido*\n\n` +
                `Olá, ${customerName}!\n` +
                `O seu pedido na loja *${storeName}* agora está: *${newStatus.toUpperCase()}*.\n\n` +
                `${msgStatus}\n\n` +
                `🔗 Acompanhe aqui: ${linkAcompanhamento}`;

            // ✅ Chamando o método correto
            await this.sendWhatsApp(order.customer.telefone, mensagemZap);
        }
    }


    private getStatusMessage(status: string) {
        const messages: any = {
            pago: "Seu pagamento foi confirmado! 🚀",
            preparando: "Seu pedido está sendo preparado com carinho! 📦",
            saiu_entrega: "Opa! Seu pedido saiu para entrega. Prepare o QR Code! 🛵",
            entregue: "Pedido entregue. Aproveite! ✅"
        };
        return messages[status] || "Status atualizado!";
    }

    private async sendWhatsApp(telefone: string, mensagem: string) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = new Twilio(accountSid, authToken);

        try {
            await client.messages.create({
                from: 'whatsapp:+14155238886', // Número padrão do sandbox
                to: `whatsapp:${telefone}`,
                body: mensagem
            });
            console.log("WhatsApp enviado via Twilio");
        } catch (error) {
            console.error("Erro Twilio:", error);
        }
    }

    async generateInitialPayment(order: Order) {
        // Convertemos a store para 'any' para o TS não reclamar da propriedade inexistente
        const store = order.store as any;
        const paymentConfig = store?.paymentConfig;


        console.log('paymentConfigggggggggggggggggggg ', paymentConfig)

        if (!paymentConfig) {
            throw new Error("Loja não possui configuração de pagamento ativa.");
        }

        return await PaymentGatewayService.createPayment(order, paymentConfig);
    }
}