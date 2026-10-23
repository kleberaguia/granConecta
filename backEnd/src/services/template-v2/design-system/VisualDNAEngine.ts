import type { RenderContext } from "../render-engine/renderTypes";

export type VisualArchetype =
  | "luxury-editorial"
  | "sacred-minimal"
  | "magazine-story"
  | "boutique-commerce"
  | "cinematic-story"
  | "modern-conversion";

export type HeadlineTreatment =
  | "editorial-break"
  | "mixed-scale"
  | "accent-word"
  | "quiet-luxury"
  | "cinematic-stack"
  | "commerce-bold";

export type VisualDNA = {
  seed: number;
  variationSeed: number;
  archetype: VisualArchetype;
  headlineTreatment: HeadlineTreatment;
  typographyPair: string;
  heroComposition: string;
  imageTreatment: string;
  contentPosition: string;
  sectionRhythm: string;
  decoration: string;
  cardStyle: string;
  radiusStyle: "sharp" | "soft" | "pill";
  motionStyle: "quiet" | "editorial" | "cinematic" | "energetic";
  navigationStyle: string;
  footerStyle: string;
};

type VisualDNAProfile = {
  headlines: readonly HeadlineTreatment[];
  typography: readonly string[];
  heroes: readonly string[];
  images: readonly string[];
  contentPositions: readonly string[];
  rhythms: readonly string[];
  decorations: readonly string[];
  cards: readonly string[];
  radius: readonly VisualDNA["radiusStyle"][];
  motion: readonly VisualDNA["motionStyle"][];
  navigation: readonly string[];
  footer: readonly string[];
};

const ARCHETYPES: readonly VisualArchetype[] = [
  "luxury-editorial",
  "sacred-minimal",
  "magazine-story",
  "boutique-commerce",
  "cinematic-story",
  "modern-conversion",
];

/**
 * Visual DNA V4 — coerência por direção de arte.
 *
 * Antes, cada eixo visual era sorteado de forma praticamente independente.
 * Isso permitia combinações tecnicamente válidas, porém artisticamente
 * incoerentes, como:
 *
 * luxury-editorial + commerce-bold + glass + quiet
 *
 * Agora o arquétipo define uma "família de escolhas compatíveis".
 * A variação continua determinística e diversa, mas dentro de um vocabulário
 * visual coerente.
 */
const PROFILES: Record<VisualArchetype, VisualDNAProfile> = {
  "luxury-editorial": {
    headlines: ["editorial-break", "mixed-scale", "quiet-luxury", "accent-word"],
    typography: [
      "cormorant-inter",
      "playfair-inter",
      "playfair-montserrat",
      "georgia-inter",
    ],
    heroes: [
      "asymmetric-overlap",
      "editorial-split",
      "cinematic-cover",
      "portrait-stage",
    ],
    images: [
      "portrait-dominant",
      "layered-duo",
      "editorial-crop",
      "full-bleed",
    ],
    contentPositions: ["left", "right"],
    rhythms: ["airy", "editorial", "alternating"],
    decorations: ["oversized-type", "fine-lines", "editorial-number", "frames"],
    cards: ["borderless-editorial", "minimal-line", "soft-elevated"],
    radius: ["sharp", "soft"],
    motion: ["editorial", "cinematic", "quiet"],
    navigation: ["minimal", "transparent", "editorial"],
    footer: ["editorial-large", "minimal", "institutional"],
  },

  "sacred-minimal": {
    headlines: ["quiet-luxury", "editorial-break", "accent-word"],
    typography: [
      "cormorant-inter",
      "playfair-inter",
      "georgia-inter",
    ],
    heroes: [
      "minimal-stage",
      "editorial-split",
      "portrait-stage",
      "cinematic-cover",
    ],
    images: [
      "clean-landscape",
      "portrait-dominant",
      "editorial-crop",
      "full-bleed",
    ],
    contentPositions: ["left", "center", "right"],
    rhythms: ["airy", "storytelling", "editorial"],
    decorations: ["minimal", "fine-lines", "soft-orbs", "frames"],
    cards: ["minimal-line", "borderless-editorial", "soft-elevated"],
    radius: ["soft", "sharp"],
    motion: ["quiet", "editorial"],
    navigation: ["minimal", "transparent"],
    footer: ["minimal", "institutional", "editorial-large"],
  },

  "magazine-story": {
    headlines: ["editorial-break", "mixed-scale", "cinematic-stack", "accent-word"],
    typography: [
      "playfair-inter",
      "cormorant-inter",
      "georgia-inter",
      "playfair-montserrat",
    ],
    heroes: [
      "magazine-overlap",
      "portrait-stage",
      "asymmetric-overlap",
      "cinematic-cover",
    ],
    images: [
      "layered-duo",
      "portrait-dominant",
      "editorial-crop",
      "full-bleed",
    ],
    contentPositions: ["left", "right"],
    rhythms: ["storytelling", "editorial", "alternating"],
    decorations: ["editorial-number", "oversized-type", "fine-lines", "frames"],
    cards: ["borderless-editorial", "sharp-grid", "minimal-line"],
    radius: ["sharp", "soft"],
    motion: ["editorial", "cinematic"],
    navigation: ["editorial", "transparent", "minimal"],
    footer: ["editorial-large", "institutional"],
  },

  "boutique-commerce": {
    headlines: ["mixed-scale", "accent-word", "commerce-bold", "editorial-break"],
    typography: [
      "montserrat-cormorant",
      "playfair-montserrat",
      "inter-cormorant",
      "playfair-inter",
    ],
    heroes: [
      "product-collage",
      "editorial-split",
      "asymmetric-overlap",
      "minimal-stage",
    ],
    images: [
      "product-detail",
      "layered-duo",
      "editorial-crop",
      "portrait-dominant",
    ],
    contentPositions: ["left", "right", "center"],
    rhythms: ["alternating", "airy", "dense-commerce"],
    decorations: ["frames", "soft-orbs", "fine-lines", "minimal"],
    cards: ["soft-elevated", "glass", "sharp-grid", "minimal-line"],
    radius: ["soft", "pill", "sharp"],
    motion: ["editorial", "energetic", "quiet"],
    navigation: ["floating", "minimal", "editorial"],
    footer: ["commerce", "minimal", "institutional"],
  },

  "cinematic-story": {
    headlines: ["cinematic-stack", "mixed-scale", "editorial-break", "quiet-luxury"],
    typography: [
      "playfair-inter",
      "cormorant-inter",
      "montserrat-cormorant",
      "playfair-montserrat",
    ],
    heroes: [
      "cinematic-cover",
      "bottom-left-cover",
      "asymmetric-overlap",
      "magazine-overlap",
    ],
    images: [
      "full-bleed",
      "editorial-crop",
      "portrait-dominant",
      "layered-duo",
    ],
    contentPositions: ["left", "right"],
    rhythms: ["cinematic", "storytelling", "airy"],
    decorations: ["oversized-type", "editorial-number", "minimal", "fine-lines"],
    cards: ["borderless-editorial", "glass", "minimal-line"],
    radius: ["sharp", "soft"],
    motion: ["cinematic", "editorial"],
    navigation: ["transparent", "minimal"],
    footer: ["editorial-large", "institutional", "minimal"],
  },

  "modern-conversion": {
    headlines: ["commerce-bold", "mixed-scale", "accent-word", "cinematic-stack"],
    typography: [
      "montserrat-cormorant",
      "inter-cormorant",
      "playfair-montserrat",
    ],
    heroes: [
      "cinematic-cover",
      "editorial-split",
      "product-collage",
      "minimal-stage",
    ],
    images: [
      "full-bleed",
      "clean-landscape",
      "product-detail",
      "editorial-crop",
    ],
    contentPositions: ["left", "center", "right"],
    rhythms: ["dense-commerce", "alternating", "cinematic"],
    decorations: ["minimal", "frames", "soft-orbs", "fine-lines"],
    cards: ["sharp-grid", "soft-elevated", "glass", "minimal-line"],
    radius: ["soft", "sharp", "pill"],
    motion: ["energetic", "cinematic", "editorial"],
    navigation: ["floating", "minimal", "transparent"],
    footer: ["commerce", "institutional", "minimal"],
  },
};

export class VisualDNAEngine {
  static resolve(context: RenderContext): VisualDNA {
    const request = context.request as any;

    /**
     * Usa o identificador mais estável disponível.
     * raw.* entra como fallback porque algumas origens da geração mantêm
     * storeId/lojaId apenas no payload original normalizado.
     */
    const businessKey =
      [
        request.storeId,
        request.lojaId,
        request.businessId,
        request.usuarioId,
        request.raw?.storeId,
        request.raw?.lojaId,
        request.raw?.businessId,
        request.raw?.usuarioId,
        context.request.businessName,
        context.request.businessSegment,
      ]
        .filter(Boolean)
        .join("|") || "granconecta";

    const variationKey =
      [
        context.variation.variationIndex,
        context.variation.name,
        context.variation.family,
        context.variation.heroStyle,
        context.variation.productStyle,
        context.request.variationIndex,
      ]
        .filter(
          (value) =>
            value !== undefined &&
            value !== null &&
            value !== "",
        )
        .join("|") || "variation";

    const seed = hash(businessKey);
    const variationSeed = hash(`${businessKey}|${variationKey}`);

    const semantic = normalize(
      [
        context.request.businessSegment,
        context.visualContext.categoryName,
        context.request.descricao,
      ]
        .filter(Boolean)
        .join(" "),
    );

    const preferred = preferredArchetypes(
      semantic,
      context.request.pageKind,
    );

    const archetype = pick(
      preferred.length ? preferred : ARCHETYPES,
      variationSeed,
      0,
    );

    const profile = PROFILES[archetype];

    /**
     * Cada eixo continua variando por seed/salt, mas somente dentro do
     * repertório permitido para o arquétipo escolhido.
     */
    return {
      seed,
      variationSeed,
      archetype,
      headlineTreatment: pick(profile.headlines, variationSeed, 1),
      typographyPair: pick(profile.typography, variationSeed, 2),
      heroComposition: pick(profile.heroes, variationSeed, 3),
      imageTreatment: pick(profile.images, variationSeed, 4),
      contentPosition: pick(profile.contentPositions, variationSeed, 5),
      sectionRhythm: pick(profile.rhythms, variationSeed, 6),
      decoration: pick(profile.decorations, variationSeed, 7),
      cardStyle: pick(profile.cards, variationSeed, 8),
      radiusStyle: pick(profile.radius, variationSeed, 9),
      motionStyle: pick(profile.motion, variationSeed, 10),
      navigationStyle: pick(profile.navigation, variationSeed, 11),
      footerStyle: pick(profile.footer, variationSeed, 12),
    };
  }
}

function preferredArchetypes(
  text: string,
  pageKind: string,
): VisualArchetype[] {
  if (pageKind === "servico") {
    if (
      /(psicopedagog|psicolog|terapia|saude|saúde|consulta|educa|mentoria|aula)/.test(
        text,
      )
    ) {
      return [
        "sacred-minimal",
        "magazine-story",
        "cinematic-story",
        "modern-conversion",
      ];
    }

    return [
      "modern-conversion",
      "cinematic-story",
      "magazine-story",
      "sacred-minimal",
    ];
  }

  /**
   * Religioso/joias/artesanato recebe preferência editorial.
   * Boutique Commerce continua possível, porém não domina o resultado.
   */
  if (
    /(joia|semijoia|terco|terço|religios|catolic|católic|devoc|sagrado|moda|boutique|artesan)/.test(
      text,
    )
  ) {
    return [
      "luxury-editorial",
      "sacred-minimal",
      "magazine-story",
      "cinematic-story",
      "boutique-commerce",
    ];
  }

  if (/(academ|fitness|treino|crossfit|esport)/.test(text)) {
    return [
      "modern-conversion",
      "cinematic-story",
      "magazine-story",
    ];
  }

  if (
    /(imovel|imóvel|arquitet|construtor|decoracao|decoração)/.test(
      text,
    )
  ) {
    return [
      "cinematic-story",
      "luxury-editorial",
      "magazine-story",
      "sacred-minimal",
    ];
  }

  if (
    /(comida|lanche|hamburg|pizza|doce|bolo|acai|açaí|bebida|cardapio|cardápio)/.test(
      text,
    )
  ) {
    return [
      "boutique-commerce",
      "modern-conversion",
      "cinematic-story",
    ];
  }

  return [...ARCHETYPES];
}

function pick<T>(
  items: readonly T[],
  seed: number,
  salt: number,
): T {
  const mixed = Math.abs(
    (seed ^ Math.imul(salt + 17, 2654435761)) | 0,
  );

  return items[mixed % items.length]!;
}

function hash(value: string): number {
  let h = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

function normalize(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}