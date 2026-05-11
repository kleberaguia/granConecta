"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
// --- IMPORTS DAS ROTAS ---
// Administrativo e Configurações
const PaymentController_1 = __importDefault(require("./controller/PaymentController"));
const routerPermissao_1 = require("./routers/routerPermissao");
const routerRole_1 = require("./routers/routerRole");
const routerPages_1 = __importDefault(require("./routers/routerPages"));
const routerSiteConfig_1 = require("./routers/routerSiteConfig");
const routerUpload_1 = __importDefault(require("./routers/routerUpload"));
// Autenticação e Usuários
const authRoutes_1 = __importDefault(require("./routers/authRoutes"));
const routerUser_1 = __importDefault(require("./routers/routerUser"));
// E-commerce e Conteúdo
const routerContent_1 = require("./routers/routerContent");
const routerCustumer_1 = require("./routers/routerCustumer");
const routerMenu_1 = __importDefault(require("./routers/routerMenu"));
const routerOrder_1 = require("./routers/routerOrder");
const routerOrderItem_1 = require("./routers/routerOrderItem");
const routerProduto_1 = __importDefault(require("./routers/routerProduto"));
const routerSecao_1 = require("./routers/routerSecao");
// Gestão Condominial
const routerAviso_1 = __importDefault(require("./routers/routerAviso"));
const routerCondominio_1 = __importDefault(require("./routers/routerCondominio"));
const routerEncomenda_1 = __importDefault(require("./routers/routerEncomenda"));
const routerNotificacao_1 = __importDefault(require("./routers/routerNotificacao"));
const routerPagamento_1 = __importDefault(require("./routers/routerPagamento"));
// Marketplace de Serviços
const routerServico_1 = __importDefault(require("./routers/routerServico"));
const routerServicoAdmin_1 = __importDefault(require("./routers/routerServicoAdmin"));
const routerServicoCandidatura_1 = __importDefault(require("./routers/routerServicoCandidatura"));
const routerServicoOferta_1 = __importDefault(require("./routers/routerServicoOferta"));
const routerServicoSolicitacao_1 = __importDefault(require("./routers/routerServicoSolicitacao"));
const routerTipoServico_1 = __importDefault(require("./routers/routerTipoServico"));
const routerVitrine_1 = __importDefault(require("./routers/routerVitrine"));
const routerPrestador_1 = __importDefault(require("./routers/routerPrestador"));
const routerAdmin_1 = __importDefault(require("./routers/routerAdmin"));
const routerPayment_1 = __importDefault(require("./routers/routerPayment"));
const routerCategory_1 = __importDefault(require("./routers/routerCategory"));
const routerStore_1 = __importDefault(require("./routers/routerStore"));
const home_routes_1 = require("./routers/home.routes");
const data_source_1 = require("./config/data-source");
const routerPosts_1 = require("./routers/routerPosts");
const routermakeViews_1 = require("./routers/routermakeViews");
const routerAI_1 = __importDefault(require("./routers/routerAI"));
const routerPageLanding_1 = __importDefault(require("./routers/routerPageLanding"));
const routerIA_Templates_1 = __importDefault(require("./routers/routerIA_Templates"));
const routerMarketPlace_1 = __importDefault(require("./routers/routerMarketPlace"));
const routerPayment_config_1 = __importDefault(require("./routers/routerPayment-config"));
const vendasRoutes_1 = __importDefault(require("./routers/vendasRoutes"));
const routerPaymentGateway_1 = require("./routers/routerPaymentGateway");
const routerPlans_1 = __importDefault(require("./routers/routerPlans"));
exports.app = (0, express_1.default)();
//app.use(cors({ origin: '*' }));
exports.app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://dev.admin.granconecta.net.br',
        'https://dev.granconecta.net.br'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// ✅ OBRIGATÓRIO: Definir os limites ANTES de qualquer rota
exports.app.use(express_1.default.json({ limit: '500mb' }));
exports.app.use(express_1.default.urlencoded({ limit: '500mb', extended: true }));
// --- 2. LOGGER DE DEBUG ---
exports.app.use((req, res, next) => {
    console.log(">>> HIT APP:", req.method, req.originalUrl);
    next();
});
// --- 3. ARQUIVOS ESTÁTICOS ---
const caminhoUploads = path_1.default.resolve(process.cwd(), 'uploads');
const landingPagesPath = path_1.default.resolve(process.cwd(), "src", "config", "imagemLandingPages");
const catPagesPath = path_1.default.resolve(process.cwd(), "src", "config", "cat");
const staticOptions = {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Accept-Ranges', 'bytes');
    }
};
exports.app.use('/api/uploads/videos', express_1.default.static(path_1.default.join(caminhoUploads, 'videos'), staticOptions));
exports.app.use('/api/uploads/images', express_1.default.static(path_1.default.join(caminhoUploads, 'images'), staticOptions));
exports.app.use('/api/imagemLandingPages', express_1.default.static(landingPagesPath, staticOptions));
exports.app.use('/api/cat', express_1.default.static(catPagesPath, staticOptions));
// --- 4. ROTAS DE PAGAMENTO (AGORA O REQ.BODY VAI FUNCIONAR) ---
exports.app.use('/api', routerPayment_1.default);
routerPayment_1.default.post('/webhook/mercadopago', PaymentController_1.default.handleMercadoPagoWebhook);
// --- DEFINIÇÃO DAS ROTAS (ORGANIZADAS POR FUNCIONALIDADE) ---
/** * 1. SEGURANÇA E ACESSO
 */
exports.app.use('/api/auth', authRoutes_1.default);
exports.app.use('/api/permision', routerPermissao_1.routerPermissao);
exports.app.use('/api/role', routerRole_1.routerRoles);
exports.app.use('/api/users', routerUser_1.default);
/** * 2. MARKETPLACE DE SERVIÇOS
 */
exports.app.use('/api/servicos', routerServico_1.default); // CRUD de serviços geral
exports.app.use('/api/servicos/candidato', routerServicoCandidatura_1.default); // Candidaturas de prestadores
exports.app.use('/api/servicos/ofertas', routerServicoOferta_1.default);
exports.app.use('/api/servicos/solicitacoes', routerServicoSolicitacao_1.default);
exports.app.use('/api/vitrine', routerVitrine_1.default);
/** * 3. GESTÃO CONDOMINIAL
 */
exports.app.use('/api/aviso', routerAviso_1.default);
exports.app.use('/api/condominio', routerCondominio_1.default);
exports.app.use('/api/encomendas', routerEncomenda_1.default);
exports.app.use('/api/notificacoes', routerNotificacao_1.default); // Removi o /api/ para manter seu padrão anterior, ajuste se necessário
exports.app.use('/api/pagamentos', routerPagamento_1.default);
/** * 4. PRODUTOS E VENDAS (E-COMMERCE)
 */
exports.app.use('/api/categorias', routerCategory_1.default);
exports.app.use('/api/custumer', routerCustumer_1.routerCustumer);
exports.app.use('/api/menu', routerMenu_1.default);
exports.app.use('/api/order', routerOrder_1.routerOrder);
exports.app.use('/api/orderItem', routerOrderItem_1.routerOrderItem);
exports.app.use('/api/produtos/lojas', routerProduto_1.default);
/** * 5. CONTEÚDO E CONFIGURAÇÃO DO SITE
 */
exports.app.use('/api/content', routerContent_1.routerContent);
exports.app.use('/api/home', routerSecao_1.routerSecao);
exports.app.use('/api/home-config', routerSiteConfig_1.routerSiteConfig);
exports.app.use('/api/pages', routerPages_1.default);
exports.app.use('/api/admin', routerAdmin_1.default);
exports.app.use('/api/lojas', routerStore_1.default);
exports.app.use('/api/uploads', routerUpload_1.default);
exports.app.use('/api', (0, routermakeViews_1.makeViewsRouter)(data_source_1.AppDataSource));
exports.app.use('/api', routerPrestador_1.default);
exports.app.use('/api', routerServicoAdmin_1.default); // Rotas gerais de admin de serviços
exports.app.use('/api', routerTipoServico_1.default); // Tipos/Categorias de serviços
exports.app.use('/api', routerMarketPlace_1.default);
exports.app.use('/api', (0, routerPosts_1.makePostRouter)(data_source_1.AppDataSource));
exports.app.use("/api", (0, home_routes_1.makeHomeRouter)(data_source_1.AppDataSource));
exports.app.use('/api', routerIA_Templates_1.default);
exports.app.use("/api", routerPlans_1.default);
exports.app.use('/api/vendas', vendasRoutes_1.default);
(0, routerPosts_1.makePostRouter)(data_source_1.AppDataSource).stack.forEach((r) => {
    if (r.route) {
        console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
    }
});
exports.app.use("/api", routerAI_1.default);
exports.app.use("/api/pageLanding", routerPageLanding_1.default);
exports.app.use('/api', routerPayment_config_1.default);
exports.app.use('/api', routerPaymentGateway_1.routerGateWayLojista);
exports.app.use((err, req, res, next) => {
    console.error("CAPTURADO PELO HANDLER DE ERRO:", err.stack);
    res.status(500).json({ error: err.message });
});
