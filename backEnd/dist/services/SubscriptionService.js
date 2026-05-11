"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const SubscriptionModel_1 = require("../models/SubscriptionModel");
const ChargeModel_1 = require("../models/ChargeModel");
const date_fns_1 = require("date-fns");
const usercreditsModels_1 = require("../models/usercreditsModels");
const creditTransactionsModels_1 = require("../models/creditTransactionsModels");
const RefundRequestModel_1 = require("../models/RefundRequestModel");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
class SubscriptionService {
    constructor() {
        this.subscriptionRepo = data_source_1.AppDataSource.getRepository(SubscriptionModel_1.Subscription);
        this.chargeRepo = data_source_1.AppDataSource.getRepository(ChargeModel_1.Charge);
        this.creditsRepo = data_source_1.AppDataSource.getRepository(usercreditsModels_1.UserCredits);
    }
    //     async gerarAssinaturaPix(usuarioId: string, planoId: string, amountTotal: number, frequencia: string) {
    //         return await AppDataSource.transaction(async (manager) => {
    //             const now = new Date();
    //             const endDate = frequencia.toLowerCase() === 'mensal' ? addMonths(now, 1) : addYears(now, 1);
    //             // 1. Lógica de Abatimento de Créditos
    //             let userCredits = await manager.findOne(UserCredits, { where: { usuarioId } });
    //             let saldoDisponivel = userCredits ? Number(userCredits.balance) : 0;
    //             let valorFinalAPagar = amountTotal;
    //             let valorAbatido = 0;
    //             if (saldoDisponivel > 0) {
    //                 if (saldoDisponivel >= amountTotal) {
    //                     valorFinalAPagar = 0;
    //                     valorAbatido = amountTotal;
    //                     if (userCredits) userCredits.balance = saldoDisponivel - amountTotal;
    //                 } else {
    //                     valorFinalAPagar = amountTotal - saldoDisponivel;
    //                     valorAbatido = saldoDisponivel;
    //                     if (userCredits) userCredits.balance = 0;
    //                 }
    //                 if (userCredits) await manager.save(userCredits);
    //                 // Registrar a transação de uso de crédito
    //                 const transRepo = manager.getRepository(CreditTransactions);
    //                 await manager.save(transRepo.create({
    //                     usuarioId,
    //                     amount: valorAbatido,
    //                     type: TransactionType.USAGE,
    //                     description: `Abatimento de créditos na assinatura do plano ${planoId}`
    //                 }));
    //             }
    //             // 2. Criar a Assinatura (Subscription)
    //             // Se o valor final for 0 (pago totalmente com créditos), já nasce ACTIVE
    //             const statusInicial = valorFinalAPagar <= 0 ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING;
    //             const newSub = manager.create(Subscription, {
    //                 usuarioId,
    //                 plano: planoId.toUpperCase(),
    //                 amount: amountTotal,           // Valor nominal do plano
    //                 total_price_paid: valorAbatido, // O que já foi "pago" via crédito
    //                 status: statusInicial,
    //                 frequencia: frequencia.toLowerCase(),
    //                 createdAt: now,
    //                 end_date: endDate
    //             });
    //             const savedSub = await manager.save(newSub);
    //             // 3. Criar a Cobrança (Charge)
    //             const chargeStatus = valorFinalAPagar <= 0 ? 'PAID' : 'pending';
    //             const newCharge = manager.create(Charge, {
    //                 subscriptionId: savedSub.id,
    //                 usuarioId,
    //                 amount: parseFloat(valorFinalAPagar.toFixed(2)),
    //                 status: chargeStatus as any,
    //                 payment_method: 'PIX',
    //                 createdAt: now
    //             });
    //             const savedCharge = await manager.save(newCharge);
    //             // 4. Se o valor for 0, já sincronizamos o Perfil Prestador imediatamente
    //             if (valorFinalAPagar <= 0) {
    //     await manager.query(
    //         `UPDATE perfil_prestador 
    //          SET ativo = 1, 
    //              status = 'ATIVO', 
    //              status_aprovacao = 'APROVADO', 
    //              disponivel = 1, 
    //              plano = ?
    //          WHERE usuarioId = ?`,
    //         [planoId.toUpperCase(), usuarioId]
    //     );
    // }
    //             return {
    //                 message: valorFinalAPagar <= 0 ? "Plano ativado com sucesso usando créditos!" : "Assinatura gerada com sucesso!",
    //                 subscriptionId: savedSub.id,
    //                 chargeId: savedCharge.id,
    //                 valorOriginal: amountTotal,
    //                 valorAbatido: valorAbatido,
    //                 valorAPagar: valorFinalAPagar,
    //                 pagoComCredito: valorFinalAPagar <= 0,
    //                 // Aqui você integraria com seu provedor de PIX (Mercado Pago, Efí, etc)
    //                 qrcode: valorFinalAPagar <= 0 ? null : "QR_CODE_DATA_AQUI",
    //                 pix_copia_cola: valorFinalAPagar <= 0 ? null : "PIX_CODE_AQUI"
    //             };
    //         });
    //     }
    async gerarAssinaturaPix(usuarioId, planoId, amountTotal, frequencia) {
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            const now = new Date();
            const endDate = frequencia === 'mensal' ? (0, date_fns_1.addMonths)(now, 1) : (0, date_fns_1.addYears)(now, 1);
            // 1. Lógica de Abatimento de Créditos (UserCredits + CreditTransactions)
            let userCredits = await manager.findOne(usercreditsModels_1.UserCredits, { where: { usuarioId } });
            let saldoDisponivel = userCredits ? Number(userCredits.balance) : 0;
            let valorFinalAPagar = amountTotal;
            let valorAbatido = 0;
            if (saldoDisponivel > 0) {
                valorAbatido = Math.min(saldoDisponivel, amountTotal);
                valorFinalAPagar = amountTotal - valorAbatido;
                // Atualiza saldo na UserCredits
                if (userCredits) {
                    userCredits.balance = Number(userCredits.balance) - valorAbatido;
                    await manager.save(userCredits);
                }
                // REGISTRA NA TABELA credit_transactions (O histórico que criamos)
                const transRepo = manager.getRepository(creditTransactionsModels_1.CreditTransactions);
                await manager.save(transRepo.create({
                    usuarioId,
                    amount: valorAbatido, // Valor positivo representando o uso
                    type: creditTransactionsModels_1.TransactionType.USAGE,
                    description: `Uso de crédito para plano ${planoId}`
                }));
            }
            // 2. Criar a Assinatura (Subscription)
            const statusInicial = valorFinalAPagar <= 0 ? SubscriptionModel_1.SubscriptionStatus.ACTIVE : SubscriptionModel_1.SubscriptionStatus.PENDING;
            const newSub = manager.create(SubscriptionModel_1.Subscription, {
                usuarioId,
                plano: planoId.toUpperCase(),
                amount: amountTotal,
                total_price_paid: valorAbatido, // Registra o quanto o crédito cobriu
                status: statusInicial,
                frequencia: frequencia,
                createdAt: now,
                end_date: endDate
            });
            const savedSub = await manager.save(newSub);
            console.log('criando nova assinatura ');
            // 3. Criar a Cobrança (Charge)
            const newCharge = manager.create(ChargeModel_1.Charge, {
                subscriptionId: savedSub.id,
                usuarioId,
                amount: parseFloat(valorFinalAPagar.toFixed(2)),
                status: valorFinalAPagar <= 0 ? 'PAID' : 'pending',
                payment_method: 'PIX',
                createdAt: now
            });
            const savedCharge = await manager.save(newCharge);
            // 4. Ativação Imediata se pago com crédito
            if (valorFinalAPagar <= 0) {
                await manager.query(`UPDATE perfil_prestador 
                 SET ativo = 1, status = 'ATIVO', status_aprovacao = 'APROVADO', disponivel = 1, plano = ?
                 WHERE usuarioId = ?`, [planoId.toUpperCase(), usuarioId]);
            }
            return {
                pagoTotalmenteComCredito: valorFinalAPagar <= 0,
                valorAPagarNoPix: valorFinalAPagar,
                valorAbatido: valorAbatido,
                qrcode: valorFinalAPagar <= 0 ? null : "QR_CODE_DATA",
                pix_copia_cola: valorFinalAPagar <= 0 ? null : "PIX_DATA"
            };
        });
    }
    async ativarPlanoNoPerfil(usuarioId, planoNome) {
        const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
        // 1. Busca o perfil do prestador
        const perfil = await perfilRepo.findOne({ where: { usuarioId } });
        if (!perfil) {
            console.error(`Perfil não encontrado para o usuário ${usuarioId} ao ativar plano.`);
            return;
        }
        // 2. Atualiza os dados de visibilidade e o nível do plano
        perfil.plano = planoNome.toUpperCase();
        perfil.ativo = true; // Libera para a vitrine
        perfil.disponivel = true; // Garante que está visível
        // 3. Salva a alteração
        await perfilRepo.save(perfil);
        console.log(`✅ Perfil do usuário ${usuarioId} atualizado para o plano ${planoNome}`);
    }
    // ✅ Uso do Repositório para consistência
    async getUserBalance(userId) {
        const credits = await this.creditsRepo.findOne({ where: { usuarioId: userId } });
        return credits ? Number(credits.balance) : 0;
    }
    // --- MÉTODOS DE MANUTENÇÃO (CRON) ---
    async processDailyRenewals() {
        const today = new Date();
        const endOfToday = (0, date_fns_1.endOfDay)(today);
        const subscriptionsToRenew = await this.subscriptionRepo.find({
            where: {
                status: SubscriptionModel_1.SubscriptionStatus.ACTIVE,
                end_date: (0, typeorm_1.LessThanOrEqual)(endOfToday),
            },
        });
        for (const sub of subscriptionsToRenew) {
            try {
                await data_source_1.AppDataSource.transaction(async (manager) => {
                    // Evita duplicidade de cobrança no mesmo dia
                    const alreadyGenerated = await manager.findOne(ChargeModel_1.Charge, {
                        where: {
                            subscriptionId: sub.id,
                            createdAt: (0, typeorm_1.Between)((0, date_fns_1.startOfDay)(sub.end_date), (0, date_fns_1.endOfDay)(sub.end_date))
                        }
                    });
                    if (alreadyGenerated)
                        return;
                    const newCharge = manager.create(ChargeModel_1.Charge, {
                        subscriptionId: sub.id,
                        usuarioId: sub.usuarioId,
                        amount: sub.amount,
                        status: 'pending' // Ajustar se tiver Enum para ChargeStatus
                    });
                    await manager.save(newCharge);
                    // Atualiza ciclo de vida da assinatura
                    let nextDate = new Date(sub.end_date);
                    sub.end_date = sub.frequencia === 'mensal' ? (0, date_fns_1.addMonths)(nextDate, 1) : (0, date_fns_1.addYears)(nextDate, 1);
                    await manager.save(sub);
                });
            }
            catch (error) {
                console.error(`❌ Falha na renovação da sub ${sub.id}:`, error);
            }
        }
    }
    // --- RESGATE DE CRÉDITOS ---
    async requestRefund(userId, pixKey) {
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            const creditsRepo = manager.getRepository(usercreditsModels_1.UserCredits);
            const userCredits = await creditsRepo.findOne({ where: { usuarioId: userId } });
            // ✅ Verificação de nulo/saldo
            if (!userCredits || Number(userCredits.balance) <= 0) {
                throw new Error("Você não possui saldo disponível para resgate.");
            }
            const amountToRefund = Number(userCredits.balance);
            // 1. Criar Solicitação
            const refundRepo = manager.getRepository(RefundRequestModel_1.RefundRequest);
            const newRequest = refundRepo.create({
                usuarioId: userId,
                amount: amountToRefund,
                pix_key: pixKey,
                status: RefundRequestModel_1.RefundStatus.PENDING
            });
            await manager.save(newRequest);
            // 2. Zerar Saldo (Segurança)
            userCredits.balance = 0;
            await creditsRepo.save(userCredits);
            // 3. Log de Transação
            const transRepo = manager.getRepository(creditTransactionsModels_1.CreditTransactions);
            await manager.save(transRepo.create({
                usuarioId: userId,
                amount: amountToRefund,
                type: creditTransactionsModels_1.TransactionType.WITHDRAWAL,
                description: "Solicitação de resgate PIX"
            }));
            return { message: "Solicitação enviada!", amount: amountToRefund };
        });
    }
    // --- CRIAÇÃO DE NOVAS ASSINATURAS ---
    async createMultipleSubscriptions(userId, itens, frequencia) {
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            let totalToPay = 0;
            const savedSubscriptions = [];
            for (const item of itens) {
                const now = new Date();
                const newSub = manager.create(SubscriptionModel_1.Subscription, {
                    usuarioId: userId,
                    plano: item.plano,
                    frequencia: frequencia,
                    status: SubscriptionModel_1.SubscriptionStatus.PENDING,
                    amount: item.amount,
                    total_price_paid: 0, // Inicia em 0 até o pagamento da Charge
                    createdAt: now,
                    end_date: frequencia === 'mensal' ? (0, date_fns_1.addMonths)(now, 1) : (0, date_fns_1.addYears)(now, 1)
                });
                const saved = await manager.save(newSub);
                savedSubscriptions.push(saved);
                totalToPay += item.amount;
            }
            const charge = manager.create(ChargeModel_1.Charge, {
                subscriptionId: savedSubscriptions[0].id,
                usuarioId: userId,
                amount: parseFloat(totalToPay.toFixed(2)),
                status: 'pending'
            });
            await manager.save(charge);
            return {
                subscriptions: savedSubscriptions.map(s => s.id),
                chargeId: charge.id,
                valorFinal: charge.amount
            };
        });
    }
    // --- CANCELAMENTO COM PRO-RATA ---
    async changeOrCancelSubscription(subscriptionId, userId, action) {
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            const sub = await manager.findOne(SubscriptionModel_1.Subscription, {
                where: { id: subscriptionId, usuarioId: userId, status: SubscriptionModel_1.SubscriptionStatus.ACTIVE }
            });
            if (!sub)
                throw new Error("Assinatura ativa não encontrada.");
            const refundValue = this.calculateProRataValue(sub);
            if (refundValue > 0) {
                let userCredits = await manager.findOne(usercreditsModels_1.UserCredits, { where: { usuarioId: userId } });
                if (!userCredits) {
                    userCredits = manager.create(usercreditsModels_1.UserCredits, { usuarioId: userId, balance: 0 });
                }
                userCredits.balance = Number(userCredits.balance) + refundValue;
                await manager.save(userCredits);
                await manager.save(manager.create(creditTransactionsModels_1.CreditTransactions, {
                    usuarioId: userId,
                    amount: refundValue,
                    type: creditTransactionsModels_1.TransactionType.REFUND,
                    description: action === 'CHANGE' ? "Crédito: Troca de Plano" : "Crédito: Cancelamento"
                }));
            }
            sub.status = SubscriptionModel_1.SubscriptionStatus.CANCELED;
            await manager.save(sub);
            return { success: true, creditAdded: refundValue };
        });
    }
    async getSubscriptionRefundPreview(subscriptionId, userId) {
        // 1. Buscar a assinatura ativa
        const sub = await this.subscriptionRepo.findOne({
            where: {
                id: subscriptionId,
                usuarioId: userId, // ✅ Usando o padrão usuarioId
                status: SubscriptionModel_1.SubscriptionStatus.ACTIVE
            }
        });
        if (!sub) {
            throw new Error("Assinatura ativa não encontrada para este usuário.");
        }
        const agora = new Date();
        const dataFim = new Date(sub.end_date);
        const dataInicio = new Date(sub.createdAt);
        // 2. Verificar se a assinatura já expirou
        if (agora >= dataFim) {
            return {
                subscriptionId: sub.id,
                plano: sub.plano,
                diasRestantes: 0,
                valorEstornoEstimado: 0,
                mensagem: "Esta assinatura já expirou ou está no último dia."
            };
        }
        // 3. Cálculo de Pro-Rata
        // Calculamos o total de dias do ciclo (ex: 30 dias para mensal)
        const duracaoTotalMs = dataFim.getTime() - dataInicio.getTime();
        const totalDiasCiclo = Math.ceil(duracaoTotalMs / (1000 * 60 * 60 * 24));
        // Calculamos quantos dias ainda restam a partir de agora
        const tempoRestanteMs = dataFim.getTime() - agora.getTime();
        const diasRestantes = Math.floor(tempoRestanteMs / (1000 * 60 * 60 * 24));
        // Valor por dia (baseado no que foi pago ou no valor do plano)
        const valorBase = Number(sub.amount || sub.amount);
        const valorPorDia = valorBase / (totalDiasCiclo || 1);
        // Valor do estorno = dias não utilizados * valor diário
        const valorEstorno = Number((valorPorDia * diasRestantes).toFixed(2));
        // 4. Retorno para o Controller
        return {
            subscriptionId: sub.id,
            plano: sub.plano,
            status: sub.status,
            valorOriginal: valorBase,
            diasTotaisDoCiclo: totalDiasCiclo,
            diasRestantes: diasRestantes,
            valorEstornoEstimado: valorEstorno,
            dataExpiracao: sub.end_date
        };
    }
    calculateProRataValue(sub) {
        const now = new Date();
        const end = new Date(sub.end_date);
        const start = new Date(sub.createdAt);
        if (now >= end)
            return 0;
        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const remainingDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const dailyValue = Number(sub.amount || sub.amount) / totalDays;
        return Number((dailyValue * remainingDays).toFixed(2));
    }
}
exports.SubscriptionService = SubscriptionService;
