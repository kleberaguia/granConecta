import { In, IsNull } from "typeorm";

import { AppDataSource } from "../config/data-source";

import { ChatConversation } from "../models/ChatConversation";
import { ChatLead } from "../models/ChatLead";
import { ChatMessage } from "../models/ChatMessage";

import type {
    ChatLeadSignal,
    ChatMessageInput,
} from "./chat/ChatTypes";

export class ChatPersistenceService {
    private get conversationRepository() {
        return AppDataSource.getRepository(
            ChatConversation,
        );
    }

    private get messageRepository() {
        return AppDataSource.getRepository(
            ChatMessage,
        );
    }

    private get leadRepository() {
        return AppDataSource.getRepository(
            ChatLead,
        );
    }

    /**
     * ============================================================
     * CONVERSA PADRÃO
     * ============================================================
     *
     * Usado pelo chat normal:
     *
     * CHAT_HOME
     * CHAT_LOJA
     * CHAT_PRESTADOR
     * LANDING_PAGE
     */
    async resolveConversation(
        input: ChatMessageInput,
    ): Promise<ChatConversation> {
        const chatbotTipo =
            input.chatbotTipo ||
            "GRANCONECTA";

        const chatbotOwnerId =
            input.chatbotOwnerId ||
            null;

        /**
         * Se já recebemos conversationId,
         * tentamos reutilizar.
         */
        if (input.conversationId) {
            const existing =
                await this.conversationRepository.findOne({
                    where: {
                        id: input.conversationId,
                    },
                });

            if (existing) {
                await this.updateConversationContext(
                    existing,
                    input,
                );

                return existing;
            }
        }

        /**
         * Para usuário conhecido,
         * reutilizamos conversa ABERTA.
         */
        if (input.userId) {
            const latestConversation =
                await this.conversationRepository.findOne({
                    where: {
                        userId:
                            input.userId,

                        status:
                            "ABERTA",

                        chatbotTipo,

                        chatbotOwnerId:
                            chatbotOwnerId ??
                            IsNull(),
                    },

                    order: {
                        updatedAt:
                            "DESC",
                    },
                });

            if (
                latestConversation
            ) {
                await this.updateConversationContext(
                    latestConversation,
                    input,
                );

                return latestConversation;
            }
        }

        /**
         * Cria nova conversa.
         */
        const conversation =
            this.conversationRepository.create({
                userId:
                    input.userId ||
                    null,

                userName:
                    input.userName ||
                    null,

                userType:
                    input.userType ||
                    null,

                condominioId:
                    input.condominioId ||
                    null,

                chatbotTipo,

                chatbotOwnerId,

                origem:
                    input.origem ||
                    "CHAT_HOME",

                status:
                    "ABERTA",
            });

        return this.conversationRepository.save(
            conversation,
        );
    }

    /**
     * ============================================================
     * CONVERSA EXTERNA
     * ============================================================
     *
     * Instagram / WhatsApp / futuros canais externos.
     *
     * Diferente do resolveConversation normal,
     * continua reutilizando a mesma conversa mesmo
     * durante atendimento humano.
     */
    async resolveExternalConversation(
        input: ChatMessageInput,
    ): Promise<ChatConversation> {
        const chatbotTipo =
            input.chatbotTipo ||
            "GRANCONECTA";

        const chatbotOwnerId =
            input.chatbotOwnerId ||
            null;

        if (input.conversationId) {
            const existing =
                await this.conversationRepository.findOne({
                    where: {
                        id: input.conversationId,
                    },
                });

            if (existing) {
                await this.updateConversationContext(
                    existing,
                    input,
                );

                return existing;
            }
        }

        if (input.userId) {
            const latestConversation =
                await this.conversationRepository.findOne({
                    where: {
                        userId:
                            input.userId,

                        status:
                            In([
                                "ABERTA",
                                "AGUARDANDO_ATENDENTE",
                                "EM_ATENDIMENTO_HUMANO",
                            ]),

                        chatbotTipo,

                        chatbotOwnerId:
                            chatbotOwnerId ??
                            IsNull(),
                    },

                    order: {
                        updatedAt:
                            "DESC",
                    },
                });

            if (
                latestConversation
            ) {
                await this.updateConversationContext(
                    latestConversation,
                    input,
                );

                console.log(
                    "[CHAT EXTERNAL] Conversa existente reutilizada",
                    {
                        conversationId:
                            latestConversation.id,

                        userId:
                            input.userId,

                        origem:
                            input.origem,

                        status:
                            latestConversation.status,
                    },
                );

                return latestConversation;
            }
        }

        const conversation =
            this.conversationRepository.create({
                userId:
                    input.userId ||
                    null,

                userName:
                    input.userName ||
                    null,

                userType:
                    input.userType ||
                    null,

                condominioId:
                    input.condominioId ||
                    null,

                chatbotTipo,

                chatbotOwnerId,

                origem:
                    input.origem ||
                    "INSTAGRAM",

                status:
                    "ABERTA",
            });

        const savedConversation =
            await this.conversationRepository.save(
                conversation,
            );

        console.log(
            "[CHAT EXTERNAL] Nova conversa criada",
            {
                conversationId:
                    savedConversation.id,

                userId:
                    input.userId,

                origem:
                    input.origem,
            },
        );

        return savedConversation;
    }

    /**
     * ============================================================
     * HISTÓRICO
     * ============================================================
     */
    async getHistory(
        conversationId: string,
        limit = 30,
    ): Promise<
        Array<{
            role:
                | "user"
                | "assistant";

            content: string;
        }>
    > {
        const messages =
            await this.messageRepository
                .createQueryBuilder(
                    "message",
                )
                .where(
                    "message.conversationId = :conversationId",
                    {
                        conversationId,
                    },
                )
                .orderBy(
                    "message.createdAt",
                    "DESC",
                )
                .addOrderBy(
                    "message.id",
                    "DESC",
                )
                .take(limit)
                .getMany();

        return messages
            .reverse()
            .map(
                (
                    message,
                ) => ({
                    role:
                        message.role,

                    content:
                        message.content,
                }),
            );
    }

    /**
     * ============================================================
     * IDEMPOTÊNCIA DE CANAIS EXTERNOS
     * ============================================================
     */
    async externalMessageExists(
        channel: string,
        externalMessageId: string,
    ): Promise<boolean> {
        const normalizedChannel =
            String(
                channel || "",
            ).trim();

        const normalizedExternalId =
            String(
                externalMessageId ||
                    "",
            ).trim();

        if (
            !normalizedChannel ||
            !normalizedExternalId
        ) {
            return false;
        }

        const count =
            await this.messageRepository.count({
                where: {
                    channel:
                        normalizedChannel,

                    externalMessageId:
                        normalizedExternalId,
                },
            });

        return count > 0;
    }

    /**
     * ============================================================
     * SALVAR MENSAGEM
     * ============================================================
     *
     * options é opcional para não quebrar
     * chamadas antigas.
     */
    async saveMessage(
        conversationId: string,
        role:
            | "user"
            | "assistant",
        content: string,
        options?: {
            externalMessageId?: string;
            channel?: string;
        },
    ): Promise<void> {
        const normalizedContent =
            String(
                content || "",
            ).trim();

        if (
            !normalizedContent
        ) {
            return;
        }

        const message =
            this.messageRepository.create({
                conversationId,

                role,

                content:
                    normalizedContent,

                externalMessageId:
                    options
                        ?.externalMessageId ||
                    null,

                channel:
                    options
                        ?.channel ||
                    null,
            });

        await this.messageRepository.save(
            message,
        );

        await this.conversationRepository.update(
            {
                id:
                    conversationId,
            },
            {
                updatedAt:
                    new Date(),
            },
        );
    }

    /**
     * ============================================================
     * LEAD
     * ============================================================
     */
    async upsertLead(
        conversationId: string,
        context: ChatMessageInput,
        signal: ChatLeadSignal,
    ): Promise<ChatLead | null> {
        if (
            !signal.shouldCapture
        ) {
            return null;
        }

        const existing =
            await this.leadRepository.findOne({
                where: {
                    conversationId,
                },
            });

        const lead =
            existing ||
            this.leadRepository.create({
                conversationId,

                userId:
                    context.userId ||
                    null,

                nome:
                    signal.nome ||
                    context.userName ||
                    null,

                telefone:
                    signal.telefone ||
                    null,

                email:
                    signal.email ||
                    null,

                condominioId:
                    context
                        .condominioId ||
                    null,

                interesse:
                    signal.interest ||
                    null,

                status:
                    signal.status ||
                    "NOVO",

                origem:
                    context.origem ||
                    "CHAT_HOME",
            });

        if (
            signal.interest
        ) {
            lead.interesse =
                signal.interest;
        }

        if (signal.nome) {
            lead.nome =
                signal.nome;
        }

        if (
            signal.telefone
        ) {
            lead.telefone =
                signal.telefone;
        }

        if (
            signal.email
        ) {
            lead.email =
                signal.email;
        }

        lead.status =
            this.highestStatus(
                lead.status,
                signal.status,
            );

        return this.leadRepository.save(
            lead,
        );
    }

    /**
     * ============================================================
     * ATUALIZA CONTEXTO
     * ============================================================
     */
    private async updateConversationContext(
        conversation: ChatConversation,
        input: ChatMessageInput,
    ): Promise<void> {
        let changed =
            false;

        if (
            input.userId &&
            conversation.userId !==
                input.userId
        ) {
            conversation.userId =
                input.userId;

            changed =
                true;
        }

        if (
            input.userName &&
            conversation.userName !==
                input.userName
        ) {
            conversation.userName =
                input.userName;

            changed =
                true;
        }

        if (
            input.userType &&
            conversation.userType !==
                input.userType
        ) {
            conversation.userType =
                input.userType;

            changed =
                true;
        }

        if (
            input.condominioId &&
            conversation.condominioId !==
                input.condominioId
        ) {
            conversation.condominioId =
                input.condominioId;

            changed =
                true;
        }

        if (
            input.chatbotTipo &&
            conversation.chatbotTipo !==
                input.chatbotTipo
        ) {
            conversation.chatbotTipo =
                input.chatbotTipo;

            changed =
                true;
        }

        if (
            input.chatbotOwnerId !==
                undefined &&
            conversation.chatbotOwnerId !==
                input.chatbotOwnerId
        ) {
            conversation.chatbotOwnerId =
                input.chatbotOwnerId;

            changed =
                true;
        }

        if (
            input.origem &&
            conversation.origem !==
                input.origem
        ) {
            conversation.origem =
                input.origem;

            changed =
                true;
        }

        if (changed) {
            await this.conversationRepository.save(
                conversation,
            );
        }
    }

    /**
     * ============================================================
     * STATUS - AGUARDANDO HUMANO
     * ============================================================
     */
    async markWaitingHuman(
        conversationId: string,
    ): Promise<void> {
        if (
            !conversationId
        ) {
            return;
        }

        await AppDataSource.query(
            `
                UPDATE chat_conversations

                SET
                    status = 'AGUARDANDO_ATENDENTE',
                    updatedAt = NOW()

                WHERE id = ?
            `,
            [
                conversationId,
            ],
        );
    }

    /**
     * ============================================================
     * STATUS DA CONVERSA
     * ============================================================
     */
    async getConversationStatus(
        conversationId: string,
    ): Promise<string> {
        if (
            !conversationId
        ) {
            return "";
        }

        const rows =
            await AppDataSource.query(
                `
                    SELECT
                        status

                    FROM chat_conversations

                    WHERE id = ?

                    LIMIT 1
                `,
                [
                    conversationId,
                ],
            );

        return (
            rows?.[0]
                ?.status ||
            ""
        );
    }

    /**
     * ============================================================
     * MENSAGENS PÚBLICAS
     * ============================================================
     */
    async getPublicMessages(
        conversationId: string,
    ) {
        if (
            !conversationId
        ) {
            return [];
        }

        return AppDataSource.query(
            `
                SELECT
                    id,
                    role,
                    content,
                    createdAt

                FROM chat_messages

                WHERE conversationId = ?

                ORDER BY
                    createdAt ASC,
                    id ASC
            `,
            [
                conversationId,
            ],
        );
    }

    /**
     * ============================================================
     * VOLTAR PARA IA
     * ============================================================
     */
    async markOpen(
        conversationId: string,
    ): Promise<void> {
        if (
            !conversationId
        ) {
            return;
        }

        await this.conversationRepository.update(
            {
                id:
                    conversationId,
            },
            {
                status:
                    "ABERTA",

                updatedAt:
                    new Date(),
            },
        );
    }

    /**
     * ============================================================
     * NÃO LIDAS / PENDENTES
     * ============================================================
     */
    async getUnreadCount(
        input: {
            chatbotTipo?: string;
            chatbotOwnerId?: string;
        },
    ) {
        const chatbotTipo =
            String(
                input.chatbotTipo ||
                    "",
            )
                .trim()
                .toUpperCase();

        const chatbotOwnerId =
            String(
                input.chatbotOwnerId ||
                    "",
            ).trim();

        if (
            !chatbotTipo ||
            !chatbotOwnerId
        ) {
            return {
                success:
                    true,

                total: 0,

                count: 0,
            };
        }

        const rows =
            await AppDataSource.query(
                `
                    SELECT
                        COUNT(*) AS total

                    FROM chat_conversations

                    WHERE chatbot_tipo = ?

                      AND chatbot_owner_id = ?

                      AND status IN (
                          'AGUARDANDO_ATENDENTE',
                          'EM_ATENDIMENTO_HUMANO'
                      )
                `,
                [
                    chatbotTipo,
                    chatbotOwnerId,
                ],
            );

        const total =
            Number(
                rows?.[0]
                    ?.total ||
                    0,
            );

        return {
            success:
                true,

            total,

            count:
                total,
        };
    }

    /**
     * ============================================================
     * PRIORIDADE DO LEAD
     * ============================================================
     */
    private highestStatus(
        current:
            ChatLead["status"],

        incoming:
            ChatLeadSignal["status"],
    ): ChatLead["status"] {
        const priorities: Record<
            ChatLead["status"],
            number
        > = {
            NOVO: 0,

            QUALIFICANDO:
                1,

            INTERESSADO:
                2,

            ENCAMINHADO:
                3,

            CONVERTIDO:
                4,

            PERDIDO:
                5,
        };

        const currentPriority =
            priorities[
                current
            ] ?? 0;

        const incomingPriority =
            priorities[
                incoming
            ] ?? 0;

        return incomingPriority >
            currentPriority
            ? incoming
            : current;
    }
}

export default ChatPersistenceService;