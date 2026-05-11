"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHtmlBasic = sanitizeHtmlBasic;
function sanitizeHtmlBasic(html, opts) {
    if (!html)
        return "";
    const allowTailwindCdn = opts?.allowTailwindCdn ?? false;
    const allowScripts = opts?.allowScripts ?? false;
    let out = String(html);
    // remove <script> sempre (V1)
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, () => {
        return allowScripts ? "" : "";
    });
    // remove handlers on*
    out = out.replace(/\son\w+="[^"]*"/gi, "");
    out = out.replace(/\son\w+='[^']*'/gi, "");
    // bloqueia javascript:
    out = out.replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, `$1="#"`);
    // remove iframes/objects/embeds
    out = out.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "");
    out = out.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "");
    out = out.replace(/<embed[\s\S]*?>/gi, "");
    // opcional: remove qualquer tailwind CDN se aparecer (V1)
    if (!allowTailwindCdn) {
        out = out.replace(/<script\b[^>]*cdn\.tailwindcss\.com[^>]*>\s*<\/script>/gi, "");
        out = out.replace(/<script\b[^>]*cdn\.tailwindcss\.com[^>]*>\s*<\/script>/gi, "");
    }
    return out;
}
