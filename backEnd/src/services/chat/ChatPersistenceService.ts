import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { In, IsNull } from "typeorm";

import { AppDataSource } from "../../config/data-source";

import { ChatConversation } from "../../models/ChatConversation";
import { ChatLead } from "../../models/ChatLead";
import { ChatMessage } from "../../models/ChatMessage";

import { ChatLeadService } from "./ChatLeadService";

import type {
  ChatLeadSignal,
  ChatMessageInput,
} from "./ChatTypes";

export class ChatPersistenceService {
  constructor(
    private readonly leadService =
      new ChatLeadService(),
  ) {}

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

  /**
   * Segurança de conversas: métodos preparados para integração com
   * ChatController/routerChat/ChatWidget. Não são aplicados automaticamente
   * às rotas antigas nesta etapa.
   */
  private hashConversationToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }

  private tokenMatches(token: string, storedHash: string | null): boolean {
    if (!token || !storedHash || !/^[a-f0-9]{64}$/i.test(storedHash)) {
      return false;
    }
    const expected = Buffer.from(storedHash, "hex");
    const actual = Buffer.from(this.hashConversationToken(token), "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  /**
   * Emite credencial apenas para conversa anônima ainda sem hash.
   * Deve ser chamada exclusivamente no fluxo confiável de criação,
   * nunca em endpoint público que receba apenas um conversationId.
   * Retorna null para conversas já provisionadas ou com proprietário.
   */
  async issueAnonymousConversationToken(
    conversationId: string,
  ): Promise<string | null> {
    if (!conversationId) return null;
    const token = randomBytes(32).toString("base64url");
    const hash = this.hashConversationToken(token);
    const result = await AppDataSource.createQueryBuilder()
      .update(ChatConversation)
      .set({ accessTokenHash: hash })
      .where("id = :conversationId", { conversationId })
      .andWhere("userId IS NULL")
      .andWhere("access_token_hash IS NULL")
      .execute();
    return result.affected === 1 ? token : null;
  }

  /**
   * Autorização para leitura/continuação de conversa via API pública.
   * authenticatedUserId deve vir SOMENTE do JWT validado no servidor.
   * Conversas antigas sem hash não são acessíveis por ID isolado.
   */
  async canAccessConversation(
    conversationId: string,
    authenticatedUserId?: string | null,
    conversationAccessToken?: string | null,
  ): Promise<boolean> {
    if (!conversationId) return false;
    const conversation = await this.conversationRepository
      .createQueryBuilder("conversation")
      .addSelect("conversation.accessTokenHash")
      .where("conversation.id = :conversationId", { conversationId })
      .getOne();
    if (!conversation) return false;
    if (conversation.userId) {
      return Boolean(authenticatedUserId && conversation.userId === authenticatedUserId);
    }
    return this.tokenMatches(
      String(conversationAccessToken || ""),
      conversation.accessTokenHash,
    );
  }

  /**
   * Vincula conversa anônima ao usuário autenticado, exigindo sua
   * credencial. Operação atômica: nunca transfere conversa já vinculada.
   */
  async claimAnonymousConversation(
    conversationId: string,
    authenticatedUserId: string,
    conversationAccessToken: string,
  ): Promise<boolean> {
    if (!authenticatedUserId || !conversationAccessToken) return false;
    const authorized = await this.canAccessConversation(
      conversationId,
      null,
      conversationAccessToken,
    );
    if (!authorized) return false;
    const hash = this.hashConversationToken(conversationAccessToken);
    const result = await AppDataSource.createQueryBuilder()
      .update(ChatConversation)
      .set({ userId: authenticatedUserId, accessTokenHash: null })
      .where("id = :conversationId", { conversationId })
      .andWhere("userId IS NULL")
      .andWhere("access_token_hash = :hash", { hash })
      .execute();
    return result.affected === 1;
  }

  /**
   * ============================================================
   * CONVERSA PADRÃO
   * ============================================================
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

    if (input.conversationId) {
      const existing =
        await AppDataSource.query(
          `
            SELECT *
            FROM chat_conversations
            WHERE id = ?
            LIMIT 1
          `,
          [
            input.conversationId,
          ],
        );

      if (existing?.[0]) {
        return existing[0];
      }
    }

    if (
      input.userId &&
      !input.forceNewConversation
    ) {
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

        campanhaId:
          input.campanhaId || null,

        categoriaId:
          input.categoriaId || null,

        selectedStoreId:
          input.selectedStoreId || null,

        selectedStoreName:
          input.selectedStoreName || null,

        selectedStoreSlug:
          input.selectedStoreSlug || null,

        negocioSelecionadoEm:
          input.negocioSelecionadoEm
            ? new Date(
                input.negocioSelecionadoEm,
              )
            : null,

        campaignStage:
          input.campaignStage || null,

        playbookStep:
          Number(input.playbookStep || 0),

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
   * Instagram / WhatsApp / futuros canais.
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
            id:
              input.conversationId,
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

    if (
      input.userId &&
      input.campanhaId
    ) {
      const campaignConversation =
        await this.conversationRepository
          .createQueryBuilder("conversation")
          .where(
            "conversation.userId = :userId",
            {
              userId: input.userId,
            },
          )
          .andWhere(
            "conversation.campanhaId = :campanhaId",
            {
              campanhaId:
                input.campanhaId,
            },
          )
          .andWhere(
            "conversation.status IN (:...statuses)",
            {
              statuses: [
                "ABERTA",
                "IA_ATIVA",
                "AGUARDANDO_ATENDENTE",
                "EM_ATENDIMENTO_HUMANO",
              ],
            },
          )
          .orderBy(
            "conversation.updatedAt",
            "DESC",
          )
          .getOne();

      if (campaignConversation) {
        await this.updateConversationContext(
          campaignConversation,
          input,
        );

        console.log(
          "[CHAT EXTERNAL] Conversa da campanha reutilizada",
          {
            conversationId:
              campaignConversation.id,
            campanhaId:
              input.campanhaId,
            selectedStoreId:
              campaignConversation.selectedStoreId ||
              null,
            chatbotTipo:
              campaignConversation.chatbotTipo,
            chatbotOwnerId:
              campaignConversation.chatbotOwnerId,
          },
        );

        return campaignConversation;
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

        campanhaId:
          input.campanhaId || null,

        categoriaId:
          input.categoriaId || null,

        selectedStoreId:
          input.selectedStoreId || null,

        selectedStoreName:
          input.selectedStoreName || null,

        selectedStoreSlug:
          input.selectedStoreSlug || null,

        negocioSelecionadoEm:
          input.negocioSelecionadoEm
            ? new Date(
                input.negocioSelecionadoEm,
              )
            : null,

        campaignStage:
          input.campaignStage || null,

        playbookStep:
          Number(input.playbookStep || 0),

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

    const history =
      messages
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

    console.log(
      "HISTÓRICO RECUPERADO PELO CHAT:",
      {
        conversationId,

        quantidade:
          history.length,

        ultimaMensagem:
          history[
            history.length -
              1
          ]?.content ||
          null,
      },
    );

    return history;
  }

  /**
   * ============================================================
   * IDEMPOTÊNCIA DE MENSAGEM EXTERNA
   * ============================================================
   *
   * Verifica se uma mensagem externa já foi persistida.
   *
   * Exemplo Instagram:
   *
   * channel = INSTAGRAM
   * externalMessageId = message.mid
   */
  async externalMessageExists(
    channel: string,
    externalMessageId: string,
  ): Promise<boolean> {
    const normalizedChannel =
      String(
        channel || "",
      ).trim();

    const normalizedExternalMessageId =
      String(
        externalMessageId ||
          "",
      ).trim();

    if (
      !normalizedChannel ||
      !normalizedExternalMessageId
    ) {
      return false;
    }

    const count =
      await this.messageRepository.count({
        where: {
          channel:
            normalizedChannel,

          externalMessageId:
            normalizedExternalMessageId,
        },
      });

    return count > 0;
  }

  /**
   * ============================================================
   * SALVAR MENSAGEM
   * ============================================================
   *
   * options é opcional para manter compatibilidade
   * com todas as chamadas antigas.
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

    const normalizedExternalMessageId =
      String(
        options
          ?.externalMessageId ||
          "",
      ).trim();

    const normalizedChannel =
      String(
        options?.channel ||
          "",
      ).trim();

    const message =
      this.messageRepository.create({
        conversationId,

        role,

        content:
          normalizedContent,

        externalMessageId:
          normalizedExternalMessageId ||
          null,

        channel:
          normalizedChannel ||
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
    return this.leadService.registerLead({
      conversationId,
      context,
      signal,
    });
  }

  /**
   * ============================================================
   * ATUALIZA CONTEXTO DA CONVERSA
   * ============================================================
   */
  private async updateConversationContext(
    conversation:
      ChatConversation,

    input:
      ChatMessageInput,
  ): Promise<void> {
    let changed =
      false;

    // A propriedade da conversa nunca pode ser alterada por atualizacao
    // de contexto. A vinculacao de visitante ao usuario autenticado deve
    // ocorrer exclusivamente em claimAnonymousConversation(), com token
    // valido e atualizacao atomica no banco.

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

    const possuiNegocioSelecionado =
      Boolean(
        conversation.selectedStoreId,
      );

    const entradaGenericaDaCampanha =
      input.tipoDestino ===
        "CATEGORIA" &&
      Boolean(input.campanhaId) &&
      input.chatbotTipo ===
        "GRANCONECTA" &&
      !input.chatbotOwnerId;

    if (
      input.chatbotTipo &&
      !(
        possuiNegocioSelecionado &&
        entradaGenericaDaCampanha
      ) &&
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
      !(
        possuiNegocioSelecionado &&
        entradaGenericaDaCampanha
      ) &&
      conversation.chatbotOwnerId !==
        input.chatbotOwnerId
    ) {
      conversation.chatbotOwnerId =
        input.chatbotOwnerId;

      changed =
        true;
    }

    if (
      input.campanhaId &&
      conversation.campanhaId !==
        input.campanhaId
    ) {
      conversation.campanhaId =
        input.campanhaId;

      changed =
        true;
    }

    if (
      input.categoriaId &&
      conversation.categoriaId !==
        input.categoriaId
    ) {
      conversation.categoriaId =
        input.categoriaId;

      changed =
        true;
    }

    if (
      input.campaignStage !==
        undefined &&
      conversation.campaignStage !==
        input.campaignStage
    ) {
      conversation.campaignStage =
        input.campaignStage || null;

      changed =
        true;
    }

    if (
      input.playbookStep !==
        undefined &&
      conversation.playbookStep !==
        input.playbookStep
    ) {
      conversation.playbookStep =
        Number(input.playbookStep || 0);

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

  async updateCampaignProgress(
    conversationId: string,
    input: {
      campaignStage:
        | "QUALIFICANDO"
        | "APRESENTANDO_OPCOES"
        | "NEGOCIO_SELECIONADO";
      playbookStep: number;
      campanhaId?: number | null;
      categoriaId?: number | null;
    },
  ): Promise<void> {
    if (!conversationId) {
      return;
    }

    await this.conversationRepository.update(
      {
        id: conversationId,
      },
      {
        campaignStage:
          input.campaignStage,

        playbookStep:
          Math.max(
            0,
            Number(
              input.playbookStep || 0,
            ),
          ),

        campanhaId:
          input.campanhaId || null,

        categoriaId:
          input.categoriaId || null,

        status:
          "IA_ATIVA",

        updatedAt:
          new Date(),
      },
    );

    console.log(
      "[CHAT CAMPANHA] Progresso atualizado",
      {
        conversationId,
        campanhaId:
          input.campanhaId || null,
        categoriaId:
          input.categoriaId || null,
        campaignStage:
          input.campaignStage,
        playbookStep:
          input.playbookStep,
      },
    );
  }

  async selectCampaignBusiness(
    conversationId: string,
    business: {
      storeId: string;
      storeName: string;
      storeSlug?: string | null;
      chatbotTipo: "LOJA" | "PRESTADOR";
      campanhaId?: number | null;
      categoriaId?: number | null;
    },
  ): Promise<void> {
    if (
      !conversationId ||
      !business.storeId
    ) {
      return;
    }

    await this.conversationRepository.update(
      {
        id: conversationId,
      },
      {
        chatbotTipo:
          business.chatbotTipo,

        chatbotOwnerId:
          business.storeId,

        campanhaId:
          business.campanhaId || null,

        categoriaId:
          business.categoriaId || null,

        selectedStoreId:
          business.storeId,

        selectedStoreName:
          business.storeName,

        selectedStoreSlug:
          business.storeSlug || null,

        negocioSelecionadoEm:
          new Date(),

        campaignStage:
          "NEGOCIO_SELECIONADO",

        status:
          "IA_ATIVA",

        atendenteId:
          null,

        atendimentoIniciadoEm:
          null,

        atendimentoFinalizadoEm:
          null,

        updatedAt:
          new Date(),
      },
    );

    console.log(
      "[CHAT CAMPANHA] Negócio selecionado e persistido",
      {
        conversationId,
        storeId:
          business.storeId,
        storeName:
          business.storeName,
        chatbotTipo:
          business.chatbotTipo,
        campanhaId:
          business.campanhaId || null,
        categoriaId:
          business.categoriaId || null,
      },
    );
  }

  /**
   * ============================================================
   * AGUARDANDO HUMANO
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
   * STATUS
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
      rows?.[0]?.status ||
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
   * REABRIR PARA IA
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
   * CONTADOR DE ATENDIMENTOS
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
        rows?.[0]?.total ||
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
}