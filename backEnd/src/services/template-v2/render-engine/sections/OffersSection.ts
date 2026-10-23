import type { RenderContext } from "../renderTypes";
import { renderOffersByContext } from "./offers/OffersFactory";
export function renderOffers(context: RenderContext): string { return renderOffersByContext(context); }
