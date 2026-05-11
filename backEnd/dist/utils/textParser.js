"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStyledText = void 0;
const parseStyledText = (text, highlightColor) => {
    if (!text)
        return "";
    return text
        // *texto* => destaque
        .replace(/\*(.*?)\*/g, `<span style="color:${highlightColor}" class="font-bold">$1</span>`)
        // _texto_ => itálico
        .replace(/\_(.*?)\_/g, `<span class="italic">$1</span>`)
        // ~texto~ => sublinhado
        .replace(/\~(.*?)\~/g, `<span class="underline">$1</span>`);
};
exports.parseStyledText = parseStyledText;
