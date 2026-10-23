export type MarketingCampanhaStatus =
  | "RASCUNHO"
  | "AGUARDANDO_PAGAMENTO"
  | "AGUARDANDO_APROVACAO"
  | "AGENDADA"
  | "PROCESSANDO"
  | "CONCLUIDA"
  | "CANCELADA"
  | "FALHOU";

export type MarketingCampanhaTipo =
  | "INSTITUCIONAL"
  | "CONTRATADA"
  | "AUTOMATICA";

export type MarketingCampanhaDestinoTipo =
  | "GRANCONECTA"
  | "CATEGORIA"
  | "LOJA"
  | "PRESTADOR";

export type MarketingCanal =
  | "NOTIFICACAO"
  | "BANNER"
  | "WHATSAPP"
  | "EMAIL"
  | "PUSH"
  | "SMS"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "FACEBOOK_ADS"
  | "INSTAGRAM_ADS"
  | "FACEBOOK_ORGANICO"
  | "INSTAGRAM_ORGANICO";

export type MarketingCanalStatus =
  | "RASCUNHO"
  | "AGENDADO"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "FALHOU";

export type MarketingCanalConfiguracao = {
  titulo?: string;
  mensagem?: string;
  assunto?: string;
  imagemUrl?: string;
  legenda?: string;
  dataFim?: string;
  linkDestino?: string;
  templateNome?: string;
  institucional?: boolean;

  /** ID do contêiner criado antes da publicação no Instagram. */
  instagramContainerId?: string;

  /** ID definitivo da mídia publicada no Instagram. */
  instagramMediaId?: string;

  /** Link público retornado pela API após a publicação. */
  instagramPermalink?: string;

  /** Data informada pela Meta para a publicação. */
  instagramPublicadoEm?: string;

  /** ID da foto criada na Página do Facebook. */
  facebookPhotoId?: string;

  /** ID da publicação criada na Página do Facebook. */
  facebookPostId?: string;

  /** Link público da publicação no Facebook. */
  facebookPermalink?: string;

  /** Data da publicação retornada pela Meta. */
  facebookPublicadoEm?: string;

  [chave: string]: unknown;
};

export type MarketingCampanhaCanal = {
  id: number;
  campanha_id: number;
  canal: MarketingCanal;
  status: MarketingCanalStatus;
  configuracao?: MarketingCanalConfiguracao | null;
  external_id?: string | null;
  total_destinatarios: number;
  total_enviados: number;
  total_entregues?: number;
  total_abertos?: number;
  total_visualizacoes?: number;
  total_cliques?: number;
  total_conversoes?: number;
  total_falhas: number;
  iniciado_em?: string | null;
  concluido_em?: string | null;
  ultimo_erro?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketingLeadOrigem =
  | "CADASTRO"
  | "LANDING_PAGE"
  | "BANNER"
  | "QR_CODE"
  | "CHECKOUT"
  | "FORMULARIO";

export type MarketingSegmentacao = {
  condominioIds?: string[];
  usuarioTipos?: string[];
  somenteUsuariosAtivos?: boolean;
  origemLeads?: MarketingLeadOrigem[];
};

export type MarketingCampanha = {
  id: number;
  loja_id?: string | null;
  prestador_id?: string | null;
  banner_id?: number | null;
  nome: string;
  descricao?: string | null;
  tipo_campanha?: MarketingCampanhaTipo;
  tipo_destino?: MarketingCampanhaDestinoTipo;
  categoria_id?: number | null;
  categoria?: {
    id: number;
    name?: string | null;
    tipo?: string | null;
  } | null;
  criado_por?: string | null;
  template_nome?: string | null;
  template_idioma: string;
  parametros_template?: Array<string | number> | Record<string, unknown> | null;
  segmentacao?: MarketingSegmentacao | null;
  data_agendamento: string;
  status: MarketingCampanhaStatus;
  pago: boolean | number;
  aprovado: boolean | number;
  total_destinatarios: number;
  total_enviados: number;
  total_falhas: number;
  total_entregues: number;
  total_lidos: number;

  /**
   * Situação operacional do disparo WhatsApp.
   * Não substitui o status real da campanha.
   */
  situacao_whatsapp?: "REAGENDADA" | null;

  /**
   * Resumo do agendamento WhatsApp mais relevante da campanha.
   */
  whatsapp_agendamento?: {
    id: number;
    status:
      | "PENDENTE"
      | "PROCESSANDO"
      | "ENVIADO"
      | "ENTREGUE"
      | "LIDO"
      | "CANCELADO"
      | "FALHA";
    tentativas: number;
    data_execucao?: string | null;
    meta_message_id?: string | null;
    ultimo_erro?: string | null;
  } | null;

  createdAt: string;
  updatedAt: string;
};

export type MarketingLead = {
  id: string;
  usuario_id?: string | null;
  condominio_id?: string | null;
  nome?: string | null;
  telefone: string;
  email?: string | null;
  origem: MarketingLeadOrigem;
  origem_referencia?: string | null;
  ativo: boolean | number;
  createdAt: string;
  updatedAt: string;
};

export type CriarCampanhaInput = {
  lojaId?: string | null;
  prestadorId?: string | null;
  bannerId?: number | null;
  nome: string;
  descricao?: string | null;
  tipoCampanha?: MarketingCampanhaTipo;
  tipoDestino?: MarketingCampanhaDestinoTipo;
  categoriaId?: number | string | null;
  templateNome?: string | null;
  templateIdioma?: string;
  parametrosTemplate?: Array<string | number> | null;
  segmentacao?: MarketingSegmentacao | null;
  dataAgendamento: string;
};

export type ConfigurarCanalInput = {
  canal: MarketingCanal;
  configuracao?: MarketingCanalConfiguracao | null;
};

export type ResultadoCanal = {
  campanhaId: number;
  canal: MarketingCanal;
  destinatarios: number;
  enviados: number;
  falhas: number;
  ignorado: boolean;
  motivo?: string | null;
};

export type BannerLocalExibicao = "MARKETPLACE" | "SERVICOS" | "AMBOS";

export type MarketingBanner = {
  id: number;
  loja_id?: string | null;
  condominio_id?: string | null;
  local_exibicao: BannerLocalExibicao;
  titulo: string;
  subtitulo?: string | null;
  imagem_url: string;
  cor_destaque: string;
  link_destino: string;
  data_inicio: string;
  data_fim: string;
  status: "pendente" | "aprovado" | "recusado";
  pago: boolean | number;
  ativo: boolean | number;
};

export type CriarBannerInstitucionalInput = {
  titulo: string;
  subtitulo?: string | null;
  imagemUrl: string;
  corDestaque?: string;
  linkDestino: string;
  condominioId?: string | null;
  localExibicao: BannerLocalExibicao;
  dataInicio?: string;
  dataFim: string;
};

export type CapturarLeadInput = {
  usuarioId?: string | null;
  condominioId?: string | null;
  nome?: string | null;
  telefone: string;
  email?: string | null;
  origem: MarketingLeadOrigem;
  origemReferencia?: string | null;
  aceitaMarketing: boolean;
  aceitaUtilidade: boolean;
  origemConsentimento?: string;
};

export type TestarEnvioInput = {
  usuarioId?: string | null;
  telefone: string;
  nomeTemplate: string;
  idioma?: string;
  parametrosCorpo?: Array<string | number>;
};

export type ListaCampanhasResponse = {
  sucesso: boolean;
  dados: MarketingCampanha[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type ListaCampanhasNormalizada = ListaCampanhasResponse & {
  campanhas: MarketingCampanha[];
};

export type ApiMarketingResponse<T> = {
  sucesso: boolean;
  mensagem?: string;
  campanha?: MarketingCampanha;
  resultado?: T;
};