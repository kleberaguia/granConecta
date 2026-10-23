import { Request, Response } from "express";
import path from "path";
import { promises as fs, readdirSync, existsSync } from "fs";

import { TemplateGenerateUseCase } from "../services/template-v2/TemplateGenerateUseCase";
import { AIService } from "../services/AIService";
import AI_TemplateService from "../services/AI_TemplateService";
import { LayoutBaseService } from "../services/LayoutBaseService";

export class AI_TemplateController {
  private readonly PACOTE_PROFISSIONAL_PATH = path.join(
    process.cwd(),
    "src/templates/template_Profissional",
  );

  private readonly generateUseCase = new TemplateGenerateUseCase();

  public listTemplates = async (_req: Request, res: Response) => {
    try {
      if (!existsSync(this.PACOTE_PROFISSIONAL_PATH)) {
        return res.json({ success: true, templates: [] });
      }

      const nichos = readdirSync(this.PACOTE_PROFISSIONAL_PATH, {
        withFileTypes: true,
      })
        .filter((item) => item.isDirectory())
        .map((item) => item.name);

      const templates = await Promise.all(
        nichos.map(async (nicho) => {
          const caminho = path.join(this.PACOTE_PROFISSIONAL_PATH, nicho);
          const arquivos = await fs.readdir(caminho);

          const imagem = arquivos.find((file) => {
            const ext = path.extname(file).toLowerCase();
            return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
          });

          return {
            id: nicho,
            nome: nicho.replace(/_/g, " "),
            imagemUrl: imagem
              ? `/templates/template_Profissional/${encodeURIComponent(
                nicho,
              )}/${encodeURIComponent(imagem)}`
              : null,
          };
        }),
      );

      return res.json({ success: true, templates });
    } catch (error: any) {
      console.error("Erro ao listar templates:", error);

      return res.status(500).json({
        success: false,
        message: error?.message || "Erro ao listar templates",
      });
    }
  };

  public generateVariations = async (req: Request, res: Response) => {
    try {
      const {
        templateName,
        layoutEstruturaId,
        businessDescription,
        descricao,
        descricaoDoCliente,
        answers,
        pageKind,
        businessType,
        tipo,
        limit,
      } = req.body;

      const templateBase = templateName || layoutEstruturaId || "Layout-Geral";
      const description =
        businessDescription || descricaoDoCliente || descricao || "";

      const explicitPageKind =
        pageKind === "loja" || pageKind === "servico"
          ? pageKind
          : businessType === "loja" || businessType === "servico"
            ? businessType
            : undefined;

      const resolvedPageKind =
        explicitPageKind || (tipo === "PRESTADOR" ? "servico" : "loja");

      const isService = resolvedPageKind === "servico";

      // Precisa existir antes do bloco de IA, pois é usado em `limit: total`.
      const total = Math.max(1, Math.min(Number(limit || 4), 5));

      console.log("[GERADOR] DADOS PARA ESCOLHA DO LAYOUT-BASE", {
        pageKind: resolvedPageKind,

        categoryName:
          req.body?.categoryName ||
          req.body?.categoria ||
          req.body?.categoriaNome ||
          req.body?.category?.name ||
          req.body?.category?.nome,

        businessSegment:
          req.body?.businessSegment ||
          req.body?.segmento ||
          req.body?.ramo,

        businessType: req.body?.businessType,
        tipo: req.body?.tipo,

        descricao: req.body?.descricao,
        descricaoDoCliente: req.body?.descricaoDoCliente,
        businessDescription: req.body?.businessDescription,

        answers: req.body?.answers,
      });

      const serviceLayoutBase = isService
        ? LayoutBaseService.resolveServiceBase({
          categoryName:
            req.body?.categoryName ||
            req.body?.categoria ||
            req.body?.categoriaNome ||
            req.body?.category?.name ||
            req.body?.category?.nome,

          businessSegment:
            req.body?.businessSegment ||
            req.body?.segmento ||
            req.body?.ramo,

          businessType:
            req.body?.businessType ||
            req.body?.tipo,

          descricao: description,
        })
        : null;

      if (isService) {
        console.log("[GERADOR] Layout-base de serviço selecionado:", {
          id: serviceLayoutBase?.id || null,
          name: serviceLayoutBase?.name || null,
          segmentFamily: serviceLayoutBase?.segmentFamily || null,
        });
      }

      if (isService && serviceLayoutBase) {
        try {
          console.log(
            "[GERADOR] Gerando variações por layout-base:",
            {
              layoutBaseId: serviceLayoutBase.id,
              layoutBaseName: serviceLayoutBase.name,
              segmentFamily: serviceLayoutBase.segmentFamily,
            },
          );

          const aiResult =
            await AIService.generateServiceLayoutVariations({
              layoutBase: serviceLayoutBase,

              description,

              businessName:
                req.body?.businessName ||
                req.body?.storeName ||
                req.body?.nome ||
                "",

              businessSegment:
                req.body?.businessSegment ||
                req.body?.categoryName ||
                req.body?.categoria ||
                req.body?.categoriaNome ||
                serviceLayoutBase.segmentFamily,

              businessType:
                req.body?.businessType ||
                req.body?.tipo ||
                "servico",

              answers:
                req.body?.answers || {},

              businessMaterials:
                req.body?.businessMaterials ||
                req.body?.landingMaterials ||
                {},

              colors:
                req.body?.colors ||
                req.body?.brandColors ||
                {},

              limit: total,
            });

          const variations =
            (aiResult?.variations || []).map(
              (variation: any, index: number) => ({
                ...variation,

                variationIndex: index + 1,
                index: index + 1,
                selectedVariationIndex: index,

                pageKind: "servico",

                layoutBaseId:
                  serviceLayoutBase.id,

                layoutBaseName:
                  serviceLayoutBase.name,

                segmentFamily:
                  serviceLayoutBase.segmentFamily,

                generationMode:
                  "layout-base-ai",

                templateName:
                  templateName || "servicos",

                layoutEstruturaId:
                  layoutEstruturaId || "servicos",

                copy: {
                  ...(variation?.copy || {}),

                  aboutTitle:
                    variation?.copy?.aboutTitle ||
                    `Sobre ${req.body?.businessName ||
                    req.body?.storeName ||
                    "o profissional"
                    }`,

                  aboutText:
                    variation?.copy?.aboutText ||
                    description ||
                    answers?.destaque ||
                    "Atendimento profissional.",
                },
              }),
            );

          console.log(
            "[GERADOR] Variações IA criadas:",
            {
              layoutBaseId:
                serviceLayoutBase.id,
              quantidade: variations.length,
              ids: variations.map(
                (variation: any) =>
                  variation?.id,
              ),
            },
          );

          return res.json({
            success: true,

            generationMode:
              "layout-base-ai",

            layoutBase: {
              id: serviceLayoutBase.id,
              name: serviceLayoutBase.name,
              segmentFamily:
                serviceLayoutBase.segmentFamily,
            },

            variations,
          });
        } catch (error: any) {
          console.error(
            "[GERADOR] Falha ao gerar variações com layout-base:",
            error?.message || error,
          );

          console.warn(
            "[GERADOR] Mantendo fallback antigo de variações.",
          );
        }
      }

      const baseVariations = [
        {
          id: "v2-luxury-editorial",
          name: "Premium Editorial",
          preset: "LUXURY_EDITORIAL",
          layoutMode: "luxury-editorial",
          description: "Visual elegante, premium e institucional.",
          heroTitle: isService
            ? "Atendimento profissional com confiança"
            : "Uma vitrine premium para vender melhor",
          heroSubtitle: description || "Layout comercial com destaque para conversão.",
          primaryCta: isService ? "Solicitar orçamento" : "Ver produtos",
          secondaryCta: "WhatsApp",
          sections: isService
            ? ["hero", "services", "benefits", "about", "testimonials", "faq", "contact"]
            : ["hero", "categories", "featured", "products", "benefits", "about", "testimonials", "faq", "contact"],
          colors: {
            background: "#f8f3ec",
            surface: "#ffffff",
            primary: "#17110d",
            secondary: "#7c5f46",
            accent: "#b8860b",
            text: "#17110d",
            mutedText: "#6f6259",
          },
          templateName: templateBase,
          layoutEstruturaId: templateBase,
        },
        {
          id: "v2-marketplace-grid",
          name: "Marketplace Comercial",
          preset: "MARKETPLACE_GRID",
          layoutMode: "marketplace-grid",
          description: "Layout direto, moderno e focado em catálogo.",
          heroTitle: isService
            ? "Serviços claros para contratar rápido"
            : "Produtos organizados para compra rápida",
          heroSubtitle: description || "Ideal para mostrar opções, ofertas e contato direto.",
          primaryCta: isService ? "Ver serviços" : "Ver produtos",
          secondaryCta: "Falar no chat",
          sections: isService
            ? ["header", "hero", "services", "benefits", "faq", "contact", "footer"]
            : ["topbar", "header", "hero", "products", "categories", "featured", "benefits", "contact", "footer"],
          colors: {
            background: "#f8fafc",
            surface: "#ffffff",
            primary: "#0f172a",
            secondary: "#334155",
            accent: "#2563eb",
            text: "#0f172a",
            mutedText: "#64748b",
          },
          templateName: templateBase,
          layoutEstruturaId: templateBase,
        },
        {
          id: "v2-conversion-sales",
          name: "Conversão Forte",
          preset: "CONVERSION_SALES",
          layoutMode: "conversion-sales",
          description: "Mais impacto, CTA forte e foco em ação.",
          heroTitle: isService
            ? "Solicite orçamento sem complicação"
            : "Ofertas, combos e produtos em destaque",
          heroSubtitle: description || "Estrutura pensada para gerar clique, desejo e contato.",
          primaryCta: isService ? "Solicitar orçamento" : "Aproveitar desconto real",
          secondaryCta: "WhatsApp",
          sections: isService
            ? ["header", "hero", "contact", "services", "benefits", "faq", "footer"]
            : ["header", "hero", "featured", "products", "benefits", "contact", "faq", "footer"],
          colors: {
            background: "#020617",
            surface: "#ffffff",
            primary: "#111827",
            secondary: "#374151",
            accent: "#facc15",
            text: "#111827",
            mutedText: "#64748b",
          },
          templateName: templateBase,
          layoutEstruturaId: templateBase,
        },
        {
          id: "v2-minimal-premium",
          name: "Minimal Premium",
          preset: "MINIMAL_PREMIUM",
          layoutMode: "minimal-premium",
          description: "Visual limpo, sofisticado e objetivo.",
          heroTitle: isService
            ? "Profissionalismo em cada atendimento"
            : "Uma experiência limpa para sua marca",
          heroSubtitle: description || "Ideal para negócios que querem clareza e elegância.",
          primaryCta: isService ? "Fale conosco" : "Ver produtos",
          secondaryCta: "Lista de desejo",
          sections: isService
            ? ["header", "hero", "about", "services", "benefits", "faq", "contact", "footer"]
            : ["header", "hero", "categories", "products", "about", "benefits", "faq", "contact", "footer"],
          colors: {
            background: "#ffffff",
            surface: "#f8fafc",
            primary: "#111827",
            secondary: "#475569",
            accent: "#111827",
            text: "#111827",
            mutedText: "#64748b",
          },
          templateName: templateBase,
          layoutEstruturaId: templateBase,
        },
        {
          id: "v2-magazine-story",
          name: "Magazine Story",
          preset: "MAGAZINE_STORY",
          layoutMode: "magazine-story",
          description: "Mais editorial, visual e narrativo.",
          heroTitle: isService
            ? "Uma apresentação profissional que transmite confiança"
            : "Conte a história da sua marca e venda melhor",
          heroSubtitle: description || "Layout com storytelling, destaque visual e seções comerciais.",
          primaryCta: isService ? "Ver serviço" : "Conhecer vitrine",
          secondaryCta: "Falar no chat",
          sections: isService
            ? ["header", "hero", "about", "services", "featured", "testimonials", "faq", "contact", "footer"]
            : ["header", "hero", "about", "categories", "products", "featured", "testimonials", "benefits", "faq", "contact", "footer"],
          colors: {
            background: "#fbf7ef",
            surface: "#ffffff",
            primary: "#2f241c",
            secondary: "#8a6b4f",
            accent: "#c08a3e",
            text: "#2f241c",
            mutedText: "#76685f",
          },
          templateName: templateBase,
          layoutEstruturaId: templateBase,
        },
      ];

      const variations = baseVariations.slice(0, total).map((variation, index) => ({
        ...variation,
        variationIndex: index + 1,
        index: index + 1,
        selectedVariationIndex: index,
        copy: {
          aboutTitle: `Sobre ${templateBase}`,
          aboutText:
            description ||
            answers?.destaque ||
            "Uma página profissional criada para apresentar seu negócio com clareza.",
        },
      }));

      return res.json({
        success: true,
        variations,
      });
    } catch (error: any) {
      console.error("Erro ao gerar variações V2:", error);

      return res.status(500).json({
        success: false,
        message: error?.message || "Erro ao gerar variações",
      });
    }
  };

  public generate = async (req: Request, res: Response) => {
    try {
      console.log("GENERATE V2 - REQUEST RECEBIDO", {
        templateName: req.body?.templateName,
        layoutEstruturaId: req.body?.layoutEstruturaId,
        tipo: req.body?.tipo,
        businessName: req.body?.businessName || req.body?.storeName,
        businessSegment: req.body?.businessSegment,
        variationIndex:
          req.body?.variationIndex ??
          req.body?.selectedVariationIndex ??
          req.body?.selectedVariation?.variationIndex ??
          req.body?.selectedVariation?.index ??
          req.body?.aiVariation?.variationIndex ??
          req.body?.aiVariation?.index,
        hasProducts: Array.isArray(req.body?.products),
        hasServices: Array.isArray(req.body?.services),
      });

      const result = await this.generateUseCase.execute(req.body);

      return res.json(result);
    } catch (error: any) {
      console.error("ERRO NO GENERATE V2:", error);

      return res.status(500).json({
        success: false,
        error: error?.message || "Erro interno ao gerar template",
        message: error?.message || "Erro interno ao gerar template",
      });
    }
  };

  public generateStyle = async (req: Request, res: Response) => {
    try {
      const { descricao, strategy } = req.body;

      if (!descricao || typeof descricao !== "string") {
        return res.status(400).json({
          success: false,
          message: "descricao é obrigatória",
        });
      }

      const style = await AIService.generateStyle(
        descricao,
        strategy || {
          label: "Estratégia padrão de design",
        },
      );

      return res.json({
        success: true,
        style,
      });
    } catch (error: any) {
      console.error("Erro ao gerar estilo com IA:", error);

      return res.status(500).json({
        success: false,
        message: error?.message || "Erro ao gerar estilo com IA",
      });
    }
  };

  public generateVariation = async (_req: Request, res: Response) => {
    return res.status(410).json({
      success: false,
      message:
        "generateVariation foi substituído pelo fluxo template-v2. Use o endpoint generate com variationIndex.",
    });
  };

  public previewTemplate = async (_req: Request, res: Response) => {
    return res.status(410).json({
      success: false,
      message:
        "previewTemplate legado foi desativado neste controller. Use generate do template-v2.",
    });
  };

  public saveTemplate = async (req: Request, res: Response) => {
    try {
      const { storeId, usuarioId, tipo, html, settings } = req.body;

      if (!storeId && !usuarioId) {
        return res.status(400).json({
          success: false,
          message: "storeId ou usuarioId é obrigatório",
        });
      }

      if (!html || typeof html !== "string") {
        return res.status(400).json({
          success: false,
          message: "html é obrigatório para salvar o template",
        });
      }

      console.log("SAVE TEMPLATE REQUEST:", {
        storeId,
        usuarioId,
        tipo,
        hasHtml: Boolean(html),
        htmlLength: String(html || "").length,
      });

      const store = await AI_TemplateService.saveStoreProgress(
        storeId || null,
        {
          ...req.body,
          usuarioId,
          tipo: tipo || "empreendedor",
          settings,
          pageHtmlDraft: html,
          pageHtmlPublished: html,
          publish: true,
        },
        null,
      );

      return res.json({
        success: true,
        store,
      });
    } catch (error: any) {
      console.error("Erro ao salvar template:", error);

      return res.status(500).json({
        success: false,
        message: error?.message || "Erro ao salvar template",
      });
    }
  };
}