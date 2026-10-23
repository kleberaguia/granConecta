import { Request, Response } from "express";

import { GranConectaChatService } from "../services/chat/GranConectaChatService";
import { ChatPersistenceService } from "../services/chat/ChatPersistenceService";

import MetaInstagramMessagingService from "../services/meta/MetaInstagramMessagingService";

class MetaInstagramWebhookController {
    /**
     * Motor principal do chat GranConecta.
     */
    private static readonly chatService =
        new GranConectaChatService();

    /**
     * Persistência usada também para controlar
     * idempotência das mensagens externas.
     */
    private static readonly persistence =
        new ChatPersistenceService();

    /**
     * Canal usado na persistência das mensagens
     * recebidas pelo Instagram.
     */
    private static readonly CHANNEL_INSTAGRAM =
        "INSTAGRAM";

    /**
     * ============================================================
     * GET /webhooks/meta/instagram
     * ============================================================
     *
     * A Meta chama esta rota quando cadastramos o webhook
     * no painel Meta for Developers.
     */
    public static verificar(
        request: Request,
        response: Response,
    ): Response {
        try {
            const mode =
                request.query["hub.mode"];

            const token =
                request.query[
                    "hub.verify_token"
                ];

            const challenge =
                request.query[
                    "hub.challenge"
                ];

            const verifyToken =
                process.env
                    .META_INSTAGRAM_VERIFY_TOKEN;

            if (!verifyToken) {
                console.error(
                    "[INSTAGRAM WEBHOOK] META_INSTAGRAM_VERIFY_TOKEN não configurado.",
                );

                return response
                    .status(500)
                    .json({
                        error:
                            "META_INSTAGRAM_VERIFY_TOKEN não configurado.",
                    });
            }

            console.log(
                "[INSTAGRAM WEBHOOK] Solicitação de verificação recebida",
                {
                    mode,

                    hasToken:
                        Boolean(token),

                    hasChallenge:
                        Boolean(
                            challenge,
                        ),
                },
            );

            if (
                mode === "subscribe" &&
                token ===
                    verifyToken &&
                challenge
            ) {
                console.log(
                    "[INSTAGRAM WEBHOOK] ✅ Webhook verificado com sucesso.",
                );

                /*
                 * A Meta exige que o challenge
                 * seja devolvido exatamente.
                 */
                return response
                    .status(200)
                    .send(
                        String(
                            challenge,
                        ),
                    );
            }

            console.warn(
                "[INSTAGRAM WEBHOOK] ❌ Falha na verificação do webhook.",
                {
                    mode,

                    tokenCorreto:
                        token ===
                        verifyToken,
                },
            );

            return response
                .sendStatus(403);
        } catch (error) {
            console.error(
                "[INSTAGRAM WEBHOOK] Erro ao verificar webhook:",
                error,
            );

            return response
                .sendStatus(500);
        }
    }

    /**
     * ============================================================
     * POST /webhooks/meta/instagram
     * ============================================================
     *
     * Recebe eventos enviados pela Meta.
     *
     * Sempre respondemos rapidamente para evitar
     * reentregas desnecessárias.
     */
    public static async receber(
        request: Request,
        response: Response,
    ): Promise<Response> {
        try {
            const body =
                request.body;

            console.log(
                "[INSTAGRAM WEBHOOK] 📩 Evento recebido:",
                JSON.stringify(
                    body,
                    null,
                    2,
                ),
            );

            if (!body) {
                console.warn(
                    "[INSTAGRAM WEBHOOK] Payload vazio recebido.",
                );

                return response
                    .sendStatus(200);
            }

            if (
                body.object !==
                "instagram"
            ) {
                console.warn(
                    "[INSTAGRAM WEBHOOK] Evento ignorado. object diferente de instagram:",
                    body.object,
                );

                /*
                 * Respondemos 200 porque o evento
                 * simplesmente não pertence ao
                 * Instagram.
                 */
                return response
                    .sendStatus(200);
            }

            const entries =
                Array.isArray(
                    body.entry,
                )
                    ? body.entry
                    : [];

            for (
                const entry of
                entries
            ) {
                await MetaInstagramWebhookController
                    .processarEntry(
                        entry,
                    );
            }

            return response
                .sendStatus(200);
        } catch (error) {
            console.error(
                "[INSTAGRAM WEBHOOK] Erro ao processar evento:",
                error,
            );

            /*
             * Durante esta fase mantemos 200
             * para impedir reentregas infinitas.
             */
            return response
                .sendStatus(200);
        }
    }

    /**
     * ============================================================
     * ENTRY
     * ============================================================
     */
    private static async processarEntry(
        entry: any,
    ): Promise<void> {
        try {
            console.log(
                "[INSTAGRAM WEBHOOK] Processando entry:",
                JSON.stringify(
                    entry,
                    null,
                    2,
                ),
            );

            /**
             * Mensagens / Direct.
             */
            const messaging =
                Array.isArray(
                    entry?.messaging,
                )
                    ? entry.messaging
                    : [];

            for (
                const event of
                messaging
            ) {
                await MetaInstagramWebhookController
                    .processarMensagem(
                        event,
                    );
            }

            /**
             * Comentários, menções etc.
             */
            const changes =
                Array.isArray(
                    entry?.changes,
                )
                    ? entry.changes
                    : [];

            for (
                const change of
                changes
            ) {
                await MetaInstagramWebhookController
                    .processarChange(
                        change,
                    );
            }
        } catch (error) {
            console.error(
                "[INSTAGRAM WEBHOOK] Erro ao processar entry:",
                error,
            );
        }
    }

    /**
     * ============================================================
     * MENSAGEM
     * ============================================================
     */
    private static async processarMensagem(
        event: any,
    ): Promise<void> {
        try {
            const senderId =
                String(
                    event?.sender?.id ||
                        "",
                ).trim();

            const recipientId =
                String(
                    event?.recipient
                        ?.id || "",
                ).trim();

            const timestamp =
                event?.timestamp ||
                null;

            console.log(
                "[INSTAGRAM WEBHOOK] 💬 Evento de mensagem",
                {
                    senderId,
                    recipientId,
                    timestamp,
                },
            );

            /**
             * ====================================================
             * ECHO
             * ====================================================
             *
             * Quando o GranConecta envia uma mensagem,
             * a Meta pode devolver a própria mensagem
             * pelo webhook.
             *
             * message.is_echo === true
             *
             * NÃO podemos mandar isso novamente para
             * a IA.
             */
            if (
                event?.message
                    ?.is_echo ===
                true
            ) {
                console.log(
                    "[INSTAGRAM WEBHOOK] 🔁 Echo ignorado",
                    {
                        senderId,
                        recipientId,

                        messageId:
                            event
                                ?.message
                                ?.mid ||
                            null,
                    },
                );

                return;
            }

            /**
             * ====================================================
             * EVENTOS QUE NÃO SÃO MESSAGE
             * ====================================================
             */
            if (!event?.message) {
                if (
                    event?.postback
                ) {
                    console.log(
                        "[INSTAGRAM WEBHOOK] 🔘 Postback recebido",
                        {
                            senderId,

                            postback:
                                event.postback,
                        },
                    );

                    return;
                }

                if (
                    event?.read
                ) {
                    console.log(
                        "[INSTAGRAM WEBHOOK] 👁️ Evento de leitura",
                        {
                            senderId,

                            read:
                                event.read,
                        },
                    );

                    return;
                }

                console.log(
                    "[INSTAGRAM WEBHOOK] Evento messaging não tratado:",
                    event,
                );

                return;
            }

            /**
             * ====================================================
             * MESSAGE DATA
             * ====================================================
             */
            const messageId =
                String(
                    event.message
                        ?.mid || "",
                ).trim();

            const text =
                String(
                    event.message
                        ?.text || "",
                ).trim();

            /**
             * Por enquanto tratamos somente
             * texto.
             */
            if (
                !senderId ||
                !text
            ) {
                console.log(
                    "[INSTAGRAM WEBHOOK] Mensagem ignorada sem senderId ou texto.",
                    {
                        senderId,
                        recipientId,
                        messageId,
                    },
                );

                return;
            }

            /**
             * ====================================================
             * IDEMPOTÊNCIA
             * ====================================================
             *
             * A Meta pode entregar o mesmo webhook
             * mais de uma vez.
             *
             * O message.mid é o identificador externo
             * da mensagem.
             *
             * Se já temos:
             *
             * channel = INSTAGRAM
             * external_message_id = messageId
             *
             * então NÃO processamos novamente.
             */
            if (messageId) {
                const alreadyProcessed =
                    await MetaInstagramWebhookController
                        .persistence
                        .externalMessageExists(
                            MetaInstagramWebhookController
                                .CHANNEL_INSTAGRAM,

                            messageId,
                        );

                if (
                    alreadyProcessed
                ) {
                    console.log(
                        "[INSTAGRAM WEBHOOK] ♻️ Mensagem duplicada ignorada",
                        {
                            messageId,
                            senderId,
                        },
                    );

                    return;
                }
            }

            console.log(
                "[INSTAGRAM WEBHOOK] 💬 Mensagem recebida",
                {
                    senderId,
                    recipientId,
                    messageId,
                    text,
                },
            );

            /**
             * ====================================================
             * IDENTIDADE EXTERNA
             * ====================================================
             *
             * Não usamos apenas:
             *
             * 1943271273021383
             *
             * Usamos:
             *
             * instagram:1943271273021383
             *
             * Isso evita colisão futura com
             * WhatsApp, Messenger etc.
             */
            const externalUserId =
                `instagram:${senderId}`;

            /**
             * ====================================================
             * GRANCONNECTA CHAT
             * ====================================================
             */
            const result =
                await MetaInstagramWebhookController
                    .chatService
                    .sendMessage({
                        message:
                            text,

                        userId:
                            externalUserId,

                        userName:
                            `Instagram ${senderId}`,

                        userType:
                            "INSTAGRAM",

                        chatbotTipo:
                            "GRANCONECTA",

                        chatbotOwnerId:
                            null,

                        origem:
                            "INSTAGRAM",

                        /**
                         * NOVO:
                         *
                         * Essas informações serão
                         * gravadas em chat_messages.
                         */
                        externalMessageId:
                            messageId ||
                            undefined,

                        channel:
                            MetaInstagramWebhookController
                                .CHANNEL_INSTAGRAM,
                    });

            console.log(
                "[INSTAGRAM WEBHOOK] 🤖 Resposta do GranConecta gerada",
                {
                    conversationId:
                        result
                            .conversationId,

                    action:
                        result.action
                            ?.type,

                    responseLength:
                        result.message
                            ?.length ||
                        0,

                    externalMessageId:
                        messageId ||
                        null,
                },
            );

            /**
             * ====================================================
             * ENVIA RESPOSTA PARA O INSTAGRAM
             * ====================================================
             */
            if (
                result.message &&
                result.message.trim()
            ) {
                await MetaInstagramMessagingService
                    .sendTextMessage(
                        senderId,

                        result.message.trim(),
                    );
            }

            console.log(
                "[INSTAGRAM WEBHOOK] ✅ Fluxo concluído",
                {
                    senderId,

                    conversationId:
                        result
                            .conversationId,

                    messageId:
                        messageId ||
                        null,
                },
            );
        } catch (error: any) {
            /**
             * Se eventualmente a restrição UNIQUE
             * do banco pegar duas execuções simultâneas,
             * tratamos também como duplicidade.
             */
            const errorCode =
                String(
                    error?.code ||
                        "",
                ).toUpperCase();

            const errorMessage =
                String(
                    error?.message ||
                        "",
                ).toLowerCase();

            const duplicate =
                errorCode ===
                    "ER_DUP_ENTRY" ||
                errorMessage.includes(
                    "duplicate entry",
                ) ||
                errorMessage.includes(
                    "uq_chat_messages_channel_external",
                );

            if (duplicate) {
                console.log(
                    "[INSTAGRAM WEBHOOK] ♻️ Duplicidade detectada pelo banco. Evento ignorado.",
                );

                return;
            }

            console.error(
                "[INSTAGRAM WEBHOOK] Erro ao processar mensagem:",
                error,
            );
        }
    }

    /**
     * ============================================================
     * CHANGES
     * ============================================================
     */
    private static async processarChange(
        change: any,
    ): Promise<void> {
        try {
            const field =
                change?.field;

            const value =
                change?.value;

            console.log(
                "[INSTAGRAM WEBHOOK] 🔔 Change recebido",
                {
                    field,
                    value,
                },
            );

            switch (field) {
                case "comments":
                    console.log(
                        "[INSTAGRAM WEBHOOK] 💬 Evento de comentário",
                        value,
                    );

                    break;

                case "mentions":
                    console.log(
                        "[INSTAGRAM WEBHOOK] 📣 Evento de menção",
                        value,
                    );

                    break;

                default:
                    console.log(
                        `[INSTAGRAM WEBHOOK] Change ainda não tratado: ${field}`,
                    );

                    break;
            }
        } catch (error) {
            console.error(
                "[INSTAGRAM WEBHOOK] Erro ao processar change:",
                error,
            );
        }
    }

    /**
     * ============================================================
     * GET /meta/instagram/callback
     * ============================================================
     *
     * Callback utilizado pelo OAuth/Login do Instagram.
     */
    public static async callback(
        request: Request,
        response: Response,
    ): Promise<Response> {
        try {
            const code =
                request.query.code;

            const error =
                request.query.error;

            const errorReason =
                request.query
                    .error_reason;

            const errorDescription =
                request.query
                    .error_description;

            console.log(
                "[INSTAGRAM OAUTH] Callback recebido",
                {
                    hasCode:
                        Boolean(code),

                    error,
                    errorReason,
                    errorDescription,
                },
            );

            /**
             * Usuário recusou autorização
             * ou a Meta devolveu erro.
             */
            if (error) {
                console.warn(
                    "[INSTAGRAM OAUTH] Autorização recusada/erro",
                    {
                        error,
                        errorReason,
                        errorDescription,
                    },
                );

                return response
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Não foi possível autorizar a conta do Instagram.",

                        error,
                        errorReason,
                        errorDescription,
                    });
            }

            /**
             * Um OAuth válido precisa retornar code.
             */
            if (!code) {
                console.warn(
                    "[INSTAGRAM OAUTH] Callback recebido sem código de autorização.",
                );

                return response
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Código de autorização não recebido.",
                    });
            }

            console.log(
                "[INSTAGRAM OAUTH] ✅ Código de autorização recebido com sucesso.",
            );

            /**
             * Neste momento apenas confirmamos
             * o recebimento do código.
             *
             * Não registramos code/token completo
             * nos logs.
             */
            return response
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Instagram autorizado. Código de autorização recebido pelo GranConecta.",
                });
        } catch (error) {
            console.error(
                "[INSTAGRAM OAUTH] Erro no callback:",
                error,
            );

            return response
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Erro interno ao processar autorização do Instagram.",
                });
        }
    }
}

export default MetaInstagramWebhookController;