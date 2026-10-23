import { AppDataSource } from "../../config/data-source";
import { CommercialFlowState } from "../../models/CommercialFlowModel";

import { Usuario } from "../../models/UserModels";

import CommercialFlowStateService from "./CommercialFlowStateService";

export type CommercialCustomerLookupInput = {
    flowId: string;

    authenticatedUserId?: string | null;

    email?: string | null;

    telefone?: string | null;

    nome?: string | null;
};

export type CommercialCustomerResolution =
    | {
        status: "IDENTIFIED";

        customerUserId: string;

        source:
        | "AUTHENTICATED"
        | "EMAIL"
        | "PHONE";

        requiresLogin: false;

        requiresRegistration: false;

        user: {
            id: string;
            name: string | null;
            email: string | null;
            telefone: string | null;
        };
    }
    | {
        status: "LOGIN_REQUIRED";

        customerUserId: string;

        source:
        | "EMAIL"
        | "PHONE";

        requiresLogin: true;

        requiresRegistration: false;

        user: {
            id: string;
            name: string | null;
            email: string | null;
            telefone: string | null;
        };
    }
    | {
        status: "REGISTRATION_REQUIRED";

        customerUserId: null;

        source: "NONE";

        requiresLogin: false;

        requiresRegistration: true;

        suggestedData: {
            nome: string | null;
            email: string | null;
            telefone: string | null;
        };
    };

/**
 * ================================================================
 * COMMERCIAL CUSTOMER SERVICE
 * ================================================================
 *
 * Responsabilidade:
 *
 * - identificar usuário autenticado;
 * - localizar conta existente por e-mail;
 * - localizar conta existente por telefone;
 * - decidir se precisa LOGIN;
 * - decidir se precisa CADASTRO RÁPIDO;
 * - vincular customerUserId ao CommercialFlow.
 *
 * Este serviço NÃO:
 *
 * - cria usuário ainda;
 * - autentica usuário;
 * - gera JWT;
 * - cria pagamento;
 * - cria solicitação;
 * - agenda atendimento.
 *
 * Essas responsabilidades entram em serviços próprios.
 */
export class CommercialCustomerService {
    constructor(
        private readonly flowState =
            new CommercialFlowStateService(),
    ) { }

    private get userRepository() {
        return AppDataSource.getRepository(
            Usuario,
        );
    }

    /**
     * ================================================================
     * RESOLVER CLIENTE
     * ================================================================
     */
    async resolve(
        input: CommercialCustomerLookupInput,
    ): Promise<CommercialCustomerResolution> {
        const flowId =
            String(
                input.flowId || "",
            ).trim();

        if (!flowId) {
            throw new Error(
                "COMMERCIAL_CUSTOMER_FLOW_ID_OBRIGATORIO",
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
         * 1. CLIENTE JÁ VINCULADO AO FLUXO
         * ============================================================
         */
        if (flow.customerUserId) {
            const user =
                await this.findUserById(
                    flow.customerUserId,
                );

            if (user) {
                return {
                    status:
                        "IDENTIFIED",

                    customerUserId:
                        String(
                            user.id,
                        ),

                    source:
                        "AUTHENTICATED",

                    requiresLogin:
                        false,

                    requiresRegistration:
                        false,

                    user:
                        this.serializeUser(
                            user,
                        ),
                };
            }

            /**
             * Existe ID no flow, mas usuário não foi encontrado.
             *
             * Melhor limpar do que continuar carregando
             * uma referência inválida.
             */
            await this.flowState.update(
                flow.id,
                {
                    customerUserId:
                        null,
                },
            );
        }

        /**
         * ============================================================
         * 2. USUÁRIO AUTENTICADO
         * ============================================================
         *
         * Esta é sempre a fonte mais confiável.
         */
        const authenticatedUserId =
            input.authenticatedUserId
                ? String(
                    input.authenticatedUserId,
                ).trim()
                : "";

        if (authenticatedUserId) {
            const authenticatedUser =
                await this.findUserById(
                    authenticatedUserId,
                );

            if (!authenticatedUser) {
                throw new Error(
                    "COMMERCIAL_CUSTOMER_USUARIO_AUTENTICADO_NAO_ENCONTRADO",
                );
            }

            await this.flowState.setCustomer(
                flow.id,
                String(
                    authenticatedUser.id,
                ),
            );

            console.log(
                "[COMMERCIAL CUSTOMER] Cliente identificado pela autenticação",
                {
                    flowId:
                        flow.id,

                    customerUserId:
                        authenticatedUser.id,
                },
            );

            return {
                status:
                    "IDENTIFIED",

                customerUserId:
                    String(
                        authenticatedUser.id,
                    ),

                source:
                    "AUTHENTICATED",

                requiresLogin:
                    false,

                requiresRegistration:
                    false,

                user:
                    this.serializeUser(
                        authenticatedUser,
                    ),
            };
        }

        /**
         * ============================================================
         * 3. NORMALIZA DADOS INFORMADOS
         * ============================================================
         */
        /**
         * Os dados de identificação chegam em mensagens separadas
         * (nome -> e-mail -> telefone). Portanto, nunca devemos apagar
         * um dado já coletado apenas porque a chamada atual não o trouxe.
         *
         * Exemplo:
         * - mensagem 1 traz nome
         * - mensagem 2 traz e-mail, mas nome vem null
         * - mensagem 3 traz telefone, mas e-mail vem null
         *
         * Sem este merge, o fluxo entra em loop pedindo novamente
         * campos que já haviam sido informados.
         */
        const currentIdentity =
            this.readIdentityMetadata(
                flow.metadata,
            );

        const normalizedEmail =
            this.normalizeEmail(
                input.email,
            );

        const normalizedTelefone =
            this.normalizePhone(
                input.telefone,
            );

        const normalizedNome =
            this.normalizeName(
                input.nome,
            );

        const email =
            normalizedEmail ||
            currentIdentity.email;

        const telefone =
            normalizedTelefone ||
            currentIdentity.telefone;

        const nome =
            normalizedNome ||
            currentIdentity.nome;

        /**
         * ============================================================
         * 4. BUSCA POR E-MAIL
         * ============================================================
         */
        if (email) {
            const userByEmail =
                await this.findUserByEmail(
                    email,
                );

            if (userByEmail) {
                await this.saveIdentityHint(
                    flow.id,
                    {
                        nome,
                        email,
                        telefone,
                    },
                );

                /**
                 * Existe conta, mas não existe autenticação.
                 *
                 * NÃO vinculamos customerUserId ainda.
                 *
                 * Isso evita assumir a identidade de alguém
                 * apenas porque o visitante conhece o e-mail.
                 */
                console.log(
                    "[COMMERCIAL CUSTOMER] Conta encontrada por e-mail; login necessário",
                    {
                        flowId:
                            flow.id,

                        customerUserId:
                            userByEmail.id,

                        email,
                    },
                );

                return {
                    status:
                        "LOGIN_REQUIRED",

                    customerUserId:
                        String(
                            userByEmail.id,
                        ),

                    source:
                        "EMAIL",

                    requiresLogin:
                        true,

                    requiresRegistration:
                        false,

                    user:
                        this.serializeUser(
                            userByEmail,
                        ),
                };
            }
        }

        /**
         * ============================================================
         * 5. BUSCA POR TELEFONE
         * ============================================================
         */
        if (telefone) {
            const userByPhone =
                await this.findUserByPhone(
                    telefone,
                );

            if (userByPhone) {
                await this.saveIdentityHint(
                    flow.id,
                    {
                        nome,
                        email,
                        telefone,
                    },
                );

                console.log(
                    "[COMMERCIAL CUSTOMER] Conta encontrada por telefone; login necessário",
                    {
                        flowId:
                            flow.id,

                        customerUserId:
                            userByPhone.id,

                        telefoneFinal:
                            telefone.slice(
                                -4,
                            ),
                    },
                );

                return {
                    status:
                        "LOGIN_REQUIRED",

                    customerUserId:
                        String(
                            userByPhone.id,
                        ),

                    source:
                        "PHONE",

                    requiresLogin:
                        true,

                    requiresRegistration:
                        false,

                    user:
                        this.serializeUser(
                            userByPhone,
                        ),
                };
            }
        }

        /**
         * ============================================================
         * 6. NENHUMA CONTA ENCONTRADA
         * ============================================================
         */
        await this.saveIdentityHint(
            flow.id,
            {
                nome,
                email,
                telefone,
            },
        );

        await this.flowState.setState(
            flow.id,
            CommercialFlowState
                .AGUARDANDO_CADASTRO_RAPIDO,
            {
                customerResolution:
                    "REGISTRATION_REQUIRED",
            },
        );

        console.log(
            "[COMMERCIAL CUSTOMER] Cadastro rápido necessário",
            {
                flowId:
                    flow.id,

                hasName:
                    Boolean(
                        nome,
                    ),

                hasEmail:
                    Boolean(
                        email,
                    ),

                hasPhone:
                    Boolean(
                        telefone,
                    ),
            },
        );

        return {
            status:
                "REGISTRATION_REQUIRED",

            customerUserId:
                null,

            source:
                "NONE",

            requiresLogin:
                false,

            requiresRegistration:
                true,

            suggestedData: {
                nome,
                email,
                telefone,
            },
        };
    }

    /**
     * ================================================================
     * CONFIRMAR USUÁRIO APÓS LOGIN
     * ================================================================
     *
     * Quando o frontend fizer login e retornar para o chat,
     * o ChatController/ChatService poderá chamar este método.
     */
    async attachAuthenticatedUser(
        flowId: string,
        authenticatedUserId: string,
    ) {
        const id =
            String(
                authenticatedUserId || "",
            ).trim();

        if (!id) {
            throw new Error(
                "COMMERCIAL_CUSTOMER_AUTH_USER_ID_OBRIGATORIO",
            );
        }

        const user =
            await this.findUserById(
                id,
            );

        if (!user) {
            throw new Error(
                "COMMERCIAL_CUSTOMER_USUARIO_NAO_ENCONTRADO",
            );
        }

        const flow =
            await this.flowState.setCustomer(
                flowId,
                String(
                    user.id,
                ),
            );

        console.log(
            "[COMMERCIAL CUSTOMER] Cliente vinculado após login",
            {
                flowId:
                    flow.id,

                customerUserId:
                    flow.customerUserId,
            },
        );

        return {
            flow,

            user:
                this.serializeUser(
                    user,
                ),
        };
    }

    /**
     * ================================================================
     * DADOS TEMPORÁRIOS DE IDENTIFICAÇÃO
     * ================================================================
     *
     * Isso permite coletarmos:
     *
     * nome
     * email
     * telefone
     *
     * em mensagens diferentes sem depender do histórico textual.
     */
    async saveIdentityHint(
        flowId: string,
        input: {
            nome?:
            | string
            | null;

            email?:
            | string
            | null;

            telefone?:
            | string
            | null;
        },
    ) {
        const flow =
            await this.flowState.findById(
                flowId,
            );

        if (!flow) {
            throw new Error(
                "COMMERCIAL_FLOW_NAO_ENCONTRADO",
            );
        }

        const currentIdentity =
            this.readIdentityMetadata(
                flow.metadata,
            );

        const nome =
            input.nome !==
                undefined
                ? this.normalizeName(
                    input.nome,
                )
                : currentIdentity.nome;

        const email =
            input.email !==
                undefined
                ? this.normalizeEmail(
                    input.email,
                )
                : currentIdentity.email;

        const telefone =
            input.telefone !==
                undefined
                ? this.normalizePhone(
                    input.telefone,
                )
                : currentIdentity.telefone;

        return this.flowState.update(
            flow.id,
            {
                metadata: {
                    customerIdentity: {
                        nome,
                        email,
                        telefone,
                    },

                    customerIdentityUpdatedAt:
                        new Date()
                            .toISOString(),
                },
            },
        );
    }

    /**
     * ================================================================
     * RECUPERAR IDENTIDADE PARCIAL
     * ================================================================
     */
    async getIdentityHint(
        flowId: string,
    ) {
        const flow =
            await this.flowState.findById(
                flowId,
            );

        if (!flow) {
            throw new Error(
                "COMMERCIAL_FLOW_NAO_ENCONTRADO",
            );
        }

        return this.readIdentityMetadata(
            flow.metadata,
        );
    }

    /**
     * ================================================================
     * BUSCAR USUÁRIO POR ID
     * ================================================================
     */
    private async findUserById(
        userId: string,
    ): Promise<Usuario | null> {
        const id =
            String(
                userId || "",
            ).trim();

        if (!id) {
            return null;
        }

        return this.userRepository
            .findOne({
                where: {
                    id,
                } as any,
            });
    }

    /**
     * ================================================================
     * BUSCAR POR EMAIL
     * ================================================================
     *
     * Uso query builder porque o projeto pode ter diferenças
     * de capitalização no e-mail salvo.
     */
    private async findUserByEmail(
        email: string,
    ): Promise<Usuario | null> {
        const normalized =
            this.normalizeEmail(
                email,
            );

        if (!normalized) {
            return null;
        }

        return this.userRepository
            .createQueryBuilder(
                "usuario",
            )
            .where(
                "LOWER(usuario.email) = LOWER(:email)",
                {
                    email:
                        normalized,
                },
            )
            .getOne();
    }

    /**
     * ================================================================
     * BUSCAR POR TELEFONE
     * ================================================================
     *
     * Como bancos antigos podem ter telefone com máscara,
     * primeiro tentamos busca direta por possíveis nomes de coluna.
     *
     * Depois poderemos consolidar isso quando confirmarmos
     * exatamente qual coluna é oficial no UserModels.
     */
    private async findUserByPhone(
        phone: string,
    ): Promise<Usuario | null> {
        const normalized =
            this.normalizePhone(
                phone,
            );

        if (!normalized) {
            return null;
        }

        const possibleColumns = [
            "telefone",
            "phone",
            "celular",
            "whatsapp",
        ];

        for (
            const column of
            possibleColumns
        ) {
            const hasColumn =
                this.userRepository
                    .metadata
                    .columns
                    .some(
                        (item) =>
                            item.propertyName ===
                            column ||
                            item.databaseName ===
                            column,
                    );

            if (!hasColumn) {
                continue;
            }

            const columnMetadata =
                this.userRepository
                    .metadata
                    .columns
                    .find(
                        (item) =>
                            item.propertyName ===
                            column ||
                            item.databaseName ===
                            column,
                    );

            if (!columnMetadata) {
                continue;
            }

            const propertyName =
                columnMetadata.propertyName;

            const users =
                await this.userRepository
                    .createQueryBuilder(
                        "usuario",
                    )
                    .where(
                        `usuario.${propertyName} IS NOT NULL`,
                    )
                    .getMany();

            const matched =
                users.find(
                    (user) => {
                        const value =
                            (user as any)[
                            propertyName
                            ];

                        return (
                            this.normalizePhone(
                                value,
                            ) ===
                            normalized
                        );
                    },
                );

            if (matched) {
                return matched;
            }
        }

        return null;
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
            id:
                String(
                    user.id,
                ),

            name:
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

    /**
     * ================================================================
     * METADATA
     * ================================================================
     */
    private readIdentityMetadata(
        metadata:
            | Record<
                string,
                unknown
            >
            | null
            | undefined,
    ): {
        nome: string | null;
        email: string | null;
        telefone: string | null;
    } {
        const raw =
            metadata &&
                typeof metadata ===
                "object"
                ? (
                    metadata as any
                ).customerIdentity
                : null;

        if (
            !raw ||
            typeof raw !==
            "object"
        ) {
            return {
                nome:
                    null,

                email:
                    null,

                telefone:
                    null,
            };
        }

        return {
            nome:
                this.normalizeName(
                    raw.nome,
                ),

            email:
                this.normalizeEmail(
                    raw.email,
                ),

            telefone:
                this.normalizePhone(
                    raw.telefone,
                ),
        };
    }

    /**
     * ================================================================
     * NORMALIZAÇÕES
     * ================================================================
     */
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

        const valid =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email,
            );

        return valid
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

        /**
         * Brasil:
         * se vier 55 + DDD + número,
         * guardamos somente DDD + número para comparação local.
         */
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
        const name =
            String(
                value || "",
            )
                .trim()
                .replace(
                    /\s+/g,
                    " ",
                );

        return name ||
            null;
    }

    /**
     * ================================================================
     * LER PRIMEIRA PROPRIEDADE EXISTENTE
     * ================================================================
     */
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
                const stringValue =
                    String(
                        value,
                    ).trim();

                if (stringValue) {
                    return stringValue;
                }
            }
        }

        return null;
    }
}

export default CommercialCustomerService;