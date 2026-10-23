import { AppDataSource } from "../../config/data-source";
import { ChatConversation } from "../../models/ChatConversation";
import MetaInstagramMessagingService from "../meta/MetaInstagramMessagingService";
import MetaWhatsAppMessagingService from "../meta/MetaWhatsAppMessagingService";
import BusinessTeamService from "../BusinessTeamService";

type InboxScope =
  | "TODAS"
  | "AGUARDANDO"
  | "MINHAS";

type InboxCanal =
  | "TODOS"
  | "INSTAGRAM"
  | "WHATSAPP";

type InboxContexto =
  | "TODOS"
  | "LOJA"
  | "PRESTADOR";

type InboxFilters = {
  userId?: string;
  role?: string;
  chatbotTipo?: string;
  chatbotOwnerId?: string;

  atendenteId?: string;
  scope?: InboxScope;

  canal?: InboxCanal;
  contexto?: InboxContexto;
};

export class ChatHumanService {
  private repo =
    AppDataSource.getRepository(ChatConversation);

  /**
   * Resolve o Store real ao qual uma conversa pertence.
   *
   * Não confiamos apenas no chatbot_owner_id recebido pelo frontend, pois
   * historicamente ele pode representar Store.id, Usuario.id ou
   * PerfilPrestador.id. A resolução é sempre refeita no backend.
   */
  private async resolveStoreIdFromChatContext(
    chatbotTipo: string | null | undefined,
    chatbotOwnerId: string | null | undefined,
  ): Promise<string | null> {
    const tipo = String(chatbotTipo || "").trim().toUpperCase();
    const ownerId = String(chatbotOwnerId || "").trim();

    if (!ownerId || tipo === "GRANCONECTA") {
      return null;
    }

    // 1) Caso mais comum: chatbot_owner_id já é o Store.id.
    const byStoreId = await AppDataSource.query(
      `SELECT id FROM stores WHERE id = ? LIMIT 1`,
      [ownerId],
    );

    if (byStoreId?.[0]?.id) {
      return String(byStoreId[0].id);
    }

    // 2) Compatibilidade: chatbot_owner_id pode ser Usuario.id.
    const byUsuarioId = await AppDataSource.query(
      `SELECT id FROM stores WHERE usuarioId = ? LIMIT 1`,
      [ownerId],
    );

    if (byUsuarioId?.[0]?.id) {
      return String(byUsuarioId[0].id);
    }

    // 3) Compatibilidade histórica de PRESTADOR: owner pode ser
    // PerfilPrestador.id. Fazemos consultas separadas para evitar joins
    // sujeitos às collations diferentes existentes no banco legado.
    if (tipo === "PRESTADOR") {
      const profileRows = await AppDataSource.query(
        `SELECT usuarioId FROM perfil_prestador WHERE id = ? LIMIT 1`,
        [ownerId],
      );

      const profileUserId = String(
        profileRows?.[0]?.usuarioId || "",
      ).trim();

      if (profileUserId) {
        const storeRows = await AppDataSource.query(
          `SELECT id FROM stores WHERE usuarioId IN (?, ?) LIMIT 1`,
          [profileUserId, ownerId],
        );

        if (storeRows?.[0]?.id) {
          return String(storeRows[0].id);
        }
      }
    }

    return null;
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const rows = await AppDataSource.query(
      `SELECT tipo FROM usuarios WHERE id = ? LIMIT 1`,
      [userId],
    );

    return String(rows?.[0]?.tipo || "").trim().toUpperCase() === "ADMIN";
  }

  /**
   * Autoriza acesso de um usuário autenticado ao chat de um negócio.
   * OWNER e membros ativos são resolvidos pelo BusinessTeamService.
   */
  private async requireChatPermissionForContext(
    userId: string,
    chatbotTipo: string | null | undefined,
    chatbotOwnerId: string | null | undefined,
  ) {
    if (!userId) {
      const error: any = new Error("Usuário autenticado não identificado.");
      error.statusCode = 401;
      throw error;
    }

    const tipo = String(chatbotTipo || "").trim().toUpperCase();

    // Atendimento central é interno e não pertence a equipe de loja.
    if (tipo === "GRANCONECTA") {
      if (await this.isAdmin(userId)) {
        return;
      }

      const error: any = new Error(
        "Você não possui permissão para acessar este atendimento.",
      );
      error.statusCode = 403;
      throw error;
    }

    const storeId = await this.resolveStoreIdFromChatContext(
      chatbotTipo,
      chatbotOwnerId,
    );

    if (!storeId) {
      const error: any = new Error(
        "Não foi possível identificar o negócio desta conversa.",
      );
      error.statusCode = 403;
      throw error;
    }

    await BusinessTeamService.requirePermission(
      storeId,
      userId,
      "CHAT",
    );
  }

  private async requireConversationChatPermission(
    conversationId: string,
    userId: string,
  ) {
    const rows = await AppDataSource.query(
      `
        SELECT
          id,
          chatbot_tipo,
          chatbot_owner_id
        FROM chat_conversations
        WHERE id = ?
        LIMIT 1
      `,
      [conversationId],
    );

    const conversation = rows?.[0];

    if (!conversation) {
      throw new Error("Conversa não encontrada.");
    }

    await this.requireChatPermissionForContext(
      userId,
      conversation.chatbot_tipo,
      conversation.chatbot_owner_id,
    );
  }

  async inbox(
    filters: InboxFilters,
  ) {
    const authenticatedUserId = String(filters.atendenteId || "").trim();
    const requestedRole = String(filters.role || "").trim().toUpperCase();

    if (requestedRole !== "ADMIN") {
      if (!authenticatedUserId) {
        const error: any = new Error("Usuário autenticado não identificado.");
        error.statusCode = 401;
        throw error;
      }

      if (!filters.chatbotOwnerId) {
        const error: any = new Error(
          "Negócio do atendimento não identificado.",
        );
        error.statusCode = 403;
        throw error;
      }

      await this.requireChatPermissionForContext(
        authenticatedUserId,
        filters.chatbotTipo || filters.contexto,
        filters.chatbotOwnerId,
      );
    }

    const params: any[] = [];

    const conditions: string[] = [
      "c.status IN ('AGUARDANDO_ATENDENTE', 'EM_ATENDIMENTO_HUMANO')",
    ];

    if (filters.chatbotTipo) {
      conditions.push(
        "c.chatbot_tipo = ?",
      );

      params.push(
        filters.chatbotTipo,
      );
    }

    if (filters.chatbotOwnerId) {
      conditions.push(
        "c.chatbot_owner_id = ?",
      );

      params.push(
        filters.chatbotOwnerId,
      );
    }

    /**
     * Canal externo.
     */
    if (
      filters.canal === "INSTAGRAM"
    ) {
      conditions.push(
        "UPPER(COALESCE(c.origem, '')) = 'INSTAGRAM'",
      );
    }

    if (
      filters.canal === "WHATSAPP"
    ) {
      conditions.push(
        "UPPER(COALESCE(c.origem, '')) = 'WHATSAPP'",
      );
    }

    /**
     * Contexto do atendimento.
     *
     * Usamos chatbot_tipo como fonte principal e origem como
     * compatibilidade para conversas antigas.
     */
    if (
      filters.contexto === "LOJA"
    ) {
      conditions.push(
        "(UPPER(COALESCE(c.chatbot_tipo, '')) = 'LOJA' OR UPPER(COALESCE(c.origem, '')) = 'CHAT_LOJA')",
      );
    }

    if (
      filters.contexto === "PRESTADOR"
    ) {
      conditions.push(
        "(UPPER(COALESCE(c.chatbot_tipo, '')) = 'PRESTADOR' OR UPPER(COALESCE(c.origem, '')) = 'CHAT_PRESTADOR')",
      );
    }

    /**
     * Conversas que ainda não foram assumidas.
     */
    if (
      filters.scope === "AGUARDANDO"
    ) {
      conditions.push(
        "c.status = 'AGUARDANDO_ATENDENTE'",
      );

      conditions.push(
        "c.atendente_id IS NULL",
      );
    }

    /**
     * Somente conversas do atendente logado.
     */
    if (
      filters.scope === "MINHAS"
    ) {
      if (!filters.atendenteId) {
        return [];
      }

      conditions.push(
        "c.status = 'EM_ATENDIMENTO_HUMANO'",
      );

      conditions.push(
        "c.atendente_id = ?",
      );

      params.push(
        filters.atendenteId,
      );
    }

    const rows =
      await AppDataSource.query(
        `
          SELECT
            c.id,
            c.userId,
            c.userName,
            c.userType,
            c.condominioId,

            c.chatbot_tipo,
            c.chatbot_owner_id,

            c.origem,
            c.status,

            c.atendente_id,
            atendente.name AS atendente_nome,

            c.createdAt,
            c.updatedAt,

            (
              SELECT COUNT(*)
              FROM chat_messages m
              WHERE m.conversationId = c.id
                AND m.role = 'user'
                AND m.is_read = false
            ) AS naoLidas,

            (
              SELECT m.content
              FROM chat_messages m
              WHERE m.conversationId = c.id
              ORDER BY
                m.createdAt DESC,
                m.id DESC
              LIMIT 1
            ) AS ultimaMensagem,

            (
              SELECT m.createdAt
              FROM chat_messages m
              WHERE m.conversationId = c.id
              ORDER BY
                m.createdAt DESC,
                m.id DESC
              LIMIT 1
            ) AS ultimaMensagemEm

          FROM chat_conversations c

          LEFT JOIN usuarios atendente
            ON atendente.id = c.atendente_id

          WHERE ${conditions.join(
            " AND ",
          )}

          ORDER BY
            c.updatedAt DESC

          LIMIT 100
        `,
        params,
      );

    return rows;
  }

  async messages(
    conversationId: string,
    atendenteId: string,
  ) {
    if (!conversationId) {
      throw new Error(
        "ID da conversa é obrigatório.",
      );
    }

    if (!atendenteId) {
      throw new Error(
        "ID do atendente é obrigatório.",
      );
    }

    await this.requireConversationChatPermission(
      conversationId,
      atendenteId,
    );

    /*
     * Primeiro verificamos quem é o responsável pela conversa.
     *
     * Regra:
     * - conversa aguardando (sem atendente): quem abriu pode marcar como lida;
     * - conversa do próprio atendente: marca como lida;
     * - conversa de outro atendente: permite visualizar, mas NÃO altera is_read.
     */
    const conversationRows =
      await AppDataSource.query(
        `
          SELECT
            id,
            atendente_id
          FROM chat_conversations
          WHERE id = ?
          LIMIT 1
        `,
        [conversationId],
      );

    const conversation =
      conversationRows?.[0];

    if (!conversation) {
      throw new Error(
        "Conversa não encontrada.",
      );
    }

    const responsavelId =
      String(
        conversation.atendente_id || "",
      ).trim();

    const canMarkAsRead =
      !responsavelId ||
      responsavelId === atendenteId;

    if (canMarkAsRead) {
      await AppDataSource.query(
        `
          UPDATE chat_messages
          SET is_read = true
          WHERE conversationId = ?
            AND role = 'user'
            AND is_read = false
        `,
        [conversationId],
      );
    }

    return AppDataSource.query(
      `
        SELECT
          id,
          conversationId,
          role,
          content,
          is_read AS isRead,
          external_message_id AS externalMessageId,
          channel,
          createdAt
        FROM chat_messages
        WHERE conversationId = ?
        ORDER BY
          createdAt ASC,
          id ASC
      `,
      [conversationId],
    );
  }

  async take(
    conversationId: string,
    atendenteId: string,
  ) {
    if (!conversationId) {
      throw new Error(
        "ID da conversa é obrigatório.",
      );
    }

    if (!atendenteId) {
      throw new Error(
        "ID do atendente é obrigatório.",
      );
    }

    await this.requireConversationChatPermission(
      conversationId,
      atendenteId,
    );

    /**
     * Primeiro verificamos a conversa.
     */
    const rows =
      await AppDataSource.query(
        `
          SELECT
            id,
            status,
            atendente_id
          FROM chat_conversations
          WHERE id = ?
          LIMIT 1
        `,
        [conversationId],
      );

    const conversation =
      rows?.[0];

    if (!conversation) {
      throw new Error(
        "Conversa não encontrada.",
      );
    }

    /**
     * Outro atendente já assumiu.
     */
    if (
      conversation.atendente_id &&
      String(
        conversation.atendente_id,
      ) !== atendenteId
    ) {
      throw new Error(
        "Esta conversa já foi assumida por outro atendente.",
      );
    }

    if (
      conversation.status ===
      "FINALIZADA"
    ) {
      throw new Error(
        "Esta conversa já foi finalizada.",
      );
    }

    /**
     * UPDATE protegido para evitar concorrência
     * entre dois atendentes.
     */
    await AppDataSource.query(
      `
        UPDATE chat_conversations

        SET
          status =
            'EM_ATENDIMENTO_HUMANO',

          atendente_id = ?,

          atendimento_iniciado_em =
            COALESCE(
              atendimento_iniciado_em,
              NOW()
            ),

          updatedAt = NOW()

        WHERE id = ?

          AND (
            atendente_id IS NULL
            OR atendente_id = ?
          )

          AND status IN (
            'AGUARDANDO_ATENDENTE',
            'EM_ATENDIMENTO_HUMANO'
          )
      `,
      [
        atendenteId,
        conversationId,
        atendenteId,
      ],
    );

    /**
     * Conferimos quem ficou como responsável.
     */
    const confirmRows =
      await AppDataSource.query(
        `
          SELECT
            atendente_id,
            status
          FROM chat_conversations
          WHERE id = ?
          LIMIT 1
        `,
        [conversationId],
      );

    const confirmed =
      confirmRows?.[0];

    if (
      !confirmed ||
      String(
        confirmed.atendente_id || "",
      ) !== atendenteId
    ) {
      throw new Error(
        "Esta conversa já foi assumida por outro atendente.",
      );
    }

    return {
      success: true,
      atendenteId,
      status:
        "EM_ATENDIMENTO_HUMANO",
    };
  }

  async reply(
    conversationId: string,
    atendenteId: string,
    message: string,
  ) {
    if (!conversationId) {
      throw new Error(
        "ID da conversa é obrigatório.",
      );
    }

    if (!atendenteId) {
      throw new Error(
        "ID do atendente é obrigatório.",
      );
    }

    await this.requireConversationChatPermission(
      conversationId,
      atendenteId,
    );

    const normalizedMessage =
      String(
        message || "",
      ).trim();

    if (!normalizedMessage) {
      throw new Error(
        "Mensagem é obrigatória.",
      );
    }

    /**
     * Carrega a conversa antes de responder.
     */
    const conversations =
      await AppDataSource.query(
        `
          SELECT
            id,
            userId,
            userName,
            userType,
            origem,
            status,
            atendente_id,
            chatbot_tipo,
            chatbot_owner_id
          FROM chat_conversations
          WHERE id = ?
          LIMIT 1
        `,
        [conversationId],
      );

    const conversation =
      conversations?.[0];

    if (!conversation) {
      throw new Error(
        "Conversa não encontrada.",
      );
    }

    /**
     * Se já pertence a outra pessoa,
     * não deixamos responder.
     */
    if (
      conversation.atendente_id &&
      String(
        conversation.atendente_id,
      ) !== atendenteId
    ) {
      throw new Error(
        "Esta conversa pertence a outro atendente.",
      );
    }

    if (
      conversation.status ===
      "FINALIZADA"
    ) {
      throw new Error(
        "Esta conversa já foi finalizada.",
      );
    }

    /**
     * Assume a conversa caso ainda esteja aguardando.
     */
    await this.take(
      conversationId,
      atendenteId,
    );

    /**
     * Primeiro salvamos no histórico.
     */
    await AppDataSource.query(
      `
        INSERT INTO chat_messages
          (
            id,
            conversationId,
            role,
            content,
            createdAt
          )

        VALUES
          (
            UUID(),
            ?,
            'assistant',
            ?,
            NOW()
          )
      `,
      [
        conversationId,
        normalizedMessage,
      ],
    );

    await AppDataSource.query(
      `
        UPDATE chat_conversations

        SET
          updatedAt = NOW()

        WHERE id = ?
      `,
      [conversationId],
    );

    const origem =
      String(
        conversation.origem || "",
      )
        .trim()
        .toUpperCase();

    /**
     * ==========================================
     * INSTAGRAM
     * ==========================================
     */
    if (
      origem === "INSTAGRAM"
    ) {
      const externalUserId =
        String(
          conversation.userId || "",
        ).trim();

      if (
        !externalUserId
          .toLowerCase()
          .startsWith(
            "instagram:",
          )
      ) {
        console.error(
          "[CHAT HUMAN] Conversa Instagram com userId inválido",
          {
            conversationId,
            userId:
              externalUserId,
          },
        );

        throw new Error(
          "Usuário do Instagram não identificado nesta conversa.",
        );
      }

      const instagramUserId =
        externalUserId
          .replace(
            /^instagram:/i,
            "",
          )
          .trim();

      if (!instagramUserId) {
        throw new Error(
          "ID externo do usuário do Instagram não encontrado.",
        );
      }

      console.log(
        "[CHAT HUMAN] 📤 Enviando resposta humana para Instagram",
        {
          conversationId,
          instagramUserId,
          atendenteId,
        },
      );

      await MetaInstagramMessagingService
        .sendTextMessage(
          instagramUserId,
          normalizedMessage,
        );

      console.log(
        "[CHAT HUMAN] ✅ Resposta humana enviada ao Instagram",
        {
          conversationId,
          instagramUserId,
        },
      );
    }

    /**
     * ==========================================
     * WHATSAPP
     * ==========================================
     */
    if (
      origem === "WHATSAPP"
    ) {
      const externalUserId =
        String(
          conversation.userId || "",
        ).trim();

      const whatsappPhone =
        externalUserId
          .replace(
            /^whatsapp:/i,
            "",
          )
          .trim();

      if (!whatsappPhone) {
        console.error(
          "[CHAT HUMAN] Conversa WhatsApp sem telefone válido",
          {
            conversationId,
            userId:
              conversation.userId,
          },
        );

        throw new Error(
          "Telefone do WhatsApp não identificado nesta conversa.",
        );
      }

      console.log(
        "[CHAT HUMAN] 📤 Enviando resposta humana para WhatsApp",
        {
          conversationId,
          whatsappPhone,
          atendenteId,
        },
      );

      await MetaWhatsAppMessagingService
        .sendTextMessage({
          to: whatsappPhone,
          text: normalizedMessage,
        });

      console.log(
        "[CHAT HUMAN] ✅ Resposta humana enviada ao WhatsApp",
        {
          conversationId,
          whatsappPhone,
        },
      );
    }

    return {
      success: true,
      conversationId,
      atendenteId,
    };
  }

  async finish(
    conversationId: string,
    atendenteId: string,
  ) {
    if (!conversationId) {
      throw new Error(
        "ID da conversa é obrigatório.",
      );
    }

    if (!atendenteId) {
      throw new Error(
        "ID do atendente é obrigatório.",
      );
    }

    await this.requireConversationChatPermission(
      conversationId,
      atendenteId,
    );

    const rows =
      await AppDataSource.query(
        `
          SELECT
            id,
            atendente_id,
            status
          FROM chat_conversations
          WHERE id = ?
          LIMIT 1
        `,
        [conversationId],
      );

    const conversation =
      rows?.[0];

    if (!conversation) {
      throw new Error(
        "Conversa não encontrada.",
      );
    }

    if (
      conversation.atendente_id &&
      String(
        conversation.atendente_id,
      ) !== atendenteId
    ) {
      throw new Error(
        "Esta conversa pertence a outro atendente.",
      );
    }

    if (
      conversation.status ===
      "FINALIZADA"
    ) {
      return {
        success: true,
        alreadyFinished: true,
      };
    }

    await AppDataSource.query(
      `
        UPDATE chat_conversations

        SET
          status = 'FINALIZADA',
          atendimento_finalizado_em =
            NOW(),
          updatedAt = NOW()

        WHERE id = ?

          AND (
            atendente_id IS NULL
            OR atendente_id = ?
          )
      `,
      [
        conversationId,
        atendenteId,
      ],
    );

    return {
      success: true,
      conversationId,
    };
  }

  async getUnreadCount(
    userId: string,
  ) {
    if (!userId) {
      return 0;
    }

    const count =
      await this.repo
        .createQueryBuilder(
          "conversation",
        )
        .leftJoin(
          "conversation.messages",
          "message",
        )
        .where(
          "conversation.chatbotOwnerId = :userId",
          {
            userId,
          },
        )
        .andWhere(
          "message.isRead = :isRead",
          {
            isRead: false,
          },
        )
        .getCount();

    return count;
  }
}

export default new ChatHumanService();