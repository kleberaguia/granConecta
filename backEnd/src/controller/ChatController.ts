import type { Request, Response } from "express";
import { GranConectaChatService } from "../services/chat/GranConectaChatService";
import type { ChatMessageInput } from "../services/chat/ChatTypes";
import { ChatPersistenceService } from "../services/chat/ChatPersistenceService";
import MarketingOpportunityService from "../services/MarketingOpportunityService";

export class ChatController {
  constructor(
    private readonly chatService = new GranConectaChatService(),
    private readonly persistence = new ChatPersistenceService(),
    private readonly opportunities = new MarketingOpportunityService(),
  ) { }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {

      const resolvedChatbotOwnerId =
        req.body?.chatbotOwnerId ||
        req.body?.storeId ||
        req.body?.lojaId ||
        req.body?.ownerId ||
        undefined;

      const authenticatedUser = (req as any).user;
      const authenticatedUserId: string | undefined =
        authenticatedUser?.usuarioId || authenticatedUser?.id || undefined;
      const conversationAccessToken = String(
        req.body?.conversationAccessToken || req.header("X-Conversation-Token") || "",
      ).trim();
      const requestedConversationId = String(req.body?.conversationId || "").trim();


      const origemNormalizada = String(
        req.body?.origem || "",
      )
        .trim()
        .toUpperCase();

      const channelNormalizado = String(
        req.body?.channel || "",
      )
        .trim()
        .toUpperCase();

      const isExternalChannel = [
        "WHATSAPP",
        "INSTAGRAM",
        "FACEBOOK",
        "MESSENGER",
      ].some((externalChannel) =>
        channelNormalizado === externalChannel ||
        origemNormalizada === externalChannel,
      );

      // A rota pública do widget não pode se passar por um webhook Meta.
      // Integrações externas devem utilizar suas rotas autenticadas/verificadas.
      if (isExternalChannel) {
        res.status(403).json({ success: false, message: "Canal externo não permitido nesta rota." });
        return;
      }

      if (requestedConversationId) {
        // Se houver login e credencial anônima, tenta vincular antes de prosseguir.
        // O método é atômico e não transfere conversas já pertencentes a outro usuário.
        if (authenticatedUserId && conversationAccessToken) {
          await this.persistence.claimAnonymousConversation(
            requestedConversationId,
            authenticatedUserId,
            conversationAccessToken,
          );
        }
        const authorized = await this.persistence.canAccessConversation(
          requestedConversationId,
          authenticatedUserId,
          conversationAccessToken,
        );
        if (!authorized) {
          res.status(403).json({ success: false, message: "Acesso à conversa não autorizado." });
          return;
        }
      }

      const authenticatedUserName = String(
        authenticatedUser?.name ||
        authenticatedUser?.nome ||
        "",
      ).trim();

      const bodyUserName = String(
        req.body?.userName || "",
      ).trim();

      const resolvedUserName =
        authenticatedUserName ||
        (isExternalChannel && bodyUserName
          ? bodyUserName
          : undefined);

      const input: ChatMessageInput = {
        message: String(req.body?.message || ""),
        conversationId: requestedConversationId || undefined,
        conversationAccessToken: conversationAccessToken || undefined,

        //userId: req.body?.userId || authenticatedUser?.id || undefined,
        userId:
          authenticatedUser?.usuarioId ||
          authenticatedUser?.id ||
          undefined,
        userName: resolvedUserName,

        latitude: req.body?.latitude,
        longitude: req.body?.longitude,

        cidade: req.body?.cidade,
        estado: req.body?.estado,
        bairro: req.body?.bairro,

        // Papel e condomínio de uma conta autenticada são atributos do JWT,
        // nunca valores declarados pelo navegador. Visitantes não recebem
        // papel autenticado nem vínculo residencial por simples declaração.
        userType:
          authenticatedUserId
            ? (authenticatedUser?.tipo || authenticatedUser?.role || undefined)
            : undefined,

        condominioId:
          authenticatedUserId
            ? (authenticatedUser?.condominio_id || undefined)
            : undefined,

        chatbotTipo: req.body?.chatbotTipo || req.body?.tipo || undefined,
        chatbotOwnerId: resolvedChatbotOwnerId,
        origem: req.body?.origem || undefined,
        storeName: req.body?.storeName || undefined,

        storeId: req.body?.storeId || resolvedChatbotOwnerId,
        lojaId: req.body?.lojaId || resolvedChatbotOwnerId,
        storeSlug: req.body?.storeSlug || req.body?.slug || undefined,

        /*
         * Contexto de oportunidade comercial.
         * Esses campos precisam atravessar o controller para que
         * GranConectaChatService consiga recuperar as respostas do
         * playbook e continuar o atendimento no negócio escolhido.
         */
        opportunityId:
          req.body?.opportunityId
            ? String(req.body.opportunityId).trim()
            : undefined,

        opportunityBootstrap:
          req.body?.opportunityBootstrap === true,

        /*
         * Mantemos também o contexto de campanha quando vier do frontend
         * ou de integrações futuras.
         */
        campanhaId:
          req.body?.campanhaId !== undefined &&
            req.body?.campanhaId !== null
            ? Number(req.body.campanhaId)
            : undefined,

        campanhaNome:
          req.body?.campanhaNome || undefined,

        tipoDestino:
          req.body?.tipoDestino || undefined,

        categoriaId:
          req.body?.categoriaId !== undefined &&
            req.body?.categoriaId !== null
            ? Number(req.body.categoriaId)
            : undefined,

        categoriaNome:
          req.body?.categoriaNome || undefined,

        campaignStage:
          req.body?.campaignStage || undefined,

        playbookStep:
          req.body?.playbookStep !== undefined &&
            req.body?.playbookStep !== null
            ? Number(req.body.playbookStep)
            : undefined,

        entradaDiretaCampanha:
          req.body?.entradaDiretaCampanha === true,
      };
      if (!input.message.trim()) {
        res.status(400).json({
          success: false,
          message: "A mensagem é obrigatória.",
        });
        return;
      }


      console.log(
        "[CHAT CONTROLLER] Contexto recebido",
        {
          userId: input.userId || null,
          userName: input.userName || null,
          userNameSource: authenticatedUserName
            ? "AUTHENTICATED_USER"
            : isExternalChannel && bodyUserName
              ? "EXTERNAL_CHANNEL"
              : "NAO_INFORMADO",
          chatbotTipo: input.chatbotTipo || null,
          chatbotOwnerId: input.chatbotOwnerId || null,
          storeSlug: input.storeSlug || null,
          campanhaId: input.campanhaId || null,
          categoriaId: input.categoriaId || null,
          opportunityId: input.opportunityId || null,
          opportunityBootstrap:
            input.opportunityBootstrap === true,
        },
      );

      // Criação confiável da conversa anônima: a credencial é emitida
      // ANTES do processamento, inclusive no primeiro bootstrap de oportunidade.
      // Nunca emitir token para uma conversa de destino preexistente.
      let newlyIssuedToken: string | null = null;
      if (!requestedConversationId && !authenticatedUserId) {
        if (input.opportunityId) {
          const opportunity = await this.opportunities.findById(input.opportunityId);
          if (!opportunity ||
              !input.chatbotOwnerId ||
              opportunity.selected_store_id !== input.chatbotOwnerId ||
              (input.storeSlug && opportunity.selected_store_slug &&
                opportunity.selected_store_slug !== input.storeSlug)) {
            res.status(403).json({ success: false, message: "Oportunidade inválida para este negócio." });
            return;
          }
          if (opportunity.destination_conversation_id) {
            // Conversa já vinculada: sem token não é seguro recuperá-la.
            res.status(403).json({
              success: false,
              message: "Esta oportunidade já possui atendimento. Para continuar, abra-a no navegador original com a credencial da conversa.",
            });
            return;
          }
        }

        const freshConversation = await this.persistence.resolveConversation({
          ...input,
          conversationId: undefined,
          forceNewConversation: true,
        });
        newlyIssuedToken = await this.persistence.issueAnonymousConversationToken(freshConversation.id);
        if (!newlyIssuedToken) {
          res.status(500).json({ success: false, message: "Não foi possível proteger a nova conversa." });
          return;
        }
        input.conversationId = freshConversation.id;
        input.conversationAccessToken = newlyIssuedToken;
      }

      const result = await this.chatService.sendMessage(input);
      if (newlyIssuedToken) {
        res.status(200).json({ ...result, conversationAccessToken: newlyIssuedToken });
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Erro no atendimento GranConecta:", error);

      res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Não foi possível responder sua mensagem.",
      });
    }
  }

  async getMessagesPublic(
    conversationId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "ID da conversa é obrigatório.",
        });
        return;
      }

      const authenticatedUser = (req as any).user;
      const authenticatedUserId = authenticatedUser?.usuarioId || authenticatedUser?.id;
      const conversationAccessToken = String(req.header("X-Conversation-Token") || "").trim();
      const authorized = await this.persistence.canAccessConversation(
        conversationId,
        authenticatedUserId,
        conversationAccessToken,
      );
      if (!authorized) {
        res.status(403).json({ success: false, message: "Acesso à conversa não autorizado." });
        return;
      }

      const messages =
        await this.chatService.getPublicMessages(conversationId);

      res.status(200).json({
        success: true,
        messages,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message:
          error?.message || "Erro ao carregar mensagens da conversa.",
      });
    }
  }

  async getUnreadCount(req: any, res: any) {
    const chatbotTipo = String(
      req.query.chatbotTipo || req.query.chatbot_tipo || "",
    ).toUpperCase();

    const chatbotOwnerId = String(
      req.query.chatbotOwnerId ||
      req.query.chatbot_owner_id ||
      req.query.storeId ||
      req.query.lojaId ||
      req.query.ownerId ||
      "",
    );

    const result = await this.chatService.getUnreadCount({
      chatbotTipo,
      chatbotOwnerId,
    });

    return res.json(result);
  }
}