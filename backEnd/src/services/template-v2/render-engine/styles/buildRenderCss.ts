import type { RenderContext } from "../renderTypes";

export function buildRenderCss(context: RenderContext): string {
  const { palette, variation } = context;

  const headingFont =
    variation.family === "magazine-story" ||
    variation.family === "luxury-editorial"
      ? `"Playfair Display"`
      : `"Montserrat"`;

  return `
*{box-sizing:border-box}
:root{
  --gc-background:${palette.background};
  --gc-surface:${palette.surface};
  --gc-primary:${palette.primary};
  --gc-secondary:${palette.secondary};
  --gc-accent:${palette.accent};
  --gc-text:${palette.text};
  --gc-muted:${palette.mutedText};
  --gc-radius:24px;
  --gc-shadow:0 24px 70px rgba(15,23,42,.10);
  --gc-heading-font:${headingFont};
  --gc-body-font:"Inter";

  /* Derived palette tokens: toda a landing passa a nascer da paleta escolhida */
  --gc-primary-strong:color-mix(in srgb,var(--gc-primary) 82%,#000);
  --gc-primary-soft:color-mix(in srgb,var(--gc-primary) 10%,var(--gc-background));
  --gc-secondary-soft:color-mix(in srgb,var(--gc-secondary) 12%,var(--gc-background));
  --gc-accent-soft:color-mix(in srgb,var(--gc-accent) 14%,var(--gc-background));
  --gc-border:color-mix(in srgb,var(--gc-text) 11%,transparent);
  --gc-border-strong:color-mix(in srgb,var(--gc-text) 20%,transparent);
  --gc-on-primary:var(--gc-surface);
  --gc-on-accent:color-mix(in srgb,var(--gc-text) 88%,#000);
  --gc-section-tint:color-mix(in srgb,var(--gc-primary) 5%,var(--gc-background));
}

html{scroll-behavior:smooth}
body{
  margin:0;
  background:var(--gc-background);
  color:var(--gc-text);
  font-family:var(--gc-body-font),Arial,sans-serif;
  overflow-x:hidden;
}
img{max-width:100%;display:block}
a{text-decoration:none;color:inherit}
button{font-family:inherit}
.gc-container{width:min(1180px,calc(100% - 40px));margin:0 auto}

.gc-topbar{
  background:var(--gc-primary);
  color:var(--gc-surface);
  font-size:12px;
  font-weight:800;
  letter-spacing:.06em;
}
.gc-topbar__inner{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:10px;
  text-align:center;
  padding:10px 0;
}

.gc-header{
  position:sticky;
  top:0;
  z-index:20;
  background:color-mix(in srgb,var(--gc-background) 88%,transparent);
  backdrop-filter:blur(14px);
  border-bottom:1px solid var(--gc-border);
}
.gc-header__inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
  padding:18px 0;
}
.gc-brand{
  font-family:var(--gc-heading-font),serif;
  font-size:28px;
  font-weight:900;
  color:var(--gc-primary);
}
.gc-nav{
  display:flex;
  align-items:center;
  gap:22px;
  flex-wrap:wrap;
}
.gc-nav a{
  font-size:14px;
  font-weight:800;
  color:var(--gc-muted);
}

/* HERO */
.gc-hero{
  position:relative;
  padding:94px 0;
  background:linear-gradient(135deg,var(--gc-background),var(--gc-surface));
  overflow:hidden;
}
.gc-hero__inner{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:56px;
  align-items:center;
}
.gc-hero__copy h1,
.gc-hero__center h1,
.gc-hero__overlay-content h1,
.gc-hero__minimal-inner h1{
  font-family:var(--gc-heading-font),serif;
  font-size:clamp(42px,6vw,82px);
  line-height:.96;
  letter-spacing:-.055em;
  margin:0 0 22px;
}
.gc-hero__copy p,
.gc-hero__center p,
.gc-hero__overlay-content p,
.gc-hero__minimal-inner p{
  font-size:18px;
  line-height:1.75;
  color:var(--gc-muted);
  margin:0 0 30px;
  max-width:680px;
}
.gc-kicker,
.gc-section-heading span,
.gc-about__copy span,
.gc-contact span,
.gc-featured span{
  display:inline-flex;
  margin-bottom:12px;
  color:var(--gc-accent);
  font-size:12px;
  font-weight:900;
  letter-spacing:.14em;
  text-transform:uppercase;
}
.gc-actions{
  display:flex;
  gap:12px;
  flex-wrap:wrap;
}
.gc-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:48px;
  padding:14px 26px;
  border-radius:999px;
  border:1px solid transparent;
  font-weight:900;
  cursor:pointer;
}
.gc-btn--primary{
  background:var(--gc-accent);
  color:var(--gc-on-accent);
}
.gc-btn--secondary{
  background:transparent;
  color:var(--gc-primary);
  border-color:var(--gc-border-strong);
}

.gc-hero__media img,
.gc-about__image img{
  width:100%;
  height:520px;
  object-fit:cover;
  border-radius:var(--gc-radius);
  box-shadow:var(--gc-shadow);
}

.gc-hero__center{
  text-align:center;
  max-width:980px;
}
.gc-hero__center p{
  margin-left:auto;
  margin-right:auto;
}
.gc-hero__center .gc-actions{
  justify-content:center;
}
.gc-hero__wide-media{
  margin-top:44px;
}
.gc-hero__wide-media img{
  width:100%;
  height:460px;
  object-fit:cover;
  border-radius:var(--gc-radius);
  box-shadow:var(--gc-shadow);
}

.gc-hero--dark{
  min-height:680px;
  display:flex;
  align-items:center;
  color:var(--gc-surface);
  background:var(--gc-primary-strong);
}
.gc-hero__background{
  position:absolute;
  inset:0;
}
.gc-hero__background img{
  width:100%;
  height:100%;
  object-fit:cover;
  opacity:.42;
}
.gc-hero--dark::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,var(--gc-primary-strong) 0%,color-mix(in srgb,var(--gc-primary-strong) 78%,transparent) 45%,color-mix(in srgb,var(--gc-primary-strong) 24%,transparent) 100%);
}
.gc-hero__overlay-content{
  position:relative;
  z-index:1;
  max-width:760px;
}
.gc-hero__overlay-content p{
  color:color-mix(in srgb,var(--gc-on-primary) 84%,transparent);
}
.gc-hero__overlay-content .gc-btn--secondary{
  color:var(--gc-surface);
  border-color:color-mix(in srgb,var(--gc-on-primary) 45%,transparent);
}

.gc-hero__catalog-layout{
  display:grid;
  grid-template-columns:.9fr 1.1fr;
  gap:42px;
  align-items:center;
}
.gc-hero__catalog-cards{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px;
}
.gc-hero-mini-product{
  background:var(--gc-surface);
  border-radius:20px;
  box-shadow:var(--gc-shadow);
  padding:14px;
  cursor:pointer;
}
.gc-hero-mini-product img{
  width:100%;
  height:180px;
  object-fit:cover;
  border-radius:16px;
  margin-bottom:12px;
}
.gc-hero-mini-product strong{
  display:block;
  font-weight:900;
}
.gc-hero-mini-product span{
  color:var(--gc-muted);
  font-size:13px;
}

.gc-hero__magazine-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:54px;
  align-items:center;
}
.gc-hero__magazine-image img{
  width:100%;
  height:600px;
  object-fit:cover;
  border-radius:90px 0 90px 0;
  box-shadow:var(--gc-shadow);
}
.gc-hero--minimal{
  text-align:center;
}
.gc-hero__minimal-inner{
  max-width:920px;
}
.gc-hero__minimal-inner p{
  margin-left:auto;
  margin-right:auto;
}
.gc-hero__minimal-inner .gc-actions{
  justify-content:center;
}


/* NEW HERO LIBRARY */
.gc-hero-food {
  background:
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--gc-accent) 28%, transparent), transparent 34%),
    linear-gradient(135deg, var(--gc-primary-strong), var(--gc-primary));
  color: var(--gc-surface);
}

.gc-hero-food__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 58px;
  align-items: center;
}

.gc-hero-food__copy h1,
.gc-hero-marketplace__copy h1,
.gc-hero-service__copy h1,
.gc-hero-luxury__copy h1,
.gc-hero-minimal__inner h1 {
  font-family: var(--gc-heading-font), serif;
  font-size: clamp(42px, 6vw, 84px);
  line-height: .94;
  letter-spacing: -.055em;
  margin: 0 0 22px;
}

.gc-hero-food__copy p,
.gc-hero-marketplace__copy p,
.gc-hero-service__copy p,
.gc-hero-luxury__copy p,
.gc-hero-minimal__inner p {
  font-size: 18px;
  line-height: 1.75;
  margin: 0 0 30px;
  max-width: 680px;
}

.gc-hero-food__copy p {
  color: color-mix(in srgb,var(--gc-on-primary) 86%,var(--gc-accent));
}

.gc-hero-food .gc-btn--secondary {
  color: var(--gc-surface);
  border-color: rgba(255,255,255,.38);
}

.gc-hero-food__badges,
.gc-hero-service__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.gc-hero-food__badges span,
.gc-hero-service__trust span {
  display: inline-flex;
  padding: 9px 13px;
  border-radius: 999px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.16);
  font-size: 13px;
  font-weight: 900;
}

.gc-hero-food__media {
  position: relative;
}

.gc-hero-food__media img {
  width: 100%;
  height: 540px;
  object-fit: cover;
  border-radius: 44px;
  box-shadow: 20px 20px 0 color-mix(in srgb, var(--gc-accent) 70%, #000);
}

.gc-hero-food__offer {
  position: absolute;
  top: 22px;
  left: 22px;
  z-index: 2;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--gc-accent);
  color: #111827;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(0,0,0,.24);
}

.gc-hero-marketplace {
  background: linear-gradient(180deg, var(--gc-background), var(--gc-surface));
}

.gc-hero-marketplace__inner {
  display: grid;
  grid-template-columns: .85fr 1.15fr;
  gap: 42px;
  align-items: center;
}

.gc-hero-marketplace__copy p {
  color: var(--gc-muted);
}

.gc-hero-marketplace__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.gc-hero-marketplace__card {
  border: 1px solid var(--gc-border);
  background: var(--gc-surface);
  border-radius: 22px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--gc-shadow);
}

.gc-hero-marketplace__card img {
  width: 100%;
  height: 210px;
  object-fit: contain;
  border-radius: 18px;
  background: var(--gc-primary-soft);
  margin-bottom: 12px;
}

.gc-hero-marketplace__card strong {
  display: block;
  font-size: 15px;
  font-weight: 900;
  color: var(--gc-text);
}

.gc-hero-marketplace__card span {
  display: block;
  margin-top: 5px;
  color: var(--gc-accent);
  font-weight: 900;
}

.gc-hero-service {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--gc-accent) 24%, transparent), transparent 36%),
    linear-gradient(135deg, var(--gc-background), var(--gc-surface));
}

.gc-hero-service__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 58px;
  align-items: center;
}

.gc-hero-service__copy p {
  color: var(--gc-muted);
}

.gc-hero-service__trust span {
  background: var(--gc-surface);
  color: var(--gc-text);
  border-color: var(--gc-border);
  box-shadow: 0 8px 22px color-mix(in srgb,var(--gc-text) 8%,transparent);
}

.gc-hero-service__media {
  position: relative;
}

.gc-hero-service__media img {
  width: 100%;
  height: 540px;
  object-fit: cover;
  border-radius: 34px;
  box-shadow: var(--gc-shadow);
}

.gc-hero-service__card {
  position: absolute;
  left: 26px;
  right: 26px;
  bottom: 26px;
  padding: 22px;
  border-radius: 24px;
  background: color-mix(in srgb,var(--gc-surface) 92%,transparent);
  backdrop-filter: blur(16px);
  box-shadow: 0 18px 40px color-mix(in srgb,var(--gc-text) 16%,transparent);
}

.gc-hero-service__card strong {
  display: block;
  font-size: 18px;
  font-weight: 900;
  color: var(--gc-text);
}

.gc-hero-service__card span {
  display: block;
  margin-top: 6px;
  color: var(--gc-muted);
}

.gc-hero-luxury {
  background:
    linear-gradient(90deg, var(--gc-background) 0%, var(--gc-surface) 100%);
}

.gc-hero-luxury__inner {
  display: grid;
  grid-template-columns: .95fr 1.05fr;
  gap: 60px;
  align-items: center;
}

.gc-hero-luxury__copy p {
  color: var(--gc-muted);
}

.gc-hero-luxury__frame {
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--gc-accent) 45%, transparent);
  border-radius: 120px 0 120px 0;
}

.gc-hero-luxury__frame img {
  width: 100%;
  height: 560px;
  object-fit: cover;
  border-radius: 100px 0 100px 0;
  box-shadow: var(--gc-shadow);
}

.gc-hero-minimal {
  text-align: center;
  background: var(--gc-surface);
}

.gc-hero-minimal__inner {
  max-width: 920px;
}

.gc-hero-minimal__inner p {
  color: var(--gc-muted);
  margin-left: auto;
  margin-right: auto;
}

.gc-hero-minimal__inner .gc-actions {
  justify-content: center;
}

/* SECTION BASE */
.gc-section-heading{
  text-align:center;
  max-width:760px;
  margin:0 auto 38px;
}
.gc-section-heading h2{
  font-family:var(--gc-heading-font),serif;
  font-size:clamp(34px,4vw,54px);
  line-height:1;
  margin:0 0 12px;
  letter-spacing:-.04em;
}
.gc-section-heading p{
  margin:0;
  color:var(--gc-muted);
  line-height:1.7;
}

.gc-categories,
.gc-featured,
.gc-products,
.gc-services,
.gc-about,
.gc-testimonials,
.gc-faq{
  padding:86px 0;
}

.gc-category-grid,
.gc-products-grid,
.gc-services-grid,
.gc-benefits-grid,
.gc-testimonial-grid{
  display:grid;
  gap:24px;
}
.gc-category-grid{grid-template-columns:repeat(4,1fr)}
.gc-products-grid,.gc-services-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.gc-benefits-grid{grid-template-columns:repeat(4,1fr)}
.gc-testimonial-grid{grid-template-columns:repeat(3,1fr)}

.gc-category-card,
.gc-product-card,
.gc-service-card,
.gc-benefit-card,
.gc-testimonial-card,
details{
  background:var(--gc-surface);
  border:1px solid var(--gc-border);
  border-radius:var(--gc-radius);
  box-shadow:var(--gc-shadow);
  overflow:hidden;
}

.gc-category-card{
  padding:16px;
  text-align:left;
  cursor:pointer;
}
.gc-category-card img{
  width:100%;
  height:140px;
  object-fit:cover;
  border-radius:18px;
  margin-bottom:12px;
}

.gc-featured{
  background:var(--gc-primary);
  color:var(--gc-surface);
}
.gc-featured__inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:28px;
}
.gc-featured h2{
  font-family:var(--gc-heading-font),serif;
  font-size:clamp(34px,4vw,58px);
  line-height:1;
  margin:0 0 14px;
}
.gc-featured p{
  color:color-mix(in srgb,var(--gc-surface) 75%,transparent);
  max-width:650px;
}

/* PRODUCTS */
.gc-product-card{
  display:flex;
  flex-direction:column;
}
.gc-product-card__image{
  position:relative;
  background:var(--gc-primary-soft);
}
.gc-product-card__image img{
  width:100%;
  height:300px;
  object-fit:contain;
  padding:18px;
}
.gc-product-card__body,
.gc-service-card{
  padding:22px;
  display:flex;
  flex-direction:column;
  gap:12px;
}
.gc-product-card h3,
.gc-service-card h3{
  font-family:var(--gc-heading-font),serif;
  font-size:24px;
  line-height:1.15;
  margin:0;
}
.gc-product-card p,
.gc-service-card p{
  margin:0;
  color:var(--gc-muted);
  line-height:1.6;
}
.gc-badge{
  position:absolute;
  top:16px;
  left:16px;
  background:var(--gc-accent);
  color:var(--gc-on-accent);
  border-radius:999px;
  padding:7px 12px;
  font-size:12px;
  font-weight:900;
}
.gc-price{
  display:flex;
  gap:10px;
  align-items:center;
  flex-wrap:wrap;
}
.gc-price small{
  text-decoration:line-through;
  color:var(--gc-muted);
  font-weight:800;
}
.gc-price strong{
  font-size:22px;
  color:var(--gc-accent);
  font-weight:900;
}
.gc-card-actions{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-top:auto;
}
.gc-card-actions button{
  min-height:44px;
  border:0;
  border-radius:999px;
  background:var(--gc-primary);
  color:var(--gc-surface);
  font-weight:900;
  cursor:pointer;
}
.gc-card-actions [data-gc-wishlist]{
  background:transparent;
  color:var(--gc-primary);
  border:1px solid var(--gc-border-strong);
}

/* Product styles */
.gc-products-grid--catalog{
  grid-template-columns:repeat(4,minmax(0,1fr));
}
.gc-products-grid--catalog .gc-product-card__image img{
  height:240px;
}
.gc-products-grid--catalog .gc-product-card h3{
  font-family:Montserrat,Arial,sans-serif;
  font-size:18px;
}
.gc-products-list--bold{
  display:grid;
  gap:22px;
}
.gc-product-card--bold{
  display:grid;
  grid-template-columns:300px 1fr;
  border:2px solid var(--gc-primary);
  box-shadow:8px 8px 0 var(--gc-primary);
  border-radius:12px;
}
.gc-product-card--bold .gc-product-card__image img{
  height:100%;
  min-height:280px;
}
.gc-products-magazine{
  display:grid;
  grid-template-columns:1.1fr .9fr;
  gap:28px;
}
.gc-products-magazine__side{
  display:grid;
  gap:20px;
}
.gc-product-featured{
  background:var(--gc-surface);
  border-radius:var(--gc-radius);
  overflow:hidden;
  box-shadow:var(--gc-shadow);
}
.gc-product-featured__image img{
  width:100%;
  height:520px;
  object-fit:cover;
}
.gc-product-featured__body{
  padding:28px;
}
.gc-product-featured__body h3{
  font-family:var(--gc-heading-font),serif;
  font-size:38px;
  line-height:1;
  margin:10px 0 12px;
}
.gc-products-minimal-list{
  display:grid;
  gap:12px;
}
.gc-product-row{
  display:grid;
  grid-template-columns:120px 1fr auto auto;
  gap:18px;
  align-items:center;
  background:var(--gc-surface);
  border:1px solid var(--gc-border);
  padding:14px;
}
.gc-product-row img{
  width:120px;
  height:100px;
  object-fit:cover;
}
.gc-product-row h3{
  margin:0 0 6px;
}
.gc-product-row p{
  margin:0;
  color:var(--gc-muted);
}
.gc-product-row__actions{
  display:flex;
  gap:8px;
}
.gc-product-row__actions button{
  min-height:40px;
  border:0;
  border-radius:999px;
  background:var(--gc-primary);
  color:var(--gc-surface);
  font-weight:900;
  padding:0 16px;
}

/* SERVICES */
.gc-service-icon{font-size:34px}
.gc-service-card__top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
.gc-services-grid--conversion .gc-service-card{
  border:2px solid var(--gc-primary);
  box-shadow:8px 8px 0 var(--gc-primary);
  border-radius:12px;
}
.gc-services-story{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:28px;
}
.gc-services-story__list{
  display:grid;
  gap:20px;
}
.gc-service-featured{
  background:var(--gc-primary);
  color:var(--gc-surface);
  border-radius:var(--gc-radius);
  padding:34px;
  box-shadow:var(--gc-shadow);
}
.gc-service-featured h3{
  font-family:var(--gc-heading-font),serif;
  font-size:42px;
  line-height:1;
}
.gc-service-featured p{
  color:color-mix(in srgb,var(--gc-on-primary) 84%,transparent);
}
.gc-services-minimal-list{
  display:grid;
  gap:12px;
}
.gc-service-row{
  display:grid;
  grid-template-columns:auto 1fr auto auto;
  gap:18px;
  align-items:center;
  background:var(--gc-surface);
  border:1px solid var(--gc-border);
  padding:18px;
}
.gc-service-row h3{
  margin:0 0 6px;
}
.gc-service-row p{
  margin:0;
  color:var(--gc-muted);
}
.gc-service-row__actions{
  display:flex;
  gap:8px;
}
.gc-service-row__actions button{
  min-height:40px;
  border:0;
  border-radius:999px;
  background:var(--gc-primary);
  color:var(--gc-surface);
  font-weight:900;
  padding:0 16px;
}

/* BASIC */
.gc-benefits{
  padding:34px 0;
  background:var(--gc-surface);
}
.gc-benefit-card{
  padding:24px;
}
.gc-benefit-card strong{
  display:block;
  margin-bottom:8px;
}
.gc-benefit-card span{
  display:block;
  color:var(--gc-muted);
  line-height:1.55;
}
.gc-about{
  background:var(--gc-surface);
}
.gc-about__inner{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:54px;
  align-items:center;
}
.gc-about__copy h2,
.gc-contact h2{
  font-family:var(--gc-heading-font),serif;
  font-size:clamp(34px,4vw,58px);
  line-height:1;
  margin:0 0 18px;
}
.gc-about__copy p,
.gc-contact p{
  color:var(--gc-muted);
  line-height:1.8;
  margin:0 0 26px;
}
.gc-testimonial-card{
  padding:24px;
}
.gc-testimonial-card p{
  color:var(--gc-muted);
  line-height:1.7;
}
.gc-faq-list{
  display:grid;
  gap:14px;
  max-width:860px;
  margin:0 auto;
}
details{padding:20px}
summary{font-weight:900;cursor:pointer}
details p{
  color:var(--gc-muted);
  line-height:1.7;
}
.gc-contact{
  padding:86px 0;
  background:var(--gc-primary);
  color:var(--gc-surface);
}
.gc-contact p,
.gc-contact span{
  color:var(--gc-surface);
}
.gc-contact__inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:28px;
}
.gc-footer{
  background:var(--gc-primary);
  color:var(--gc-surface);
  padding:34px 0;
}
.gc-footer__inner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
}

/* FAMILY OVERRIDES */
body.gc-v2-family-conversion-sales .gc-hero{
  background:radial-gradient(circle at top right,var(--gc-accent),var(--gc-primary) 42%,var(--gc-primary-strong) 100%);
  color:var(--gc-surface);
}
body.gc-v2-family-conversion-sales .gc-hero p{
  color:color-mix(in srgb,var(--gc-on-primary) 78%,transparent);
}
body.gc-v2-family-conversion-sales .gc-header{
  background:var(--gc-primary);
}
body.gc-v2-family-conversion-sales .gc-brand,
body.gc-v2-family-conversion-sales .gc-nav a{
  color:var(--gc-surface);
}

body.gc-v2-family-marketplace-grid .gc-hero{
  padding:62px 0;
}
body.gc-v2-family-marketplace-grid .gc-products-grid{
  grid-template-columns:repeat(4,minmax(0,1fr));
}

body.gc-v2-family-magazine-story .gc-hero__media img,
body.gc-v2-family-magazine-story .gc-about__image img{
  border-radius:90px 0 90px 0;
}

body.gc-v2-family-minimal-premium .gc-topbar{
  display:none;
}
body.gc-v2-family-minimal-premium .gc-hero{
  text-align:center;
}
body.gc-v2-family-minimal-premium .gc-hero__inner{
  display:flex;
  flex-direction:column;
  max-width:920px;
}
body.gc-v2-family-minimal-premium .gc-actions{
  justify-content:center;
}
body.gc-v2-family-minimal-premium .gc-product-card{
  box-shadow:none;
  border-radius:0;
}


/* =========================================================
   PALETTE SYSTEM — GLOBAL VISUAL IDENTITY
   A paleta escolhida passa a governar a página inteira.
   ========================================================= */

.gc-categories,
.gc-products,
.gc-testimonials,
.gc-faq{
  background:var(--gc-background);
}

.gc-services{
  background:
    radial-gradient(circle at 8% 10%,var(--gc-accent-soft),transparent 26%),
    linear-gradient(180deg,var(--gc-section-tint),var(--gc-background));
}

.gc-benefits{
  background:linear-gradient(135deg,var(--gc-surface),var(--gc-secondary-soft));
}

.gc-about{
  background:
    radial-gradient(circle at 88% 18%,var(--gc-accent-soft),transparent 30%),
    var(--gc-surface);
}

.gc-category-card,
.gc-product-card,
.gc-service-card,
.gc-benefit-card,
.gc-testimonial-card,
details{
  border-color:var(--gc-border);
}

.gc-category-card:hover,
.gc-product-card:hover,
.gc-service-card:hover{
  border-color:color-mix(in srgb,var(--gc-accent) 52%,var(--gc-border));
}

.gc-section-heading h2,
.gc-product-card h3,
.gc-service-card h3,
.gc-about__copy h2,
.gc-contact h2{
  color:var(--gc-text);
}

.gc-section-heading span,
.gc-about__copy>span,
.gc-featured>span,
.gc-contact>span{
  color:var(--gc-accent);
}

.gc-btn--primary{
  background:var(--gc-accent);
  color:var(--gc-on-accent);
  box-shadow:0 12px 28px color-mix(in srgb,var(--gc-accent) 28%,transparent);
}

.gc-btn--primary:hover{
  background:color-mix(in srgb,var(--gc-accent) 86%,var(--gc-primary));
}

.gc-btn--secondary{
  border-color:var(--gc-border-strong);
}

.gc-featured,
.gc-contact,
.gc-footer{
  background:
    radial-gradient(circle at 82% 20%,color-mix(in srgb,var(--gc-accent) 18%,transparent),transparent 30%),
    linear-gradient(135deg,var(--gc-primary),var(--gc-primary-strong));
  color:var(--gc-on-primary);
}

.gc-featured p,
.gc-contact p,
.gc-footer{
  color:color-mix(in srgb,var(--gc-on-primary) 82%,transparent);
}

.gc-card-actions button,
.gc-product-row__actions button,
.gc-service-row__actions button{
  background:var(--gc-primary);
  color:var(--gc-on-primary);
}

.gc-card-actions [data-gc-wishlist]{
  background:transparent;
  color:var(--gc-primary);
  border-color:var(--gc-border-strong);
}

.gc-price strong,
.gc-hero-marketplace__card span{
  color:var(--gc-accent);
}

.gc-product-card__image,
.gc-hero-marketplace__card img{
  background:var(--gc-primary-soft);
}

/* Alternância visual evita a sensação de uma longa página branca. */
.gc-products + .gc-benefits,
.gc-services + .gc-benefits,
.gc-about + .gc-benefits{
  border-top:1px solid var(--gc-border);
  border-bottom:1px solid var(--gc-border);
}

/* Tratamentos por família continuam diferentes, mas agora usam a paleta. */
body.gc-v2-family-luxury-editorial .gc-hero,
body.gc-v2-family-magazine-story .gc-hero{
  background:
    radial-gradient(circle at 82% 12%,var(--gc-accent-soft),transparent 32%),
    linear-gradient(135deg,var(--gc-background),var(--gc-secondary-soft));
}

body.gc-v2-family-minimal-premium .gc-hero{
  background:
    linear-gradient(180deg,var(--gc-surface),var(--gc-background));
}

body.gc-v2-family-marketplace-grid .gc-hero{
  background:
    radial-gradient(circle at 90% 8%,var(--gc-accent-soft),transparent 24%),
    linear-gradient(180deg,var(--gc-background),var(--gc-primary-soft));
}

/* RESPONSIVE */
/* RESPONSIVE */
@media(max-width:980px){
  .gc-topbar__inner,
  .gc-category-grid,
  .gc-products-grid,
  .gc-services-grid,
  .gc-benefits-grid,
  .gc-testimonial-grid,
  .gc-hero__catalog-cards,
  .gc-hero-marketplace__cards{
    grid-template-columns:repeat(2,1fr);
  }

  .gc-hero__inner,
  .gc-hero__catalog-layout,
  .gc-hero__magazine-grid,
  .gc-about__inner,
  .gc-products-magazine,
  .gc-services-story,
  .gc-hero-food__inner,
  .gc-hero-marketplace__inner,
  .gc-hero-service__inner,
  .gc-hero-luxury__inner{
    grid-template-columns:1fr;
  }

  .gc-featured__inner,
  .gc-contact__inner,
  .gc-header__inner,
  .gc-footer__inner{
    flex-direction:column;
    text-align:center;
  }

  .gc-nav,
  .gc-actions,
  .gc-hero-food__copy .gc-actions,
  .gc-hero-marketplace__copy .gc-actions,
  .gc-hero-service__copy .gc-actions,
  .gc-hero-luxury__copy .gc-actions,
  .gc-hero-food__badges,
  .gc-hero-service__trust{
    justify-content:center;
  }

  .gc-hero-food__copy,
  .gc-hero-marketplace__copy,
  .gc-hero-service__copy,
  .gc-hero-luxury__copy{
    text-align:center;
  }

  .gc-product-card--bold,
  .gc-product-row,
  .gc-service-row{
    grid-template-columns:1fr;
  }
}

@media(max-width:640px){
  .gc-container{
    width:min(100% - 28px,1180px);
  }

  .gc-topbar__inner,
  .gc-category-grid,
  .gc-products-grid,
  .gc-services-grid,
  .gc-benefits-grid,
  .gc-testimonial-grid,
  .gc-hero__catalog-cards,
  .gc-hero-marketplace__cards{
    grid-template-columns:1fr;
  }

  .gc-hero{
    padding:58px 0;
  }

  .gc-hero__copy,
  .gc-hero__center,
  .gc-hero__minimal-inner,
  .gc-hero__overlay-content,
  .gc-hero-food__copy,
  .gc-hero-marketplace__copy,
  .gc-hero-service__copy,
  .gc-hero-luxury__copy{
    text-align:center;
  }

  .gc-hero__copy h1,
  .gc-hero__center h1,
  .gc-hero__minimal-inner h1,
  .gc-hero__overlay-content h1,
  .gc-hero-food__copy h1,
  .gc-hero-marketplace__copy h1,
  .gc-hero-service__copy h1,
  .gc-hero-luxury__copy h1{
    font-size:42px;
  }

  .gc-hero__media img,
  .gc-about__image img,
  .gc-hero__wide-media img,
  .gc-hero__magazine-image img,
  .gc-hero-food__media img,
  .gc-hero-service__media img,
  .gc-hero-luxury__frame img{
    height:330px;
  }

  .gc-hero-food__media img{
    box-shadow:10px 10px 0 color-mix(in srgb, var(--gc-accent) 70%, #000);
  }

  .gc-hero-luxury__frame,
  .gc-hero-luxury__frame img{
    border-radius:54px 0 54px 0;
  }

  .gc-card-actions,
  .gc-product-row__actions,
  .gc-service-row__actions{
    grid-template-columns:1fr;
    flex-direction:column;
  }
}

/* HERO ARCHITECTURES V3 */
.gc-hero-trust{display:flex;flex-wrap:wrap;gap:10px 18px;margin:24px 0 0}
.gc-hero-trust__item{font-size:13px;line-height:1.4;font-weight:800;color:var(--gc-muted)}

/* Autoridade / Luxury */
.gc-hero-luxury{padding:110px 0 120px;background:linear-gradient(90deg,var(--gc-background) 0 58%,var(--gc-surface) 58% 100%)}
.gc-hero-luxury__inner{grid-template-columns:minmax(0,.88fr) minmax(420px,1.12fr);gap:84px}
.gc-hero-luxury__media{position:relative}
.gc-hero-luxury__frame{padding:16px 16px 0 0;border:1px solid color-mix(in srgb,var(--gc-accent) 55%,transparent);border-radius:150px 0 150px 0}
.gc-hero-luxury__frame img,.gc-hero-luxury__placeholder{width:100%;height:610px;object-fit:cover;border-radius:132px 0 132px 0;box-shadow:var(--gc-shadow);background:color-mix(in srgb,var(--gc-surface) 86%,var(--gc-accent))}
.gc-hero-luxury__signature{position:absolute;left:-46px;bottom:42px;min-width:220px;padding:20px 24px;background:var(--gc-primary);color:var(--gc-surface);box-shadow:var(--gc-shadow)}
.gc-hero-luxury__signature span,.gc-hero-luxury__signature small{display:block}
.gc-hero-luxury__signature span{font-family:var(--gc-heading-font),serif;font-size:20px;font-weight:900}
.gc-hero-luxury__signature small{margin-top:6px;opacity:.72}

/* Conversão */
.gc-hero-service--conversion{min-height:700px;display:flex;align-items:center;padding:110px 0;color:var(--gc-on-primary);background:var(--gc-primary-strong)}
.gc-hero-service__background,.gc-hero-service__veil{position:absolute;inset:0}
.gc-hero-service__background img{width:100%;height:100%;object-fit:cover;opacity:.36}
.gc-hero-service__veil{background:linear-gradient(90deg,var(--gc-primary-strong) 0%,color-mix(in srgb,var(--gc-primary-strong) 94%,transparent) 42%,color-mix(in srgb,var(--gc-primary) 68%,transparent) 72%,color-mix(in srgb,var(--gc-primary) 38%,transparent) 100%)}
.gc-hero-service__conversion-inner{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.55fr);gap:80px;align-items:end}
.gc-hero-service__conversion-copy h1{font-family:Montserrat,Arial,sans-serif;font-size:clamp(48px,7vw,96px);line-height:.9;letter-spacing:-.065em;max-width:880px;margin:0 0 24px}
.gc-hero-service__conversion-copy>p{max-width:650px;color:color-mix(in srgb,var(--gc-on-primary) 84%,transparent);font-size:19px;line-height:1.7}
.gc-hero-service--conversion .gc-btn--secondary{color:var(--gc-on-primary);border-color:color-mix(in srgb,var(--gc-on-primary) 42%,transparent)}
.gc-hero-service--conversion .gc-hero-trust__item{color:color-mix(in srgb,var(--gc-on-primary) 84%,transparent)}
.gc-hero-service__conversion-card{padding:32px;background:rgba(255,255,255,.96);color:var(--gc-on-accent);box-shadow:0 28px 80px rgba(0,0,0,.28);border-radius:8px}
.gc-hero-service__conversion-eyebrow{display:block;color:var(--gc-accent);font-size:11px;letter-spacing:.16em;font-weight:900;margin-bottom:14px}
.gc-hero-service__conversion-card strong{display:block;font-size:28px;line-height:1.05}
.gc-hero-service__conversion-card p{color:var(--gc-muted);line-height:1.6}
.gc-hero-service__conversion-line{width:54px;height:4px;background:var(--gc-accent);margin:22px 0}
.gc-hero-service__conversion-card small{color:var(--gc-muted);font-weight:800}

/* Magazine */
.gc-hero-magazine{padding:80px 0 120px;background:var(--gc-background)}
.gc-hero-magazine__inner{display:grid;grid-template-columns:minmax(360px,.82fr) minmax(0,1.18fr);gap:88px;align-items:center}
.gc-hero-magazine__media{position:relative;padding-left:38px}
.gc-hero-magazine__media img,.gc-hero-magazine__placeholder{width:100%;height:650px;object-fit:cover;border-radius:0;box-shadow:none;background:color-mix(in srgb,var(--gc-surface) 85%,var(--gc-accent))}
.gc-hero-magazine__number{position:absolute;left:-10px;top:-38px;z-index:2;font-family:var(--gc-heading-font),serif;font-size:92px;line-height:1;color:color-mix(in srgb,var(--gc-accent) 55%,transparent)}
.gc-hero-magazine__caption{display:block;margin-top:12px;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--gc-text) 18%,transparent);color:var(--gc-muted);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.gc-hero-magazine__copy{max-width:720px}
.gc-hero-magazine__copy h1{font-family:var(--gc-heading-font),serif;font-size:clamp(52px,7vw,96px);line-height:.91;letter-spacing:-.055em;margin:0 0 28px}
.gc-hero-magazine__copy>p{max-width:620px;font-size:19px;line-height:1.8;color:var(--gc-muted)}
.gc-hero-magazine__copy .gc-actions{margin-top:30px}

/* Minimal */
.gc-hero-minimal{padding:120px 0 90px;background:var(--gc-surface);text-align:center}
.gc-hero-minimal__inner{max-width:1040px}
.gc-hero-minimal__inner h1{max-width:900px;margin-left:auto;margin-right:auto;font-size:clamp(50px,7vw,92px);line-height:.95}
.gc-hero-minimal__inner>p{max-width:650px;margin-left:auto;margin-right:auto}
.gc-hero-minimal__inner .gc-actions,.gc-hero-minimal__inner .gc-hero-trust{justify-content:center}
.gc-hero-minimal__media{margin:62px auto 0;width:min(100%,980px)}
.gc-hero-minimal__media img{width:100%;height:430px;object-fit:cover;border-radius:0;box-shadow:none}

@media(max-width:980px){
.gc-hero-luxury__inner,.gc-hero-service__conversion-inner,.gc-hero-magazine__inner{grid-template-columns:1fr;gap:44px}
.gc-hero-luxury__signature{left:20px}.gc-hero-service__conversion-card{max-width:560px}.gc-hero-magazine__media{padding-left:0;max-width:620px}
}
@media(max-width:640px){
.gc-hero-luxury,.gc-hero-service--conversion,.gc-hero-magazine,.gc-hero-minimal{padding:64px 0}
.gc-hero-luxury__frame img,.gc-hero-luxury__placeholder,.gc-hero-magazine__media img,.gc-hero-magazine__placeholder,.gc-hero-minimal__media img{height:360px}
.gc-hero-luxury__signature{position:relative;left:auto;bottom:auto;margin:-24px 18px 0}
.gc-hero-service__conversion-copy,.gc-hero-magazine__copy{text-align:left}
.gc-hero-service__conversion-copy h1,.gc-hero-magazine__copy h1{font-size:48px}
}


/* =========================================================
   CREATIVE DIRECTION — SECTION ARCHITECTURES
   ========================================================= */

/* Shared section typography */
.gc-benefits--editorial h2,
.gc-about-story__copy h2,
.gc-about-founder h2,
.gc-about-minimal h2,
.gc-about-manifesto__copy h2,
.gc-faq-split__intro h2,
.gc-contact-card h2,
.gc-contact-minimal h2{
  font-family:var(--gc-heading-font),serif;
  letter-spacing:-.045em;
}

.gc-benefits--numbers,
.gc-benefits--editorial,
.gc-benefits--bento,
.gc-benefits--trust-strip{
  padding:88px 0;
}

.gc-benefit-number p,
.gc-benefit-editorial-item p,
.gc-about-story__copy p,
.gc-about-founder p,
.gc-about-minimal p,
.gc-about-manifesto__copy p,
.gc-faq-split__intro p,
.gc-contact-card p,
.gc-contact-minimal p{
  color:var(--gc-muted);
  line-height:1.75;
}

/* BENEFITS — conversion numbers */
.gc-benefits--numbers{
  background:var(--gc-primary);
  color:var(--gc-surface);
}
.gc-benefits-numbers{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  border-top:1px solid rgba(255,255,255,.18);
  border-bottom:1px solid rgba(255,255,255,.18);
}
.gc-benefit-number{
  min-height:230px;
  padding:34px 28px;
  border-right:1px solid rgba(255,255,255,.18);
}
.gc-benefit-number:last-child{border-right:0}
.gc-benefit-number>span{
  display:block;
  margin-bottom:46px;
  font-size:13px;
  font-weight:900;
  letter-spacing:.14em;
  color:var(--gc-accent);
}
.gc-benefit-number strong{
  display:block;
  font-size:22px;
  line-height:1.1;
  margin-bottom:12px;
}
.gc-benefit-number p{
  margin:0;
  color:color-mix(in srgb,var(--gc-surface) 74%,transparent);
  font-size:14px;
}

/* BENEFITS — magazine/editorial */
.gc-benefits--editorial{
  background:var(--gc-background);
}
.gc-benefits-editorial__inner{
  display:grid;
  grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);
  gap:90px;
  align-items:start;
}
.gc-benefits-editorial__intro{
  position:sticky;
  top:120px;
}
.gc-benefits-editorial__intro>span{
  display:block;
  margin-bottom:16px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-benefits-editorial__intro h2{
  margin:0 0 22px;
  font-size:clamp(42px,5vw,72px);
  line-height:.95;
}
.gc-benefits-editorial__intro p{
  margin:0;
  max-width:480px;
  color:var(--gc-muted);
  line-height:1.8;
}
.gc-benefits-editorial__list{
  border-top:1px solid color-mix(in srgb,var(--gc-text) 16%,transparent);
}
.gc-benefit-editorial-item{
  display:grid;
  grid-template-columns:60px 1fr;
  gap:24px;
  padding:30px 0;
  border-bottom:1px solid color-mix(in srgb,var(--gc-text) 16%,transparent);
}
.gc-benefit-editorial-item>span{
  color:var(--gc-accent);
  font-size:12px;
  font-weight:900;
}
.gc-benefit-editorial-item strong{
  display:block;
  margin-bottom:8px;
  font-family:var(--gc-heading-font),serif;
  font-size:25px;
}
.gc-benefit-editorial-item p{margin:0}

/* BENEFITS — bento */
.gc-benefits--bento{background:var(--gc-background)}
.gc-benefits-bento{
  display:grid;
  grid-template-columns:1.2fr .8fr .8fr;
  grid-template-rows:minmax(190px,auto) minmax(190px,auto);
  gap:18px;
}
.gc-benefit-bento{
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  min-height:190px;
  padding:30px;
  background:var(--gc-surface);
  border:1px solid color-mix(in srgb,var(--gc-text) 9%,transparent);
  border-radius:28px;
  overflow:hidden;
}
.gc-benefit-bento--1{
  grid-row:1 / span 2;
  min-height:398px;
  background:var(--gc-primary);
  color:var(--gc-surface);
}
.gc-benefit-bento strong{
  display:block;
  max-width:360px;
  font-family:var(--gc-heading-font),serif;
  font-size:clamp(25px,3vw,38px);
  line-height:1;
}
.gc-benefit-bento span{
  display:block;
  margin-top:12px;
  max-width:420px;
  color:var(--gc-muted);
  line-height:1.6;
}
.gc-benefit-bento--1 span{
  color:color-mix(in srgb,var(--gc-surface) 74%,transparent);
}

/* BENEFITS — trust strip */
.gc-benefits--trust-strip{
  padding:0;
  background:var(--gc-surface);
  border-top:1px solid color-mix(in srgb,var(--gc-text) 9%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--gc-text) 9%,transparent);
}
.gc-benefits-trust-strip{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
}
.gc-benefit-trust{
  min-height:150px;
  padding:30px 26px;
  border-right:1px solid color-mix(in srgb,var(--gc-text) 9%,transparent);
}
.gc-benefit-trust:last-child{border-right:0}
.gc-benefit-trust strong{
  display:block;
  margin-bottom:9px;
  font-size:16px;
  font-weight:900;
}
.gc-benefit-trust span{
  color:var(--gc-muted);
  font-size:13px;
  line-height:1.55;
}

/* ABOUT — shared */
.gc-about__differentiator{
  margin:24px 0;
  padding:18px 20px;
  border-left:3px solid var(--gc-accent);
  background:color-mix(in srgb,var(--gc-accent) 8%,transparent);
  font-weight:800;
  line-height:1.6;
}
.gc-section-image-placeholder{
  width:100%;
  min-height:440px;
  background:
    radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--gc-accent) 28%,transparent),transparent 30%),
    linear-gradient(135deg,var(--gc-surface),color-mix(in srgb,var(--gc-primary) 10%,var(--gc-background)));
}

/* ABOUT — portrait story */
.gc-about--portrait-story{
  padding:120px 0;
  background:var(--gc-background);
}
.gc-about-story__inner{
  display:grid;
  grid-template-columns:minmax(320px,.8fr) minmax(0,1.2fr);
  gap:92px;
  align-items:center;
}
.gc-about-story__media{
  position:relative;
  padding:0 0 42px 42px;
}
.gc-about-story__media::before{
  content:"";
  position:absolute;
  left:0;
  bottom:0;
  width:62%;
  height:72%;
  border:1px solid color-mix(in srgb,var(--gc-accent) 55%,transparent);
}
.gc-about-story__media img,
.gc-about-story__media .gc-section-image-placeholder{
  position:relative;
  z-index:1;
  width:100%;
  height:600px;
  object-fit:cover;
  border-radius:0;
}
.gc-about-story__copy>span{
  display:block;
  margin-bottom:18px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-about-story__copy h2{
  margin:0 0 24px;
  font-size:clamp(44px,5vw,74px);
  line-height:.94;
}
.gc-about-story__copy>p{
  margin:0 0 26px;
  max-width:650px;
  font-size:17px;
}

/* ABOUT — founder note */
.gc-about--founder-note{
  padding:130px 0;
  background:var(--gc-background);
}
.gc-about-founder{
  max-width:900px;
  text-align:center;
}
.gc-about-founder>span{
  display:block;
  margin-bottom:20px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.18em;
  text-transform:uppercase;
}
.gc-about-founder h2{
  margin:0 auto 28px;
  font-size:clamp(48px,6vw,82px);
  line-height:.94;
}
.gc-about-founder>p{
  max-width:720px;
  margin:0 auto;
  font-size:18px;
}

/* ABOUT — minimal */
.gc-about--minimal{
  padding:110px 0;
  background:var(--gc-surface);
}
.gc-about-minimal{
  max-width:850px;
  text-align:left;
}
.gc-about-minimal>span{
  display:block;
  margin-bottom:20px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-about-minimal h2{
  margin:0 0 24px;
  max-width:760px;
  font-size:clamp(44px,5vw,70px);
  line-height:.96;
}
.gc-about-minimal p{
  margin:0;
  max-width:680px;
  font-size:17px;
}

/* ABOUT — brand manifesto */
.gc-about--manifesto{
  padding:120px 0;
  background:var(--gc-primary);
  color:var(--gc-surface);
}
.gc-about-manifesto__inner{
  display:grid;
  grid-template-columns:minmax(0,.9fr) minmax(360px,1.1fr);
  gap:76px;
  align-items:center;
}
.gc-about-manifesto__copy>span{
  display:block;
  margin-bottom:18px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-about-manifesto__copy h2{
  margin:0 0 24px;
  font-size:clamp(46px,5vw,76px);
  line-height:.92;
}
.gc-about-manifesto__copy>p{
  margin:0;
  max-width:620px;
  color:color-mix(in srgb,var(--gc-surface) 76%,transparent);
  line-height:1.8;
}
.gc-about--manifesto .gc-about__differentiator{
  color:var(--gc-surface);
  background:rgba(255,255,255,.08);
}
.gc-about-manifesto__media img,
.gc-about-manifesto__media .gc-section-image-placeholder{
  width:100%;
  height:580px;
  object-fit:cover;
  border-radius:0;
}

/* ABOUT — editorial split */
.gc-about--editorial-split{
  padding:110px 0;
}
.gc-about--editorial-split .gc-about__inner{
  grid-template-columns:minmax(0,.9fr) minmax(380px,1.1fr);
  gap:80px;
}
.gc-about--editorial-split .gc-about__image img,
.gc-about--editorial-split .gc-about__image .gc-section-image-placeholder{
  width:100%;
  height:570px;
  object-fit:cover;
  border-radius:110px 0 110px 0;
}

/* TESTIMONIALS — real only */
.gc-testimonials{
  background:var(--gc-background);
}
.gc-testimonials .gc-testimonial-card{
  position:relative;
  padding:32px;
  box-shadow:none;
}
.gc-testimonials .gc-testimonial-card::before{
  content:"“";
  display:block;
  margin-bottom:12px;
  font-family:var(--gc-heading-font),serif;
  font-size:56px;
  line-height:.7;
  color:var(--gc-accent);
}
.gc-testimonials .gc-testimonial-card strong{
  display:block;
  margin-top:18px;
  font-size:13px;
}

/* FAQ — split */
.gc-faq--split{
  padding:110px 0;
  background:var(--gc-background);
}
.gc-faq-split__inner{
  display:grid;
  grid-template-columns:minmax(260px,.7fr) minmax(0,1.3fr);
  gap:86px;
  align-items:start;
}
.gc-faq-split__intro{
  position:sticky;
  top:120px;
}
.gc-faq-split__intro>span{
  display:block;
  margin-bottom:18px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-faq-split__intro h2{
  margin:0 0 20px;
  font-size:clamp(40px,4vw,62px);
  line-height:.96;
}
.gc-faq-split__intro p{margin:0}
.gc-faq--split .gc-faq-list{
  max-width:none;
  margin:0;
}
.gc-faq--split details{
  border:0;
  border-bottom:1px solid color-mix(in srgb,var(--gc-text) 14%,transparent);
  border-radius:0;
  box-shadow:none;
  background:transparent;
  padding:24px 0;
}

/* FAQ — minimal */
.gc-faq--minimal{
  padding:110px 0;
  background:var(--gc-surface);
}
.gc-faq-list--minimal{
  max-width:760px;
}
.gc-faq-list--minimal details{
  border:0;
  border-bottom:1px solid color-mix(in srgb,var(--gc-text) 14%,transparent);
  border-radius:0;
  box-shadow:none;
  background:transparent;
  padding:22px 0;
}

/* CONTACT — editorial card */
.gc-contact--editorial-card{
  padding:110px 0;
  background:var(--gc-background);
  color:var(--gc-text);
}
.gc-contact--editorial-card .gc-contact-card{
  position:relative;
  overflow:hidden;
  max-width:980px;
  margin:0 auto;
  padding:72px;
  background:var(--gc-primary);
  color:var(--gc-surface);
  border-radius:36px;
}
.gc-contact--editorial-card .gc-contact-card::after{
  content:"";
  position:absolute;
  right:-80px;
  top:-80px;
  width:280px;
  height:280px;
  border:1px solid rgba(255,255,255,.18);
  border-radius:50%;
}
.gc-contact-card>span{
  display:block;
  margin-bottom:16px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-contact-card h2{
  position:relative;
  z-index:1;
  margin:0 0 18px;
  max-width:720px;
  font-size:clamp(42px,5vw,70px);
  line-height:.95;
}
.gc-contact-card p{
  position:relative;
  z-index:1;
  max-width:650px;
  color:color-mix(in srgb,var(--gc-surface) 76%,transparent);
}
.gc-contact-card .gc-actions{
  position:relative;
  z-index:1;
  margin-top:30px;
}
.gc-contact-card .gc-btn--secondary{
  color:var(--gc-surface);
  border-color:rgba(255,255,255,.4);
}

/* CONTACT — minimal */
.gc-contact--minimal{
  padding:120px 0;
  background:var(--gc-surface);
  color:var(--gc-text);
}
.gc-contact-minimal{
  max-width:900px;
  text-align:center;
}
.gc-contact-minimal>span{
  display:block;
  margin-bottom:18px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-contact-minimal h2{
  margin:0 auto 20px;
  font-size:clamp(46px,6vw,78px);
  line-height:.94;
}
.gc-contact-minimal p{
  max-width:650px;
  margin:0 auto;
}
.gc-contact-minimal .gc-actions{
  justify-content:center;
  margin-top:30px;
}

/* CONTACT — commerce banner */
.gc-contact--commerce-banner{
  padding:90px 0;
  background:
    radial-gradient(circle at 90% 10%,color-mix(in srgb,var(--gc-accent) 28%,transparent),transparent 28%),
    var(--gc-primary);
}
.gc-contact--commerce-banner .gc-contact__inner{
  min-height:260px;
}
.gc-contact--commerce-banner h2{
  max-width:720px;
}

/* CONTACT — conversion band */
.gc-contact--conversion-band{
  padding:88px 0;
  background:var(--gc-primary);
}
.gc-contact--conversion-band .gc-contact__inner{
  min-height:220px;
}
.gc-contact--conversion-band h2{
  max-width:760px;
}

/* CREATIVE RHYTHM / FAMILY PERSONALITY */
body.gc-v2-family-conversion-sales .gc-benefits--numbers{
  background:var(--gc-primary-strong);
}
body.gc-v2-family-conversion-sales .gc-about--minimal{
  background:var(--gc-background);
}
body.gc-v2-family-conversion-sales .gc-contact--conversion-band{
  background:linear-gradient(115deg,var(--gc-primary),#020617);
}

body.gc-v2-family-magazine-story .gc-benefits--editorial,
body.gc-v2-family-magazine-story .gc-faq--split{
  background:var(--gc-background);
}
body.gc-v2-family-magazine-story .gc-about--portrait-story{
  background:var(--gc-surface);
}

body.gc-v2-family-minimal-premium .gc-benefits--trust-strip{
  border-left:0;
  border-right:0;
}
body.gc-v2-family-minimal-premium .gc-benefit-trust{
  min-height:130px;
}
body.gc-v2-family-minimal-premium .gc-about--founder-note,
body.gc-v2-family-minimal-premium .gc-faq--minimal,
body.gc-v2-family-minimal-premium .gc-contact--minimal{
  box-shadow:none;
}

/* Responsive — Creative Direction */
@media(max-width:980px){
  .gc-benefits-numbers,
  .gc-benefits-trust-strip{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .gc-benefit-number:nth-child(2),
  .gc-benefit-trust:nth-child(2){
    border-right:0;
  }

  .gc-benefit-number,
  .gc-benefit-trust{
    border-bottom:1px solid color-mix(in srgb,var(--gc-text) 12%,transparent);
  }

  .gc-benefits-editorial__inner,
  .gc-about-story__inner,
  .gc-about-manifesto__inner,
  .gc-faq-split__inner,
  .gc-about--editorial-split .gc-about__inner{
    grid-template-columns:1fr;
    gap:48px;
  }

  .gc-benefits-editorial__intro,
  .gc-faq-split__intro{
    position:relative;
    top:auto;
  }

  .gc-benefits-bento{
    grid-template-columns:1fr 1fr;
    grid-template-rows:auto;
  }

  .gc-benefit-bento--1{
    grid-column:1 / -1;
    grid-row:auto;
    min-height:300px;
  }

  .gc-about-story__media,
  .gc-about-manifesto__media,
  .gc-about--editorial-split .gc-about__image{
    max-width:680px;
  }
}

@media(max-width:640px){
  .gc-benefits--numbers,
  .gc-benefits--editorial,
  .gc-benefits--bento{
    padding:64px 0;
  }

  .gc-benefits-numbers,
  .gc-benefits-trust-strip,
  .gc-benefits-bento{
    grid-template-columns:1fr;
  }

  .gc-benefit-number,
  .gc-benefit-trust{
    min-height:auto;
    border-right:0;
    border-bottom:1px solid color-mix(in srgb,var(--gc-text) 12%,transparent);
  }

  .gc-benefit-number>span{
    margin-bottom:22px;
  }

  .gc-benefit-bento--1{
    grid-column:auto;
    min-height:260px;
  }

  .gc-benefit-editorial-item{
    grid-template-columns:42px 1fr;
    gap:14px;
  }

  .gc-about--portrait-story,
  .gc-about--founder-note,
  .gc-about--minimal,
  .gc-about--manifesto,
  .gc-about--editorial-split,
  .gc-faq--split,
  .gc-faq--minimal,
  .gc-contact--editorial-card,
  .gc-contact--minimal{
    padding:68px 0;
  }

  .gc-about-story__media{
    padding:0 0 22px 22px;
  }

  .gc-about-story__media img,
  .gc-about-story__media .gc-section-image-placeholder,
  .gc-about-manifesto__media img,
  .gc-about-manifesto__media .gc-section-image-placeholder,
  .gc-about--editorial-split .gc-about__image img,
  .gc-about--editorial-split .gc-about__image .gc-section-image-placeholder{
    height:380px;
  }

  .gc-about--editorial-split .gc-about__image img,
  .gc-about--editorial-split .gc-about__image .gc-section-image-placeholder{
    border-radius:54px 0 54px 0;
  }

  .gc-contact--editorial-card .gc-contact-card{
    padding:42px 26px;
    border-radius:24px;
  }

  .gc-contact-card .gc-actions,
  .gc-contact-minimal .gc-actions{
    flex-direction:column;
  }

  .gc-contact-card .gc-btn,
  .gc-contact-minimal .gc-btn{
    width:100%;
  }
}



/* =========================================================
   HERO MEDIA PLAN — MULTI-ASSET COMPOSITION
   ========================================================= */
.gc-hero-luxury--media-plan .gc-hero-luxury__media{position:relative}
.gc-hero-luxury__secondary{
  position:absolute;
  z-index:3;
  width:clamp(150px,28%,230px);
  right:-26px;
  bottom:44px;
  padding:8px;
  background:var(--gc-surface);
  box-shadow:0 24px 60px rgba(15,23,42,.18);
}
.gc-hero-luxury__secondary img{
  display:block;
  width:100%;
  height:210px;
  object-fit:cover;
}
.gc-hero-magazine--media-plan .gc-hero-magazine__media{position:relative}
.gc-hero-magazine__secondary{
  position:absolute;
  z-index:3;
  right:-44px;
  bottom:74px;
  width:clamp(150px,38%,230px);
  margin:0;
  padding:7px;
  background:var(--gc-surface);
  box-shadow:0 22px 55px rgba(15,23,42,.16);
}
.gc-hero-magazine__secondary img{
  display:block;
  width:100%;
  height:170px;
  object-fit:cover;
}
.gc-hero-minimal--media-plan .gc-hero-minimal__media{
  overflow:hidden;
}
.gc-hero-minimal--media-plan .gc-hero-minimal__media img{
  display:block;
}

@media(max-width:980px){
  .gc-hero-luxury__secondary{right:14px}
  .gc-hero-magazine__secondary{right:14px}
}
@media(max-width:640px){
  .gc-hero-luxury__secondary{
    width:132px;
    right:10px;
    bottom:28px;
  }
  .gc-hero-luxury__secondary img{height:150px}
  .gc-hero-magazine__secondary{
    width:128px;
    right:10px;
    bottom:54px;
  }
  .gc-hero-magazine__secondary img{height:140px}
}


/* =========================================================
   ENTREGA 3 — COMPOSITION DESIGN SYSTEM
   A landing deixa de parecer uma pilha de seções e passa a
   funcionar como uma sequência de cenas coordenadas.
   ========================================================= */

.gc-composition-group{
  position:relative;
  isolation:isolate;
}
.gc-composition-group--surface-page{background:var(--gc-background)}
.gc-composition-group--surface-surface{background:var(--gc-surface)}
.gc-composition-group--surface-soft{
  background:
    radial-gradient(circle at 86% 12%,var(--gc-accent-soft),transparent 28%),
    linear-gradient(180deg,var(--gc-section-tint),var(--gc-background));
}
.gc-composition-group--surface-brand{
  background:
    radial-gradient(circle at 82% 12%,color-mix(in srgb,var(--gc-accent) 18%,transparent),transparent 30%),
    linear-gradient(135deg,var(--gc-primary),var(--gc-primary-strong));
}
.gc-composition-group--surface-contrast{
  background:var(--gc-primary-strong);
}
.gc-composition-group--continuous > section{
  position:relative;
}
.gc-composition-group--overlap{
  z-index:5;
  margin-top:-72px;
}
.gc-composition-group--overlap > section:first-child{
  padding-top:0;
}

/* HEADER PROFISSIONAL */
.gc-header--professional{
  background:color-mix(in srgb,var(--gc-background) 92%,transparent);
  box-shadow:0 1px 0 var(--gc-border);
}
.gc-header--professional .gc-header__inner{min-height:78px}
.gc-brand{
  display:flex;
  align-items:center;
  gap:13px;
  min-width:0;
}
.gc-brand__logo{
  width:48px;
  height:48px;
  display:grid;
  place-items:center;
  flex:0 0 48px;
}
.gc-brand__logo img{
  width:100%;
  height:100%;
  object-fit:contain;
}
.gc-brand__monogram,
.gc-footer__monogram{
  display:grid;
  place-items:center;
  width:46px;
  height:46px;
  border-radius:50%;
  background:var(--gc-primary);
  color:var(--gc-on-primary);
  font-family:var(--gc-heading-font),serif;
  font-size:15px;
  font-weight:900;
  letter-spacing:.04em;
}
.gc-brand__name{
  max-width:260px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:20px;
  line-height:1.05;
}
.gc-header__action{display:flex;align-items:center}
.gc-header__action .gc-btn{min-height:44px;padding:11px 20px}

/* HERO-STAGE: cria continuidade com o primeiro bloco comercial */
.gc-composition__hero-stage .gc-hero-luxury,
.gc-composition__hero-stage .gc-hero-magazine,
.gc-composition__hero-stage .gc-hero-minimal,
.gc-composition__hero-stage .gc-hero-service{
  margin:0;
}
.gc-composition__hero-stage{
  overflow:hidden;
}

/* OFFER BRIDGE — cards conectados visualmente ao Hero */
.gc-composition__offer-bridge{
  padding:0 0 54px;
}
.gc-composition__offer-bridge .gc-services{
  background:transparent;
  padding:0;
}
.gc-composition__offer-bridge .gc-services > .gc-container{
  position:relative;
}
.gc-composition__offer-bridge .gc-section-heading{
  max-width:820px;
  margin:0 auto 34px;
  padding:26px 34px 0;
}
.gc-composition__offer-bridge .gc-services-grid{
  align-items:stretch;
}
.gc-composition__offer-bridge .gc-service-card,
.gc-service-card--professional{
  border:0;
  border-radius:22px;
  box-shadow:0 24px 60px color-mix(in srgb,var(--gc-text) 13%,transparent);
  transition:transform .25s ease,box-shadow .25s ease;
}
.gc-composition__offer-bridge .gc-service-card:hover{
  transform:translateY(-7px);
  box-shadow:0 32px 72px color-mix(in srgb,var(--gc-text) 17%,transparent);
}
.gc-service-card__media{
  overflow:hidden;
  margin:-22px -22px 6px;
  border-radius:22px 22px 0 0;
  aspect-ratio:16/9;
  background:var(--gc-primary-soft);
}
.gc-service-card__media img{
  width:100%;
  height:100%;
  object-fit:cover;
}
.gc-service-card__body{
  display:flex;
  flex:1;
  flex-direction:column;
  gap:12px;
}
.gc-service-card__body>span{
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
}
.gc-service-actions button:first-child{
  background:var(--gc-primary);
  color:var(--gc-on-primary);
}
.gc-service-actions button:last-child{
  background:transparent;
  color:var(--gc-primary);
  border:1px solid var(--gc-border-strong);
}

/* STORY STAGE */
.gc-composition__story-stage{
  overflow:hidden;
}
.gc-composition__story-stage .gc-about{
  background:transparent;
}
.gc-composition__story-stage .gc-about__image,
.gc-composition__story-stage .gc-about-story__media{
  position:relative;
}
.gc-composition__story-stage .gc-about__image::before,
.gc-composition__story-stage .gc-about-story__media::before{
  content:"";
  position:absolute;
  width:72%;
  height:72%;
  left:-28px;
  bottom:-28px;
  border-radius:36px;
  background:var(--gc-accent-soft);
  z-index:-1;
}
.gc-composition__story-stage .gc-about__image img{
  min-height:560px;
  object-fit:cover;
}
.gc-composition__story-stage .gc-about__copy{
  max-width:610px;
}
.gc-composition__story-stage .gc-about__copy h2{
  font-size:clamp(42px,5vw,68px);
  line-height:.95;
}

/* TRUST STAGE */
.gc-composition__trust-stage{
  border-top:1px solid color-mix(in srgb,var(--gc-text) 7%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--gc-text) 7%,transparent);
}
.gc-composition__trust-stage .gc-benefits{
  background:transparent;
}
.gc-composition__trust-stage .gc-benefit-card{
  box-shadow:none;
  border-radius:0;
  border-width:0 0 0 1px;
  padding:34px 28px;
}
.gc-composition__trust-stage .gc-benefit-card:first-child{border-left:0}

/* CTA SEMÂNTICO FINAL */
.gc-cta-block{
  padding:92px 0;
  color:var(--gc-on-primary);
  background:
    radial-gradient(circle at 88% 10%,color-mix(in srgb,var(--gc-accent) 32%,transparent),transparent 28%),
    linear-gradient(135deg,var(--gc-primary),var(--gc-primary-strong));
}
.gc-cta-block__inner{
  display:grid;
  grid-template-columns:minmax(0,1.25fr) auto;
  gap:60px;
  align-items:center;
}
.gc-cta-block__inner>div:first-child>span{
  display:block;
  margin-bottom:14px;
  color:var(--gc-accent);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
}
.gc-cta-block h2{
  max-width:760px;
  margin:0 0 16px;
  color:var(--gc-on-primary);
  font-family:var(--gc-heading-font),serif;
  font-size:clamp(40px,5vw,70px);
  line-height:.94;
  letter-spacing:-.045em;
}
.gc-cta-block p{
  max-width:700px;
  margin:0;
  color:color-mix(in srgb,var(--gc-on-primary) 78%,transparent);
  font-size:17px;
  line-height:1.7;
}
.gc-cta-block .gc-actions{justify-content:flex-end}
.gc-cta-block .gc-btn--secondary{
  color:var(--gc-on-primary);
  border-color:color-mix(in srgb,var(--gc-on-primary) 42%,transparent);
}

/* FOOTER PROFISSIONAL */
.gc-footer--professional{
  padding:58px 0 34px;
  background:color-mix(in srgb,var(--gc-primary-strong) 94%,#000);
}
.gc-footer--professional .gc-footer__inner{
  display:grid;
  grid-template-columns:minmax(280px,1.3fr) auto auto;
  align-items:center;
  gap:44px;
}
.gc-footer__brand{
  display:flex;
  align-items:center;
  gap:16px;
}
.gc-footer__brand img{
  width:58px;
  height:58px;
  object-fit:contain;
}
.gc-footer__brand strong,
.gc-footer__brand span{
  display:block;
}
.gc-footer__brand strong{
  color:var(--gc-on-primary);
  font-family:var(--gc-heading-font),serif;
  font-size:21px;
}
.gc-footer__brand span{
  max-width:390px;
  margin-top:5px;
  color:color-mix(in srgb,var(--gc-on-primary) 66%,transparent);
  font-size:13px;
  line-height:1.5;
}
.gc-footer__nav{
  display:flex;
  gap:18px;
  flex-wrap:wrap;
}
.gc-footer__nav a{
  color:color-mix(in srgb,var(--gc-on-primary) 78%,transparent);
  font-size:13px;
  font-weight:800;
}
.gc-footer__meta{
  color:color-mix(in srgb,var(--gc-on-primary) 54%,transparent);
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.1em;
}

/* =========================================================
   COMPOSITION ARCHETYPES — páginas realmente diferentes
   ========================================================= */

/* AUTHORITY PREMIUM */
.gc-composition--authority-premium .gc-composition__hero-stage{
  background:
    radial-gradient(circle at 85% 16%,var(--gc-accent-soft),transparent 28%),
    linear-gradient(100deg,var(--gc-background) 0 57%,var(--gc-surface) 57%);
}
.gc-composition--authority-premium .gc-composition__offer-bridge{
  background:linear-gradient(180deg,transparent 0 70px,var(--gc-background) 70px);
}
.gc-composition--authority-premium .gc-composition__offer-bridge .gc-section-heading{
  background:var(--gc-background);
  border-radius:28px 28px 0 0;
}
.gc-composition--authority-premium .gc-composition__story-stage{
  background:
    radial-gradient(circle at 14% 70%,var(--gc-secondary-soft),transparent 28%),
    var(--gc-surface);
}

/* HUMAN AUTHORITY */
.gc-composition--human-authority .gc-composition__hero-stage{
  background:var(--gc-primary);
}
.gc-composition--human-authority .gc-composition__offer-bridge{
  background:linear-gradient(180deg,var(--gc-primary) 0 72px,var(--gc-background) 72px);
}
.gc-composition--human-authority .gc-composition__story-stage{
  background:var(--gc-background);
}
.gc-composition--human-authority .gc-composition__story-stage .gc-about__inner{
  grid-template-columns:minmax(340px,.78fr) minmax(0,1.22fr);
  gap:90px;
}
.gc-composition--human-authority .gc-composition__story-stage .gc-about__image img{
  border-radius:180px 180px 24px 24px;
}
.gc-composition--human-authority .gc-composition__trust-stage{
  background:var(--gc-secondary-soft);
}

/* CONVERSION FLOW */
.gc-composition--conversion-flow .gc-header{
  background:var(--gc-primary-strong);
  border-bottom-color:color-mix(in srgb,var(--gc-on-primary) 14%,transparent);
}
.gc-composition--conversion-flow .gc-brand,
.gc-composition--conversion-flow .gc-nav a{color:var(--gc-on-primary)}
.gc-composition--conversion-flow .gc-composition__offer-bridge{
  background:linear-gradient(180deg,var(--gc-primary-strong) 0 58px,var(--gc-background) 58px);
}
.gc-composition--conversion-flow .gc-services-grid--conversion .gc-service-card{
  border:0;
  border-radius:18px;
  box-shadow:0 24px 60px color-mix(in srgb,var(--gc-text) 16%,transparent);
}
.gc-composition--conversion-flow .gc-composition__trust-stage{
  background:var(--gc-primary-soft);
}

/* EDITORIAL SIGNATURE */
.gc-composition--editorial-signature .gc-header{
  position:relative;
  background:var(--gc-background);
  backdrop-filter:none;
}
.gc-composition--editorial-signature .gc-composition-group--overlap{
  margin-top:0;
}
.gc-composition--editorial-signature .gc-composition__story-stage{
  background:var(--gc-background);
}
.gc-composition--editorial-signature .gc-composition__offer-stage{
  background:var(--gc-surface);
}
.gc-composition--editorial-signature .gc-service-card{
  border-radius:0;
  box-shadow:none;
  border-top:1px solid var(--gc-border-strong);
  border-bottom:1px solid var(--gc-border-strong);
}
.gc-composition--editorial-signature .gc-service-card__media{
  border-radius:0;
}
.gc-composition--editorial-signature .gc-cta-block{
  text-align:center;
}
.gc-composition--editorial-signature .gc-cta-block__inner{
  display:block;
  max-width:900px;
}
.gc-composition--editorial-signature .gc-cta-block h2,
.gc-composition--editorial-signature .gc-cta-block p{
  margin-left:auto;
  margin-right:auto;
}
.gc-composition--editorial-signature .gc-cta-block .gc-actions{
  justify-content:center;
  margin-top:30px;
}

/* Commerce compositions */
.gc-composition--commerce-showcase .gc-composition__offer-stage,
.gc-composition--catalog-flow .gc-composition__offer-stage{
  background:var(--gc-background);
}
.gc-composition--commerce-showcase .gc-products-grid,
.gc-composition--catalog-flow .gc-products-grid{
  align-items:stretch;
}

/* Responsivo da composição */
@media(max-width:980px){
  .gc-composition-group--overlap{margin-top:-42px}
  .gc-header__action{display:none}
  .gc-cta-block__inner{
    grid-template-columns:1fr;
    gap:32px;
  }
  .gc-cta-block .gc-actions{justify-content:flex-start}
  .gc-footer--professional .gc-footer__inner{
    grid-template-columns:1fr;
    text-align:left;
  }
  .gc-composition--human-authority .gc-composition__story-stage .gc-about__inner{
    grid-template-columns:1fr;
    gap:50px;
  }
}

@media(max-width:640px){
  .gc-header--professional .gc-header__inner{min-height:66px;padding:12px 0}
  .gc-brand__logo,.gc-brand__monogram{width:40px;height:40px;flex-basis:40px}
  .gc-brand__name{font-size:17px;max-width:190px}
  .gc-header--professional .gc-nav{display:none}

  .gc-composition-group--overlap{margin-top:-24px}
  .gc-composition__offer-bridge{padding-bottom:24px}
  .gc-composition__offer-bridge .gc-section-heading{
    padding:22px 8px 0;
    margin-bottom:24px;
  }
  .gc-service-card__media{aspect-ratio:4/3}

  .gc-composition__story-stage .gc-about__image img{min-height:380px}
  .gc-composition__story-stage .gc-about__image::before,
  .gc-composition__story-stage .gc-about-story__media::before{
    left:-12px;
    bottom:-12px;
  }

  .gc-cta-block{padding:64px 0}
  .gc-cta-block h2{font-size:42px}
  .gc-cta-block .gc-actions{
    display:grid;
    grid-template-columns:1fr;
  }
  .gc-cta-block .gc-btn{width:100%}

  .gc-footer--professional{padding:44px 0 28px}
  .gc-footer__nav{gap:12px 18px}
}


/* =========================================================
   ENTREGA 4 — CONTRASTE SEMÂNTICO + IMMERSIVE COVER
   ========================================================= */

/* Superfícies claras nunca herdam texto claro de uma cena anterior. */
.gc-composition-group--surface-page,
.gc-composition-group--surface-surface,
.gc-composition-group--surface-soft{
  color:var(--gc-text);
}
.gc-composition-group--surface-page h1,
.gc-composition-group--surface-page h2,
.gc-composition-group--surface-page h3,
.gc-composition-group--surface-surface h1,
.gc-composition-group--surface-surface h2,
.gc-composition-group--surface-surface h3,
.gc-composition-group--surface-soft h1,
.gc-composition-group--surface-soft h2,
.gc-composition-group--surface-soft h3{
  color:var(--gc-text);
}
.gc-composition-group--surface-page p,
.gc-composition-group--surface-page .gc-section-heading p,
.gc-composition-group--surface-surface p,
.gc-composition-group--surface-surface .gc-section-heading p,
.gc-composition-group--surface-soft p,
.gc-composition-group--surface-soft .gc-section-heading p{
  color:var(--gc-muted);
}
.gc-composition-group--surface-page .gc-kicker,
.gc-composition-group--surface-surface .gc-kicker,
.gc-composition-group--surface-soft .gc-kicker,
.gc-composition-group--surface-page .gc-section-heading>span,
.gc-composition-group--surface-surface .gc-section-heading>span,
.gc-composition-group--surface-soft .gc-section-heading>span{
  color:var(--gc-primary);
}

/* Superfícies de marca/contraste recebem tokens próprios de leitura. */
.gc-composition-group--surface-brand,
.gc-composition-group--surface-contrast{
  color:var(--gc-on-primary);
}
.gc-composition-group--surface-brand h1,
.gc-composition-group--surface-brand h2,
.gc-composition-group--surface-brand h3,
.gc-composition-group--surface-contrast h1,
.gc-composition-group--surface-contrast h2,
.gc-composition-group--surface-contrast h3{
  color:var(--gc-on-primary);
}
.gc-composition-group--surface-brand p,
.gc-composition-group--surface-contrast p{
  color:color-mix(in srgb,var(--gc-on-primary) 78%,transparent);
}
.gc-composition-group--surface-brand .gc-kicker,
.gc-composition-group--surface-contrast .gc-kicker{
  color:var(--gc-accent);
}

/* Cards claros preservam contraste mesmo dentro de cenas escuras. */
.gc-service-card,
.gc-benefit-card,
.gc-faq-item,
.gc-product-card{
  color:var(--gc-text);
}
.gc-service-card h3,
.gc-benefit-card h3,
.gc-faq-item h3,
.gc-product-card h3{
  color:var(--gc-text);
}
.gc-service-card p,
.gc-benefit-card p,
.gc-faq-item p,
.gc-product-card p{
  color:var(--gc-muted);
}

/* Hero horizontal imersivo */
.gc-hero-immersive{
  position:relative;
  min-height:clamp(620px,78vh,860px);
  display:flex;
  align-items:center;
  overflow:hidden;
  isolation:isolate;

  background-image:
    linear-gradient(
      90deg,
      color-mix(in srgb,var(--gc-primary-strong) 90%,transparent) 0%,
      color-mix(in srgb,var(--gc-primary-strong) 72%,transparent) 32%,
      color-mix(in srgb,var(--gc-primary-strong) 32%,transparent) 58%,
      transparent 82%
    ),
    var(--gc-immersive-image);

  background-repeat:no-repeat;
  background-position:center center;
  background-size:cover;
}
.gc-hero-immersive__scrim{
  position:absolute;
  inset:0;
  z-index:-1;
  background:
    radial-gradient(
      circle at 18% 22%,
      color-mix(in srgb,var(--gc-accent) 16%,transparent),
      transparent 34%
    ),
    linear-gradient(
      180deg,
      transparent 70%,
      color-mix(in srgb,var(--gc-primary-strong) 26%,transparent)
    );
}
.gc-hero-immersive__inner{
  width:100%;
  display:flex;
  align-items:center;
  min-height:inherit;
}
.gc-hero-immersive__content{
  width:min(690px,58%);
  padding:110px 0 120px;
}
.gc-hero-immersive .gc-kicker{
  display:inline-flex;
  margin-bottom:20px;
  color:var(--gc-accent);
}
.gc-hero-immersive h1{
  max-width:680px;
  margin:0;
  color:var(--gc-on-primary);
  font-family:var(--gc-heading-font),serif;
  font-size:clamp(52px,6.4vw,92px);
  line-height:.91;
  letter-spacing:-.055em;
  text-wrap:balance;
}
.gc-hero-immersive p{
  max-width:600px;
  margin:26px 0 0;
  color:color-mix(in srgb,var(--gc-on-primary) 84%,transparent);
  font-size:clamp(17px,1.5vw,21px);
  line-height:1.65;
}
.gc-hero-immersive .gc-actions{
  margin-top:34px;
}
.gc-hero-immersive .gc-btn--secondary{
  color:var(--gc-on-primary);
  border-color:color-mix(in srgb,var(--gc-on-primary) 44%,transparent);
  background:color-mix(in srgb,var(--gc-primary-strong) 18%,transparent);
}
.gc-hero-immersive .gc-hero-trust{
  margin-top:30px;
  color:color-mix(in srgb,var(--gc-on-primary) 78%,transparent);
}

@media(max-width:820px){
  .gc-hero-immersive{
    min-height:720px;
    align-items:flex-end;

    background-image:
      linear-gradient(
        180deg,
        transparent 0 30%,
        color-mix(in srgb,var(--gc-primary-strong) 46%,transparent) 55%,
        color-mix(in srgb,var(--gc-primary-strong) 96%,transparent) 100%
      ),
      var(--gc-immersive-image);

    background-position:center top;
    background-size:cover;
    background-repeat:no-repeat;
  }
  .gc-hero-immersive__inner{
    align-items:flex-end;
  }
  .gc-hero-immersive__content{
    width:100%;
    padding:320px 0 74px;
  }
  .gc-hero-immersive h1{
    font-size:clamp(46px,11vw,70px);
  }
}

@media(max-width:520px){
  .gc-hero-immersive{
    min-height:700px;
    background-position:center top;
  }
  .gc-hero-immersive__content{
    padding-top:300px;
    padding-bottom:56px;
  }
  .gc-hero-immersive .gc-actions{
    display:grid;
    grid-template-columns:1fr;
  }
  .gc-hero-immersive .gc-btn{
    width:100%;
  }
}


`;
}

export default buildRenderCss;
