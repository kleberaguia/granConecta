import type { RenderContext } from "../renderTypes";

export function buildSectionLibraryCss(context: RenderContext): string {
  const p = context.palette;

  return `
  .gc-header-logo{max-height:48px;max-width:150px;object-fit:contain}
  .gc-brand-monogram,.gc-footer-monogram{display:inline-grid;place-items:center;width:42px;height:42px;border:1px solid currentColor;border-radius:50%;font-weight:800}
  .gc-header-tools,.gc-social-links,.gc-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .gc-header{position:relative;z-index:20;background:${p.surface};color:${p.text}}
  .gc-header a{color:inherit;text-decoration:none}
  .gc-header .gc-nav{display:flex;gap:24px;align-items:center}
  .gc-header--luxury .gc-header-luxury__inner,
  .gc-header--marketplace .gc-header-marketplace__inner,
  .gc-header--overlay .gc-header-overlay__inner,
  .gc-header--editorial .gc-header-editorial__inner,
  .gc-header--minimal .gc-header-minimal__inner{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:24px}
  .gc-brand{display:flex;align-items:center;gap:10px}
  .gc-header--luxury{border-bottom:1px solid color-mix(in srgb, ${p.primary} 14%, transparent)}
  .gc-header--luxury strong{font-family:Georgia,serif;font-size:1.25rem}
  .gc-header--marketplace{box-shadow:0 8px 26px rgb(15 23 42 / .08)}
  .gc-header-category-link{font-weight:800;color:${p.accent}!important}
  .gc-header--overlay{position:absolute;top:0;left:0;right:0;background:linear-gradient(180deg,rgb(0 0 0/.55),transparent);color:#fff}
  .gc-header--overlay .gc-header-overlay__inner{min-height:92px}
  .gc-header--editorial .gc-header-editorial__brand{display:flex;align-items:center;gap:10px}
  .gc-header-editorial__tag{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:${p.mutedText}}
  .gc-header--minimal{background:transparent;border-bottom:1px solid color-mix(in srgb, ${p.text} 8%, transparent)}

  .gc-topbar{font-size:.76rem;letter-spacing:.05em}
  .gc-topbar__inner{min-height:34px;display:flex;align-items:center;justify-content:center;gap:30px;flex-wrap:wrap}
  .gc-topbar--luxury{background:${p.background};color:${p.secondary};border-bottom:1px solid color-mix(in srgb, ${p.secondary} 12%, transparent)}
  .gc-topbar--commerce{background:${p.primary};color:#fff}
  .gc-topbar--conversion{background:${p.accent};color:${p.primary}}
  .gc-topbar--conversion .gc-topbar__inner{justify-content:space-between}
  .gc-topbar--editorial{background:${p.surface};color:${p.mutedText}}
  .gc-topbar--minimal{background:${p.background};color:${p.mutedText}}

  .gc-category-grid,.gc-collections-grid,.gc-offers-grid,.gc-benefits-grid,.gc-testimonial-grid,.gc-how-grid{display:grid;gap:22px}
  .gc-category-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
  .gc-category-card,.gc-collection-card{border:0;background:${p.surface};padding:0;overflow:hidden;text-align:left;cursor:pointer;border-radius:18px;box-shadow:0 14px 35px rgb(15 23 42/.08)}
  .gc-category-card img,.gc-collection-card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
  .gc-category-card span,.gc-collection-card span{display:block;padding:16px 18px;font-weight:750;color:${p.text}}
  .gc-categories--editorial .gc-category-grid,.gc-collections--editorial .gc-collections-grid{grid-template-columns:1.3fr .7fr .7fr}
  .gc-categories--magazine .gc-category-card:first-child,.gc-collections--magazine .gc-collection-card:first-child{grid-row:span 2}
  .gc-category-chips{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
  .gc-category-chips button{border:1px solid color-mix(in srgb, ${p.primary} 18%, transparent);background:${p.surface};color:${p.text};border-radius:999px;padding:12px 20px}
  .gc-category-minimal-list{display:grid;border-top:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}
  .gc-category-minimal-list button{display:flex;gap:28px;background:transparent;border:0;border-bottom:1px solid color-mix(in srgb, ${p.text} 10%, transparent);padding:22px 0;text-align:left;color:${p.text};font-size:1.05rem}

  .gc-featured{position:relative;overflow:hidden}
  .gc-featured-split__inner,.gc-about-split__inner,.gc-about-proof__inner{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
  .gc-featured-split__media img,.gc-about-split__media img,.gc-about-proof__media img{width:100%;min-height:360px;max-height:520px;object-fit:cover;border-radius:26px}
  .gc-featured--impact{min-height:520px;display:grid;align-items:center;color:#fff}
  .gc-featured-impact__bg,.gc-featured-impact__overlay{position:absolute;inset:0;width:100%;height:100%}
  .gc-featured-impact__bg{object-fit:cover}
  .gc-featured-impact__overlay{background:linear-gradient(90deg,rgb(0 0 0/.82),rgb(0 0 0/.12))}
  .gc-featured-impact__inner{position:relative;z-index:2;max-width:720px;margin-left:max(20px,calc((100vw - 1180px)/2))}
  .gc-featured--minimal{text-align:center}
  .gc-featured-minimal__inner{max-width:760px;margin:auto}

  .gc-benefits-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
  .gc-benefit-card{background:${p.surface};border:1px solid color-mix(in srgb, ${p.primary} 10%, transparent);padding:28px;border-radius:20px}
  .gc-benefit-card>span{color:${p.accent};font-weight:850}
  .gc-benefits--numbers .gc-benefits-numbers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:color-mix(in srgb, ${p.primary} 12%, transparent)}
  .gc-benefits--numbers article{background:${p.surface};padding:34px}
  .gc-benefits--numbers article>strong{font-size:2rem;color:${p.accent}}
  .gc-benefits-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-block:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}
  .gc-benefits-strip article{padding:24px;border-right:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}
  .gc-benefits-strip span{display:block;margin-top:6px;color:${p.mutedText}}
  .gc-benefits-editorial{display:grid;grid-template-columns:.85fr 1.15fr;gap:70px}
  .gc-benefits-editorial__list article{display:grid;grid-template-columns:52px 1fr;gap:18px;padding:22px 0;border-bottom:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}

  .gc-about--manifesto{text-align:center}
  .gc-about-manifesto{max-width:880px;margin:auto;padding-block:28px}
  .gc-about-manifesto h2{font-size:clamp(2.2rem,5vw,5rem)}
  .gc-about--minimal{text-align:center}
  .gc-about-minimal{max-width:780px;margin:auto}
  .gc-about--proof{background:color-mix(in srgb, ${p.primary} 5%, ${p.background})}

  .gc-gallery-strip{display:grid;grid-template-columns:repeat(5,1fr)}
  .gc-gallery-strip img{width:100%;height:280px;object-fit:cover}
  .gc-gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:230px;gap:14px}
  .gc-gallery-item{margin:0;overflow:hidden;border-radius:18px}
  .gc-gallery-item img{width:100%;height:100%;object-fit:cover;display:block}
  .gc-gallery-grid--editorial .gc-gallery-item:first-child{grid-column:span 2;grid-row:span 2}
  .gc-gallery-grid--masonry{grid-auto-flow:dense}
  .gc-gallery-grid--masonry .gc-gallery-item:nth-child(3n+1){grid-row:span 2}
  .gc-gallery-grid--minimal{grid-template-columns:repeat(3,1fr);gap:28px}

  .gc-social__inner,.gc-newsletter__inner,.gc-location__inner,.gc-contact__inner,.gc-final-cta__inner{display:flex;align-items:center;justify-content:space-between;gap:36px}
  .gc-social-links a{display:inline-flex;align-items:center;justify-content:center;border:1px solid color-mix(in srgb, ${p.primary} 18%, transparent);padding:10px 15px;border-radius:999px;color:inherit;text-decoration:none}
  .gc-social--conversion{background:${p.primary};color:#fff}
  .gc-social--gallery .gc-social-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:24px 0}
  .gc-social-gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px}
  .gc-social--minimal{border-block:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}

  .gc-video-frame{max-width:980px;margin:24px auto 0;border-radius:26px;overflow:hidden;background:#000;box-shadow:0 30px 70px rgb(0 0 0/.18)}
  .gc-video-frame video{display:block;width:100%;max-height:620px;background:#000}
  .gc-video--cinematic{background:${p.primary};color:#fff}
  .gc-video--minimal .gc-video-frame{max-width:760px;border-radius:0;box-shadow:none}

  .gc-how-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .gc-how-grid article{padding:28px;border-top:3px solid ${p.accent};background:${p.surface}}
  .gc-how-grid article>span{display:block;font-size:1.8rem;font-weight:900;color:${p.accent};margin-bottom:22px}
  .gc-how--conversion .gc-how-grid article{background:${p.primary};color:#fff}
  .gc-how--minimal .gc-how-grid article{background:transparent;border-top:1px solid ${p.text}}

  .gc-collections-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .gc-collections--magazine .gc-collection-card:first-child{grid-column:span 2}
  .gc-collections--minimal .gc-collection-card{box-shadow:none;border-radius:0;border-bottom:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}

  .gc-offers-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
  .gc-offer-card{background:${p.surface};border-radius:20px;overflow:hidden;box-shadow:0 16px 38px rgb(15 23 42/.08)}
  .gc-offer-card img{width:100%;aspect-ratio:4/3;object-fit:cover}
  .gc-offer-card>div{padding:18px}
  .gc-offer-card small{display:block;text-decoration:line-through;color:${p.mutedText}}
  .gc-offer-card strong{display:block;font-size:1.25rem;margin:4px 0 14px}
  .gc-offers--impact{background:${p.primary};color:#fff}

  .gc-testimonial-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .gc-testimonial-grid article{padding:28px;background:${p.surface};border-radius:20px;border:1px solid color-mix(in srgb, ${p.primary} 10%, transparent)}
  .gc-testimonial-grid article>span{color:${p.accent}}
  .gc-testimonial-editorial{max-width:880px;margin:auto;text-align:center}
  .gc-testimonial-editorial blockquote{font-family:Georgia,serif;font-size:clamp(1.8rem,4vw,3.5rem);line-height:1.15}
  .gc-testimonials--minimal blockquote{padding:20px 0;border-bottom:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}

  .gc-faq-split{display:grid;grid-template-columns:.8fr 1.2fr;gap:64px}
  .gc-faq-list details{border-bottom:1px solid color-mix(in srgb, ${p.text} 12%, transparent);padding:18px 0}
  .gc-faq-list summary{cursor:pointer;font-weight:800}
  .gc-faq-list p{color:${p.mutedText}}
  .gc-faq--conversion{background:${p.primary};color:#fff}
  .gc-faq--conversion .gc-faq-list p{color:rgb(255 255 255/.72)}

  .gc-contact--conversion,.gc-final-cta--impact{background:${p.primary};color:#fff}
  .gc-contact--card .gc-contact__inner,.gc-contact--editorial .gc-contact__inner{padding:42px;background:${p.surface};border-radius:26px;box-shadow:0 24px 60px rgb(15 23 42/.08)}
  .gc-contact--minimal .gc-contact__inner,.gc-final-cta--minimal .gc-final-cta__inner{display:block;max-width:760px;text-align:center;margin:auto}
  .gc-final-cta__inner{flex-direction:column;text-align:center;max-width:900px;margin:auto}
  .gc-final-cta h2{font-size:clamp(2rem,5vw,4.5rem);margin-bottom:10px}

  .gc-newsletter{background:color-mix(in srgb, ${p.accent} 10%, ${p.background})}
  .gc-newsletter--conversion{background:${p.accent};color:${p.primary}}
  .gc-newsletter--minimal{background:transparent;border-block:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}

  .gc-location{border-top:1px solid color-mix(in srgb, ${p.text} 10%, transparent)}
  .gc-location-link{display:inline-flex;padding:12px 18px;border:1px solid currentColor;border-radius:999px;color:inherit;text-decoration:none}
  .gc-location--contrast{background:${p.primary};color:#fff}

  .gc-footer{padding:56px 0 24px;background:${p.primary};color:#fff}
  .gc-footer a,.gc-footer button{color:inherit}
  .gc-footer-grid{display:grid;grid-template-columns:1.5fr repeat(4,1fr);gap:34px}
  .gc-footer-brand img{max-width:150px;max-height:60px;object-fit:contain;display:block;margin-bottom:14px}
  .gc-footer-brand strong{display:block;font-size:1.2rem;margin-bottom:8px}
  .gc-footer-brand p{color:rgb(255 255 255/.65)}
  .gc-footer-column{display:flex;flex-direction:column;gap:9px}
  .gc-footer-column>a,.gc-footer-column>button,.gc-footer-column>span{font-size:.9rem;text-decoration:none;background:none;border:0;padding:0;text-align:left;opacity:.78;cursor:pointer}
  .gc-footer-column>strong{margin-bottom:8px}
  .gc-footer-bottom{display:flex;justify-content:space-between;gap:20px;border-top:1px solid rgb(255 255 255/.14);padding-top:22px;margin-top:34px;font-size:.8rem;opacity:.7}
  .gc-footer--luxury{background:color-mix(in srgb, ${p.primary} 88%, #000);padding-top:72px}
  .gc-footer--ecommerce{background:${p.primary}}
  .gc-footer--service{background:#0b0b0f}
  .gc-footer--institutional{background:color-mix(in srgb, ${p.primary} 92%, #111)}
  .gc-footer--minimal{background:${p.surface};color:${p.text};border-top:1px solid color-mix(in srgb, ${p.text} 10%, transparent);padding:24px 0}
  .gc-footer-minimal__inner{display:flex;justify-content:space-between;align-items:center;gap:20px}
  .gc-footer-minimal__inner>div{display:flex;align-items:center;gap:10px}

  @media (max-width: 980px){
    .gc-header .gc-nav{display:none}
    .gc-header--overlay{position:relative;background:${p.primary}}
    .gc-category-grid,.gc-collections-grid,.gc-offers-grid,.gc-benefits-grid,.gc-benefits--numbers .gc-benefits-numbers,.gc-benefits-strip,.gc-testimonial-grid,.gc-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    .gc-featured-split__inner,.gc-about-split__inner,.gc-about-proof__inner,.gc-benefits-editorial,.gc-faq-split{grid-template-columns:1fr}
    .gc-gallery-grid{grid-template-columns:repeat(2,1fr)}
    .gc-how-grid{grid-template-columns:1fr}
    .gc-social__inner,.gc-newsletter__inner,.gc-location__inner,.gc-contact__inner{align-items:flex-start;flex-direction:column}
    .gc-social--gallery .gc-social-gallery{grid-template-columns:repeat(2,1fr)}
    .gc-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  }

  @media (max-width: 620px){
    .gc-category-grid,.gc-collections-grid,.gc-offers-grid,.gc-benefits-grid,.gc-benefits--numbers .gc-benefits-numbers,.gc-benefits-strip,.gc-testimonial-grid,.gc-footer-grid{grid-template-columns:1fr}
    .gc-gallery-strip{grid-template-columns:repeat(2,1fr)}
    .gc-gallery-strip img{height:200px}
    .gc-gallery-grid{grid-template-columns:1fr;grid-auto-rows:260px}
    .gc-gallery-grid--editorial .gc-gallery-item:first-child{grid-column:auto;grid-row:auto}
    .gc-header-tools{display:none}
    .gc-footer-minimal__inner,.gc-footer-bottom{flex-direction:column;align-items:flex-start}
  }
  `;
}