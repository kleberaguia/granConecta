import {
    DEFAULT_TEMPLATE_PALETTE,
    NormalizedTemplateRequest,
    TemplatePalette,
    TemplateSectionKey,
    TemplateVariationV2,
} from "./TemplateTypes";

const STORE_VARIATIONS: TemplateVariationV2[] = [
    {
        variationIndex: 1,
        family: "luxury-editorial",
        name: "Premium Editorial",
        description: "Visual elegante, premium e institucional para marcas que precisam vender com sofisticação.",
        heroStyle: "split",
        productStyle: "boutique",
        sectionOrder: [
            "topbar",
            "header",
            "hero",
            "categories",
            "featured",
            "products",
            "benefits",
            "about",
            "testimonials",
            "faq",
            "contact",
            "footer",
        ],
        colors: {
            background: "#f8f3ec",
            surface: "#ffffff",
            primary: "#17110d",
            secondary: "#7c5f46",
            accent: "#b8860b",
            text: "#17110d",
            mutedText: "#6f6259",
        },
        primaryAction: "open-products",
        secondaryAction: "open-whatsapp",
    },
    {
        variationIndex: 2,
        family: "marketplace-grid",
        name: "Marketplace Comercial",
        description: "Layout direto, com vitrine forte, cards claros e foco em catálogo e compra rápida.",
        heroStyle: "catalog",
        productStyle: "catalog",
        sectionOrder: [
            "header",
            "hero",
            "products",
            "categories",
            "featured",
            "benefits",
            "faq",
            "contact",
            "footer",
        ],
        colors: {
            background: "#f8fafc",
            surface: "#ffffff",
            primary: "#0f172a",
            secondary: "#334155",
            accent: "#2563eb",
            text: "#0f172a",
            mutedText: "#64748b",
        },
        primaryAction: "open-products",
        secondaryAction: "open-offers",
    },
    {
        variationIndex: 3,
        family: "conversion-sales",
        name: "Conversão e Oferta",
        description: "Visual forte, escuro, chamativo e focado em desconto, urgência, combos e ação rápida.",
        heroStyle: "dark",
        productStyle: "bold",
        sectionOrder: [
            "header",
            "hero",
            "featured",
            "products",
            "benefits",
            "testimonials",
            "contact",
            "faq",
            "footer",
        ],
        colors: {
            background: "#020617",
            surface: "#0f172a",
            primary: "#020617",
            secondary: "#1e293b",
            accent: "#facc15",
            text: "#f8fafc",
            mutedText: "#cbd5e1",
        },
        primaryAction: "open-offers",
        secondaryAction: "open-whatsapp",
    },
    {
        variationIndex: 4,
        family: "magazine-story",
        name: "Magazine Story",
        description: "Layout editorial para contar história da marca, valorizar imagem e gerar desejo.",
        heroStyle: "magazine",
        productStyle: "magazine",
        sectionOrder: [
            "header",
            "hero",
            "about",
            "categories",
            "products",
            "featured",
            "testimonials",
            "benefits",
            "faq",
            "contact",
            "footer",
        ],
        colors: {
            background: "#fbfaf7",
            surface: "#ffffff",
            primary: "#1f2937",
            secondary: "#6b7280",
            accent: "#9f1239",
            text: "#111827",
            mutedText: "#6b7280",
        },
        primaryAction: "open-products",
        secondaryAction: "add-to-wishlist",
    },
];

const SERVICE_VARIATIONS: TemplateVariationV2[] = [
    {
        variationIndex: 1,
        family: "luxury-editorial",
        name: "Autoridade Profissional",
        description: "Layout institucional para prestadores que precisam transmitir confiança e autoridade.",
        heroStyle: "split",
        productStyle: "boutique",
        sectionOrder: [
            "topbar",
            "header",
            "hero",
            "services",
            "benefits",
            "about",
            "testimonials",
            "faq",
            "contact",
            "footer",
        ],
        colors: {
            background: "#f8fafc",
            surface: "#ffffff",
            primary: "#0f172a",
            secondary: "#334155",
            accent: "#0ea5e9",
            text: "#0f172a",
            mutedText: "#64748b",
        },
        primaryAction: "request-quote",
        secondaryAction: "open-whatsapp",
    },
    {
        variationIndex: 2,
        family: "conversion-sales",
        name: "Orçamento Rápido",
        description: "Layout direto para gerar pedidos de orçamento, agendamento e contato imediato.",
        heroStyle: "dark",
        productStyle: "bold",
        sectionOrder: [
            "header",
            "hero",
            "contact",
            "services",
            "benefits",
            "faq",
            "footer",
        ],
        colors: {
            background: "#020617",
            surface: "#0f172a",
            primary: "#020617",
            secondary: "#1e293b",
            accent: "#22c55e",
            text: "#f8fafc",
            mutedText: "#cbd5e1",
        },
        primaryAction: "request-quote",
        secondaryAction: "open-chat",
    },
    {
        variationIndex: 3,
        family: "magazine-story",
        name: "História Consultiva",
        description: "Layout mais humano e consultivo para serviços que dependem de confiança.",
        heroStyle: "magazine",
        productStyle: "magazine",
        sectionOrder: [
            "header",
            "hero",
            "about",
            "services",
            "benefits",
            "testimonials",
            "faq",
            "contact",
            "footer",
        ],
        colors: {
            background: "#faf7f2",
            surface: "#ffffff",
            primary: "#1f2937",
            secondary: "#64748b",
            accent: "#7c3aed",
            text: "#111827",
            mutedText: "#64748b",
        },
        primaryAction: "request-quote",
        secondaryAction: "open-whatsapp",
    },
    {
        variationIndex: 4,
        family: "minimal-premium",
        name: "Minimal Profissional",
        description: "Layout limpo, objetivo e elegante para prestação de serviço premium.",
        heroStyle: "minimal",
        productStyle: "minimal",
        sectionOrder: [
            "header",
            "hero",
            "services",
            "about",
            "benefits",
            "faq",
            "contact",
            "footer",
        ],
        colors: {
            background: "#ffffff",
            surface: "#f8fafc",
            primary: "#111827",
            secondary: "#374151",
            accent: "#2563eb",
            text: "#111827",
            mutedText: "#6b7280",
        },
        primaryAction: "request-quote",
        secondaryAction: "open-chat",
    },
];

export class TemplateVariationResolver {
    static resolve(request: NormalizedTemplateRequest): TemplateVariationV2 {
        const variations = request.pageKind === "servico" ? SERVICE_VARIATIONS : STORE_VARIATIONS;

        const index = normalizeVariationIndex(
            request.variationIndex,
            variations.length,
        );

        const base = variations[index] ?? variations[0];
        if (!base) {
            throw new Error("Nenhuma variação disponível para este tipo de página.");
        }

        const colors = resolveColors(base.colors, request.colors);

        return {
            ...base,
            colors,
            sectionOrder: resolveSections(base.sectionOrder, request.sections),
        };


    }
}

function normalizeVariationIndex(
    variationIndex: number,
    total: number,
): number {
    const value = Number(variationIndex || 1);

    if (!Number.isFinite(value) || value <= 0) return 0;

    return Math.min(value - 1, total - 1);
}

function resolveColors(
    base?: Partial<TemplatePalette>,
    override?: any,
): Partial<TemplatePalette> {
    return {
        ...DEFAULT_TEMPLATE_PALETTE,
        ...(base || {}),
        ...(sanitizePalette(override) || {}),
    };
}

function sanitizePalette(input: any): Partial<TemplatePalette> {
    if (!input || typeof input !== "object") return {};

    const result: Partial<TemplatePalette> = {};

    const keys: Array<keyof TemplatePalette> = [
        "background",
        "surface",
        "primary",
        "secondary",
        "accent",
        "text",
        "mutedText",
    ];

    keys.forEach((key) => {
        const value = String(input?.[key] || "").trim();

        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            result[key] = value;
        }
    });

    return result;
}

function resolveSections(
    base: TemplateSectionKey[],
    requested?: string[],
): TemplateSectionKey[] {
    if (!Array.isArray(requested) || !requested.length) return [...base];

    const mapped = requested
        .map(mapSection)
        .filter((item): item is TemplateSectionKey => Boolean(item));

    if (!mapped.length) return [...base];

    const result = unique<TemplateSectionKey>([
        "header",
        "hero",
        ...mapped,
        "contact",
        "footer",
    ]) as TemplateSectionKey[];

    return result;
}

function mapSection(value: string): TemplateSectionKey | null {
    const key = normalize(value);

    const map: Record<string, TemplateSectionKey> = {
        topbar: "topbar",
        header: "header",
        hero: "hero",

        featured: "featured",
        banner: "featured",
        oferta: "featured",
        ofertas: "featured",
        promocao: "featured",
        promocoes: "featured",

        categories: "categories",
        category: "categories",
        categoria: "categories",
        categorias: "categories",

        products: "products",
        product: "products",
        produto: "products",
        produtos: "products",
        catalogo: "products",
        cardapio: "products",

        services: "services",
        service: "services",
        servico: "services",
        servicos: "services",

        benefits: "benefits",
        beneficio: "benefits",
        beneficios: "benefits",

        about: "about",
        sobre: "about",

        testimonials: "testimonials",
        depoimentos: "testimonials",

        faq: "faq",
        perguntas: "faq",
        duvidas: "faq",

        contact: "contact",
        contato: "contact",

        footer: "footer",
        rodape: "footer",
    };

    return map[key] || null;
}

function unique<T>(items: readonly T[]): T[] {
    return [...new Set<T>(items)];
}

function normalize(value: string): string {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-");
}