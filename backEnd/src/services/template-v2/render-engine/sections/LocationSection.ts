import type { RenderContext } from "../renderTypes";
import { renderLocationByContext } from "./location/LocationFactory";
export function renderLocation(context: RenderContext): string { return renderLocationByContext(context); }
