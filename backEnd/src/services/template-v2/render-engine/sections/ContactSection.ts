import type { RenderContext } from "../renderTypes";
import { renderContactByContext } from "./contact/ContactFactory";
export function renderContact(context: RenderContext): string { return renderContactByContext(context); }
