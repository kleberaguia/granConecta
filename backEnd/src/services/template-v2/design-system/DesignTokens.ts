import type {
  ContentDensity,
  DecorationStyle,
  ImageStyle,
  LayoutFamily,
  SectionRhythm,
  TemplatePalette,
} from "../TemplateTypes";

export type DesignDirection =
  | "luxury-editorial"
  | "cinematic-impact"
  | "soft-human"
  | "minimal-premium"
  | "commerce-dynamic"
  | "editorial-story";

export type TypographyMood =
  | "editorial"
  | "modern"
  | "human"
  | "bold"
  | "minimal";

export type HeroComposition =
  | "editorial-overlap"
  | "cinematic-cover"
  | "portrait-story"
  | "minimal-stage"
  | "catalog-dynamic"
  | "conversion-stage";

export type MediaTreatment =
  | "framed"
  | "full-bleed"
  | "floating"
  | "clean"
  | "mosaic"
  | "cinematic";

export type NavigationTreatment =
  | "floating"
  | "transparent"
  | "solid"
  | "minimal";

export type CardTreatment =
  | "editorial"
  | "glass"
  | "flat"
  | "outlined"
  | "soft";

export type MotionMood = "subtle" | "editorial" | "cinematic" | "energetic";
export type MotionIntensity = "low" | "medium" | "high";
export type TitleTreatment =
  | "editorial-mixed"
  | "display-serif"
  | "bold-grotesk"
  | "human-elegant"
  | "minimal-display"
  | "commerce-display";

export type DesignScale = {
  display: string;
  h1: string;
  h2: string;
  body: string;
  small: string;
};

export type TypographySystem = {
  mood: TypographyMood;
  titleTreatment: TitleTreatment;
  headingFamily: string;
  bodyFamily: string;
  accentFamily: string;
  titleWeight: number;
  titleTracking: string;
  titleLineHeight: number;
  maxTitleWidth: string;
  scale: DesignScale;
};

export type MotionSystem = {
  enabled: boolean;
  mood: MotionMood;
  intensity: MotionIntensity;
  revealDistance: number;
  revealDuration: number;
  staggerMs: number;
  mediaBreath: boolean;
  parallax: boolean;
  hoverLift: boolean;
};

export type ResolvedDesignSystem = {
  direction: DesignDirection;
  family: LayoutFamily;
  density: ContentDensity;
  rhythm: SectionRhythm;
  decoration: DecorationStyle;
  imageStyle: ImageStyle;
  typographyMood: TypographyMood;
  typography: TypographySystem;
  motion: MotionSystem;
  heroComposition: HeroComposition;
  mediaTreatment: MediaTreatment;
  navigation: NavigationTreatment;
  cardTreatment: CardTreatment;
  radius: "none" | "small" | "medium" | "large" | "organic";
  shadow: "none" | "soft" | "editorial" | "deep";
  maxWidth: number;
  sectionSpace: number;
  scale: DesignScale;
  palette: TemplatePalette;
  hero: {
    imageCount: number;
    hasLandscape: boolean;
    hasPortrait: boolean;
    hasSquare: boolean;
    mediaDominance: "copy" | "balanced" | "media";
  };
};