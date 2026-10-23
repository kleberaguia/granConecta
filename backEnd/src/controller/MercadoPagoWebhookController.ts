import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Order, OrderStatus } from '../models/OrderModels';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { StorePaymentConfig } from '../models/StorePaymentConfigModels';
import { decrypt } from '../utils/crypto';

export class MercadoPagoWebhookController {
    async handle(req: Request, res: Response) {
        if (process.env.NODE_ENV === "local") {
            console.warn("[MercadoPagoWebhookController][LOCAL] Webhook externo ignorado; nenhum pagamento será confirmado.");
            return res.status(200).send("IGNORADO_LOCAL");
        }
        const { type, data } = req.body;

        // O Mercado Pago avisa quando um pagamento é criado/aprovado
        if (type === "payment" && data?.id) {
            try {
                const paymentId = data.id;

                // 1. Buscamos o pedido que tem essa referência externa (external_reference)
                // Para saber qual token usar para consultar a API do MP, precisamos achar a loja
                const orderRepo = AppDataSource.getRepository(Order);
                const order = await orderRepo.findOne({
                    where: { id: req.body.data?.external_reference } as any, // Ajuste conforme seu payload
                });

                if (order) {
                    // 2. Buscamos as credenciais da loja para validar o pagamento na API do MP
                    const configRepo = AppDataSource.getRepository(StorePaymentConfig);
                    const paymentConfig = await configRepo.findOne({ where: { store_id: order.storeId } as any });
                    
                    if (paymentConfig?.mercadoPagoAccessToken) {
                        const tokenDecrypted = decrypt(paymentConfig.mercadoPagoAccessToken);
                        
                        const mp = new MercadoPagoConfig({ accessToken: tokenDecrypted });
                        const paymentClient = new Payment(mp);
                        const mpPayment = await paymentClient.get({ id: paymentId });

                        // 3. 🟢 SE ESTIVER APROVADO, ATUALIZA O BANCO DE DADOS
                        if (mpPayment.status === "approved") {
                            order.status = OrderStatus.PAID; // Ou o status que seu banco usa (ex: 2)
                            await orderRepo.save(order);

                        }
                    }
                }
            } catch (err) {
                console.error("Erro ao processar webhook do MP:", err);
            }
        }

        // O Mercado Pago exige que você retorne status 200 imediatamente
        return res.status(200).send("OK");
    }
}