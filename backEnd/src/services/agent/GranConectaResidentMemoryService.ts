import type { ResidentContext } from "./GranConectaResidentIntentService";

type HistoryEntry = { role: string; content: string };

/**
 * Memória contextual do DOT principal: somente leitura, mesma conversa.
 * Não consulta conversas de lojas e não executa ações comerciais.
 * O chamador deve validar a posse da conversa antes de recuperar o histórico.
 */
export default class GranConectaResidentMemoryService {
  build(history: HistoryEntry[]): ResidentContext {
    const entries = (Array.isArray(history) ? history : [])
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-80);
    const userMessages = entries.filter((item) => item.role === "user");
    const assistantMessages = entries.filter((item) => item.role === "assistant");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content || "";

    // O interesse vem de uma declaração do cliente, nunca de afirmações do bot.
    const interestMessages = userMessages.filter((entry) => {
      const text = this.normalize(entry.content);
      return /\b(quero|procuro|busco|preciso|gostaria|comprar|encontrar)\b/.test(text) &&
        /\b(vela|velas|terco|tercos|imagem|imagens|artesanato|doce|doces|eletricista|encanador|pedreiro|manicure|servico|produto)\b/.test(text);
    });
    const lastInterest = interestMessages[interestMessages.length - 1]?.content.trim().slice(0, 160);
    const condominiumMessage = [...userMessages].reverse().find((entry) =>
      /\b(moro no|moro na|meu condominio|sou morador do|sou moradora do)\b/.test(this.normalize(entry.content)),
    );
    const condominiumName = condominiumMessage?.content.match(
      /\b(?:moro n[oa]|meu condom[ií]nio (?:é|e)|sou morador(?:a)? d[oa])\s+([^,.!?;]+)/i,
    )?.[1]?.trim().slice(0, 120);
    return { lastUserMessage, lastAssistantMessage, lastInterest, condominiumName };
  }

  private normalize(value: string): string {
    return String(value || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
}
