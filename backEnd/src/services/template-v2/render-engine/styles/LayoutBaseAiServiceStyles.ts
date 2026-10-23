import type { RenderContext } from "../renderTypes";

/**
 * GranConecta — Layout Base AI / Service Styles V1
 *
 * CSS isolado para páginas de serviço geradas pelo novo fluxo:
 *   pageKind = "servico"
 *   generationMode = "layout-base-ai"
 *
 * IMPORTANTE:
 * - Não altera páginas de loja.
 * - Não altera serviços legados.
 * - Trabalha somente com classes exclusivas do layout-base-ai.
 * - SERVICE_HEALTH_01 recebe direção visual própria inspirada no layout
 *   aprovado de Saúde / Psicopedagogia.
 */
export function buildLayoutBaseAiServiceCss(
  context: RenderContext,
): string {
  if (
    context.request.pageKind !== "servico" ||
    String((context.request as any)?.generationMode || "") !== "layout-base-ai"
  ) {
    return "";
  }

  return `
/* =========================================================
   GRAN CONECTA — LAYOUT BASE AI / SERVICE V1
   ========================================================= */

body.gc-service-layout-base-ai,
body.gc-page--service.gc-service-layout-base-ai {
  --gc-ai-service-bg: #fcfafc;
  --gc-ai-service-surface: #ffffff;
  --gc-ai-service-ink: #302638;
  --gc-ai-service-muted: #756c79;
  --gc-ai-service-brand: #76538f;
  --gc-ai-service-brand-strong: #5e3f78;
  --gc-ai-service-brand-soft: #eee6f2;
  --gc-ai-service-peach: #f3ddd3;
  --gc-ai-service-border: rgba(77, 56, 87, .10);
  --gc-ai-service-radius: 26px;
  --gc-ai-service-shadow: 0 24px 70px rgba(76, 53, 87, .10);

  background: var(--gc-ai-service-bg);
  color: var(--gc-ai-service-ink);
}

/* container deliberadamente um pouco mais largo que o legado */
body.gc-service-layout-base-ai .gc-container {
  width: min(1220px, calc(100% - 48px));
  margin-inline: auto;
}

/* ---------------------------------------------------------
   HEADER
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-header {
  position: relative;
  top: auto;
  background: rgba(255,255,255,.96);
  color: var(--gc-ai-service-ink);
  border-bottom: 1px solid var(--gc-ai-service-border);
  box-shadow: none;
  backdrop-filter: blur(14px);
}

body.gc-service-layout-base-ai .gc-header > .gc-container,
body.gc-service-layout-base-ai .gc-header__inner,
body.gc-service-layout-base-ai .gc-header-luxury__inner,
body.gc-service-layout-base-ai .gc-header-marketplace__inner,
body.gc-service-layout-base-ai .gc-header-overlay__inner,
body.gc-service-layout-base-ai .gc-header-editorial__inner,
body.gc-service-layout-base-ai .gc-header-minimal__inner {
  min-height: 82px;
}

body.gc-service-layout-base-ai .gc-brand,
body.gc-service-layout-base-ai .gc-header strong {
  color: var(--gc-ai-service-ink);
}

body.gc-service-layout-base-ai .gc-header-logo {
  max-height: 54px;
  max-width: 190px;
}

body.gc-service-layout-base-ai .gc-nav {
  gap: clamp(18px, 2.4vw, 34px);
}

body.gc-service-layout-base-ai .gc-nav a {
  color: #625968;
  font-size: .92rem;
  font-weight: 650;
}

body.gc-service-layout-base-ai .gc-header .gc-btn,
body.gc-service-layout-base-ai .gc-header a.gc-btn {
  min-height: 46px;
  padding: 12px 23px;
  border-radius: 999px;
  background: var(--gc-ai-service-brand);
  color: #fff;
  border-color: transparent;
}


/* ---------------------------------------------------------
   HEADER — SERVICE_HEALTH_01 / brand-nav-appointment
   Estrutura exclusiva do HeaderHealthLayoutBase.ts
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-health-header {
  position: relative;
  z-index: 30;
  top: auto;
  width: 100%;
  background: rgba(255, 255, 255, .96);
  border-bottom: 1px solid rgba(77, 56, 87, .09);
  box-shadow: 0 8px 26px rgba(76, 53, 87, .045);
  backdrop-filter: blur(16px);
}

body.gc-service-layout-base-ai .gc-health-header__inner {
  min-height: 82px;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(180px, 1fr);
  align-items: center;
  gap: clamp(22px, 3vw, 44px);
}

body.gc-service-layout-base-ai .gc-health-header__brand {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 12px;
  color: var(--gc-ai-service-ink);
  text-decoration: none;
}

body.gc-service-layout-base-ai .gc-health-header__logo {
  display: block;
  width: auto;
  max-width: 176px;
  max-height: 48px;
  object-fit: contain;
}

body.gc-service-layout-base-ai .gc-health-header__monogram {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #805e9d, #6b498a);
  color: #fff;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: .02em;
  box-shadow: 0 10px 24px rgba(118,83,143,.16);
}

body.gc-service-layout-base-ai .gc-health-header__brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

body.gc-service-layout-base-ai .gc-health-header__brand-copy strong {
  display: block;
  max-width: 230px;
  overflow: hidden;
  color: #34293b;
  font-size: .98rem;
  font-weight: 750;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

body.gc-service-layout-base-ai .gc-health-header__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(20px, 2.2vw, 34px);
}

body.gc-service-layout-base-ai .gc-health-header__nav a {
  position: relative;
  color: #665c69;
  font-size: .91rem;
  font-weight: 650;
  line-height: 1;
  text-decoration: none;
  transition: color .2s ease;
}

body.gc-service-layout-base-ai .gc-health-header__nav a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 100%;
  bottom: -9px;
  height: 2px;
  border-radius: 999px;
  background: #7a58a0;
  transition: right .2s ease;
}

body.gc-service-layout-base-ai .gc-health-header__nav a:hover {
  color: #5b3c78;
}

body.gc-service-layout-base-ai .gc-health-header__nav a:hover::after {
  right: 0;
}

body.gc-service-layout-base-ai .gc-health-header__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

body.gc-service-layout-base-ai .gc-health-header__actions .gc-btn {
  min-height: 46px;
  padding: 12px 22px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #805e9d, #6b498a);
  color: #fff;
  font-size: .9rem;
  font-weight: 750;
  box-shadow: 0 12px 26px rgba(118,83,143,.17);
}

body.gc-service-layout-base-ai .gc-health-header__actions .gc-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(118,83,143,.22);
}

/* ---------------------------------------------------------
   HERO — BASE ISOLADA
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai {
  position: relative;
  min-height: auto !important;
  overflow: hidden;
  isolation: isolate;
  padding: clamp(74px, 8vw, 118px) 0 clamp(68px, 7vw, 104px);
  background:
    radial-gradient(
      circle at 84% 18%,
      color-mix(in srgb, var(--gc-ai-service-brand) 12%, transparent) 0 13%,
      transparent 34%
    ),
    radial-gradient(
      circle at 8% 84%,
      color-mix(in srgb, var(--gc-ai-service-peach) 68%, transparent) 0 10%,
      transparent 30%
    ),
    linear-gradient(135deg, #fff 0%, #f9f5fb 52%, #eee5f3 100%);
  transform: none !important;
}

/*
 * neutraliza os títulos gigantes vindos de ArtDirection,
 * VisualDNA e ServicePremiumWarm.
 */
body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai h1 {
  margin: 0 0 24px;
  max-width: 11.5ch !important;
  font-family: "Playfair Display", "Cormorant Garamond", Georgia, serif !important;
  font-size: clamp(3rem, 5.35vw, 5.25rem) !important;
  font-weight: 600 !important;
  line-height: .98 !important;
  letter-spacing: -.038em !important;
  text-transform: none !important;
  color: var(--gc-ai-service-ink) !important;
  transform: none !important;
}

body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai .gc-kicker {
  display: inline-flex;
  margin: 0 0 18px;
  color: #9b6ec0;
  font-size: .76rem;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
}

body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai p {
  max-width: 620px;
  margin: 0 0 30px;
  color: var(--gc-ai-service-muted);
  font-size: clamp(1rem, 1.2vw, 1.12rem);
  line-height: 1.78;
}

body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai .gc-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai .gc-btn {
  min-height: 50px;
  padding: 14px 25px;
  border-radius: 999px;
  font-weight: 750;
  letter-spacing: -.01em;
}

body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai .gc-btn--primary {
  background: var(--gc-ai-service-brand);
  color: #fff;
  border-color: var(--gc-ai-service-brand);
  box-shadow: 0 14px 30px rgba(118,83,143,.20);
}

body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai .gc-btn--secondary {
  background: rgba(255,255,255,.68);
  color: var(--gc-ai-service-brand-strong);
  border-color: rgba(118,83,143,.22);
}

body.gc-service-layout-base-ai .gc-hero-service__ai-trust {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 28px;
  color: #655b69;
  font-size: .9rem;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-trust:empty {
  display: none;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-trust span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

/* ---------------------------------------------------------
   HERO — SPLIT
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-hero-service__ai-split-inner {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(360px, .88fr);
  gap: clamp(48px, 7vw, 96px);
  align-items: center;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-copy {
  position: relative;
  z-index: 4;
  max-width: 690px;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-split-media {
  position: relative;
  min-height: clamp(480px, 52vw, 610px);
}

body.gc-service-layout-base-ai .gc-hero-service__ai-primary {
  position: absolute;
  inset: 0 0 0 7%;
  margin: 0;
  overflow: hidden;
  border-radius: 48% 48% 30px 30px;
  background: #eee7f1;
  box-shadow: var(--gc-ai-service-shadow);
}

body.gc-service-layout-base-ai .gc-hero-service__ai-primary img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-secondary {
  position: absolute;
  z-index: 3;
  width: min(190px, 34%);
  left: -4%;
  bottom: 5%;
  margin: 0;
  padding: 7px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(71,51,80,.16);
  transform: rotate(-2deg);
}

body.gc-service-layout-base-ai .gc-hero-service__ai-secondary img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-accent {
  position: absolute;
  z-index: -1;
  width: 190px;
  height: 190px;
  left: -9%;
  bottom: -5%;
  border-radius: 999px;
  background: var(--gc-ai-service-peach);
}

body.gc-service-layout-base-ai .gc-hero-service__ai-placeholder {
  position: absolute;
  inset: 8% 0 4% 10%;
  border-radius: 48% 48% 30px 30px;
  background:
    radial-gradient(circle at 68% 24%, rgba(255,255,255,.7), transparent 28%),
    linear-gradient(145deg, #e9dfed, #f7eee9);
}

/* ---------------------------------------------------------
   HERO — EDITORIAL
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-hero-service__ai-editorial-inner {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(420px, 1.08fr);
  gap: clamp(42px, 6vw, 82px);
  align-items: center;
  min-height: 590px;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-editorial-media {
  position: relative;
  min-height: 600px;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-editorial-media .gc-hero-service__ai-primary {
  inset: 0 7% 8% 0;
  border-radius: 30px 180px 30px 180px;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-editorial-media .gc-hero-service__ai-secondary {
  left: auto;
  right: 0;
  bottom: 0;
  width: min(220px, 38%);
  transform: none;
  border-radius: 24px 24px 90px 24px;
  overflow: hidden;
}

/* ---------------------------------------------------------
   HERO — MINIMAL
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-hero-service__ai-minimal-inner {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, .72fr);
  gap: clamp(46px, 7vw, 100px);
  align-items: center;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-minimal-media {
  margin: 0;
  overflow: hidden;
  border-radius: 180px 180px 28px 28px;
  min-height: 520px;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-minimal-media img {
  width: 100%;
  height: 100%;
  min-height: 520px;
  object-fit: cover;
}

/* ---------------------------------------------------------
   HERO — CINEMATIC
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-hero-service--ai-cinematic {
  min-height: min(78svh, 820px) !important;
  display: flex;
  align-items: center;
  color: #fff;
  background: #2f2636;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-cinematic-bg,
body.gc-service-layout-base-ai .gc-hero-service__ai-cinematic-shade {
  position: absolute;
  inset: 0;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-cinematic-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

body.gc-service-layout-base-ai .gc-hero-service__ai-cinematic-shade {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(38,29,43,.86) 0%, rgba(38,29,43,.64) 43%, rgba(38,29,43,.16) 80%),
    linear-gradient(0deg, rgba(38,29,43,.34), transparent 50%);
}

body.gc-service-layout-base-ai .gc-hero-service__ai-cinematic-inner {
  position: relative;
  z-index: 2;
  width: 100%;
}

body.gc-service-layout-base-ai .gc-hero-service--ai-cinematic h1 {
  color: #fff !important;
}

body.gc-service-layout-base-ai .gc-hero-service--ai-cinematic p {
  color: rgba(255,255,255,.82);
}

body.gc-service-layout-base-ai .gc-hero-service--ai-cinematic .gc-kicker {
  color: #e8cbea;
}

body.gc-service-layout-base-ai .gc-hero-service--ai-cinematic .gc-btn--secondary {
  color: #fff;
  border-color: rgba(255,255,255,.40);
  background: rgba(255,255,255,.06);
}

body.gc-service-layout-base-ai .gc-hero-service--ai-cinematic .gc-hero-service__ai-trust {
  color: rgba(255,255,255,.78);
}

/* ---------------------------------------------------------
   HEALTH / SERVICE_HEALTH_01
   Visual aprovado: acolhedor, profissional, editorial.
   --------------------------------------------------------- */

body.gc-service-layout-base-ai
.gc-hero-service--layout-base-service-health-01 {
  --gc-ai-service-brand: #7a58a0;
  --gc-ai-service-brand-strong: #5b3c78;
  --gc-ai-service-brand-soft: #eee6f4;
  --gc-ai-service-peach: #f3dbcf;
  --gc-ai-service-ink: #302538;
  --gc-ai-service-muted: #756a79;

  background:
    radial-gradient(circle at 82% 18%, rgba(187,155,210,.18) 0 14%, transparent 35%),
    radial-gradient(circle at 10% 88%, rgba(242,211,195,.48) 0 10%, transparent 31%),
    linear-gradient(135deg, #fffefd 0%, #faf6fb 44%, #eee5f4 100%);
}

/* Psicopedagogia/saúde não deve parecer banner de loja */
body.gc-service-layout-base-ai
.gc-hero-service--layout-base-service-health-01 h1 {
  max-width: 10.8ch !important;
  font-size: clamp(3.15rem, 5vw, 5rem) !important;
  line-height: .99 !important;
  font-weight: 600 !important;
}

body.gc-service-layout-base-ai
.gc-hero-service--segment-health-care
.gc-btn--primary {
  background: linear-gradient(135deg, #805e9d, #6b498a);
}


/* ---------------------------------------------------------
   HEALTH HERO — SERVICE_HEALTH_01 / split-professional
   Estrutura exclusiva do HeroHealthLayoutBase.ts
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-health-hero {
  position: relative;
  min-height: auto !important;
  overflow: hidden;
  isolation: isolate;
  padding: clamp(72px, 7.2vw, 108px) 0 clamp(66px, 6.5vw, 96px);
  background:
    radial-gradient(circle at 84% 15%, rgba(185,154,210,.18) 0 13%, transparent 34%),
    radial-gradient(circle at 8% 88%, rgba(243,219,207,.52) 0 10%, transparent 29%),
    linear-gradient(135deg, #fffefd 0%, #faf6fb 46%, #eee6f3 100%);
  transform: none !important;

  --gc-ai-service-brand: #7a58a0;
  --gc-ai-service-brand-strong: #5b3c78;
  --gc-ai-service-brand-soft: #eee6f4;
  --gc-ai-service-peach: #f3dbcf;
  --gc-ai-service-ink: #302538;
  --gc-ai-service-muted: #756a79;
}

body.gc-service-layout-base-ai .gc-health-hero__inner {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 44fr) minmax(420px, 56fr);
  gap: clamp(44px, 6vw, 82px);
  align-items: center;
}

body.gc-service-layout-base-ai .gc-health-hero__content {
  position: relative;
  z-index: 4;
  max-width: 560px;
}

body.gc-service-layout-base-ai .gc-health-hero__content .gc-kicker {
  display: inline-flex;
  margin: 0 0 16px;
  color: #9c72bb;
  font-size: .76rem;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
}

body.gc-service-layout-base-ai .gc-health-hero__content h1 {
  margin: 0 0 22px;
  max-width: 10.5ch !important;
  font-family: "Playfair Display", "Cormorant Garamond", Georgia, serif !important;
  font-size: clamp(3.05rem, 4.7vw, 4.85rem) !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  letter-spacing: -.036em !important;
  text-transform: none !important;
  color: var(--gc-ai-service-ink) !important;
  transform: none !important;
}

body.gc-service-layout-base-ai .gc-health-hero__content p {
  max-width: 560px;
  margin: 0 0 28px;
  color: var(--gc-ai-service-muted);
  font-size: clamp(1rem, 1.15vw, 1.1rem);
  line-height: 1.76;
}

body.gc-service-layout-base-ai .gc-health-hero__content .gc-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

body.gc-service-layout-base-ai .gc-health-hero__content .gc-btn {
  min-height: 49px;
  padding: 13px 24px;
  border-radius: 999px;
  font-weight: 750;
}

body.gc-service-layout-base-ai .gc-health-hero__content .gc-btn--primary {
  background: linear-gradient(135deg, #805e9d, #6b498a);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 14px 30px rgba(118,83,143,.18);
}

body.gc-service-layout-base-ai .gc-health-hero__content .gc-btn--secondary {
  background: rgba(255,255,255,.78);
  color: #64467f;
  border-color: rgba(118,83,143,.22);
}

body.gc-service-layout-base-ai .gc-health-hero__trust {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid rgba(77,56,87,.10);
  color: #695f6d;
  font-size: .9rem;
}

body.gc-service-layout-base-ai .gc-health-hero__trust:empty {
  display: none;
}

body.gc-service-layout-base-ai .gc-health-hero__trust span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

body.gc-service-layout-base-ai .gc-health-hero__media {
  position: relative;
  min-height: clamp(500px, 49vw, 620px);
}

body.gc-service-layout-base-ai .gc-health-hero__figure {
  position: absolute;
  inset: 0 0 0 4%;
  margin: 0;
  overflow: hidden;
  border-radius: 30px 118px 30px 30px;
  background: #eee7f1;
  box-shadow: 0 28px 72px rgba(75,54,85,.13);
}

body.gc-service-layout-base-ai .gc-health-hero__figure img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

body.gc-service-layout-base-ai .gc-health-hero__secondary {
  position: absolute;
  z-index: 3;
  width: min(178px, 31%);
  left: -3%;
  bottom: 4%;
  margin: 0;
  padding: 7px;
  overflow: hidden;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 46px rgba(71,51,80,.15);
}

body.gc-service-layout-base-ai .gc-health-hero__secondary img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 14px;
}

body.gc-service-layout-base-ai .gc-health-hero__placeholder {
  position: absolute;
  inset: 4% 0 0 4%;
  border-radius: 30px 118px 30px 30px;
  background:
    radial-gradient(circle at 68% 24%, rgba(255,255,255,.74), transparent 28%),
    linear-gradient(145deg, #e9dfed, #f7eee9);
}

body.gc-service-layout-base-ai .gc-health-hero__shape {
  position: absolute;
  pointer-events: none;
  z-index: -1;
}

body.gc-service-layout-base-ai .gc-health-hero__shape--one {
  width: 180px;
  height: 180px;
  left: -7%;
  bottom: -3%;
  border-radius: 999px;
  background: rgba(243,219,207,.90);
}

body.gc-service-layout-base-ai .gc-health-hero__shape--two {
  width: 150px;
  height: 150px;
  right: -4%;
  top: -3%;
  border-radius: 999px 999px 28px 999px;
  border: 1px solid rgba(122,88,160,.15);
  background: rgba(255,255,255,.34);
}

/* ---------------------------------------------------------
   CONSTRUCTION
   --------------------------------------------------------- */

body.gc-service-layout-base-ai
.gc-hero-service--layout-base-service-construction-01 {
  --gc-ai-service-brand: #e36928;
  --gc-ai-service-brand-strong: #bd4d16;
  --gc-ai-service-brand-soft: #f6e8df;
  --gc-ai-service-peach: #edc4aa;
  --gc-ai-service-ink: #181b1f;
  --gc-ai-service-muted: #65676b;

  background:
    linear-gradient(90deg, #f6f5f2 0%, #ffffff 48%, #eef0f1 100%);
}

body.gc-service-layout-base-ai
.gc-hero-service--layout-base-service-construction-01 h1 {
  font-family: "Montserrat", "Inter", Arial, sans-serif !important;
  font-weight: 800 !important;
  max-width: 12ch !important;
  letter-spacing: -.05em !important;
}

/* ---------------------------------------------------------
   BEAUTY
   --------------------------------------------------------- */

body.gc-service-layout-base-ai
.gc-hero-service--layout-base-service-beauty-01 {
  --gc-ai-service-brand: #9a6b5f;
  --gc-ai-service-brand-strong: #744a40;
  --gc-ai-service-brand-soft: #f1e6e0;
  --gc-ai-service-peach: #edd4c7;
  --gc-ai-service-ink: #3d302d;
  --gc-ai-service-muted: #7a6b67;

  background:
    radial-gradient(circle at 84% 16%, rgba(214,179,163,.23), transparent 30%),
    linear-gradient(135deg, #fffdfa 0%, #f6eee9 56%, #eadcd5 100%);
}

body.gc-service-layout-base-ai
.gc-hero-service--layout-base-service-beauty-01 h1 {
  font-family: "Playfair Display", Georgia, serif !important;
  font-weight: 500 !important;
  max-width: 11ch !important;
}

/* ---------------------------------------------------------
   BASE DAS DEMAIS SEÇÕES DO NOVO SERVIÇO
   Mantém suavidade enquanto os renderers específicos evoluem.
   --------------------------------------------------------- */

body.gc-service-layout-base-ai .gc-composition-group {
  transform: none !important;
}

body.gc-service-layout-base-ai .gc-services,
body.gc-service-layout-base-ai .gc-about,
body.gc-service-layout-base-ai .gc-how,
body.gc-service-layout-base-ai .gc-gallery,
body.gc-service-layout-base-ai .gc-benefits,
body.gc-service-layout-base-ai .gc-testimonials,
body.gc-service-layout-base-ai .gc-faq,
body.gc-service-layout-base-ai .gc-contact {
  color: var(--gc-ai-service-ink);
}

body.gc-service-layout-base-ai .gc-section-heading h2,
body.gc-service-layout-base-ai .gc-about h2,
body.gc-service-layout-base-ai .gc-how h2,
body.gc-service-layout-base-ai .gc-testimonials h2,
body.gc-service-layout-base-ai .gc-faq h2,
body.gc-service-layout-base-ai .gc-contact h2,
body.gc-service-layout-base-ai .gc-final-cta h2 {
  font-family: "Playfair Display", "Cormorant Garamond", Georgia, serif;
  letter-spacing: -.03em;
}

body.gc-service-layout-base-ai .gc-services {
  background: #f4eef7;
}

body.gc-service-layout-base-ai .gc-service-card,
body.gc-service-layout-base-ai .gc-benefit-card,
body.gc-service-layout-base-ai .gc-testimonial-grid article {
  border-radius: 24px;
  border: 1px solid var(--gc-ai-service-border);
  box-shadow: 0 12px 34px rgba(73,54,81,.07);
}

/* ---------------------------------------------------------
   RESPONSIVO
   --------------------------------------------------------- */


@media (max-width: 1080px) {
  body.gc-service-layout-base-ai .gc-health-header__inner {
    grid-template-columns: minmax(190px, 1fr) auto;
  }

  body.gc-service-layout-base-ai .gc-health-header__nav {
    display: none;
  }
}

@media (max-width: 700px) {
  body.gc-service-layout-base-ai .gc-health-header__inner {
    min-height: 70px;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
  }

  body.gc-service-layout-base-ai .gc-health-header__brand {
    min-width: 0;
  }

  body.gc-service-layout-base-ai .gc-health-header__brand-copy strong {
    max-width: 145px;
    font-size: .9rem;
  }

  body.gc-service-layout-base-ai .gc-health-header__logo {
    max-width: 126px;
    max-height: 40px;
  }

  body.gc-service-layout-base-ai .gc-health-header__actions .gc-btn {
    min-height: 42px;
    padding: 10px 15px;
    font-size: .82rem;
  }
}

@media (max-width: 980px) {
  body.gc-service-layout-base-ai .gc-health-hero__inner,
  body.gc-service-layout-base-ai .gc-hero-service__ai-split-inner,
  body.gc-service-layout-base-ai .gc-hero-service__ai-editorial-inner,
  body.gc-service-layout-base-ai .gc-hero-service__ai-minimal-inner {
    grid-template-columns: 1fr;
  }

  body.gc-service-layout-base-ai .gc-hero-service__ai-copy {
    max-width: 760px;
  }

  body.gc-service-layout-base-ai .gc-hero-service__ai-split-media,
  body.gc-service-layout-base-ai .gc-hero-service__ai-editorial-media {
    min-height: 520px;
    width: min(620px, 100%);
  }

  body.gc-service-layout-base-ai .gc-hero-service__ai-minimal-media {
    width: min(620px, 100%);
  }
}

@media (max-width: 700px) {
  body.gc-service-layout-base-ai .gc-container {
    width: min(100% - 30px, 1220px);
  }

  body.gc-service-layout-base-ai .gc-health-hero {
    padding: 54px 0 62px;
  }

  body.gc-service-layout-base-ai .gc-health-hero__content h1 {
    max-width: 12ch !important;
    font-size: clamp(2.5rem, 12vw, 3.9rem) !important;
    line-height: 1 !important;
  }

  body.gc-service-layout-base-ai .gc-health-hero__media {
    min-height: 410px;
  }

  body.gc-service-layout-base-ai .gc-health-hero__figure,
  body.gc-service-layout-base-ai .gc-health-hero__placeholder {
    inset-left: 0;
    border-radius: 24px 78px 24px 24px;
  }

  body.gc-service-layout-base-ai .gc-health-hero__secondary {
    width: 32%;
  }

  body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai {
    padding: 58px 0 64px;
  }

  body.gc-service-layout-base-ai .gc-hero-service--layout-base-ai h1,
  body.gc-service-layout-base-ai
  .gc-hero-service--layout-base-service-health-01 h1 {
    max-width: 12ch !important;
    font-size: clamp(2.55rem, 12.5vw, 4rem) !important;
    line-height: 1 !important;
  }

  body.gc-service-layout-base-ai .gc-hero-service__ai-split-media,
  body.gc-service-layout-base-ai .gc-hero-service__ai-editorial-media {
    min-height: 410px;
  }

  body.gc-service-layout-base-ai .gc-hero-service__ai-primary {
    inset-left: 0;
  }

  body.gc-service-layout-base-ai .gc-hero-service__ai-secondary {
    width: 34%;
  }

  body.gc-service-layout-base-ai .gc-nav {
    display: none;
  }
}
`;
}