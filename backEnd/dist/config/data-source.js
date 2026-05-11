"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.resolve(__dirname, '../../.env.dev') });
const env = (key) => {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing env: ${key}`);
    return value.replace(/\r/g, '').trim();
};
const DB_PORT = Number(process.env.DB_PORT?.trim() ?? 3306);
const UserModels_1 = require("../models/UserModels");
const UsuarioAuthModels_1 = require("../models/UsuarioAuthModels");
const servicoOfertaModels_1 = require("../models/servicoOfertaModels");
const ParcelaModel_1 = require("../models/ParcelaModel");
const AvaliacaoModel_1 = require("../models/AvaliacaoModel");
const AgendaModel_1 = require("../models/AgendaModel");
const NotificationModel_1 = require("../models/NotificationModel");
const PagamentoModel_1 = require("../models/PagamentoModel");
const MenuModels_1 = require("../models/MenuModels");
const MenuItemModels_1 = require("../models/MenuItemModels");
const servicoCandidatura_1 = require("../models/servicoCandidatura");
const servicoSolicitacaoModels_1 = require("../models/servicoSolicitacaoModels");
const PageModels_1 = require("../models/PageModels");
const ServiceProviderModels_1 = require("../models/ServiceProviderModels");
const SiteConfig_1 = require("../models/SiteConfig");
const condominiosModels_1 = require("../models/condominiosModels");
const EncomendaModels_1 = require("../models/EncomendaModels");
const AvisoModels_1 = require("../models/AvisoModels");
const ServicoIgnoradoModels_1 = require("../models/ServicoIgnoradoModels");
const ProdutoModels_1 = require("../models/ProdutoModels");
const CategoryModels_1 = require("../models/CategoryModels");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
const SubscriptionModel_1 = require("../models/SubscriptionModel");
const ChargeModel_1 = require("../models/ChargeModel");
const StoreModels_1 = require("../models/StoreModels");
const OrderModels_1 = require("../models/OrderModels");
const OrderItemModels_1 = require("../models/OrderItemModels");
const usercreditsModels_1 = require("../models/usercreditsModels");
const creditTransactionsModels_1 = require("../models/creditTransactionsModels");
const RefundRequestModel_1 = require("../models/RefundRequestModel");
const EnderecoModel_1 = require("../models/EnderecoModel");
const Post_1 = require("../models/Post");
const PostGaragem_1 = require("../models/PostGaragem");
const PostDesapega_1 = require("../models/PostDesapega");
const PostAnimal_1 = require("../models/PostAnimal");
const PostMidia_1 = require("../models/PostMidia");
const PostInteresse_1 = require("../models/PostInteresse");
const AvisoView_1 = require("../models/AvisoView");
const PostView_1 = require("../models/PostView");
const AvisoTarget_1 = require("../models/AvisoTarget");
const MarketPlaceModel_1 = require("../models/MarketPlaceModel");
const EstiloModels_1 = require("../models/EstiloModels");
const PaymentModel_1 = require("../models/PaymentModel");
const GrupoHomeModel_1 = require("../models/GrupoHomeModel");
const LojaInteracao_1 = require("../models/LojaInteracao");
const StorePaymentConfigModels_1 = require("../models/StorePaymentConfigModels");
const PostTargetModels_1 = require("../models/PostTargetModels");
const DeliveryConfig_1 = require("../models/DeliveryConfig");
const PlanModel_1 = require("../models/PlanModel");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    port: DB_PORT,
    host: env('DB_HOST'),
    username: env('DB_USER'),
    password: env('DB_PASSWORD'),
    database: env('DB_DATABASE'),
    synchronize: false,
    logging: ['error'],
    entities: [
        UserModels_1.Usuario,
        UsuarioAuthModels_1.UsuarioAuth,
        AvisoModels_1.Aviso,
        condominiosModels_1.Condominio,
        servicoSolicitacaoModels_1.ServicoSolicitacao,
        servicoCandidatura_1.ServicoCandidatura,
        servicoOfertaModels_1.ServicoOferta,
        ParcelaModel_1.Parcela,
        AvaliacaoModel_1.Avaliacao,
        AgendaModel_1.Agenda,
        NotificationModel_1.Notificacao,
        PagamentoModel_1.Pagamento,
        MenuModels_1.Menu,
        MenuItemModels_1.MenuItem,
        PageModels_1.Page,
        ServiceProviderModels_1.ServiceProvider,
        SiteConfig_1.SiteConfig,
        EncomendaModels_1.Encomenda,
        ServicoIgnoradoModels_1.ServicoIgnorado,
        ProdutoModels_1.Product,
        CategoryModels_1.Category,
        PerfilPrestadorModel_1.PerfilPrestador,
        SubscriptionModel_1.Subscription,
        ChargeModel_1.Charge,
        StoreModels_1.Store,
        OrderModels_1.Order,
        OrderItemModels_1.OrderItem,
        usercreditsModels_1.UserCredits,
        creditTransactionsModels_1.CreditTransactions,
        RefundRequestModel_1.RefundRequest,
        EnderecoModel_1.Endereco,
        Post_1.Post,
        PostGaragem_1.PostGaragem,
        PostDesapega_1.PostDesapega,
        PostAnimal_1.PostAnimal,
        PostMidia_1.PostMidia,
        PostInteresse_1.PostInteresse,
        AvisoView_1.AvisoView,
        PostView_1.PostView,
        AvisoTarget_1.AvisoTarget,
        MarketPlaceModel_1.MarketPlaceModel,
        EstiloModels_1.Estilo,
        PaymentModel_1.Payment,
        GrupoHomeModel_1.GrupoHome,
        LojaInteracao_1.LojaInteracao,
        StorePaymentConfigModels_1.StorePaymentConfig,
        PostTargetModels_1.PostTarget,
        DeliveryConfig_1.DeliveryConfig,
        PlanModel_1.Plan,
    ],
    migrations: [
        path_1.default.resolve(__dirname, '../migrations/*.js')
    ]
});
