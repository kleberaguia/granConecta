import { promises as fs } from "fs";
import path from "path";
import * as http from "http";
import * as https from "https";
import sharp from "sharp";

import type {
  NormalizedTemplateRequest,
  ResolvedBrandPalette,
  TemplatePalette,
  TemplateVariationV2,
  TemplateVisualContext,
} from "./TemplateTypes";
import { DEFAULT_TEMPLATE_PALETTE } from "./TemplateTypes";

type ResolveInput = {
  request: NormalizedTemplateRequest;
  variation: TemplateVariationV2;
  visualContext: TemplateVisualContext;
};

type RGB = { r: number; g: number; b: number };
type ColorBucket = RGB & { count: number; saturation: number; luminance: number };

const MAX_SOURCE_IMAGES = 3;
const MAX_REMOTE_BYTES = 20 * 1024 * 1024;
const SAMPLE_SIZE = 72;

export class TemplateBrandPaletteResolver {
  static async resolve(input: ResolveInput): Promise<ResolvedBrandPalette> {
    const { request, variation, visualContext } = input;
    const mode = request.brandPaletteMode === "CUSTOM" ? "CUSTOM" : "AI";

    if (mode === "CUSTOM") {
      const palette = buildCustomPalette(
        request.brandColors,
        request.colors,
        variation.colors,
      );

      return {
        mode,
        source: "CUSTOM",
        palette,
      };
    }

    const explicitHeroFromPlan = (visualContext.media?.hero || [])
      .filter((item) => String(item.type || "").toUpperCase() === "HERO")
      .map((item) => item.url);

    const explicitHeroFromRequest = (request.businessMaterials || [])
      .filter((item) => String(item.type || "").toUpperCase() === "HERO")
      .map((item) => item.url);

    const heroImages = uniqueStrings([
      ...explicitHeroFromPlan,
      ...explicitHeroFromRequest,
    ]).slice(0, MAX_SOURCE_IMAGES);

    const heroPalette = await extractPaletteFromImages(heroImages);
    if (heroPalette) {
      return {
        mode,
        source: "HERO",
        palette: heroPalette,
        sourceImages: heroImages,
      };
    }

    const brandImages = uniqueStrings(
      (request.businessMaterials || [])
        .filter((item) => String(item.type || "").toUpperCase() === "LOGO")
        .map((item) => item.url),
    ).slice(0, MAX_SOURCE_IMAGES);

    const brandPalette = await extractPaletteFromImages(brandImages);
    if (brandPalette) {
      return {
        mode,
        source: "BRAND",
        palette: brandPalette,
        sourceImages: brandImages,
      };
    }

    const businessImages = uniqueStrings(
      (request.businessMaterials || [])
        .filter((item) =>
          ["PUBLICITY", "PRODUCT", "WORKSPACE", "SERVICE", "PROFESSIONAL"].includes(
            String(item.type || "").toUpperCase(),
          ),
        )
        .map((item) => item.url),
    ).slice(0, MAX_SOURCE_IMAGES);

    const businessPalette = await extractPaletteFromImages(businessImages);
    if (businessPalette) {
      return {
        mode,
        source: "BUSINESS_MATERIAL",
        palette: businessPalette,
        sourceImages: businessImages,
      };
    }

    const variationPalette = normalizePalette({
      ...DEFAULT_TEMPLATE_PALETTE,
      ...(variation.colors || {}),
      ...(request.colors || {}),
    });

    if (variationPalette) {
      return {
        mode,
        source: "VARIATION",
        palette: variationPalette,
      };
    }

    return {
      mode,
      source: "FALLBACK",
      palette: { ...DEFAULT_TEMPLATE_PALETTE },
    };
  }
}

function buildCustomPalette(
  brandColors?: Partial<TemplatePalette>,
  requestColors?: Partial<TemplatePalette>,
  variationColors?: Partial<TemplatePalette>,
): TemplatePalette {
  const explicit = {
    ...(variationColors || {}),
    ...(requestColors || {}),
    ...(brandColors || {}),
  };

  const primary = validHex(explicit.primary) || DEFAULT_TEMPLATE_PALETTE.primary;
  const secondary = validHex(explicit.secondary) || mixHex(primary, "#ffffff", 0.28);
  const accent = validHex(explicit.accent) || secondary;
  const background = validHex(explicit.background) || "#ffffff";
  const surface = validHex(explicit.surface) || mixHex(background, primary, 0.04);
  const text = validHex(explicit.text) || bestTextColor(background);
  const mutedText =
    validHex(explicit.mutedText) || mixHex(text, background, 0.42);

  return {
    background,
    surface,
    primary,
    secondary,
    accent,
    text,
    mutedText,
  };
}

async function extractPaletteFromImages(
  urls: string[],
): Promise<TemplatePalette | undefined> {
  if (!urls.length) return undefined;

  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  let usefulPixels = 0;

  for (const url of urls) {
    try {
      const buffer = await loadImageBuffer(url);
      if (!buffer) continue;

      const { data, info } = await sharp(buffer)
        .rotate()
        .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "inside", withoutEnlargement: true })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const channels = info.channels || 3;
      for (let offset = 0; offset + 2 < data.length; offset += channels) {
        const r = Number(data[offset] ?? 0);
        const g = Number(data[offset + 1] ?? 0);
        const b = Number(data[offset + 2] ?? 0);

        if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
          continue;
        }

        usefulPixels += 1;
        const key = `${Math.round(r / 24) * 24}|${Math.round(g / 24) * 24}|${Math.round(b / 24) * 24}`;
        const current = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
        current.r += r;
        current.g += g;
        current.b += b;
        current.count += 1;
        buckets.set(key, current);
      }
    } catch (error: any) {
      console.warn("TEMPLATE PALETTE - imagem ignorada", {
        url,
        message: error?.message || String(error),
      });
    }
  }

  if (usefulPixels < 50 || !buckets.size) return undefined;

  const colors: ColorBucket[] = [...buckets.values()]
    .map((bucket) => {
      const rgb = {
        r: Math.round(bucket.r / bucket.count),
        g: Math.round(bucket.g / bucket.count),
        b: Math.round(bucket.b / bucket.count),
      };
      const hsl = rgbToHsl(rgb);
      return {
        ...rgb,
        count: bucket.count,
        saturation: hsl.s,
        luminance: relativeLuminance(rgb),
      };
    })
    .sort((a, b) => b.count - a.count);

  return buildPaletteFromBuckets(colors);
}

function buildPaletteFromBuckets(colors: ColorBucket[]): TemplatePalette {
  const common = colors.slice(0, Math.min(colors.length, 36));

  const lightCandidates = common.filter((c) => c.luminance >= 0.70);
  const neutralLight = lightCandidates
    .filter((c) => c.saturation <= 0.38)
    .sort((a, b) => b.count - a.count)[0];
  const backgroundBucket = neutralLight || lightCandidates.sort((a, b) => b.count - a.count)[0];

  const chromatic = common
    .filter((c) => c.saturation >= 0.13 && c.luminance >= 0.10 && c.luminance <= 0.82)
    .sort((a, b) => colorImportance(b) - colorImportance(a));

  const fallbackBucket: ColorBucket = {
    r: 15,
    g: 23,
    b: 42,
    count: 1,
    saturation: 0.47,
    luminance: relativeLuminance({ r: 15, g: 23, b: 42 }),
  };

  const primaryBucket: ColorBucket =
    chromatic.find((c) => c.luminance <= 0.58) ??
    chromatic[0] ??
    common.find((c) => c.luminance >= 0.08 && c.luminance <= 0.55) ??
    common[0] ??
    fallbackBucket;

  const secondaryBucket: ColorBucket =
    chromatic.find((c) => colorDistance(c, primaryBucket) >= 48) ??
    chromatic.find((c) => colorDistance(c, primaryBucket) >= 28) ??
    primaryBucket;

  const accentBucket: ColorBucket =
    [...chromatic]
      .filter((c) => colorDistance(c, primaryBucket) >= 32)
      .sort((a, b) => b.saturation - a.saturation || b.count - a.count)[0] ??
    secondaryBucket;

  const darkest = [...common]
    .filter((c) => c.luminance <= 0.34)
    .sort((a, b) => a.luminance - b.luminance)[0];

  let background = backgroundBucket ? rgbToHex(backgroundBucket) : "#f8fafc";
  if (contrastRatio(background, "#111827") < 4.5) {
    background = mixHex(background, "#ffffff", 0.35);
  }

  const primary = ensureUsableBrandColor(rgbToHex(primaryBucket), background);
  const secondary = ensureUsableBrandColor(rgbToHex(secondaryBucket), background);
  const accent = ensureAccent(rgbToHex(accentBucket), background, primary);
  const surface = mixHex(background, "#ffffff", 0.58);

  const darkCandidate = darkest ? rgbToHex(darkest) : "#1f2937";
  const text = contrastRatio(darkCandidate, background) >= 4.5
    ? darkCandidate
    : bestTextColor(background);
  const mutedText = mixHex(text, background, 0.42);

  return {
    background,
    surface,
    primary,
    secondary,
    accent,
    text,
    mutedText,
  };
}

function colorImportance(color: ColorBucket): number {
  return color.count * (0.72 + color.saturation * 1.8) * (color.luminance < 0.72 ? 1.15 : 0.8);
}

async function loadImageBuffer(urlValue: string): Promise<Buffer | undefined> {
  const value = String(urlValue || "").trim();
  if (!value) return undefined;

  if (/^data:image\//i.test(value)) {
    const comma = value.indexOf(",");
    if (comma < 0) return undefined;
    const header = value.slice(0, comma);
    const payload = value.slice(comma + 1);
    return Buffer.from(payload, /;base64/i.test(header) ? "base64" : "utf8");
  }

  if (/^https?:\/\//i.test(value)) {
    return downloadBuffer(value);
  }

  const withoutQuery = value.split("?")[0] ?? value;
  const cleanPath = withoutQuery.split("#")[0] ?? withoutQuery;
  const relative = cleanPath.replace(/^\/+/, "");
  const candidates = uniqueStrings([
    path.isAbsolute(cleanPath) ? cleanPath : undefined,
    path.join(process.cwd(), relative),
    path.join(process.cwd(), "public", relative),
    path.join(process.cwd(), "src", relative),
  ]);

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (!stat.isFile() || stat.size > MAX_REMOTE_BYTES) continue;
      return await fs.readFile(candidate);
    } catch {
      // tenta o próximo caminho
    }
  }

  const publicBase = String(
    process.env.PUBLIC_BASE_URL ||
      process.env.API_BASE_URL ||
      process.env.BACKEND_URL ||
      "",
  ).replace(/\/$/, "");

  if (publicBase && cleanPath.startsWith("/")) {
    try {
      return await downloadBuffer(`${publicBase}${cleanPath}`);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function downloadBuffer(url: string, redirects = 0): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (redirects > 3) return reject(new Error("Muitos redirecionamentos"));

    const client = url.startsWith("https://") ? https : http;
    const request = client.get(
      url,
      {
        headers: {
          "User-Agent": "GranConecta-TemplatePalette/1.0",
          Accept: "image/*",
        },
      },
      (response) => {
        const status = response.statusCode || 0;
        const location = response.headers.location;

        if (status >= 300 && status < 400 && location) {
          response.resume();
          const nextUrl = new URL(location, url).toString();
          downloadBuffer(nextUrl, redirects + 1).then(resolve).catch(reject);
          return;
        }

        if (status < 200 || status >= 300) {
          response.resume();
          reject(new Error(`HTTP ${status}`));
          return;
        }

        const contentLength = Number(response.headers["content-length"] || 0);
        if (contentLength > MAX_REMOTE_BYTES) {
          response.resume();
          reject(new Error("Imagem excede o limite para análise de paleta"));
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;

        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_REMOTE_BYTES) {
            response.destroy(new Error("Imagem excede o limite para análise de paleta"));
            return;
          }
          chunks.push(Buffer.from(chunk));
        });

        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      },
    );

    request.setTimeout(8000, () => {
      request.destroy(new Error("Timeout ao carregar imagem para paleta"));
    });
    request.on("error", reject);
  });
}

function normalizePalette(value: Partial<TemplatePalette>): TemplatePalette | undefined {
  const merged = {
    ...DEFAULT_TEMPLATE_PALETTE,
    ...(value || {}),
  };

  const keys: Array<keyof TemplatePalette> = [
    "background",
    "surface",
    "primary",
    "secondary",
    "accent",
    "text",
    "mutedText",
  ];

  for (const key of keys) {
    if (!validHex(merged[key])) return undefined;
  }

  return merged as TemplatePalette;
}

function ensureUsableBrandColor(color: string, background: string): string {
  if (contrastRatio(color, background) >= 2.2) return color;
  return mixHex(color, "#111827", 0.28);
}

function ensureAccent(color: string, background: string, primary: string): string {
  let result = color;
  if (colorDistance(hexToRgb(result), hexToRgb(primary)) < 24) {
    result = mixHex(result, "#d97706", 0.34);
  }
  if (contrastRatio(result, background) < 1.7) {
    result = mixHex(result, "#111827", 0.22);
  }
  return result;
}

function bestTextColor(background: string): string {
  return contrastRatio("#111827", background) >= contrastRatio("#ffffff", background)
    ? "#111827"
    : "#ffffff";
}

function validHex(value?: string): string | undefined {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : undefined;
}

function rgbToHex(rgb: RGB): string {
  const part = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

function hexToRgb(hex: string): RGB {
  const safe = validHex(hex) || "#000000";
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16),
  };
}

function rgbToHsl(rgb: RGB): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;

  return { h, s, l };
}

function relativeLuminance(rgb: RGB): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(hexToRgb(a));
  const l2 = relativeLuminance(hexToRgb(b));
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2),
  );
}

function mixHex(a: string, b: string, amount: number): string {
  const aa = hexToRgb(a);
  const bb = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({
    r: aa.r + (bb.r - aa.r) * t,
    g: aa.g + (bb.g - aa.g) * t,
    b: aa.b + (bb.b - aa.b) * t,
  });
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}
