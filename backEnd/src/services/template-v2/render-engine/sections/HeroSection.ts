import type { RenderContext } from "../renderTypes";
import { renderHeroByContext } from "./hero/HeroFactory";

export function renderHero(context: RenderContext): string {
  return renderHeroByContext(context);
}