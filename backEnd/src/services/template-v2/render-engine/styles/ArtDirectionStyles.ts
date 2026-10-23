import type { RenderContext } from "../renderTypes";

export function buildArtDirectionCss(context: RenderContext): string {
  const art = context.artDirection;
  if (!art || art.level !== "HIGH_IMPACT") return "";

  return `
/* =========================================================
   GranConecta Art Direction V1
   ========================================================= */

body.gc-art-direction--high-impact {
  overflow-x: clip;
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-hero {
  position: relative;
  min-height: 100svh;
  overflow: visible;
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-hero h1 {
  font-size: clamp(4.8rem, 10.5vw, 11.5rem);
  line-height: .78;
  letter-spacing: -.055em;
  position: relative;
  z-index: 6;
  max-width: 10ch;
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-hero img {
  object-fit: cover;
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-composition-group--overlap {
  position: relative;
  z-index: 5;
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-composition-group--overlap + .gc-composition-group,
body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-about--editorial-overlap {
  margin-top: clamp(-110px, -7vw, -56px);
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-about-editorial__copy h2,
body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-products--editorial-showcase .gc-section-heading h2 {
  font-size: clamp(4rem, 8vw, 9rem);
  line-height: .82;
  letter-spacing: -.045em;
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-about--editorial-overlap,
body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-products--editorial-showcase,
body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-gallery--editorial-art {
  padding-top: clamp(120px, 15vw, 240px);
  padding-bottom: clamp(120px, 15vw, 240px);
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-products-editorial-showcase__featured {
  transform: translateY(-4vw);
}

body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-gallery-editorial-art {
  transform: rotate(-.35deg);
}

/* CINEMATIC */
body[data-gc-art-direction="CINEMATIC"] {
  background: #0d0d0d;
}

body[data-gc-art-direction="CINEMATIC"] .gc-hero {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
}

body[data-gc-art-direction="CINEMATIC"] .gc-hero h1 {
  font-size: clamp(4.4rem, 10vw, 11rem);
  line-height: .8;
  letter-spacing: -.05em;
  max-width: 11ch;
  position: relative;
  z-index: 5;
}

body[data-gc-art-direction="CINEMATIC"] .gc-hero img {
  object-fit: cover;
}

body[data-gc-art-direction="CINEMATIC"] .gc-about--cinematic-story {
  margin-top: clamp(-120px, -8vw, -70px);
  min-height: 100svh;
  position: relative;
  z-index: 4;
}

body[data-gc-art-direction="CINEMATIC"] .gc-about-cinematic__copy h2 {
  font-size: clamp(4.2rem, 9vw, 10rem);
  line-height: .82;
  letter-spacing: -.045em;
}

body[data-gc-art-direction="CINEMATIC"] .gc-gallery--cinematic-wide {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}

body[data-gc-art-direction="CINEMATIC"] .gc-products--cinematic-strip {
  padding-top: clamp(120px, 14vw, 220px);
  padding-bottom: clamp(120px, 14vw, 220px);
}

body[data-gc-art-direction="CINEMATIC"] .gc-product-card--cinematic {
  min-height: min(76svh, 820px);
}

@media (max-width: 700px) {
  body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-hero h1,
  body[data-gc-art-direction="CINEMATIC"] .gc-hero h1 {
    font-size: clamp(3.3rem, 16vw, 6rem);
    line-height: .84;
  }

  body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-about--editorial-overlap,
  body[data-gc-art-direction="CINEMATIC"] .gc-about--cinematic-story {
    margin-top: -36px;
  }

  body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-about-editorial__copy h2,
  body[data-gc-art-direction="EDITORIAL_LUXURY"] .gc-products--editorial-showcase .gc-section-heading h2,
  body[data-gc-art-direction="CINEMATIC"] .gc-about-cinematic__copy h2 {
    font-size: clamp(3rem, 14vw, 5.5rem);
  }
}
`;
}