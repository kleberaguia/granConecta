import type { TemplateSectionKey } from "../../TemplateTypes";
import type { RenderContext } from "../renderTypes";

import { renderHero } from "./HeroSection";
import { renderProducts } from "./ProductSection";
import { renderServices } from "./ServiceSection";

import { renderTopbarByContext } from "./topbar/TopbarFactory";
import { renderHeaderByContext } from "./header/HeaderFactory";
import { renderCategoriesByContext } from "./categories/CategoriesFactory";
import { renderFeaturedByContext } from "./featured/FeaturedFactory";
import { renderBenefitsByContext } from "./benefits/BenefitsFactory";
import { renderAboutByContext } from "./about/AboutFactory";
import { renderTestimonialsByContext } from "./testimonials/TestimonialsFactory";
import { renderFaqByContext } from "./faq/FaqFactory";
import { renderContactByContext } from "./contact/ContactFactory";
import { renderFooterByContext } from "./footer/FooterFactory";
import { renderGalleryByContext } from "./gallery/GalleryFactory";
import { renderSocialByContext } from "./social/SocialFactory";
import { renderVideoByContext } from "./video/VideoFactory";
import { renderHowItWorksByContext } from "./how-it-works/HowItWorksFactory";
import { renderCollectionsByContext } from "./collections/CollectionsFactory";
import { renderOffersByContext } from "./offers/OffersFactory";
import { renderNewsletterByContext } from "./newsletter/NewsletterFactory";
import { renderFinalCtaByContext } from "./final-cta/FinalCtaFactory";
import { renderLocationByContext } from "./location/LocationFactory";

const SECTION_RENDERERS: Record<TemplateSectionKey, (context: RenderContext) => string> = {
  topbar: renderTopbarByContext,
  header: renderHeaderByContext,
  hero: renderHero,
  categories: renderCategoriesByContext,
  featured: renderFeaturedByContext,
  collections: renderCollectionsByContext,
  offers: renderOffersByContext,
  products: renderProducts,
  services: renderServices,
  "how-it-works": renderHowItWorksByContext,
  gallery: renderGalleryByContext,
  video: renderVideoByContext,
  benefits: renderBenefitsByContext,
  about: renderAboutByContext,
  testimonials: renderTestimonialsByContext,
  faq: renderFaqByContext,
  social: renderSocialByContext,
  location: renderLocationByContext,
  newsletter: renderNewsletterByContext,
  contact: renderContactByContext,
  "final-cta": renderFinalCtaByContext,
  footer: renderFooterByContext,
};

export function renderSectionByKey(
  section: TemplateSectionKey,
  context: RenderContext,
): string {
  return SECTION_RENDERERS[section]?.(context) || "";
}
