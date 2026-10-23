export interface LandingStructure {
  hero?: HeroSection;

  services?: ServiceCard[];

  about?: AboutSection;

  video?: VideoSection;

  cta?: CTASection;

  footer?: FooterSection;
}

export interface HeroSection {
  title: string;
  subtitle?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface ServiceCard {
  title: string;
  description?: string;
  image?: string;
}

export interface AboutSection {
  title: string;
  text?: string;
  image?: string;
}

export interface VideoSection {
  youtubeUrl?: string;
  title?: string;
  text?: string;
}

export interface CTASection {
  title?: string;
  text?: string;
  buttonText?: string;
}

export interface FooterSection {
  logo?: string;
  phone?: string;
  address?: string;
}