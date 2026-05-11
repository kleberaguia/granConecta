"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = void 0;
// config/planLimits.ts
exports.PLAN_LIMITS = {
    BASICO: {
        maxProducts: 3,
        layoutType: 'READY_ONLY', // Layout fixo, só muda texto
        canChangeImages: false
    },
    INTERMEDIARIO: {
        maxProducts: 10,
        layoutType: 'SEMI_CUSTOM', // Pode trocar imagens e cores básicas
        canChangeImages: true
    },
    PREMIUM: {
        maxProducts: 1000, // Praticamente ilimitado
        layoutType: 'MODERN_FULL', // Landing pages modernas e liberdade total
        canChangeImages: true
    }
};
