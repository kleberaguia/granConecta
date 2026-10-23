import type { RenderContext } from "../renderTypes";
import { renderCategoriesByContext } from "./categories/CategoriesFactory";
export function renderCategories(context: RenderContext): string { return renderCategoriesByContext(context); }
