import 'dotenv/config';
import { AppDataSource } from "../config/data-source";
import { Pagamento } from "../models/PagamentoModel";
import { ServicoOferta } from "../models/servicoOfertaModels";
import { Usuario } from "../models/UserModels";
import { NotificationService } from "./NotificationService";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { ServicoCandidatura } from '../models/servicoCandidatura';
import axios from 'axios';
import { Order, OrderStatus } from '../models/OrderModels';
import { Agenda, StatusAgenda } from '../models/AgendaModels';
import AgendaDisponibilidadeService from './AgendaDisponibilidadeService';
import { decrypt } from '../utils/crypto';
import {
    PagamentoTransacao,
    TipoPagamentoTransacao,
    MeioPagamentoTransacao,
    OrigemPagamentoTransacao,
    StatusPagamentoTransacao,
} from "../models/PagamentoTransacaoModel";

const pagamentoRepo = AppDataSource.getRepository(Pagamento);
const pagamentoTransacaoRepo =
    AppDataSource.getRepository(PagamentoTransacao);
const ofertaRepo = AppDataSource.getRepository(ServicoOferta);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const candidaturaRepo = AppDataSource.getRepository(ServicoCandidatura);
const orderRepo = AppDataSource.getRepository(Order);
const agendaRepo = AppDataSource.getRepository(Agenda);

const token = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
    options: { timeout: 10000 },
});

const payment = new Payment(token);

/**
 * Carrega a ponte comercial somente no momento do pós-pagamento.
 *
 * Evita a dependência circular em runtime:
 *
 * PagamentoService
 *   -> CommercialPaymentWebhookService
 *   -> CommercialSchedulingService
 *   -> AgendaService
 *   -> PagamentoService
 */
async function getCommercialPaymentWebhookService() {
    const module =
        await import(
            "./commercial/CommercialPaymentWebhookService"
        );

    return new module.default();
}

const isLocalPaymentTest = () => process.env.NODE_ENV === "local";

const localCheckoutUrl = (reference: string) => {
    const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    return `${frontend}/pagamento/resultado?resultado=pendente&simulado=1&referencia=${encodeURIComponent(reference)}`;
};

const PagamentoService = {

    async getByOfertaId(ofertaId: string): Promise<Pagamento | null> {
        return await pagamentoRepo.findOne({
            where: { ofertaId },
            relations: ["oferta", "prestador", "morador"]
        });
    },

    /**
     * IMPORTANTE - SPLIT 1:1 MERCADO PAGO
     * status_liberacao e um status operacional interno do GranConecta.
     * O pagamento original ja faz o split via OAuth + marketplace_fee.
     * Portanto, este metodo NAO realiza uma segunda transferencia ao prestador.
     */
    async validarLiberacaoRecurso(
        pagamentoId: string,
        prestadorOuLojistaId: string,
        codigoInformado: string
    ) {
        const pagamento = await pagamentoRepo.findOne({
            where: { id: pagamentoId },
            relations: ["oferta", "oferta.solicitacao"]
        });

        if (!pagamento) throw new Error("PAGAMENTO_NAO_ENCONTRADO");
        if (pagamento.status !== "PAGO") throw new Error("CLIENTE_AINDA_NAO_PAGOU");
        if (String(pagamento.prestadorId || "") !== String(prestadorOuLojistaId || "")) {
            throw new Error("PRESTADOR_NAO_AUTORIZADO");
        }
        if (pagamento.codigo_verificacao !== codigoInformado) throw new Error("CODIGO_INVALIDO");
        if (pagamento.status_liberacao === "LIBERADO") throw new Error("SALDO_JA_LIBERADO");

        const oferta = pagamento.oferta as any;
        const tipoFluxo = String(oferta?.tipo_fluxo || "UNICO").toUpperCase();

        // IMPORTANTE: nao chamar /v1/transfers aqui.
        // No Split 1:1 o prestador ja participa do pagamento original.
        console.log("[PAGAMENTO] Conclusao operacional sem novo repasse MP", {
            pagamentoId: pagamento.id,
            ofertaId: pagamento.ofertaId,
            prestadorId: prestadorOuLojistaId,
            tipoFluxo
        });

        if (tipoFluxo === "RECORRENTE") {
            const totalSessoes = Math.max(1, Number(oferta?.total_sessoes || oferta?.totalSessoes || 1));
            const valorTotal = Number(pagamento.valor || 0);
            const valorParcela = Number((valorTotal / totalSessoes).toFixed(2));
            const valorJaLiberado = Number(pagamento.valor_liberado || 0);
            const novoValorLiberado = Math.min(valorTotal, Number((valorJaLiberado + valorParcela).toFixed(2)));

            pagamento.valor_liberado = novoValorLiberado;
            if (novoValorLiberado >= valorTotal) {
                pagamento.status_liberacao = "LIBERADO";
            } else {
                pagamento.status_liberacao = "RETIDO";
                pagamento.codigo_verificacao = Math.floor(1000 + Math.random() * 9000).toString();
            }
        } else {
            pagamento.valor_liberado = Number(pagamento.valor || 0);
            pagamento.status_liberacao = "LIBERADO";
        }

        await pagamentoRepo.save(pagamento);

        if (pagamento.pedidoId) {
            const pedido = await orderRepo.findOne({ where: { id: Number(pagamento.pedidoId) } });
            if (pedido) {
                pedido.status = OrderStatus.DELIVERED;
                await orderRepo.save(pedido);
            }
        }

        await NotificationService.enviar(
            prestadorOuLojistaId,
            "Servico concluido",
            tipoFluxo === "RECORRENTE"
                ? "Uma etapa/sessao do contrato foi concluida no GranConecta."
                : "O contrato foi concluido no GranConecta."
        );

        return {
            success: true,
            status_liberacao: pagamento.status_liberacao,
            valor_liberado: Number(pagamento.valor_liberado || 0),
            observacao: "Status operacional interno; o Split 1:1 ocorre no pagamento.",
            proximoCodigo: tipoFluxo === "RECORRENTE" && pagamento.status_liberacao !== "LIBERADO"
                ? pagamento.codigo_verificacao
                : null
        };
    },

    // =========================================================
    // PAGAMENTO DE PEDIDO (LOJA)
    // =========================================================

    async criarPagamentoPorPedido(
        pedido: Order,
        usuarioId: string
    ) {

        if (!pedido) {
            throw new Error("PEDIDO_NAO_ENCONTRADO");
        }

        const lojistaId =
            pedido.store?.usuarioId ||
            pedido.store?.owner?.id;

        if (!lojistaId) {
            throw new Error("LOJISTA_NAO_ENCONTRADO");
        }

        // 🔥 MUITO IMPORTANTE:
        // NÃO usar ofertaId aqui
        // porque pedidos de loja não possuem oferta.

        let registro = await pagamentoRepo.findOne({
            where: {
                pedidoId: pedido.id
            }
        });

        if (!registro) {

            registro = pagamentoRepo.create({
                pedidoId: pedido.id,
                prestadorId: lojistaId,
                moradorId: usuarioId,
                valor: Number(pedido.totalAmount),
                status: "PENDENTE",
                status_liberacao: "RETIDO",
                codigo_verificacao:
                    Math.floor(1000 + Math.random() * 9000).toString()
            });

            await pagamentoRepo.save(registro);
        }

        if (registro.status === 'PAGO') {
            return registro;
        }

        return await this.gerarPreferenceMercadoPagoForLoja(
            registro,
            lojistaId,
            `Pedido #${pedido.id}`,
            String(pedido.id)
        );
    },

    async gerarPreferenceMercadoPagoForLoja(registro: Pagamento, donoId: string, tituloExibicao: string, pedidoIdReal: string) {
        if (isLocalPaymentTest()) {
            const preferenceId = `LOCAL_LOJA_${registro.id}`;
            const link = localCheckoutUrl(preferenceId);
            registro.link_pagamento = link;
            registro.transacao_gateway_id = preferenceId;
            await pagamentoRepo.save(registro);
            console.log("[PAGAMENTO LOCAL] Checkout de loja simulado", { pagamentoId: registro.id, pedidoIdReal });
            return { ...registro, qr_code: link, link_pagamento: link };
        }

        const moradorIdCamp = (registro as any).usuarioId || (registro as any).moradorId;
        const morador = await usuarioRepo.findOne({ where: { id: moradorIdCamp }, relations: ["auth"] });
        if (!morador) throw new Error("COMPRADOR_NAO_ENCONTRADO");

        const recebedorRecord = await usuarioRepo.findOne({ where: { id: donoId } });
        const collectorIdDestino = (recebedorRecord as any)?.gateway_conta_id;

        const baseUrl = (process.env.APP_BASE_URL || '').trim().replace(/\/$/, "");
        const emailPagador = morador.auth?.email || `cliente_${registro.id.slice(0, 5)}@granconecta.com`;
        const notificationUrl = `${baseUrl}/api/pagamentos/webhook/mercadopago`;

        try {
            const tokenMaster = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();

            const payloadMercadoPago = {
                items: [{
                    id: String(registro.id).substring(0, 16),
                    title: tituloExibicao.substring(0, 250),
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: Number(registro.valor),
                }],
                payer: { email: emailPagador },
                external_reference: String(pedidoIdReal),
                marketplace_fee: Number(registro.valor) * 0.10,
                back_urls: {
                    success: `${baseUrl}/pagamentos/sucesso`,
                    failure: `${baseUrl}/pagamentos/falha`,
                    pending: `${baseUrl}/pagamentos/pendente`,
                },
                auto_return: "approved",
                notification_url: notificationUrl,

                // 🔥 REMOVIDO: default_payment_method_id: null
                // Se você quer que o Pix apareça, não defina preferências restritivas aqui.
                payment_methods: {
                    installments: 12,
                }
            };

            const headersConfig: Record<string, string> = {
                'Authorization': `Bearer ${tokenMaster}`,
                'Content-Type': 'application/json'
            };


            const responseMP = await axios.post(
                'https://api.mercadopago.com/checkout/preferences',
                payloadMercadoPago,
                { headers: headersConfig }
            );

            // Pegamos o link oficial de redirecionamento do Mercado Pago
            const linkCheckoutPro = responseMP.data.init_point;

            registro.link_pagamento = linkCheckoutPro ?? null;
            registro.transacao_gateway_id = responseMP.data.id?.toString() ?? null;

            await pagamentoRepo.save(registro);

            // Retornamos para o front-end
            return {
                ...registro,
                qr_code: linkCheckoutPro, // Passamos o link seguro do Mercado Pago
                link_pagamento: linkCheckoutPro
            };

        } catch (error: any) {
            console.error("=== ERRO GERADOR PREFERENCE LOJA AXIOS ===");
            console.error(JSON.stringify(error.response?.data || error.message, null, 2));
            throw new Error(`FALHA_GATEWAY_PAGAMENTO: ${error.message}`);
        }
    },

    // Adicione este método ao PagamentoService
    async solicitarReembolso(pagamentoId: string, valorEstorno: number) {
        if (isLocalPaymentTest()) throw new Error("REEMBOLSO_REAL_BLOQUEADO_NO_AMBIENTE_LOCAL");
        const pagamento = await pagamentoRepo.findOne({ where: { id: pagamentoId }, relations: ["prestador"] });
        if (!pagamento?.transacao_gateway_id) throw new Error("ID_TRANSACAO_INVALIDO");

        const prestador = await usuarioRepo.findOne({ where: { id: pagamento.prestadorId } });
        if (!prestador?.mercadoPagoAccessToken) throw new Error("PRESTADOR_SEM_TOKEN_OAUTH");

        const prestadorAccessToken = decrypt(prestador.mercadoPagoAccessToken);

        const response = await axios.post(
            `https://api.mercadopago.com/v1/payments/${pagamento.transacao_gateway_id}/refunds`,
            { amount: Number(valorEstorno.toFixed(2)) },
            { headers: { 'Authorization': `Bearer ${prestadorAccessToken}` } }
        );

        pagamento.status = "ESTORNADO";
        await pagamentoRepo.save(pagamento);
        return response.data;
    },

    // =========================================================
    // PAGAMENTO SERVIÇOS
    // =========================================================

    async criarPagamentoPorOferta(
        ofertaId: string,
        usuarioId: string
    ) {
        /**
         * =========================================================
         * PAGAMENTO DE SERVIÇO - ENTRADA + SALDO
         * =========================================================
         *
         * pagamentos.valor = valor total do contrato
         *
         * pagamento_transacoes:
         *
         * ENTRADA = 50%
         * SALDO   = restante
         *
         * Neste momento somente a ENTRADA recebe checkout.
         * O SALDO fica PENDENTE sem preference até a conclusão
         * do serviço.
         */

        const oferta = await ofertaRepo.findOne({
            where: { id: ofertaId },
            relations: ["solicitacao"],
        });

        if (!oferta) {
            throw new Error("OFERTA_NAO_ENCONTRADA");
        }

        const prestadorId =
            String(oferta.prestadorId || "").trim();

        if (!prestadorId) {
            throw new Error("OFERTA_SEM_PRESTADOR");
        }

        const valorTotal =
            Number(Number(oferta.valor || 0).toFixed(2));

        if (valorTotal <= 0) {
            throw new Error("VALOR_OFERTA_INVALIDO");
        }

        /**
         * Evita problemas de centavos.
         *
         * Exemplo:
         * R$ 101,01
         *
         * entrada = 50,51
         * saldo   = 50,50
         */
        const valorEntrada =
            Number((valorTotal * 0.50).toFixed(2));

        const valorSaldo =
            Number((valorTotal - valorEntrada).toFixed(2));

        // =========================================================
        // 1. PAGAMENTO PRINCIPAL
        // =========================================================

        let registro = await pagamentoRepo.findOne({
            where: {
                ofertaId: oferta.id,
            },
        });

        if (!registro) {

            registro = pagamentoRepo.create({
                ofertaId: oferta.id,
                prestadorId,
                moradorId: usuarioId,

                // Sempre o valor TOTAL do contrato.
                valor: valorTotal,

                status: "PENDENTE",

                // Campo legado mantido durante a migração.
                status_liberacao: "RETIDO",
            });

            registro =
                await pagamentoRepo.save(registro);

            console.log(
                "[PAGAMENTO SERVICO] Registro criado",
                {
                    pagamentoId: registro.id,
                    ofertaId: oferta.id,
                    moradorId: usuarioId,
                    prestadorId,
                    valorTotal,
                    valorEntrada,
                    valorSaldo,
                }
            );

        } else {

            console.log(
                "[PAGAMENTO SERVICO] Registro reutilizado",
                {
                    pagamentoId: registro.id,
                    ofertaId: oferta.id,
                    status: registro.status,
                }
            );
        }

        // =========================================================
        // 2. ENTRADA
        // =========================================================

        let entrada =
            await pagamentoTransacaoRepo.findOne({
                where: {
                    pagamentoId: registro.id,
                    tipo:
                        TipoPagamentoTransacao.ENTRADA,
                },
            });

        if (!entrada) {

            entrada =
                pagamentoTransacaoRepo.create({
                    pagamentoId: registro.id,

                    tipo:
                        TipoPagamentoTransacao.ENTRADA,

                    meioPagamento:
                        MeioPagamentoTransacao.MERCADO_PAGO,

                    origem:
                        OrigemPagamentoTransacao.INTEGRADO,

                    valor:
                        valorEntrada,

                    // Plano financeiro: entrada liberada na contratação.
                    ordem: 1,
                    descricao: "Entrada de 50%",
                    gatilhoTipo: "CONTRATACAO" as any,
                    gatilhoReferenciaId: null,

                    status:
                        StatusPagamentoTransacao.PENDENTE,

                    gateway:
                        "MERCADO_PAGO",

                    gatewayPaymentId: null,
                    gatewayPreferenceId: null,
                    linkPagamento: null,

                    confirmadoPrestadorAt: null,
                    confirmadoClienteAt: null,
                });

            entrada =
                await pagamentoTransacaoRepo.save(
                    entrada
                );

            console.log(
                "[PAGAMENTO TRANSACAO] ENTRADA criada",
                {
                    pagamentoId: registro.id,
                    transacaoId: entrada.id,
                    valor: Number(entrada.valor),
                    status: entrada.status,
                }
            );
        }

        // =========================================================
        // 3. SALDO
        // =========================================================

        let saldo =
            await pagamentoTransacaoRepo.findOne({
                where: {
                    pagamentoId: registro.id,
                    tipo:
                        TipoPagamentoTransacao.SALDO,
                },
            });

        if (!saldo) {

            saldo =
                pagamentoTransacaoRepo.create({
                    pagamentoId: registro.id,

                    tipo:
                        TipoPagamentoTransacao.SALDO,

                    meioPagamento:
                        MeioPagamentoTransacao.MERCADO_PAGO,

                    origem:
                        OrigemPagamentoTransacao.INTEGRADO,

                    valor:
                        valorSaldo,

                    // Plano financeiro: saldo cobrado somente na conclusão.
                    ordem: 2,
                    descricao: "Saldo após conclusão do serviço",
                    gatilhoTipo: "CONCLUSAO" as any,
                    gatilhoReferenciaId: null,

                    status:
                        StatusPagamentoTransacao.PENDENTE,

                    gateway:
                        "MERCADO_PAGO",

                    gatewayPaymentId: null,
                    gatewayPreferenceId: null,
                    linkPagamento: null,

                    confirmadoPrestadorAt: null,
                    confirmadoClienteAt: null,
                });

            saldo =
                await pagamentoTransacaoRepo.save(
                    saldo
                );

            console.log(
                "[PAGAMENTO TRANSACAO] SALDO criado",
                {
                    pagamentoId: registro.id,
                    transacaoId: saldo.id,
                    valor: Number(saldo.valor),
                    status: saldo.status,
                }
            );
        }

        // =========================================================
        // 4. CONTRATO JÁ TOTALMENTE PAGO
        // =========================================================

        if (registro.status === "PAGO") {
            return registro;
        }

        // =========================================================
        // 5. ENTRADA JÁ PAGA
        // =========================================================
        //
        // Não devemos gerar uma nova cobrança da entrada.
        // O saldo será cobrado posteriormente pelo fluxo de
        // conclusão do serviço.
        // =========================================================

        if (
            entrada.status ===
            StatusPagamentoTransacao.PAGO
        ) {
            return registro;
        }

        // =========================================================
        // 6. CHECKOUT SOMENTE DA ENTRADA
        // =========================================================

        const solicitacao =
            (oferta as any).solicitacao;

        const titulo =
            String(
                solicitacao?.titulo || ""
            ).trim() ||
            "Serviço";

        return await this.gerarPreferenceMercadoPago(
            registro,
            prestadorId,
            `${titulo} - Entrada`,
            TipoPagamentoTransacao.ENTRADA
        );
    },

    async gerarPreferenceMercadoPago(
        registro: Pagamento,
        donoId: string,
        tituloExibicao: string,
        tipoTransacao: TipoPagamentoTransacao =
            TipoPagamentoTransacao.INTEGRAL
    ) {
        if (isLocalPaymentTest()) {
            const transacao = await pagamentoTransacaoRepo.findOne({
                where: { pagamentoId: registro.id, tipo: tipoTransacao },
            });
            if (!transacao) throw new Error(`TRANSACAO_${tipoTransacao}_NAO_ENCONTRADA`);
            if (transacao.status === StatusPagamentoTransacao.PAGO) {
                return { ...registro, transacao };
            }
            const valorCobranca = Number(Number(transacao.valor || 0).toFixed(2));
            if (!Number.isFinite(valorCobranca) || valorCobranca <= 0) {
                throw new Error("VALOR_TRANSACAO_INVALIDO");
            }
            const preferenceId = `LOCAL_SERVICO_${transacao.id}`;
            const linkPagamento = localCheckoutUrl(preferenceId);
            transacao.gateway = "MERCADO_PAGO";
            transacao.gatewayPreferenceId = preferenceId;
            transacao.linkPagamento = linkPagamento;
            await pagamentoTransacaoRepo.save(transacao);
            registro.link_pagamento = linkPagamento;
            registro.transacao_gateway_id = preferenceId;
            await pagamentoRepo.save(registro);
            console.log("[PAGAMENTO LOCAL] Checkout de serviço simulado", { pagamentoId: registro.id, transacaoId: transacao.id, tipoTransacao, valorCobranca });
            return {
                ...registro,
                transacao: {
                    id: transacao.id,
                    tipo: transacao.tipo,
                    valor: valorCobranca,
                    status: transacao.status,
                    gatewayPreferenceId: preferenceId,
                    linkPagamento,
                },
                mercadoPago: { id: preferenceId, init_point: linkPagamento, simulated: true },
            };
        }

        // =========================================================
        // 1. PRESTADOR / CONTA MERCADO PAGO
        // =========================================================

        const prestador =
            await usuarioRepo.findOne({
                where: { id: donoId },
            });

        const collectorId =
            prestador?.gateway_conta_id;

        if (!prestador?.mercadoPagoAccessToken) {
            throw new Error(
                "PRESTADOR_SEM_TOKEN_OAUTH"
            );
        }

        if (!collectorId) {
            throw new Error(
                "PRESTADOR_SEM_COLLECTOR_ID"
            );
        }

        const prestadorAccessToken =
            decrypt(
                prestador.mercadoPagoAccessToken
            );

        // =========================================================
        // 2. COMPRADOR
        // =========================================================

        const morador =
            await usuarioRepo.findOne({
                where: {
                    id: registro.moradorId,
                },
                relations: ["auth"],
            });

        if (!morador) {
            throw new Error(
                "COMPRADOR_NAO_ENCONTRADO"
            );
        }

        // =========================================================
        // 3. CONFIGURAÇÕES
        // =========================================================

        const apiBaseUrl =
            (process.env.APP_BASE_URL || "")
                .trim()
                .replace(/\/$/, "");

        const frontendUrl =
            (process.env.FRONTEND_URL || "")
                .trim()
                .replace(/\/$/, "");

        if (!apiBaseUrl) {
            throw new Error(
                "APP_BASE_URL_NAO_CONFIGURADA"
            );
        }

        if (!frontendUrl) {
            throw new Error(
                "FRONTEND_URL_NAO_CONFIGURADA"
            );
        }

        // =========================================================
        // 4. LOCALIZA A TRANSAÇÃO QUE SERÁ COBRADA
        // =========================================================
        //
        // IMPORTANTE:
        //
        // pagamentos.valor = valor TOTAL do contrato.
        //
        // pagamento_transacoes.valor = valor que realmente será
        // cobrado nesta etapa.
        //
        // Exemplo:
        //
        // contrato = 500
        // ENTRADA  = 250
        // SALDO    = 250
        //
        // A preference precisa usar 250, e não 500.
        // =========================================================

        const transacao =
            await pagamentoTransacaoRepo.findOne({
                where: {
                    pagamentoId: registro.id,
                    tipo: tipoTransacao,
                },
            });

        if (!transacao) {
            throw new Error(
                `TRANSACAO_${tipoTransacao}_NAO_ENCONTRADA`
            );
        }

        if (
            transacao.status ===
            StatusPagamentoTransacao.PAGO
        ) {
            return {
                ...registro,
                transacao,
            };
        }

        const valorCobranca =
            Number(
                Number(
                    transacao.valor || 0
                ).toFixed(2)
            );

        if (valorCobranca <= 0) {
            throw new Error(
                "VALOR_TRANSACAO_INVALIDO"
            );
        }

        // =========================================================
        // 5. HEADERS MERCADO PAGO
        // =========================================================

        const headersConfig = {
            Authorization:
                `Bearer ${prestadorAccessToken}`,

            "X-Marketplace-Scope":
                String(collectorId),

            "Content-Type":
                "application/json",
        };

        // =========================================================
        // 6. PAYLOAD
        // =========================================================

        const payload = {
            items: [
                {
                    id: String(transacao.id),

                    title:
                        tituloExibicao.substring(
                            0,
                            250
                        ),

                    quantity: 1,

                    currency_id: "BRL",

                    // IMPORTANTE:
                    // cobra o valor da TRANSAÇÃO.
                    unit_price:
                        valorCobranca,
                },
            ],

            payer: {
                email:
                    morador.auth?.email ||
                    `cliente_${registro.id.slice(
                        0,
                        5
                    )}@granconecta.com`,
            },

            /**
             * A referência externa aponta para a movimentação financeira
             * específica que está sendo cobrada.
             *
             * Isso permite ao webhook identificar diretamente se o
             * pagamento recebido corresponde a:
             *
             * - ENTRADA
             * - SALDO
             * - INTEGRAL (compatibilidade)
             */
            external_reference:
                transacao.id,

            /**
             * Comissão calculada sobre ESTA cobrança.
             *
             * ENTRADA 250 -> taxa sobre 250.
             * SALDO   250 -> taxa sobre 250.
             */
            marketplace_fee:
                Number(
                    (
                        valorCobranca *
                        0.10
                    ).toFixed(2)
                ),

            back_urls: {
                success:
                    `${frontendUrl}/pagamentos/sucesso`,

                failure:
                    `${frontendUrl}/pagamentos/falha`,

                pending:
                    `${frontendUrl}/pagamentos/pendente`,
            },

            auto_return:
                "approved",

            notification_url:
                `${apiBaseUrl}/api/pagamentos/webhook/mercadopago`,
        };

        // =========================================================
        // 7. CRIA PREFERENCE
        // =========================================================

        const response =
            await axios.post(
                "https://api.mercadopago.com/checkout/preferences",
                payload,
                {
                    headers:
                        headersConfig,
                }
            );

        const preferenceId =
            response.data.id?.toString() ||
            null;

        const linkPagamento =
            response.data.init_point ||
            null;

        // =========================================================
        // 8. ATUALIZA A TRANSAÇÃO ESPECÍFICA
        // =========================================================

        transacao.gateway =
            "MERCADO_PAGO";

        transacao.gatewayPreferenceId =
            preferenceId;

        transacao.linkPagamento =
            linkPagamento;

        await pagamentoTransacaoRepo.save(
            transacao
        );

        // =========================================================
        // 9. COMPATIBILIDADE COM O PAGAMENTO LEGADO
        // =========================================================
        //
        // Enquanto o restante do sistema ainda consulta
        // pagamento.link_pagamento, mantemos o link da cobrança
        // atual também no registro principal.
        // =========================================================

        registro.link_pagamento =
            linkPagamento;

        registro.transacao_gateway_id =
            preferenceId;

        await pagamentoRepo.save(
            registro
        );

        console.log(
            "[PAGAMENTO TRANSACAO] Preference vinculada",
            {
                pagamentoId:
                    registro.id,

                transacaoId:
                    transacao.id,

                tipo:
                    transacao.tipo,

                valor:
                    valorCobranca,

                preferenceId,

                status:
                    transacao.status,
            }
        );

        // =========================================================
        // 10. RETORNO
        // =========================================================

        return {
            ...registro,

            transacao: {
                id:
                    transacao.id,

                tipo:
                    transacao.tipo,

                valor:
                    valorCobranca,

                status:
                    transacao.status,

                gatewayPreferenceId:
                    preferenceId,

                linkPagamento,
            },

            mercadoPago:
                response.data,
        };
    },

    // =========================================================
    // WEBHOOK MP
    // =========================================================

    async processarWebhookMercadoPago(
        body: any,
        req?: any
    ): Promise<void> {
        if (isLocalPaymentTest()) throw new Error("WEBHOOK_MERCADO_PAGO_REAL_BLOQUEADO_NO_AMBIENTE_LOCAL");
        const paymentId =
            body.data?.id ||
            body.id ||
            body.resource ||
            req?.query?.id;

        const topic =
            body.topic ||
            body.type ||
            body.action;

        const isPaymentEvent =
            topic === "payment" ||
            String(topic || "").startsWith("payment.");

        if (!isPaymentEvent || !paymentId) {
            console.log("⚠️ Webhook Mercado Pago ignorado", {
                topic,
                paymentId: paymentId || null,
            });
            return;
        }

        try {
            // =========================================================
            // CONSULTA O PAGAMENTO REAL NO MERCADO PAGO
            // =========================================================
            const responseMP = await axios.get(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                    },
                }
            );

            const info = responseMP.data;

            console.log("[MP WEBHOOK DEBUG]", {
                id: info.id,
                status: info.status,
                external_reference: info.external_reference,
                preference_id: info.preference_id ?? null,
                order_id: info.order?.id ?? null,
                collector_id: info.collector_id ?? null,
            });

            if (info.status !== "approved") {
                console.log("⚠️ Pagamento ainda não aprovado", {
                    gatewayPaymentId: paymentId,
                    status: info.status,
                });
                return;
            }

            const gatewayPaymentId = String(info.id || paymentId);

            const externalReference = String(
                info.external_reference || ""
            ).trim();

            if (!externalReference) {
                console.warn(
                    "⚠️ Pagamento aprovado sem external_reference",
                    {
                        gatewayPaymentId,
                    }
                );
                return;
            }

            // =========================================================
            // AUXILIAR - PÓS PAGAMENTO INTEGRAL
            // =========================================================
            const processarPosPagamentoIntegral = async (
                pagamento: Pagamento
            ): Promise<void> => {
                let commercialHandled = false;

                try {
                    const commercialPaymentWebhookService =
                        await getCommercialPaymentWebhookService();

                    const commercialResult =
                        await commercialPaymentWebhookService.processApprovedPayment({
                            paymentId: pagamento.id,
                            ofertaId: pagamento.ofertaId,
                        });

                    commercialHandled = commercialResult.handled;

                    console.log(
                        "[COMMERCIAL WEBHOOK] Resultado pós-pagamento",
                        commercialResult
                    );
                } catch (commercialError) {
                    console.error(
                        "[COMMERCIAL WEBHOOK] Pagamento aprovado, mas houve erro no pós-pagamento:",
                        commercialError instanceof Error
                            ? commercialError.message
                            : commercialError
                    );
                }

                if (!commercialHandled) {
                    try {
                        await this.confirmarAgendaDaOferta(pagamento);
                    } catch (legacyAgendaError) {
                        console.error(
                            "[AGENDA LEGADA] Pagamento aprovado, mas houve erro ao confirmar agenda antiga:",
                            legacyAgendaError instanceof Error
                                ? legacyAgendaError.message
                                : legacyAgendaError
                        );
                    }
                }
            };

            // =========================================================
            // AUXILIAR - INTEGRAL / LEGADO
            // =========================================================
            const marcarIntegralComoPago = async (
                pagamento: Pagamento
            ): Promise<void> => {
                let transacao =
                    await pagamentoTransacaoRepo.findOne({
                        where: {
                            pagamentoId: pagamento.id,
                            tipo: TipoPagamentoTransacao.INTEGRAL,
                        },
                    });

                if (!transacao) {
                    transacao =
                        pagamentoTransacaoRepo.create({
                            pagamentoId: pagamento.id,

                            tipo:
                                TipoPagamentoTransacao.INTEGRAL,

                            meioPagamento:
                                MeioPagamentoTransacao.MERCADO_PAGO,

                            origem:
                                OrigemPagamentoTransacao.INTEGRADO,

                            valor: Number(pagamento.valor),

                            status:
                                StatusPagamentoTransacao.PAGO,

                            gateway: "MERCADO_PAGO",

                            gatewayPreferenceId:
                                pagamento.status === "PENDENTE"
                                    ? pagamento.transacao_gateway_id
                                    : null,

                            gatewayPaymentId,

                            linkPagamento:
                                pagamento.link_pagamento || null,

                            confirmadoPrestadorAt: null,
                            confirmadoClienteAt: null,
                        });
                } else {
                    transacao.status =
                        StatusPagamentoTransacao.PAGO;

                    transacao.gatewayPaymentId =
                        gatewayPaymentId;

                    transacao.gateway =
                        "MERCADO_PAGO";

                    if (
                        !transacao.gatewayPreferenceId &&
                        pagamento.status === "PENDENTE" &&
                        pagamento.transacao_gateway_id
                    ) {
                        transacao.gatewayPreferenceId =
                            pagamento.transacao_gateway_id;
                    }

                    if (
                        !transacao.linkPagamento &&
                        pagamento.link_pagamento
                    ) {
                        transacao.linkPagamento =
                            pagamento.link_pagamento;
                    }
                }

                await pagamentoTransacaoRepo.save(transacao);

                console.log(
                    "[PAGAMENTO TRANSACAO] INTEGRAL confirmado",
                    {
                        pagamentoId: pagamento.id,
                        transacaoId: transacao.id,
                        tipo: transacao.tipo,
                        valor: Number(transacao.valor),
                        status: transacao.status,
                        gatewayPaymentId:
                            transacao.gatewayPaymentId,
                    }
                );
            };

            // =========================================================
            // 1. LOJA / PEDIDO
            // external_reference = pedidoId numérico
            // =========================================================
            const pedidoIdNumero =
                Number(externalReference);

            if (!Number.isNaN(pedidoIdNumero)) {
                const pagamentoPedido =
                    await pagamentoRepo.findOne({
                        where: {
                            pedidoId: pedidoIdNumero,
                        },
                    });

                if (pagamentoPedido) {
                    await marcarIntegralComoPago(
                        pagamentoPedido
                    );

                    if (
                        pagamentoPedido.status !== "PAGO"
                    ) {
                        pagamentoPedido.status = "PAGO";

                        pagamentoPedido.status_liberacao =
                            "RETIDO";

                        pagamentoPedido.transacao_gateway_id =
                            gatewayPaymentId;

                        await pagamentoRepo.save(
                            pagamentoPedido
                        );
                    }

                    const pedido =
                        await orderRepo.findOne({
                            where: {
                                id: pedidoIdNumero,
                            },
                        });

                    if (pedido) {
                        pedido.status = OrderStatus.PAID;

                        await orderRepo.save(pedido);

                        console.log(
                            `✅ Pedido ${pedido.id} atualizado para PAID`
                        );
                    }

                    return;
                }
            }

            // =========================================================
            // 2. NOVO FLUXO
            // external_reference = pagamento_transacoes.id
            // =========================================================
            const transacaoDireta =
                await pagamentoTransacaoRepo.findOne({
                    where: {
                        id: externalReference,
                    },
                });

            if (transacaoDireta) {
                const pagamento =
                    await pagamentoRepo.findOne({
                        where: {
                            id: transacaoDireta.pagamentoId,
                        },
                        relations: ["prestador"],
                    });

                if (!pagamento) {
                    console.error(
                        "❌ Transação encontrada sem pagamento pai",
                        {
                            transacaoId:
                                transacaoDireta.id,
                            pagamentoId:
                                transacaoDireta.pagamentoId,
                        }
                    );
                    return;
                }

                // -----------------------------------------
                // IDEMPOTÊNCIA
                // -----------------------------------------
                if (
                    transacaoDireta.status ===
                    StatusPagamentoTransacao.PAGO &&
                    transacaoDireta.gatewayPaymentId ===
                    gatewayPaymentId
                ) {
                    console.log(
                        "[PAGAMENTO TRANSACAO] Webhook duplicado ignorado",
                        {
                            transacaoId:
                                transacaoDireta.id,
                            pagamentoId:
                                pagamento.id,
                            gatewayPaymentId,
                        }
                    );

                    return;
                }

                // -----------------------------------------
                // CONFIRMA A TRANSAÇÃO ESPECÍFICA
                // -----------------------------------------
                transacaoDireta.status =
                    StatusPagamentoTransacao.PAGO;

                transacaoDireta.gatewayPaymentId =
                    gatewayPaymentId;

                transacaoDireta.gateway =
                    "MERCADO_PAGO";

                await pagamentoTransacaoRepo.save(
                    transacaoDireta
                );

                console.log(
                    "[PAGAMENTO TRANSACAO] Parcela confirmada",
                    {
                        pagamentoId: pagamento.id,
                        transacaoId:
                            transacaoDireta.id,
                        tipo:
                            transacaoDireta.tipo,
                        valor:
                            Number(transacaoDireta.valor),
                        status:
                            transacaoDireta.status,
                        gatewayPaymentId,
                    }
                );

                // -----------------------------------------
                // ENTRADA
                // -----------------------------------------
                if (
                    transacaoDireta.tipo ===
                    TipoPagamentoTransacao.ENTRADA
                ) {
                    pagamento.status =
                        "PARCIALMENTE_PAGO";

                    /*
                     * Mantemos o ID real do pagamento
                     * aprovado no campo legado.
                     *
                     * A fonte de verdade financeira
                     * passa a ser pagamento_transacoes.
                     */
                    pagamento.transacao_gateway_id =
                        gatewayPaymentId;

                    await pagamentoRepo.save(
                        pagamento
                    );

                    console.log(
                        "[PAGAMENTO SERVICO] Entrada confirmada",
                        {
                            pagamentoId:
                                pagamento.id,
                            transacaoId:
                                transacaoDireta.id,
                            valorEntrada:
                                Number(
                                    transacaoDireta.valor
                                ),
                            statusPagamento:
                                pagamento.status,
                        }
                    );

                    /*
                     * IMPORTANTE:
                     *
                     * A entrada confirma financeiramente
                     * a contratação, mas NÃO significa
                     * quitação integral.
                     *
                     * Não executamos aqui o fluxo antigo
                     * de pagamento integral.
                     *
                     * A ponte comercial é carregada de forma lazy
                     * para evitar dependência circular em runtime.
                     */
                    try {
                        const commercialPaymentWebhookService =
                            await getCommercialPaymentWebhookService();

                        const commercialResult =
                            await commercialPaymentWebhookService
                                .processApprovedPayment({
                                    paymentId:
                                        pagamento.id,

                                    ofertaId:
                                        pagamento.ofertaId,
                                });

                        console.log(
                            "[COMMERCIAL WEBHOOK] Resultado após ENTRADA paga",
                            commercialResult
                        );
                    } catch (commercialError) {
                        console.error(
                            "[COMMERCIAL WEBHOOK] Entrada paga, mas houve erro no pós-pagamento comercial:",
                            commercialError instanceof Error
                                ? commercialError.message
                                : commercialError
                        );
                    }

                    return;
                }

                // -----------------------------------------
                // SALDO
                // -----------------------------------------
                if (
                    transacaoDireta.tipo ===
                    TipoPagamentoTransacao.SALDO
                ) {
                    const transacoes =
                        await pagamentoTransacaoRepo.find({
                            where: {
                                pagamentoId:
                                    pagamento.id,
                            },
                        });

                    const obrigatorias =
                        transacoes.filter(
                            (t) =>
                                t.tipo ===
                                TipoPagamentoTransacao.ENTRADA ||
                                t.tipo ===
                                TipoPagamentoTransacao.SALDO ||
                                t.tipo ===
                                TipoPagamentoTransacao.PARCELA
                        );

                    const todasPagas =
                        obrigatorias.length > 0 &&
                        obrigatorias.every(
                            (t) =>
                                t.status ===
                                StatusPagamentoTransacao.PAGO ||
                                t.status ===
                                StatusPagamentoTransacao.PAGO_EXTERNAMENTE
                        );

                    pagamento.transacao_gateway_id =
                        gatewayPaymentId;

                    if (todasPagas) {
                        pagamento.status = "PAGO";
                    } else {
                        pagamento.status =
                            "PARCIALMENTE_PAGO";
                    }

                    await pagamentoRepo.save(
                        pagamento
                    );

                    console.log(
                        "[PAGAMENTO SERVICO] Saldo confirmado",
                        {
                            pagamentoId:
                                pagamento.id,
                            transacaoId:
                                transacaoDireta.id,
                            todasPagas,
                            statusPagamento:
                                pagamento.status,
                        }
                    );

                    if (todasPagas) {
                        await processarPosPagamentoIntegral(
                            pagamento
                        );

                        console.log(
                            `✅ Pagamento ${pagamento.id} integralmente quitado.`
                        );
                    }

                    return;
                }

                // -----------------------------------------
                // INTEGRAL NOVO
                // -----------------------------------------
                if (
                    transacaoDireta.tipo ===
                    TipoPagamentoTransacao.INTEGRAL
                ) {
                    pagamento.status = "PAGO";

                    pagamento.status_liberacao =
                        pagamento.status_liberacao ||
                        "RETIDO";

                    pagamento.transacao_gateway_id =
                        gatewayPaymentId;

                    await pagamentoRepo.save(
                        pagamento
                    );

                    await processarPosPagamentoIntegral(
                        pagamento
                    );

                    console.log(
                        `✅ Pagamento ${pagamento.id} integral confirmado via transação.`
                    );

                    return;
                }

                console.warn(
                    "⚠️ Tipo de transação ainda não tratado no webhook",
                    {
                        transacaoId:
                            transacaoDireta.id,
                        tipo:
                            transacaoDireta.tipo,
                    }
                );

                return;
            }

            // =========================================================
            // 3. COMPATIBILIDADE LEGADA
            // external_reference = pagamentos.id
            // =========================================================
            const pagamentoServico =
                await pagamentoRepo.findOne({
                    where: {
                        id: externalReference,
                    },
                    relations: ["prestador"],
                });

            if (!pagamentoServico) {
                console.log(
                    "⚠️ Pagamento de serviço não encontrado",
                    {
                        externalReference,
                        gatewayPaymentId,
                    }
                );

                return;
            }

            /*
             * ATENÇÃO:
             *
             * Este bloco é somente para checkouts
             * antigos cujo external_reference
             * ainda aponta para pagamentos.id.
             */

            await marcarIntegralComoPago(
                pagamentoServico
            );

            if (
                pagamentoServico.status !== "PAGO"
            ) {
                pagamentoServico.status = "PAGO";

                pagamentoServico.status_liberacao =
                    pagamentoServico.status_liberacao ||
                    "RETIDO";

                pagamentoServico.transacao_gateway_id =
                    gatewayPaymentId;

                await pagamentoRepo.save(
                    pagamentoServico
                );
            }

            await processarPosPagamentoIntegral(
                pagamentoServico
            );

            console.log(
                `✅ Pagamento legado ${pagamentoServico.id} confirmado via Webhook.`
            );

            return;
        } catch (error: any) {
            console.error(
                "❌ ERRO WEBHOOK MP:",
                error?.response?.data ||
                error?.message ||
                error
            );
        }
    },


    async confirmarAgendaDaOferta(pagamento: Pagamento) {
        const pagamentoCompleto = await pagamentoRepo.findOne({
            where: { id: pagamento.id },
            relations: ["oferta", "oferta.solicitacao"],
        });

        const oferta = pagamentoCompleto?.oferta as any;
        const solicitacao = oferta?.solicitacao as any;
        const metadata = solicitacao?.metadata as Record<string, any> | null;

        if (!pagamentoCompleto || !oferta || !solicitacao) {
            console.warn("[AGENDA PAGAMENTO] Dados insuficientes para confirmar agenda.", {
                pagamentoId: pagamento.id,
            });
            return;
        }

        if (pagamentoCompleto.status !== "PAGO") {
            console.warn("[AGENDA PAGAMENTO] Pagamento ainda não aprovado.", {
                pagamentoId: pagamentoCompleto.id,
                status: pagamentoCompleto.status,
            });
            return;
        }

        if (metadata?.disponibilidadeConsultada !== true) {
            console.warn("[AGENDA PAGAMENTO] Agenda não confirmada porque o horário não foi validado pelo assistente.", {
                pagamentoId: pagamentoCompleto.id,
                ofertaId: oferta.id,
            });
            return;
        }

        const data = String(metadata?.preferenciaData || "").trim();
        const horaRaw = String(metadata?.preferenciaHorario || "").trim();
        const horaMatch = horaRaw.match(/(\d{1,2})(?::(\d{2}))?/);

        if (!data || !horaMatch) {
            console.warn("[AGENDA PAGAMENTO] Preferência de data/hora ausente.", {
                pagamentoId: pagamentoCompleto.id,
                ofertaId: oferta.id,
                data,
                horaRaw,
            });
            return;
        }

        const hora = `${String(Number(horaMatch[1])).padStart(2, "0")}:${String(
            Number(horaMatch[2] || 0),
        ).padStart(2, "0")}`;

        const duracaoMinutos = Number(
            metadata?.duracaoMinutos ||
            metadata?.catalogItemDurationMinutes ||
            60,
        );

        const disponibilidade = await AgendaDisponibilidadeService.consultarHorario({
            prestadorId: oferta.prestadorId,
            moradorId: pagamentoCompleto.moradorId,
            data,
            hora,
            duracaoMinutos,
            limiteAlternativas: 3,
        });

        if (!disponibilidade.disponivel) {
            await NotificationService.enviar(
                pagamentoCompleto.moradorId,
                "Pagamento confirmado, escolha outro horário",
                "Seu pagamento foi aprovado, mas o horário escolhido não está mais disponível. Abra o atendimento para escolher uma nova opção.",
            );

            if (oferta.prestadorId) {
                await NotificationService.enviar(
                    oferta.prestadorId,
                    "Pagamento aprovado sem agenda confirmada",
                    "Um cliente pagou, mas o horário escolhido não estava mais disponível. Combine um novo horário pelo painel.",
                );
            }

            console.warn("[AGENDA PAGAMENTO] Horário indisponível após pagamento.", {
                pagamentoId: pagamentoCompleto.id,
                ofertaId: oferta.id,
                data,
                hora,
                motivo: disponibilidade.motivo,
            });

            return;
        }

        const existing = await agendaRepo.findOne({
            where: { ofertaId: oferta.id, data, hora },
        });

        if (existing) {
            return existing;
        }

        oferta.status = "EM_ANDAMENTO";
        oferta.agenda_liberada = true;
        await ofertaRepo.save(oferta);

        const sessoesCriadas = await agendaRepo.count({
            where: { ofertaId: oferta.id },
        });

        const valorTotalContrato = Number(oferta.valor || pagamentoCompleto.valor || 0);
        const totalSessoes = Number(oferta.total_sessoes || 1);
        const valorParcela = totalSessoes > 0
            ? valorTotalContrato / totalSessoes
            : valorTotalContrato;

        const agenda = await agendaRepo.save(
            agendaRepo.create({
                ofertaId: oferta.id,
                morador: { id: pagamentoCompleto.moradorId } as any,
                prestador: { id: oferta.prestadorId } as any,
                descricao:
                    solicitacao.titulo ||
                    `Sessão ${(sessoesCriadas + 1).toString().padStart(2, "0")}`,
                data,
                hora,
                duracaoMinutos,
                valor_parcela: Number(valorParcela.toFixed(2)),
                status: StatusAgenda.CONFIRMADO,
            }),
        );

        await NotificationService.enviar(
            pagamentoCompleto.moradorId,
            "Sessão confirmada!",
            `Seu pagamento foi aprovado e sua sessão foi marcada para ${new Date(
                data + "T00:00:00",
            ).toLocaleDateString("pt-BR")} às ${hora}.`,
        );

        if (oferta.prestadorId) {
            await NotificationService.enviar(
                oferta.prestadorId,
                "Nova sessão confirmada",
                `Pagamento aprovado e sessão marcada para ${new Date(
                    data + "T00:00:00",
                ).toLocaleDateString("pt-BR")} às ${hora}.`,
            );
        }

        return agenda;
    },



    async sincronizarStatusComGateway(
        pagamentoId: string
    ) {
        if (isLocalPaymentTest()) throw new Error("CONSULTA_GATEWAY_REAL_BLOQUEADA_NO_AMBIENTE_LOCAL");

        const registro = await pagamentoRepo.findOne({
            where: { id: pagamentoId }
        });

        if (!registro) {
            throw new Error("PAGAMENTO_NAO_ENCONTRADO");
        }

        if (registro.status === "PAGO") {
            return {
                atualizado: false,
                status: "PAGO"
            };
        }

        if (!registro.transacao_gateway_id) {
            throw new Error("PAGAMENTO_SEM_REFERENCIA");
        }

        try {

            const result = await payment.get({
                id: registro.transacao_gateway_id
            });

            if (result.status === "approved") {

                registro.status = "PAGO";

                await pagamentoRepo.save(registro);

                let commercialHandled = false;

                try {
                    const commercialPaymentWebhookService =
                        await getCommercialPaymentWebhookService();

                    const commercialResult =
                        await commercialPaymentWebhookService
                            .processApprovedPayment({
                                paymentId:
                                    registro.id,

                                ofertaId:
                                    registro.ofertaId,
                            });

                    commercialHandled =
                        commercialResult.handled;

                    console.log(
                        "[COMMERCIAL SYNC] Resultado pós-pagamento",
                        commercialResult
                    );
                } catch (commercialError) {
                    console.error(
                        "[COMMERCIAL SYNC] Pagamento aprovado, mas houve erro no pós-pagamento:",
                        commercialError instanceof Error
                            ? commercialError.message
                            : commercialError
                    );
                }

                if (!commercialHandled) {
                    await this.confirmarAgendaDaOferta(
                        registro
                    );
                }

                await NotificationService.enviar(
                    registro.prestadorId,
                    "Pagamento Confirmado",
                    "Pagamento aprovado no Mercado Pago."
                );

                return {
                    atualizado: true,
                    status: "PAGO"
                };
            }

            return {
                atualizado: false,
                status: registro.status
            };

        } catch (error: any) {

            console.error(
                `Erro sync pagamento ${pagamentoId}:`,
                error.message
            );

            return {
                atualizado: false,
                status: registro.status
            };
        }
    },

    async listarPorUsuario(usuarioId: string) {
        const pagamentos = await pagamentoRepo.find({
            where: [
                { moradorId: usuarioId },
                { prestadorId: usuarioId }
            ],
            relations: [
                "morador",
                "prestador",
                "oferta",
                "oferta.solicitacao"
            ],
            order: {
                createdAt: "DESC"
            }
        });

        const resultado = await Promise.all(
            pagamentos.map(async (p) => {
                const papel =
                    String(p.moradorId) === String(usuarioId)
                        ? "MORADOR"
                        : "PRESTADOR";

                // =====================================================
                // TRANSAÇÕES FINANCEIRAS DO PAGAMENTO
                // =====================================================

                const transacoes =
                    await pagamentoTransacaoRepo.find({
                        where: {
                            pagamentoId: p.id
                        },
                        order: {
                            ordem: "ASC",
                            createdAt: "ASC"
                        }
                    });

                // =====================================================
                // TRANSAÇÕES CONSIDERADAS PAGAS
                // =====================================================

                const transacoesPagas =
                    transacoes.filter((t) =>
                        t.status === StatusPagamentoTransacao.PAGO ||
                        t.status === StatusPagamentoTransacao.PAGO_EXTERNAMENTE
                    );

                const valorPago =
                    Number(
                        transacoesPagas
                            .reduce(
                                (total, t) =>
                                    total + Number(t.valor || 0),
                                0
                            )
                            .toFixed(2)
                    );

                const valorTotal =
                    Number(
                        Number(p.valor || 0).toFixed(2)
                    );

                const valorPendente =
                    Number(
                        Math.max(
                            0,
                            valorTotal - valorPago
                        ).toFixed(2)
                    );

                const percentualPago =
                    valorTotal > 0
                        ? Number(
                            Math.min(
                                100,
                                (valorPago / valorTotal) * 100
                            ).toFixed(2)
                        )
                        : 0;

                // =====================================================
                // ENTRADA
                // =====================================================

                const entrada =
                    transacoes.find(
                        (t) =>
                            t.tipo ===
                            TipoPagamentoTransacao.ENTRADA
                    ) || null;

                // =====================================================
                // SALDO
                // =====================================================

                const saldo =
                    transacoes.find(
                        (t) =>
                            t.tipo ===
                            TipoPagamentoTransacao.SALDO
                    ) || null;

                // =====================================================
                // DATA DO PAGAMENTO
                //
                // Atualmente não existe pago_em na tabela.
                // updatedAt é usado como referência temporária porque
                // é atualizado quando o webhook muda a transação
                // para PAGO.
                // =====================================================

                const mapearTransacao = (t: any) => {
                    if (!t) return null;

                    const estaPaga =
                        t.status ===
                        StatusPagamentoTransacao.PAGO ||
                        t.status ===
                        StatusPagamentoTransacao.PAGO_EXTERNAMENTE;

                    return {
                        id: t.id,

                        tipo: t.tipo,

                        valor:
                            Number(t.valor || 0),

                        status:
                            t.status,

                        descricao:
                            t.descricao || null,

                        ordem:
                            t.ordem ?? null,

                        meio_pagamento:
                            t.meioPagamento || null,

                        origem:
                            t.origem || null,

                        gatilho_tipo:
                            t.gatilhoTipo || null,

                        gatilho_referencia_id:
                            t.gatilhoReferenciaId || null,

                        gateway:
                            t.gateway || null,

                        gateway_payment_id:
                            t.gatewayPaymentId || null,

                        gateway_preference_id:
                            t.gatewayPreferenceId || null,

                        link_pagamento:
                            t.linkPagamento || null,

                        created_at:
                            (t as any).createdAt ||
                            (t as any).created_at ||
                            null,

                        updated_at:
                            (t as any).updatedAt ||
                            (t as any).updated_at ||
                            null,

                        data_pagamento:
                            estaPaga
                                ? (
                                    (t as any).updatedAt ||
                                    (t as any).updated_at ||
                                    null
                                )
                                : null
                    };
                };

                const transacoesMapeadas =
                    transacoes.map(mapearTransacao);

                // =====================================================
                // RETORNO COMPLETO PARA OS DASHBOARDS
                // =====================================================

                return {
                    ...p,

                    papel,

                    // Compatibilidade com o frontend atual
                    pagamento_status:
                        p.status,

                    status_liberacao:
                        p.status_liberacao,

                    valor_liberado:
                        Number(
                            p.valor_liberado || 0
                        ),

                    // Novo resumo financeiro
                    valor_total:
                        valorTotal,

                    valor_pago:
                        valorPago,

                    valor_pendente:
                        valorPendente,

                    percentual_pago:
                        percentualPago,

                    // Detalhamento
                    entrada:
                        mapearTransacao(entrada),

                    saldo:
                        mapearTransacao(saldo),

                    transacoes:
                        transacoesMapeadas
                };
            })
        );

        return resultado;
    },

    async getById(id: string) {

        return await pagamentoRepo.findOne({
            where: { id },
            relations: [
                "oferta",
                "oferta.solicitacao",
                "oferta.prestador",
                "morador"
            ]
        });
    },

    async buscarPorOferta(ofertaId: string) {
        return await this.getByOfertaId(ofertaId);
    },

    async criarCheckoutMercadoPago(data: {
        ofertaId: string;
        titulo: string;
        valor: number;
        pagadorId: string;
    }) {

        return await this.criarPagamentoPorOferta(
            data.ofertaId,
            data.pagadorId
        );
    },

    // async finalizarPagamentoPorOferta(ofertaId: string) {

    //     return await this.getByOfertaId(ofertaId);
    // },

    async finalizarPagamentoPorOferta(ofertaId: string) {
        // =========================================================
        // LIBERA COBRANÇA DO SALDO NA CONCLUSÃO DO SERVIÇO
        // =========================================================

        const registro = await this.getByOfertaId(ofertaId);

        if (!registro) {
            throw new Error("PAGAMENTO_NAO_ENCONTRADO");
        }

        // ---------------------------------------------------------
        // 1. ENTRADA
        // ---------------------------------------------------------

        const entrada = await pagamentoTransacaoRepo.findOne({
            where: {
                pagamentoId: registro.id,
                tipo: TipoPagamentoTransacao.ENTRADA,
            },
        });

        if (!entrada) {
            throw new Error("TRANSACAO_ENTRADA_NAO_ENCONTRADA");
        }

        if (
            entrada.status !==
            StatusPagamentoTransacao.PAGO
        ) {
            throw new Error("ENTRADA_AINDA_NAO_PAGA");
        }

        // ---------------------------------------------------------
        // 2. SALDO
        // ---------------------------------------------------------

        const saldo = await pagamentoTransacaoRepo.findOne({
            where: {
                pagamentoId: registro.id,
                tipo: TipoPagamentoTransacao.SALDO,
            },
        });

        if (!saldo) {
            throw new Error("TRANSACAO_SALDO_NAO_ENCONTRADA");
        }

        // Segurança: este método só libera transações cujo
        // gatilho financeiro seja a conclusão do serviço.
        if (
            String(saldo.gatilhoTipo || "").toUpperCase() !==
            "CONCLUSAO"
        ) {
            throw new Error("SALDO_NAO_E_DE_CONCLUSAO");
        }

        // ---------------------------------------------------------
        // 3. SALDO JÁ PAGO
        // ---------------------------------------------------------

        if (
            saldo.status ===
            StatusPagamentoTransacao.PAGO
        ) {
            console.log(
                "[PAGAMENTO SALDO] Saldo já pago",
                {
                    pagamentoId: registro.id,
                    transacaoId: saldo.id,
                    ofertaId,
                }
            );

            return {
                ...registro,
                transacao: saldo,
            };
        }

        // ---------------------------------------------------------
        // 4. CHECKOUT JÁ EXISTE
        // ---------------------------------------------------------
        // Não cria uma nova Preference toda vez que o endpoint de
        // conclusão for consultado/reexecutado.
        // ---------------------------------------------------------

        if (
            saldo.gatewayPreferenceId &&
            saldo.linkPagamento
        ) {
            console.log(
                "[PAGAMENTO SALDO] Preference já existente",
                {
                    pagamentoId: registro.id,
                    transacaoId: saldo.id,
                    ofertaId,
                    preferenceId:
                        saldo.gatewayPreferenceId,
                }
            );

            return {
                ...registro,
                transacao: saldo,
                qr_code: saldo.linkPagamento,
                link_pagamento: saldo.linkPagamento,
            };
        }

        // ---------------------------------------------------------
        // 5. PRESTADOR
        // ---------------------------------------------------------

        const prestadorId =
            String(registro.prestadorId || "").trim();

        if (!prestadorId) {
            throw new Error("PAGAMENTO_SEM_PRESTADOR");
        }

        // ---------------------------------------------------------
        // 6. TÍTULO
        // ---------------------------------------------------------

        const oferta = registro.oferta;

        let titulo = "Serviço";

        if (oferta?.solicitacao?.titulo) {
            titulo =
                String(
                    oferta.solicitacao.titulo
                ).trim() || "Serviço";
        }

        console.log(
            "[PAGAMENTO SALDO] Liberando cobrança por conclusão",
            {
                pagamentoId: registro.id,
                transacaoId: saldo.id,
                ofertaId,
                valor: Number(saldo.valor),
                gatilhoTipo: saldo.gatilhoTipo,
            }
        );

        // ---------------------------------------------------------
        // 7. GERA CHECKOUT SOMENTE DO SALDO
        // ---------------------------------------------------------
        // gerarPreferenceMercadoPago() já:
        //
        // - encontra a transação SALDO;
        // - usa saldo.valor;
        // - usa saldo.id como external_reference;
        // - grava gatewayPreferenceId;
        // - grava linkPagamento;
        //
        // O status continua PENDENTE.
        // Somente o webhook poderá marcá-lo como PAGO.
        // ---------------------------------------------------------

        return await this.gerarPreferenceMercadoPago(
            registro,
            prestadorId,
            `${titulo} - Saldo final`,
            TipoPagamentoTransacao.SALDO
        );
    },

    gerarUrlOauthMercadoPago(usuarioId: string): string {
        if (isLocalPaymentTest()) throw new Error("OAUTH_MERCADO_PAGO_BLOQUEADO_NO_AMBIENTE_LOCAL");

        const clientId = process.env.MP_CLIENT_ID;

        const redirectUri = encodeURIComponent(
            process.env.MP_REDIRECT_URI || ''
        );

        if (!clientId || !process.env.MP_REDIRECT_URI) {
            throw new Error(
                'CONFIGURACOES_MP_AUSENTES'
            );
        }

        return `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${usuarioId}`;
    },

    async trocarCodigoOauth(code: string) {
        if (isLocalPaymentTest()) throw new Error("OAUTH_MERCADO_PAGO_BLOQUEADO_NO_AMBIENTE_LOCAL");
        const resposta = await axios.post('https://api.mercadopago.com/oauth/token', {
            client_secret: process.env.MP_CLIENT_SECRET,
            client_id: process.env.MP_CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.MP_REDIRECT_URI
        });
        return resposta.data;
    },

    // async liberarFracaoCustodia(ofertaId: string, valor: number) {
    //     try {
    //         // Buscar o pagamento e o prestador
    //         const pagamento = await pagamentoRepo.findOne({
    //             where: { ofertaId },
    //             relations: ["prestador"]
    //         });

    //         if (!pagamento || !pagamento.prestador) {
    //             throw new Error("PAGAMENTO_OU_PRESTADOR_NAO_ENCONTRADO");
    //         }

    //         // Buscar o usuário/prestador no banco
    //         const usuario = await usuarioRepo.findOne({ where: { id: pagamento.prestador.id } });
    //         if (!usuario || !usuario.mercadoPagoAccessToken) {
    //             throw new Error("VENDEDOR_SEM_ACCESS_TOKEN_MP");
    //         }

    //         const vendedorAccessToken = usuario.mercadoPagoAccessToken;
    //         const marketplaceFee = calcularMarketplaceFee(valor);

    //         // Criar preferência com split marketplace
    //         const response = await axios.post(
    //             "https://api.mercadopago.com/checkout/preferences",
    //             {
    //                 items: [
    //                     {
    //                         id: ofertaId,
    //                         title: "Serviço/Produto",
    //                         currency_id: "BRL",
    //                         quantity: 1,
    //                         unit_price: Number(valor)
    //                     }
    //                 ],
    //                 marketplace_fee: Number(marketplaceFee), // comissão calculada
    //                 external_reference: ofertaId
    //             },
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${vendedorAccessToken}`, // token OAuth do vendedor
    //                     "Content-Type": "application/json"
    //                 }
    //             }
    //         );

    //         console.log("✓ Preferência criada com split:", response.data.id);
    //         return response.data;
    //     } catch (error: any) {
    //         console.error("❌ Erro ao criar preferência:", error.response?.data || error.message);
    //         throw new Error("FALHA_AO_CRIAR_PREFERENCIA");
    //     }
    // },
};

function calcularMarketplaceFee(valorTotal: number): number {
    // Exemplo: comissão de 10%
    const percentualComissao = 0.10;
    return valorTotal * percentualComissao;
}

export default PagamentoService;