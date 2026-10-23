import type { RenderContext } from "../renderTypes";

export function buildSectionVariantCss(_context: RenderContext): string {
  return `
/* =========================================================
   GranConecta — Section Variant Engine
   Estruturas visuais para About + Products
   ========================================================= */

/* ---------- ABOUT: LUXURY EDITORIAL ---------- */
.gc-about--editorial-overlap {
  position: relative;
  overflow: hidden;
  padding: clamp(88px, 10vw, 160px) 0;
}

.gc-about-editorial__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(320px, 1.1fr);
  align-items: center;
  gap: clamp(36px, 7vw, 110px);
  min-height: 620px;
}

.gc-about-editorial__copy {
  position: relative;
  z-index: 3;
  max-width: 620px;
  padding: clamp(28px, 4vw, 64px) 0;
}

.gc-about-editorial__copy > span {
  display: inline-block;
  margin-bottom: 18px;
  text-transform: uppercase;
  letter-spacing: .18em;
  font-size: .76rem;
}

.gc-about-editorial__copy h2 {
  margin: 0 0 24px;
  max-width: 9ch;
  font-family: var(--gc-font-heading, "Cormorant Garamond", serif);
  font-size: clamp(3.2rem, 6.2vw, 7rem);
  line-height: .9;
  font-weight: 600;
}

.gc-about-editorial__copy p {
  max-width: 58ch;
  line-height: 1.8;
}

.gc-about-editorial__primary {
  margin: 0;
  position: relative;
  min-height: 560px;
}

.gc-about-editorial__primary img {
  width: 100%;
  height: 100%;
  min-height: 560px;
  object-fit: cover;
  border-radius: 28px;
}

.gc-about-editorial__secondary {
  position: absolute;
  z-index: 4;
  width: clamp(150px, 22vw, 300px);
  right: 2%;
  bottom: 2%;
  margin: 0;
  border: 10px solid var(--gc-bg, #fff);
  box-shadow: 0 24px 70px rgba(0,0,0,.16);
}

.gc-about-editorial__secondary img {
  display: block;
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
}

/* ---------- ABOUT: CINEMATIC ---------- */
.gc-about--cinematic-story {
  position: relative;
  min-height: clamp(680px, 82vh, 980px);
  display: flex;
  align-items: flex-end;
  background-image: var(--gc-about-bg);
  background-size: cover;
  background-position: center;
  overflow: hidden;
  color: #fff;
}

.gc-about-cinematic__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,.76) 0%, rgba(0,0,0,.42) 45%, rgba(0,0,0,.08) 78%),
    linear-gradient(0deg, rgba(0,0,0,.48) 0%, transparent 48%);
}

.gc-about-cinematic__inner {
  position: relative;
  z-index: 2;
  width: 100%;
  padding-top: 130px;
  padding-bottom: clamp(72px, 10vw, 140px);
}

.gc-about-cinematic__copy {
  max-width: 720px;
}

.gc-about-cinematic__copy > span {
  text-transform: uppercase;
  letter-spacing: .2em;
  font-size: .75rem;
}

.gc-about-cinematic__copy h2 {
  margin: 18px 0 24px;
  max-width: 11ch;
  font-size: clamp(3.4rem, 7vw, 7.8rem);
  line-height: .92;
}

.gc-about-cinematic__copy p {
  max-width: 56ch;
  font-size: clamp(1rem, 1.4vw, 1.24rem);
  line-height: 1.75;
}

/* ---------- ABOUT: BOUTIQUE ---------- */
.gc-about--boutique-brand {
  padding: clamp(76px, 9vw, 132px) 0;
}

.gc-about-boutique__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, .85fr);
  gap: clamp(36px, 7vw, 100px);
  align-items: center;
}

.gc-about-boutique__copy {
  max-width: 650px;
}

.gc-about-boutique__copy h2 {
  margin: 12px 0 22px;
  font-size: clamp(2.8rem, 5vw, 5.8rem);
  line-height: .98;
}

.gc-about-boutique__copy p {
  max-width: 60ch;
  line-height: 1.75;
}

.gc-about-boutique__media {
  margin: 0;
}

.gc-about-boutique__media img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 36px 8px 36px 8px;
}

/* ---------- ABOUT: MAGAZINE ---------- */
.gc-about--magazine-numbered {
  padding: clamp(92px, 11vw, 170px) 0;
  overflow: hidden;
}

.gc-about-magazine__inner {
  position: relative;
  display: grid;
  grid-template-columns: .4fr .9fr 1.1fr;
  grid-template-areas:
    "number copy primary"
    ". secondary primary";
  gap: clamp(24px, 4vw, 58px);
  align-items: start;
}

.gc-about-magazine__number {
  grid-area: number;
  font-family: var(--gc-font-heading, "Cormorant Garamond", serif);
  font-size: clamp(5rem, 11vw, 12rem);
  line-height: .72;
  opacity: .14;
}

.gc-about-magazine__copy {
  grid-area: copy;
  padding-top: 8%;
}

.gc-about-magazine__copy h2 {
  margin: 12px 0 22px;
  font-size: clamp(3rem, 5vw, 6rem);
  line-height: .95;
}

.gc-about-magazine__copy p {
  line-height: 1.8;
}

.gc-about-magazine__primary {
  grid-area: primary;
  margin: 0;
}

.gc-about-magazine__primary img {
  width: 100%;
  min-height: 620px;
  object-fit: cover;
}

.gc-about-magazine__secondary {
  grid-area: secondary;
  margin: 0;
  width: 78%;
  justify-self: end;
  transform: translateY(-34px);
}

.gc-about-magazine__secondary img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

/* ---------- ABOUT: MINIMAL ---------- */
.gc-about--minimal-centered {
  padding: clamp(110px, 14vw, 210px) 0;
}

.gc-about-minimal-centered__inner {
  max-width: 930px;
  margin: 0 auto;
  text-align: center;
}

.gc-about-minimal-centered__inner > span {
  text-transform: uppercase;
  letter-spacing: .2em;
  font-size: .72rem;
}

.gc-about-minimal-centered__inner h2 {
  margin: 20px auto 30px;
  max-width: 12ch;
  font-size: clamp(3.2rem, 6vw, 7rem);
  line-height: .94;
}

.gc-about-minimal-centered__inner p {
  max-width: 64ch;
  margin: 0 auto;
  line-height: 1.9;
}

.gc-about-minimal-centered__inner figure {
  width: min(780px, 88%);
  margin: 64px auto 0;
}

.gc-about-minimal-centered__inner img {
  width: 100%;
  max-height: 560px;
  object-fit: cover;
}

/* ---------- ABOUT: CONVERSION ---------- */
.gc-about--conversion-proof {
  padding: clamp(72px, 8vw, 120px) 0;
}

.gc-about-conversion__inner {
  display: grid;
  grid-template-columns: minmax(300px, .9fr) minmax(0, 1.1fr);
  gap: clamp(34px, 6vw, 90px);
  align-items: center;
}

.gc-about-conversion__media img {
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
  border-radius: 24px;
}

.gc-about-conversion__copy h2 {
  margin: 12px 0 20px;
  font-family: var(--gc-font-body, "Montserrat", sans-serif);
  font-size: clamp(2.8rem, 5vw, 5.6rem);
  font-weight: 800;
  line-height: .95;
}

.gc-about-conversion__copy p {
  line-height: 1.7;
}

.gc-about-conversion__copy strong {
  display: block;
  margin: 24px 0;
  font-size: 1.08rem;
}

/* =========================================================
   PRODUCTS
   ========================================================= */

.gc-products {
  overflow: hidden;
}

/* ---------- PRODUCTS: EDITORIAL ---------- */
.gc-products--editorial-showcase {
  padding: clamp(86px, 10vw, 150px) 0;
}

.gc-products--editorial-showcase .gc-section-heading {
  max-width: 780px;
  margin-bottom: clamp(42px, 6vw, 82px);
}

.gc-products-editorial-showcase {
  display: grid;
  grid-template-columns: minmax(340px, 1.12fr) minmax(0, .88fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.gc-products-editorial-showcase__featured .gc-product-featured {
  display: block;
}

.gc-products-editorial-showcase__featured .gc-product-featured__image img {
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
}

.gc-products-editorial-showcase__rail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 26px;
}

.gc-product-card--editorial {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.gc-product-card--editorial .gc-product-card__image img {
  aspect-ratio: 3/4;
  object-fit: cover;
}

/* ---------- PRODUCTS: CINEMATIC STRIP ---------- */
.gc-products--cinematic-strip {
  padding: clamp(86px, 9vw, 140px) 0;
}

.gc-products-cinematic-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(310px, 34vw);
  gap: clamp(20px, 2.5vw, 38px);
  overflow-x: auto;
  padding: 12px 4vw 30px;
  margin-left: calc((100vw - min(100vw - 32px, var(--gc-max-width, 1320px))) / -2);
  margin-right: calc((100vw - min(100vw - 32px, var(--gc-max-width, 1320px))) / -2);
  scroll-snap-type: x mandatory;
}

.gc-products-cinematic-strip__item {
  scroll-snap-align: start;
}

.gc-product-card--cinematic {
  position: relative;
  min-height: 560px;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: #111;
  color: #fff;
}

.gc-product-card--cinematic .gc-product-card__image {
  position: absolute;
  inset: 0;
}

.gc-product-card--cinematic .gc-product-card__image::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0,0,0,.78), rgba(0,0,0,.05) 62%);
}

.gc-product-card--cinematic .gc-product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gc-product-card--cinematic .gc-product-card__body {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 30px;
}

/* ---------- PRODUCTS: COMMERCE GRID ---------- */
.gc-products--commerce-grid {
  padding: clamp(72px, 8vw, 120px) 0;
}

.gc-products-commerce-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(18px, 2vw, 28px);
}

.gc-product-card--commerce {
  height: 100%;
}

.gc-product-card--commerce .gc-product-card__image img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
}

/* ---------- PRODUCTS: MAGAZINE FEATURE ---------- */
.gc-products--magazine-feature {
  padding: clamp(92px, 11vw, 160px) 0;
}

.gc-products-magazine-feature {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
  gap: clamp(28px, 5vw, 70px);
  align-items: start;
}

.gc-products-magazine-feature__lead .gc-product-featured__image img {
  width: 100%;
  min-height: 660px;
  object-fit: cover;
}

.gc-products-magazine-feature__column {
  display: grid;
  gap: 30px;
  padding-top: 12%;
}

.gc-products-magazine-feature__column .gc-product-card {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: stretch;
}

.gc-products-magazine-feature__column .gc-product-card__image img {
  width: 100%;
  height: 100%;
  min-height: 170px;
  object-fit: cover;
}

/* ---------- PRODUCTS: MINIMAL SPARSE ---------- */
.gc-products--minimal-sparse {
  padding: clamp(110px, 14vw, 200px) 0;
}

.gc-products--minimal-sparse .gc-section-heading {
  max-width: 680px;
  margin: 0 auto clamp(64px, 9vw, 120px);
  text-align: center;
}

.gc-products-minimal-sparse {
  display: grid;
  gap: clamp(46px, 7vw, 90px);
}

.gc-products-minimal-sparse__item {
  width: min(920px, 86%);
}

.gc-products-minimal-sparse__item--left {
  justify-self: start;
}

.gc-products-minimal-sparse__item--right {
  justify-self: end;
}

.gc-products-minimal-sparse .gc-product-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto auto;
  gap: 26px;
  align-items: center;
  padding: 0 0 26px;
  border: 0;
  border-bottom: 1px solid rgba(0,0,0,.12);
  background: transparent;
  box-shadow: none;
}

.gc-products-minimal-sparse .gc-product-row > img {
  width: 180px;
  height: 180px;
  object-fit: cover;
}

/* ---------- PRODUCTS: CONVERSION ---------- */
.gc-products--conversion-grid {
  padding: clamp(72px, 8vw, 120px) 0;
}

.gc-products-conversion-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(20px, 2.4vw, 34px);
}

.gc-product-card--conversion {
  height: 100%;
  border: 1px solid rgba(0,0,0,.1);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 55px rgba(0,0,0,.08);
}

.gc-product-card--conversion .gc-product-card__image img {
  width: 100%;
  aspect-ratio: 16/11;
  object-fit: cover;
}

.gc-product-card--conversion .gc-product-card__body {
  padding: 26px;
}

/* ---------- Responsive ---------- */
@media (max-width: 980px) {
  .gc-about-editorial__inner,
  .gc-about-boutique__inner,
  .gc-about-conversion__inner,
  .gc-products-editorial-showcase,
  .gc-products-magazine-feature {
    grid-template-columns: 1fr;
  }

  .gc-about-editorial__inner {
    min-height: 0;
  }

  .gc-about-editorial__primary img,
  .gc-about-magazine__primary img,
  .gc-products-magazine-feature__lead .gc-product-featured__image img {
    min-height: 0;
    max-height: 680px;
  }

  .gc-about-editorial__secondary {
    right: 4%;
    bottom: -3%;
  }

  .gc-about-magazine__inner {
    grid-template-columns: 1fr;
    grid-template-areas:
      "number"
      "copy"
      "primary"
      "secondary";
  }

  .gc-about-magazine__secondary {
    width: 64%;
    transform: translateY(-20px);
  }

  .gc-products-commerce-grid,
  .gc-products-conversion-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gc-products-magazine-feature__column {
    padding-top: 0;
  }
}

@media (max-width: 640px) {
  .gc-about--editorial-overlap,
  .gc-about--boutique-brand,
  .gc-about--magazine-numbered,
  .gc-about--minimal-centered,
  .gc-about--conversion-proof,
  .gc-products--editorial-showcase,
  .gc-products--cinematic-strip,
  .gc-products--commerce-grid,
  .gc-products--magazine-feature,
  .gc-products--minimal-sparse,
  .gc-products--conversion-grid {
    padding-top: 68px;
    padding-bottom: 68px;
  }

  .gc-about-editorial__copy h2,
  .gc-about-boutique__copy h2,
  .gc-about-magazine__copy h2,
  .gc-about-minimal-centered__inner h2,
  .gc-about-conversion__copy h2 {
    font-size: clamp(2.5rem, 13vw, 4.3rem);
  }

  .gc-about-editorial__primary img {
    min-height: 420px;
  }

  .gc-about-editorial__secondary {
    width: 42%;
    border-width: 6px;
  }

  .gc-about--cinematic-story {
    min-height: 620px;
    background-position: center;
  }

  .gc-about-cinematic__shade {
    background: linear-gradient(0deg, rgba(0,0,0,.8), rgba(0,0,0,.15) 74%);
  }

  .gc-about-cinematic__copy h2 {
    font-size: clamp(2.8rem, 14vw, 4.8rem);
  }

  .gc-about-magazine__secondary {
    width: 82%;
  }

  .gc-products-editorial-showcase__rail,
  .gc-products-commerce-grid,
  .gc-products-conversion-grid {
    grid-template-columns: 1fr;
  }

  .gc-products-cinematic-strip {
    grid-auto-columns: 82vw;
  }

  .gc-product-card--cinematic {
    min-height: 500px;
  }

  .gc-products-magazine-feature__column .gc-product-card {
    grid-template-columns: 110px 1fr;
  }

  .gc-products-minimal-sparse__item {
    width: 100%;
  }

  .gc-products-minimal-sparse .gc-product-row {
    grid-template-columns: 92px minmax(0, 1fr);
  }

  .gc-products-minimal-sparse .gc-product-row > img {
    width: 92px;
    height: 110px;
  }

  .gc-products-minimal-sparse .gc-product-row > strong,
  .gc-products-minimal-sparse .gc-product-row__actions {
    grid-column: 2;
  }
}

/* =========================================================
   GALLERY VARIANTS
   ========================================================= */
.gc-gallery--editorial-art,
.gc-gallery--magazine-mosaic,
.gc-gallery--minimal-grid,
.gc-gallery--conversion-proof,
.gc-gallery--commerce-lookbook { padding: clamp(80px, 10vw, 150px) 0; }

.gc-gallery-editorial-art {
  display:grid; grid-template-columns:repeat(12,1fr); grid-auto-rows:90px; gap:22px;
}
.gc-gallery-editorial-art__item { margin:0; overflow:hidden; }
.gc-gallery-editorial-art__item img,
.gc-gallery-magazine-mosaic__item img,
.gc-gallery-cinematic__item img,
.gc-gallery-minimal-grid img,
.gc-gallery-conversion-proof img,
.gc-gallery-commerce-lookbook img { width:100%; height:100%; object-fit:cover; display:block; }
.gc-gallery-editorial-art__item--1 { grid-column:1/8; grid-row:1/6; }
.gc-gallery-editorial-art__item--2 { grid-column:8/13; grid-row:2/5; }
.gc-gallery-editorial-art__item--3 { grid-column:3/8; grid-row:6/9; }
.gc-gallery-editorial-art__item--4 { grid-column:8/13; grid-row:5/10; }
.gc-gallery-editorial-art__item--5 { grid-column:1/5; grid-row:9/12; }
.gc-gallery-editorial-art__item--6 { grid-column:5/10; grid-row:10/13; }
.gc-gallery-editorial-art__item--7 { grid-column:10/13; grid-row:10/13; }
.gc-gallery-editorial-art__item--8 { grid-column:1/5; grid-row:12/15; }

.gc-gallery--cinematic-wide { padding:0; background:#111; }
.gc-gallery-cinematic { display:grid; grid-template-columns:2fr 1fr 1fr; grid-template-rows:50vh 34vh; min-height:84vh; }
.gc-gallery-cinematic__item { margin:0; overflow:hidden; }
.gc-gallery-cinematic__item--1 { grid-row:1/3; }
.gc-gallery-cinematic__item--4 { grid-column:2/4; }

.gc-gallery-commerce-lookbook { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.gc-gallery-commerce-lookbook figure { margin:0; overflow:hidden; aspect-ratio:1/1; }
.gc-gallery-commerce-lookbook figure:nth-child(1),
.gc-gallery-commerce-lookbook figure:nth-child(5) { grid-row:span 2; aspect-ratio:auto; }

.gc-gallery-magazine-mosaic { display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:180px; gap:18px; }
.gc-gallery-magazine-mosaic figure { margin:0; overflow:hidden; }
.gc-gallery-magazine-mosaic__item--1 { grid-column:span 2; grid-row:span 3; }
.gc-gallery-magazine-mosaic__item--2 { grid-column:span 2; grid-row:span 2; }
.gc-gallery-magazine-mosaic__item--3 { grid-row:span 2; }
.gc-gallery-magazine-mosaic__item--4 { grid-row:span 2; }

.gc-gallery-minimal-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:clamp(30px,5vw,80px); }
.gc-gallery-minimal-grid figure { margin:0; aspect-ratio:4/5; overflow:hidden; }
.gc-gallery-minimal-grid figure:nth-child(even) { transform:translateY(70px); }

.gc-gallery-conversion-proof { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.gc-gallery-conversion-proof figure { margin:0; aspect-ratio:4/3; overflow:hidden; border-radius:18px; }

/* =========================================================
   HEADER VARIANTS
   ========================================================= */
.gc-header--luxury-centered { padding:20px 0 0; }
.gc-header-luxury-centered__inner { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:28px; }
.gc-header-luxury-centered__inner .gc-brand { display:flex; flex-direction:column; align-items:center; }
.gc-header-luxury-centered__action { justify-self:end; }
.gc-header-luxury-centered__nav { display:flex; justify-content:center; padding:18px 0; border-top:1px solid rgba(0,0,0,.08); margin-top:18px; }

.gc-header--cinematic-overlay {
  position:absolute; z-index:30; left:0; right:0; top:0; color:#fff; background:linear-gradient(180deg,rgba(0,0,0,.5),transparent);
}
.gc-header-cinematic__inner { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:34px; padding-top:24px; padding-bottom:24px; }
.gc-header--cinematic-overlay a { color:inherit; }

.gc-header--commerce-nav { background:var(--gc-bg,#fff); }
.gc-header-commerce__top { display:flex; justify-content:space-between; align-items:center; gap:28px; padding-top:18px; padding-bottom:18px; }
.gc-header-commerce__nav { border-top:1px solid rgba(0,0,0,.08); border-bottom:1px solid rgba(0,0,0,.08); }
.gc-header-commerce__nav .gc-container { display:flex; align-items:center; gap:34px; padding-top:12px; padding-bottom:12px; }

.gc-header--magazine-masthead { padding-top:28px; }
.gc-header-magazine__brand { text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; }
.gc-header-magazine__brand strong { font-size:clamp(2rem,4vw,4.6rem); line-height:1; }
.gc-header-magazine__brand > span { text-transform:uppercase; letter-spacing:.2em; font-size:.7rem; }
.gc-header-magazine__nav { margin-top:24px; border-top:1px solid currentColor; border-bottom:1px solid currentColor; padding:12px 0; }
.gc-header-magazine__nav .gc-nav { justify-content:center; }

.gc-header-minimal-clean__inner { min-height:86px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:34px; }
.gc-header-minimal-clean__inner .gc-nav { justify-content:center; }

.gc-header--conversion-action { border-bottom:1px solid rgba(0,0,0,.08); }
.gc-header-conversion__inner { min-height:88px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:28px; }
.gc-header-conversion__inner .gc-nav { justify-content:center; }
.gc-header-conversion__actions { display:flex; gap:10px; }

/* =========================================================
   FOOTER VARIANTS
   ========================================================= */
.gc-footer--luxury-editorial { padding:clamp(90px,10vw,150px) 0 28px; }
.gc-footer-luxury__brand { text-align:center; display:flex; flex-direction:column; align-items:center; gap:18px; margin-bottom:70px; }
.gc-footer-luxury__brand strong { font-size:clamp(3rem,7vw,8rem); line-height:.9; }
.gc-footer-luxury__grid { display:grid; grid-template-columns:repeat(4,1fr); gap:40px; padding-top:35px; border-top:1px solid currentColor; }
.gc-footer-luxury__grid > div { display:flex; flex-direction:column; gap:10px; }
.gc-footer-luxury__grid > div > span { text-transform:uppercase; letter-spacing:.16em; font-size:.7rem; margin-bottom:10px; }
.gc-footer-luxury__bottom { display:flex; justify-content:space-between; margin-top:70px; padding-top:20px; border-top:1px solid rgba(127,127,127,.25); }

.gc-footer--cinematic-dark { background:#0c0c0c; color:#fff; padding:clamp(100px,12vw,180px) 0 34px; }
.gc-footer-cinematic__inner { min-height:520px; display:flex; flex-direction:column; justify-content:flex-end; }
.gc-footer-cinematic__brand { display:flex; align-items:center; gap:18px; }
.gc-footer-cinematic__brand strong { font-size:clamp(3.4rem,8vw,9rem); line-height:.85; }
.gc-footer-cinematic__inner > p { max-width:650px; font-size:1.1rem; line-height:1.7; margin:30px 0; }
.gc-footer-cinematic__inner > button { align-self:flex-start; }
.gc-footer-cinematic__bottom { margin-top:80px; padding-top:20px; border-top:1px solid rgba(255,255,255,.2); display:flex; justify-content:space-between; gap:30px; }
.gc-footer-cinematic__bottom div { display:flex; gap:18px; }

.gc-footer--commerce-columns { padding:70px 0 24px; }
.gc-footer-commerce__grid { display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:40px; }
.gc-footer-commerce__grid > div { display:flex; flex-direction:column; gap:10px; }
.gc-footer-commerce__bottom { margin-top:60px; padding-top:20px; border-top:1px solid rgba(0,0,0,.1); display:flex; justify-content:space-between; }

.gc-footer--magazine-columns { padding:80px 0 28px; border-top:1px solid currentColor; }
.gc-footer-magazine__masthead { display:flex; flex-direction:column; align-items:flex-start; }
.gc-footer-magazine__masthead strong { font-size:clamp(4rem,10vw,11rem); line-height:.78; margin:24px 0 70px; }
.gc-footer-magazine__columns { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid currentColor; }
.gc-footer-magazine__columns > div { min-height:220px; padding:24px; border-right:1px solid currentColor; display:flex; flex-direction:column; gap:12px; }
.gc-footer-magazine__columns b { font-size:2.6rem; opacity:.25; }
.gc-footer-magazine__bottom { padding-top:24px; }

.gc-footer--minimal-clean { padding:80px 0 28px; }
.gc-footer-minimal-clean__inner { display:grid; grid-template-columns:1fr auto; gap:40px; align-items:center; }
.gc-footer-minimal-clean__inner > div:first-child { display:flex; align-items:center; gap:14px; }
.gc-footer-minimal-clean__inner nav,
.gc-footer-minimal-clean__inner > div:nth-of-type(2) { display:flex; gap:22px; }
.gc-footer-minimal-clean__inner > span { grid-column:1/-1; border-top:1px solid rgba(0,0,0,.1); padding-top:20px; }

.gc-footer--conversion-action { padding:80px 0 24px; }
.gc-footer-conversion__cta { display:flex; align-items:center; justify-content:space-between; gap:40px; padding:50px; border-radius:28px; background:rgba(127,127,127,.08); }
.gc-footer-conversion__cta h2 { font-size:clamp(2.4rem,5vw,5.8rem); margin:10px 0 0; }
.gc-footer-conversion__links { display:grid; grid-template-columns:1fr auto; gap:30px; margin-top:50px; padding-top:20px; border-top:1px solid rgba(0,0,0,.1); }
.gc-footer-conversion__links > div { display:flex; gap:18px; }
.gc-footer-conversion__links > span { grid-column:1/-1; }

@media (max-width: 900px) {
  .gc-gallery-editorial-art { grid-template-columns:repeat(2,1fr); grid-auto-rows:280px; }
  .gc-gallery-editorial-art__item { grid-column:auto !important; grid-row:auto !important; }
  .gc-gallery-cinematic { grid-template-columns:1fr 1fr; grid-template-rows:60vh 32vh 32vh; }
  .gc-gallery-cinematic__item--1 { grid-column:1/3; grid-row:auto; }
  .gc-gallery-cinematic__item--4 { grid-column:auto; }
  .gc-gallery-commerce-lookbook { grid-template-columns:repeat(2,1fr); }
  .gc-gallery-magazine-mosaic { grid-template-columns:repeat(2,1fr); }

  .gc-header-luxury-centered__inner,
  .gc-header-cinematic__inner,
  .gc-header-minimal-clean__inner,
  .gc-header-conversion__inner { grid-template-columns:1fr auto; }
  .gc-header-luxury-centered__social,
  .gc-header-cinematic__inner > .gc-nav,
  .gc-header-minimal-clean__inner > .gc-nav,
  .gc-header-conversion__inner > .gc-nav { display:none; }

  .gc-footer-luxury__grid,
  .gc-footer-commerce__grid { grid-template-columns:repeat(2,1fr); }
}

@media (max-width: 640px) {
  .gc-gallery-editorial-art,
  .gc-gallery-commerce-lookbook,
  .gc-gallery-magazine-mosaic,
  .gc-gallery-minimal-grid,
  .gc-gallery-conversion-proof { grid-template-columns:1fr; }
  .gc-gallery-minimal-grid figure:nth-child(even) { transform:none; }
  .gc-gallery-cinematic { display:flex; overflow-x:auto; min-height:0; }
  .gc-gallery-cinematic figure { flex:0 0 84vw; height:520px; }

  .gc-header-commerce__top { align-items:flex-start; }
  .gc-header-commerce__nav .gc-nav { overflow-x:auto; justify-content:flex-start; }
  .gc-header-magazine__nav .gc-nav { overflow-x:auto; justify-content:flex-start; }
  .gc-header-luxury-centered__action { display:none; }

  .gc-footer-luxury__grid,
  .gc-footer-commerce__grid,
  .gc-footer-magazine__columns { grid-template-columns:1fr; }
  .gc-footer-cinematic__brand strong { font-size:clamp(3rem,16vw,5rem); }
  .gc-footer-cinematic__bottom,
  .gc-footer-commerce__bottom,
  .gc-footer-conversion__cta { flex-direction:column; align-items:flex-start; }
  .gc-footer-minimal-clean__inner,
  .gc-footer-conversion__links { grid-template-columns:1fr; }
  .gc-footer-minimal-clean__inner nav,
  .gc-footer-minimal-clean__inner > div:nth-of-type(2),
  .gc-footer-conversion__links > div { flex-wrap:wrap; }
}

`;
}