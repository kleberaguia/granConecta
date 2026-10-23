import type { RenderContext } from "../render-engine/renderTypes";

export function buildDesignSystemCss(context: RenderContext): string {
  const d = context.designSystem;
  if (!d) return "";

  const radius = d.radius === "none" ? "0px" : d.radius === "small" ? "10px" : d.radius === "large" ? "30px" : d.radius === "organic" ? "36px 12px 36px 12px" : "20px";
  const shadow = d.shadow === "none" ? "none" : d.shadow === "deep" ? "0 35px 100px rgba(0,0,0,.28)" : d.shadow === "soft" ? "0 18px 50px rgba(15,23,42,.08)" : "0 28px 80px rgba(15,23,42,.14)";

  return `
:root{
  --gc-design-max:${d.maxWidth}px;
  --gc-section-space:${d.sectionSpace}px;
  --gc-display-size:${d.scale.display};
  --gc-h1-size:${d.scale.h1};
  --gc-h2-size:${d.scale.h2};
  --gc-body-size:${d.scale.body};
  --gc-design-radius:${radius};
  --gc-design-shadow:${shadow};
}
.gc-design-v2 .gc-container{width:min(var(--gc-design-max),calc(100% - 48px))}
.gc-design-v2 .gc-composition-group{position:relative;isolation:isolate}
.gc-design-v2 .gc-section-heading h2{font-size:var(--gc-h2-size);line-height:.98;letter-spacing:-.045em}
.gc-design-v2 .gc-section-heading p{font-size:var(--gc-body-size);line-height:1.75}
.gc-design-v2 .gc-btn{transition:transform .28s ease,box-shadow .28s ease,background .28s ease}
.gc-design-v2 .gc-btn:hover{transform:translateY(-2px)}

/* PREMIUM HERO COMMON */
.gc-design-v2 .gc-hero{overflow:clip}
.gc-design-v2 .gc-hero h1{font-size:var(--gc-h1-size);line-height:.92;letter-spacing:-.062em;text-wrap:balance}
.gc-design-v2 .gc-hero p{font-size:var(--gc-body-size)}
.gc-hero-decor{position:absolute;pointer-events:none;z-index:0}
.gc-hero-decor--orb{width:320px;height:320px;border-radius:50%;filter:blur(1px);background:color-mix(in srgb,var(--gc-accent) 18%,transparent)}
.gc-hero-decor--line{height:1px;background:color-mix(in srgb,var(--gc-text) 18%,transparent)}
.gc-hero-decor--label{font-size:11px;letter-spacing:.24em;text-transform:uppercase;font-weight:800;opacity:.55}

/* LUXURY EDITORIAL */
.gc-design--luxury-editorial .gc-hero-luxury{min-height:760px;padding:108px 0 128px;background:linear-gradient(118deg,var(--gc-background) 0 54%,color-mix(in srgb,var(--gc-accent) 7%,var(--gc-surface)) 54% 100%)}
.gc-design--luxury-editorial .gc-hero-luxury__inner{grid-template-columns:minmax(0,.82fr) minmax(480px,1.18fr);gap:88px;align-items:center}
.gc-design--luxury-editorial .gc-hero-luxury__copy{position:relative;z-index:3;max-width:640px}
.gc-design--luxury-editorial .gc-hero-luxury__copy h1{font-family:"Cormorant Garamond","Playfair Display",serif;font-size:var(--gc-display-size);font-weight:600;line-height:.82;letter-spacing:-.055em;margin-left:-3px}
.gc-design--luxury-editorial .gc-hero-luxury__copy>p{max-width:540px;margin-top:28px}
.gc-design--luxury-editorial .gc-hero-luxury__media{position:relative;z-index:2;min-height:620px}
.gc-design--luxury-editorial .gc-hero-luxury__frame{position:absolute;inset:0 0 0 9%;padding:0;border:0;border-radius:0;background:none}
.gc-design--luxury-editorial .gc-hero-luxury__frame img,.gc-design--luxury-editorial .gc-hero-luxury__placeholder{width:100%;height:620px;object-fit:cover;border-radius:var(--gc-design-radius);box-shadow:var(--gc-design-shadow)}
.gc-design--luxury-editorial .gc-hero-luxury__secondary{position:absolute;left:-8%;bottom:-42px;width:34%;z-index:4;padding:9px;background:var(--gc-surface);box-shadow:var(--gc-design-shadow)}
.gc-design--luxury-editorial .gc-hero-luxury__secondary img{width:100%;aspect-ratio:4/5;object-fit:cover}
.gc-design--luxury-editorial .gc-hero-luxury__signature{left:auto;right:-28px;bottom:32px;min-width:210px;background:color-mix(in srgb,var(--gc-primary) 94%,#000);border-radius:0;padding:20px 24px}
.gc-design--luxury-editorial .gc-hero-luxury .gc-hero-decor--orb{right:-120px;top:-110px}
.gc-design--luxury-editorial .gc-hero-luxury .gc-hero-decor--line{left:0;bottom:82px;width:42%}

/* MAGAZINE */
.gc-design--editorial-story .gc-hero-magazine{padding:118px 0 132px;background:var(--gc-background)}
.gc-design--editorial-story .gc-hero-magazine__inner{grid-template-columns:minmax(420px,.92fr) minmax(0,1.08fr);gap:8vw;align-items:center}
.gc-design--editorial-story .gc-hero-magazine__media{position:relative;min-height:650px}
.gc-design--editorial-story .gc-hero-magazine__media>img{width:76%;height:610px;object-fit:cover;margin-left:auto;box-shadow:var(--gc-design-shadow)}
.gc-design--editorial-story .gc-hero-magazine__secondary{position:absolute;left:0;bottom:-42px;width:39%;margin:0;padding:8px;background:var(--gc-surface);box-shadow:var(--gc-design-shadow);z-index:3}
.gc-design--editorial-story .gc-hero-magazine__secondary img{width:100%;aspect-ratio:4/5;object-fit:cover}
.gc-design--editorial-story .gc-hero-magazine__number{position:absolute;left:-12px;top:-42px;font-family:"Cormorant Garamond",serif;font-size:clamp(96px,12vw,180px);line-height:1;color:color-mix(in srgb,var(--gc-accent) 22%,transparent);z-index:0}
.gc-design--editorial-story .gc-hero-magazine__caption{position:absolute;right:0;bottom:-26px;writing-mode:vertical-rl;letter-spacing:.18em;text-transform:uppercase;font-size:10px}
.gc-design--editorial-story .gc-hero-magazine__copy h1{font-family:"Playfair Display",serif;font-size:var(--gc-display-size);font-weight:600;line-height:.88}

/* CINEMATIC / SERVICE */
.gc-design--cinematic-impact .gc-hero-service--conversion,.gc-design--cinematic-impact .gc-hero-immersive{min-height:min(860px,92vh)}
.gc-design--cinematic-impact .gc-hero-service__background img{opacity:.72;filter:saturate(.9) contrast(1.06)}
.gc-design--cinematic-impact .gc-hero-service__veil{background:linear-gradient(90deg,rgba(5,7,12,.92) 0%,rgba(5,7,12,.74) 44%,rgba(5,7,12,.18) 78%,rgba(5,7,12,.05) 100%)}
.gc-design--cinematic-impact .gc-hero-service__conversion-inner{align-items:center;grid-template-columns:minmax(0,1.35fr) minmax(290px,.5fr)}
.gc-design--cinematic-impact .gc-hero-service__conversion-copy h1{font-size:var(--gc-display-size);text-transform:none;max-width:980px}
.gc-design--cinematic-impact .gc-hero-service__conversion-card{backdrop-filter:blur(18px);background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.35)}
.gc-design--cinematic-impact .gc-hero-immersive__content h1{font-size:var(--gc-display-size);max-width:980px}

/* MINIMAL */
.gc-design--minimal-premium .gc-hero-minimal{padding:116px 0 110px;background:var(--gc-background)}
.gc-design--minimal-premium .gc-hero-minimal__inner{text-align:left;max-width:none}
.gc-design--minimal-premium .gc-hero-minimal__inner>h1{max-width:980px;font-family:"Cormorant Garamond",serif;font-size:var(--gc-display-size);font-weight:500;line-height:.9}
.gc-design--minimal-premium .gc-hero-minimal__inner>p{max-width:600px;margin:26px 0 34px}
.gc-design--minimal-premium .gc-hero-minimal__media{margin-top:70px;overflow:hidden}
.gc-design--minimal-premium .gc-hero-minimal__media img{width:100%;height:min(56vw,650px);object-fit:cover;border-radius:0;box-shadow:none}

/* MARKETPLACE */
.gc-design--commerce-dynamic .gc-hero-marketplace{padding:86px 0 110px;background:radial-gradient(circle at 85% 15%,color-mix(in srgb,var(--gc-accent) 16%,transparent),transparent 30%),linear-gradient(135deg,var(--gc-background),var(--gc-surface))}
.gc-design--commerce-dynamic .gc-hero-marketplace__inner{grid-template-columns:.82fr 1.18fr;gap:56px}
.gc-design--commerce-dynamic .gc-hero-marketplace__copy h1{font-size:var(--gc-display-size);max-width:640px}
.gc-design--commerce-dynamic .gc-hero-marketplace__cards{display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:1fr 1fr;gap:14px;min-height:560px}
.gc-design--commerce-dynamic .gc-hero-marketplace__card{position:relative;min-height:0;border:0;border-radius:var(--gc-design-radius);overflow:hidden;padding:0;box-shadow:var(--gc-design-shadow);text-align:left}
.gc-design--commerce-dynamic .gc-hero-marketplace__card:first-child{grid-row:1 / span 2}
.gc-design--commerce-dynamic .gc-hero-marketplace__card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.gc-design--commerce-dynamic .gc-hero-marketplace__card::after{content:"";position:absolute;inset:35% 0 0;background:linear-gradient(transparent,rgba(0,0,0,.75))}
.gc-design--commerce-dynamic .gc-hero-marketplace__card strong,.gc-design--commerce-dynamic .gc-hero-marketplace__card span{position:absolute;z-index:2;left:22px;color:#fff}
.gc-design--commerce-dynamic .gc-hero-marketplace__card strong{bottom:48px;font-size:18px}
.gc-design--commerce-dynamic .gc-hero-marketplace__card span{bottom:24px}

@media (max-width:980px){
  .gc-design-v2 .gc-container{width:min(var(--gc-design-max),calc(100% - 36px))}
  .gc-design--luxury-editorial .gc-hero-luxury__inner,.gc-design--editorial-story .gc-hero-magazine__inner,.gc-design--commerce-dynamic .gc-hero-marketplace__inner{grid-template-columns:1fr;gap:58px}
  .gc-design--luxury-editorial .gc-hero-luxury__media{min-height:560px}
  .gc-design--luxury-editorial .gc-hero-luxury__frame{inset:0 5% 0 5%}
  .gc-design--luxury-editorial .gc-hero-luxury__secondary{left:0;width:30%}
  .gc-design--editorial-story .gc-hero-magazine__media{min-height:570px}
  .gc-design--editorial-story .gc-hero-magazine__media>img{height:540px}
  .gc-design--commerce-dynamic .gc-hero-marketplace__cards{min-height:500px}
}

/* TYPOGRAPHY ENGINE 2.0 */
.gc-design-v2{
  --gc-heading-family:${d.typography.headingFamily};
  --gc-body-family:${d.typography.bodyFamily};
  --gc-accent-family:${d.typography.accentFamily};
  --gc-title-weight:${d.typography.titleWeight};
  --gc-title-tracking:${d.typography.titleTracking};
  --gc-title-line:${d.typography.titleLineHeight};
  --gc-title-width:${d.typography.maxTitleWidth};
  --gc-reveal-distance:${d.motion.revealDistance}px;
  --gc-reveal-duration:${d.motion.revealDuration}ms;
  --gc-stagger:${d.motion.staggerMs}ms;
  font-family:var(--gc-body-family);
}
.gc-design-v2 h1,.gc-design-v2 h2,.gc-design-v2 h3{font-family:var(--gc-heading-family)}
.gc-design-v2 .gc-hero h1{
  max-width:var(--gc-title-width);
  font-family:var(--gc-heading-family);
  font-weight:var(--gc-title-weight);
  letter-spacing:var(--gc-title-tracking);
  line-height:var(--gc-title-line);
}
.gc-hero-title__leading,.gc-hero-title__accent{display:inline}
.gc-title-treatment--editorial-mixed .gc-hero-title__accent,
.gc-title-treatment--display-serif .gc-hero-title__accent,
.gc-title-treatment--human-elegant .gc-hero-title__accent{
  font-family:var(--gc-accent-family);
  font-style:italic;
  font-weight:500;
  letter-spacing:-.035em;
}
.gc-title-treatment--bold-grotesk .gc-hero-title__accent{
  display:inline-block;
  font-weight:900;
  letter-spacing:-.065em;
}
.gc-title-treatment--commerce-display .gc-hero-title__accent{
  text-decoration:underline;
  text-decoration-thickness:.08em;
  text-underline-offset:.09em;
  text-decoration-color:color-mix(in srgb,var(--gc-accent) 55%,transparent);
}
.gc-title-treatment--minimal-display .gc-hero-title__accent{font-weight:400;opacity:.78}
.gc-hero-supporting{max-width:54ch;line-height:1.7}
.gc-copy-role--statement{
  font-family:var(--gc-accent-family);
  font-size:clamp(18px,1.7vw,24px)!important;
  font-style:italic;
  letter-spacing:-.015em;
  opacity:.82;
  max-width:38ch;
}
.gc-copy-role--microcopy{font-size:clamp(14px,1.15vw,17px)!important;max-width:62ch;opacity:.72}

/* LAYER ENGINE */
.gc-design-v2 .gc-hero{position:relative;isolation:isolate}
.gc-design-v2 .gc-hero::before,.gc-design-v2 .gc-hero::after{content:"";position:absolute;pointer-events:none;z-index:0}
.gc-design--luxury-editorial .gc-hero::before{
  width:clamp(180px,22vw,360px);aspect-ratio:1;border:1px solid color-mix(in srgb,var(--gc-accent) 24%,transparent);
  border-radius:50%;right:-8vw;top:7%;
}
.gc-design--luxury-editorial .gc-hero::after{
  width:1px;height:36%;background:color-mix(in srgb,var(--gc-text) 16%,transparent);left:6.5%;bottom:0;
}
.gc-design--editorial-story .gc-hero::before{
  width:46vw;height:46vw;max-width:620px;max-height:620px;border-radius:50%;
  background:color-mix(in srgb,var(--gc-accent) 8%,transparent);left:-18vw;top:-17vw;
}
.gc-design--cinematic-impact .gc-hero::after{
  inset:auto 4vw 6vh auto;width:min(42vw,560px);height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55));
}
.gc-design--commerce-dynamic .gc-hero::before{
  width:190px;height:190px;border-radius:28% 72% 64% 36% / 42% 36% 64% 58%;
  background:color-mix(in srgb,var(--gc-accent) 12%,transparent);right:5vw;top:3vw;transform:rotate(18deg);
}
.gc-design-v2 .gc-hero>*{position:relative;z-index:1}
.gc-design-v2 .gc-kicker{letter-spacing:.22em;text-transform:uppercase;font-size:11px;font-weight:800}

/* MOTION ENGINE */
.gc-motion-ready .gc-reveal{
  opacity:0;
  transform:translate3d(0,var(--gc-reveal-distance),0);
  transition:opacity var(--gc-reveal-duration) cubic-bezier(.2,.75,.2,1),transform var(--gc-reveal-duration) cubic-bezier(.2,.75,.2,1);
  transition-delay:calc(var(--gc-reveal-index,0) * var(--gc-stagger));
  will-change:opacity,transform;
}
.gc-motion-ready .gc-reveal.is-visible{opacity:1;transform:translate3d(0,0,0)}
.gc-design-v2 .gc-hero-luxury__frame img,
.gc-design-v2 .gc-hero-magazine__media>img,
.gc-design-v2 .gc-hero-minimal__media img,
.gc-design-v2 .gc-hero-service__background img,
.gc-design-v2 .gc-hero-immersive{
  transform-origin:center center;
}
.gc-design--luxury-editorial .gc-hero-luxury__frame img,
.gc-design--editorial-story .gc-hero-magazine__media>img,
.gc-design--cinematic-impact .gc-hero-service__background img{
  animation:gcMediaBreath 14s ease-in-out infinite alternate;
}
.gc-design-v2 .gc-hero-luxury__secondary,
.gc-design-v2 .gc-hero-magazine__secondary{animation:gcFloatMedia 7s ease-in-out infinite alternate}
.gc-design-v2 .gc-category-card,
.gc-design-v2 .gc-collection-card,
.gc-design-v2 .gc-offer-card,
.gc-design-v2 .gc-benefit-card,
.gc-design-v2 .gc-product-card,
.gc-design-v2 .gc-service-card{transition:transform .35s cubic-bezier(.2,.75,.2,1),box-shadow .35s ease}
.gc-design-v2 .gc-category-card:hover,
.gc-design-v2 .gc-collection-card:hover,
.gc-design-v2 .gc-offer-card:hover,
.gc-design-v2 .gc-benefit-card:hover,
.gc-design-v2 .gc-product-card:hover,
.gc-design-v2 .gc-service-card:hover{transform:translateY(-6px);box-shadow:0 26px 70px rgb(15 23 42/.14)}
@keyframes gcMediaBreath{from{transform:scale(1.025)}to{transform:scale(1.065)}}
@keyframes gcFloatMedia{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-10px,0)}}

/* SECTION RHYTHM / PREMIUM FINISH */
.gc-design-v2 section:not(.gc-hero):not(.gc-topbar):not(.gc-header):not(.gc-footer){padding-block:var(--gc-section-space)}
.gc-design--luxury-editorial .gc-section-heading,.gc-design--editorial-story .gc-section-heading{max-width:760px}
.gc-design--luxury-editorial .gc-section-heading h2,.gc-design--editorial-story .gc-section-heading h2{font-family:var(--gc-accent-family);font-weight:500}
.gc-design--minimal-premium .gc-section-heading h2{font-weight:500;max-width:14ch}
.gc-design--cinematic-impact .gc-section-heading h2{font-family:"Montserrat","Inter",sans-serif;font-weight:850;letter-spacing:-.055em}

@media (prefers-reduced-motion:reduce){
  .gc-motion-ready .gc-reveal{opacity:1!important;transform:none!important;transition:none!important}
  .gc-design-v2 *{animation:none!important;scroll-behavior:auto!important}
}

@media (max-width:620px){
  .gc-design-v2 .gc-container{width:calc(100% - 28px)}
  .gc-design-v2 .gc-hero{padding-top:74px;padding-bottom:82px}
  .gc-design--luxury-editorial .gc-hero-luxury__copy h1,.gc-design--editorial-story .gc-hero-magazine__copy h1{font-size:clamp(52px,16vw,78px)}
  .gc-design--luxury-editorial .gc-hero-luxury__media{min-height:430px}
  .gc-design--luxury-editorial .gc-hero-luxury__frame{inset:0}
  .gc-design--luxury-editorial .gc-hero-luxury__frame img{height:410px}
  .gc-design--luxury-editorial .gc-hero-luxury__secondary{width:34%;bottom:-24px}
  .gc-design--luxury-editorial .gc-hero-luxury__signature{right:8px;bottom:12px;min-width:170px;padding:14px 16px}
  .gc-design--editorial-story .gc-hero-magazine__media{min-height:470px}
  .gc-design--editorial-story .gc-hero-magazine__media>img{width:82%;height:450px}
  .gc-design--editorial-story .gc-hero-magazine__secondary{width:42%;bottom:-18px}
  .gc-design--commerce-dynamic .gc-hero-marketplace__cards{grid-template-columns:1fr 1fr;grid-template-rows:340px 190px;min-height:0}
  .gc-design--commerce-dynamic .gc-hero-marketplace__card:first-child{grid-column:1 / span 2;grid-row:auto}
}
`;
}
