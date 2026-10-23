export type ManualTemplateSectionType =
  | "header"
  | "hero"
  | "products"
  | "about"
  | "gallery"
  | "cta"
  | "footer"
  | "services";

export type ManualTemplateCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ManualTemplateAlignment =
  | "left"
  | "center"
  | "right";

export type ManualTemplateLayout = {
  direction: "row" | "column";
  columns: number;
  align?: "left" | "center" | "right";
  contentPosition?: "left" | "center" | "right";
  contentWidth?: number;
  minHeight?: number;
  gap?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
};

export type ManualTemplateContent = {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  logo?: string;
  logoUrl?: string;
  nav?: Array<{
    label: string;
    href: string;
  }>;
};

export type ManualTemplateCard = {
  id: string;

  productId?: string;

  image?: string;
  imageCrop?: ManualTemplateCrop;

  title?: string;
  description?: string;

  price?: string;
  oldPrice?: string;
  cashPrice?: string;
  installment?: string;

  buttonText?: string;
  buttonUrl?: string;
};

export type ManualTemplateSection = {
  id: string;
  type: ManualTemplateSectionType;

  title?: string;
  hidden?: boolean;

  crop?: ManualTemplateCrop;

  backgroundColor?: string;
  backgroundImage?: string;
  backgroundImageCrop?: ManualTemplateCrop;

  layout: ManualTemplateLayout;
  content?: ManualTemplateContent;

  cards?: ManualTemplateCard[];
};

export type ManualTemplateTheme = {
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

export type ManualImageTemplate = {
  version: "manual-1.0";
  id: string;
  name: string;
  mode: "institutional" | "service" | "commerce";
  theme: ManualTemplateTheme;
  sourceImagePath?: string;
  sections: ManualTemplateSection[];
};