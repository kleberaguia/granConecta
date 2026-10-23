import cors from 'cors';
import express from 'express';
import path from 'path';

// Administrativo e ConfiguraÃ§Ãµes

import { routerPermissao } from './routers/routerPermissao';
import { routerRoles } from './routers/routerRole';
import routerPages from './routers/routerPages';
import { routerSiteConfig } from './routers/routerSiteConfig';
import routerUploadImg from './routers/routerUpload';

// AutenticaÃ§Ã£o e UsuÃ¡rios
import routerAuth from './routers/authRoutes';
import routerUser from './routers/routerUser';

// E-commerce e ConteÃºdo
import { routerContent } from './routers/routerContent';
import { routerCustumer } from './routers/routerCustumer';
import routerMenu from './routers/routerMenu';
import { routerOrder } from './routers/routerOrder';
import { routerOrderItem } from './routers/routerOrderItem';
import routerProduto from './routers/routerProduto';
import { routerSecao } from './routers/routerSecao';

// GestÃ£o Condominial
import routerAviso from './routers/routerAviso';
import routerCondominio from './routers/routerCondominio';
import routerEncomenda from './routers/routerEncomenda';
import routerNotificacao from './routers/routerNotificacao';
import routerPagamento from './routers/routerPagamento';

// Marketplace de ServiÃ§os
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

import routerIA_Templates from './routers/routerIA_Templates';
import routerMarketplace from './routers/routerMarketPlace';
import routerPaymentconfig from './routers/routerPayment-config';

import vendasRoutes from './routers/vendasRoutes';
import { routerGateWayLojista } from './routers/routerPaymentGateway';
import routerPlan from './routers/routerPlans';
import routerAgenda from './routers/routerAgenda';

import fs, { existsSync } from "fs";
import routerChat from './routers/routerChat';
import routerImageTemplate from './routers/routerImageTemplate';
import routerImagePresetTemplate from './routers/routerImagePresetTemplate';
import routerDocumentoLegal from './routers/routerDocumentosLegais';
import routerStoreChatbotKnowledge from './routers/routerStoreChatbotKnowledge';
import routerChatHuman from "./routers/routerChatHuman";
import { criarMarketingRouter } from "./routers/marketingRouter";
import { authMiddleware } from "./middlewares/authMiddleware";
import { isAdminMiddleware } from "./middlewares/isAdminMiddleware";
import routerAgendaDisponivel from './routers/AgendaDisponibilidadeRouter';
import { criarCentralComercialRouter } from "./routers/CentralComercialRouter";
import criarBusinessTeamRouter from './routers/BusinessTeamRouter';
import businessCatalogRoutes from "./routers/businessCatalogRoutes";
import routerClassificado from './routers/routerClassificado';


export const app = express();

const postRouter = makePostRouter(AppDataSource);
const routerMarketing = criarMarketingRouter({
  autenticar: authMiddleware,
  somenteAdmin: isAdminMiddleware,
});

const routerCentralComercial = criarCentralComercialRouter({
  autenticar: authMiddleware,
});

// app.use(cors({
//   origin: [
//     'http://localhost:5173',
//     'http://localhost:5174',
//     "https://dev.admin.granconecta.net.br",
//     "https://dev.granconecta.net.br",
//     "https://dev.api.granconecta.net.br",
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));


app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',

    // DEV
    'https://dev.admin.granconecta.net.br',
    'https://dev.granconecta.net.br',
    'https://dev.api.granconecta.net.br',

    // PRODUÇÃO
    'https://granconecta.net.br',
    'https://www.granconecta.net.br',
    'https://api.granconecta.net.br',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Conversation-Token',]
}));


app.use("/api", routerImagePresetTemplate);

app.get("/api/templates", (req, res) => {
  try {
    const normalize = (value: any) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const tipoFiltro = normalize(req.query.tipo).toUpperCase();
    const pageKindFiltro = normalize(
      req.query.tipoPagina ||
      req.query.tipoStore ||
      req.query.businessType ||
      req.query.templateType
    );

    const pastaBase = existsSync(
      path.join(process.cwd(), "dist", "templates", "template_Profissional")
    )
      ? path.join(process.cwd(), "dist", "templates", "template_Profissional")
      : path.join(process.cwd(), "src", "templates", "template_Profissional");

    const apiBaseTemplates =
      process.env.NODE_ENV === "local"
        ? `http://localhost:${Number(process.env.PORT || 3000)}`
        : process.env.NODE_ENV === "production"
          ? "https://api.granconecta.net.br"
          : "https://dev.api.granconecta.net.br";

    const templates: any[] = [];

    const readJsonContent = (folder: string) => {
      let jsonContent = "";

      try {
        const jsonFiles = fs
          .readdirSync(folder)
          .filter(f => f.toLowerCase().endsWith(".json"));

        for (const jsonFile of jsonFiles) {
          try {
            jsonContent += " " + fs.readFileSync(path.join(folder, jsonFile), "utf8");
          } catch { }
        }
      } catch { }

      return normalize(jsonContent);
    };

    const resolveTemplateProfile = (
      grupo: string,
      categoria: string,
      arquivo: string,
      pastaCategoria: string
    ) => {
      const grupoNormalizado = normalize(grupo);
      const fullText = normalize(`${grupo} ${categoria} ${arquivo}`) + " " + readJsonContent(pastaCategoria);

      const lojaSignals = [
        "loja",
        "lojas",
        "store",
        "ecommerce",
        "e-commerce",
        "produto",
        "produtos",
        "catalogo",
        "vitrine de produtos",
        "carrinho",
        "comprar",
        "add-to-cart",
        "preco",
        "price",
        "joia",
        "joias",
        "joalheria",
        "moda",
        "roupa",
        "calcado",
        "sapato",
        "auto pecas",
        "delivery"
      ];

      const servicoSignals = [
        "servico",
        "servicos",
        "prestador",
        "prestacao",
        "profissional",
        "agenda",
        "agendamento",
        "orcamento",
        "solicitar orcamento",
        "galeria de servicos",
        "portfolio",
        "antes e depois",
        "atendimento tecnico"
      ];

      const hasLojaSignal = lojaSignals.some(word => fullText.includes(word));
      const hasServicoSignal = servicoSignals.some(word => fullText.includes(word));

      const isLoja = grupoNormalizado === "lojas" || (grupoNormalizado !== "servicos" && hasLojaSignal);
      const isServico = grupoNormalizado === "servicos" || (!isLoja && hasServicoSignal);
      const businessType = isLoja ? "loja" : "servico";
      const templateKind = isLoja ? "LOJA" : "SERVICO";

      return {
        templateKind,
        businessType,
        tipoPagina: businessType,
        tipoStore: businessType,
        layoutKind: isLoja ? "product-store" : "service-gallery",
        templateType: isLoja ? "ecommerce" : "servico",
        audienceType: isLoja ? "EMPREENDEDOR" : "PRESTADOR",
        folderGroup: isLoja ? "lojas" : "servicos",
        hasLojaSignal,
        hasServicoSignal
      };
    };

    const shouldInclude = (profile: any) => {
      if (["loja", "lojas", "store", "ecommerce", "produto", "produtos"].includes(pageKindFiltro)) {
        return profile.businessType === "loja";
      }

      if (["servico", "servicos", "serviÃ§o", "prestador", "service"].includes(pageKindFiltro)) {
        return profile.businessType === "servico";
      }

      if (tipoFiltro === "PRESTADOR") return profile.businessType === "servico";
      if (tipoFiltro === "EMPREENDEDOR") return profile.businessType === "loja";

      return true;
    };

    if (!existsSync(pastaBase)) {
      return res.json({ templates: [] });
    }

    const grupos = fs
      .readdirSync(pastaBase)
      .filter(grupo => fs.statSync(path.join(pastaBase, grupo)).isDirectory());

    grupos.forEach((grupo) => {
      const pastaGrupo = path.join(pastaBase, grupo);

      fs.readdirSync(pastaGrupo).forEach((categoria) => {
        const pastaCategoria = path.join(pastaGrupo, categoria);
        if (!fs.statSync(pastaCategoria).isDirectory()) return;

        fs.readdirSync(pastaCategoria).forEach((arquivo) => {
          if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(arquivo)) return;

          const stats = fs.statSync(path.join(pastaCategoria, arquivo));
          const profile = resolveTemplateProfile(grupo, categoria, arquivo, pastaCategoria);

          if (!shouldInclude(profile)) return;

          templates.push({
            id: `${profile.folderGroup}/${categoria}/${arquivo}`,
            categoria,
            grupo: profile.folderGroup,
            nome: arquivo,
            templateKind: profile.templateKind,
            businessType: profile.businessType,
            tipoPagina: profile.tipoPagina,
            tipoStore: profile.tipoStore,
            layoutKind: profile.layoutKind,
            templateType: profile.templateType,
            audienceType: profile.audienceType,
            updatedAt: stats.mtimeMs,
            imagemUrl: `${apiBaseTemplates}/api/templates/template_Profissional/${profile.folderGroup}/${encodeURIComponent(categoria)}/${encodeURIComponent(arquivo)}`,
            url: `${apiBaseTemplates}/api/templates/template_Profissional/${profile.folderGroup}/${encodeURIComponent(categoria)}/${encodeURIComponent(arquivo)}`,
          });
        });
      });
    });

    res.json({ templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar templates" });
  }
});

const caminhosTemplates = existsSync(
  path.join(process.cwd(), "dist", "templates")
)
  ? path.join(process.cwd(), "dist", "templates")
  : path.join(process.cwd(), "src", "templates");


const routerBusinessTeam = criarBusinessTeamRouter({
  autenticar: authMiddleware,
});


app.use(
  "/api/templates",
  express.static(caminhosTemplates)
);

app.use(
  express.json({
    limit: "50mb",
    verify: (request, _response, buffer) => {
      (
        request as typeof request & {
          rawBody?: Buffer;
        }
      ).rawBody = Buffer.from(buffer);
    },
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  }),
);

app.use("/api", routerPlan);

app.use("/api", routerMarketing);
app.use("/api", routerCentralComercial);
app.use("/api", routerBusinessTeam);

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads")),
);

app.use("/api/chat", routerChat);
app.use("/api/chat", routerChatHuman);


app.use((req, res, next) => {
  next();
});

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
app.use('/api/documentos-legais', routerDocumentoLegal)
app.use('/api', routerPayment);

app.use('/api', routerAgendaDisponivel)
app.use('/api', routerAgenda);
app.use('/api/auth', routerAuth);
app.use('/api/permision', routerPermissao);
app.use('/api/role', routerRoles);
app.use('/api/users', routerUser);

app.use('/api/servicos', routerServico);
app.use('/api/servicos/candidato', routerServicoCandidatura);
app.use('/api/servicos/ofertas', routerServicoOferta);
app.use('/api/servicos/solicitacoes', routerServicoSolicitacao);
app.use('/api/vitrine', routerVitrine);

app.use('/api/aviso', routerAviso);
app.use('/api/condominio', routerCondominio);
app.use('/api/encomendas', routerEncomenda);
app.use('/api/notificacoes', routerNotificacao);
app.use('/api/pagamentos', routerPagamento);

app.use('/api/categorias', routerCategory);
app.use('/api/custumer', routerCustumer);
app.use('/api/menu', routerMenu);
app.use('/api/order', routerOrder);
app.use('/api/orderItem', routerOrderItem);
app.use('/api/produtos/lojas', routerProduto);

app.use('/api', routerImageTemplate);

app.use('/api/content', routerContent);
app.use('/api/home', routerSecao);
app.use('/api/home-config', routerSiteConfig);
app.use('/api/pages', routerPages);
app.use("/api", routerClassificado);

app.use('/api/admin', routerAdmin);
app.use('/api/lojas', routerStore);
app.use('/api', routerStoreChatbotKnowledge)
app.use('/api/uploads', routerUploadImg);

app.use('/api/business-catalog', businessCatalogRoutes)


app.use('/api', makeViewsRouter(AppDataSource));

// âœ… ROTAS DO MURAL / POSTS
app.use('/api', postRouter);


//postRouter.stack.forEach((r: any) => {


app.use('/api', routerPrestador);
app.use('/api', routerServicoAdmin);
app.use('/api', routerTipoServico);

app.use('/api', routerMarketplace);
app.use("/api", makeHomeRouter(AppDataSource));
app.use('/api', routerIA_Templates);


app.use('/api/vendas', vendasRoutes);

app.use("/api", routerAI);
app.use('/api', routerPaymentconfig);
app.use('/api', routerGateWayLojista);
app.use('/templates', express.static(path.join(process.cwd(), 'src/templates')));

app.use((err: any, req: any, res: any, next: any) => {
  console.error("CAPTURADO PELO HANDLER DE ERRO:", err.stack);
  res.status(500).json({ error: err.message });
});
//})