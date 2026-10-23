import type { DesignDirection, MotionSystem } from "./DesignTokens";

export class MotionEngine {
  static resolve(direction: DesignDirection): MotionSystem {
    switch (direction) {
      case "cinematic-impact":
        return profile("cinematic", "medium", 30, 820, 95, true, true, true);
      case "commerce-dynamic":
        return profile("energetic", "medium", 24, 620, 70, true, false, true);
      case "luxury-editorial":
      case "editorial-story":
        return profile("editorial", "medium", 26, 760, 90, true, true, true);
      case "minimal-premium":
        return profile("subtle", "low", 18, 680, 85, true, false, true);
      default:
        return profile("subtle", "low", 20, 650, 80, false, false, true);
    }
  }
}

function profile(
  mood: MotionSystem["mood"],
  intensity: MotionSystem["intensity"],
  revealDistance: number,
  revealDuration: number,
  staggerMs: number,
  mediaBreath: boolean,
  parallax: boolean,
  hoverLift: boolean,
): MotionSystem {
  return {
    enabled: true,
    mood,
    intensity,
    revealDistance,
    revealDuration,
    staggerMs,
    mediaBreath,
    parallax,
    hoverLift,
  };
}

export function buildMotionRuntime(): string {
  return `<script>
(function(){
  try {
    var root=document.documentElement;
    if(!root || !document.body) return;
    root.classList.add('gc-motion-ready');
    var reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var selectors=[
      '.gc-section-heading',
      '.gc-hero .gc-kicker',
      '.gc-hero h1',
      '.gc-hero .gc-hero-supporting',
      '.gc-hero .gc-actions',
      '.gc-hero-trust',
      '.gc-category-card',
      '.gc-collection-card',
      '.gc-offer-card',
      '.gc-benefit-card',
      '.gc-testimonial-grid article',
      '.gc-how-grid article',
      '.gc-product-card',
      '.gc-service-card',
      '.gc-gallery-item',
      '.gc-footer-column'
    ];
    var nodes=[];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(nodes.indexOf(el)<0) nodes.push(el);
      });
    });
    nodes.forEach(function(el,index){
      el.classList.add('gc-reveal');
      el.style.setProperty('--gc-reveal-index', String(index % 6));
    });
    if(reduce || !('IntersectionObserver' in window)){
      nodes.forEach(function(el){el.classList.add('is-visible');});
      return;
    }
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    nodes.forEach(function(el){observer.observe(el);});
  } catch(e) {}
})();
</script>`;
}
