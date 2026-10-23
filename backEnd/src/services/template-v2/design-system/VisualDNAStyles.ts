import type { RenderContext } from "../render-engine/renderTypes";
import type { VisualDNA } from "./VisualDNAEngine";

export function buildVisualDNACss(_context: RenderContext, dna: VisualDNA): string {
  return `
  body{
    --gc-dna-radius:${dna.radiusStyle === "sharp" ? "2px" : dna.radiusStyle === "pill" ? "999px" : "24px"};
  }

  .gc-art-headline{margin:0;max-width:13ch;line-height:.88;letter-spacing:-.055em;text-wrap:balance}
  .gc-art-headline__line{display:block}
  .gc-art-headline__word{display:inline-block}
  .gc-art-headline__word.is-emphasis{font-size:1.14em;color:var(--gc-accent, currentColor)}
  .gc-art-headline__word.is-italic{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:500}

  .gc-art-headline--editorial-break,
  .gc-art-headline--quiet-luxury{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500}

  .gc-art-headline--mixed-scale .gc-art-headline__line:nth-child(2){margin-left:.65em}
  .gc-art-headline--mixed-scale .gc-art-headline__line:nth-child(2) .is-emphasis{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic}
  .gc-art-headline--accent-word .is-emphasis{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:500}
  .gc-art-headline--cinematic-stack{text-transform:uppercase;font-family:Montserrat,Inter,sans-serif;font-weight:850;line-height:.9}
  .gc-art-headline--commerce-bold{font-family:Montserrat,Inter,sans-serif;font-weight:900;line-height:.92}

  body[data-gc-visual-dna="${dna.archetype}"] .gc-section img{
    border-radius:${dna.radiusStyle === "sharp" ? "0" : dna.radiusStyle === "pill" ? "32px" : "20px"};
  }

  body[data-gc-dna-decoration="oversized-type"] .gc-hero::before{
    content:"${dna.archetype === "sacred-minimal" ? "✦" : "01"}";
    position:absolute;z-index:0;left:4vw;top:8%;font-family:"Cormorant Garamond",Georgia,serif;
    font-size:clamp(5rem,13vw,13rem);line-height:1;color:currentColor;opacity:.055;pointer-events:none
  }

  body[data-gc-dna-decoration="fine-lines"] .gc-hero::after{
    content:"";position:absolute;inset:7% 4%;border:1px solid currentColor;opacity:.09;pointer-events:none
  }

  body[data-gc-dna-decoration="soft-orbs"] .gc-hero::after{
    content:"";position:absolute;width:38vw;height:38vw;right:-12vw;top:-16vw;border-radius:50%;
    background:currentColor;opacity:.045;filter:blur(2px);pointer-events:none
  }

  @media (max-width: 760px){
    .gc-art-headline{max-width:100%;line-height:.95;letter-spacing:-.04em}
    .gc-art-headline--mixed-scale .gc-art-headline__line:nth-child(2){margin-left:0}
  }
  `;
}
