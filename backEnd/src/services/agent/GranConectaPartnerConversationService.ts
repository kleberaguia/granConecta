/** Orientação consultiva do DOT principal. Nunca executa cadastro, pagamento ou alteração. */
export type PartnerHistoryEntry = { role: string; content: string };
export type PartnerIntent = { intent: string };

export default class GranConectaPartnerConversationService {
  private readonly cadastroUrl = "https://www.granconecta.net.br/cadastro";

  private normalize(value: string): string {
    return String(value || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
  }


  /**
   * Cadastro assistido de MORADOR, separado do fluxo comercial.
   * Nunca transforma "sou somente morador" em parceiro.
   */
  public residentRegistrationStep(
    message: string,
    history: PartnerHistoryEntry[],
  ): { message: string; action?: { type: "OPEN_PARTNER_REGISTRATION"; payload: {
    nome: string; email: string; telefone: string; cep?: string; tipo: "MORADOR";
    empreendedor: string; moraEmCondominio: string; ramo: "loja";
  } } } | null {
    const text = this.normalize(message);
    const marker = "[cadastro assistido morador]";
    const recent = history.slice(-30);
    // Só permanece ativo enquanto a última resposta do DOT pertence ao cadastro.
    // Uma ação de abertura já concluída encerra a sessão anterior.
    const lastAssistant = [...recent].reverse().find(x => x.role === "assistant");
    const active = Boolean(lastAssistant?.content.includes(marker)) &&
      !/vou abrir (?:seu|a pagina de) cadastro/i.test(lastAssistant?.content || "");
    const userTexts = recent.filter(x => x.role === "user").map(x => this.normalize(x.content));
    const residentContext = userTexts.some(x => /\b(sou (?:somente |apenas |so )?morador|sou moradora|moro no|sou residente|nao sou empreendedor|nao sou prestador)\b/.test(x));
    const signupContext = userTexts.some(x => /\b(cadastr\w*|registro|criar conta|passar meus dados)\b/.test(x));
    const explicit = /\b(cadastr\w*|registro|criar conta)\b.*\b(morador|moradora|residente)\b|\b(morador|moradora|residente)\b.*\b(cadastr\w*|registro|criar conta)\b/.test(text);
    const followup = /\b(como me cadastrar|quero me cadastrar|posso passar (?:os )?meus dados|vou passar (?:os )?meus dados|podemos abrir (?:o )?formulario|abrir (?:o )?formulario|pode abrir|confirmo)\b/.test(text);
    const commercial = /\b(quero anunciar|quero vender|minha loja|meu negocio|sou prestador|sou empreendedor)\b/.test(text);
    const cancel = /\b(cancelar cadastro|desistir do cadastro|mudar de assunto)\b/.test(text);
    // Mudança explícita de assunto tem prioridade sobre o formulário em andamento.
    const topicChange = /\b(e se eu quiser|como faco para|quero ser|quero anunciar|quero vender|sou empreendedor|sou prestador|quero procurar|preciso de|estou procurando|quero comprar|me explique|como funciona)\b/.test(text) &&
      /\b(empreendedor|prestador|parceiro|anunciar|vender|produto|servico|profissional|loja|negocio)\b/.test(text);
    if (cancel || topicChange || commercial) return null;
    if (!active && !explicit && !(residentContext && (signupContext || followup))) return null;

    const firstMarker = [...history].reverse().findIndex(x => x.role === "assistant" && x.content.includes(marker) && /vou ajudar no cadastro como morador/i.test(x.content));
    const startIndex = firstMarker >= 0 ? history.length - 1 - firstMarker : -1;
    const entries = [...(startIndex >= 0 ? history.slice(startIndex) : history), { role: "user", content: message }];
    let lastQuestion = "";
    let name = "";
    let email = "";
    let phone = "";
    let cep = "";
    for (const entry of entries) {
      const content = String(entry.content || "");
      const norm = this.normalize(content);
      if (entry.role === "assistant") {
        if (norm.includes("qual e seu nome completo")) lastQuestion = "name";
        else if (norm.includes("qual e seu e-mail")) lastQuestion = "email";
        else if (norm.includes("qual e seu whatsapp")) lastQuestion = "phone";
        else if (norm.includes("qual e seu cep")) lastQuestion = "cep";
        else if (norm.includes("posso abrir a pagina de cadastro")) lastQuestion = "confirm";
        continue;
      }
      if (entry.role !== "user") continue;
      const foundEmail = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
      if (foundEmail) email = foundEmail;
      const foundCep = content.match(/(?:^|\D)(\d{5}-?\d{3})(?!\d)/)?.[1];
      if (foundCep) cep = foundCep.replace(/\D/g, "");
      const digits = content.replace(/\D/g, "");
      if (!foundEmail && digits.length >= 10 && digits.length <= 13 && (lastQuestion === "phone" || /(?:whatsapp|telefone|celular|fone)/i.test(content) || /^\+?55?\d{10,11}$/.test(content.trim()))) phone = digits;
      const explicitName = content.match(/(?:meu nome (?:e|é)|nome\s*:)\s*([^,;.\n]{3,90})/i)?.[1]?.trim();
      if (explicitName) name = explicitName;
      if (lastQuestion === "name" && !foundEmail && !/\d/.test(content) && content.trim().length >= 3) name = explicitName || content.trim();
    }
    const ask = (question: string) => ({ message: `${marker} ${question}` });
    if (!name) return ask("Vou ajudar no cadastro como morador. Qual é seu nome completo?");
    if (!email) return ask("Qual é seu e-mail para preencher o cadastro?");
    if (!phone) return ask("Qual é seu WhatsApp com DDD?");
    if (!cep) return ask("Qual é seu CEP? Pode informar com ou sem hífen.");
    const confirmed = /^(sim|confirmo|pode abrir|abrir (?:meu |o )?cadastro|podemos abrir (?:o )?formulario|pode continuar)[.! ]*$/.test(text);
    if (lastQuestion !== "confirm" || !confirmed) return ask('Tenho seu nome, e-mail, WhatsApp e CEP. Posso abrir a página de cadastro de MORADOR com esses dados preenchidos? Responda "pode abrir" para confirmar.');
    return {
      message: "Vou abrir seu cadastro como morador com os dados já informados. Confira os campos e complete o restante antes de enviar.",
      action: { type: "OPEN_PARTNER_REGISTRATION", payload: {
        nome: name, email, telefone: phone, cep, tipo: "MORADOR",
        empreendedor: "0", moraEmCondominio: "1", ramo: "loja",
      } },
    };
  }

  /** Coleta assistida: apenas prepara dados para a página oficial de cadastro. */
  public registrationStep(
    message: string,
    history: PartnerHistoryEntry[],
    intent: PartnerIntent,
  ): { message: string; action?: { type: "OPEN_PARTNER_REGISTRATION"; payload: {
    nome: string; email: string; telefone: string; tipo: "MORADOR" | "PRESTADOR";
    empreendedor: string; moraEmCondominio: string; ramo: "loja" | "servico"; categoria?: string;
  } } } | null {
    const text = this.normalize(message);
    const marker = "[cadastro assistido dot]";
    const previousAssistant = [...history].reverse().find(x => x.role === "assistant");
    const active = Boolean(previousAssistant?.content.includes(marker)) &&
      !/vou abrir a pagina de cadastro/i.test(this.normalize(previousAssistant?.content || ""));
    const partnerContext = history.some(x => x.role === "user" &&
      /\b(eu sou churrasqueiro|sou (?:manicure|eletricista|pedreiro|confeiteir[oa])|eu vendo|tambem vendo|meu negocio|minha loja|quero anunciar|quero me cadastrar|cadastrar meu negocio)\b/.test(this.normalize(x.content)));
    const lastAssistantText = this.normalize(previousAssistant?.content || "");
    const signupFollowup = /\b(pode me ajudar a preencher|me ajuda a preencher|quero me cadastrar|quero cadastrar|pode fazer meu cadastro|vamos cadastrar|pode abrir meu cadastro)\b/.test(text);
    const residentOnly = /\b(sou (somente |apenas |so )?morador|apenas morador|somente morador|so morador)\b/.test(text);
    const hasCommercialIntent = /\b(vendo|anuncio|negocio|prestador|empreendedor)\b/.test(text);
    if (!active && residentOnly && !hasCommercialIntent) return null;
    const start =
      /\b(quero anunciar|cadastrar minha loja|cadastrar meu negocio|quero ser prestador|quero ser empreendedor|divulgar meu negocio|vender meus produtos)\b/.test(text) ||
      (partnerContext && (signupFollowup || /cadastro|divulgar seus produtos|se cadastrar/.test(lastAssistantText)));
    if (!active && !start) return null;
    if (/\b(mudar de assunto|nao quero anunciar|cancelar cadastro|desistir do cadastro|so quero contratar)\b/.test(text)) return null;

    // Recupera somente respostas dadas depois do início deste atendimento.
    // Mantém todas as respostas da sessão atual. Usar o último marcador
    // descartava o nome ao perguntar e-mail, gerando um ciclo infinito.
    // Uma resposta normal do assistente delimita o fim da sessão anterior.
    let startIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry.role !== "assistant") continue;
      if (!entry.content.includes(marker)) break;
      startIndex = i;
    }
    // Ao iniciar, aproveita a descrição do negócio já dita na conversa.
    const scoped = startIndex >= 0 ? history.slice(startIndex + 1) : history;
    const entries = [...scoped, { role: "user", content: message }];
    const answers: { activity?: string; name?: string; email?: string; phone?: string; residence?: boolean } = {};
    let lastQuestion = "";
    const questionType = (v: string): string => {
      const t = this.normalize(v);
      if (t.includes("qual e sua atividade") || t.includes("o que voce vende")) return "activity";
      if (t.includes("qual e seu nome completo")) return "name";
      if (t.includes("qual e seu e-mail")) return "email";
      if (t.includes("qual e seu whatsapp")) return "phone";
      if (t.includes("voce mora em um condominio")) return "residence";
      if (t.includes("posso abrir a pagina de cadastro")) return "confirm";
      return "";
    };
    if (startIndex >= 0) {
      const initialEntry = history[startIndex];
      if (initialEntry) lastQuestion = questionType(initialEntry.content);
    }
    for (const entry of entries) {
      if (entry.role === "assistant") { const q = questionType(entry.content); if (q) lastQuestion = q; continue; }
      if (entry.role !== "user") continue;
      const value = entry.content.trim();
      const norm = this.normalize(value);
      const email = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
      const digits = value.replace(/\D/g, "");
      if (email) answers.email = email;
      if (digits.length >= 10 && digits.length <= 13 && !email) answers.phone = digits;
      const explicitName = value.match(/(?:meu nome (?:e|é)|nome\s*:)\s*([^,;.\n]{3,90})/i)?.[1]?.trim();
      if (explicitName) answers.name = explicitName;
      if (lastQuestion === "activity" && !answers.activity && !email) answers.activity = value;
      if (lastQuestion === "name" && !email && !/\d/.test(value) && value.length >= 3) answers.name = explicitName || value;
      if (lastQuestion === "residence") {
        if (/^(nao|não)\b/.test(norm) || /nao moro|nao resido/.test(norm)) answers.residence = false;
        else if (/^(sim|moro|sou morador)\b/.test(norm)) answers.residence = true;
      }
      if (/\b(nao moro|nao resido|nao sou morador)\b.*\bcondominio\b/.test(norm)) answers.residence = false;
      else if (/\b(moro|resido|sou morador)\b.*\bcondominio\b/.test(norm)) answers.residence = true;
    }
    const ask = (question: string) => ({ message: `${marker} ${question}` });
    if (!answers.activity) {
      const businessDescription = [...history, { role: "user", content: message }]
        .filter(x => x.role === "user")
        .map(x => x.content)
        .find(v => /\b(churrasqueiro|bolos?|doces?|salgados?|manicure|eletricista|pedreiro|cabeleireiro|artesanato|roupas?|carnes?|vendo carne)\b/.test(this.normalize(v)));
      if (businessDescription) answers.activity = businessDescription;
    }
    if (!answers.activity) return ask("Que bom que você quer divulgar seu negócio! Qual é sua atividade ou o que você vende?");
    if (!answers.name) return ask("Perfeito! Qual é seu nome completo?");
    if (!answers.email) return ask("Qual é seu e-mail para preencher o cadastro?");
    if (!answers.phone) return ask("Qual é seu WhatsApp com DDD?");
    if (answers.residence === undefined) return ask("Você mora em um condomínio? Responda sim ou não, por favor.");
    const confirm = /^(sim|confirmo|pode abrir|abrir (?:meu |o )?cadastro|vamos cadastrar|pode continuar)[.! ]*$/.test(text);
    if (lastQuestion !== "confirm" || !confirm) {
      return ask(`Obrigado! Tenho seu nome, e-mail e WhatsApp, e você ${answers.residence ? "mora" : "não mora"} em condomínio. Posso abrir a página de cadastro com esses dados preenchidos? Responda "pode abrir" para confirmar.`);
    }
    const normalizedActivity = this.normalize(answers.activity);
    const shop = /bolo|doce|confeit|salgad|pao|massa|carne|loja|produto|roupa|artesan|venda|vendo|comerc/.test(normalizedActivity);
    const ramo: "loja" | "servico" = shop ? "loja" : "servico";
    const tipo: "PRESTADOR" = "PRESTADOR";
    return {
      message: "Perfeito! Vou abrir a página de cadastro com os dados que você informou. Lá você poderá revisar tudo, criar sua senha e aceitar os termos antes de prosseguir.",
      action: {
        type: "OPEN_PARTNER_REGISTRATION",
        payload: {
          nome: answers.name, email: answers.email, telefone: answers.phone,
          tipo, empreendedor: shop ? "1" : "0",
          moraEmCondominio: answers.residence ? "1" : "0", ramo,
          categoria: /bolo|confeit/.test(normalizedActivity) ? "Bolos" : undefined,
        },
      },
    };
  }

  public respond(message: string, history: PartnerHistoryEntry[], intent: PartnerIntent): string | null {
    const text = this.normalize(message);
    const recent = history.slice(-20);
    const previous = this.normalize([...recent].reverse().find((x) => x.role === "assistant")?.content || "");
    const priorAssistant = recent.filter((x) => x.role === "assistant").map((x) => this.normalize(x.content));
    const inPartnerJourney = priorAssistant.some((x) =>
      x.includes("cadastro de prestador ou empreendedor") ||
      x.includes("qual e sua atividade ou o que voce vende") ||
      x.includes("plano premium") ||
      x.includes("modalidades de assinatura") ||
      x.includes("seu negocio") && x.includes("granconecta") ||
      x.includes("quer seguir para o cadastro") ||
      x.includes("divulgar seu trabalho")
    );
    const inResidentJourney = priorAssistant.some((x) => x.includes("cadastro de morador") || x.includes("opcao morador"));
    const newTopic = /\b(mudar de assunto|outro assunto|agora preciso|agora quero|nao quero anunciar|nao quero participar|so quero contratar|quero procurar um profissional)\b/.test(text);
    const serviceSearch = /\b(preciso de|procuro|busco|quero contratar|quero encontrar|estou procurando|necessito de)\b.*\b(eletricista|encanador|pedreiro|manicure|diarista|faxina|profissional|prestador|psicopedagog|pintor|servico)\b/.test(text);
    const productSearch = /\b(quero comprar|onde compro|onde encontro|procuro|busco)\b.*\b(produto|terco|bolo|doce|roupa|joia|presente|carne)\b/.test(text);
    if (newTopic || serviceSearch || productSearch) return null;

    const residentSignup = intent.intent === "CADASTRO_MORADOR" ||
      /\b(cadastr|registro|criar conta)\w*.*\b(morador|moradora|residente)\b/.test(text);
    const visitorSignup = intent.intent === "CADASTRO_VISITANTE";
    // Classificação da IA é apenas indício: nunca inicia parceria sem pedido comercial explícito.
    const explicitPartner = /\b(quero anunciar|anunciar meu negocio|cadastrar minha loja|cadastrar meu negocio|quero ser empreendedor|quero ser prestador|quero me tornar parceiro|quero ser parceiro|divulgar minha loja|divulgar meu negocio|vender meus produtos|quero abrir uma loja)\b/.test(text);
    // Conhecer a plataforma, ser morador ou pedir ajuda não são adesão comercial.
    const residentIntroduction = /\b(sou morador|sou moradora|sou residente|moro no|moro em|vim conhecer|passando aqui para conhecer|conhecer o granconecta)\b/.test(text);
    if (residentIntroduction && !explicitPartner) return null;
    const asksPlans = /\b(planos?|mensal|trimestral|anual|assinatura|mensalidade|quanto custa|preco|valor)\b/.test(text);
    const asksSignup = /\b(quero me cadastrar|quero fazer (o )?cadastro|como (faco|faz) (o )?cadastro|onde me cadastro|link (do |de )?cadastro|quero comecar|vamos cadastrar)\b/.test(text);
    const alreadyRegistered = /\b(ja tenho cadastro|sou cadastrad[oa]|ja sou parceiro|ja participo)\b/.test(text) &&
      !/\b(nao|nunca|sem)\b/.test(text);
    const noRegistration = /\b(nao (tenho|possuo)( (um|o))? cadastro|nao tenho|nao sou cadastrad[oa]|nunca me cadastrei|ainda nao tenho cadastro|sem cadastro)\b/.test(text);
    const yes = /^(sim|claro|quero sim|pode ser|isso|ok|certo|por favor|pode)[.! ]*$/.test(text);
    const no = /^(nao|agora nao|prefiro nao|nao obrigado)[.! ]*$/.test(text);

    if (residentSignup) {
      return `Para se cadastrar como morador, acesse ${this.cadastroUrl}, escolha a opção de morador, preencha os dados solicitados e informe seu condomínio conforme as opções da plataforma. Depois, entre na sua conta para acessar as funcionalidades disponíveis ao morador. Não preciso recolher seus dados aqui no chat. Se tiver dificuldade em alguma etapa, posso orientar.`;
    }
    if (visitorSignup) {
      return `Você pode começar pelo cadastro em ${this.cadastroUrl}. Como visitante, poderá comprar produtos e contratar serviços, mas não publicar no Mural ou nos Classificados. Se você mora em um condomínio atendido, escolha o cadastro de morador conforme sua situação.`;
    }
    if (alreadyRegistered && inPartnerJourney) {
      return "Se você já tem cadastro de parceiro, entre na sua conta para consultar ou atualizar seu negócio. Posso orientar o caminho, mas não altero seus dados pelo chat.";
    }
    if (asksPlans && (inPartnerJourney || explicitPartner)) {
      return `Para anunciar como empreendedor ou prestador, você contrata o plano PREMIUM. Ele pode ser escolhido nos ciclos MENSAL, TRIMESTRAL ou ANUAL; os recursos do plano são PREMIUM em todos eles, e o que muda é a periodicidade. Os valores e condições atualizados aparecem no cadastro: ${this.cadastroUrl}. Não é necessário me enviar seus dados aqui.`;
    }
    if (explicitPartner) {
      return `Você pode divulgar seu negócio no GranConecta como empreendedor ou prestador. Para isso, faça seu cadastro de parceiro e escolha o plano PREMIUM na modalidade MENSAL, TRIMESTRAL ou ANUAL. Comece em ${this.cadastroUrl}. O cadastro e a contratação são realizados na plataforma, não aqui no chat. Posso explicar as modalidades ou ajudar se surgir alguma dúvida.`;
    }
    if (asksSignup && inResidentJourney && !inPartnerJourney) {
      return `O cadastro de morador é feito em ${this.cadastroUrl}. Escolha a opção de morador e siga as etapas exibidas. Depois de entrar na conta, você terá acesso às funções permitidas ao seu perfil.`;
    }
    if ((asksSignup || noRegistration) && inPartnerJourney) {
      return `Sem problema! Você não precisa me passar telefone, e-mail ou descrição do negócio. Faça o cadastro de empreendedor ou prestador em ${this.cadastroUrl} e escolha o plano PREMIUM MENSAL, TRIMESTRAL ou ANUAL. Posso orientar durante o preenchimento.`;
    }
    if (inPartnerJourney && (yes || no)) {
      return no
        ? "Tudo bem! Posso esclarecer suas dúvidas sobre o GranConecta antes de você decidir."
        : `Ótimo! Para anunciar, o próximo passo é acessar ${this.cadastroUrl}, cadastrar-se como empreendedor ou prestador e escolher o ciclo PREMIUM mensal, trimestral ou anual. Posso orientar se tiver alguma dificuldade.`;
    }
    // Se a pessoa continuar descrevendo o próprio negócio, não simular coleta de cadastro.
    const selfDescription = /\b(meu negocio|minha loja|eu vendo|vendo |produzo |faco |trabalho com|nosso negocio|meu trabalho)\b/.test(text);
    const previouslyAskedBusiness = /\b(qual e sua atividade|o que voce vende|nome do seu negocio|como sao os|seu negocio)\b/.test(previous);
    if (inPartnerJourney && (selfDescription || previouslyAskedBusiness)) {
      return `Entendi! Esse tipo de produto ou serviço pode ser apresentado na sua vitrine no GranConecta. Para criar o perfil e anunciar, acesse ${this.cadastroUrl}, selecione empreendedor ou prestador e escolha o plano PREMIUM mensal, trimestral ou anual. Você poderá preencher os detalhes do negócio na própria plataforma. Posso ajudar com alguma dúvida sobre o processo?`;
    }
    if (inPartnerJourney && /\b(como funciona|quais as vantagens|beneficios|me explica|participar)\b/.test(text)) {
      return `O GranConecta aproxima negócios dos moradores e oferece uma vitrine digital para apresentar produtos e serviços. Para participar como parceiro, é necessário cadastro e contratação do plano PREMIUM mensal, trimestral ou anual em ${this.cadastroUrl}. Não posso garantir um número de vendas ou clientes.`;
    }
    return null;
  }
}
