export type ImageTemplateMode =
  | "institutional"
  | "service"
  | "commerce";

export type ImageTemplateSectionType =
  | "header"
  | "hero"
  | "products"
  | "services"
  | "about"
  | "gallery"
  | "testimonials"
  | "cta"
  | "faq"
  | "footer"
  | "custom";

export type ImageTemplateAlignment = "left" | "center" | "right";

export type ImageTemplateTheme = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: number;
};

export type ImageTemplateCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageTemplateAsset = {
  id: string;
  type: "image" | "background" | "icon" | "video";
  role?: "background" | "content" | "product" | "decorative";
  url: string;
  alt?: string;
  source?: "uploaded" | "extracted" | "generated" | "placeholder";
  crop?: ImageTemplateCrop;
};

export type ImageTemplateButton = {
  id: string;
  label: string;
  href: string;
  action?:
    | "navigate"
    | "open-whatsapp"
    | "open-contact-modal"
    | "add-to-cart";
  variant?: "primary" | "secondary" | "text";
};

export type ImageTemplateProductSettings = {
  enabled: boolean;
  source: "featured" | "newest" | "category" | "manual";
  categoryId?: string;
  productIds?: string[];
  columns: number;
  limit: number;
  showPrice: boolean;
  showDescription: boolean;
  showGallery: boolean;
  showAddToCart: boolean;
};

export type ImageTemplateElementStyle = {
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: ImageTemplateAlignment;
  width?: string;
  maxWidth?: string;
  borderRadius?: number;
  shadow?: string;
};

export type ImageTemplateElement = {
  id: string;
  type:
    | "heading"
    | "text"
    | "button"
    | "image"
    | "product-grid"
    | "service-grid"
    | "divider"
    | "spacer";
  content?: string;
  assetId?: string;
  button?: ImageTemplateButton;
  style?: ImageTemplateElementStyle;
};

export type ImageTemplateSectionLayout = {
  columns: number;
  minHeight?: number;
  contentWidth?: number;
  alignment?: ImageTemplateAlignment;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  gap?: number;
  backgroundColor?: string;
  backgroundAssetId?: string;
  backgroundPosition?: string;
  backgroundSize?: "auto" | "cover" | "contain";
  overlayColor?: string;
  overlayOpacity?: number;
};

export type ImageTemplateSection = {
  id: string;
  type: ImageTemplateSectionType;
  title?: string;
  hidden?: boolean;
  layout: ImageTemplateSectionLayout;
  elements: ImageTemplateElement[];
  commerce?: ImageTemplateProductSettings;
};

export type ImageTemplateMetadata = {
  createdAt: string;
  generatedBy: "ai" | "manual";
  storeId?: string;
  sourceImagePath?: string;
  sourceImageName?: string;
  sourceImageMimeType?: string;
};

export type ImageTemplateSpec = {
  version: "1.0";
  id: string;
  name: string;
  mode: ImageTemplateMode;
  sourceImageUrl?: string;
  theme: ImageTemplateTheme;
  assets: ImageTemplateAsset[];
  sections: ImageTemplateSection[];
  metadata: ImageTemplateMetadata;
};
