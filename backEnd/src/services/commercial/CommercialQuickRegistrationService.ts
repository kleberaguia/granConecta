import { AppDataSource } from "../../config/data-source";

import * as bcrypt from "bcryptjs";

import { Usuario } from "../../models/UserModels";
import { UsuarioAuth } from "../../models/UsuarioAuthModels";
import { UserStatus } from "../../models/enums";

import {
    CommercialFlowState,
} from "../../models/CommercialFlowModel";

import CommercialFlowStateService from "./CommercialFlowStateService";
import CommercialCustomerService from "./CommercialCustomerService";

export type CommercialQuickRegistrationInput = {
    flowId: string;

    nome?: string | null;

    email?: string | null;

    telefone?: string | null;

    /**
     * Quando o frontend/login/cadastro já tiver criado o usuário,
     * podemos apenas anexar o ID ao fluxo.
     */
    createdUserId?: string | null;
};

export type CommercialQuickRegistrationResult =
    | {
        status: "READY_TO_CREATE";

        requiresCreation: true;

        customerUserId: null;

        data: {
            nome: string;
            email: string;
            telefone: string;
        };
    }
    | {
        status: "USER_ALREADY_EXISTS";

        requiresCreation: false;

        requiresLogin: true;

        customerUserId: string;

        data: {
            nome: string | null;
            email: string | null;
            telefone: string | null;
        };
    }
    | {
        status: "REGISTERED";

        requiresCreation: false;

        requiresLogin: false;

        customerUserId: string;

        data: {
            nome: string | null;
            email: string | null;
            telefone: string | null;
        };
    }
    | {
        status: "MISSING_DATA";

        requiresCreation: false;

        customerUserId: null;

        missingFields: Array<
            "nome" |
            "email" |
            "telefone"
        >;

        data: {
            nome: string | null;
            email: string | null;
            telefone: string | null;
        };
    };

export type CreateCommercialCustomerInput = {
    flowId: string;
    senha: string;
};

export type CreateCommercialCustomerResult = {
    status: "REGISTERED";
    customerUserId: string;
    user: {
        id: string;
        nome: string;
        email: string;
        telefone: string;
    };
};

export class CommercialQuickRegistrationService {
    constructor(
        private readonly flowState =
            new CommercialFlowStateService(),

        private readonly customerService =
            new CommercialCustomerService(),
    ) { }

    private get userRepository() {
        return AppDataSource.getRepository(
            Usuario,
        );
    }

    /**
     * ================================================================
     * PREPARAR CADASTRO RÁPIDO
     * ================================================================
     *
     * Faz:
     *
     * 1. recupera dados já coletados no CommercialFlow;
     * 2. mescla com dados recebidos agora;
     * 3. valida campos mínimos;
     * 4. verifica novamente se usuário já existe;
     * 5. se usuário já foi criado externamente, vincula ao fluxo;
     * 6. senão retorna READY_TO_CREATE.
     *
     * Não cria usuário ainda.
     */
    async prepare(
        input: CommercialQuickRegistrationInput,
    ): Promise<CommercialQuickRegistrationResult> {
        const flowId =
            String(
                input.flowId || "",
            ).trim();

        if (!flowId) {
            throw new Error(
                "COMMERCIAL_QUICK_REGISTRATION_FLOW_ID_OBRIGATORIO",
            );
        }

        const flow =
            await this.flowState.findById(
                flowId,
            );

        if (!flow) {
            throw new Error(
                "COMMERCIAL_FLOW_NAO_ENCONTRADO",
            );
        }

        /**
         * ============================================================
         * 1. USUÁRIO JÁ VINCULADO
         * ============================================================
         */
        if (flow.customerUserId) {
            const identity =
                await this.customerService
                    .getIdentityHint(
                        flow.id,
                    );

            return {
                status:
                    "REGISTERED",

                requiresCreation:
                    false,

                requiresLogin:
                    false,

                customerUserId:
                    flow.customerUserId,

                data: {
                    nome:
                        identity.nome,

                    email:
                        identity.email,

                    telefone:
                        identity.telefone,
                },
            };
        }

        /**
         * ============================================================
         * 2. USUÁRIO CRIADO POR OUTRO FLUXO/FRONTEND
         * ============================================================
         *
         * Exemplo:
         *
         * cadastro rápido abre modal
         * -> frontend cria usuário
         * -> retorna userId
         * -> este método associa ao CommercialFlow
         */
        const createdUserId =
            String(
                input.createdUserId ||
                "",
            ).trim();

        if (createdUserId) {
            const user =
                await this.userRepository
                    .findOne({
                        where: {
                            id:
                                createdUserId,
                        } as any,
                    });

            if (!user) {
                throw new Error(
                    "COMMERCIAL_QUICK_REGISTRATION_USUARIO_CRIADO_NAO_ENCONTRADO",
                );
            }

            await this.flowState.setCustomer(
                flow.id,
                createdUserId,
            );

            const serialized =
                this.serializeUser(
                    user,
                );

            await this.customerService
                .saveIdentityHint(
                    flow.id,
                    {
                        nome:
                            serialized.nome,

                        email:
                            serialized.email,

                        telefone:
                            serialized.telefone,
                    },
                );

            console.log(
                "[COMMERCIAL REGISTRATION] Usuário criado vinculado ao fluxo",
                {
                    flowId:
                        flow.id,

                    customerUserId:
                        createdUserId,
                },
            );

            return {
                status:
                    "REGISTERED",

                requiresCreation:
                    false,

                requiresLogin:
                    false,

                customerUserId:
                    createdUserId,

                data:
                    serialized,
            };
        }

        /**
         * ============================================================
         * 3. IDENTIDADE JÁ COLETADA
         * ============================================================
         */
        const currentIdentity =
            await this.customerService
                .getIdentityHint(
                    flow.id,
                );

        const nome =
            this.normalizeName(
                input.nome !==
                    undefined
                    ? input.nome
                    : currentIdentity.nome,
            );

        const email =
            this.normalizeEmail(
                input.email !==
                    undefined
                    ? input.email
                    : currentIdentity.email,
            );

        const telefone =
            this.normalizePhone(
                input.telefone !==
                    undefined
                    ? input.telefone
                    : currentIdentity.telefone,
            );

        /**
         * Persiste tudo que já conseguimos coletar.
         */
        await this.customerService
            .saveIdentityHint(
                flow.id,
                {
                    nome,
                    email,
                    telefone,
                },
            );

        /**
         * ============================================================
         * 4. CAMPOS MÍNIMOS
         * ============================================================
         */
        if (
            !nome ||
            !email ||
            !telefone
        ) {
            const missingFields:
                Array<
                    "nome" |
                    "email" |
                    "telefone"
                > = [];

            if (!nome) {
                missingFields.push(
                    "nome",
                );
            }

            if (!email) {
                missingFields.push(
                    "email",
                );
            }

            if (!telefone) {
                missingFields.push(
                    "telefone",
                );
            }

            await this.flowState
                .setState(
                    flow.id,
                    CommercialFlowState
                        .AGUARDANDO_CADASTRO_RAPIDO,
                    {
                        registrationMissingFields:
                            missingFields,
                    },
                );

            return {
                status:
                    "MISSING_DATA",

                requiresCreation:
                    false,

                customerUserId:
                    null,

                missingFields,

                data: {
                    nome,
                    email,
                    telefone,
                },
            };
        }

        /**
         * ============================================================
         * 5. VERIFICA DUPLICIDADE
         * ============================================================
         *
         * É importante repetir essa consulta imediatamente antes
         * da criação.
         */
        const resolution =
            await this.customerService
                .resolve({
                    flowId:
                        flow.id,

                    nome,

                    email,

                    telefone,
                });

        /**
         * Já existe uma conta.
         *
         * Não criamos outra.
         * Cliente deve autenticar.
         */
        if (
            resolution.status ===
            "LOGIN_REQUIRED"
        ) {
            await this.flowState.setState(
                flow.id,
                CommercialFlowState
                    .AGUARDANDO_LOGIN,
                {
                    registrationAttempt:
                        "USER_ALREADY_EXISTS",

                    loginCustomerUserId:
                        resolution.customerUserId,
                },
            );

            return {
                status:
                    "USER_ALREADY_EXISTS",

                requiresCreation:
                    false,

                requiresLogin:
                    true,

                customerUserId:
                    resolution.customerUserId,

                data: {
                    nome:
                        resolution.user.name,

                    email:
                        resolution.user.email,

                    telefone:
                        resolution.user.telefone,
                },
            };
        }

        /**
         * Em teoria este caso ocorre apenas se o fluxo ganhou
         * customerUserId durante a execução.
         */
        if (
            resolution.status ===
            "IDENTIFIED"
        ) {
            return {
                status:
                    "REGISTERED",

                requiresCreation:
                    false,

                requiresLogin:
                    false,

                customerUserId:
                    resolution.customerUserId,

                data: {
                    nome:
                        resolution.user.name,

                    email:
                        resolution.user.email,

                    telefone:
                        resolution.user.telefone,
                },
            };
        }

        /**
         * ============================================================
         * 6. PRONTO PARA CRIAR
         * ============================================================
         *
         * Aqui temos:
         *
         * nome
         * email
         * telefone
         *
         * e nenhuma conta existente.
         *
         * O próximo método vai usar o CreateUserService oficial
         * do GranConecta.
         */
        await this.flowState.setState(
            flow.id,
            CommercialFlowState
                .AGUARDANDO_CADASTRO_RAPIDO,
            {
                registrationReady:
                    true,

                registrationReadyAt:
                    new Date()
                        .toISOString(),
            },
        );

        console.log(
            "[COMMERCIAL REGISTRATION] Dados prontos para criação",
            {
                flowId:
                    flow.id,

                email,

                telefoneFinal:
                    telefone.slice(
                        -4,
                    ),
            },
        );

        return {
            status:
                "READY_TO_CREATE",

            requiresCreation:
                true,

            customerUserId:
                null,

            data: {
                nome,
                email,
                telefone,
            },
        };
    }

    /**
     * ================================================================
     * CRIAR CONTA RÁPIDA
     * ================================================================
     *
     * Só deve ser chamado depois que prepare() retornar READY_TO_CREATE.
     *
     * Cria Usuario + UsuarioAuth dentro de uma transação e, após o COMMIT,
     * vincula o novo customerUserId ao CommercialFlow.
     */
    async createAccount(
        input: CreateCommercialCustomerInput,
    ): Promise<CreateCommercialCustomerResult> {
        const flowId = String(input.flowId || "").trim();
        const senha = String(input.senha || "");

        if (!flowId) {
            throw new Error(
                "COMMERCIAL_REGISTRATION_FLOW_ID_OBRIGATORIO",
            );
        }

        if (!senha || senha.length < 6) {
            throw new Error(
                "COMMERCIAL_REGISTRATION_SENHA_INVALIDA",
            );
        }

        const flow = await this.flowState.findById(flowId);

        if (!flow) {
            throw new Error(
                "COMMERCIAL_FLOW_NAO_ENCONTRADO",
            );
        }

        if (flow.customerUserId) {
            const existingUser = await this.userRepository.findOne({
                where: {
                    id: flow.customerUserId,
                } as any,
            });

            if (!existingUser) {
                throw new Error(
                    "COMMERCIAL_CUSTOMER_VINCULO_INVALIDO",
                );
            }

            const serialized = this.serializeUser(existingUser);

            if (
                !serialized.nome ||
                !serialized.email ||
                !serialized.telefone
            ) {
                throw new Error(
                    "COMMERCIAL_CUSTOMER_DADOS_INCOMPLETOS",
                );
            }

            return {
                status: "REGISTERED",
                customerUserId: existingUser.id,
                user: {
                    id: existingUser.id,
                    nome: serialized.nome,
                    email: serialized.email,
                    telefone: serialized.telefone,
                },
            };
        }

        const identity =
            await this.customerService.getIdentityHint(flow.id);

        const nome = this.normalizeName(identity.nome);
        const email = this.normalizeEmail(identity.email);
        const telefone = this.normalizePhone(identity.telefone);

        if (!nome || !email || !telefone) {
            throw new Error(
                "COMMERCIAL_REGISTRATION_DADOS_INCOMPLETOS",
            );
        }

        const queryRunner = AppDataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const existingUser =
                await queryRunner.manager
                    .createQueryBuilder(Usuario, "usuario")
                    .where(
                        "LOWER(usuario.email) = LOWER(:email)",
                        { email },
                    )
                    .getOne();

            if (existingUser) {
                await queryRunner.rollbackTransaction();

                await this.flowState.setState(
                    flow.id,
                    CommercialFlowState.AGUARDANDO_LOGIN,
                    {
                        registrationAttempt: "EMAIL_ALREADY_EXISTS",
                        existingCustomerUserId: existingUser.id,
                    },
                );

                throw new Error(
                    "COMMERCIAL_REGISTRATION_USUARIO_JA_EXISTE_LOGIN_NECESSARIO",
                );
            }

            const existingAuth =
                await queryRunner.manager.findOne(UsuarioAuth, {
                    where: { email },
                });

            if (existingAuth) {
                await queryRunner.rollbackTransaction();

                await this.flowState.setState(
                    flow.id,
                    CommercialFlowState.AGUARDANDO_LOGIN,
                    {
                        registrationAttempt: "AUTH_EMAIL_ALREADY_EXISTS",
                    },
                );

                throw new Error(
                    "COMMERCIAL_REGISTRATION_EMAIL_JA_CADASTRADO",
                );
            }

            const newUser = queryRunner.manager.create(Usuario, {
                name: nome,
                email,
                telefone,
                tipo: "VISITANTE",
                status_conta: UserStatus.APROVADO,
                is_interno: false,
                is_empreendedor: false,
                is_prestador: false,
            });

            let savedUser =
                await queryRunner.manager.save(Usuario, newUser);

            const passwordHash = await bcrypt.hash(senha, 10);

            const codigoVerificacao = Math.floor(
                100000 + Math.random() * 900000,
            ).toString();

            const newAuth = queryRunner.manager.create(UsuarioAuth, {
                usuarioId: savedUser.id,
                email,
                password_hash: passwordHash,
                isActive: true,
                emailVerificado: false,
                codigoVerificacao,
            });

            const savedAuth =
                await queryRunner.manager.save(UsuarioAuth, newAuth);

            savedUser.authId = savedAuth.id;

            savedUser =
                await queryRunner.manager.save(Usuario, savedUser);

            await queryRunner.commitTransaction();

            await this.flowState.setCustomer(
                flow.id,
                savedUser.id,
            );

            await this.customerService.saveIdentityHint(
                flow.id,
                {
                    nome,
                    email,
                    telefone,
                },
            );

            await this.flowState.update(
                flow.id,
                {
                    metadata: {
                        quickRegistration: true,
                        quickRegistrationCompletedAt:
                            new Date().toISOString(),
                        authId: savedAuth.id,
                        emailVerificationRequired: true,
                    },
                },
            );

            console.log(
                "[COMMERCIAL REGISTRATION] Conta criada com sucesso",
                {
                    flowId: flow.id,
                    customerUserId: savedUser.id,
                    authId: savedAuth.id,
                    email,
                    telefoneFinal: telefone.slice(-4),
                },
            );

            return {
                status: "REGISTERED",
                customerUserId: savedUser.id,
                user: {
                    id: savedUser.id,
                    nome,
                    email,
                    telefone,
                },
            };
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }

            console.error(
                "[COMMERCIAL REGISTRATION] Erro ao criar conta",
                {
                    flowId: flow.id,
                    error:
                        error instanceof Error
                            ? error.message
                            : error,
                },
            );

            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * ================================================================
     * FINALIZAR CADASTRO COM USER ID
     * ================================================================
     *
     * Depois que o CreateUserService criar a conta,
     * chamaremos este método.
     */
    async completeRegistration(
        flowId: string,
        userId: string,
    ) {
        const id =
            String(
                userId || "",
            ).trim();

        if (!id) {
            throw new Error(
                "COMMERCIAL_QUICK_REGISTRATION_USER_ID_OBRIGATORIO",
            );
        }

        const user =
            await this.userRepository
                .findOne({
                    where: {
                        id,
                    } as any,
                });

        if (!user) {
            throw new Error(
                "COMMERCIAL_QUICK_REGISTRATION_USUARIO_NAO_ENCONTRADO",
            );
        }

        const flow =
            await this.flowState
                .setCustomer(
                    flowId,
                    id,
                );

        const serialized =
            this.serializeUser(
                user,
            );

        await this.customerService
            .saveIdentityHint(
                flow.id,
                {
                    nome:
                        serialized.nome,

                    email:
                        serialized.email,

                    telefone:
                        serialized.telefone,
                },
            );

        await this.flowState.update(
            flow.id,
            {
                metadata: {
                    quickRegistrationCompletedAt:
                        new Date()
                            .toISOString(),
                },
            },
        );

        console.log(
            "[COMMERCIAL REGISTRATION] Cadastro rápido concluído",
            {
                flowId:
                    flow.id,

                customerUserId:
                    id,
            },
        );

        return {
            flow,

            customerUserId:
                id,

            user:
                serialized,
        };
    }

    /**
     * ================================================================
     * SERIALIZAÇÃO
     * ================================================================
     */
    private serializeUser(
        user: Usuario,
    ) {
        return {
            nome:
                this.readFirstString(
                    user,
                    [
                        "name",
                        "nome",
                        "nomeCompleto",
                    ],
                ),

            email:
                this.normalizeEmail(
                    this.readFirstString(
                        user,
                        [
                            "email",
                        ],
                    ),
                ),

            telefone:
                this.normalizePhone(
                    this.readFirstString(
                        user,
                        [
                            "telefone",
                            "phone",
                            "celular",
                            "whatsapp",
                        ],
                    ),
                ),
        };
    }

    private normalizeEmail(
        value:
            | string
            | null
            | undefined,
    ): string | null {
        const email =
            String(
                value || "",
            )
                .trim()
                .toLowerCase();

        if (!email) {
            return null;
        }

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                email,
            )
            ? email
            : null;
    }

    private normalizePhone(
        value:
            | string
            | null
            | undefined,
    ): string | null {
        let digits =
            String(
                value || "",
            )
                .replace(
                    /\D/g,
                    "",
                );

        if (!digits) {
            return null;
        }

        if (
            digits.length >=
            12 &&
            digits.startsWith(
                "55",
            )
        ) {
            digits =
                digits.slice(
                    2,
                );
        }

        if (
            digits.length <
            10 ||
            digits.length >
            11
        ) {
            return null;
        }

        return digits;
    }

    private normalizeName(
        value:
            | string
            | null
            | undefined,
    ): string | null {
        const result =
            String(
                value || "",
            )
                .trim()
                .replace(
                    /\s+/g,
                    " ",
                );

        return result ||
            null;
    }

    private readFirstString(
        source: unknown,
        keys: string[],
    ): string | null {
        if (
            !source ||
            typeof source !==
            "object"
        ) {
            return null;
        }

        for (
            const key of
            keys
        ) {
            const value =
                (
                    source as Record<
                        string,
                        unknown
                    >
                )[key];

            if (
                value !==
                null &&
                value !==
                undefined
            ) {
                const normalized =
                    String(
                        value,
                    ).trim();

                if (normalized) {
                    return normalized;
                }
            }
        }

        return null;
    }


    
}

export default CommercialQuickRegistrationService;