import type { RenderContext } from "../renderTypes";

export function buildServicePremiumWarmCss(context: RenderContext): string {
  if (context.request.pageKind !== "servico") return "";

  if (
    context.request.generationMode === "layout-base-ai"
  ) {
    return "";
  }

  return `
body.gc-page--service {
  --gc-service-ink: #2e2434;
  --gc-service-muted: #746b78;
  --gc-service-soft: color-mix(in srgb, var(--gc-color-primary, #76538f) 8%, #fff);
  --gc-service-soft-2: color-mix(in srgb, var(--gc-color-secondary, #d7bfdc) 18%, #fff);
  --gc-service-brand: var(--gc-color-primary, #76538f);
  --gc-service-radius: 26px;
  color: var(--gc-service-ink);
  background: #fff;
}

body.gc-page--service .gc-container {
  width: min(1180px, calc(100% - 40px));
  margin-inline: auto;
}

/* neutraliza somente no serviço os exageros de ArtDirection/DNA */
body.gc-page--service .gc-hero {
  min-height: auto !important;
  transform: none !important;
}
body.gc-page--service .gc-hero h1 {
  font-size: clamp(3rem, 6vw, 5.9rem) !important;
  line-height: .94 !important;
  max-width: 760px;
  letter-spacing: -.045em;
  transform: none !important;
}
body.gc-page--service .gc-composition-group {
  transform: none;
}

/* HERO */
body.gc-page--service .gc-hero-service--premium-warm {
  position: relative;
  overflow: hidden;
  padding: clamp(72px, 8vw, 120px) 0 clamp(64px, 7vw, 100px);
  background:
    radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--gc-service-brand) 18%, transparent) 0 18%, transparent 42%),
    linear-gradient(135deg, #fff 0%, var(--gc-service-soft) 54%, var(--gc-service-soft-2) 100%);
}
body.gc-page--service .gc-hero-service__premium-inner {
  display: grid;
  grid-template-columns: minmax(0, .95fr) minmax(360px, .8fr);
  gap: clamp(44px, 7vw, 92px);
  align-items: center;
}
body.gc-page--service .gc-hero-service__premium-copy {
  position: relative;
  z-index: 2;
}
body.gc-page--service .gc-hero-service__premium-copy h1 {
  font-family: "Playfair Display", "Cormorant Garamond", serif;
}
body.gc-page--service .gc-hero-service__premium-copy p {
  max-width: 620px;
  color: var(--gc-service-muted);
  font-size: clamp(1rem, 1.4vw, 1.16rem);
  line-height: 1.8;
}
body.gc-page--service .gc-hero-service__premium-media {
  position: relative;
  min-height: 560px;
}
body.gc-page--service .gc-hero-service__premium-figure {
  position: absolute;
  inset: 0 0 0 8%;
  margin: 0;
  overflow: hidden;
  border-radius: 46% 46% 30px 30px;
  box-shadow: 0 28px 80px rgba(54, 34, 65, .15);
}
body.gc-page--service .gc-hero-service__premium-figure img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
body.gc-page--service .gc-hero-service__media-accent {
  position: absolute;
  width: 170px;
  height: 170px;
  left: -24px;
  bottom: -22px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--gc-service-brand) 20%, #f5d9c9);
  filter: blur(.2px);
  z-index: -1;
}
body.gc-page--service .gc-hero-service__orb {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  opacity: .5;
}
body.gc-page--service .gc-hero-service__orb--one {
  width: 210px; height: 210px; right: 4%; top: 3%;
  background: color-mix(in srgb, var(--gc-service-brand) 13%, #fff);
}
body.gc-page--service .gc-hero-service__orb--two {
  width: 110px; height: 110px; left: 43%; bottom: 8%;
  background: #f5d9c9;
}

/* SERVICES */
body.gc-page--service .gc-services--premium-warm {
  padding: clamp(80px, 9vw, 132px) 0;
  background: var(--gc-service-soft);
}
body.gc-page--service .gc-services--premium-warm .gc-section-heading {
  max-width: 780px;
  margin-bottom: 46px;
}
body.gc-page--service .gc-services--premium-warm .gc-section-heading h2,
body.gc-page--service .gc-about-service-premium__copy h2,
body.gc-page--service .gc-testimonials h2,
body.gc-page--service .gc-final-cta-service__copy h2 {
  font-family: "Playfair Display", "Cormorant Garamond", serif;
  letter-spacing: -.035em;
}
body.gc-page--service .gc-services-grid--premium-warm {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
body.gc-page--service .gc-services-grid--premium-warm .gc-service-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gc-service-brand) 12%, #eee);
  border-radius: var(--gc-service-radius);
  box-shadow: 0 14px 38px rgba(61, 44, 70, .07);
  transition: transform .25s ease, box-shadow .25s ease;
}
body.gc-page--service .gc-services-grid--premium-warm .gc-service-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 52px rgba(61, 44, 70, .12);
}
body.gc-page--service .gc-service-card__media {
  aspect-ratio: 4 / 3;
  overflow: hidden;
}
body.gc-page--service .gc-service-card__media img {
  width: 100%; height: 100%; object-fit: cover;
}
body.gc-page--service .gc-service-card__body {
  padding: 26px;
}
body.gc-page--service .gc-service-card__body h3 {
  margin: 8px 0 10px;
  font-size: 1.22rem;
}
body.gc-page--service .gc-service-card__body p {
  color: var(--gc-service-muted);
  line-height: 1.65;
}

/* ABOUT */
body.gc-page--service .gc-about--service-premium-warm {
  padding: clamp(88px, 10vw, 150px) 0;
  background: #fff;
}
body.gc-page--service .gc-about-service-premium__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, .8fr) minmax(240px, .65fr);
  gap: clamp(28px, 4vw, 58px);
  align-items: center;
}
body.gc-page--service .gc-about-service-premium__copy h2 {
  font-size: clamp(2.5rem, 4.5vw, 4.8rem);
  line-height: 1;
}
body.gc-page--service .gc-about-service-premium__copy p,
body.gc-page--service .gc-about-service-premium__proof p {
  color: var(--gc-service-muted);
  line-height: 1.8;
}
body.gc-page--service .gc-about-service-premium__media {
  margin: 0;
  overflow: hidden;
  border-radius: 180px 180px 28px 28px;
  min-height: 520px;
}
body.gc-page--service .gc-about-service-premium__media img {
  width: 100%; height: 100%; min-height: 520px; object-fit: cover;
}
body.gc-page--service .gc-about-service-premium__proof {
  padding: 30px;
  border-radius: 24px;
  background: var(--gc-service-soft);
}

/* TESTIMONIALS */
body.gc-page--service .gc-testimonials--service-premium-warm {
  padding: clamp(80px, 9vw, 130px) 0;
  background: #fffaf7;
}
body.gc-page--service .gc-testimonials--service-premium-warm .gc-testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
body.gc-page--service .gc-testimonials--service-premium-warm .gc-testimonial-grid article {
  padding: 30px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(61,44,70,.07);
}

/* FINAL CTA */
body.gc-page--service .gc-final-cta--service-premium-warm {
  padding: clamp(58px, 7vw, 92px) 0;
  background: var(--gc-service-brand);
  color: #fff;
}
body.gc-page--service .gc-final-cta-service__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) auto;
  gap: 48px;
  align-items: center;
}
body.gc-page--service .gc-final-cta-service__copy h2 {
  margin: 8px 0 12px;
  font-size: clamp(2.4rem, 4.5vw, 4.8rem);
  line-height: 1;
}
body.gc-page--service .gc-final-cta-service__copy p {
  max-width: 680px;
  opacity: .84;
}

/* FOOTER */
body.gc-page--service .gc-footer--service-premium-warm {
  padding: 64px 0 24px;
  background: #fff;
  color: var(--gc-service-ink);
}
body.gc-page--service .gc-footer-service__main {
  display: grid;
  grid-template-columns: 1.2fr .8fr 1fr;
  gap: 44px;
  align-items: start;
}
body.gc-page--service .gc-footer-service__brand img {
  max-width: 150px;
  max-height: 70px;
  object-fit: contain;
  display: block;
  margin-bottom: 16px;
}
body.gc-page--service .gc-footer-service__brand strong {
  display: block;
  font-family: "Playfair Display", serif;
  font-size: 1.35rem;
}
body.gc-page--service .gc-footer-service__brand p {
  max-width: 430px;
  color: var(--gc-service-muted);
}
body.gc-page--service .gc-footer-service__nav,
body.gc-page--service .gc-footer-service__social {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 22px;
}
body.gc-page--service .gc-footer-service__bottom {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 48px;
  padding-top: 22px;
  border-top: 1px solid #eee7ef;
  color: var(--gc-service-muted);
  font-size: .9rem;
}

@media (max-width: 980px) {
  body.gc-page--service .gc-hero-service__premium-inner,
  body.gc-page--service .gc-about-service-premium__inner,
  body.gc-page--service .gc-final-cta-service__inner {
    grid-template-columns: 1fr;
  }
  body.gc-page--service .gc-hero-service__premium-media {
    min-height: 500px;
  }
  body.gc-page--service .gc-services-grid--premium-warm {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  body.gc-page--service .gc-about-service-premium__proof {
    max-width: 620px;
  }
  body.gc-page--service .gc-footer-service__main {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  body.gc-page--service .gc-container {
    width: min(100% - 28px, 1180px);
  }
  body.gc-page--service .gc-hero h1 {
    font-size: clamp(2.65rem, 14vw, 4.2rem) !important;
  }
  body.gc-page--service .gc-hero-service--premium-warm {
    padding-top: 54px;
  }
  body.gc-page--service .gc-hero-service__premium-media {
    min-height: 390px;
  }
  body.gc-page--service .gc-hero-service__premium-figure {
    left: 0;
    border-radius: 120px 120px 24px 24px;
  }
  body.gc-page--service .gc-services-grid--premium-warm,
  body.gc-page--service .gc-testimonials--service-premium-warm .gc-testimonial-grid,
  body.gc-page--service .gc-footer-service__main {
    grid-template-columns: 1fr;
  }
  body.gc-page--service .gc-about-service-premium__media,
  body.gc-page--service .gc-about-service-premium__media img {
    min-height: 400px;
  }
  body.gc-page--service .gc-footer-service__bottom {
    flex-direction: column;
  }
}


/* =========================================================
   SERVICE PREMIUM V2 — VARIAÇÕES REAIS DE LAYOUT
   ========================================================= */

/* CINEMATIC */
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service--premium-cinematic {
  position: relative;
  min-height: min(820px, 92vh) !important;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: #211c25;
  color: #fff;
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-bg,
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-bg img,
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-bg img {
  object-fit: cover;
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-shade {
  background: linear-gradient(90deg, rgba(20,15,24,.86) 0%, rgba(20,15,24,.45) 55%, rgba(20,15,24,.12) 100%);
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-inner {
  position: relative;
  z-index: 2;
  padding-top: 150px;
  padding-bottom: 86px;
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-copy {
  max-width: 760px;
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-copy p {
  max-width: 620px;
  color: rgba(255,255,255,.82);
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-services--premium-cinematic {
  padding: 110px 0;
  background: #f7f3f8;
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-services-grid--premium-cinematic {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-services-grid--premium-cinematic .gc-service-card {
  display: grid;
  grid-template-columns: minmax(180px,.75fr) 1fr;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

/* MAGAZINE */
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service--premium-magazine {
  padding: 82px 0 105px;
  background: #fff;
  overflow: hidden;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-inner {
  display: grid;
  grid-template-columns: .8fr 1.1fr .55fr;
  grid-template-rows: auto 1fr auto;
  gap: 28px;
  align-items: end;
  position: relative;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-number {
  position: absolute;
  top: -50px;
  left: -6px;
  font-family: "Playfair Display", serif;
  font-size: clamp(8rem, 18vw, 17rem);
  line-height: 1;
  opacity: .05;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-copy {
  grid-column: 1 / 3;
  z-index: 2;
  max-width: 800px;
  padding-top: 72px;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-primary {
  grid-column: 2 / 4;
  margin: 0;
  height: 520px;
  overflow: hidden;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-primary img,
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-secondary img {
  width: 100%; height: 100%; object-fit: cover;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-secondary {
  position: absolute;
  width: 230px;
  height: 290px;
  right: 0;
  bottom: -54px;
  margin: 0;
  border: 12px solid #fff;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-trust {
  grid-column: 1 / 2;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-services--premium-magazine {
  background: #f7f4f0;
}
body.gc-page--service.gc-service-layout--premium-magazine .gc-services-story {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 36px;
}

/* MINIMAL */
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service--premium-minimal {
  padding: 105px 0 90px;
  background: #fff;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 70px;
  align-items: center;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-copy {
  max-width: 760px;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-media {
  margin: 0;
  height: 470px;
  overflow: hidden;
  border-radius: 8px;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-media img {
  width: 100%; height: 100%; object-fit: cover;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-trust {
  grid-column: 1 / -1;
  border-top: 1px solid #e9e5ea;
  padding-top: 22px;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-services--premium-minimal {
  padding: 70px 0 100px;
  background: #fff;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-services-minimal-list {
  border-top: 1px solid #e8e4e9;
}
body.gc-page--service.gc-service-layout--premium-minimal .gc-service-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 30px;
  padding: 28px 0;
  border-bottom: 1px solid #e8e4e9;
}

/* CONVERSION */
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service--premium-conversion {
  padding: 76px 0 90px;
  background: linear-gradient(135deg, #f7f2f8 0%, #fff 60%);
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-inner {
  display: grid;
  grid-template-columns: 1fr .82fr;
  gap: 54px;
  align-items: center;
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-side {
  position: relative;
  min-height: 560px;
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-side figure {
  margin: 0;
  height: 500px;
  overflow: hidden;
  border-radius: 24px;
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-side figure img {
  width: 100%; height: 100%; object-fit: cover;
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-panel {
  position: absolute;
  left: -36px;
  right: 28px;
  bottom: 0;
  padding: 26px 30px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 22px 60px rgba(55,35,65,.13);
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-panel span {
  font-size: .72rem;
  letter-spacing: .18em;
  color: var(--gc-service-brand);
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-panel strong {
  display: block;
  margin: 8px 0;
  font-size: 1.35rem;
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-services--premium-conversion {
  background: #fff;
}
body.gc-page--service.gc-service-layout--premium-conversion .gc-services-grid--premium-conversion {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 22px;
}

/* WARM keeps the V1 split/card direction */
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service--premium-warm {
  background:
    radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--gc-service-brand) 18%, transparent) 0 18%, transparent 42%),
    linear-gradient(135deg, #fff 0%, var(--gc-service-soft) 54%, var(--gc-service-soft-2) 100%);
}

@media (max-width: 980px) {
  body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-inner,
  body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-inner,
  body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-inner {
    grid-template-columns: 1fr;
  }
  body.gc-page--service.gc-service-layout--premium-cinematic .gc-services-grid--premium-cinematic,
  body.gc-page--service.gc-service-layout--premium-magazine .gc-services-story,
  body.gc-page--service.gc-service-layout--premium-conversion .gc-services-grid--premium-conversion {
    grid-template-columns: 1fr 1fr;
  }
  body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-copy,
  body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-primary {
    grid-column: 1 / -1;
  }
  body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-secondary {
    display: none;
  }
}

@media (max-width: 640px) {
  body.gc-page--service.gc-service-layout--premium-cinematic .gc-services-grid--premium-cinematic,
  body.gc-page--service.gc-service-layout--premium-conversion .gc-services-grid--premium-conversion {
    grid-template-columns: 1fr;
  }
  body.gc-page--service.gc-service-layout--premium-cinematic .gc-services-grid--premium-cinematic .gc-service-card {
    grid-template-columns: 1fr;
  }
  body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-panel {
    position: relative;
    left: 0;
    right: 0;
    margin-top: -48px;
  }
}

/* SERVICE DESIGN QUALITY V4 */
body.gc-page--service .gc-hero-service h1{max-width:none!important;transform:none!important}

/* WARM */
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service--premium-warm{min-height:680px!important;padding:72px 0 76px;background:radial-gradient(circle at 78% 15%,color-mix(in srgb,var(--gc-service-brand) 12%,transparent),transparent 30%),linear-gradient(135deg,#fff 0%,#fbf8fc 52%,color-mix(in srgb,var(--gc-service-brand) 8%,#fff) 100%)}
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service__premium-inner{grid-template-columns:minmax(0,42%) minmax(0,58%);gap:54px}
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service__premium-copy h1{font-size:clamp(3.1rem,5.3vw,5.2rem)!important;line-height:.98!important}
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service__premium-media{min-height:590px}
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service__premium-figure{inset:0 0 0 4%;border-radius:34px 170px 34px 34px}
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service__premium-trust{margin-top:26px;padding-top:22px;border-top:1px solid rgba(46,36,52,.12)}
body.gc-page--service.gc-service-layout--premium-warm .gc-service-card--warm{display:flex;flex-direction:column;min-height:100%;background:#fff;border:1px solid rgba(46,36,52,.08);border-radius:24px;overflow:hidden;box-shadow:0 16px 42px rgba(46,36,52,.07)}
body.gc-page--service.gc-service-layout--premium-warm .gc-service-card--warm .gc-service-card__media{aspect-ratio:16/10}
body.gc-page--service.gc-service-layout--premium-warm .gc-service-card__topline{display:flex;justify-content:space-between;align-items:center;color:var(--gc-service-brand);font-size:.78rem;letter-spacing:.14em}
body.gc-page--service.gc-service-layout--premium-warm .gc-service-card__topline em{font-style:normal;background:var(--gc-service-soft);padding:6px 10px;border-radius:999px}

/* CINEMATIC */
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service--premium-cinematic{min-height:820px!important;align-items:flex-end;background:#17131b}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-shade{background:linear-gradient(90deg,rgba(14,11,16,.9) 0%,rgba(14,11,16,.62) 42%,rgba(14,11,16,.1) 78%)}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-copy{max-width:760px;padding-left:34px;border-left:1px solid rgba(255,255,255,.32)}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-copy h1{font-size:clamp(3.5rem,6.3vw,6.8rem)!important;line-height:.9!important;color:#fff}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-hero-service__cinematic-index{font:500 1rem/1 Inter,sans-serif;letter-spacing:.25em;opacity:.7;margin-bottom:28px}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-services-cinematic-list{display:grid;gap:2px;background:#ddd5df;border:1px solid #ddd5df}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card--cinematic{display:grid;grid-template-columns:90px 260px 1fr;min-height:250px;background:#fff}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__number{padding:28px 22px;font:600 1rem/1 Inter,sans-serif;color:#8d7a94}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__media{overflow:hidden}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__media img{width:100%;height:100%;object-fit:cover}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__content{display:grid;grid-template-columns:1fr 1.2fr;gap:32px;padding:34px;align-items:center}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__content h3{font:600 clamp(1.7rem,2.4vw,2.5rem)/1 "Playfair Display",serif}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__bottom button{border:0;background:none;padding:0;font-weight:700;color:var(--gc-service-brand)}

/* MAGAZINE */
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service--premium-magazine{padding:78px 0 110px;background:#fdfbf8}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-inner{grid-template-columns:.8fr 1.2fr .5fr;min-height:690px}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-copy{grid-column:1/3;align-self:start;max-width:760px;padding-top:50px}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-copy h1{font-size:clamp(3.7rem,6vw,6rem)!important;line-height:.92!important}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-rule{width:86px;height:2px;background:var(--gc-service-brand);margin-bottom:24px}
body.gc-page--service.gc-service-layout--premium-magazine .gc-hero-service__magazine-primary{height:520px;border-radius:0 0 80px 0}
body.gc-page--service.gc-service-layout--premium-magazine .gc-services-story{grid-template-columns:1.08fr .92fr;gap:42px}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-featured--magazine{background:#fff;border:1px solid #e9e1da;display:flex;flex-direction:column}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-featured--magazine figure{height:390px;margin:0;overflow:hidden}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-featured--magazine figure img{width:100%;height:100%;object-fit:cover}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-featured-magazine__copy{padding:34px}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-featured-magazine__copy h3{font:600 clamp(2.2rem,3.5vw,3.8rem)/.95 "Playfair Display",serif}
body.gc-page--service.gc-service-layout--premium-magazine .gc-services-story__list{border-top:1px solid #d8d0ca}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-card--magazine{display:grid;grid-template-columns:60px 1fr auto;gap:26px;padding:26px 0;border-bottom:1px solid #d8d0ca;align-items:start}

/* MINIMAL */
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service--premium-minimal{padding:90px 0 80px;background:#fff}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-inner{grid-template-columns:minmax(0,1fr) 320px;gap:90px}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-copy h1{font-size:clamp(3.3rem,5vw,5.4rem)!important;line-height:.96!important}
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-label{font-size:.72rem;letter-spacing:.2em;margin-bottom:24px;color:#847989}

/* CONVERSION */
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service--premium-conversion{padding:82px 0 92px;background:linear-gradient(135deg,#f5eef8,#fff 58%)}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-inner{grid-template-columns:1fr .82fr;gap:58px}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-copy h1{font-size:clamp(3.3rem,5.3vw,5.7rem)!important;line-height:.95!important}
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-badge{display:inline-flex;padding:8px 12px;border-radius:999px;background:#fff;border:1px solid rgba(46,36,52,.1);font-size:.72rem;font-weight:800;letter-spacing:.12em}
body.gc-page--service.gc-service-layout--premium-conversion .gc-services-conversion-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
body.gc-page--service.gc-service-layout--premium-conversion .gc-service-card--conversion{background:#fff;border:1px solid rgba(46,36,52,.08);border-radius:22px;overflow:hidden;box-shadow:0 18px 54px rgba(46,36,52,.08)}
body.gc-page--service.gc-service-layout--premium-conversion .gc-service-card-conversion__media{height:220px;overflow:hidden}
body.gc-page--service.gc-service-layout--premium-conversion .gc-service-card-conversion__media img{width:100%;height:100%;object-fit:cover}
body.gc-page--service.gc-service-layout--premium-conversion .gc-service-card-conversion__body{padding:28px}
body.gc-page--service.gc-service-layout--premium-conversion .gc-service-card-conversion__body>button:first-of-type{width:100%;margin-top:20px;padding:14px 18px;border:0;border-radius:12px;background:var(--gc-service-brand);color:#fff;font-weight:800}
body.gc-page--service.gc-service-layout--premium-conversion .gc-service-card-conversion__body>button:last-of-type{width:100%;margin-top:8px;padding:12px 18px;border:0;background:transparent;color:var(--gc-service-brand);font-weight:700}

@media(max-width:980px){
body.gc-page--service.gc-service-layout--premium-warm .gc-hero-service__premium-inner,
body.gc-page--service.gc-service-layout--premium-minimal .gc-hero-service__minimal-inner,
body.gc-page--service.gc-service-layout--premium-conversion .gc-hero-service__conversion-premium-inner{grid-template-columns:1fr}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card--cinematic{grid-template-columns:60px 190px 1fr}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__content{grid-template-columns:1fr}
body.gc-page--service.gc-service-layout--premium-conversion .gc-services-conversion-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:640px){
body.gc-page--service .gc-hero-service h1{font-size:clamp(2.5rem,12vw,3.7rem)!important}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card--cinematic{grid-template-columns:1fr}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__number{display:none}
body.gc-page--service.gc-service-layout--premium-cinematic .gc-service-card-cinematic__media{height:230px}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-card--magazine{grid-template-columns:42px 1fr}
body.gc-page--service.gc-service-layout--premium-magazine .gc-service-card--magazine>div:last-child{grid-column:2}
body.gc-page--service.gc-service-layout--premium-conversion .gc-services-conversion-grid{grid-template-columns:1fr}
}

`;
}
