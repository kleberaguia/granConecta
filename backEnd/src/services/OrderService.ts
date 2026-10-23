// src/services/OrderService.ts
import { AppDataSource } from "../config/data-source";
import { Order, OrderStatus } from "../models/OrderModels";
import { OrderItem } from "../models/OrderItemModels";
import { Usuario } from "../models/UserModels";
import { Store } from "../models/StoreModels";
import { getIO } from "../socket/socket";
import { Twilio } from 'twilio';
import { PaymentGatewayService } from "./PaymentGatewayService";
import { StorePaymentConfig } from "../models/StorePaymentConfigModels";
import { EntityManager } from "typeorm";
import { decrypt } from "../utils/crypto";
import PagamentoService from "./PagamentoService";

interface IOrderRequest {
    userId: string;
    storeId: string;
    paymentMethod: string;
    deliveryAddress: string;
    items: {
        productId: string;
        name: string;
        image: string;
        quantity: number;
        price: number;
    }[];
}

export class OrderService {
    async execute({ userId, storeId, paymentMethod, deliveryAddress, items }: IOrderRequest, manager?: EntityManager) {

        // Se o manager vier do Controller, usamos ele. 
        // Se não (chamada avulsa), iniciamos um novo queryRunner.
        const queryRunner = !manager ? AppDataSource.createQueryRunner() : null;

        if (queryRunner) {
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        // Definimos o manager de trabalho (o que veio ou o do novo queryRunner)
        const workManager = manager || queryRunner!.manager;

        try {
            // 1. Buscar o usuário/visitante usando o workManager
            const userRepo = workManager.getRepository(Usuario);
            const customer = await userRepo.findOne({
                where: { id: userId },
                select: ["id", "condominio_id", "tipo", "name", "telefone"]
            });

            if (!customer) {
                throw new Error("Cliente não encontrado.");
            }

            // 2. Definir o condominioId do pedido
            let finalCondominioId = customer.condominio_id;

            if (!finalCondominioId) {
                const storeRepo = workManager.getRepository(Store);
                const store = await storeRepo.findOne({ where: { id: storeId } });
                finalCondominioId = (store as any)?.condominio_id || null;
            }

            // 3. Calcular o total
            const totalAmount = items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);

            // 4. Criar o Pedido (Order) - Forçando Inserção Direta no MySQL
            const orderRepo = workManager.getRepository(Order);

            // 🟢 Mudamos para insert() direto para evitar o erro de query de update fantasma do TypeORM
            const insertResult = await orderRepo.insert({
                customerId: userId,
                storeId: storeId,
                condominio_Id: finalCondominioId,
                totalAmount,
                paymentMethod,
                deliveryAddress,
                status: "pendente" as any,
                deliveryCode: Math.floor(1000 + Math.random() * 9000).toString()
            });

            // 🟢 VALIDAÇÃO DE SEGURANÇA: Resolve o erro ts(2532) e avisa o compilador que o ID existe
            if (!insertResult.identifiers || !insertResult.identifiers[0]) {
                throw new Error("Erro ao obter o ID do pedido gerado pelo banco.");
            }

            // Captura o ID gerado pelo banco após o insert bruto
            const savedOrderId = insertResult.identifiers[0].id;

            // 5. Criar os Itens vinculados ao ID salvo
            const itemRepo = workManager.getRepository(OrderItem);
            const orderItems = items.map(item => itemRepo.create({
                order: { id: savedOrderId } as any, // Vincula usando a referência de ID limpa
                product: { id: item.productId } as any,
                name: item.name || "Produto",
                image: item.image || "",
                quantity: item.quantity,
                price: item.price
            }));

            await itemRepo.save(orderItems);
            // 6. Retorno completo estruturado para o fluxo do PIX no front-end
            const orderComplete = await orderRepo.findOne({
                where: { id: savedOrderId },
                relations: ["store", "items", "items.product", "customer"]
            });

            // Só damos commit se fomos nós que iniciamos a transação
            if (queryRunner) await queryRunner.commitTransaction();

            return orderComplete;

        } catch (err: any) {
            if (queryRunner) await queryRunner.rollbackTransaction();
            console.error("ERRO NO SERVICE:", err.message);
            throw new Error(err.message);
        } finally {
            if (queryRunner) await queryRunner.release();
        }
    }

    async notifyStatusChange(order: Order, newStatus: string) {
        const io = getIO();

        const storeName: string = order.store?.name || "nossa loja";
        const customerName: string = order.customer?.name || "cliente";
        const msgStatus: string = this.getStatusMessage(newStatus);

        // 1. Notificação Socket
        io.to(`order_customer_${order.customerId}`).emit("status_changed", {
            orderId: order.id,
            status: newStatus,
            message: this.getStatusMessage(newStatus)
        });

        // 2. Notificação de contingência via WhatsApp
        if (order.customer && order.customer.telefone) {
            const linkAcompanhamento = `https://granconecta.com.br/pedido/${order.id}`;

            const mensagemZap =
                `*GranConecta: Atualização de Pedido*\n\n` +
                `Olá, ${customerName}!\n` +
                `O seu pedido na loja *${storeName}* agora está: *${newStatus.toUpperCase()}*.\n\n` +
                `${msgStatus}\n\n` +
                `🔗 Acompanhe aqui: ${linkAcompanhamento}`;

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
                from: 'whatsapp:+14155238886',
                to: `whatsapp:${telefone}`,
                body: mensagem
            });
            console.log("WhatsApp enviado via Twilio");
        } catch (error) {
            console.error("Erro Twilio:", error);
        }
    }

    async generateInitialPayment(order: Order) {
        const currentStoreId = order.storeId || (order.store as any)?.id;

        if (!currentStoreId) {
            throw new Error("Não foi possível identificar o ID da loja para processar o pagamento.");
        }

        // Se o método de pagamento não for PIX, ele segue o fluxo legado (Dinheiro/Maquininha)
        if (order.paymentMethod?.toLowerCase() !== "pix") {
            const paymentConfigRepo = AppDataSource.getRepository(StorePaymentConfig);
            const paymentConfig = await paymentConfigRepo.findOne({
                where: { store_id: currentStoreId } as any
            });

            if (!paymentConfig) {
                throw new Error("Loja não possui configuração de pagamento ativa.");
            }

            return await PaymentGatewayService.createPayment(order, paymentConfig);
        }

        // 🚀 ENTRADA NO FLUXO DE CUSTÓDIA DO GRANCONECTA (PIX PRODUTOS)
        try {
            console.log(`🎰 Centralizando pagamento em custódia para o Pedido Numérico: #${order.id}`);

            // 🟢 CORREÇÃO: Usamos apenas order.customerId que é o campo real e tipado da sua Entity Order
           const dadosCustodia = await PagamentoService.criarPagamentoPorPedido(
                order, 
                String(order.customerId)
            );

            // Retorna o objeto adaptado para que o seu modal do Front-end abra instantaneamente
            return {
                id: order.id,
                status: order.status,
                totalAmount: order.totalAmount,
                provider: "mercado_pago_split",
                qr_code: dadosCustodia.transacao_gateway_id,
                link_pagamento: dadosCustodia.link_pagamento,
                payment: dadosCustodia
            };

        } catch (error: any) {
            console.error("❌ Erro fatal ao rodar criação de PIX em custódia:", error.message);
            throw new Error(`Falha ao gerar Gateway de Custódia: ${error.message}`);
        }
    }
}