import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import path from 'path';

/**
 * Seleciona explicitamente o arquivo de ambiente sem alterar as demais
 * configurações do DataSource.
 *
 * local        -> .env.local
 * development  -> .env.dev
 * production   -> .env.production
 */
const NODE_ENV = String(process.env.NODE_ENV || "development")
  .trim()
  .toLowerCase();

const envFile =
  NODE_ENV === "local"
    ? ".env.local"
    : NODE_ENV === "production"
      ? ".env.production"
      : ".env.dev";

const envPath = path.resolve(__dirname, `../../${envFile}`);

const envResult = dotenv.config({
  path: envPath,
  override: false,
});

if (envResult.error) {
  console.warn(
    `⚠️ Arquivo de ambiente não carregado (${envFile}):`,
    envResult.error.message
  );
} else {
  console.log(`✅ Ambiente carregado (${envFile}) [NODE_ENV=${NODE_ENV}]`);
}

const env = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value.replace(/\r/g, '').trim();
};

const DB_PORT: number = Number(process.env.DB_PORT?.trim() ?? 3306);

import { Usuario } from '../models/UserModels';
import { UsuarioAuth } from '../models/UsuarioAuthModels';
import { ServicoOferta } from '../models/servicoOfertaModels';
import { Parcela } from '../models/ParcelaModel';
import { Avaliacao } from '../models/AvaliacaoModel';
import { Agenda } from '../models/AgendaModels';
import { Notificacao } from '../models/NotificationModel';
import { Pagamento } from '../models/PagamentoModel';
import { Menu } from '../models/MenuModels';
import { MenuItem } from '../models/MenuItemModels';
import { ServicoCandidatura } from '../models/servicoCandidatura';
import { ServicoSolicitacao } from '../models/servicoSolicitacaoModels';
import { Page } from '../models/PageModels';
import { ServiceProvider } from '../models/ServiceProviderModels';
import { SiteConfig } from '../models/SiteConfig';
import { Condominio } from '../models/condominiosModels';
import { Encomenda } from '../models/EncomendaModels';
import { Aviso } from '../models/AvisoModels';
import { ServicoIgnorado } from '../models/ServicoIgnoradoModels';
import { Product } from '../models/ProdutoModels';
import { Category } from '../models/CategoryModels';
import { PerfilPrestador } from '../models/PerfilPrestadorModel';
import { Subscription } from '../models/SubscriptionModel';
import { Charge } from '../models/ChargeModel';
import { Store } from '../models/StoreModels';
import { Order } from '../models/OrderModels';
import { OrderItem } from '../models/OrderItemModels';
import { UserCredits } from '../models/usercreditsModels';
import { CreditTransactions } from '../models/creditTransactionsModels';
import { RefundRequest } from '../models/RefundRequestModel';
import { Endereco } from '../models/EnderecoModel';
import { Post } from '../models/Post';
import { PostGaragem } from '../models/PostGaragem';
import { PostDesapega } from '../models/PostDesapega';
import { PostAnimal } from '../models/PostAnimal';
import { PostMidia } from '../models/PostMidia';
import { PostInteresse } from '../models/PostInteresse';
import { AvisoView } from '../models/AvisoView';
import { PostView } from '../models/PostView';
import { AvisoTarget } from '../models/AvisoTarget';
import { MarketPlaceModel } from '../models/MarketPlaceModel';
import { Estilo } from '../models/EstiloModels';
import { Payment } from '../models/PaymentModel';
import { GrupoHome } from '../models/GrupoHomeModel';
import { LojaInteracao } from '../models/LojaInteracao';
import { StorePaymentConfig } from '../models/StorePaymentConfigModels';
import { PostTarget } from '../models/PostTargetModels';
import { DeliveryConfig } from '../models/DeliveryConfig';
import { Plan } from '../models/PlanModel';
import { MarketingAgendamento } from '../models/MarketingAgendamentoModels';
import { ServicoNegociacao } from '../models/servicoNegociacaoModels';
import { ChatLead } from '../models/ChatLead';
import { ChatMessage } from '../models/ChatMessage';
import { ChatConversation } from '../models/ChatConversation';
import { DocumentoLegal } from '../models/DocumentoLegalModel';
import { AceiteDocumento } from '../models/AceiteDocumentoModel';
import { StoreChatbotKnowledge } from '../models/StoreChatbotKnowledgeModel';
import { ListaDesejos } from '../models/ListaDesejosModels';
import { WhatsAppConsentimento } from '../models/WhatsAppConsentimentoModel';
import { MarketingLead } from "../models/MarketingLeadModel";
import { MarketingCampanha } from "../models/MarketingCampanhaModel";

import { WhatsAppLeadConsentimento } from "../models/WhatsAppLeadConsentimentoModel";
import MarketingCampanhaCanal from '../models/MarketingCampanhaCanalModel';
import WhatsAppConnection from '../models/WhatsAppConnectionModel';
import MarketingConsentimento from '../models/MarketingConsentimento';
import MarketingCredito from '../models/MarketingCredito';
import MarketingContato from '../models/MarketingContato';
import MarketingPolitica from '../models/MarketingPoliticaModel';
import MarketingPlaybook from '../models/MarketingPlaybookModel';
import MarketingOpportunity from '../models/MarketingOpportunityModel';
import MarketingOpportunityAnswer from '../models/MarketingOpportunityAnswerModel';
import BusinessCatalogItem from '../models/BusinessCatalogItemModel';
import AgendaDisponibilidade, { AgendaBloqueio } from '../models/AgendaDisponibilidadeModel';
import CommercialFlow from '../models/CommercialFlowModel';
import BusinessTeamMember from '../models/BusinessTeamMemberModel';
import BusinessTeamInvitation from '../models/BusinessTeamInvitationModel';
import PagamentoTransacao from '../models/PagamentoTransacaoModel';
import CondominioUnidade from '../models/CondominioUnidadeModel';
import UsuarioCondominioUnidade from '../models/UsuarioCondominioUnidadeModel';
import Classificado from '../models/ClassificadoModel';
import ClassificadoImagem from '../models/ClassificadoImagemModel';
import ClassificadoEvento from '../models/ClassificadoEventoModel';
import ClassificadoCreditoMovimento from '../models/ClassificadoCreditoMovimentoModel';
import ClassificadoCredito from '../models/ClassificadoCreditoModel';
import GranConectaAgent from '../models/GranConectaAgentModel';


if (NODE_ENV === "local") {
  const dbHost = env("DB_HOST").toLowerCase();
  const dbName = env("DB_DATABASE");
  const dbPort = Number(process.env.DB_PORT || 3306);

  if (
    dbHost !== "127.0.0.1" ||
    dbName !== "granconecta_teste" ||
    dbPort !== 3306
  ) {
    throw new Error(
      "BLOQUEIO DE SEGURANÇA: o ambiente local só pode " +
      "utilizar 127.0.0.1:3306 e o banco granconecta_teste."
    );
  }
}

export const AppDataSource = new DataSource({
  type: 'mysql',
  port: DB_PORT,
  host: env('DB_HOST'),
  username: env('DB_USER'),
  password: env('DB_PASSWORD'),
  database: env('DB_DATABASE'),
  synchronize: false,
  logging: ['error'],
  entities: [
    Usuario,
    UsuarioAuth,
    Aviso,
    Condominio,
    ServicoSolicitacao,
    ServicoCandidatura,
    ServicoOferta,
    Parcela,
    Avaliacao,
    Agenda,
    Notificacao,
    Pagamento,
    Menu,
    MenuItem,
    Page,
    ServiceProvider,
    SiteConfig,
    Encomenda,
    ServicoIgnorado,
    Product,
    Category,
    PerfilPrestador,
    Subscription,
    Charge,
    Store,
    Order,
    OrderItem,
    UserCredits,
    CreditTransactions,
    RefundRequest,
    Endereco,
    Post,
    PostGaragem,
    PostDesapega,
    PostAnimal,
    PostMidia,
    PostInteresse,
    AvisoView,
    PostView,
    AvisoTarget,
    MarketPlaceModel,
    Estilo,
    Payment,
    GrupoHome,
    LojaInteracao,
    StorePaymentConfig,
    PostTarget,
    DeliveryConfig,
    Plan,

    ServicoNegociacao,
    ChatLead,
    ChatMessage,
    ChatConversation,
    DocumentoLegal,
    AceiteDocumento,
    ListaDesejos,
    StoreChatbotKnowledge,
    WhatsAppConsentimento,
    MarketingLead,
    MarketingCampanha,
    MarketingCampanhaCanal,
    MarketingAgendamento,
    WhatsAppLeadConsentimento,
    WhatsAppConnection,
    MarketingConsentimento,
    MarketingContato,
    MarketingCredito,
    MarketingPolitica,
    MarketingPlaybook,
    MarketingOpportunity,
    MarketingOpportunityAnswer,
    BusinessCatalogItem,
    AgendaBloqueio,
    AgendaDisponibilidade,
    CommercialFlow,
    GranConectaAgent,
    BusinessTeamMember,
    BusinessTeamInvitation,
    PagamentoTransacao,
    CondominioUnidade,
    UsuarioCondominioUnidade,
    Classificado,
    ClassificadoImagem,
    ClassificadoEvento,
    ClassificadoCreditoMovimento,
    ClassificadoCredito



  ],

  // migrations: [
  //   path.resolve(__dirname, '../migrations/*.js')

  // ]

  migrations: [
    path.resolve(
      __dirname,
      `../migrations/*.${__filename.endsWith(".ts") ? "ts" : "js"}`
    ),
  ],

});