export type ChatbotTipo =
  | "GRANCONECTA"
  | "LOJA"
  | "PRESTADOR";

export type ChatOrigem =
  | "CHAT_HOME"
  | "CHAT_LOJA"
  | "CHAT_PRESTADOR"
  | "LANDING_PAGE"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK";

export type ChatLeadStatus =
  | "NOVO"
  | "QUALIFICANDO"
  | "INTERESSADO"
  | "ENCAMINHADO"
  | "CONVERTIDO"
  | "PERDIDO";

export type ChatUserContext = {
  userId?: string;
  userName?: string;
  userType?: string;
  condominioId?: string;
};

export type ChatbotContext = {
  chatbotTipo?: ChatbotTipo;
  chatbotOwnerId?: string | null;
  origem?: ChatOrigem;
};

export type ChatCampanhaDestinoTipo =
  | "GRANCONECTA"
  | "CATEGORIA"
  | "LOJA"
  | "PRESTADOR";

export type ChatPlaybookOpcao =
  | string
  | {
      id?: string;
      label: string;
      valor?: string;
      descricao?: string;
    };

export type ChatPlaybookPergunta = {
  chave: string;
  pergunta: string;
  opcoes?: ChatPlaybookOpcao[];
  obrigatoria?: boolean;
  ordem?: number;
};

export type ChatPlaybookFAQ = {
  pergunta: string;
  resposta: string;
};

export type ChatCampaignPlaybookContext = {
  id?: number;
  nome?: string;
  mensagemAbertura?: string;
  perguntas?: ChatPlaybookPergunta[];
  respostasFrequentes?: ChatPlaybookFAQ[];
  instrucoesIa?: string;
  ctaTexto?: string;
};

export type ChatCampaignStage =
  | "QUALIFICANDO"
  | "APRESENTANDO_OPCOES"
  | "NEGOCIO_SELECIONADO";

export type ChatCampaignContext = {
  campanhaId?: number;
  campanhaNome?: string;
  tipoDestino?: ChatCampanhaDestinoTipo;
  categoriaId?: number | null;
  categoriaNome?: string | null;
  playbook?: ChatCampaignPlaybookContext | null;

  /**
   * true somente quando a mensagem atual é uma resposta/clique
   * diretamente ligado à mensagem de campanha da Meta.
   *
   * Não deve ser mantido como true nas mensagens seguintes.
   * Isso permite reabrir a IA ao entrar pela campanha sem criar
   * loop IA <-> atendimento humano.
   */
  entradaDiretaCampanha?: boolean;

  selectedStoreId?: string | null;
  selectedStoreName?: string | null;
  selectedStoreSlug?: string | null;
  negocioSelecionadoEm?: string | Date | null;

  campaignStage?: ChatCampaignStage | null;
  playbookStep?: number;

  /**
   * Oportunidade comercial validada ao entrar na página
   * do negócio a partir de uma campanha.
   */
  opportunityId?: string;
  opportunityBootstrap?: boolean;
};

/**
 * Dados usados para identificar mensagens vindas
 * de canais externos como Instagram e WhatsApp.
 */
export type ChatExternalMessageContext = {
  /** Exemplo Instagram: message.mid */
  externalMessageId?: string;
  /** Exemplo: INSTAGRAM, WHATSAPP */
  channel?: string;
};

export type ChatMessageInput =
  ChatUserContext &
  ChatbotContext &
  ChatExternalMessageContext &
  ChatCampaignContext & {
    message: string;
    conversationId?: string;
    conversationAccessToken?: string;

    /**
     * Uso interno: força uma conversa nova quando uma oportunidade
     * chega pela primeira vez ao chatbot do negócio.
     */
    forceNewConversation?: boolean;

    storeName?: string;
    storeId?: string;
    lojaId?: string;
    prestadorId?: string;
    categoriaNome?: string;
    descricao?: string;
    storeSlug?: string;

    latitude?: number;
    longitude?: number;

    cidade?: string;
    estado?: string;
    bairro?: string;
    /** CEP declarado pelo cliente para busca aproximada, sem endereço completo. */
    cep?: string;
  };

export type ChatLeadSignal = {
  shouldCapture: boolean;
  interest?: string;
  status: ChatLeadStatus;

  /** Campos opcionais para quando o chatbot identificar dados do lead. */
  nome?: string;
  telefone?: string;
  email?: string;
};

export type ChatMessageResult = {
  success: true;
  message: string;
  conversationId: string;
  responseId: string;

  cards?: Array<{
    id: string;
    name: string;
    tipo: "LOJA" | "PRESTADOR";
    categoria?: string | null;
    descricao?: string | null;
    capaUrl?: string | null;
    logoUrl?: string | null;
    slug?: string | null;
    possuiLandingPublicada?: boolean;
  }>;

  opportunityId?: string;
  lead: ChatLeadSignal;
  action: ChatBotAction;
  conversationAccessToken?: string;
};

export type ChatBotActionType =
  | "NONE"
  | "OPEN_SOLICITACAO_MODAL"
  | "OPEN_WHATSAPP"
  | "ADD_TO_CART"
  | "OPEN_CONTACT_MODAL"
  | "SELECT_CAMPAIGN_BUSINESS"
  | "IDENTIFY_OPPORTUNITY_CUSTOMER"
  | "OPEN_BUSINESS_CHAT"
  | "OPEN_PARTNER_REGISTRATION"
  | "HUMAN_HANDOFF";

export type ChatBotAction = {
  type: ChatBotActionType;

  payload?: {
    storeId?: string;
    lojaId?: string;
    prestadorId?: string;
    opportunityToken?: string;
    categoriaNome?: string;
    storeName?: string;
    descricao?: string;
    storeSlug?: string;
    categoriaId?: number;
    campanhaId?: number;

    /** Contexto da identificação segura da oportunidade. */
    opportunityId?: string;
    nome?: string;
    email?: string;
    telefone?: string;

    chatbotTipo?: ChatbotTipo;
    chatbotOwnerId?: string;
    origem?: string;
    message?: string;
    productId?: string;
    id?: string;
    name?: string;
    price?: number | string;
    image?: string;
    quantity?: number;
    whatsapp?: string;
    url?: string;

    /** Pré-preenchimento do cadastro de parceiros pelo DOT. */
    tipo?: string;
    empreendedor?: string | boolean;
    moraEmCondominio?: string | boolean;
    ramo?: string;
    categoria?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    estado?: string;
    endereco?: string;
    condominioId?: string;
    bloco?: string;
    unidade?: string;
  };
};
