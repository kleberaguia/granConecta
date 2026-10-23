import { AppDataSource } from "../../config/data-source";
import { ChatLead } from "../../models/ChatLead";
import type {
  ChatLeadSignal,
  ChatOrigem,
  ChatUserContext,
  ChatbotContext,
} from "./ChatTypes";

type RegisterLeadInput = {
  conversationId: string;
  context: ChatUserContext & ChatbotContext;
  signal: ChatLeadSignal;
};

export class ChatLeadService {
  private get leadRepository() {
    return AppDataSource.getRepository(ChatLead);
  }

  async registerLead({
    conversationId,
    context,
    signal,
  }: RegisterLeadInput): Promise<ChatLead | null> {
    if (!signal.shouldCapture) {
      return null;
    }

    const existing = await this.leadRepository.findOne({
      where: { conversationId },
    });

    const lead =
      existing ||
      this.leadRepository.create({
        conversationId,
        userId: context.userId || null,
        nome: context.userName || signal.nome || null,
        telefone: signal.telefone || null,
        email: signal.email || null,
        condominioId: context.condominioId || null,
        interesse: null,
        status: "NOVO",
        origem: this.resolveOrigem(context),
        chatbotTipo: context.chatbotTipo || "GRANCONECTA",
        chatbotOwnerId: context.chatbotOwnerId || null,
      });

    if (context.userId) lead.userId = context.userId;
    if (context.condominioId) lead.condominioId = context.condominioId;

    lead.nome = signal.nome || lead.nome || context.userName || null;
    lead.telefone = signal.telefone || lead.telefone || null;
    lead.email = signal.email || lead.email || null;
    lead.interesse = signal.interest || lead.interesse;

    lead.origem = lead.origem || this.resolveOrigem(context);
    lead.chatbotTipo = context.chatbotTipo || lead.chatbotTipo || "GRANCONECTA";
    lead.chatbotOwnerId =
      context.chatbotOwnerId !== undefined
        ? context.chatbotOwnerId
        : lead.chatbotOwnerId;

    lead.status = this.highestStatus(lead.status, signal.status);

    return this.leadRepository.save(lead);
  }

  private resolveOrigem(context: ChatbotContext): ChatOrigem {
    if (context.origem) return context.origem;
    if (context.chatbotTipo === "LOJA") return "CHAT_LOJA";
    if (context.chatbotTipo === "PRESTADOR") return "CHAT_PRESTADOR";
    return "CHAT_HOME";
  }

  private highestStatus(
    current: ChatLead["status"],
    incoming: ChatLeadSignal["status"],
  ): ChatLead["status"] {
    const priorities: Record<ChatLead["status"], number> = {
      NOVO: 0,
      QUALIFICANDO: 1,
      INTERESSADO: 2,
      ENCAMINHADO: 3,
      PERDIDO: 4,
      CONVERTIDO: 5,
    };

    return priorities[incoming] > priorities[current]
      ? incoming
      : current;
  }
}