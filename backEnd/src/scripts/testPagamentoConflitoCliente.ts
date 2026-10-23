import * as dotenv from "dotenv";
import path from "node:path";
import "reflect-metadata";

const ENV = process.env.NODE_ENV || "development";

const envMap: Record<string, string> = {
    local: ".env.local",
    development: ".env.dev",
    production: ".env.production",
};

dotenv.config({
    path: path.resolve(process.cwd(), envMap[ENV] || ".env.dev"),
    override: true,
});

import { AppDataSource } from "../config/data-source";
import { Agenda } from "../models/AgendaModels";
import { Pagamento } from "../models/PagamentoModel";
import PagamentoService from "../services/PagamentoService";

const PAGAMENTO_ID =
    "test-pag-conflito-cliente-002";

const OFERTA_ID =
    "test-pag-conflito-cliente-of-01";

const DATA =
    "2026-10-22";

const HORA =
    "14:00";

async function main() {
    try {
        console.log(
            "================================================"
        );
        console.log(
            "TESTE PAGAMENTO - CONFLITO DE AGENDA DO CLIENTE"
        );
        console.log(
            "================================================"
        );

        await AppDataSource.initialize();

        console.log("\nBanco conectado.");

        const pagamentoRepo =
            AppDataSource.getRepository(Pagamento);

        const agendaRepo =
            AppDataSource.getRepository(Agenda);

        const pagamento =
            await pagamentoRepo.findOne({
                where: {
                    id: PAGAMENTO_ID,
                },
            });

        if (!pagamento) {
            throw new Error(
                "PAGAMENTO_TESTE_NAO_ENCONTRADO"
            );
        }

        console.log(
            "\nPagamento de teste:"
        );

        console.log({
            id: pagamento.id,
            ofertaId: pagamento.ofertaId,
            moradorId: pagamento.moradorId,
            prestadorId: pagamento.prestadorId,
            status: pagamento.status,
            valor: Number(pagamento.valor),
        });

        const agendasAntes =
            await agendaRepo.count({
                where: {
                    ofertaId: OFERTA_ID,
                    data: DATA,
                    hora: HORA,
                },
            });

        console.log(
            "\nAgendas 14:00 antes:",
            agendasAntes
        );

        console.log(
            "\n------------------------------------------"
        );
        console.log(
            "CHAMANDO confirmarAgendaDaOferta()"
        );
        console.log(
            "------------------------------------------\n"
        );

        const resultado =
            await PagamentoService
                .confirmarAgendaDaOferta(
                    pagamento
                );

        const agendasDepois =
            await agendaRepo.count({
                where: {
                    ofertaId: OFERTA_ID,
                    data: DATA,
                    hora: HORA,
                },
            });

        console.log(
            "\n------------------------------------------"
        );
        console.log("RESULTADO");
        console.log(
            "------------------------------------------"
        );

        console.log({
            retorno:
                resultado || null,

            agendasAntes,

            agendasDepois,
        });

        console.log(
            "\n=========================================="
        );
        console.log("DIAGNÓSTICO");
        console.log(
            "=========================================="
        );

        if (
            agendasAntes === 0 &&
            agendasDepois === 0
        ) {
            console.log(
                "\n✅ TESTE PASSOU"
            );

            console.log(
                "O pagamento estava PAGO, mas a agenda conflitante NÃO foi criada."
            );

            console.log(
                "A barreira pós-pagamento protegeu a agenda do cliente."
            );

            return;
        }

        console.error(
            "\n❌ TESTE FALHOU"
        );

        console.error({
            agendasAntes,
            agendasDepois,
        });

        process.exitCode = 1;

    } catch (error) {
        console.error(
            "\n❌ ERRO NO TESTE:",
            error instanceof Error
                ? error.message
                : error
        );

        process.exitCode = 1;

    } finally {
        if (
            AppDataSource.isInitialized
        ) {
            await AppDataSource.destroy();
        }
    }
}

main();