"use strict";
// src/presets/DesignStrategies.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignStrategies = void 0;
exports.DesignStrategies = {
    luxury: {
        label: "Luxo e Exclusividade",
        fonts: ["'Playfair Display'", "'Cormorant Garamond'"],
        colors: { primary: "#D4AF37", bg: "#000000", text: "#FFFFFF" },
        borderStyle: "0px", // Bordas retas passam sofisticação
        forbiddenVariants: ["grid-3", "drawer-left", "zigzag"], // Evita layouts comuns
        defaultImg: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600",
        promptScale: "Estética de boutique francesa. Espaçamentos generosos, bordas retas, tons dourados e pretos. Foco em fotografia artística e minimalismo."
    },
    industrial: {
        label: "Industrial e Engenharia",
        fonts: ["'Plus Jakarta Sans'", "'Inter'"],
        colors: { primary: "#F16622", bg: "#FFFFFF", text: "#0A1F3A" },
        borderStyle: "4px", // Bordas técnicas
        forbiddenVariants: ["boutique-split", "video-bg"],
        defaultImg: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1600",
        promptScale: "Estética técnica e robusta. Use Azul Petróleo para autoridade e Laranja Vibrante para ação. Use o layout Bento Grid se possível."
    },
    health: {
        label: "Saúde e Bem-estar",
        fonts: ["'Outfit'", "'Inter'"],
        colors: { primary: "#0D9488", bg: "#F0FDFA", text: "#134E4A" },
        borderStyle: "24px", // Bordas bem arredondadas para suavidade
        forbiddenVariants: ["dark-glow", "industrial-grid"],
        defaultImg: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1600",
        promptScale: "Estética clean e acolhedora. Use tons pastéis, verde menta ou azul claro. Bordas muito arredondadas para passar confiança e calma."
    },
    tech: {
        label: "Tecnologia e SaaS",
        fonts: ["'Inter'", "'JetBrains Mono'"],
        colors: { primary: "#2563EB", bg: "#020617", text: "#F8FAFC" },
        borderStyle: "12px", // Bordas modernas
        forbiddenVariants: ["simple-centered", "list-with-icons"],
        defaultImg: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600",
        promptScale: "Estética futurista. Use Mesh Gradients, Dark Mode, bordas com brilho (glow) e tipografia moderna e nítida."
    },
    // Estratégia de fallback para garantir que o código nunca encontre undefined
    default: {
        label: "Profissional",
        fonts: ["'Inter'"],
        colors: { primary: "#2563eb", bg: "#ffffff", text: "#1f2937" },
        borderStyle: "8px",
        forbiddenVariants: [],
        defaultImg: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80",
        promptScale: "Design profissional, limpo e equilibrado."
    }
};
