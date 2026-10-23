import { EntityManager, In } from "typeorm";

import { AppDataSource } from "../config/data-source";

import {
    ClassificadoCredito,
    ClassificadoCreditoPlano,
    ClassificadoCreditoStatus,
} from "../models/ClassificadoCreditoModel";

import {
    ClassificadoCreditoMovimento,
    ClassificadoCreditoMovimentoTipo,
} from "../models/ClassificadoCreditoMovimentoModel";

import {
    Classificado,
    ClassificadoStatus,
} from "../models/ClassificadoModel";

/**
 * ============================================================
 * TIPOS
 * ============================================================
 */

export type CriarCreditoInput = {
    usuarioId: string;
    plano: ClassificadoCreditoPlano;
    diasComprados: number;
    valorPago: string | number;

    paymentId?: string | null;
    checkoutSessionId?: string | null;

    /**
     * Quando true, representa um crédito cujo pagamento
     * já foi confirmado.
     *
     * Durante os testes poderemos utilizar true.
     *
     * Quando integrarmos Mercado Pago, será o webhook quem
     * confirmará definitivamente o pagamento.
     */
    pagamentoAprovado?: boolean;

    /**
     * Quantidade de dias durante os quais o saldo poderá
     * ser utilizado.
     *
     * Exemplo:
     * crédito comprado hoje com validadeUsoDias = 90.
     */
    validadeUsoDias?: number;
};

export type SaldoCreditoUsuario = {
    totalCreditos: number;
    diasDisponiveis: number;
    creditos: ClassificadoCredito[];
};

export type ResultadoVinculoCredito = {
    classificado: Classificado;
    credito: ClassificadoCredito;
};

export type ResultadoEncerramentoCredito = {
    credito: ClassificadoCredito;
    diasUtilizados: number;
    saldoAnterior: number;
    saldoPosterior: number;
};

export type MotivoEncerramentoCredito =
    | "VENDIDO"
    | "CANCELADO"
    | "EXPIRADO";

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */
export class ClassificadoCreditoService {
    /**
     * ==========================================================
     * HELPERS
     * ==========================================================
     */

    private normalizarDias(valor: number): number {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            throw new Error("DIAS_INVALIDOS");
        }

        const dias = Math.floor(numero);

        if (dias <= 0) {
            throw new Error("DIAS_INVALIDOS");
        }

        return dias;
    }

    private normalizarValorMonetario(
        valor: string | number
    ): string {
        const numero = Number(valor);

        if (!Number.isFinite(numero) || numero < 0) {
            throw new Error("VALOR_INVALIDO");
        }

        return numero.toFixed(2);
    }

    /**
     * Retorna uma nova data somando determinada quantidade
     * de dias.
     */
    private adicionarDias(
        data: Date,
        quantidadeDias: number
    ): Date {
        const resultado = new Date(data);

        resultado.setDate(
            resultado.getDate() + quantidadeDias
        );

        return resultado;
    }

    /**
     * ==========================================================
     * CÁLCULO DOS DIAS UTILIZADOS
     * ==========================================================
     *
     * O tempo começa em publicadoEm.
     *
     * Não usamos:
     * - createdAt
     * - pagoEm
     * - updatedAt
     *
     * porque o usuário só começa efetivamente a utilizar
     * o benefício quando o anúncio é publicado.
     *
     * Qualquer fração de dia conta como 1 dia.
     *
     * Exemplos:
     *
     * 2 horas    -> 1 dia
     * 24 horas   -> 1 dia
     * 25 horas   -> 2 dias
     * 2d 20h     -> 3 dias
     */
   private calcularDiasUtilizados(
    publicadoEm: Date,
    encerradoEm: Date
): number {
    const inicio =
        new Date(publicadoEm);

    const fim =
        new Date(encerradoEm);

    if (
        Number.isNaN(inicio.getTime()) ||
        Number.isNaN(fim.getTime())
    ) {
        throw new Error(
            "DATA_CREDITO_INVALIDA"
        );
    }

    if (
        fim.getTime() <
        inicio.getTime()
    ) {
        throw new Error(
            "DATA_ENCERRAMENTO_ANTERIOR_PUBLICACAO"
        );
    }

    const MS_POR_DIA =
        24 * 60 * 60 * 1000;

    /**
     * Tolerância operacional.
     *
     * Entre carregar o classificado, abrir a transação,
     * bloquear os registros e efetivamente encerrar o crédito
     * podem transcorrer alguns milissegundos.
     *
     * Sem essa tolerância:
     *
     * 72h + 10ms
     *
     * poderia ser interpretado como 4 dias.
     *
     * A tolerância NÃO transforma períodos reais longos:
     *
     * 25h continua sendo 2 dias.
     * 48h + vários minutos continua sendo 3 dias.
     */
    const TOLERANCIA_MS = 1000;

    const diferencaMs =
        fim.getTime() -
        inicio.getTime();

    const diferencaAjustada =
        Math.max(
            0,
            diferencaMs -
                TOLERANCIA_MS
        );

    const diasUtilizados =
        Math.ceil(
            diferencaAjustada /
                MS_POR_DIA
        );

    /**
     * Publicou e encerrou imediatamente:
     * ainda assim houve utilização de 1 dia.
     */
    return Math.max(
        1,
        diasUtilizados
    );
}

    /**
     * ==========================================================
     * REGISTRAR MOVIMENTO
     * ==========================================================
     *
     * Deve ser utilizado dentro da mesma transação responsável
     * pela alteração do crédito.
     */
    private async registrarMovimento(
        manager: EntityManager,
        dados: {
            creditoId: string;
            usuarioId: string;
            classificadoId?: string | null;
            tipo: ClassificadoCreditoMovimentoTipo;
            dias?: number;
            saldoAnterior?: number | null;
            saldoPosterior?: number | null;
            detalhes?: Record<string, unknown> | null;
        }
    ): Promise<ClassificadoCreditoMovimento> {
        const repository = manager.getRepository(
            ClassificadoCreditoMovimento
        );

        const movimento = repository.create({
            creditoId: dados.creditoId,
            usuarioId: dados.usuarioId,
            classificadoId:
                dados.classificadoId ?? null,
            tipo: dados.tipo,
            dias: dados.dias ?? 0,
            saldoAnterior:
                dados.saldoAnterior ?? null,
            saldoPosterior:
                dados.saldoPosterior ?? null,
            detalhes:
                dados.detalhes ?? null,
        });

        return repository.save(movimento);
    }

    /**
     * ==========================================================
     * CRIAR CRÉDITO
     * ==========================================================
     *
     * Nesta etapa o método também aceita pagamentoAprovado=true
     * para nossos testes.
     *
     * Mais adiante:
     *
     * checkout criado
     *      ↓
     * crédito PENDENTE
     *      ↓
     * webhook Mercado Pago
     *      ↓
     * confirmarPagamento()
     *      ↓
     * crédito DISPONIVEL
     */
    public async criarCredito(
        input: CriarCreditoInput
    ): Promise<ClassificadoCredito> {
        if (!input.usuarioId?.trim()) {
            throw new Error("USUARIO_ID_OBRIGATORIO");
        }

        if (
            !Object.values(
                ClassificadoCreditoPlano
            ).includes(input.plano)
        ) {
            throw new Error(
                "PLANO_CREDITO_INVALIDO"
            );
        }

        const diasComprados =
            this.normalizarDias(
                input.diasComprados
            );

        const valorPago =
            this.normalizarValorMonetario(
                input.valorPago
            );

        const pagamentoAprovado =
            input.pagamentoAprovado === true;

        const validadeUsoDias =
            input.validadeUsoDias !== undefined
                ? this.normalizarDias(
                    input.validadeUsoDias
                )
                : 90;

        return AppDataSource.transaction(
            async (manager) => {
                const creditoRepository =
                    manager.getRepository(
                        ClassificadoCredito
                    );

                const agora = new Date();

                const credito =
                    creditoRepository.create({
                        usuarioId: input.usuarioId,
                        plano: input.plano,

                        diasComprados,

                        diasConsumidos: 0,

                        /**
                         * Crédito pendente ainda NÃO pode ser utilizado.
                         *
                         * Entretanto mantemos os dias comprados registrados
                         * como saldo contratual.
                         *
                         * O status impede seu uso antes do pagamento.
                         */
                        diasRestantes: diasComprados,

                        valorPago,

                        paymentId:
                            input.paymentId ?? null,

                        checkoutSessionId:
                            input.checkoutSessionId ?? null,

                        status: pagamentoAprovado
                            ? ClassificadoCreditoStatus.DISPONIVEL
                            : ClassificadoCreditoStatus.PENDENTE,

                        adquiridoEm: pagamentoAprovado
                            ? agora
                            : null,

                        validadeEm: pagamentoAprovado
                            ? this.adicionarDias(
                                agora,
                                validadeUsoDias
                            )
                            : null,
                    });

                const salvo =
                    await creditoRepository.save(
                        credito
                    );

                await this.registrarMovimento(
                    manager,
                    {
                        creditoId: salvo.id,
                        usuarioId: salvo.usuarioId,

                        tipo:
                            ClassificadoCreditoMovimentoTipo.CREDITO_CRIADO,

                        dias: salvo.diasComprados,

                        saldoAnterior: 0,

                        saldoPosterior:
                            pagamentoAprovado
                                ? salvo.diasRestantes
                                : 0,

                        detalhes: {
                            plano: salvo.plano,
                            valorPago: salvo.valorPago,
                            pagamentoAprovado,
                        },
                    }
                );

                if (pagamentoAprovado) {
                    await this.registrarMovimento(
                        manager,
                        {
                            creditoId: salvo.id,
                            usuarioId: salvo.usuarioId,

                            tipo:
                                ClassificadoCreditoMovimentoTipo.PAGAMENTO_APROVADO,

                            dias: salvo.diasComprados,

                            saldoAnterior: 0,

                            saldoPosterior:
                                salvo.diasRestantes,

                            detalhes: {
                                paymentId:
                                    salvo.paymentId,
                                adquiridoEm:
                                    salvo.adquiridoEm,
                                validadeEm:
                                    salvo.validadeEm,
                            },
                        }
                    );
                }

                return salvo;
            }
        );
    }

    /**
     * ==========================================================
     * LISTAR CRÉDITOS DISPONÍVEIS
     * ==========================================================
     */
    public async buscarCreditosDisponiveis(
        usuarioId: string
    ): Promise<ClassificadoCredito[]> {
        if (!usuarioId?.trim()) {
            throw new Error("USUARIO_ID_OBRIGATORIO");
        }

        const repository =
            AppDataSource.getRepository(
                ClassificadoCredito
            );

        const agora = new Date();

        return repository
            .createQueryBuilder("credito")
            .where(
                "credito.usuario_id = :usuarioId",
                {
                    usuarioId,
                }
            )
            .andWhere(
                "credito.status = :status",
                {
                    status:
                        ClassificadoCreditoStatus.DISPONIVEL,
                }
            )
            .andWhere(
                "credito.dias_restantes > 0"
            )
            .andWhere(
                "(credito.validade_em IS NULL OR credito.validade_em > :agora)",
                {
                    agora,
                }
            )
            /**
             * Primeiro utilizamos o crédito que vencerá antes.
             */
            .orderBy(
                "credito.validade_em",
                "ASC"
            )
            .addOrderBy(
                "credito.created_at",
                "ASC"
            )
            .getMany();
    }

    /**
     * ==========================================================
     * SALDO DO USUÁRIO
     * ==========================================================
     */
    public async buscarSaldoUsuario(
        usuarioId: string
    ): Promise<SaldoCreditoUsuario> {
        const creditos =
            await this.buscarCreditosDisponiveis(
                usuarioId
            );

        const diasDisponiveis =
            creditos.reduce(
                (total, credito) =>
                    total +
                    Number(
                        credito.diasRestantes || 0
                    ),
                0
            );

        return {
            totalCreditos: creditos.length,
            diasDisponiveis,
            creditos,
        };
    }

    /**
     * ==========================================================
     * VINCULAR CRÉDITO AO CLASSIFICADO
     * ==========================================================
     *
     * IMPORTANTE:
     *
     * Este método NÃO transforma o anúncio em ATIVO.
     *
     * Ele apenas reserva/vincula o crédito.
     *
     * A publicação será responsabilidade do fluxo do
     * ClassificadoService.
     */
    public async vincularCreditoAoClassificado(
        creditoId: string,
        classificadoId: string,
        usuarioId: string
    ): Promise<ResultadoVinculoCredito> {
        if (!creditoId?.trim()) {
            throw new Error(
                "CREDITO_ID_OBRIGATORIO"
            );
        }

        if (!classificadoId?.trim()) {
            throw new Error(
                "CLASSIFICADO_ID_OBRIGATORIO"
            );
        }

        if (!usuarioId?.trim()) {
            throw new Error(
                "USUARIO_ID_OBRIGATORIO"
            );
        }

        return AppDataSource.transaction(
            async (manager) => {
                const creditoRepository =
                    manager.getRepository(
                        ClassificadoCredito
                    );

                const classificadoRepository =
                    manager.getRepository(
                        Classificado
                    );

                /**
                 * Lock pessimista para impedir duas requisições
                 * simultâneas de utilizarem o mesmo crédito.
                 */
                const credito =
                    await creditoRepository
                        .createQueryBuilder(
                            "credito"
                        )
                        .setLock(
                            "pessimistic_write"
                        )
                        .where(
                            "credito.id = :creditoId",
                            {
                                creditoId,
                            }
                        )
                        .getOne();

                if (!credito) {
                    throw new Error(
                        "CREDITO_NAO_ENCONTRADO"
                    );
                }

                if (
                    credito.usuarioId !== usuarioId
                ) {
                    throw new Error(
                        "CREDITO_NAO_PERTENCE_AO_USUARIO"
                    );
                }

                if (
                    credito.status !==
                    ClassificadoCreditoStatus.DISPONIVEL
                ) {
                    throw new Error(
                        "CREDITO_NAO_DISPONIVEL"
                    );
                }

                if (
                    Number(
                        credito.diasRestantes
                    ) <= 0
                ) {
                    throw new Error(
                        "CREDITO_SEM_SALDO"
                    );
                }

                if (
                    credito.validadeEm &&
                    credito.validadeEm.getTime() <=
                    Date.now()
                ) {
                    credito.status =
                        ClassificadoCreditoStatus.EXPIRADO;

                    await creditoRepository.save(
                        credito
                    );

                    await this.registrarMovimento(
                        manager,
                        {
                            creditoId: credito.id,
                            usuarioId:
                                credito.usuarioId,

                            tipo:
                                ClassificadoCreditoMovimentoTipo.CREDITO_EXPIRADO,

                            dias: 0,

                            saldoAnterior:
                                credito.diasRestantes,

                            saldoPosterior:
                                credito.diasRestantes,

                            detalhes: {
                                validadeEm:
                                    credito.validadeEm,
                            },
                        }
                    );

                    throw new Error(
                        "CREDITO_EXPIRADO"
                    );
                }

                const classificado =
                    await classificadoRepository
                        .createQueryBuilder(
                            "classificado"
                        )
                        .setLock(
                            "pessimistic_write"
                        )
                        .where(
                            "classificado.id = :classificadoId",
                            {
                                classificadoId,
                            }
                        )
                        .getOne();

                if (!classificado) {
                    throw new Error(
                        "CLASSIFICADO_NAO_ENCONTRADO"
                    );
                }

                if (
                    classificado.usuarioId !==
                    usuarioId
                ) {
                    throw new Error(
                        "CLASSIFICADO_NAO_PERTENCE_AO_USUARIO"
                    );
                }

                if (classificado.creditoId) {
                    throw new Error(
                        "CLASSIFICADO_JA_POSSUI_CREDITO"
                    );
                }

                /**
                 * Nesta etapa aceitamos o vínculo apenas em estados
                 * anteriores à publicação.
                 *
                 * Depois ajustaremos isso ao fluxo definitivo de
                 * pagamento/publicação.
                 */
                const statusPermitidos = [
                    ClassificadoStatus.AGUARDANDO_PAGAMENTO,
                    ClassificadoStatus.PAGO,
                    ClassificadoStatus.EM_ANALISE,
                ];

                if (
                    !statusPermitidos.includes(
                        classificado.status
                    )
                ) {
                    throw new Error(
                        "STATUS_CLASSIFICADO_NAO_PERMITE_CREDITO"
                    );
                }

                classificado.creditoId =
                    credito.id;

                /**
                 * A duração disponível para este anúncio será o saldo
                 * atual do crédito.
                 *
                 * Exemplo:
                 *
                 * crédito original = 30
                 * saldo atual = 27
                 *
                 * novo anúncio pode utilizar até 27 dias.
                 */
                classificado.duracaoDias =
                    credito.diasRestantes;

                credito.status =
                    ClassificadoCreditoStatus.EM_USO;

                await classificadoRepository.save(
                    classificado
                );

                await creditoRepository.save(
                    credito
                );

                await this.registrarMovimento(
                    manager,
                    {
                        creditoId: credito.id,
                        usuarioId:
                            credito.usuarioId,
                        classificadoId:
                            classificado.id,

                        tipo:
                            ClassificadoCreditoMovimentoTipo.ANUNCIO_INICIADO,

                        dias: 0,

                        saldoAnterior:
                            credito.diasRestantes,

                        saldoPosterior:
                            credito.diasRestantes,

                        detalhes: {
                            plano: credito.plano,
                            diasDisponiveis:
                                credito.diasRestantes,
                            statusClassificado:
                                classificado.status,
                        },
                    }
                );

                return {
                    classificado,
                    credito,
                };
            }
        );
    }

    /**
     * ==========================================================
     * ENCERRAR USO DO CRÉDITO
     * ==========================================================
     *
     * Este método calcula quanto daquele crédito foi utilizado.
     *
     * Exemplo:
     *
     * saldo antes = 30
     *
     * publicado:
     * 01/10 10:00
     *
     * vendido:
     * 04/10 08:00
     *
     * utilização:
     * 3 dias
     *
     * saldo:
     * 27 dias
     *
     * IMPORTANTE:
     *
     * O método NÃO altera o status do classificado.
     *
     * O ClassificadoService fará isso e chamará esta operação
     * dentro do fluxo apropriado.
     */
    public async encerrarUsoCredito(
        classificadoId: string,
        usuarioId: string,
        motivo: MotivoEncerramentoCredito,
        encerradoEm: Date = new Date()
    ): Promise<ResultadoEncerramentoCredito> {
        return AppDataSource.transaction((manager) =>
            this.encerrarUsoCreditoComManager(
                manager,
                classificadoId,
                usuarioId,
                motivo,
                encerradoEm
            )
        );
    }

    public async encerrarUsoCreditoComManager(
        manager: EntityManager,
        classificadoId: string,
        usuarioId: string,
        motivo: MotivoEncerramentoCredito,
        encerradoEm: Date = new Date()
    ): Promise<ResultadoEncerramentoCredito> {
        if (!classificadoId?.trim()) {
            throw new Error("CLASSIFICADO_ID_OBRIGATORIO");
        }

        if (!usuarioId?.trim()) {
            throw new Error("USUARIO_ID_OBRIGATORIO");
        }

        if (
            !["VENDIDO", "CANCELADO", "EXPIRADO"].includes(motivo)
        ) {
            throw new Error("MOTIVO_ENCERRAMENTO_INVALIDO");
        }

        const classificadoRepository =
            manager.getRepository(Classificado);

        const creditoRepository =
            manager.getRepository(ClassificadoCredito);

        const classificado =
            await classificadoRepository
                .createQueryBuilder("classificado")
                .setLock("pessimistic_write")
                .where("classificado.id = :classificadoId", {
                    classificadoId,
                })
                .getOne();

        if (!classificado) {
            throw new Error("CLASSIFICADO_NAO_ENCONTRADO");
        }

        if (classificado.usuarioId !== usuarioId) {
            throw new Error(
                "CLASSIFICADO_NAO_PERTENCE_AO_USUARIO"
            );
        }

        if (!classificado.creditoId) {
            throw new Error("CLASSIFICADO_SEM_CREDITO");
        }

        if (!classificado.publicadoEm) {
            throw new Error("CLASSIFICADO_NAO_PUBLICADO");
        }

        const credito =
            await creditoRepository
                .createQueryBuilder("credito")
                .setLock("pessimistic_write")
                .where("credito.id = :creditoId", {
                    creditoId: classificado.creditoId,
                })
                .getOne();

        if (!credito) {
            throw new Error("CREDITO_NAO_ENCONTRADO");
        }

        if (credito.usuarioId !== usuarioId) {
            throw new Error(
                "CREDITO_NAO_PERTENCE_AO_USUARIO"
            );
        }

        if (
            credito.status !==
            ClassificadoCreditoStatus.EM_USO
        ) {
            throw new Error("CREDITO_NAO_ESTA_EM_USO");
        }

        const diasCalculados =
            this.calcularDiasUtilizados(
                classificado.publicadoEm,
                encerradoEm
            );

        const saldoAnterior =
            Number(credito.diasRestantes);

        const diasUtilizados =
            Math.min(
                diasCalculados,
                saldoAnterior
            );

        const saldoPosterior =
            Math.max(
                0,
                saldoAnterior - diasUtilizados
            );

        credito.diasConsumidos =
            Number(credito.diasConsumidos || 0) +
            diasUtilizados;

        credito.diasRestantes =
            saldoPosterior;

        credito.status =
            saldoPosterior > 0
                ? ClassificadoCreditoStatus.DISPONIVEL
                : ClassificadoCreditoStatus.ESGOTADO;

        await creditoRepository.save(credito);

        await this.registrarMovimento(
            manager,
            {
                creditoId: credito.id,
                usuarioId: credito.usuarioId,
                classificadoId: classificado.id,

                tipo:
                    ClassificadoCreditoMovimentoTipo.DIAS_CONSUMIDOS,

                dias: diasUtilizados,

                saldoAnterior,
                saldoPosterior,

                detalhes: {
                    motivo,
                    publicadoEm:
                        classificado.publicadoEm,
                    encerradoEm,
                    diasCalculados,
                },
            }
        );

        if (motivo === "VENDIDO") {
            await this.registrarMovimento(
                manager,
                {
                    creditoId: credito.id,
                    usuarioId: credito.usuarioId,
                    classificadoId: classificado.id,

                    tipo:
                        ClassificadoCreditoMovimentoTipo.ANUNCIO_VENDIDO,

                    dias: diasUtilizados,
                    saldoAnterior,
                    saldoPosterior,

                    detalhes: {
                        encerradoEm,
                    },
                }
            );
        }

        if (motivo === "CANCELADO") {
            await this.registrarMovimento(
                manager,
                {
                    creditoId: credito.id,
                    usuarioId: credito.usuarioId,
                    classificadoId: classificado.id,

                    tipo:
                        ClassificadoCreditoMovimentoTipo.ANUNCIO_CANCELADO,

                    dias: diasUtilizados,
                    saldoAnterior,
                    saldoPosterior,

                    detalhes: {
                        encerradoEm,
                    },
                }
            );
        }

        if (saldoPosterior > 0) {
            await this.registrarMovimento(
                manager,
                {
                    creditoId: credito.id,
                    usuarioId: credito.usuarioId,
                    classificadoId: classificado.id,

                    tipo:
                        ClassificadoCreditoMovimentoTipo.SALDO_DEVOLVIDO,

                    dias: saldoPosterior,

                    saldoAnterior:
                        saldoPosterior,

                    saldoPosterior:
                        saldoPosterior,

                    detalhes: {
                        motivo,
                        observacao:
                            "Saldo restante liberado para outro classificado.",
                    },
                }
            );
        } else {
            await this.registrarMovimento(
                manager,
                {
                    creditoId: credito.id,
                    usuarioId: credito.usuarioId,
                    classificadoId: classificado.id,

                    tipo:
                        ClassificadoCreditoMovimentoTipo.CREDITO_ESGOTADO,

                    dias: 0,
                    saldoAnterior: 0,
                    saldoPosterior: 0,

                    detalhes: {
                        motivo,
                    },
                }
            );
        }

        classificado.creditoId = null;

        await classificadoRepository.save(
            classificado
        );

        return {
            credito,
            diasUtilizados,
            saldoAnterior,
            saldoPosterior,
        };
    }
    /**
     * ==========================================================
     * EXPIRAR CRÉDITOS VENCIDOS
     * ==========================================================
     *
     * Poderá futuramente ser executado por cron.
     *
     * Não mexemos em créditos EM_USO aqui.
     *
     * O ciclo do anúncio será responsável por tratar anúncios
     * ativos que atingirem seu limite.
     */
    public async expirarCreditosVencidos(): Promise<number> {
        const agora = new Date();

        return AppDataSource.transaction(
            async (manager: any) => {
                const repository =
                    manager.getRepository(
                        ClassificadoCredito
                    );

                const creditos =
                    await repository.find({
                        where: {
                            status: In([
                                ClassificadoCreditoStatus.DISPONIVEL,
                                ClassificadoCreditoStatus.PENDENTE,
                            ]),
                        },
                    });

                let quantidade = 0;

                for (const credito of creditos) {
                    if (
                        !credito.validadeEm ||
                        credito.validadeEm.getTime() >
                        agora.getTime()
                    ) {
                        continue;
                    }

                    const saldoAnterior =
                        Number(
                            credito.diasRestantes || 0
                        );

                    credito.status =
                        ClassificadoCreditoStatus.EXPIRADO;

                    await repository.save(
                        credito
                    );

                    await this.registrarMovimento(
                        manager,
                        {
                            creditoId: credito.id,
                            usuarioId:
                                credito.usuarioId,

                            tipo:
                                ClassificadoCreditoMovimentoTipo.CREDITO_EXPIRADO,

                            dias: 0,

                            saldoAnterior,

                            saldoPosterior:
                                saldoAnterior,

                            detalhes: {
                                validadeEm:
                                    credito.validadeEm,
                                processadoEm: agora,
                            },
                        }
                    );

                    quantidade++;
                }

                return quantidade;
            }
        );
    }
}

export default new ClassificadoCreditoService();