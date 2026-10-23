import type { CtaAction } from "../../TemplateTypes";
import type { RenderContext } from "../renderTypes";
import { actionButton } from "./CtaSection";

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
  site?: string;
  email?: string;
};

export type LocationData = {
  label?: string;
  address?: string;
  city?: string;
  state?: string;
  mapsUrl?: string;
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value: unknown): string {
  return escapeHtml(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeClass(value: unknown): string {
  return String(value || "default")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
}

export function getFamily(context: RenderContext): string {
  return String(context.variation.family || "luxury-editorial");
}

export function getSectionVariant(
  context: RenderContext,
  section: string,
  fallback: string,
): string {
  const selected =
    context.request.selectedVariation?.sectionVariants?.[section] ||
    context.request.aiVariation?.sectionVariants?.[section] ||
    context.request.raw?.sectionVariants?.[section];

  return safeClass(selected || fallback);
}

export function familyVariant(
  context: RenderContext,
  map: Record<string, string>,
  fallback: string,
): string {
  return map[getFamily(context)] || fallback;
}

export function mediaUrls(context: RenderContext): string[] {
  const media = context.visualContext.media;
  const candidates = [
    ...(context.visualContext.heroMedia?.gallery || []),
    ...(context.visualContext.heroImages || []),
    ...(media?.hero || []).map((item) => item.url),
    ...(media?.about || []).map((item) => item.url),
    ...(media?.workspace || []).map((item) => item.url),
    ...(media?.services || []).map((item) => item.url),
    ...(media?.products || []).map((item) => item.url),
    context.visualContext.heroImage,
    context.visualContext.categoryImage,
    context.visualContext.defaultProductImage,
    context.visualContext.defaultServiceImage,
  ];

  return uniqueStrings(candidates);
}

export function socialLinks(context: RenderContext): SocialLinks {
  const raw = context.request.raw || {};
  const pick = (...values: unknown[]): string | undefined => {
    for (const value of values) {
      const text = String(value || "").trim();
      if (text) return text;
    }
    return undefined;
  };

  return {
    instagram: normalizeUrl(pick(raw.instagram, raw.instagramUrl, raw.store_instagram, raw.storeInstagram)),
    facebook: normalizeUrl(pick(raw.facebook, raw.facebookUrl, raw.store_facebook, raw.storeFacebook)),
    tiktok: normalizeUrl(pick(raw.tiktok, raw.tiktokUrl, raw.store_tiktok, raw.storeTiktok)),
    youtube: normalizeUrl(pick(raw.youtube, raw.youtubeUrl)),
    linkedin: normalizeUrl(pick(raw.linkedin, raw.linkedinUrl)),
    whatsapp: normalizeWhatsapp(pick(
      raw.whatsapp,
      raw.telefone_whatsapp,
      raw.store_whatsapp,
      raw.storeWhatsapp,
      raw.phone,
      raw.telefone,
    )),
    site: normalizeUrl(pick(raw.site, raw.website, raw.siteUrl, raw.url_site)),
    email: pick(raw.email, raw.store_email, raw.contactEmail),
  };
}

export function locationData(context: RenderContext): LocationData {
  const raw = context.request.raw || {};
  const addressObject = raw.endereco || raw.address || {};
  const address = firstText([
    raw.enderecoCompleto,
    raw.addressText,
    raw.address_line,
    raw.logradouro,
    typeof addressObject === "string" ? addressObject : "",
    addressObject?.formatted,
    addressObject?.logradouro,
  ]);

  const city = firstText([
    raw.cidade,
    raw.city,
    addressObject?.cidade,
    addressObject?.city,
  ]);

  const state = firstText([
    raw.estado,
    raw.uf,
    raw.state,
    addressObject?.estado,
    addressObject?.uf,
    addressObject?.state,
  ]);

  const label = firstText([
    raw.locationLabel,
    raw.nomeLocal,
    raw.storeName,
    context.request.businessName,
  ]);

  const mapsUrl = normalizeUrl(firstText([
    raw.googleMapsUrl,
    raw.mapsUrl,
    raw.locationUrl,
  ]));

  return { label, address, city, state, mapsUrl };
}

export function hasSocial(context: RenderContext): boolean {
  const links = socialLinks(context);
  return Boolean(
    links.instagram ||
    links.facebook ||
    links.tiktok ||
    links.youtube ||
    links.linkedin ||
    links.whatsapp ||
    links.site,
  );
}

export function hasLocation(context: RenderContext): boolean {
  const data = locationData(context);
  return Boolean(data.address || data.city || data.mapsUrl);
}

export function hasVideo(context: RenderContext): boolean {
  return Boolean(context.visualContext.media?.videos?.length);
}

export function sectionHeading(
  eyebrow: string,
  title: string,
  text?: string,
): string {
  return `<div class="gc-section-heading">
    ${eyebrow ? `<span>${escapeHtml(eyebrow)}</span>` : ""}
    <h2>${escapeHtml(title)}</h2>
    ${text ? `<p>${escapeHtml(text)}</p>` : ""}
  </div>`;
}

export function renderAction(
  action: CtaAction,
  label: string,
  primary = true,
): string {
  return actionButton({ action, label, primary });
}

export function primaryAction(context: RenderContext): CtaAction {
  return context.commercialStrategy?.primaryAction ||
    context.request.commercialStrategy?.primaryAction ||
    context.variation.primaryAction;
}

export function secondaryAction(context: RenderContext): CtaAction {
  return context.commercialStrategy?.secondaryAction ||
    context.request.commercialStrategy?.secondaryAction ||
    context.variation.secondaryAction;
}

export function primaryLabel(context: RenderContext): string {
  return context.commercialStrategy?.primaryLabel ||
    context.request.commercialStrategy?.primaryLabel ||
    (context.request.pageKind === "servico" ? "Solicitar atendimento" : "Ver produtos");
}

export function secondaryLabel(context: RenderContext): string {
  return context.commercialStrategy?.secondaryLabel ||
    context.request.commercialStrategy?.secondaryLabel ||
    "Falar conosco";
}

export function brandLogo(context: RenderContext): string {
  return (
    context.visualContext.media?.brand?.find((asset) =>
      String(asset.type || "").toUpperCase().includes("LOGO"),
    )?.url ||
    context.visualContext.media?.brand?.[0]?.url ||
    ""
  );
}

export function initials(value: string): string {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "GC";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

export function uniqueStrings(values: Array<unknown>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

export function firstText(values: unknown[]): string | undefined {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return undefined;
}

export function normalizeUrl(value?: string): string | undefined {
  const text = String(value || "").trim();
  if (!text) return undefined;
  if (/^(https?:|mailto:|tel:)/i.test(text)) return text;
  if (text.startsWith("@")) return undefined;
  return `https://${text}`;
}

export function normalizeWhatsapp(value?: string): string | undefined {
  const text = String(value || "").trim();
  if (!text) return undefined;
  if (/^https?:\/\//i.test(text)) return text;
  const digits = text.replace(/\D/g, "");
  if (!digits) return undefined;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

export function externalLink(
  href: string | undefined,
  label: string,
  className = "",
): string {
  if (!href) return "";
  return `<a class="${escapeAttr(className)}" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}
