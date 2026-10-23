import "reflect-metadata";
import "dotenv/config";

import { AppDataSource } from "../config/data-source";
import CommercialPaymentWebhookService from "../services/commercial/CommercialPaymentWebhookService";

const PAYMENT_ID =
    "073fae4b-47a8-43a1-9e0d-5ab3eb52d6fa";

const OFERTA_ID =
    "c8f226cc-4a9a-42a7-bc7f-70391a04ab32";

async function main(): Promise<void> {
    try {
        console.log(
            "[TEST COMMERCIAL RECOVERY] Inicializando banco..."
        );

        await AppDataSource.initialize();

        console.log(
            "[TEST COMMERCIAL RECOVERY] Banco conectado."
        );

        const service =
            new CommercialPaymentWebhookService();

        console.log(
            "[TEST COMMERCIAL RECOVERY] Reprocessando contratação...",
            {
                paymentId: PAYMENT_ID,
                ofertaId: OFERTA_ID,
            }
        );

        const result =
            await service.processApprovedPayment({
                paymentId: PAYMENT_ID,
                ofertaId: OFERTA_ID,
            });

        console.log(
            "[TEST COMMERCIAL RECOVERY] RESULTADO:"
        );

        console.dir(result, {
            depth: null,
        });

    } catch (error) {
        console.error(
            "[TEST COMMERCIAL RECOVERY] ERRO:",
            error instanceof Error
                ? {
                    message: error.message,
                    stack: error.stack,
                }
                : error
        );

        process.exitCode = 1;

    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();

            console.log(
                "[TEST COMMERCIAL RECOVERY] Banco desconectado."
            );
        }
    }
}

main();