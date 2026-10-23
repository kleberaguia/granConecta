export type TemplatePageMode =
  | "institutional"
  | "service"
  | "commerce";

export type TemplateSectionType =
  | "navbar"
  | "hero"
  | "products"
  | "services"
  | "about"
  | "gallery"
  | "testimonials"
  | "video"
  | "cta"
  | "faq"
  | "footer"
  | "custom";

export type TemplateActionType =
  | "navigate"
  | "scroll"
  | "open_whatsapp"
  | "open_contact_modal"
  | "add_to_cart"
  | "open_product"
  | "none";

export type TemplateAlignment =
  | "left"
  | "center"
  | "right";

export type TemplateDirection =
  | "row"
  | "column";

export type TemplateMediaType =
  | "image"
  | "background"
  | "icon"
  | "video";

export type TemplateMediaSource =
  | "uploaded"
  | "extracted"
  | "database"
  | "external"
  | "placeholder";

export type TemplateTheme = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: number;
  spacing?: "compact" | "comfortable" | "spacious";
};

export type TemplateMedia = {
  id: string;
  type: TemplateMediaType;
  source: TemplateMediaSource;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type TemplateAction = {
  type: TemplateActionType;
  href?: string;
  target?: string;
  productId?: string;
  payload?: Record<string, any>;
};

export type TemplateButton = {
  label: string;
  variant?: "primary" | "secondary" | "text";
  action: TemplateAction;
};

export type TemplateSectionLayout = {
  direction: TemplateDirection;
  columns?: number;
  align?: TemplateAlignment;
  contentPosition?: TemplateAlignment;
  contentWidth?: number;
  minHeight?: number;
  gap?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  backgroundColor?: string;
  backgroundMediaId?: string;
  backgroundSize?: "auto" | "cover" | "contain";
  backgroundPosition?: string;
  overlayColor?: string;
  overlayOpacity?: number;
};

export type TemplateLink = {
  label: string;
  href: string;
  action?: TemplateAction;
};

export type TemplateProductCard = {
  id: string;
  productId?: string;
  title: string;
  description?: string;
  priceText?: string;
  oldPriceText?: string;
  imageMediaId?: string;
  galleryMediaIds?: string[];
  button?: TemplateButton;
};

export type TemplateServiceCard = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  iconMediaId?: string;
  imageMediaId?: string;
  button?: TemplateButton;
};

export type TemplateFaqItem = {
  question: string;
  answer: string;
};

export type TemplateBaseSection<TType extends TemplateSectionType, TContent> = {
  id: string;
  type: TType;
  title?: string;
  hidden?: boolean;
  layout: TemplateSectionLayout;
  content: TContent;
};

export type NavbarSection = TemplateBaseSection<
  "navbar",
  {
    logoText?: string;
    logoMediaId?: string;
    links?: TemplateLink[];
    button?: TemplateButton;
  }
>;

export type HeroSection = TemplateBaseSection<
  "hero",
  {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    description?: string;
    button?: TemplateButton;
    mediaId?: string;
    mediaPosition?: "left" | "right" | "top" | "bottom" | "background";
  }
>;

export type ProductsSection = TemplateBaseSection<
  "products",
  {
    title: string;
    subtitle?: string;
    cards: TemplateProductCard[];
  }
>;

export type ServicesSection = TemplateBaseSection<
  "services",
  {
    title: string;
    subtitle?: string;
    cards: TemplateServiceCard[];
  }
>;

export type AboutSection = TemplateBaseSection<
  "about",
  {
    title: string;
    description: string;
    button?: TemplateButton;
    mediaId?: string;
  }
>;

export type GallerySection = TemplateBaseSection<
  "gallery",
  {
    title?: string;
    subtitle?: string;
    mediaIds: string[];
  }
>;

export type TestimonialsSection = TemplateBaseSection<
  "testimonials",
  {
    title?: string;
    items: Array<{
      id: string;
      name: string;
      text: string;
      avatarMediaId?: string;
      rating?: number;
    }>;
  }
>;

export type VideoSection = TemplateBaseSection<
  "video",
  {
    title?: string;
    description?: string;
    videoMediaId?: string;
    videoUrl?: string;
    posterMediaId?: string;
  }
>;

export type CtaSection = TemplateBaseSection<
  "cta",
  {
    title: string;
    description?: string;
    button?: TemplateButton;
  }
>;

export type FaqSection = TemplateBaseSection<
  "faq",
  {
    title?: string;
    items: TemplateFaqItem[];
  }
>;

export type FooterSection = TemplateBaseSection<
  "footer",
  {
    brand?: string;
    logoMediaId?: string;
    description?: string;
    links?: TemplateLink[];
    copyright?: string;
  }
>;

export type CustomSection = TemplateBaseSection<
  "custom",
  {
    title?: string;
    text?: string;
    mediaIds?: string[];
    html?: string;
    data?: Record<string, any>;
  }
>;

export type TemplateSection =
  | NavbarSection
  | HeroSection
  | ProductsSection
  | ServicesSection
  | AboutSection
  | GallerySection
  | TestimonialsSection
  | VideoSection
  | CtaSection
  | FaqSection
  | FooterSection
  | CustomSection;

export type TemplateCommerceConfig = {
  enabled: boolean;
  cartEnabled: boolean;
  defaultProductAction:
    | "add_to_cart"
    | "open_product"
    | "navigate";
};

export type TemplatePageMetadata = {
  createdAt: string;
  updatedAt?: string;
  generatedBy: "ai" | "manual" | "system";
  source?: "image" | "elementor" | "preset" | "manual";
  sourceId?: string;
  storeId?: string;
  businessType?: string;
};

export type TemplatePage = {
  version: "page-1.0";
  id: string;
  name: string;
  mode: TemplatePageMode;
  theme: TemplateTheme;
  media: TemplateMedia[];
  sections: TemplateSection[];
  commerce?: TemplateCommerceConfig;
  metadata: TemplatePageMetadata;
};
