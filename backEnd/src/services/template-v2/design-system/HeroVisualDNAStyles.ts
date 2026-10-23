
import { RenderContext } from "../render-engine/renderTypes";
import type { VisualDNA } from "./VisualDNAEngine";

/**
 * Structural Hero V4 CSS — coerente com os valores reais do VisualDNAEngine.
 * Uses only stable data attributes emitted by Hero renderers.
 */
export function buildHeroVisualDNACss(
  _context: RenderContext,
  _dna: VisualDNA,
): string {
  return `
.gc-hero--dna { position: relative; isolation: isolate; overflow: clip; }
.gc-hero--dna img { display:block; width:100%; height:100%; object-fit:cover; }

/* Content position */
.gc-hero--dna[data-dna-content="left"] .gc-hero-luxury__copy,
.gc-hero--dna[data-dna-content="left"] .gc-hero-magazine__copy,
.gc-hero--dna[data-dna-content="left"] .gc-hero-marketplace__copy { text-align:left; }
.gc-hero--dna[data-dna-content="center"] .gc-hero-luxury__copy,
.gc-hero--dna[data-dna-content="center"] .gc-hero-magazine__copy,
.gc-hero--dna[data-dna-content="center"] .gc-hero-marketplace__copy,
.gc-hero--dna[data-dna-content="center"] .gc-hero-immersive__content { text-align:center; margin-inline:auto; }
.gc-hero--dna[data-dna-content="right"] .gc-hero-luxury__copy,
.gc-hero--dna[data-dna-content="right"] .gc-hero-magazine__copy,
.gc-hero--dna[data-dna-content="right"] .gc-hero-marketplace__copy,
.gc-hero--dna[data-dna-content="right"] .gc-hero-immersive__content { margin-left:auto; text-align:right; }

/* Image treatment — valores reais do VisualDNAEngine V4 */
.gc-hero--dna[data-dna-image="portrait-dominant"] .gc-hero-luxury__frame,
.gc-hero--dna[data-dna-image="portrait-dominant"] .gc-hero-magazine__media,
.gc-hero--dna[data-dna-image="portrait-dominant"] .gc-hero-minimal__media {
  aspect-ratio:4 / 5; max-height:820px;
}
.gc-hero--dna[data-dna-image="portrait-dominant"] img { object-position:center top; }

.gc-hero--dna[data-dna-image="full-bleed"] .gc-hero-luxury__media,
.gc-hero--dna[data-dna-image="full-bleed"] .gc-hero-magazine__media { align-self:stretch; }
.gc-hero--dna[data-dna-image="full-bleed"] .gc-hero-luxury__frame,
.gc-hero--dna[data-dna-image="full-bleed"] .gc-hero-magazine__media {
  height:100%; min-height:clamp(580px,78vh,920px); border-radius:0;
}

.gc-hero--dna[data-dna-image="layered-duo"] .gc-hero-luxury__secondary,
.gc-hero--dna[data-dna-image="layered-duo"] .gc-hero-magazine__secondary {
  display:block; width:clamp(150px,34%,310px); z-index:3;
  box-shadow:0 26px 70px rgba(0,0,0,.18);
}

.gc-hero--dna[data-dna-image="editorial-crop"] .gc-hero-luxury__frame,
.gc-hero--dna[data-dna-image="editorial-crop"] .gc-hero-magazine__media {
  aspect-ratio:3 / 4; overflow:hidden; border-radius:0;
}
.gc-hero--dna[data-dna-image="editorial-crop"] img {
  transform:scale(1.035); object-position:50% 32%;
}

.gc-hero--dna[data-dna-image="clean-landscape"] .gc-hero-minimal__media,
.gc-hero--dna[data-dna-image="clean-landscape"] .gc-hero-luxury__frame,
.gc-hero--dna[data-dna-image="clean-landscape"] .gc-hero-magazine__media {
  aspect-ratio:16 / 9; min-height:0;
}

.gc-hero--dna[data-dna-image="product-detail"] .gc-hero-marketplace__card img,
.gc-hero--dna[data-dna-image="product-detail"] .gc-hero-luxury__frame img,
.gc-hero--dna[data-dna-image="product-detail"] .gc-hero-minimal__media img {
  object-fit:contain; padding:clamp(14px,2vw,30px);
}

/* Asymmetric overlap */
.gc-hero--dna[data-dna-hero="asymmetric-overlap"] .gc-hero-luxury__inner {
  display:grid; grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);
  align-items:center; gap:clamp(32px,6vw,100px);
}
.gc-hero--dna[data-dna-hero="asymmetric-overlap"] .gc-hero-luxury__secondary {
  width:42%; right:auto; left:-12%; bottom:7%; transform:rotate(-2deg);
}

/* Editorial split */
.gc-hero--dna[data-dna-hero="editorial-split"] .gc-hero-luxury__inner {
  display:grid; grid-template-columns:1fr 1fr; align-items:stretch; gap:0;
}
.gc-hero--dna[data-dna-hero="editorial-split"] .gc-hero-luxury__copy {
  align-self:center; padding-right:clamp(30px,6vw,96px);
}
.gc-hero--dna[data-dna-hero="editorial-split"] .gc-hero-luxury__frame {
  min-height:clamp(560px,74vh,860px);
}

/* Magazine overlap */
.gc-hero--dna[data-dna-hero="magazine-overlap"] .gc-hero-magazine__inner {
  display:grid; grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);
  gap:clamp(28px,6vw,96px); align-items:center;
}
.gc-hero--dna[data-dna-hero="magazine-overlap"] .gc-hero-magazine__secondary {
  width:44%; right:-12%; bottom:-6%; transform:rotate(3deg);
}

/* Portrait stage */
.gc-hero--dna[data-dna-hero="portrait-stage"] .gc-hero-magazine__inner {
  display:grid; grid-template-columns:minmax(280px,.72fr) minmax(0,1.28fr);
  align-items:center; gap:clamp(36px,8vw,130px);
}
.gc-hero--dna[data-dna-hero="portrait-stage"] .gc-hero-magazine__media { max-width:560px; }

/* Minimal stage */
.gc-hero--dna[data-dna-hero="minimal-stage"] .gc-hero-minimal__inner {
  max-width:1180px; text-align:center;
}
.gc-hero--dna[data-dna-hero="minimal-stage"] .gc-hero-minimal__media {
  margin-top:clamp(36px,6vw,88px); min-height:clamp(360px,58vw,720px);
}

/* Product collage */
.gc-hero--dna[data-dna-hero="product-collage"] .gc-hero-marketplace__inner {
  display:grid; grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr);
  gap:clamp(32px,6vw,100px); align-items:center;
}
.gc-hero--dna[data-dna-hero="product-collage"] .gc-hero-marketplace__cards {
  display:grid; grid-template-columns:1.15fr .85fr; grid-template-rows:1fr 1fr;
  gap:clamp(12px,2vw,24px);
}
.gc-hero--dna[data-dna-hero="product-collage"] .gc-hero-marketplace__card:first-child { grid-row:1 / 3; }

/* Structural inversions */
.gc-hero--dna[data-dna-hero="asymmetric-overlap"][data-dna-content="right"] .gc-hero-luxury__copy,
.gc-hero--dna[data-dna-hero="editorial-split"][data-dna-content="right"] .gc-hero-luxury__copy {
  grid-column:2; grid-row:1;
}
.gc-hero--dna[data-dna-hero="asymmetric-overlap"][data-dna-content="right"] .gc-hero-luxury__media,
.gc-hero--dna[data-dna-hero="editorial-split"][data-dna-content="right"] .gc-hero-luxury__media {
  grid-column:1; grid-row:1;
}
.gc-hero--dna[data-dna-hero="magazine-overlap"][data-dna-content="right"] .gc-hero-magazine__copy {
  grid-column:2; grid-row:1;
}
.gc-hero--dna[data-dna-hero="magazine-overlap"][data-dna-content="right"] .gc-hero-magazine__media {
  grid-column:1; grid-row:1;
}
.gc-hero--dna[data-dna-hero="product-collage"][data-dna-content="right"] .gc-hero-marketplace__copy {
  grid-column:2; grid-row:1;
}
.gc-hero--dna[data-dna-hero="product-collage"][data-dna-content="right"] .gc-hero-marketplace__cards {
  grid-column:1; grid-row:1;
}

/* Cinematic cover */
.gc-hero--dna[data-dna-hero="cinematic-cover"].gc-hero-immersive {
  min-height:clamp(680px,88vh,980px); display:flex; align-items:center;
}
.gc-hero--dna[data-dna-hero="cinematic-cover"] .gc-hero-immersive__content {
  width:min(92%,720px); position:relative; z-index:3;
}
.gc-hero--dna[data-dna-hero="cinematic-cover"][data-dna-content="left"] .gc-hero-immersive__content {
  margin-left:clamp(24px,7vw,120px); margin-right:auto;
}
.gc-hero--dna[data-dna-hero="cinematic-cover"][data-dna-content="right"] .gc-hero-immersive__content {
  margin-right:clamp(24px,7vw,120px); margin-left:auto;
}

/* Bottom-left cover: composição deliberadamente diferente */
.gc-hero--dna[data-dna-hero="bottom-left-cover"].gc-hero-immersive {
  min-height:clamp(700px,92vh,1020px); display:flex; align-items:flex-end;
}
.gc-hero--dna[data-dna-hero="bottom-left-cover"] .gc-hero-immersive__content {
  width:min(92%,780px); margin:0 auto 0 0;
  padding:clamp(36px,6vw,96px); position:relative; z-index:3; text-align:left;
}

/* Headline becomes a visual object */
.gc-hero--dna .gc-art-headline { position:relative; z-index:2; }
.gc-hero--dna[data-dna-headline="mixed-scale"] .gc-art-headline__line:nth-child(2) { font-size:1.2em; }
.gc-hero--dna[data-dna-headline="cinematic-stack"] .gc-art-headline { max-width:10ch; line-height:.82; }
.gc-hero--dna[data-dna-headline="quiet-luxury"] .gc-art-headline { max-width:14ch; line-height:.94; font-weight:500; }
.gc-hero--dna[data-dna-headline="commerce-bold"] .gc-art-headline {
  max-width:12ch; line-height:.88; font-weight:800; letter-spacing:-.045em;
}

/* Decoration changes silhouette, not only color */
.gc-hero--dna[data-dna-decoration="oversized-type"]::after {
  content:"01"; position:absolute; right:2vw; top:2vh; z-index:-1;
  font:600 clamp(7rem,18vw,18rem)/1 var(--gc-heading-font,serif); opacity:.055;
}
.gc-hero--dna[data-dna-decoration="fine-lines"]::after {
  content:""; position:absolute; inset:8% 4%; border:1px solid currentColor;
  opacity:.09; pointer-events:none; z-index:-1;
}
.gc-hero--dna[data-dna-decoration="editorial-number"]::before {
  content:"01"; position:absolute; left:clamp(16px,3vw,54px); top:clamp(18px,4vw,62px);
  z-index:1; font:500 clamp(3rem,8vw,8rem)/1 var(--gc-heading-font,serif);
  opacity:.10; pointer-events:none;
}
.gc-hero--dna[data-dna-decoration="soft-orbs"]::before {
  content:""; position:absolute; width:clamp(260px,36vw,620px); aspect-ratio:1;
  border-radius:50%; right:-12%; top:-20%; background:currentColor;
  opacity:.035; pointer-events:none; z-index:-1;
}
.gc-hero--dna[data-dna-decoration="frames"]::after {
  content:""; position:absolute; inset:clamp(14px,2vw,32px);
  border:1px solid currentColor; opacity:.08; pointer-events:none; z-index:1;
}

@media (max-width: 900px) {
  .gc-hero--dna[data-dna-hero="asymmetric-overlap"] .gc-hero-luxury__inner,
  .gc-hero--dna[data-dna-hero="editorial-split"] .gc-hero-luxury__inner,
  .gc-hero--dna[data-dna-hero="magazine-overlap"] .gc-hero-magazine__inner,
  .gc-hero--dna[data-dna-hero="portrait-stage"] .gc-hero-magazine__inner,
  .gc-hero--dna[data-dna-hero="product-collage"] .gc-hero-marketplace__inner {
    grid-template-columns:1fr;
  }
  .gc-hero--dna[data-dna-content="right"] .gc-hero-luxury__copy,
  .gc-hero--dna[data-dna-content="right"] .gc-hero-magazine__copy,
  .gc-hero--dna[data-dna-content="right"] .gc-hero-immersive__content { text-align:left; margin-left:0; }
}
`;
}
