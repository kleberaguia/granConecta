import { AppDataSource } from "../../config/data-source";

import {
    CommercialFlow,
    CommercialFlowState,
} from "../../models/CommercialFlowModel";

import {
    Agenda,
} from "../../models/AgendaModels";

import {
    Pagamento,
} from "../../models/PagamentoModel";

import {
    PagamentoTransacao,
    TipoPagamentoTransacao,
    StatusPagamentoTransacao,
    GatilhoPagamentoTransacao,
} from "../../models/PagamentoTransacaoModel";

import {
    ServicoOferta,
} from "../../models/servicoOfertaModels";

import {
    BusinessCatalogItem,
    BusinessCatalogSchedulingPolicy,
} from "../../models/BusinessCatalogItemModel";

import AgendaService from "../AgendaService";

import CommercialFlowStateService from "./CommercialFlowStateService";

export type CommercialSchedulingInput = {
    flowId: string;

    /**
     * Descrição opcional.
     *
     * Exemplo:
     * Avaliação psicopedagógica inicial
     */
    descricao?: string | null;
};

export type CommercialSchedulingResult =
    | {
        status: "SCHEDULED";

        flow: CommercialFlow;

        agendaId: string;

        data: string;

        hora: string;

        ofertaId: string;

        reusedAgenda: false;
    }
    | {
        status: "ALREADY_SCHEDULED";

        flow: CommercialFlow;

        agendaId: string;

        data: string;

        hora: string;

        ofertaId: string;

        reusedAgenda: true;
    }
    | {
        status: "RESCHEDULE_REQUIRED";

        flow: CommercialFlow;

        ofertaId: string;

        paymentId: string;

        previousDate: string;

        previousTime: string;
    };

/**
 * ================================================================
 * COMMERCIAL SCHEDULING SERVICE
 * ================================================================
 *
 * Responsabilidade:
 *
 * PAGAMENTO_APROVADO
 *        ↓
 * validar CommercialFlow
 *        ↓
 * validar pagamento real
 *        ↓
 * verificar agenda existente
 *        ↓
 * AgendaService.agendarSessao()
 *        ↓
 * commercial_flows.agenda_id
 *        ↓
 * AGENDADO
 *
 * Este serviço NÃO:
 *
 * - interpreta mensagens;
 * - consulta intenção com IA;
 * - cria pagamento;
 * - cria oferta;
 * - escolhe horário;
 * - altera disponibilidade inventada.
 *
 * Ele somente agenda quando todas as condições
 * comerciais já foram satisfeitas.
 */
export class CommercialSchedulingService {
    constructor(
        private readonly flowState =
            new CommercialFlowStateService(),
    ) { }

    private get agendaRepository() {
        return AppDataSource.getRepository(
            Agenda,
        );
    }

    private get pagamentoRepository() {
        return AppDataSource.getRepository(
            Pagamento,
        );
    }

    private get pagamentoTransacaoRepository() {
        return AppDataSource.getRepository(
            PagamentoTransacao,
        );
    }

    private get ofertaRepository() {
        return AppDataSource.getRepository(
            ServicoOferta,
        );
    }

    private get catalogRepository() {
        return AppDataSource.getRepository(
            BusinessCatalogItem,
        );
    }

    /**
     * ================================================================
     * AGENDAR APÓS PAGAMENTO
     * ================================================================
     */
    async scheduleAfterPayment(
        input: CommercialSchedulingInput,
    ): Promise<CommercialSchedulingResult> {
        const flowId =
            String(
                input.flowId || "",
            ).trim();

        if (!flowId) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_FLOW_ID_OBRIGATORIO",
            );
        }

        let flow =
            await this.flowState.findById(
                flowId,
            );

        if (!flow) {
            throw new Error(
                "COMMERCIAL_FLOW_NAO_ENCONTRADO",
            );
        }

        try {
            /**
             * ============================================================
             * 1. VALIDA O COMMERCIAL FLOW
             * ============================================================
             */
            this.validateFlow(
                flow,
            );

            /**
             * Depois da validação, fixamos os dados obrigatórios
             * em variáveis tipadas como string.
             *
             * Isso evita que o TypeScript volte a tratá-los
             * como string | null após atualizações do flow.
             */
            const ofertaId =
                flow.ofertaId;

            const preferredDate =
                flow.preferredDate;

            const preferredTime =
                flow.preferredTime;

            if (
                !ofertaId ||
                !preferredDate ||
                !preferredTime
            ) {
                throw new Error(
                    "COMMERCIAL_SCHEDULING_DADOS_OBRIGATORIOS_AUSENTES",
                );
            }

            /**
             * ============================================================
             * 2. OFERTA REAL
             * ============================================================
             */
            const oferta =
                await this.loadOffer(
                    ofertaId,
                );
            /**
             * ============================================================
             * 3. PAGAMENTO REAL
             * ============================================================
             *
             * Nunca confiamos apenas em:
             *
             * flow.state = PAGAMENTO_APROVADO
             *
             * Conferimos a tabela de pagamentos também.
             */
            const pagamento =
                await this.findPayment(
                    flow,
                );

            if (!pagamento) {
                throw new Error(
                    "COMMERCIAL_SCHEDULING_PAGAMENTO_NAO_ENCONTRADO",
                );
            }

            if (
                !await this.isPaymentApproved(
                    pagamento,
                )
            ) {
                throw new Error(
                    "COMMERCIAL_SCHEDULING_PAGAMENTO_NAO_APROVADO",
                );
            }

            /**
             * ============================================================
             * 4. RECUPERAÇÃO DE PAGAMENTO APROVADO COM HORÁRIO VENCIDO
             * ============================================================
             *
             * O pagamento continua válido. Se o pós-pagamento falhou e
             * a data/hora escolhida já passou, não criamos agenda
             * retroativa e não cobramos novamente.
             */
            if (
                this.isPastSlot(
                    preferredDate,
                    preferredTime,
                )
            ) {
                flow =
                    await this.flowState.update(
                        flow.id,
                        {
                            preferredDate: null,
                            preferredTime: null,

                            metadata: {
                                rescheduleRequired: true,
                                rescheduleReason: "PAID_SLOT_EXPIRED",
                                expiredScheduledDate: preferredDate,
                                expiredScheduledTime: preferredTime,
                                rescheduleRequestedAt:
                                    new Date().toISOString(),
                                approvedPaymentId: pagamento.id,
                                approvedOfferId: oferta.id,
                            },
                        } as any,
                    );

                flow =
                    await this.flowState.setState(
                        flow.id,
                        CommercialFlowState.AGUARDANDO_DATA,
                        {
                            rescheduleRequired: true,
                            rescheduleReason: "PAID_SLOT_EXPIRED",
                            approvedPaymentId: pagamento.id,
                            approvedOfferId: oferta.id,
                        },
                    );

                console.warn(
                    "[COMMERCIAL SCHEDULING] Pagamento aprovado, mas horário venceu; solicitando reagendamento sem nova cobrança",
                    {
                        flowId: flow.id,
                        ofertaId: oferta.id,
                        paymentId: pagamento.id,
                        previousDate: preferredDate,
                        previousTime: preferredTime,
                    },
                );

                return {
                    status: "RESCHEDULE_REQUIRED",
                    flow,
                    ofertaId: oferta.id,
                    paymentId: pagamento.id,
                    previousDate: preferredDate,
                    previousTime: preferredTime,
                };
            }

            /**
             * ============================================================
             * 5. IDEMPOTÊNCIA PELO COMMERCIAL FLOW
             * ============================================================
             *
             * Webhooks podem chegar mais de uma vez.
             *
             * Se agendaId já estiver preenchido,
             * não criamos uma nova sessão.
             */
            if (flow.agendaId) {
                const existingAgenda =
                    await this.agendaRepository
                        .findOne({
                            where: {
                                id:
                                    flow.agendaId,
                            } as any,
                        });

                if (existingAgenda) {
                    console.log(
                        "[COMMERCIAL SCHEDULING] Agenda já vinculada ao fluxo",
                        {
                            flowId:
                                flow.id,

                            agendaId:
                                existingAgenda.id,

                            ofertaId:
                                flow.ofertaId,

                            data:
                                existingAgenda.data,

                            hora:
                                existingAgenda.hora,
                        },
                    );

                    return {
                        status:
                            "ALREADY_SCHEDULED",

                        flow,

                        agendaId:
                            existingAgenda.id,

                        data:
                            String(
                                existingAgenda.data,
                            ),

                        hora:
                            String(
                                existingAgenda.hora,
                            ),

                        ofertaId,

                        reusedAgenda:
                            true,
                    };
                }

                /**
                 * Existe agendaId no flow, mas a agenda não existe mais.
                 *
                 * Limpamos a referência inválida antes de continuar.
                 */
                flow =
                    await this.flowState.update(
                        flow.id,
                        {
                            agendaId:
                                null,

                            metadata: {
                                invalidAgendaReferenceDetectedAt:
                                    new Date()
                                        .toISOString(),
                            },
                        },
                    );
            }

            /**
             * ============================================================
             * 5. IDEMPOTÊNCIA PELA OFERTA + DATA + HORA
             * ============================================================
             *
             * Proteção extra para o caso:
             *
             * Agenda foi criada
             * ↓
             * processo caiu
             * ↓
             * CommercialFlow não recebeu agendaId
             * ↓
             * webhook executou novamente
             *
             * Sem isso poderíamos criar duas sessões.
             */
            const existingBySlot =
                await this.findExistingAgenda(
                    ofertaId,
                    preferredDate,
                    preferredTime,
                );

            if (existingBySlot) {
                flow =
                    await this.flowState.markScheduled(
                        flow.id,
                        existingBySlot.id,
                    );

                flow =
                    await this.flowState.update(
                        flow.id,
                        {
                            metadata: {
                                schedulingRecovered:
                                    true,

                                schedulingRecoveredAt:
                                    new Date()
                                        .toISOString(),
                            },
                        },
                    );

                console.log(
                    "[COMMERCIAL SCHEDULING] Agenda existente recuperada",
                    {
                        flowId:
                            flow.id,

                        agendaId:
                            existingBySlot.id,

                        ofertaId:
                            ofertaId,

                        data:
                            existingBySlot.data,

                        hora:
                            existingBySlot.hora,
                    },
                );

                return {
                    status:
                        "ALREADY_SCHEDULED",

                    flow,

                    agendaId:
                        existingBySlot.id,

                    data:
                        String(
                            existingBySlot.data,
                        ),

                    hora:
                        String(
                            existingBySlot.hora,
                        ),

                    ofertaId:
                        flow.ofertaId!,

                    reusedAgenda:
                        true,
                };
            }

            /**
             * ============================================================
             * 6. POLÍTICA DE AGENDAMENTO DO ITEM DO CATÁLOGO
             * ============================================================
             *
             * A regra pertence ao item comercial, e não à profissão.
             *
             * Exemplo:
             * - psicopedagogia: ONE_PER_WEEK / maxSessionsPerWeek = 1
             * - pedreiro/pintor: DAILY_ALLOWED
             *
             * A contagem é feita pelo cliente + categoria do catálogo,
             * portanto uma sessão avulsa de psicopedagogia também respeita
             * a semana mesmo que o cliente tenha outro pacote ativo.
             */
            const catalogItem =
                await this.loadCatalogItem(
                    flow.catalogItemId,
                );

            if (catalogItem) {
                await this.validateCatalogSchedulingPolicy({
                    flow,
                    catalogItem,
                    preferredDate,
                });
            }

            /**
             * ============================================================
             * 7. GARANTE QUE A OFERTA PODE SER AGENDADA
             * ============================================================
             *
             * Seu AgendaService já possui sua própria proteção,
             * mas fazemos uma validação antecipada para gerar logs
             * mais claros.
             */
            const ofertaStatus =
                String(
                    oferta.status || "",
                )
                    .trim()
                    .toUpperCase();

            const agendaLiberada =
                Boolean(
                    oferta.agenda_liberada,
                );

            const statusPermiteAgenda =
                [
                    "ACEITA",
                    "PAGO",
                    "EM_ANDAMENTO",
                ].includes(
                    ofertaStatus,
                );

            if (
                !agendaLiberada &&
                !statusPermiteAgenda
            ) {
                throw new Error(
                    `COMMERCIAL_SCHEDULING_OFERTA_NAO_LIBERADA_${ofertaStatus || "VAZIO"}`,
                );
            }

            /**
             * ============================================================
             * 7. ESTADO INTERMEDIÁRIO
             * ============================================================
             */
            flow =
                await this.flowState.setState(
                    flow.id,
                    CommercialFlowState
                        .AGUARDANDO_AGENDAMENTO,
                    {
                        schedulingStartedAt:
                            new Date()
                                .toISOString(),

                        schedulingPaymentId:
                            pagamento.id,

                        schedulingOfertaId:
                            oferta.id,
                    },
                );

            /**
             * ============================================================
             * 8. DESCRIÇÃO
             * ============================================================
             */
            const descricao =
                this.resolveDescription(
                    input.descricao,
                    flow,
                    oferta,
                );

            console.log(
                "[COMMERCIAL SCHEDULING] Criando agenda real",
                {
                    flowId:
                        flow.id,

                    ofertaId:
                        oferta.id,

                    paymentId:
                        pagamento.id,

                    data:
                        preferredDate,

                    hora:
                        preferredTime,

                    descricao,
                },
            );

            /**
             * ============================================================
             * 9. AGENDA REAL
             * ============================================================
             *
             * Não criamos Agenda diretamente.
             *
             * Reutilizamos o service oficial do projeto.
             */
            const agenda =
                await AgendaService
                    .agendarSessao(
                        oferta.id,

                        descricao,

                        flow.preferredDate!,

                        flow.preferredTime!,

                        undefined, // chamada interna: não há usuarioLogadoId

                        catalogItem?.duracaoMinutos
                            ? Math.max(
                                1,
                                Number(catalogItem.duracaoMinutos),
                            )
                            : undefined,
                    );

            if (!agenda?.id) {
                throw new Error(
                    "COMMERCIAL_SCHEDULING_AGENDA_NAO_CRIADA",
                );
            }

            /**
             * ============================================================
             * 10. COMMERCIAL FLOW -> AGENDADO
             * ============================================================
             */
            flow =
                await this.flowState.markScheduled(
                    flow.id,
                    agenda.id,
                );

            flow =
                await this.flowState.update(
                    flow.id,
                    {
                        metadata: {
                            schedulingCompletedAt:
                                new Date()
                                    .toISOString(),

                            scheduledDate:
                                preferredDate,

                            scheduledTime:
                                preferredTime,

                            scheduledOfertaId:
                                oferta.id,

                            scheduledPaymentId:
                                pagamento.id,

                            scheduledAgendaId:
                                agenda.id,
                        },
                    },
                );

            console.log(
                "[COMMERCIAL SCHEDULING] Agendamento confirmado",
                {
                    flowId:
                        flow.id,

                    agendaId:
                        agenda.id,

                    ofertaId:
                        oferta.id,

                    paymentId:
                        pagamento.id,

                    data:
                        agenda.data,

                    hora:
                        agenda.hora,
                },
            );

            return {
                status:
                    "SCHEDULED",

                flow,

                agendaId:
                    agenda.id,

                data:
                    String(
                        agenda.data,
                    ),

                hora:
                    String(
                        agenda.hora,
                    ),

                ofertaId:
                    oferta.id,

                reusedAgenda:
                    false,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);

            /**
             * ============================================================
             * CONFLITO DE AGENDA APÓS PAGAMENTO
             * ============================================================
             *
             * O pagamento já foi aprovado, porém entre a escolha
             * do horário e a criação definitiva da agenda o horário
             * pode ter sido ocupado:
             *
             * - pelo próprio prestador;
             * - pelo próprio cliente com outro profissional.
             *
             * Isso NÃO é erro comercial e NÃO invalida o pagamento.
             *
             * O cliente apenas precisa escolher outro horário,
             * sem realizar um novo pagamento.
             */
            const isSchedulingConflict =
                errorMessage ===
                "HORARIO_INDISPONIVEL_PRESTADOR" ||
                errorMessage ===
                "HORARIO_INDISPONIVEL_CLIENTE";

            if (isSchedulingConflict) {
                const previousDate =
                    String(
                        flow.preferredDate || "",
                    ).trim();

                const previousTime =
                    String(
                        flow.preferredTime || "",
                    ).trim();

                const ofertaId =
                    String(
                        flow.ofertaId || "",
                    ).trim();

                const paymentId =
                    String(
                        flow.paymentId || "",
                    ).trim();

                /**
                 * Remove somente a preferência de agenda.
                 *
                 * Mantemos:
                 *
                 * - pagamento;
                 * - oferta;
                 * - cliente;
                 * - item comercial;
                 * - demais dados do fluxo.
                 */
                flow =
                    await this.flowState.update(
                        flow.id,
                        {
                            preferredDate:
                                null,

                            preferredTime:
                                null,

                            metadata: {
                                rescheduleRequired:
                                    true,

                                rescheduleReason:
                                    errorMessage,

                                previousScheduledDate:
                                    previousDate,

                                previousScheduledTime:
                                    previousTime,

                                rescheduleRequestedAt:
                                    new Date()
                                        .toISOString(),

                                approvedPaymentId:
                                    paymentId || null,

                                approvedOfferId:
                                    ofertaId || null,
                            },
                        } as any,
                    );

                /**
                 * Retorna o fluxo para escolha de uma nova data.
                 *
                 * IMPORTANTE:
                 * não alteramos o pagamento aprovado.
                 */
                flow =
                    await this.flowState.setState(
                        flow.id,
                        CommercialFlowState.AGUARDANDO_DATA,
                        {
                            rescheduleRequired:
                                true,

                            rescheduleReason:
                                errorMessage,

                            approvedPaymentId:
                                paymentId || null,

                            approvedOfferId:
                                ofertaId || null,
                        },
                    );

                console.warn(
                    "[COMMERCIAL SCHEDULING] Pagamento aprovado, mas horário ficou indisponível; solicitando reagendamento sem nova cobrança",
                    {
                        flowId:
                            flow.id,

                        ofertaId:
                            ofertaId || null,

                        paymentId:
                            paymentId || null,

                        previousDate,

                        previousTime,

                        reason:
                            errorMessage,

                        state:
                            flow.state,
                    },
                );

                return {
                    status:
                        "RESCHEDULE_REQUIRED",

                    flow,

                    ofertaId,

                    paymentId,

                    previousDate,

                    previousTime,
                };
            }

            /**
             * ============================================================
             * ERRO REAL
             * ============================================================
             *
             * Qualquer outro erro continua seguindo exatamente
             * o comportamento anterior.
             */
            await this.flowState.markError(
                flow.id,
                error,
            );

            console.error(
                "[COMMERCIAL SCHEDULING] Erro ao agendar",
                {
                    flowId:
                        flow.id,

                    ofertaId:
                        flow.ofertaId,

                    paymentId:
                        flow.paymentId,

                    date:
                        flow.preferredDate,

                    time:
                        flow.preferredTime,

                    error:
                        errorMessage,
                },
            );

            throw error;
        }
    }

    /**
     * ================================================================
     * VALIDAR FLOW
     * ================================================================
     */
    private validateFlow(
        flow: CommercialFlow,
    ): void {
        if (!flow.ativo) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_FLOW_INATIVO",
            );
        }

        if (!flow.customerUserId) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_CLIENTE_NAO_IDENTIFICADO",
            );
        }

        if (!flow.ofertaId) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_OFERTA_NAO_DEFINIDA",
            );
        }

        if (!flow.paymentId) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_PAYMENT_ID_NAO_DEFINIDO",
            );
        }

        if (!flow.preferredDate) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_DATA_NAO_DEFINIDA",
            );
        }

        if (!flow.preferredTime) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_HORARIO_NAO_DEFINIDO",
            );
        }

        /**
         * O estado normal antes da agenda deve ser
         * PAGAMENTO_APROVADO.
         *
         * Também permitimos AGUARDANDO_AGENDAMENTO
         * para recuperação idempotente depois de falha.
         */
        const allowedStates = [
            CommercialFlowState
                .PAGAMENTO_APROVADO,

            CommercialFlowState
                .AGUARDANDO_AGENDAMENTO,

            CommercialFlowState
                .AGENDADO,

            CommercialFlowState
                .ERRO,
        ];

        if (
            !allowedStates.includes(
                flow.state,
            )
        ) {
            throw new Error(
                `COMMERCIAL_SCHEDULING_ESTADO_INVALIDO_${flow.state}`,
            );
        }
    }

    /**
     * ================================================================
     * CARREGAR OFERTA
     * ================================================================
     */
    private async loadOffer(
        ofertaId: string,
    ): Promise<ServicoOferta> {
        const oferta =
            await this.ofertaRepository
                .findOne({
                    where: {
                        id:
                            ofertaId,
                    },

                    relations: [
                        "solicitacao",
                    ],
                });

        if (!oferta) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_OFERTA_NAO_ENCONTRADA",
            );
        }

        return oferta;
    }

    /**
     * ================================================================
     * LOCALIZAR PAGAMENTO
     * ================================================================
     */
    private async findPayment(
        flow: CommercialFlow,
    ): Promise<Pagamento | null> {
        /**
         * Primeiro pelo ID gravado no CommercialFlow.
         */
        if (flow.paymentId) {
            const byId =
                await this.pagamentoRepository
                    .findOne({
                        where: {
                            id:
                                flow.paymentId,
                        } as any,
                    });

            if (byId) {
                /**
                 * Proteção para pagamento pertencente a outra oferta.
                 */
                if (
                    byId.ofertaId &&
                    flow.ofertaId &&
                    String(
                        byId.ofertaId,
                    ) !==
                    String(
                        flow.ofertaId,
                    )
                ) {
                    throw new Error(
                        "COMMERCIAL_SCHEDULING_PAYMENT_OFERTA_DIVERGENTE",
                    );
                }

                return byId;
            }
        }

        /**
         * Fallback pela oferta.
         */
        if (flow.ofertaId) {
            return this.pagamentoRepository
                .findOne({
                    where: {
                        ofertaId:
                            flow.ofertaId,
                    } as any,

                    order: {
                        createdAt:
                            "DESC",
                    } as any,
                });
        }

        return null;
    }

    /**
     * ================================================================
     * AGENDA EXISTENTE
     * ================================================================
     */
    private async findExistingAgenda(
        ofertaId: string,
        data: string,
        hora: string,
    ): Promise<Agenda | null> {
        return this.agendaRepository
            .findOne({
                where: {
                    ofertaId,

                    data,

                    hora,
                } as any,

                order: {
                    createdAt:
                        "ASC",
                } as any,
            });
    }

    /**
     * ================================================================
     * ITEM DO CATÁLOGO
     * ================================================================
     */
    private async loadCatalogItem(
        catalogItemId:
            | string
            | null
            | undefined,
    ): Promise<BusinessCatalogItem | null> {
        const normalizedId =
            String(
                catalogItemId || "",
            ).trim();

        if (!normalizedId) {
            return null;
        }

        return this.catalogRepository
            .findOne({
                where: {
                    id: normalizedId,
                } as any,
            });
    }

    /**
     * ================================================================
     * POLÍTICA DE AGENDAMENTO
     * ================================================================
     *
     * ONE_PER_WEEK é validada por:
     * cliente + categoria comercial + semana da data escolhida.
     *
     * Não usamos apenas ofertaId porque pacote e sessão avulsa podem
     * gerar ofertas diferentes e ainda assim pertencer ao mesmo tipo
     * de atendimento.
     */
    private async validateCatalogSchedulingPolicy(
        input: {
            flow: CommercialFlow;
            catalogItem: BusinessCatalogItem;
            preferredDate: string;
        },
    ): Promise<void> {
        const {
            flow,
            catalogItem,
            preferredDate,
        } = input;

        if (
            catalogItem.schedulingPolicy ===
            BusinessCatalogSchedulingPolicy.NO_SCHEDULING
        ) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_ITEM_NAO_AGENDAVEL",
            );
        }

        if (
            catalogItem.schedulingPolicy !==
            BusinessCatalogSchedulingPolicy.ONE_PER_WEEK
        ) {
            return;
        }

        const maxSessionsPerWeek =
            Math.max(
                1,
                Number(
                    catalogItem.maxSessionsPerWeek ||
                    1,
                ),
            );

        const customerUserId =
            String(
                flow.customerUserId || "",
            ).trim();

        if (!customerUserId) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_CLIENTE_NAO_IDENTIFICADO",
            );
        }

        const {
            startDate,
            endDate,
        } =
            this.resolveWeekRange(
                preferredDate,
            );

        const qb =
            this.agendaRepository
                .createQueryBuilder(
                    "agenda",
                )
                .innerJoin(
                    ServicoOferta,
                    "oferta_policy",
                    "oferta_policy.id = agenda.ofertaId",
                )
                .innerJoin(
                    "servico_solicitacao",
                    "solicitacao_policy",
                    "solicitacao_policy.id = oferta_policy.solicitacaoId",
                )
                .innerJoin(
                    CommercialFlow,
                    "flow_policy",
                    "flow_policy.ofertaId = oferta_policy.id",
                )
                .innerJoin(
                    BusinessCatalogItem,
                    "catalog_policy",
                    "catalog_policy.id = flow_policy.catalogItemId",
                )
                .where(
                    "flow_policy.customerUserId = :customerUserId",
                    {
                        customerUserId,
                    },
                )
                .andWhere(
                    "agenda.data >= :startDate",
                    {
                        startDate,
                    },
                )
                .andWhere(
                    "agenda.data <= :endDate",
                    {
                        endDate,
                    },
                );

        if (
            catalogItem.categoriaId !== null &&
            catalogItem.categoriaId !== undefined
        ) {
            qb.andWhere(
                "catalog_policy.categoriaId = :categoriaId",
                {
                    categoriaId:
                        catalogItem.categoriaId,
                },
            );
        } else {
            qb.andWhere(
                "catalog_policy.id = :catalogItemId",
                {
                    catalogItemId:
                        catalogItem.id,
                },
            );
        }

        const sessionsInWeek =
            await qb.getCount();

        if (
            sessionsInWeek >=
            maxSessionsPerWeek
        ) {
            console.warn(
                "[COMMERCIAL SCHEDULING] Limite semanal do catálogo atingido",
                {
                    flowId:
                        flow.id,
                    customerUserId,
                    catalogItemId:
                        catalogItem.id,
                    categoriaId:
                        catalogItem.categoriaId,
                    schedulingPolicy:
                        catalogItem.schedulingPolicy,
                    maxSessionsPerWeek,
                    preferredDate,
                    weekStart:
                        startDate,
                    weekEnd:
                        endDate,
                    sessionsInWeek,
                },
            );

            throw new Error(
                `COMMERCIAL_SCHEDULING_WEEKLY_LIMIT_${maxSessionsPerWeek}`,
            );
        }
    }

    /**
     * Semana comercial: segunda-feira até domingo.
     */
    private resolveWeekRange(
        dateValue: string,
    ): {
        startDate: string;
        endDate: string;
    } {
        const match =
            /^(\d{4})-(\d{2})-(\d{2})$/
                .exec(
                    String(
                        dateValue || "",
                    ).trim(),
                );

        if (!match) {
            throw new Error(
                "COMMERCIAL_SCHEDULING_DATA_INVALIDA",
            );
        }

        const year =
            Number(match[1]);

        const month =
            Number(match[2]);

        const day =
            Number(match[3]);

        const date =
            new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day,
                ),
            );

        const weekDay =
            date.getUTCDay();

        const daysSinceMonday =
            weekDay === 0
                ? 6
                : weekDay - 1;

        const start =
            new Date(
                date.getTime(),
            );

        start.setUTCDate(
            start.getUTCDate() -
            daysSinceMonday,
        );

        const end =
            new Date(
                start.getTime(),
            );

        end.setUTCDate(
            end.getUTCDate() + 6,
        );

        return {
            startDate:
                this.formatUtcDate(start),
            endDate:
                this.formatUtcDate(end),
        };
    }

    private formatUtcDate(
        value: Date,
    ): string {
        const year =
            value.getUTCFullYear();

        const month =
            String(
                value.getUTCMonth() + 1,
            ).padStart(
                2,
                "0",
            );

        const day =
            String(
                value.getUTCDate(),
            ).padStart(
                2,
                "0",
            );

        return `${year}-${month}-${day}`;
    }

    /**
     * ================================================================
     * PAGAMENTO APROVADO
     * ================================================================
     *
     * O sistema possui variações históricas de status.
     */
    private async isPaymentApproved(
        pagamento: Pagamento,
    ): Promise<boolean> {
        const status =
            String(
                pagamento.status || "",
            )
                .trim()
                .toUpperCase();

        /**
         * Pagamento integral quitado.
         *
         * Preserva exatamente o comportamento histórico.
         */
        if (
            [
                "PAGO",
                "APROVADO",
                "APPROVED",
                "PAID",
            ].includes(
                status,
            )
        ) {
            return true;
        }

        /**
         * Serviço com ENTRADA + SALDO.
         *
         * PARCIALMENTE_PAGO sozinho NÃO libera agenda.
         * A contratação somente é considerada financeiramente
         * confirmada quando existe, para este mesmo pagamento:
         *
         * - transação do tipo ENTRADA;
         * - gatilho CONTRATACAO;
         * - status PAGO ou PAGO_EXTERNAMENTE.
         *
         * O SALDO continua pendente e será tratado no fluxo
         * de conclusão já existente.
         */
        if (
            status !==
            "PARCIALMENTE_PAGO"
        ) {
            return false;
        }

        const entradaPaga =
            await this.pagamentoTransacaoRepository
                .findOne({
                    where: {
                        pagamentoId:
                            pagamento.id,

                        tipo:
                            TipoPagamentoTransacao
                                .ENTRADA,

                        gatilhoTipo:
                            GatilhoPagamentoTransacao
                                .CONTRATACAO,
                    } as any,

                    order: {
                        createdAt:
                            "ASC",
                    } as any,
                });

        if (!entradaPaga) {
            return false;
        }

        const entradaConfirmada =
            [
                StatusPagamentoTransacao
                    .PAGO,

                StatusPagamentoTransacao
                    .PAGO_EXTERNAMENTE,
            ].includes(
                entradaPaga.status,
            );

        if (entradaConfirmada) {
            console.log(
                "[COMMERCIAL SCHEDULING] Contratação liberada por entrada paga",
                {
                    paymentId:
                        pagamento.id,

                    transactionId:
                        entradaPaga.id,

                    transactionType:
                        entradaPaga.tipo,

                    trigger:
                        entradaPaga.gatilhoTipo,

                    transactionStatus:
                        entradaPaga.status,

                    paymentStatus:
                        pagamento.status,
                },
            );
        }

        return entradaConfirmada;
    }

    /**
     * ================================================================
     * HORÁRIO JÁ VENCIDO
     * ================================================================
     */
    private isPastSlot(
        data: string,
        hora: string,
    ): boolean {
        const normalizedDate = String(data || "").trim();
        const normalizedTime = String(hora || "").trim();

        if (
            !/^\\d{4}-\\d{2}-\\d{2}$/.test(normalizedDate) ||
            !/^\\d{2}:\\d{2}(?::\\d{2})?$/.test(normalizedTime)
        ) {
            return false;
        }

        const slot = new Date(
            `${normalizedDate}T${normalizedTime.length === 5
                ? `${normalizedTime}:00`
                : normalizedTime
            }`,
        );

        if (Number.isNaN(slot.getTime())) {
            return false;
        }

        return slot.getTime() < Date.now();
    }

    /**
     * ================================================================
     * DESCRIÇÃO
     * ================================================================
     */
    private resolveDescription(
        customDescription:
            | string
            | null
            | undefined,

        flow: CommercialFlow,

        oferta: ServicoOferta,
    ): string {
        const custom =
            String(
                customDescription ||
                "",
            ).trim();

        if (custom) {
            return custom;
        }

        /**
         * Nome do item que guardamos no metadata
         * durante a seleção do BusinessCatalog.
         */
        const metadata =
            flow.metadata &&
                typeof flow.metadata ===
                "object"
                ? flow.metadata
                : {};

        const catalogItemName =
            String(
                (
                    metadata as Record<
                        string,
                        unknown
                    >
                ).catalogItemName ||
                "",
            ).trim();

        if (catalogItemName) {
            return catalogItemName;
        }

        const solicitacao =
            (oferta as any)
                .solicitacao;

        const title =
            String(
                solicitacao?.titulo ||
                "",
            ).trim();

        if (title) {
            return title;
        }

        return "Atendimento GranConecta";
    }
}

export default CommercialSchedulingService;