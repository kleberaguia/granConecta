import 'dotenv/config';
import { AppDataSource } from "../config/data-source";
import { Pagamento } from "../models/PagamentoModel";
import { ServicoOferta } from "../models/servicoOfertaModels";
import { Usuario } from "../models/UserModels";
import { NotificationService } from "./NotificationService";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const pagamentoRepo = AppDataSource.getRepository(Pagamento);
const ofertaRepo = AppDataSource.getRepository(ServicoOferta);
const usuarioRepo = AppDataSource.getRepository(Usuario);


// Validação crítica
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    console.error("ERRO: MERCADOPAGO_ACCESS_TOKEN ausente no .env");
}

// Inicializa o Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
    options: { timeout: 10000 }, // Aumentei para 10s para evitar timeout em conexões lentas
});

const preference = new Preference(client);
const payment = new Payment(client);

const PagamentoService = {

    async criarPagamentoPorOferta(ofertaId: string, usuarioId: string) {
        // 1. Buscas iniciais
        const oferta = await ofertaRepo.findOne({
            where: { id: ofertaId },
            relations: ["auth"]
        });

        if (!oferta) throw new Error("OFERTA_NAO_ENCONTRADA");
        if (!oferta.solicitacao) throw new Error("SOLICITACAO_RELACIONADA_NAO_ENCONTRADA");

        const valor = Number(oferta.valor ?? 0);
        if (valor <= 0) throw new Error("VALOR_INVALIDO_PARA_PAGAMENTO");

        const prestador = await usuarioRepo.findOne({ where: { id: oferta.prestadorId } });
        const morador = await usuarioRepo.findOne({ where: { id: usuarioId } });

        if (!morador) throw new Error("MORADOR_NAO_ENCONTRADO");
        if (!prestador) throw new Error("PRESTADOR_NAO_ENCONTRADO");

        // 2. Cria registro local (PENDENTE)
        const registro = pagamentoRepo.create({
            ofertaId: oferta.id,
            prestadorId: prestador.id,
            usuarioId: morador.id,
            valor,
            status: "PENDENTE",
        });

        await pagamentoRepo.save(registro);

        // --- TRATAMENTO DE URL (FIX PARA ERRO BACK_URL) ---
        if (!process.env.APP_BASE_URL) {
            throw new Error("APP_BASE_URL não definido no .env");
        }

        let baseUrl = process.env.APP_BASE_URL.trim();

        // Garante que a URL comece com protocolo http/https (MP exige URL absoluta)
        if (!baseUrl.startsWith("http")) {
            baseUrl = `https://${baseUrl}`;
        }
        // Remove barra no final se o usuário tiver colocado (evita //pagamentos)
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.slice(0, -1);
        }

        const backUrls = {
            success: `${baseUrl}/pagamentos/sucesso`,
            failure: `${baseUrl}/pagamentos/falha`,
            pending: `${baseUrl}/pagamentos/pendente`,
        };

        // --- LÓGICA DE SEGURANÇA PARA EVITAR ERRO UNAUTHORIZED ---
        // O Mercado Pago bloqueia se o payer.email for igual ao email do dono do Token.
        // Vamos garantir um email válido para testes.
        let emailPagador = morador?.auth?.email;

        // Verifica se é email inválido ou muito simples que o MP rejeita
        if (!emailPagador || emailPagador.includes("admin") || !emailPagador.includes("@")) {
            emailPagador = `cliente_teste_${Date.now()}@testuser.com`;
        }

        // Dica: Se quiser ter certeza absoluta que vai passar, descomente a linha abaixo para forçar sempre um email diferente
        // emailPagador = "comprador_generico_123@gmail.com"; 

        try {
            const response = await preference.create({
                body: {
                    items: [
                        {
                            id: oferta.id,
                            title: `Serviço: ${oferta.solicitacao.titulo}`,
                            quantity: 1,
                            currency_id: "BRL",
                            unit_price: valor,
                        },
                    ],
                    payer: {
                        email: emailPagador,
                    },
                    external_reference: registro.id,
                    back_urls: backUrls, // Usa o objeto higienizado
                    auto_return: "approved",
                    notification_url: `${baseUrl}/webhooks/mercadopago`,
                },
            });


            // 4. Atualiza registro com o Link
            registro.link_pagamento = response.init_point ?? null;
            registro.transacao_gateway_id = response.id?.toString() ?? null;

            await pagamentoRepo.save(registro);

        } catch (error: any) {
            console.error("ERRO CRÍTICO MP:", error); // Loga o erro completo
            // Se der erro no MP, removemos o registro local para não ficar "sujo" ou marcamos como falha
            registro.status = "CANCELADO";
            await pagamentoRepo.save(registro);

            // Repassa a mensagem exata do MP
            throw new Error(`ERRO_MERCADO_PAGO: ${error.message || JSON.stringify(error)}`);
        }

        // 5. Notifica Morador
        try {
            await NotificationService.enviar(
                morador.id,
                "Cobrança gerada",
                `O serviço foi concluído. Pagamento de R$ ${valor.toFixed(2)} está pendente.`
            );
        } catch (error) {
            console.warn("⚠️ Falha ao notificar morador (ignorado):", error);
        }

        return registro;
    },

    async processarWebhookMercadoPago(notifBody: any) {
        const topic = notifBody.type || notifBody.topic;
        const paymentId = notifBody.data?.id || notifBody.id;


        if (topic === "payment" && paymentId) {
            try {
                const result = await payment.get({ id: paymentId });

                const externalReference = result.external_reference;
                const status = result.status;

                if (!externalReference) return null;

                const registro = await pagamentoRepo.findOne({
                    where: { id: externalReference },
                });

                if (!registro) {
                    return null;
                }

                let novoStatus = registro.status;
                if (status === "approved") novoStatus = "PAGO";
                else if (status === "pending" || status === "in_process") novoStatus = "PENDENTE";
                else if (status === "cancelled" || status === "rejected") novoStatus = "CANCELADO";

                if (novoStatus !== registro.status) {
                    registro.status = novoStatus;
                    await pagamentoRepo.save(registro);
                }
                return registro;

            } catch (error) {
                return null;
            }
        }
        return null;
    },

    async listarPorMorador(usuarioId: string) {
        return await pagamentoRepo.find({
            where: { usuarioId },
            // Adicionado relations para garantir que o morador veja quem é o prestador
            relations: ["oferta", "oferta.solicitacao", "oferta.prestador"],
            order: { createdAt: "DESC" },
        });
    },

    async listarPorPrestador(prestadorId: string) {
        return await pagamentoRepo.find({
            where: { prestadorId },
            // Adicionado relations aqui também
            relations: ["oferta", "oferta.solicitacao", "oferta.prestador"],
            order: { createdAt: "DESC" },
        });
    },

    async getById(id: string): Promise<Pagamento | null> {
        return await pagamentoRepo.findOne({
            where: { id },
            relations: ["oferta", "oferta.solicitacao", "oferta.prestador"]
        });
    },

    async listarPorUsuario(usuarioId: string) {
        return await pagamentoRepo.find({
            where: [
                { usuarioId: usuarioId },
                { prestadorId: usuarioId }
            ],
            // Carregamos o morador (quem pediu) e o prestador (quem faz)
            // Além da oferta e da solicitação original para ter o título do serviço
            relations: [
                "morador",
                "prestador",
                "oferta",
                "oferta.solicitacao",
                "oferta.prestador"
            ],
            order: { createdAt: "DESC" },
        });
    },

};

export default PagamentoService;