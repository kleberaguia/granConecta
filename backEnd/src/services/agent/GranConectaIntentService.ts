/** Classificador conservador do DOT: apenas identifica intenção, não executa ações. */
export type DotIntent =
  | "SAUDACAO" | "PERGUNTA_GERAL" | "BUSCAR_SERVICO" | "BUSCAR_PRODUTO"
  | "CONSULTAR_MEU_NEGOCIO" | "CONFIGURAR_NEGOCIO" | "QUERO_SER_PARCEIRO"
  | "AGENDAR_SERVICO" | "CONSULTAR_PEDIDO" | "PAGAMENTO"
  | "CONTINUAR_CONVERSA" | "INDEFINIDA"
  | "CADASTRO_MORADOR" | "CADASTRO_VISITANTE";

export type DotIntentResult = {
  intent: DotIntent;
  confidence: number;
  reason: string;
  requiresContext: boolean;
};

export default class GranConectaIntentService {
  private normalize(value: string): string {
    return String(value || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
  }

  classify(message: string, lastAssistantMessage = ""): DotIntentResult {
    const text = this.normalize(message);
    const previous = this.normalize(lastAssistantMessage);
    const result = (intent: DotIntent, confidence: number, reason: string, requiresContext = false): DotIntentResult =>
      ({ intent, confidence, reason, requiresContext });
    if (!text) return result("INDEFINIDA", 0, "mensagem vazia");
    if (/^(sim|nao|ok|certo|pode|confirmo|isso|continuar|proximo|1|2|3)[.! ]*$/.test(text))
      return result("CONTINUAR_CONVERSA", previous ? 0.9 : 0.55, "resposta curta dependente do contexto", true);
    if (/\b(como (voce|vc|tu) se chama|qual (e )?seu nome|quem (e )?voce|o que (e )?o dot)\b/.test(text))
      return result("PERGUNTA_GERAL", 0.99, "identidade do assistente");
    if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|tudo bem)[!?. ]*$/.test(text))
      return result("SAUDACAO", 0.98, "cumprimento");

    // Cadastro de moradores e visitantes é diferente da adesão comercial.
    if (/\b(cadastr|registr|criar (uma )?conta|fazer (meu |o )?cadastro)\w*.*\b(como |de |enquanto )?(morador|moradora|residente)\b|\b(sou|moro|resido)\b.*\b(condominio|gran reserva|spazio)\b.*\b(cadastr|registr|conta)\w*/.test(text))
      return result("CADASTRO_MORADOR", 0.97, "cadastro de morador");
    if (/\b(cadastr|registr|criar (uma )?conta)\w*.*\b(visitante|cliente)\b/.test(text))
      return result("CADASTRO_VISITANTE", 0.95, "cadastro de visitante");

    const own = /\b(meu|minha|meus|minhas|proprio|propria)\b/.test(text);
    const business = /\b(loja|negocio|empresa|vitrine|landing|pagina|perfil|anuncio|cadastro comercial)\b/.test(text);
    const configure = /\b(mudar|alterar|trocar|atualizar|editar|configurar|cadastrar|renomear|definir|colocar)\b/.test(text);
    if (own && business && configure)
      return result("CONFIGURAR_NEGOCIO", 0.96, "configuração do próprio negócio; exige titularidade");
    if (own && business && /\b(consultar|verificar|ver|avaliar|diagnostico|pronta|pronto|falta|situacao|status|mostrar|como esta|publicada|publicado)\b/.test(text))
      return result("CONSULTAR_MEU_NEGOCIO", 0.94, "consulta ao próprio negócio");

    if (/\b(quero|gostaria|pretendo|posso|como faco|tenho interesse|sou|tenho)\b.*\b(anunciar|divulgar|vender|oferecer meus servicos|ser parceiro|ser parceira|me cadastrar|cadastrar minha|abrir minha loja|colocar minha loja|aderir|entrar na plataforma|trabalhar como prestador)\b/.test(text) ||
        /\b(como (me cadastro|anuncio|divulgo)|quanto custa (anunciar|divulgar|ser parceiro)|sou (manicure|eletricista|pedreiro|diarista|prestador|empreendedor|lojista) e quero)\b/.test(text) ||
        /\b(quero (ser|virar) (empreendedor|prestador|parceiro)|quero (abrir|cadastrar) (uma |minha )?loja)\b/.test(text))
      return result("QUERO_SER_PARCEIRO", 0.94, "interesse em anunciar ou aderir");

    if (/\b(meu pedido|minha compra|acompanhar pedido|status do pedido|onde esta meu pedido)\b/.test(text))
      return result("CONSULTAR_PEDIDO", 0.96, "pedido existente");
    if (/\b(pagar|pagamento|pix|cartao|checkout|boleto)\b/.test(text))
      return result("PAGAMENTO", 0.88, "pagamento");
    if (/\b(agendar|marcar horario|reservar horario|agendamento|marcar consulta)\b/.test(text))
      return result("AGENDAR_SERVICO", 0.88, "agenda");
    if (/\b(preciso de|procuro|busco|encontrar|contratar|quero um|quero uma)\b.*\b(eletricista|encanador|pedreiro|manicure|diarista|faxina|psicopedagog|pintor|prestador|profissional|servico)\b/.test(text))
      return result("BUSCAR_SERVICO", 0.92, "busca de serviço");
    if (/\b(onde (compro|encontro)|comprar|procuro|busco|quero)\b.*\b(bolo|doce|salgado|roupa|produto|presente|artesanato|vela|terco|joia|carne)\b/.test(text))
      return result("BUSCAR_PRODUTO", 0.9, "busca de produto");
    if (/\b(o que|como|por que|porque|qual|quais|quem|quando)\b/.test(text))
      return result("PERGUNTA_GERAL", 0.72, "pergunta geral");
    return result("INDEFINIDA", 0.3, "evidência insuficiente");
  }
}
