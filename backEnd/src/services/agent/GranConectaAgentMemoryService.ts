import { AppDataSource } from "../../config/data-source";
import { ChatPersistenceService } from "../chat/ChatPersistenceService";

export type GranConectaAgentMemoryInput = {
  conversationId: string;
  storeId: string;
  customerUserId?: string | null;
  currentMessage?: string | null;
  historyLimit?: number;
};

export type GranConectaAgentMemoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GranConectaAgentMemory = {
  conversationId: string;
  storeId: string;
  generatedAt: string;
  totalMessagesLoaded: number;
  recentConversation: GranConectaAgentMemoryMessage[];
  relevantHistory: GranConectaAgentMemoryMessage[];
  /** Histórico auxiliar: nunca substitui catálogo, pagamento ou agenda oficiais. */
  memoryContext: string;
};

type ConversationScopeRow = {
  id: string;
  userId: string | null;
  chatbot_owner_id: string | null;
  selected_store_id: string | null;
  chatbot_tipo: string | null;
};

/**
 * Memória comercial V2, exclusivamente de leitura.
 * A loja deve vir de contexto confiável. A posse de conversa anônima deve ser
 * validada na camada de sessão ANTES de chamar este serviço.
 */
export class GranConectaAgentMemoryService {
  constructor(
    private readonly persistence = new ChatPersistenceService(),
  ) {}

  async build(input: GranConectaAgentMemoryInput): Promise<GranConectaAgentMemory> {
    const conversationId = String(input.conversationId || "").trim();
    const storeId = String(input.storeId || "").trim();
    const customerUserId = String(input.customerUserId || "").trim();

    if (!conversationId || !storeId) {
      throw new Error("GRANCONECTA_AGENT_MEMORY_SCOPE_REQUIRED");
    }

    const rows: ConversationScopeRow[] = await AppDataSource.query(
      `SELECT id, userId, chatbot_owner_id, selected_store_id, chatbot_tipo
       FROM chat_conversations WHERE id = ? LIMIT 1`,
      [conversationId],
    );
    const conversation = rows[0];
    if (!conversation) {
      throw new Error("GRANCONECTA_AGENT_MEMORY_CONVERSATION_NOT_FOUND");
    }

    const ownerId = String(conversation.chatbot_owner_id || "").trim();
    const selectedStoreId = String(conversation.selected_store_id || "").trim();
    const chatbotType = String(conversation.chatbot_tipo || "").toUpperCase();
    if (
      !["LOJA", "PRESTADOR"].includes(chatbotType) ||
      (!ownerId && !selectedStoreId) ||
      (ownerId && ownerId !== storeId) ||
      (selectedStoreId && selectedStoreId !== storeId)
    ) {
      throw new Error("GRANCONECTA_AGENT_MEMORY_STORE_DIVERGENT");
    }

    // Se o cliente está autenticado, a conversa também deve estar vinculada
    // a ele. Não promove automaticamente uma conversa anônima a autenticada.
    if (
      customerUserId &&
      String(conversation.userId || "").trim() !== customerUserId
    ) {
      throw new Error("GRANCONECTA_AGENT_MEMORY_CUSTOMER_DIVERGENT");
    }

    const historyLimit = Math.min(
      200,
      Math.max(10, Math.floor(Number(input.historyLimit) || 100)),
    );
    const history = await this.persistence.getHistory(conversationId, historyLimit);
    const safeHistory: GranConectaAgentMemoryMessage[] = history
      .filter((entry) => entry.role === "user" || entry.role === "assistant")
      .map((entry) => ({
        role: entry.role,
        content: this.redactSensitive(String(entry.content || "")).slice(0, 1500),
      }))
      .filter((entry) => Boolean(entry.content.trim()));

    const recentConversation = safeHistory.slice(-10);
    const earlier = safeHistory.slice(0, -10);
    const terms = this.keywords(String(input.currentMessage || ""));

    // Busca tanto semântica simples por termos quanto pistas comerciais.
    // Mensagens do cliente têm prioridade: uma afirmação do bot não prova
    // contratação, pagamento, horário disponível ou preço atual.
    const ranked = earlier
      .map((entry, index) => ({
        entry,
        index,
        score: this.score(entry, terms),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.index - a.index)
      .slice(0, 8)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.entry);

    const memoryContext = ranked.length
      ? [
          "Trechos anteriores da MESMA conversa (histórico, não confirmação oficial):",
          ...ranked.map((entry) => `- ${entry.role}: ${entry.content}`),
          "Priorize declarações do cliente para preferências e necessidades.",
          "Mensagens do assistente podem estar desatualizadas ou incorretas.",
          "Nunca confirme preço, disponibilidade, pagamento, contratação ou agendamento a partir desta memória: consulte os registros oficiais.",
        ].join("\n")
      : "Nenhum trecho anterior relevante foi localizado nesta conversa.";

    return {
      conversationId,
      storeId,
      generatedAt: new Date().toISOString(),
      totalMessagesLoaded: safeHistory.length,
      recentConversation,
      relevantHistory: ranked,
      memoryContext,
    };
  }

  private keywords(value: string): string[] {
    const stop = new Set([
      "para", "como", "quero", "voce", "sobre", "isso", "aqui", "agora",
      "pode", "mais", "qual", "quando", "onde", "esta", "esse", "essa",
      "tenho", "gostaria", "seria", "com", "uma", "uns", "das", "dos",
      "lembra", "lembrar", "conversa", "falamos", "antes", "mesmo",
    ]);
    return [...new Set(this.normalize(value).split(" ")
      .filter((word) => word.length >= 4 && !stop.has(word)))].slice(0, 12);
  }

  private score(entry: GranConectaAgentMemoryMessage, terms: string[]): number {
    const text = ` ${this.normalize(entry.content)} `;
    const matches = terms.reduce(
      (total, term) => total + (text.includes(` ${term} `) ? 3 : 0),
      0,
    );
    const cues = [
      /\b(avaliacao|psicopedagog|terapia|consulta|sessao|servico|pacote|produto|interesse|preciso|necessito)\b/,
      /\b(segunda|terca|quarta|quinta|sexta|sabado|domingo|amanha|horario|horas|[0-2]?\d\s?h)\b/,
      /\b(prefiro|preferencia|gostaria|busco|procuro|poderia|duvida|dificuldade)\b/,
      /\b(contratei|contratar|agendei|agendamento|paguei|pagamento|confirmado|cancelar)\b/,
    ];
    const commercialCues = cues.reduce(
      (total, pattern) => total + (pattern.test(text) ? 1 : 0),
      0,
    );
    // Evita selecionar cumprimentos e mensagens vazias de contexto.
    if (matches === 0 && commercialCues === 0) return 0;
    return matches + commercialCues + (entry.role === "user" ? 2 : 0);
  }

  private normalize(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  private redactSensitive(value: string): string {
    return value
      .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[email oculto]")
      .replace(/\b(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g, "[telefone oculto]")
      .replace(/\b\d{3}\.\d{3}\.\d{3}-?\d{2}\b/g, "[documento oculto]")
      .replace(/\b(?:senha|password|token)\s*[:=]\s*\S+/gi, "[credencial oculta]");
  }
}

export default new GranConectaAgentMemoryService();
