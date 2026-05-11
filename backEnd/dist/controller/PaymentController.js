"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("../config/stripe"));
const data_source_1 = require("../config/data-source");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
const usercreditsModels_1 = require("../models/usercreditsModels");
const creditTransactionsModels_1 = require("../models/creditTransactionsModels");
const PaymentModel_1 = require("../models/PaymentModel");
const WebhookEvent_1 = require("../models/WebhookEvent");
const mercadopago_1 = __importStar(require("mercadopago"));
const UserModels_1 = require("../models/UserModels");
const enums_1 = require("../models/enums");
// Configuração Mercado Pago
const client = new mercadopago_1.default({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});
class PaymentController {
    constructor() {
        this.paymentRepo = data_source_1.AppDataSource.getRepository(PaymentModel_1.Payment);
        this.handleCreateSession = async (req, res) => {
            console.log("📦 Dados recebidos no body:", req.body);
            try {
                const { itens, usuarioId } = req.body;
                if (!itens || itens.length === 0) {
                    return res.status(400).json({
                        error: "Nenhum item enviado"
                    });
                }
                const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
                const perfil = await perfilRepo.findOne({ where: { usuarioId: String(usuarioId) } });
                if (!perfil) {
                    return res.status(404).json({
                        error: "Perfil do prestador não encontrado"
                    });
                }
                if (perfil.payment_status === "PENDENTE" && perfil.checkout_url) {
                    console.log("Usuário já possui checkout pendente");
                    return res.json({
                        checkoutUrl: perfil.checkout_url,
                        reused: true
                    });
                }
                const items = itens.map((item) => {
                    const unitPrice = Number(item.valor);
                    if (!unitPrice || unitPrice <= 0) {
                        throw new Error("Valor inválido no item");
                    }
                    return {
                        id: String(item.plano),
                        title: `Plano ${item.plano} - GranConecta`,
                        quantity: 1,
                        unit_price: unitPrice,
                        currency_id: 'BRL'
                    };
                });
                const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
                const usuario = await usuarioRepo.findOne({
                    where: {
                        id: String(usuarioId)
                    },
                    select: ["id", "email"]
                });
                if (!usuario) {
                    return res.status(404).json({
                        error: "Usuário não encontrado"
                    });
                }
                if (!usuario.email) {
                    return res.status(400).json({
                        error: "Usuário sem email cadastrado"
                    });
                }
                console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
                const preference = new mercadopago_1.Preference(client);
                const userType = (itens[0]?.tipo || 'PRESTADOR').toLowerCase();
                const redirectUrl = `https://granconecta.net.br/login/${userType}`;
                const preferenceBody = {
                    items,
                    external_reference: String(usuarioId),
                    //binary_mode: true,
                    payer: {
                        email: usuario.email,
                    },
                    back_urls: {
                        success: redirectUrl,
                        failure: redirectUrl,
                        pending: redirectUrl,
                    },
                    auto_return: 'approved',
                    metadata: {
                        usuario_id: String(usuarioId),
                        plano: itens[0]?.plano,
                        tipo: itens[0]?.tipo || 'PRESTADOR'
                    },
                    payment_methods: {
                        excluded_payment_methods: [],
                        excluded_payment_types: [],
                        installments: 12,
                    },
                    notification_url: "https://dev.api.granconecta.net.br/api/webhook/mercadopago",
                };
                const result = await preference.create({ body: preferenceBody });
                // const checkoutUrl = result.sandbox_init_point || result.init_point;
                const checkoutUrl = result.init_point;
                perfil.payment_status = "PENDENTE";
                perfil.checkout_session_id = result.id;
                perfil.checkout_url = checkoutUrl;
                perfil.checkout_expira_em = new Date(Date.now() + 1000 * 60 * 60 * 24);
                perfil.plano = itens[0]?.plano;
                perfil.tipo = itens[0]?.tipo || "PRESTADOR";
                perfil.tipo_assinatura = itens[0]?.frequencia || "MENSAL";
                perfil.status_aprovacao = "PENDENTE";
                await perfilRepo.save(perfil);
                await this.paymentRepo.save({
                    usuarioId: String(usuarioId),
                    stripeSessionId: result.id,
                    mercado_pago_preference_id: result.id,
                    mercado_pago_payment_id: null,
                    status: PaymentModel_1.PaymentStatus.PENDING,
                    amount: itens.reduce((acc, i) => acc + Number(i.valor), 0),
                    paymentMethod: 'MERCADO_PAGO',
                    plano: itens[0]?.plano,
                    tipo: itens[0]?.tipo || 'PRESTADOR'
                });
                console.log("Checkout criado com sucesso");
                return res.json({
                    checkoutUrl,
                    reused: false
                });
            }
            catch (err) {
                console.error("Detalhes do Erro Mercado Pago:", err.message);
                if (err.cause) {
                    console.error("Causa:", JSON.stringify(err.cause));
                }
                return res.status(500).json({
                    error: "Erro ao iniciar pagamento",
                    details: err.message
                });
            }
        };
        this.handleCreateSubscription = async (req, res) => {
            try {
                const { usuarioId, plano, valor } = req.body;
                if (!usuarioId) {
                    return res.status(400).json({
                        error: "Usuário obrigatório"
                    });
                }
                const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
                const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
                const usuario = await usuarioRepo.findOne({
                    where: {
                        id: String(usuarioId)
                    }
                });
                if (!usuario) {
                    return res.status(404).json({
                        error: "Usuário não encontrado"
                    });
                }
                const perfil = await perfilRepo.findOne({
                    where: {
                        usuarioId: String(usuarioId)
                    }
                });
                if (!perfil) {
                    return res.status(404).json({
                        error: "Perfil não encontrado"
                    });
                }
                // evita múltiplas assinaturas
                if (perfil.subscription_id &&
                    perfil.payment_status === "ATIVO") {
                    return res.status(400).json({
                        error: "Usuário já possui assinatura ativa"
                    });
                }
                const preApproval = new mercadopago_1.PreApproval(client);
                const isAnnual = plano?.toUpperCase() === "ANUAL";
                const response = await preApproval.create({
                    body: {
                        reason: `Plano ${plano} GranConecta`,
                        external_reference: String(usuarioId),
                        payer_email: usuario.email || undefined,
                        auto_recurring: {
                            frequency: isAnnual ? 12 : 1,
                            frequency_type: "months",
                            transaction_amount: Number(valor),
                            currency_id: "BRL",
                        },
                        back_url: `${process.env.FRONTEND_URL}/assinatura/sucesso`,
                        status: "pending",
                    },
                });
                // =====================================================
                // PERFIL
                // =====================================================
                perfil.subscription_id = response.id;
                perfil.checkout_url = response.init_point;
                perfil.payment_status = "PENDENTE";
                perfil.plano = plano;
                perfil.tipo_assinatura = isAnnual ? "ANUAL" : "MENSAL";
                await perfilRepo.save(perfil);
                await this.paymentRepo.save({
                    usuarioId: String(usuarioId),
                    stripeSessionId: response.id,
                    mercado_pago_preference_id: response.id,
                    status: PaymentModel_1.PaymentStatus.PENDING,
                    amount: Number(valor),
                    paymentMethod: "MERCADO_PAGO",
                    plano,
                    tipo: "PRESTADOR",
                    frequencia: isAnnual ? "ANUAL" : "MENSAL"
                });
                return res.json({
                    checkoutUrl: response.init_point,
                    subscriptionId: response.id
                });
            }
            catch (err) {
                console.error("Erro assinatura Mercado Pago:", err);
                return res.status(500).json({
                    error: "Erro ao criar assinatura",
                    details: err.message
                });
            }
        };
        this.handleMercadoPagoSubscriptionWebhook = async (req, res) => {
            try {
                const { type, data } = req.body;
                console.log("Webhook assinatura recebido:", JSON.stringify(req.body, null, 2));
                if (type === "preapproval") {
                    const subscriptionId = String(data.id);
                    const preApproval = new mercadopago_1.PreApproval(client);
                    const subscription = await preApproval.get({
                        id: subscriptionId
                    });
                    console.log("Dados assinatura:", JSON.stringify(subscription, null, 2));
                    const usuarioId = subscription.external_reference;
                    if (!usuarioId) {
                        console.warn("Usuário não encontrado no webhook");
                        return res.status(200).send("OK");
                    }
                    // =====================================================
                    // ASSINATURA ATIVA
                    // =====================================================
                    if (subscription.status === "authorized") {
                        await this.confirmarPagamentoUniversal(String(usuarioId), subscriptionId);
                        const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
                        await perfilRepo.update({
                            usuarioId: String(usuarioId)
                        }, {
                            payment_status: "ATIVO",
                            ativo: true,
                            disponivel: true,
                            status_aprovacao: "APROVADO"
                        });
                        console.log("✅ Assinatura ativada:", usuarioId);
                    }
                    // =====================================================
                    // ASSINATURA CANCELADA
                    // =====================================================
                    if (subscription.status === "cancelled" ||
                        subscription.status === "paused" ||
                        subscription.status === "expired") {
                        const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
                        await perfilRepo.update({
                            usuarioId: String(usuarioId)
                        }, {
                            payment_status: "CANCELADO",
                            ativo: false,
                            disponivel: false
                        });
                        console.log("❌ Assinatura cancelada:", usuarioId);
                    }
                }
                return res.status(200).send("OK");
            }
            catch (err) {
                console.error("Erro webhook assinatura:", err);
                return res.status(500).send("ERROR");
            }
        };
        // ================================
        // 🔥 WEBHOOK MERCADO PAGO
        // ================================
        // ================================
        // 🔥 WEBHOOK MERCADO PAGO
        // ================================
        this.handleMercadoPagoWebhook = async (req, res) => {
            try {
                // 1. Extração segura dos dados (Query ou Body)
                const topic = req.query.topic || req.body.topic || req.body.type;
                const id = req.query.id || (req.body.data && req.body.data.id);
                const resource = req.body.resource;
                console.log("Webhook Mercado Pago recebido:", JSON.stringify({ query: req.query, body: req.body }, null, 2));
                // Se não houver ID ou tópico, apenas ignoramos para não quebrar
                if (!id && !resource) {
                    return res.status(200).send("OK");
                }
                const mpPayment = new mercadopago_1.Payment(client);
                // =====================================================
                // 🔥 CASO 1: PAYMENT
                // =====================================================
                if (topic === "payment") {
                    const paymentId = String(id);
                    const paymentData = await mpPayment.get({ id: paymentId });
                    console.log("PAYMENT DATA:", JSON.stringify(paymentData, null, 2));
                    if (paymentData.status === "approved" || paymentData.status === "authorized") {
                        console.log("✅ Payment aprovado. Aguardando merchant_order ou processando...");
                        // Você pode chamar o confirmarPagamentoUniversal aqui também se desejar,
                        // mas o merchant_order costuma ser mais completo para o seu fluxo.
                    }
                }
                // =====================================================
                // 🔥 CASO 2: MERCHANT ORDER
                // =====================================================
                if (topic === "merchant_order") {
                    // O ID do merchant_order pode vir no 'id' da query ou dentro do link 'resource'
                    const merchantOrderId = id || (resource ? resource.split("/").pop() : null);
                    if (!merchantOrderId) {
                        return res.status(200).send("OK");
                    }
                    const merchantOrder = await fetch(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`, {
                        headers: {
                            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                        }
                    }).then(r => r.json());
                    console.log("MERCHANT ORDER:", JSON.stringify(merchantOrder, null, 2));
                    const preferenceId = merchantOrder.preference_id;
                    const payment = merchantOrder.payments?.[0];
                    const paymentIdFromOrder = payment?.id;
                    const status = payment?.status;
                    if (status === "approved" || status === "authorized") {
                        const usuarioId = merchantOrder.external_reference || merchantOrder.metadata?.usuario_id;
                        if (!usuarioId) {
                            console.warn("usuarioId não encontrado no merchant_order");
                            return res.status(200).send("OK");
                        }
                        // Atualiza o status no banco usando o preference_id como chave
                        await this.paymentRepo.update({ mercado_pago_preference_id: preferenceId }, {
                            mercado_pago_payment_id: String(paymentIdFromOrder),
                            status: PaymentModel_1.PaymentStatus.PAID
                        });
                        await this.confirmarPagamentoUniversal(String(usuarioId), String(paymentIdFromOrder), preferenceId ? String(preferenceId) : undefined);
                    }
                }
                return res.status(200).send("OK");
            }
            catch (error) {
                console.error("Erro Webhook MP:", error);
                // Retornamos 200 ou 400 para evitar que o MP fique tentando infinitamente em caso de erro de lógica
                return res.status(200).send("Error handled");
            }
        };
    }
    async checkPixStatus(req, res) {
        const usuarioId = req.params.id;
        const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
        if (!usuarioId) {
            return res.status(400).json({
                error: "UsuárioId é obrigatório"
            });
        }
        const usuario = await usuarioRepo.findOne({
            where: { id: usuarioId }
        });
        if (!usuario) {
            return res.status(404).json({
                error: "Usuário não encontrado"
            });
        }
        // Morador não paga
        if (usuario.tipo === "MORADOR") {
            return res.json({
                status: "ISENTO"
            });
        }
        const paymentRepo = data_source_1.AppDataSource.getRepository(PaymentModel_1.Payment);
        const payment = await paymentRepo.findOne({
            where: { usuarioId },
            order: {
                createdAt: "DESC"
            }
        });
        if (!payment) {
            return res.json({
                status: PaymentModel_1.PaymentStatus.PENDING
            });
        }
        return res.json({
            status: payment.status
        });
    }
    // ================================
    // 📊 LISTAR PAGAMENTOS
    // ================================
    async listarPagamentos(req, res) {
        const payments = await this.paymentRepo.find({
            order: { createdAt: "DESC" }
        });
        return res.json(payments);
    }
    // ================================
    // 🔥 WEBHOOK STRIPE
    // ================================
    async handleStripeWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe_1.default.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        const webhookRepo = data_source_1.AppDataSource.getRepository(WebhookEvent_1.WebhookEvent);
        const alreadyProcessed = await webhookRepo.findOne({ where: { id: event.id } });
        if (alreadyProcessed)
            return res.json({ received: true });
        await webhookRepo.save({ id: event.id, type: event.type, processed: false });
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const usuarioId = session.metadata?.usuarioId;
            await this.confirmarPagamentoUniversal(usuarioId, session.id);
        }
        await webhookRepo.update(event.id, { processed: true });
        return res.json({ received: true });
    }
    // ================================
    // 🔐 CONFIRMAÇÃO UNIVERSAL (Stripe & MP)
    // ================================
    async confirmarPagamentoUniversal(usuarioId, paymentId, preferenceId) {
        console.log('Entrou no pagamento universal ');
        await data_source_1.AppDataSource.transaction(async (manager) => {
            const paymentRepo = manager.getRepository(PaymentModel_1.Payment);
            const perfilRepo = manager.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
            const creditRepo = manager.getRepository(usercreditsModels_1.UserCredits);
            const transactionRepo = manager.getRepository(creditTransactionsModels_1.CreditTransactions);
            const usuarioRepo = manager.getRepository(UserModels_1.Usuario);
            // =====================================================
            // 🔍 LOCALIZA PAGAMENTO
            // =====================================================
            let payment = null;
            // 1️⃣ tenta pelo payment_id
            payment = await paymentRepo.findOne({
                where: {
                    mercado_pago_payment_id: paymentId
                }
            });
            // 2️⃣ tenta pelo preference_id
            if (!payment && preferenceId) {
                payment = await paymentRepo.findOne({
                    where: {
                        mercado_pago_preference_id: preferenceId
                    }
                });
            }
            // 3️⃣ fallback stripe
            if (!payment) {
                payment = await paymentRepo.findOne({
                    where: {
                        stripeSessionId: paymentId
                    }
                });
            }
            if (!payment) {
                console.warn("⚠️ Pagamento não localizado no banco.", {
                    usuarioId,
                    paymentId,
                    preferenceId
                });
                // const isAnnual = plano?.toUpperCase() === "ANUAL";
                const perfil = await perfilRepo.findOne({ where: { usuarioId: String(usuarioId) } });
                if (perfil) {
                    perfil.ativo = true;
                    perfil.disponivel = true;
                    perfil.status = "ativo"; // Forçando o valor que você deseja
                    perfil.status_aprovacao = "APROVADO";
                    perfil.payment_status = "PAGO"; // ou "APROVADO", alinhe com seu banco
                    //perfil.tipo_assinatura = isAnnual ? "ANUAL" : "MENSAL";
                    await manager.save(perfil); // Use o manager da transação para salvar
                }
                await manager.update(UserModels_1.Usuario, { id: usuarioId }, {
                    status_conta: "ativo"
                });
                return;
            }
            // =====================================================
            // 🚫 EVITA DUPLICIDADE
            // =====================================================
            if (payment.status === PaymentModel_1.PaymentStatus.PAID) {
                console.log("Pagamento já processado. Verificando integridade do perfil...");
                // Verificação de segurança: O pagamento está pago, mas o perfil foi ativado?
                const perfilStatus = await perfilRepo.findOne({ where: { usuarioId }, select: ["ativo"] });
                if (perfilStatus && !perfilStatus.ativo) {
                    console.log("⚠️ Pagamento OK, mas perfil estava inativo. Corrigindo agora...");
                    // Execute a lógica de ativação aqui antes do return
                    await this.ativarPerfilManual(manager, usuarioId, payment.plano);
                }
                return;
            }
            // =====================================================
            // 💾 ATUALIZA PAYMENT
            // =====================================================
            payment.status = PaymentModel_1.PaymentStatus.PAID;
            payment.mercado_pago_payment_id =
                paymentId;
            if (preferenceId) {
                payment.mercado_pago_preference_id =
                    preferenceId;
            }
            await paymentRepo.save(payment);
            // =====================================================
            // 📌 PERFIL
            // =====================================================
            const perfilAtual = await perfilRepo.findOne({
                where: {
                    usuarioId
                }
            });
            const tipoAssinatura = perfilAtual?.tipo_assinatura?.toUpperCase() || "MENSAL";
            await perfilRepo.update({ usuarioId }, {
                ativo: true,
                disponivel: true,
                status: enums_1.UserStatus.APROVADO,
                status_aprovacao: "APROVADO",
                payment_status: "PAGO",
                tipo_assinatura: tipoAssinatura
            });
            await usuarioRepo.update({ id: usuarioId }, { status_conta: "ativo" });
            let credit = await creditRepo.findOne({ where: { usuarioId } });
            if (!credit) {
                credit = creditRepo.create({ usuarioId, balance: 0 });
            }
            const existingBonus = await transactionRepo.findOne({
                where: {
                    usuarioId,
                    type: creditTransactionsModels_1.TransactionType.BONUS
                }
            });
            if (!existingBonus) {
                const bonusAmount = 100;
                credit.balance = Number(credit.balance) + bonusAmount;
                await creditRepo.save(credit);
                await transactionRepo.save({ usuarioId, amount: bonusAmount, type: creditTransactionsModels_1.TransactionType.BONUS, description: `Ativação automática - Plano ${payment.plano}` });
            }
            console.log(`✅ Pagamento aprovado com sucesso: ${usuarioId}`);
        });
    }
    // ================================
    // 💰 CRÉDITOS
    // ================================
    async getBalanceAndTransactions(req, res) {
        try {
            const usuarioId = req.user.id;
            const balanceData = await data_source_1.AppDataSource.getRepository(usercreditsModels_1.UserCredits).findOne({ where: { usuarioId } });
            const transactions = await data_source_1.AppDataSource.getRepository(creditTransactionsModels_1.CreditTransactions).find({
                where: { usuarioId },
                order: { created_at: "DESC" },
                take: 20
            });
            return res.json({
                saldo: balanceData ? Number(balanceData.balance) : 0,
                historico: transactions
            });
        }
        catch {
            return res.status(500).json({ error: "Erro ao buscar créditos." });
        }
    }
    async ativarPerfilManual(manager, usuarioId, plano) {
        const perfilRepo = manager.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
        const usuarioRepo = manager.getRepository(UserModels_1.Usuario);
        const creditRepo = manager.getRepository(usercreditsModels_1.UserCredits);
        const transactionRepo = manager.getRepository(creditTransactionsModels_1.CreditTransactions);
        console.log(`Iniciando ativação forçada para o usuário: ${usuarioId}`);
        // 1. Atualizar Perfil
        await perfilRepo.update({ usuarioId: String(usuarioId) }, {
            ativo: true,
            disponivel: true,
            status: "ativo", // Garantindo o valor exato que você precisa
            status_aprovacao: "APROVADO",
            payment_status: "PAGO", // Alinhado com sua necessidade
        });
        // 2. Atualizar Usuário
        await usuarioRepo.update({ id: String(usuarioId) }, { status_conta: "ativo" });
        // 3. Garantir Créditos/Bônus (Evitando duplicidade de bônus)
        let credit = await creditRepo.findOne({ where: { usuarioId } });
        if (!credit) {
            credit = creditRepo.create({ usuarioId, balance: 0 });
        }
        const existingBonus = await transactionRepo.findOne({
            where: { usuarioId, type: creditTransactionsModels_1.TransactionType.BONUS }
        });
        if (!existingBonus) {
            const bonusAmount = 100;
            credit.balance = Number(credit.balance) + bonusAmount;
            await creditRepo.save(credit);
            await transactionRepo.save({
                usuarioId,
                amount: bonusAmount,
                type: creditTransactionsModels_1.TransactionType.BONUS,
                description: `Ativação automática - Plano ${plano}`
            });
        }
    }
}
exports.default = new PaymentController();
