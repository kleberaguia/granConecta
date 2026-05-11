"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsBadWords = void 0;
const listaNegra = [
    'palavrao1', 'ofensa2', 'scam', 'fraude', 'nudez',
    // Adicione aqui as palavras que deseja bloquear
];
const containsBadWords = (text) => {
    if (!text)
        return false;
    // Normaliza o texto: remove acentos e deixa em minúsculo
    const normalizedText = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    return listaNegra.some(word => normalizedText.includes(word));
};
exports.containsBadWords = containsBadWords;
