"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContent = void 0;
const wordFilter_1 = require("../utils/wordFilter");
const validateContent = (req, res, next) => {
    const { nome_profissional, descricao_bio, servicos_oferecidos } = req.body;
    // Verifica todos os campos de texto sensíveis
    const fieldsToVerify = [nome_profissional, descricao_bio, servicos_oferecidos];
    const hasInappropriateContent = fieldsToVerify.some(field => (0, wordFilter_1.containsBadWords)(field));
    if (hasInappropriateContent) {
        return res.status(400).json({
            error: "O conteúdo contém palavras não permitidas pela política da plataforma."
        });
    }
    next();
};
exports.validateContent = validateContent;
