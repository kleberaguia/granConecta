export type CentralComercialChannel =
  | "GRANCONECTA"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LANDING_PAGE"
  | "CHAT_LOJA"
  | "CHAT_PRESTADOR"
  | "CAMPANHA"
  | "DIRETO"
  | "OUTRO";

export type CentralComercialStage =
  | "NOVA"
  | "QUALIFICANDO"
  | "QUALIFICADA"
  | "OPCOES_APRESENTADAS"
  | "NEGOCIO_SELECIONADO"
  | "EM_NEGOCIACAO"
  | "AGUARDANDO_CLIENTE"
  | "AGUARDANDO_PAGAMENTO"
  | "PAGAMENTO_APROVADO"
  | "EM_EXECUCAO"
  | "CONVERTIDA"
  | "PERDIDA"
  | "EXPIRADA"
  | "CANCELADA"
  | "ERRO";

export type CentralComercialBusinessType = "LOJA" | "PRESTADOR";

export type CentralComercialConversationStatus =
  | "ABERTA"
  | "IA_ATIVA"
  | "AGUARDANDO_ATENDENTE"
  | "EM_ATENDIMENTO_HUMANO"
  | "FINALIZADA"
  | null;

export interface CentralComercialCustomer {
  userId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  userType: string | null;
  condominioId: string | null;
  photoUrl: string | null;
}

export interface CentralComercialBusiness {
  storeId: string;
  storeName: string | null;
  storeSlug: string | null;
  chatbotTipo: CentralComercialBusinessType | null;
}

export interface CentralComercialOrigin {
  channel: CentralComercialChannel;
  rawChannel: string | null;
  campaignId: number | null;
  campaignName: string | null;
  sourceConversationId: string;
  destinationConversationId: string | null;
}

export interface CentralComercialInterest {
  categoryId: number | null;
  catalogItemId: string | null;
  catalogItemName: string | null;
  catalogItemType: string | null;
  catalogItemPrice: number | null;
  catalogItemPromotionalPrice: number | null;
  qualificationScore: number;
  qualificationSummary: string | null;
  answersCount: number;
}

export interface CentralComercialFlow {
  flowId: string | null;
  state: string | null;
  type: string | null;
  amount: number | null;
  quantity: number;
  totalSessions: number | null;
  solicitacaoId: string | null;
  candidaturaId: string | null;
  ofertaId: string | null;
  orderId: string | null;
  paymentId: string | null;
  agendaId: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  ativo: boolean | null;
}

export interface CentralComercialConversation {
  conversationId: string | null;
  status: CentralComercialConversationStatus;
  origem: string | null;
  waitingHuman: boolean;
  atendenteId: string | null;
  updatedAt: string | null;
}

export interface CentralComercialCampaign {
  id: number | null;
  name: string | null;
  status: string | null;
  destinationType: string | null;
  scheduledAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailures: number;
}

export interface CentralComercialOpportunity {
  id: string;
  status: string;
  stage: CentralComercialStage;
  customer: CentralComercialCustomer;
  business: CentralComercialBusiness;
  origin: CentralComercialOrigin;
  interest: CentralComercialInterest;
  flow: CentralComercialFlow;
  conversation: CentralComercialConversation;
  campaign: CentralComercialCampaign;
  createdAt: string;
  updatedAt: string;
  qualificationStartedAt: string | null;
  qualificationCompletedAt: string | null;
  optionsPresentedAt: string | null;
  businessSelectedAt: string | null;
  businessAccessedAt: string | null;
  negotiationStartedAt: string | null;
  convertedAt: string | null;
  lostAt: string | null;
}

export interface CentralComercialSummary {
  total: number;
  novas: number;
  qualificando: number;
  qualificadas: number;
  emNegociacao: number;
  aguardandoPagamento: number;
  pagamentoAprovado: number;
  emExecucao: number;
  convertidas: number;
  perdidas: number;
  valorEmNegociacao: number;
  valorConvertido: number;
}

export interface CentralComercialListResponse {
  summary: CentralComercialSummary;
  items: CentralComercialOpportunity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CentralComercialFilters {
  stage?: CentralComercialStage;
  channel?: CentralComercialChannel;
  campaignId?: number;
  search?: string;
  page?: number;
  limit?: number;
}
