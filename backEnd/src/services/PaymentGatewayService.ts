
import {
  MercadoPagoConfig,
  Payment,
  Preference,
} from "mercadopago";

import { Order } from "../models/OrderModels";
import { StorePaymentConfig } from "../models/StorePaymentConfigModels";

export class PaymentGatewayService {

  private static isLocal(): boolean {
    return process.env.NODE_ENV === "local";
  }

  /**
   * Gera uma resposta fictícia no ambiente local.
   *
   * Não acessa Mercado Pago.
   * Não utiliza chaves PIX reais.
   * Não aprova o pagamento automaticamente.
   */
  private static createMockPayment(
    order: Order,
    method: string
  ) {
    if (
      !Number.isFinite(Number(order.totalAmount)) ||
      Number(order.totalAmount) <= 0
    ) {
      throw new Error(
        "Valor total do pedido inválido."
      );
    }

    if (!order.id) {
      throw new Error(
        "Pedido sem identificação."
      );
    }

    const transactionId =
      `LOCAL_${String(order.id)}`;

    console.log(
      "[PAYMENT MOCK] Pagamento simulado:",
      {
        orderId: order.id,
        method,
        amount: order.totalAmount,
        transactionId,
      }
    );

    return {
      provider: "mock",
      orderId: order.id,
      amount: order.totalAmount,
      payment_method: method,
      id_transacao_mp: transactionId,
      status: "pending",
      simulated: true,
    };
  }

  /**
   * Método principal de pagamento.
   */
  static async createPayment(
    order: Order,
    config: StorePaymentConfig
  ) {
    if (!order.paymentMethod) {
      throw new Error(
        "Método de pagamento não informado"
      );
    }

    const method =
      order.paymentMethod.toLowerCase();

    // ==========================================
    // AMBIENTE LOCAL - PAGAMENTO SIMULADO
    // ==========================================
    if (this.isLocal()) {
      return this.createMockPayment(
        order,
        method
      );
    }

    // ==========================================
    // DEV E PRODUÇÃO - FLUXO ORIGINAL
    // ==========================================
    switch (method) {
      case "pix":
        if (
          config.mercadoPagoAccessToken &&
          config.mercado_pago_enabled
        ) {
          return this.createMercadoPagoPixPayment(
            order,
            config
          );
        }

        return this.createStaticPixPayment(
          order,
          config
        );

      case "online":
      case "mercado_pago":
        return this.createMercadoPagoPreference(
          order,
          config
        );

      default:
        console.log(
          `Método ${method} não requer processamento de gateway.`
        );
        return null;
    }
  }

  /**
   * PIX transparente Mercado Pago.
   */
  static async createMercadoPagoPixPayment(
    order: Order,
    config: StorePaymentConfig
  ) {

    // Proteção também para chamadas diretas.
    if (this.isLocal()) {
      return this.createMockPayment(
        order,
        "pix"
      );
    }

    if (!order.totalAmount) {
      throw new Error(
        "Valor total do pedido não especificado."
      );
    }

    const mp = new MercadoPagoConfig({
      accessToken:
        config.mercadoPagoAccessToken,
    });

    const paymentClient = new Payment(mp);

    const customerEmail =
      (order as any).customer?.email ||
      "comprador@emailanonimo.com";

    const customerName =
      (order as any).customer?.name ||
      "Comprador Anonimo";

    try {
      const response =
        await paymentClient.create({
          body: {
            transaction_amount:
              Number(order.totalAmount),

            description:
              `Pedido #${order.id} - GranConecta`,

            payment_method_id: "pix",

            external_reference:
              String(order.id),

            payer: {
              email: customerEmail,

              first_name:
                customerName.split(" ")[0],

              last_name:
                customerName
                  .split(" ")
                  .slice(1)
                  .join(" ") || "Silva",
            },
          },
        });

      const pointOfInteraction =
        response.point_of_interaction;

      return {
        provider: "mercado_pago_pix",
        orderId: order.id,
        amount: order.totalAmount,

        qr_code:
          pointOfInteraction
            ?.transaction_data
            ?.qr_code,

        qr_code_base64:
          pointOfInteraction
            ?.transaction_data
            ?.qr_code_base64,

        ticket_url:
          pointOfInteraction
            ?.transaction_data
            ?.ticket_url,

        id_transacao_mp:
          response.id,
      };

    } catch (error) {
      console.error(
        "[PaymentGatewayService] Erro ao gerar PIX:",
        error
      );

      throw error;
    }
  }

  /**
   * PIX estático da loja.
   */
  static async createStaticPixPayment(
    order: Order,
    config: StorePaymentConfig
  ) {

    if (this.isLocal()) {
      return this.createMockPayment(
        order,
        "pix_estatico"
      );
    }

    if (
      !config.pix_enabled ||
      !config.pix_key
    ) {
      throw new Error(
        "PIX não configurado para esta loja (Chave ausente)"
      );
    }

    const fakePix = {
      qr_code:
        "data:image/png;base64,FAKE_QR_CODE",

      qr_code_base64:
        "FAKE_BASE64",

      copiaCola:
        `PIX_${config.pix_key}_${order.id}`,

      expiresAt:
        new Date(
          Date.now() + 15 * 60 * 1000
        ),
    };

    return {
      provider: "pix_estatico",
      orderId: order.id,
      amount: order.totalAmount,
      ...fakePix,
    };
  }

  /**
   * Mercado Pago Checkout Pro.
   */
  static async createMercadoPagoPreference(
    order: Order,
    config: StorePaymentConfig
  ) {

    if (this.isLocal()) {
      return this.createMockPayment(
        order,
        "mercado_pago"
      );
    }

    if (
      !config.mercado_pago_enabled ||
      !config.mercadoPagoAccessToken
    ) {
      throw new Error(
        "Mercado Pago não configurado"
      );
    }

    if (
      !order.items ||
      !order.items.length
    ) {
      throw new Error(
        "Pedido sem itens"
      );
    }

    const mp = new MercadoPagoConfig({
      accessToken:
        config.mercadoPagoAccessToken,
    });

    const preference =
      await new Preference(mp).create({
        body: {
          items: order.items.map(
            (item: any) => ({
              id: String(item.id),

              title:
                item.name ||
                item.product?.name ||
                "Produto",

              quantity: item.quantity,

              unit_price:
                Number(item.price),
            })
          ),

          external_reference:
            String(order.id),
        },
      });

    return {
      provider: "mercado_pago",
      orderId: order.id,

      init_point:
        preference.init_point ||
        (preference as any)
          .body?.init_point,
    };
  }
}
