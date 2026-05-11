import { Request, Response } from "express";
import path from "path";
import { existsSync, promises as fs } from "fs";
import AITemplateService from '../services/AI_TemplateService';
import { AIService } from "../services/AIService";

// Importação dos Componentes
import { VitrineComponent } from "../templates/components/VitrineComponent";
import { ServiceComponent } from "../templates/components/ServiceComponent";
import { HeroComponent } from "../templates/components/HeroComponent";
import { FooterComponent } from "../templates/components/FooterComponent";
import { TestimonialsComponent } from "../templates/components/TestimonialsComponent";
import { WhatsAppFloatingComponent } from "../templates/components/WhatsAppFloatingComponent";
import { LogosSectionComponent } from "../templates/components/LogosSectionComponent";
import { FinalCTAComponent } from "../templates/components/FinalCTAComponent";
import { FAQComponent } from "../templates/components/FAQComponent";
import { FeaturesSectionComponent } from "../templates/components/FeaturesSectionComponent";
import { Estilo } from "../models/EstiloModels";
import { AppDataSource } from "../config/data-source";
import { Store } from "../models/StoreModels";
import { HeaderComponent } from "../templates/components/HeaderComponent";
import { SidebarComponent } from "../templates/components/SidebarComponent";
import { generatePreset } from "../presets/layoutPresets";
import { GalleryComponent } from "../templates/components/GalleryComponent";
import { Category } from "../models/CategoryModels";


const fotosPadraoGaleria = [
    "https://images.unsplash.com/photo-1600585154340-be6161a0c?q=80&w=800",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800"
];
const storeLayoutMemory = new Map<string, Record<string, any>>();
const estiloRepository = AppDataSource.getRepository(Estilo);
const storeRepository = AppDataSource.getRepository(Store);
const generateSlug = (text: string) => {
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

const db = AppDataSource.getRepository(Category);

async function getTipoFinal(categoriaTipo: string | null, descricaoDoCliente?: string) {
    if (categoriaTipo) return categoriaTipo; // já vem definido

    if (!descricaoDoCliente) return "GENÉRICO";

    // Busca categoria cujo campo keywords contenha a descrição
    const categoria = await db
        .createQueryBuilder("c")
        .where("LOWER(c.name) LIKE :desc", { desc: `%${descricaoDoCliente.toLowerCase()}%` })
        .getOne();

    return categoria?.tipo || "GENÉRICO"; // fallback
}


export class AI_TemplateController {
   // private readonly MASTER_PATH = path.join(process.cwd(), "src", "templates", "master");
   private readonly MASTER_PATH = path.join(
        process.cwd(), 
        existsSync(path.join(process.cwd(), "dist")) ? "dist/templates/master" : "src/templates/master"
    );

    private getFotosPorNicho(area: string): string[] {
        const nichos: Record<string, string[]> = {
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
        const chaveEncontrada = Object.keys(nichos).find(key =>
            textoBusca.includes(key) || key.split(' ').some(word => textoBusca.includes(word))
        );

        const lista = (chaveEncontrada ? nichos[chaveEncontrada] : null) || [
            "https://images.unsplash.com/photo-1454165833767-027ffea9e778?q=80&w=800",
            "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800"
        ];

        return [...lista].sort(() => Math.random() - 0.5);
    }

    private getDesignTokens(strategy: any) {
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
        } else if (area.includes("psico") || area.includes("limpeza")) {
            tokens.borderRadius = "40px";
            tokens.buttonWeight = "font-semibold";
            tokens.shadow = "shadow-xl shadow-primary/20";
            tokens.buttonTransform = "hover:scale-105";
        }
        return tokens;
    }



    public generate = async (req: Request, res: Response) => {
        try {
            console.log('req body:', req.body);

            const {
                descricaoDoCliente,
                itensExistentes,
                usuarioId,
                condominioId,
                modo,
                tipo = "EMPREENDEDOR",
                categoriaNome,
                categoriaTipo,
                categoriaId,
                storeId
            } = req.body;

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
            const strategy = await AIService.extractLayoutConfig(descricaoDoCliente, tipoFinal);

            const tokens = this.getDesignTokens(strategy);

            const [aiDataRaw, aiStyleRaw] = await Promise.all([
                AIService.generateTemplateData(descricaoDoCliente, strategy),
                AIService.generateStyle(descricaoDoCliente, strategy)
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

            const htmlFinal = await this.renderPage(
                modo,
                aiData,
                estilo,
                tailwindScript,
                itensExistentes,
                strategy
            );

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
                const isEmpreendedorSemCategoria =
                    tipoUpper === "EMPREENDEDOR" && !categoriaId;

                let existingStore;

                // 🔁 mantém sua lógica original
                if (isEmpreendedorSemCategoria) {
                    existingStore = await storeRepository.findOne({
                        where: { usuarioId }
                    });
                } else {
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

                } else {
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

        } catch (error: any) {
            console.error("Erro Crítico no Generate:", error);
            return res.status(500).json({ error: error.message });
        }
    };

    public generateOutroEstilo = async (req: Request, res: Response) => {
        try {
            const { descricaoDoCliente, itensExistentes, storeId, usuarioId } = req.body;
            if (!descricaoDoCliente) return res.status(400).json({ error: "Descrição necessária." });

            const memoryKey = storeId || usuarioId || 'temp-shuffle';
            const strategy = await AIService.extractLayoutConfig(descricaoDoCliente);
            const tokens = this.getDesignTokens(strategy);

            const [aiDataRaw, aiStyleRaw] = await Promise.all([
                AIService.generateTemplateData(descricaoDoCliente, strategy),
                AIService.generateStyle(descricaoDoCliente, strategy)
            ]);

            const escolhasAleatorias = this.performSmartPick(memoryKey, aiDataRaw, strategy);
            const aiData = { ...this.applyFallbacks(aiDataRaw, strategy), layout_choices: escolhasAleatorias };
            const estilo = await this.saveStyle(aiStyleRaw, strategy, descricaoDoCliente);

            const tailwindScript = this.buildTailwindConfig(estilo, tokens, aiData, itensExistentes);
            const htmlFinal = await this.renderPage('base', aiData, estilo, tailwindScript, itensExistentes, strategy);
            return res.json({ html: htmlFinal, estilo });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    };

    private applyFallbacks(raw: any, strategy: any) {

        console.log('raw?.nome_marca ', raw?.nome_marca)
        const fotosDoTema = this.getFotosPorNicho(strategy.area || 'serviços');
        return {
            ...raw,
            nome_marca: raw?.nome_marca || "GranConecta Business",
            bgUrl: raw?.bgUrl || fotosDoTema[0] || (strategy.defaultImg),
            galeria: (raw?.galeria && raw.galeria.length > 0) ? raw.galeria : fotosDoTema,
            beneficios: raw?.beneficios || [],
            depoimentos: (raw?.depoimentos || []).map((d: any) => ({
                nome: d?.nome || d?.name || "Cliente",
                texto: d?.texto || d?.text || "Excelente serviço!",
                cargo: d?.cargo || d?.role || "Satisfeito"
            })),
            faq: raw?.faq || [],
            telefone: raw?.telefone || "5511999999999"
        };
    }

    private async saveStyle(raw: any, strategy: any, desc: string) {
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

    private buildTailwindConfig(estilo: any, tokens: any, aiData: any, itens: any) {
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

    private async renderPage(modo: string, aiData: any, estilo: any, tw: string, itens: any, strategy: any) {
        if (modo === "preset") return generatePreset().replace("</head>", `${tw}</head>`);

        const tokens = this.getDesignTokens(strategy);
        const isLoja = strategy.area?.toLowerCase().includes("EMPREENDEDOR") || strategy.area?.toLowerCase().includes("venda");

        // 🔥 Passando aiData como 5º argumento para suportar títulos MJV/Artstones
        const baseContent = isLoja
            ? VitrineComponent(itens, aiData.layout_choices.vitrine_variant, estilo, tokens, aiData)
            : ServiceComponent(itens, aiData.layout_choices.services_variant, estilo, tokens, aiData);

        const sidebarHtml = SidebarComponent({
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

        const htmlBase = await fs.readFile(path.join(this.MASTER_PATH, "structure.html"), "utf-8");

        return htmlBase
            .replace("{{MASTER_CSS}}", tw)
            .replace(/{{NOME_MARCA}}/g, aiData.nome_marca)
            .replace("{{HEADER_SECTION}}", HeaderComponent({
                nomeMarca: aiData.nome_marca,
                variant: aiData.layout_choices.header_variant,
                estilo,
                tokens,
                aiData
            }))
            .replace("{{HERO_SECTION}}", HeroComponent(aiData, aiData.layout_choices.hero_variant, estilo, tokens))
            .replace("{{FEATURES_SECTION}}", FeaturesSectionComponent(aiData.beneficios, aiData.layout_choices.features_variant, estilo, tokens, aiData))
            .replace("{{DYNAMIC_CONTENT}}", dynamicContentWithLayout)
            .replace("{{GALLERY_SECTION}}", GalleryComponent(aiData.galeria, aiData.layout_choices.gallery_variant, estilo, tokens, aiData))
            .replace("{{TESTIMONIALS_SECTION}}", TestimonialsComponent(aiData.depoimentos, aiData.layout_choices.testimonials_variant, estilo, tokens))
            .replace("{{FAQ_SECTION}}", FAQComponent(aiData.faq, aiData.layout_choices.faq_variant, estilo, tokens, aiData))
            .replace("{{FINAL_CTA_SECTION}}", FinalCTAComponent(aiData, aiData.layout_choices.cta_variant, estilo, tokens))
            .replace("{{FOOTER_CONTENT}}", FooterComponent(aiData, aiData.layout_choices.footer_variant, estilo, tokens))
            .replace("{{LOGOS_PROVA_SOCIAL}}", LogosSectionComponent(aiData.parceiros_logos, aiData.layout_choices.logos_variant, estilo, tokens))
            .replace("</body>", `${WhatsAppFloatingComponent(aiData.telefone)}</body>`);
    }

    private performSmartPick(key: string, aiDataRaw: any, strategy: any) {
        if (!storeLayoutMemory.has(key)) storeLayoutMemory.set(key, {});
        const mem = storeLayoutMemory.get(key)!;
        const smartPick = (categoria: string, opcoes: string[]) => {
            const opcoesValidas = opcoes.filter(opt => !(strategy.forbiddenVariants || []).includes(opt));
            if (!mem[categoria] || mem[categoria].length === 0) mem[categoria] = [...opcoesValidas].sort(() => Math.random() - 0.5);
            let escolhida = aiDataRaw?.layout_choices?.[categoria];
            if (!escolhida || !opcoesValidas.includes(escolhida)) escolhida = (mem[categoria] as string[]).pop();
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

    private async saveStore(
        nomeMarca: string,
        usuarioId: string,
        condominioId: string,
        html: string,
        estilo: any,
        tipo: string,
        existingId?: string
    ) {
        // 1. Garantir que o nome não seja nulo (fallback caso a IA falhe)
        const nomeFinal = nomeMarca || "Minha Loja";

        // 2. Montar o objeto usando apenas as propriedades REAIS da sua Entity Store
        // Baseado no seu log de erro, o campo correto é 'name' e 'condominio_id'
        const storeData = {
            name: nomeFinal,             // 👈 Corrigido: Removido store_name, deixado apenas name
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
        } else {
            // Se não existe, cria
            console.log("Criando nova loja para o usuário:", usuarioId);
            const newStore = storeRepository.create({
                ...storeData,
                slug: `loja-${usuarioId.substring(0, 5)}-${Math.floor(Math.random() * 1000)}`
            });
            return await storeRepository.save(newStore);
        }
    }

    async salvarCustomizacao(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!req.body.usuarioId) return res.status(400).json({ error: "usuarioId obrigatório" });
            const result = await AITemplateService.saveStoreProgress((!id || id === "undefined") ? null : id, req.body, req.files);
            return res.json({ success: true, data: result });
        } catch (error: any) { return res.status(500).json({ error: error.message }); }
    }

    public listTemplates = async (req: Request, res: Response) => {
        const templates = [{ id: "modern_dark", nome: "Modern Dark Premium", vibe: "Tech/SaaS" }, { id: "luxury_gold", nome: "Luxury Boutique", vibe: "Joias/Luxo" }];
        return res.json(templates);
    }

    public refreshComponent = async (req: Request, res: Response) => {
        try {
            const { componentName, aiData, estilo, variant, items } = req.body;
            const strategy = await AIService.extractLayoutConfig(aiData.subtitulo || aiData.titulo || "");
            const tokens = this.getDesignTokens(strategy);

            const variantsRegistry: Record<string, string[]> = {
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
                case 'hero': html = HeroComponent(aiData, chosenVariant, estilo, tokens); break;
                case 'header': html = HeaderComponent({ nomeMarca: aiData.nome_marca, variant: chosenVariant, estilo, tokens, aiData }); break;
                case 'sidebar': html = SidebarComponent({ aiData, variant: chosenVariant, estilo, tokens }) || ""; break;
                case 'services': html = ServiceComponent(items || [], chosenVariant, estilo, tokens, aiData); break;
                case 'vitrine': html = VitrineComponent(items || [], chosenVariant, estilo, tokens, aiData); break;
                case 'gallery': html = GalleryComponent(aiData.galeria || [], chosenVariant, estilo, tokens, aiData); break;
                case 'testimonials': html = TestimonialsComponent(aiData.depoimentos || [], chosenVariant, estilo, tokens); break;
                case 'cta': html = FinalCTAComponent(aiData, chosenVariant, estilo, tokens); break;
                case 'logos': html = LogosSectionComponent(aiData.parceiros_logos || [], chosenVariant, estilo, tokens); break;
                case 'features': html = FeaturesSectionComponent(aiData.beneficios || [], chosenVariant, estilo, tokens, aiData); break;
                case 'faq': html = FAQComponent(aiData.faq || [], chosenVariant, estilo, tokens, aiData); break;
                case 'footer': html = FooterComponent(aiData, chosenVariant, estilo, tokens); break;
                default: return res.status(400).json({ error: "Componente não suportado" });
            }

            return res.json({ html, newVariant: chosenVariant, component: componentName });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    };
}