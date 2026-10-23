import type { RenderContext } from "../../renderTypes";
import { escapeAttr, mediaUrls, sectionHeading } from "../SectionLibraryShared";
import { SectionVariantEngine } from "../../../SectionVariantEngine";

export function renderGalleryByContext(context: RenderContext): string {
  const images = mediaUrls(context).slice(0, 8);
  if (images.length < 2) return "";

  const variant = SectionVariantEngine.resolve(context).gallery;
  const image = (src: string, index: number, className = "") =>
    `<figure class="gc-gallery-item ${className} gc-gallery-item--${index + 1}">
      <img src="${escapeAttr(src)}" alt="Galeria ${index + 1}" loading="lazy" />
    </figure>`;

  if (variant === "cinematic-wide") {
    return `<section class="gc-gallery gc-gallery--cinematic-wide" id="gallery">
      <div class="gc-gallery-cinematic">
        ${images.slice(0, 5).map((src, index) => image(src, index, "gc-gallery-cinematic__item")).join("")}
      </div>
    </section>`;
  }

  if (variant === "editorial-art") {
    return `<section class="gc-gallery gc-gallery--editorial-art" id="gallery">
      <div class="gc-container">
        ${sectionHeading("Galeria", "Detalhes que contam a nossa história")}
        <div class="gc-gallery-editorial-art">
          ${images.map((src, index) => image(src, index, `gc-gallery-editorial-art__item gc-gallery-editorial-art__item--${index + 1}`)).join("")}
        </div>
      </div>
    </section>`;
  }

  if (variant === "magazine-mosaic") {
    return `<section class="gc-gallery gc-gallery--magazine-mosaic" id="gallery">
      <div class="gc-container">
        ${sectionHeading("Galeria", "Uma leitura visual da marca")}
        <div class="gc-gallery-magazine-mosaic">
          ${images.map((src, index) => image(src, index, `gc-gallery-magazine-mosaic__item gc-gallery-magazine-mosaic__item--${index + 1}`)).join("")}
        </div>
      </div>
    </section>`;
  }

  if (variant === "minimal-grid") {
    return `<section class="gc-gallery gc-gallery--minimal-grid" id="gallery">
      <div class="gc-container">
        ${sectionHeading("Galeria", "Conheça mais de perto")}
        <div class="gc-gallery-minimal-grid">
          ${images.slice(0, 6).map((src, index) => image(src, index)).join("")}
        </div>
      </div>
    </section>`;
  }

  if (variant === "conversion-proof") {
    return `<section class="gc-gallery gc-gallery--conversion-proof" id="gallery">
      <div class="gc-container">
        ${sectionHeading("Conheça de perto", "Veja detalhes antes de decidir")}
        <div class="gc-gallery-conversion-proof">
          ${images.slice(0, 4).map((src, index) => image(src, index)).join("")}
        </div>
      </div>
    </section>`;
  }

  return `<section class="gc-gallery gc-gallery--commerce-lookbook" id="gallery">
    <div class="gc-container">
      ${sectionHeading("Inspire-se", "Produtos, detalhes e combinações")}
      <div class="gc-gallery-commerce-lookbook">
        ${images.slice(0, 6).map((src, index) => image(src, index)).join("")}
      </div>
    </div>
  </section>`;
}
