"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_TemplateController = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const AI_TemplateService_1 = __importDefault(require("../services/AI_TemplateService"));
const AIService_1 = require("../services/AIService");
// Importação dos Componentes
const VitrineComponent_1 = require("../templates/components/VitrineComponent");
const ServiceComponent_1 = require("../templates/components/ServiceComponent");
const HeroComponent_1 = require("../templates/components/HeroComponent");
const FooterComponent_1 = require("../templates/components/FooterComponent");
const TestimonialsComponent_1 = require("../templates/components/TestimonialsComponent");
const WhatsAppFloatingComponent_1 = require("../templates/components/WhatsAppFloatingComponent");
const LogosSectionComponent_1 = require("../templates/components/LogosSectionComponent");
const FinalCTAComponent_1 = require("../templates/components/FinalCTAComponent");
const FAQComponent_1 = require("../templates/components/FAQComponent");
const FeaturesSectionComponent_1 = require("../templates/components/FeaturesSectionComponent");
const EstiloModels_1 = require("../models/EstiloModels");
const data_source_1 = require("../config/data-source");
const StoreModels_1 = require("../models/StoreModels");
const HeaderComponent_1 = require("../templates/components/HeaderComponent");
const SidebarComponent_1 = require("../templates/components/SidebarComponent");
const layoutPresets_1 = require("../presets/layoutPresets");
const GalleryComponent_1 = require("../templates/components/GalleryComponent");
const CategoryModels_1 = require("../models/CategoryModels");
const fotosPadraoGaleria = [
    "https://images.unsplash.com/photo-1600585154340-be6161a0c?q=80&w=800",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800"
];
const storeLayoutMemory = new Map();
const estiloRepository = data_source_1.AppDataSource.getRepository(EstiloModels_1.Estilo);
const storeRepository = data_source_1.AppDataSource.getRepository(StoreModels_1.Store);
const generateSlug = (text) => {
    return (text || 'loja')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};
const db = data_source_1.AppDataSource.getRepository(CategoryModels_1.Category);
async function getTipoFinal(categoriaTipo, descricaoDoCliente) {
    if (categoriaTipo)
        return categoriaTipo; // já vem definido
    if (!descricaoDoCliente)
        return "GENÉRICO";
    // Busca categoria cujo campo keywords contenha a descrição
    const categoria = await db
        .createQueryBuilder("c")
        .where("LOWER(c.name) LIKE :desc", { desc: `%${descricaoDoCliente.toLowerCase()}%` })
        .getOne();
    return categoria?.tipo || "GENÉRICO"; // fallback
}
class AI_TemplateController {
    constructor() {
        // private readonly MASTER_PATH = path.join(process.cwd(), "src", "templates", "master");
        this.MASTER_PATH = path_1.default.join(process.cwd(), (0, fs_1.existsSync)(path_1.default.join(process.cwd(), "dist")) ? "dist/templates/master" : "src/templates/master");
        this.generate = async (req, res) => {
            try {
                console.log('req body:', req.body);
                const { descricaoDoCliente, itensExistentes, usuarioId, condominioId, modo, tipo = "EMPREENDEDOR", categoriaNome, categoriaTipo, categoriaId, storeId } = req.body;
                // 🔒 VALIDAÇÕES ESSENCIAIS
                if (!descricaoDoCliente) {
                    return res.status(400).json({ error: "Descrição é obrigatória" });
                }
                if (!usuarioId) {
                    return res.status(400).json({ error: "usuarioId é obrigatório" });
                }
                const tipoUpper = (tipo || "EMPREENDEDOR").toUpperCase();
                // 🧠 IA (mantida)
                const tipoFinal = await getTipoFinal(categoriaTipo, descricaoDoCliente.toLowerCase());
                const strategy = await AIService_1.AIService.extractLayoutConfig(descricaoDoCliente, tipoFinal);
                const tokens = this.getDesignTokens(strategy);
                const [aiDataRaw, aiStyleRaw] = await Promise.all([
                    AIService_1.AIService.generateTemplateData(descricaoDoCliente, strategy),
                    AIService_1.AIService.generateStyle(descricaoDoCliente, strategy)
                ]);
                const memoryKey = usuarioId ? `user-${usuarioId}` : 'global-session';
                const escolhasAleatorias = this.performSmartPick(memoryKey, aiDataRaw, strategy);
                const aiData = {
                    ...this.applyFallbacks(aiDataRaw, strategy),
                    layout_choices: escolhasAleatorias,
                    nome_marca: aiDataRaw.nome_marca || categoriaNome
                };
                const estilo = await this.saveStyle(aiStyleRaw, strategy, descricaoDoCliente);
                const tailwindScript = this.buildTailwindConfig(estilo, tokens, aiData, itensExistentes);
                const htmlFinal = await this.renderPage(modo, aiData, estilo, tailwindScript, itensExistentes, strategy);
                let store;
                // =========================================================
                // 🔵 PRIORIDADE 1: STORE ID (UPDATE DIRETO)
                // =========================================================
                if (storeId) {
                    const existing = await storeRepository.findOneBy({ id: storeId });
                    if (!existing) {
                        return res.status(404).json({ error: "Loja não encontrada" });
                    }
                    if (existing.usuarioId !== usuarioId) {
                        return res.status(403).json({ error: "Sem permissão para editar esta loja" });
                    }
                    await storeRepository.update(storeId, {
                        name: aiData.nome_marca,
                        pageHtmlDraft: htmlFinal,
                        estilo,
                        pageSpecDraft: aiData,
                        condominio_id: condominioId
                    });
                    store = await storeRepository.findOneBy({ id: storeId });
                }
                // =========================================================
                // 🟡 PRIORIDADE 2: REGRA EXISTENTE + MELHORADA
                // =========================================================
                else {
                    const isEmpreendedorSemCategoria = tipoUpper === "EMPREENDEDOR" && !categoriaId;
                    let existingStore;
                    // 🔁 mantém sua lógica original
                    if (isEmpreendedorSemCategoria) {
                        existingStore = await storeRepository.findOne({
                            where: { usuarioId }
                        });
                    }
                    else {
                        existingStore = await storeRepository.findOne({
                            where: {
                                usuarioId,
                                tipo: tipoUpper,
                                categoriaid: categoriaId || null
                            }
                        });
                    }
                    if (existingStore) {
                        // 🔄 UPDATE SEMPRE (remove o 400 antigo)
                        await storeRepository.update(existingStore.id, {
                            name: aiData.nome_marca,
                            pageHtmlDraft: htmlFinal,
                            estilo,
                            pageSpecDraft: aiData,
                            condominio_id: condominioId
                        });
                        store = await storeRepository.findOneBy({ id: existingStore.id });
                    }
                    else {
                        // 🆕 CREATE
                        store = await storeRepository.save({
                            name: aiData.nome_marca,
                            slug: generateSlug(aiData.nome_marca) + '-' + Date.now(),
                            usuarioId,
                            condominio_id: condominioId,
                            pageHtmlDraft: htmlFinal,
                            estilo,
                            tipo: tipoUpper,
                            categoriaid: categoriaId || null,
                            pageSpecDraft: aiData
                        });
                    }
                }
                return res.json({ html: htmlFinal, estilo, store });
            }
            catch (error) {
                console.error("Erro Crítico no Generate:", error);
                return res.status(500).json({ error: error.message });
            }
        };
        this.generateOutroEstilo = async (req, res) => {
            try {
                const { descricaoDoCliente, itensExistentes, storeId, usuarioId } = req.body;
                if (!descricaoDoCliente)
                    return res.status(400).json({ error: "Descrição necessária." });
                const memoryKey = storeId || usuarioId || 'temp-shuffle';
                const strategy = await AIService_1.AIService.extractLayoutConfig(descricaoDoCliente);
                const tokens = this.getDesignTokens(strategy);
                const [aiDataRaw, aiStyleRaw] = await Promise.all([
                    AIService_1.AIService.generateTemplateData(descricaoDoCliente, strategy),
                    AIService_1.AIService.generateStyle(descricaoDoCliente, strategy)
                ]);
                const escolhasAleatorias = this.performSmartPick(memoryKey, aiDataRaw, strategy);
                const aiData = { ...this.applyFallbacks(aiDataRaw, strategy), layout_choices: escolhasAleatorias };
                const estilo = await this.saveStyle(aiStyleRaw, strategy, descricaoDoCliente);
                const tailwindScript = this.buildTailwindConfig(estilo, tokens, aiData, itensExistentes);
                const htmlFinal = await this.renderPage('base', aiData, estilo, tailwindScript, itensExistentes, strategy);
                return res.json({ html: htmlFinal, estilo });
            }
            catch (error) {
                return res.status(500).json({ error: error.message });
            }
        };
        this.listTemplates = async (req, res) => {
            const templates = [{ id: "modern_dark", nome: "Modern Dark Premium", vibe: "Tech/SaaS" }, { id: "luxury_gold", nome: "Luxury Boutique", vibe: "Joias/Luxo" }];
            return res.json(templates);
        };
        this.refreshComponent = async (req, res) => {
            try {
                const { componentName, aiData, estilo, variant, items } = req.body;
                const strategy = await AIService_1.AIService.extractLayoutConfig(aiData.subtitulo || aiData.titulo || "");
                const tokens = this.getDesignTokens(strategy);
                const variantsRegistry = {
                    hero: ['mjv-impact', 'artstones-gallery', 'centered', 'split-right', 'full-bg', 'luxury-boutique'],
                    header: ['mjv-innovation', 'artstones-minimal', 'luxury-boutique', 'minimal-center', 'glass-float', 'floating-pill-gradient'],
                    sidebar: ['mjv-innovation-drawer', 'artstones-side-gallery', 'luxury-drawer', 'full-screen-overlay', 'dark-industrial', 'soft-blur', 'minimal-slide'],
                    services: ['mjv-innovation-grid', 'artstones-showcase', 'premium-grid', 'minimal-list'],
                    gallery: ['artstones-masonry', 'mjv-innovation-featured', 'masonry', 'grid'],
                    testimonials: ['dark-marquee', 'masonry', 'carousel'],
                    cta: ['simple', 'split', 'dark', 'glassmorphism', 'gradient-mesh'],
                    logos: ['inline', 'marquee', 'grid-box'],
                    features: ['mjv-innovation-bento', 'artstones-minimal-list', 'grid-3', 'bento-grid'],
                    faq: ['mjv-minimal-accordion', 'artstones-editorial', 'grid', 'split', 'luxury-boutique'],
                    vitrine: ['mjv-innovation-catalog', 'artstones-curated', 'luxury-boutique', 'ecommerce-grid']
                };
                const availableOptions = variantsRegistry[componentName] || [];
                const currentVariant = aiData?.layout_choices?.[`${componentName}_variant`] || variant;
                let chosenVariant = variant;
                if (!variant || variant === 'random' || variant === currentVariant) {
                    const alternatives = availableOptions.filter(v => v !== currentVariant);
                    chosenVariant = alternatives.length > 0 ? alternatives[Math.floor(Math.random() * alternatives.length)] : availableOptions[0];
                }
                let html = "";
                switch (componentName) {
                    case 'hero':
                        html = (0, HeroComponent_1.HeroComponent)(aiData, chosenVariant, estilo, tokens);
                        break;
                    case 'header':
                        html = (0, HeaderComponent_1.HeaderComponent)({ nomeMarca: aiData.nome_marca, variant: chosenVariant, estilo, tokens, aiData });
                        break;
                    case 'sidebar':
                        html = (0, SidebarComponent_1.SidebarComponent)({ aiData, variant: chosenVariant, estilo, tokens }) || "";
                        break;
                    case 'services':
                        html = (0, ServiceComponent_1.ServiceComponent)(items || [], chosenVariant, estilo, tokens, aiData);
                        break;
                    case 'vitrine':
                        html = (0, VitrineComponent_1.VitrineComponent)(items || [], chosenVariant, estilo, tokens, aiData);
                        break;
                    case 'gallery':
                        html = (0, GalleryComponent_1.GalleryComponent)(aiData.galeria || [], chosenVariant, estilo, tokens, aiData);
                        break;
                    case 'testimonials':
                        html = (0, TestimonialsComponent_1.TestimonialsComponent)(aiData.depoimentos || [], chosenVariant, estilo, tokens);
                        break;
                    case 'cta':
                        html = (0, FinalCTAComponent_1.FinalCTAComponent)(aiData, chosenVariant, estilo, tokens);
                        break;
                    case 'logos':
                        html = (0, LogosSectionComponent_1.LogosSectionComponent)(aiData.parceiros_logos || [], chosenVariant, estilo, tokens);
                        break;
                    case 'features':
                        html = (0, FeaturesSectionComponent_1.FeaturesSectionComponent)(aiData.beneficios || [], chosenVariant, estilo, tokens, aiData);
                        break;
                    case 'faq':
                        html = (0, FAQComponent_1.FAQComponent)(aiData.faq || [], chosenVariant, estilo, tokens, aiData);
                        break;
                    case 'footer':
                        html = (0, FooterComponent_1.FooterComponent)(aiData, chosenVariant, estilo, tokens);
                        break;
                    default: return res.status(400).json({ error: "Componente não suportado" });
                }
                return res.json({ html, newVariant: chosenVariant, component: componentName });
            }
            catch (error) {
                return res.status(500).json({ error: error.message });
            }
        };
    }
    getFotosPorNicho(area) {
        const nichos = {
            "limpeza": ["https://images.unsplash.com/photo-1581578731548-c64695cc6958?q=80&w=800", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800"],
            "encanador": ["https://images.unsplash.com/photo-1585704032915-c3400ca1f965?q=80&w=800", "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=800"],
            "eletricista": ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800", "https://images.unsplash.com/photo-1621905252507-b3522202ff7e?q=80&w=800"],
            "pet": ["https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800", "https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=800"],
            "manicure": ["https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800", "https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=800"],
            "pedreiro": ["https://images.unsplash.com/photo-1541913054-21b49827f3f4?q=80&w=800", "https://images.unsplash.com/photo-1504307651254-35680f3366d4?q=80&w=800"],
            "doce": ["https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800", "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800"],
            "saude": ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800", "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800"],
            "masso": ["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800"]
        };
        const textoBusca = (area || "").toLowerCase();
        const chaveEncontrada = Object.keys(nichos).find(key => textoBusca.includes(key) || key.split(' ').some(word => textoBusca.includes(word)));
        const lista = (chaveEncontrada ? nichos[chaveEncontrada] : null) || [
            "https://images.unsplash.com/photo-1454165833767-027ffea9e778?q=80&w=800",
            "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800"
        ];
        return [...lista].sort(() => Math.random() - 0.5);
    }
    getDesignTokens(strategy) {
        const area = (strategy.area || "").toLowerCase();
        let tokens = {
            borderRadius: "12px",
            buttonWeight: "font-bold",
            shadow: "shadow-lg",
            borderWidth: "1px",
            letterSpacing: "tracking-normal",
            buttonTransform: "hover:-translate-y-1",
            cardBg: "bg-white/50 backdrop-blur-md"
        };
        if (area.includes("pedreiro") || area.includes("construção") || area.includes("pintor")) {
            tokens.borderRadius = "2px";
            tokens.buttonWeight = "font-black";
            tokens.shadow = "shadow-[4px_4px_0px_rgba(0,0,0,1)]";
            tokens.borderWidth = "2px";
            tokens.letterSpacing = "tracking-tighter";
        }
        else if (area.includes("psico") || area.includes("limpeza")) {
            tokens.borderRadius = "40px";
            tokens.buttonWeight = "font-semibold";
            tokens.shadow = "shadow-xl shadow-primary/20";
            tokens.buttonTransform = "hover:scale-105";
        }
        return tokens;
    }
    applyFallbacks(raw, strategy) {
        console.log('raw?.nome_marca ', raw?.nome_marca);
        const fotosDoTema = this.getFotosPorNicho(strategy.area || 'serviços');
        return {
            ...raw,
            nome_marca: raw?.nome_marca || "GranConecta Business",
            bgUrl: raw?.bgUrl || fotosDoTema[0] || (strategy.defaultImg),
            galeria: (raw?.galeria && raw.galeria.length > 0) ? raw.galeria : fotosDoTema,
            beneficios: raw?.beneficios || [],
            depoimentos: (raw?.depoimentos || []).map((d) => ({
                nome: d?.nome || d?.name || "Cliente",
                texto: d?.texto || d?.text || "Excelente serviço!",
                cargo: d?.cargo || d?.role || "Satisfeito"
            })),
            faq: raw?.faq || [],
            telefone: raw?.telefone || "5511999999999"
        };
    }
    async saveStyle(raw, strategy, desc) {
        const estilo = estiloRepository.create({
            nome_estilo: `Estilo-${strategy.strategyKey}-${Date.now()}`,
            descricao: desc,
            body_font: strategy.fonts[0],
            body_text_color: raw?.body_text_color || strategy.colors.text,
            primary_color: raw?.primary_color || strategy.colors.primary,
            body_bg: raw?.body_bg || strategy.colors.bg,
            border_style: strategy.borderStyle || "12px",
            header_bg: raw?.header_bg || (strategy.isDark ? "bg-black/80" : "bg-white/80"),
            header_text_color: raw?.header_text_color || (strategy.isDark ? "text-white" : "text-black"),
            sidebar_bg: raw?.sidebar_bg || "bg-gray-900",
            sidebar_text_color: raw?.sidebar_text_color || "text-white"
        });
        return await estiloRepository.save(estilo);
    }
    buildTailwindConfig(estilo, tokens, aiData, itens) {
        const fontUrl = estilo.body_font.replace(/ /g, '+');
        return `
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fontUrl}:wght@300;400;600;900&display=swap">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        window.currentAiData = ${JSON.stringify(aiData)};

        function refreshSection(sectionId, componentName) {
            console.log("Solicitando refresh para:", componentName);
            window.parent.postMessage({
                type: 'REFRESH_COMPONENT',
                sectionId: sectionId,
                componentName: componentName,
                aiData: window.currentAiData
            }, '*');
        }

        window.addEventListener('message', function(event) {
            if (event.data.type === 'UPDATE_SECTION') {
                const el = document.getElementById(event.data.sectionId);
                if (!el) return;
                el.innerHTML = event.data.html;
                el.querySelectorAll('script').forEach(oldScript => {
                    const newScript = document.createElement('script');
                    newScript.text = oldScript.text;
                    document.head.appendChild(newScript).parentNode.removeChild(newScript);
                });
            }
        });

        tailwind.config = {
            theme: {
                extend: {
                    colors: { primary: "${estilo.primary_color}" },
                    borderRadius: { custom: "${tokens.borderRadius}" }
                }
            }
        }
    </script>
    <style>
        :root { --primary: ${estilo.primary_color}; }
        body { 
            background-color: ${estilo.body_bg} !important; 
            font-family: '${estilo.body_font}', sans-serif !important; 
            margin: 0; padding: 0;
        }
        .edit-overlay { 
            opacity: 0; 
            visibility: hidden; 
            transition: all 0.3s ease;
            position: absolute;
            z-index: 50;
        }
        .group:hover .edit-overlay { 
            opacity: 1 !important; 
            visibility: visible !important; 
        }
        .animate-spin-hover:hover {
            transform: rotate(180deg);
            transition: transform 0.5s ease;
        }
    </style>`;
    }
    async renderPage(modo, aiData, estilo, tw, itens, strategy) {
        if (modo === "preset")
            return (0, layoutPresets_1.generatePreset)().replace("</head>", `${tw}</head>`);
        const tokens = this.getDesignTokens(strategy);
        const isLoja = strategy.area?.toLowerCase().includes("EMPREENDEDOR") || strategy.area?.toLowerCase().includes("venda");
        // 🔥 Passando aiData como 5º argumento para suportar títulos MJV/Artstones
        const baseContent = isLoja
            ? (0, VitrineComponent_1.VitrineComponent)(itens, aiData.layout_choices.vitrine_variant, estilo, tokens, aiData)
            : (0, ServiceComponent_1.ServiceComponent)(itens, aiData.layout_choices.services_variant, estilo, tokens, aiData);
        const sidebarHtml = (0, SidebarComponent_1.SidebarComponent)({
            aiData,
            variant: aiData.layout_choices.sidebar_variant,
            estilo,
            tokens
        });
        let dynamicContentWithLayout = `<section class="max-w-7xl mx-auto px-6 py-12">${baseContent}</section>`;
        if (aiData.layout_choices.sidebar_variant?.includes('drawer') || aiData.layout_choices.sidebar_variant?.includes('industrial') || aiData.layout_choices.sidebar_variant?.includes('side-gallery')) {
            const isRight = aiData.layout_choices.sidebar_variant.includes('right') || aiData.layout_choices.sidebar_variant.includes('mjv');
            dynamicContentWithLayout = `<section class="max-w-7xl mx-auto px-6 py-12">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <aside class="lg:col-span-1 ${isRight ? 'order-2' : ''}">${sidebarHtml}</aside>
                <main class="lg:col-span-3 ${isRight ? 'order-1' : ''}">${baseContent}</main>
            </div>
        </section>`;
        }
        const htmlBase = await fs_1.promises.readFile(path_1.default.join(this.MASTER_PATH, "structure.html"), "utf-8");
        return htmlBase
            .replace("{{MASTER_CSS}}", tw)
            .replace(/{{NOME_MARCA}}/g, aiData.nome_marca)
            .replace("{{HEADER_SECTION}}", (0, HeaderComponent_1.HeaderComponent)({
            nomeMarca: aiData.nome_marca,
            variant: aiData.layout_choices.header_variant,
            estilo,
            tokens,
            aiData
        }))
            .replace("{{HERO_SECTION}}", (0, HeroComponent_1.HeroComponent)(aiData, aiData.layout_choices.hero_variant, estilo, tokens))
            .replace("{{FEATURES_SECTION}}", (0, FeaturesSectionComponent_1.FeaturesSectionComponent)(aiData.beneficios, aiData.layout_choices.features_variant, estilo, tokens, aiData))
            .replace("{{DYNAMIC_CONTENT}}", dynamicContentWithLayout)
            .replace("{{GALLERY_SECTION}}", (0, GalleryComponent_1.GalleryComponent)(aiData.galeria, aiData.layout_choices.gallery_variant, estilo, tokens, aiData))
            .replace("{{TESTIMONIALS_SECTION}}", (0, TestimonialsComponent_1.TestimonialsComponent)(aiData.depoimentos, aiData.layout_choices.testimonials_variant, estilo, tokens))
            .replace("{{FAQ_SECTION}}", (0, FAQComponent_1.FAQComponent)(aiData.faq, aiData.layout_choices.faq_variant, estilo, tokens, aiData))
            .replace("{{FINAL_CTA_SECTION}}", (0, FinalCTAComponent_1.FinalCTAComponent)(aiData, aiData.layout_choices.cta_variant, estilo, tokens))
            .replace("{{FOOTER_CONTENT}}", (0, FooterComponent_1.FooterComponent)(aiData, aiData.layout_choices.footer_variant, estilo, tokens))
            .replace("{{LOGOS_PROVA_SOCIAL}}", (0, LogosSectionComponent_1.LogosSectionComponent)(aiData.parceiros_logos, aiData.layout_choices.logos_variant, estilo, tokens))
            .replace("</body>", `${(0, WhatsAppFloatingComponent_1.WhatsAppFloatingComponent)(aiData.telefone)}</body>`);
    }
    performSmartPick(key, aiDataRaw, strategy) {
        if (!storeLayoutMemory.has(key))
            storeLayoutMemory.set(key, {});
        const mem = storeLayoutMemory.get(key);
        const smartPick = (categoria, opcoes) => {
            const opcoesValidas = opcoes.filter(opt => !(strategy.forbiddenVariants || []).includes(opt));
            if (!mem[categoria] || mem[categoria].length === 0)
                mem[categoria] = [...opcoesValidas].sort(() => Math.random() - 0.5);
            let escolhida = aiDataRaw?.layout_choices?.[categoria];
            if (!escolhida || !opcoesValidas.includes(escolhida))
                escolhida = mem[categoria].pop();
            return escolhida;
        };
        return {
            hero_variant: smartPick('hero', ['mjv-impact', 'artstones-gallery', 'split-right', 'full-bg', 'luxury-boutique']),
            header_variant: smartPick('header', ['mjv-innovation', 'artstones-minimal', 'luxury-boutique', 'minimal-center', 'glass-float', 'floating-pill-gradient']),
            sidebar_variant: smartPick('sidebar', ['mjv-innovation-drawer', 'artstones-side-gallery', 'luxury-drawer', 'dark-industrial', 'soft-blur']),
            services_variant: smartPick('services', ['mjv-innovation-grid', 'artstones-showcase', 'premium-grid', 'cards-hover']),
            features_variant: smartPick('features', ['mjv-innovation-bento', 'artstones-minimal-list', 'grid-3', 'bento-grid']),
            gallery_variant: smartPick('gallery', ['artstones-masonry', 'mjv-innovation-featured', 'masonry', 'grid']),
            testimonials_variant: smartPick('testimonials', ['carousel', 'masonry']),
            logos_variant: smartPick('logos', ['inline', 'marquee']),
            footer_variant: smartPick('footer', ['mjv-innovation-footer', 'artstones-signature', 'luxury-boutique', 'dark-premium']),
            cta_variant: smartPick('cta', ['minimal-elegant', 'glassmorphism', 'dark-premium']),
            faq_variant: smartPick('faq', ['mjv-minimal-accordion', 'artstones-editorial', 'split', 'grid']),
            vitrine_variant: smartPick('vitrine', ['mjv-innovation-catalog', 'artstones-curated', 'luxury-boutique', 'ecommerce-grid'])
        };
    }
    async saveStore(nomeMarca, usuarioId, condominioId, html, estilo, tipo, existingId) {
        // 1. Garantir que o nome não seja nulo (fallback caso a IA falhe)
        const nomeFinal = nomeMarca || "Minha Loja";
        // 2. Montar o objeto usando apenas as propriedades REAIS da sua Entity Store
        // Baseado no seu log de erro, o campo correto é 'name' e 'condominio_id'
        const storeData = {
            name: nomeFinal, // 👈 Corrigido: Removido store_name, deixado apenas name
            usuarioId: usuarioId,
            condominio_id: condominioId,
            pageHtmlDraft: html,
            layoutConfig: estilo,
            tipo: tipo.toUpperCase(),
        };
        if (existingId) {
            // Se já existe, atualiza
            console.log("Atualizando loja existente ID:", existingId);
            await storeRepository.update(existingId, storeData);
            return await storeRepository.findOne({ where: { id: existingId } });
        }
        else {
            // Se não existe, cria
            console.log("Criando nova loja para o usuário:", usuarioId);
            const newStore = storeRepository.create({
                ...storeData,
                slug: `loja-${usuarioId.substring(0, 5)}-${Math.floor(Math.random() * 1000)}`
            });
            return await storeRepository.save(newStore);
        }
    }
    async salvarCustomizacao(req, res) {
        try {
            const { id } = req.params;
            if (!req.body.usuarioId)
                return res.status(400).json({ error: "usuarioId obrigatório" });
            const result = await AI_TemplateService_1.default.saveStoreProgress((!id || id === "undefined") ? null : id, req.body, req.files);
            return res.json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.AI_TemplateController = AI_TemplateController;
