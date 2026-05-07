import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.dev') });
const env = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value.replace(/\r/g, '').trim();
};

const DB_PORT: number = Number(process.env.DB_PORT?.trim()  ?? 3306);

import { Usuario } from '../models/UserModels';
import { UsuarioAuth } from '../models/UsuarioAuthModels';
import { ServicoOferta } from '../models/servicoOfertaModels';
import { Parcela } from '../models/ParcelaModel';
import { Avaliacao } from '../models/AvaliacaoModel';
import { Agenda } from '../models/AgendaModel';
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
  ],

   migrations: [
    path.resolve(__dirname, '../migrations/*.js')

  ]

});