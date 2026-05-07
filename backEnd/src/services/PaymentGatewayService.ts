import { MercadoPagoConfig, Preference } from "mercadopago";
import { Order } from "../models/OrderModels";
import { StorePaymentConfig } from "../models/StorePaymentConfigModels";

export class PaymentGatewayService {

    // =========================
    // MÉTODO PRINCIPAL (ORQUESTRADOR)
    // =========================
    static async createPayment(
        order: Order,
        config: StorePaymentConfig
    ) {
        if (!order.paymentMethod) {
            throw new Error("Método de pagamento não informado");
        }

        // Normalizamos para minúsculo para evitar erro de 'Pix' vs 'pix'
        const method = order.paymentMethod.toLowerCase();

        switch (method) {
            case "pix":
                return this.createPixPayment(order, config);

            // Adicionamos o 'online' aqui para aceitar o que vem do seu Front-end
            case "online":
            case "mercado_pago":
                return this.createMercadoPagoPayment(order, config);

            default:
                // Para dinheiro ou maquininha, retornamos null (não gera gateway)
                console.log(`Método ${method} não requer processamento de gateway.`);
                return null;
        }
    }

    // =========================
    // PIX (PADRÃO ÚNICO)
    // =========================
    static async createPixPayment(
        order: Order,
        config: StorePaymentConfig
    ) {
        if (!config.pix_enabled || !config.pix_key) {
            throw new Error("PIX não configurado para esta loja");
        }

        // ⚠️ Aqui ainda é mock — depois você pluga ASAAS / EFI / banco
        const fakePix = {
            qrCode: "data:image/png;base64,FAKE_QR_CODE",
            copiaCola: `PIX_${config.pix_key}_${order.id}`,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };

        return {
            provider: "pix",
            orderId: order.id,
            amount: order.totalAmount,
            ...fakePix
        };
    }

    // =========================
    // MERCADO PAGO
    // =========================
    static async createMercadoPagoPayment(
        order: Order,
        config: StorePaymentConfig
    ) {


        if (!config.mercado_pago_enabled || !config.mercadoPagoAccessToken) {
            throw new Error("Mercado Pago não configurado");
        }

        if (!order.items || !order.items.length) {
            throw new Error("Pedido sem itens");
        }

        const mp = new MercadoPagoConfig({
            accessToken: config.mercadoPagoAccessToken
        });

        const preference = await new Preference(mp).create({
            body: {
                items: order.items.map((item: any) => ({
                    id: String(item.id),
                    title: item.name,
                    quantity: item.quantity,
                    unit_price: Number(item.price)
                })),
                external_reference: String(order.id)
            }
        });
       
        return {
            provider: "mercado_pago",
            orderId: order.id,
            init_point: preference.init_point || (preference as any).body?.init_point
        };
    }
}