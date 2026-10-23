import type { RenderContext } from "../renderTypes";

export function buildHealthLayoutBaseCss(context: RenderContext): string {
  if (
    context.request.pageKind !== "servico" ||
    String((context.request as any)?.generationMode || "").trim() !== "layout-base-ai" ||
    resolveLayoutBaseId(context.request) !== "SERVICE_HEALTH_01"
  ) {
    return "";
  }

  return `
  :root {
    --health-bg: #fbf8fc;
    --health-surface: #ffffff;
    --health-ink: #302538;
    --health-muted: #766d79;
    --health-brand: #7a58a0;
    --health-brand-strong: #5b3c78;
    --health-lavender: #eee6f4;
    --health-peach: #f3dbcf;
    --health-border: rgba(77,56,87,.10);
    --health-shadow: 0 20px 60px rgba(76,53,87,.10);
    --health-radius: 26px;
  }

  html { scroll-behavior: smooth; }

  body.gc-health-layout-base {
    margin: 0;
    background: var(--health-bg);
    color: var(--health-ink);
    font-family: "Inter", "Montserrat", Arial, sans-serif;
  }

  body.gc-health-layout-base * { box-sizing: border-box; }

  body.gc-health-layout-base .gc-container {
    width: min(1200px, calc(100% - 48px));
    margin-inline: auto;
  }

  body.gc-health-layout-base .gc-health-eyebrow {
    display: inline-block;
    margin-bottom: 14px;
    color: #9b6ec0;
    font-size: .76rem;
    font-weight: 800;
    letter-spacing: .18em;
    text-transform: uppercase;
  }

  body.gc-health-layout-base .gc-health-heading {
    max-width: 720px;
    margin-bottom: 44px;
  }

  body.gc-health-layout-base .gc-health-heading h2,
  body.gc-health-layout-base .gc-health-about h2,
  body.gc-health-layout-base .gc-health-final-cta h2 {
    margin: 0;
    font-family: "Playfair Display", "Cormorant Garamond", Georgia, serif;
    font-weight: 600;
    letter-spacing: -.035em;
    line-height: 1.02;
    color: var(--health-ink);
  }

  body.gc-health-layout-base .gc-health-heading h2 {
    font-size: clamp(2.35rem, 4vw, 4.25rem);
  }

  body.gc-health-layout-base .gc-health-heading > p {
    max-width: 620px;
    margin: 16px 0 0;
    color: var(--health-muted);
    font-size: 1.05rem;
    line-height: 1.75;
  }

  /* Header */
  body.gc-health-layout-base .gc-health-header {
    position: relative;
    z-index: 20;
    background: rgba(255,255,255,.97);
    border-bottom: 1px solid var(--health-border);
    box-shadow: 0 8px 24px rgba(76,53,87,.04);
  }

  body.gc-health-layout-base .gc-health-header__inner {
    min-height: 82px;
    display: grid;
    grid-template-columns: minmax(220px,1fr) auto minmax(180px,1fr);
    align-items: center;
    gap: 30px;
  }

  body.gc-health-layout-base .gc-health-header__brand {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--health-ink);
    text-decoration: none;
  }

  body.gc-health-layout-base .gc-health-header__logo {
    max-width: 170px;
    max-height: 48px;
    object-fit: contain;
  }

  body.gc-health-layout-base .gc-health-header__monogram {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: linear-gradient(135deg,#805e9d,#6b498a);
    color: #fff;
    font-weight: 800;
  }

  body.gc-health-layout-base .gc-health-header__brand-copy strong {
    font-size: .98rem;
    color: var(--health-ink);
  }

  body.gc-health-layout-base .gc-health-header__nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
  }

  body.gc-health-layout-base .gc-health-header__nav a {
    color: #655c68;
    text-decoration: none;
    font-size: .92rem;
    font-weight: 650;
  }

  body.gc-health-layout-base .gc-health-header__actions {
    display: flex;
    justify-content: flex-end;
  }

  /* Buttons */
  body.gc-health-layout-base .gc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 13px 23px;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 750;
    border: 1px solid rgba(122,88,160,.20);
    transition: transform .2s ease, box-shadow .2s ease;
  }

  body.gc-health-layout-base .gc-btn--primary,
  body.gc-health-layout-base .gc-health-header__actions .gc-btn {
    background: linear-gradient(135deg,#805e9d,#6b498a);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 12px 26px rgba(118,83,143,.18);
  }

  body.gc-health-layout-base .gc-btn--secondary {
    background: #fff;
    color: var(--health-brand-strong);
  }

  /* Hero */
  body.gc-health-layout-base .gc-health-hero {
    position: relative;
    overflow: hidden;
    padding: 76px 0 84px;
    background:
      radial-gradient(circle at 88% 20%, rgba(187,155,210,.16), transparent 31%),
      radial-gradient(circle at 8% 88%, rgba(243,219,207,.50), transparent 28%),
      linear-gradient(135deg,#fffefd 0%,#faf6fb 48%,#eee6f3 100%);
  }

  body.gc-health-layout-base .gc-health-hero__inner {
    display: grid;
    grid-template-columns: minmax(0,44fr) minmax(420px,56fr);
    gap: clamp(46px,6vw,82px);
    align-items: center;
  }

  body.gc-health-layout-base .gc-health-hero__content {
    max-width: 555px;
    position: relative;
    z-index: 3;
  }

  body.gc-health-layout-base .gc-health-hero__content .gc-kicker {
    display: inline-block;
    margin-bottom: 16px;
    color: #9b6ec0;
    font-size: .76rem;
    font-weight: 800;
    letter-spacing: .18em;
    text-transform: uppercase;
  }

  body.gc-health-layout-base .gc-health-hero__content h1 {
    margin: 0 0 22px;
    max-width: 10.8ch;
    font-family: "Playfair Display","Cormorant Garamond",Georgia,serif;
    font-size: clamp(3.05rem,4.6vw,4.8rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -.038em;
    text-transform: none;
    color: var(--health-ink);
  }

  body.gc-health-layout-base .gc-health-hero__content p {
    margin: 0 0 28px;
    color: var(--health-muted);
    font-size: 1.08rem;
    line-height: 1.75;
  }

  body.gc-health-layout-base .gc-health-hero__media {
    position: relative;
    min-height: 560px;
  }

  body.gc-health-layout-base .gc-health-hero__figure {
    position: absolute;
    inset: 0 0 0 4%;
    margin: 0;
    overflow: hidden;
    border-radius: 30px 110px 30px 30px;
    background: #eee7f1;
    box-shadow: var(--health-shadow);
  }

  body.gc-health-layout-base .gc-health-hero__figure img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  body.gc-health-layout-base .gc-health-hero__secondary {
    display: none;
  }

  body.gc-health-layout-base .gc-health-hero__trust {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin-top: 26px;
    padding-top: 18px;
    border-top: 1px solid var(--health-border);
    color: #685f6c;
    font-size: .9rem;
  }

  body.gc-health-layout-base .gc-health-hero__trust:empty { display:none; }

  /* Common sections */
  body.gc-health-layout-base .gc-health-section {
    padding: clamp(78px,8vw,112px) 0;
  }

  /* Modalities */
  body.gc-health-layout-base .gc-health-modalities {
    background: #f4eef7;
  }

  body.gc-health-layout-base .gc-health-modalities__grid {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 20px;
  }

  body.gc-health-layout-base .gc-health-mode-card {
    min-height: 180px;
    padding: 28px;
    background: #fff;
    border: 1px solid var(--health-border);
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(73,54,81,.06);
  }

  body.gc-health-layout-base .gc-health-mode-card__index,
  body.gc-health-layout-base .gc-health-specialty-card__number {
    display: block;
    margin-bottom: 30px;
    color: #b785df;
    font-size: .85rem;
    font-weight: 800;
  }

  body.gc-health-layout-base .gc-health-mode-card h3 {
    margin: 0;
    font-family: "Playfair Display",Georgia,serif;
    font-size: 1.55rem;
  }

  /* Specialties */
  body.gc-health-layout-base .gc-health-specialties {
    background: #fff;
  }

  body.gc-health-layout-base .gc-health-specialties__grid {
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 20px;
  }

  body.gc-health-layout-base .gc-health-specialty-card {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    padding: 28px;
    border: 1px solid var(--health-border);
    border-radius: 24px;
    background: #fbf8fc;
  }

  body.gc-health-layout-base .gc-health-specialty-card h3 {
    margin: 0 0 12px;
    font-family: "Playfair Display",Georgia,serif;
    font-size: 1.5rem;
    line-height: 1.15;
  }

  body.gc-health-layout-base .gc-health-specialty-card p {
    margin: 0 0 24px;
    color: var(--health-muted);
    line-height: 1.65;
  }

  body.gc-health-layout-base .gc-health-specialty-card .gc-btn {
    margin-top: auto;
    align-self: flex-start;
  }

  /* About */
  body.gc-health-layout-base .gc-health-about {
    background: #f6f0f8;
  }

  body.gc-health-layout-base .gc-health-about__inner {
    display: grid;
    grid-template-columns: minmax(340px,.9fr) minmax(0,1.1fr);
    gap: clamp(52px,7vw,96px);
    align-items: center;
  }

  body.gc-health-layout-base .gc-health-about__media figure {
    margin: 0;
    overflow: hidden;
    border-radius: 30px 92px 30px 30px;
    box-shadow: var(--health-shadow);
    background: #e9dfed;
  }

  body.gc-health-layout-base .gc-health-about__media img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 5;
    object-fit: cover;
  }

  body.gc-health-layout-base .gc-health-about__content h2 {
    font-size: clamp(2.5rem,4vw,4.4rem);
  }

  body.gc-health-layout-base .gc-health-about__content > p {
    margin: 22px 0;
    color: var(--health-muted);
    font-size: 1.08rem;
    line-height: 1.8;
  }

  body.gc-health-layout-base .gc-health-about__credentials {
    list-style: none;
    padding: 0;
    margin: 24px 0;
    display: grid;
    gap: 10px;
  }

  body.gc-health-layout-base .gc-health-about__credentials li {
    padding-left: 24px;
    position: relative;
    color: #625869;
  }

  body.gc-health-layout-base .gc-health-about__credentials li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: var(--health-brand);
    font-weight: 800;
  }

  /* Process */
  body.gc-health-layout-base .gc-health-process {
    background: #fff;
  }

  body.gc-health-layout-base .gc-health-process__grid {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 22px;
  }

  body.gc-health-layout-base .gc-health-process-card {
    padding: 30px 26px;
    border-top: 2px solid #c79be8;
    background: #fbf9fc;
    min-height: 220px;
  }

  body.gc-health-layout-base .gc-health-process-card > span {
    display: block;
    margin-bottom: 28px;
    color: #b785df;
    font-size: 1.8rem;
    font-weight: 800;
  }

  body.gc-health-layout-base .gc-health-process-card h3 {
    margin: 0 0 12px;
    font-family: "Playfair Display",Georgia,serif;
    font-size: 1.45rem;
  }

  body.gc-health-layout-base .gc-health-process-card p {
    margin: 0;
    color: var(--health-muted);
    line-height: 1.65;
  }

  /* Testimonials */
  body.gc-health-layout-base .gc-health-testimonials {
    background: #f4eef7;
  }

  body.gc-health-layout-base .gc-health-testimonials__grid {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 20px;
  }

  body.gc-health-layout-base .gc-health-testimonial {
    margin: 0;
    padding: 28px;
    border-radius: 24px;
    background: #fff;
    border: 1px solid var(--health-border);
  }

  body.gc-health-layout-base .gc-health-testimonial p {
    margin: 0 0 18px;
    font-family: "Playfair Display",Georgia,serif;
    font-size: 1.25rem;
    line-height: 1.5;
  }

  /* Final CTA */
  body.gc-health-layout-base .gc-health-final-cta {
    padding: 92px 0;
    background: linear-gradient(135deg,#725190,#5b3c78);
  }

  body.gc-health-layout-base .gc-health-final-cta__panel {
    display: grid;
    grid-template-columns: minmax(0,1fr) auto;
    gap: 40px;
    align-items: center;
    padding: 48px 52px;
    border-radius: 30px;
    background: rgba(255,255,255,.98);
    box-shadow: 0 20px 60px rgba(30,15,40,.18);
  }

  body.gc-health-layout-base .gc-health-final-cta h2 {
    font-size: clamp(2.4rem,4vw,4rem);
  }

  body.gc-health-layout-base .gc-health-final-cta p {
    margin: 14px 0 0;
    color: var(--health-muted);
  }

  body.gc-health-layout-base .gc-health-final-cta__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* Footer */
  body.gc-health-layout-base .gc-health-footer {
    padding: 56px 0;
    background: #2f2636;
    color: #fff;
  }

  body.gc-health-layout-base .gc-health-footer__inner {
    display: grid;
    grid-template-columns: 1.2fr 1fr auto;
    gap: 42px;
    align-items: start;
  }

  body.gc-health-layout-base .gc-health-footer strong {
    font-family: "Playfair Display",Georgia,serif;
    font-size: 1.45rem;
  }

  body.gc-health-layout-base .gc-health-footer p {
    color: rgba(255,255,255,.72);
    line-height: 1.6;
  }

  body.gc-health-layout-base .gc-health-footer__info {
    display: grid;
    gap: 18px;
  }

  body.gc-health-layout-base .gc-health-footer__info span {
    color: #dcbdf0;
    font-size: .72rem;
    font-weight: 800;
    letter-spacing: .15em;
  }

  body.gc-health-layout-base .gc-health-footer__social {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }

  body.gc-health-layout-base .gc-health-footer__social a {
    color: #fff;
    text-decoration: none;
    opacity: .82;
  }

  @media (max-width: 980px) {
    body.gc-health-layout-base .gc-health-header__inner {
      grid-template-columns: 1fr auto;
    }

    body.gc-health-layout-base .gc-health-header__nav {
      display: none;
    }

    body.gc-health-layout-base .gc-health-hero__inner,
    body.gc-health-layout-base .gc-health-about__inner {
      grid-template-columns: 1fr;
    }

    body.gc-health-layout-base .gc-health-hero__media {
      min-height: 500px;
    }

    body.gc-health-layout-base .gc-health-modalities__grid,
    body.gc-health-layout-base .gc-health-process__grid {
      grid-template-columns: 1fr;
    }

    body.gc-health-layout-base .gc-health-specialties__grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    body.gc-health-layout-base .gc-health-final-cta__panel,
    body.gc-health-layout-base .gc-health-footer__inner {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    body.gc-health-layout-base .gc-container {
      width: min(100% - 30px,1200px);
    }

    body.gc-health-layout-base .gc-health-header__brand-copy strong {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    body.gc-health-layout-base .gc-health-header__actions .gc-btn {
      padding: 10px 14px;
      min-height: 42px;
      font-size: .8rem;
    }

    body.gc-health-layout-base .gc-health-hero {
      padding: 58px 0 64px;
    }

    body.gc-health-layout-base .gc-health-hero__content h1 {
      font-size: clamp(2.5rem,12vw,3.8rem);
    }

    body.gc-health-layout-base .gc-health-hero__media {
      min-height: 390px;
    }

    body.gc-health-layout-base .gc-health-hero__figure {
      inset: 0;
      border-radius: 24px 70px 24px 24px;
    }

    body.gc-health-layout-base .gc-health-specialties__grid {
      grid-template-columns: 1fr;
    }

    body.gc-health-layout-base .gc-health-final-cta__panel {
      padding: 32px 24px;
    }
  }
  `;
}

function resolveLayoutBaseId(request: any): string {
  const raw = request?.raw || {};
  return String(
    request?.layoutBaseId ||
      raw?.layoutBaseId ||
      request?.selectedVariation?.layoutBaseId ||
      request?.aiVariation?.layoutBaseId ||
      raw?.selectedVariation?.layoutBaseId ||
      raw?.aiVariation?.layoutBaseId ||
      request?.layoutBase?.id ||
      raw?.layoutBase?.id ||
      "",
  ).trim();
}
