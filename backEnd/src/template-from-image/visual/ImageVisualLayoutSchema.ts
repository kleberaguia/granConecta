import type {
  TemplatePageMode,
  TemplateSectionType,
} from "../../templates/schema/TemplatePageSchema";

export type VisualBounds = {
  /**
   * Valores percentuais relativos à imagem inteira.
   * Sempre de 0 a 100.
   */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualAlignment =
  | "left"
  | "center"
  | "right";

export type VisualLayoutDirection =
  | "row"
  | "column"
  | "grid"
  | "overlay";

export type VisualAssetRole =
  | "background"
  | "logo"
  | "hero-image"
  | "product"
  | "service"
  | "gallery"
  | "about"
  | "icon"
  | "decorative"
  | "unknown";

export type VisualTextRole =
  | "logo"
  | "eyebrow"
  | "title"
  | "subtitle"
  | "description"
  | "price"
  | "nav"
  | "button"
  | "caption"
  | "body"
  | "unknown";

export type VisualTheme = {
  colors: {
    primary: string;
    secondary?: string;
    background: string;
    surface?: string;
    text: string;
    mutedText?: string;
    accent?: string;
  };

  fonts: {
    heading?: string;
    body?: string;
    accent?: string;
  };

  radius?: {
    sm?: number;
    md?: number;
    lg?: number;
    pill?: number;
  };

  spacing?: {
    sectionY?: number;
    containerX?: number;
    gap?: number;
  };
};

export type VisualAsset = {
  id: string;
  role: VisualAssetRole;
  bounds: VisualBounds;
  description?: string;
  dominantColor?: string;
};

export type VisualTextElement = {
  id: string;
  role: VisualTextRole;
  text: string;
  bounds: VisualBounds;
  color?: string;
  fontFamilyHint?: "serif" | "sans" | "script" | "display";
  fontSize?: number;
  fontWeight?: number;
  align?: VisualAlignment;
};

export type VisualButtonElement = {
  id: string;
  label: string;
  bounds: VisualBounds;
  backgroundColor?: string;
  color?: string;
  borderRadius?: number;
};

export type VisualCardElement = {
  id: string;
  bounds: VisualBounds;
  imageAssetId?: string;
  titleTextId?: string;
  descriptionTextId?: string;
  priceTextId?: string;
  buttonId?: string;
};

export type VisualSection = {
  id: string;
  type: TemplateSectionType;
  bounds: VisualBounds;

  layout: {
    direction: VisualLayoutDirection;
    columns?: number;
    align?: VisualAlignment;
    contentPosition?: VisualAlignment;
    gap?: number;
    contentWidth?: number;
  };

  background: {
    color?: string;
    assetId?: string;
    overlayColor?: string;
    overlayOpacity?: number;
  };

  texts: VisualTextElement[];
  buttons: VisualButtonElement[];
  assets: VisualAsset[];
  cards?: VisualCardElement[];
};

export type ImageVisualLayout = {
  version: "visual-1.0";
  id: string;
  name: string;
  mode: TemplatePageMode;
  image: {
    width: number;
    height: number;
    mimeType?: string;
    fileName?: string;
    sourcePath?: string;
  };
  theme: VisualTheme;
  sections: VisualSection[];
  metadata: {
    createdAt: string;
    generatedBy: "vision" | "manual";
  };
};