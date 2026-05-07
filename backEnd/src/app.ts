import cors from 'cors';

import express from 'express';
import path from 'path';


// --- IMPORTS DAS ROTAS ---

// Administrativo e Configurações
import PaymentController from './controller/PaymentController';
import { routerPermissao } from './routers/routerPermissao';
import { routerRoles } from './routers/routerRole';
import routerPages from './routers/routerPages';
import { routerSiteConfig } from './routers/routerSiteConfig';
import routerUploadImg from './routers/routerUpload';

// Autenticação e Usuários
import routerAuth from './routers/authRoutes';
import routerUser from './routers/routerUser';

// E-commerce e Conteúdo
import { routerContent } from './routers/routerContent';
import { routerCustumer } from './routers/routerCustumer';
import routerMenu from './routers/routerMenu';
import { routerOrder } from './routers/routerOrder';
import { routerOrderItem } from './routers/routerOrderItem';
import routerProduto from './routers/routerProduto';
import { routerSecao } from './routers/routerSecao';

// Gestão Condominial
import routerAviso from './routers/routerAviso';
import routerCondominio from './routers/routerCondominio';
import routerEncomenda from './routers/routerEncomenda';
import routerNotificacao from './routers/routerNotificacao';
import routerPagamento from './routers/routerPagamento';

// Marketplace de Serviços
import routerServico from './routers/routerServico';
import routerServicoAdmin from './routers/routerServicoAdmin';
import routerServicoCandidatura from './routers/routerServicoCandidatura';
import routerServicoOferta from './routers/routerServicoOferta';
import routerServicoSolicitacao from './routers/routerServicoSolicitacao';
import routerTipoServico from './routers/routerTipoServico';
import routerVitrine from './routers/routerVitrine';
import routerPrestador from './routers/routerPrestador';
import routerAdmin from './routers/routerAdmin';
import routerPayment from './routers/routerPayment';
import routerCategory from './routers/routerCategory';
import routerStore from './routers/routerStore';

import { makeHomeRouter } from './routers/home.routes';
import { AppDataSource } from './config/data-source';
import { makePostRouter } from './routers/routerPosts';
import { makeViewsRouter } from './routers/routermakeViews';
import routerAI from './routers/routerAI';
import routerPageLanding from './routers/routerPageLanding';
import routerIA_Templates from './routers/routerIA_Templates';
import routerMarketplace from './routers/routerMarketPlace';
import routerPaymentconfig from './routers/routerPayment-config'

import vendasRoutes from './routers/vendasRoutes'
import { routerGateWayLojista } from './routers/routerPaymentGateway';
import routerPlan from './routers/routerPlans';
export const app = express();
//app.use(cors({ origin: '*' }));

app.use(cors({
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
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// --- 2. LOGGER DE DEBUG ---
app.use((req, res, next) => {
  console.log(">>> HIT APP:", req.method, req.originalUrl);
  next();
});

// --- 3. ARQUIVOS ESTÁTICOS ---
const caminhoUploads = path.resolve(process.cwd(), 'uploads');
const landingPagesPath = path.resolve(process.cwd(), "src", "config", "imagemLandingPages");
const catPagesPath = path.resolve(process.cwd(), "src", "config", "cat");
const staticOptions = {
  setHeaders: (res: any) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Accept-Ranges', 'bytes');
  }
};


app.use('/api/uploads/videos', express.static(path.join(caminhoUploads, 'videos'), staticOptions));
app.use('/api/uploads/images', express.static(path.join(caminhoUploads, 'images'), staticOptions));
app.use('/api/imagemLandingPages', express.static(landingPagesPath, staticOptions));
app.use('/api/cat', express.static(catPagesPath, staticOptions));

// --- 4. ROTAS DE PAGAMENTO (AGORA O REQ.BODY VAI FUNCIONAR) ---
app.use('/api', routerPayment);
routerPayment.post('/webhook/mercadopago', PaymentController.handleMercadoPagoWebhook);
// --- DEFINIÇÃO DAS ROTAS (ORGANIZADAS POR FUNCIONALIDADE) ---

/** * 1. SEGURANÇA E ACESSO 
 */
app.use('/api/auth', routerAuth);
app.use('/api/permision', routerPermissao);
app.use('/api/role', routerRoles);
app.use('/api/users', routerUser);

/** * 2. MARKETPLACE DE SERVIÇOS 
 */

app.use('/api/servicos', routerServico);          // CRUD de serviços geral
app.use('/api/servicos/candidato', routerServicoCandidatura); // Candidaturas de prestadores
app.use('/api/servicos/ofertas', routerServicoOferta);
app.use('/api/servicos/solicitacoes', routerServicoSolicitacao);
app.use('/api/vitrine', routerVitrine);

/** * 3. GESTÃO CONDOMINIAL 
 */
app.use('/api/aviso', routerAviso);
app.use('/api/condominio', routerCondominio);
app.use('/api/encomendas', routerEncomenda);
app.use('/api/notificacoes', routerNotificacao); // Removi o /api/ para manter seu padrão anterior, ajuste se necessário
app.use('/api/pagamentos', routerPagamento);

/** * 4. PRODUTOS E VENDAS (E-COMMERCE) 
 */
app.use('/api/categorias', routerCategory);
app.use('/api/custumer', routerCustumer);
app.use('/api/menu', routerMenu);
app.use('/api/order', routerOrder);
app.use('/api/orderItem', routerOrderItem);

app.use('/api/produtos/lojas', routerProduto);

/** * 5. CONTEÚDO E CONFIGURAÇÃO DO SITE 
 */
app.use('/api/content', routerContent);
app.use('/api/home', routerSecao);
app.use('/api/home-config', routerSiteConfig);
app.use('/api/pages', routerPages);


app.use('/api/admin', routerAdmin)
app.use('/api/lojas', routerStore)


app.use('/api/uploads', routerUploadImg)

app.use('/api', makeViewsRouter(AppDataSource))
app.use('/api', routerPrestador)
app.use('/api', routerServicoAdmin);             // Rotas gerais de admin de serviços
app.use('/api', routerTipoServico);              // Tipos/Categorias de serviços

app.use('/api', routerMarketplace)
app.use('/api', makePostRouter(AppDataSource));
app.use("/api", makeHomeRouter(AppDataSource));
app.use('/api', routerIA_Templates)
app.use("/api", routerPlan);

app.use('/api/vendas', vendasRoutes)

makePostRouter(AppDataSource).stack.forEach((r: any) => {
  if (r.route) {
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});
app.use("/api", routerAI);
app.use("/api/pageLanding", routerPageLanding);
app.use('/api', routerPaymentconfig)
app.use('/api', routerGateWayLojista)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("CAPTURADO PELO HANDLER DE ERRO:", err.stack);
  res.status(500).json({ error: err.message });
});
