/** Reconhece intenções de moradores sem executar operações no banco. */
export type ResidentIntent =
  | 'CADASTRO_MORADOR' | 'CONSULTAR_CONDOMINIO' | 'QUERO_EMPREENDER'
  | 'BUSCAR_PRODUTO' | 'BUSCAR_SERVICO' | 'SOLICITAR_AVISO_DISPONIBILIDADE'
  | 'MURAL' | 'CLASSIFICADOS' | 'VAGA_GARAGEM' | 'DOACAO'
  | 'PERGUNTA_GERAL' | 'INDEFINIDA';

export interface ResidentContext {
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  lastInterest?: string;
  condominiumName?: string;
}

export interface ResidentIntentResult {
  intent: ResidentIntent;
  confidence: number;
  reason: string;
  requiresContext: boolean;
  interest?: string;
  condominiumMention?: string;
}

export default class GranConectaResidentIntentService {
  private normalize(value: string): string {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  public classify(message: string, context: ResidentContext = {}): ResidentIntentResult {
    const text = this.normalize(message);
    const lastInterest = context.lastInterest?.trim();
    const condoMatch = message.match(/\b(?:sou morador(?:a)? d[oa]|moro n[oa]|meu condom[ií]nio (?:é|e)|condom[ií]nio)\s+([^,.!?;]+)/i);
    const condominiumMention = condoMatch?.[1]?.trim();
    const result = (intent: ResidentIntent, confidence: number, reason: string,
      requiresContext = false, interest = lastInterest): ResidentIntentResult => ({
      intent, confidence, reason, requiresContext,
      ...(interest ? { interest } : {}),
      ...(condominiumMention ? { condominiumMention } : {})
    });
    if (!text) return result('INDEFINIDA', 0, 'mensagem vazia');

    if ((/\b(avisar|avise|avisa|notificar|notifique|alertar|alerta)\b/.test(text) &&
         /\b(quando|chegar|chegarem|tiver|disponivel|disponibilidade|aparecer|houver|estoque|encontrar)\b/.test(text)) ||
        /\b(quero (receber )?(um )?aviso)\b/.test(text))
      return result('SOLICITAR_AVISO_DISPONIBILIDADE', 0.97,
        'solicitação de aviso; não implica alerta efetivamente cadastrado', !lastInterest);

    if ((/\b(cadastro|cadastrar|registrar|inscrever)\b/.test(text) &&
         /\b(morador|condominio|residente)\b/.test(text)) || /\bcadastro (de )?morador\b/.test(text))
      return result('CADASTRO_MORADOR', 0.96, 'cadastro de morador');

    if (/\b(quero|gostaria|pretendo|como|posso)\b.*\b(empreender|empreendedor|anunciar|divulgar|vender|prestador|loja|negocio)\b/.test(text) ||
        /\bquero ser (empreendedor|prestador|parceiro)\b/.test(text))
      return result('QUERO_EMPREENDER', 0.94, 'interesse em empreender');

    if (/\bcondominio\b.*\b(cadastrado|existe|participa|atendido|atende)\b/.test(text))
      return result('CONSULTAR_CONDOMINIO', 0.94, 'consulta de condomínio');
    if (/\b(vaga|garagem|estacionamento)\b/.test(text))
      return result('VAGA_GARAGEM', 0.88, 'vaga de garagem');
    if (/\b(doar|doacao|doacoes|desapego|desapegar)\b/.test(text))
      return result('DOACAO', 0.87, 'doação ou desapego');
    if (/\b(classificados|classificado|anuncio de venda|vender usado)\b/.test(text))
      return result('CLASSIFICADOS', 0.88, 'classificados');
    if (/\b(mural|publicar aviso|postar no condominio)\b/.test(text))
      return result('MURAL', 0.89, 'mural');

    if (/\b(imagem|imagens|vela|velas|terco|tercos|artesanato|produto|produtos|roupa|roupas|doce|doces|presente|presentes|joia|joias)\b/.test(text) &&
        /\b(quero|procuro|busco|preciso|gostaria|comprar|encontrar|tem|vende|vendem)\b/.test(text))
      return result('BUSCAR_PRODUTO', 0.91, 'busca de produto', false, message.trim());

    if (/\b(eletricista|encanador|pedreiro|diarista|manicure|pintor|profissional|prestador|servico|faxina)\b/.test(text) &&
        /\b(quero|procuro|busco|preciso|gostaria|contratar|encontrar|tem)\b/.test(text))
      return result('BUSCAR_SERVICO', 0.91, 'busca de serviço', false, message.trim());

    if (condominiumMention)
      return result('CONSULTAR_CONDOMINIO', 0.82, 'condomínio mencionado; validar no banco');
    if (/^(sim|nao|ok|certo|isso|pode|quero|continuar)[.! ]*$/.test(text))
      return result('INDEFINIDA', 0.55, 'resposta curta depende da conversa', true);
    if (/\b(como|o que|qual|quais|quem|quando|porque|por que)\b/.test(text))
      return result('PERGUNTA_GERAL', 0.7, 'pergunta geral');
    return result('INDEFINIDA', 0.3, 'intenção não identificada com segurança');
  }

  public analyze(message: string, context: ResidentContext = {}): ResidentIntentResult {
    return this.classify(message, context);
  }
}
