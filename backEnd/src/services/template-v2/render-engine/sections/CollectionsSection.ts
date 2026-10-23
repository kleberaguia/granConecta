import type { RenderContext } from "../renderTypes";
import { renderCollectionsByContext } from "./collections/CollectionsFactory";
export function renderCollections(context: RenderContext): string { return renderCollectionsByContext(context); }
