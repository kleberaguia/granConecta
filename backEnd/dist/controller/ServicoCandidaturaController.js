"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ServicoCandidaturaService_1 = __importDefault(require("../services/ServicoCandidaturaService"));
class ServicoCandidaturaController {
    // ✅ NOVO: LISTAR CANDIDATURAS DO PRESTADOR LOGADO
    async listarMinhas(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            // Chama o Service seguindo o seu padrão
            const list = await ServicoCandidaturaService_1.default.listarMinhas(user.usuarioId);
            return res.json(list);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: err.message || 'Erro ao listar candidaturas' });
        }
    }
    // ✅ PRESTADOR SE CANDIDATA
    async candidatar(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const { solicitacaoId, mensagem, proposta_valor } = req.body;
            const saved = await ServicoCandidaturaService_1.default.candidatar({
                solicitacaoId,
                prestadorId: user.usuarioId,
                mensagem,
                proposta_valor,
            });
            return res.status(201).json(saved);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message || 'Erro' });
        }
    }
    // ✅ LISTAR CANDIDATURAS POR SOLICITAÇÃO (Visão do Morador)
    async listarPorSolicitacao(req, res) {
        try {
            const { solicitacaoId } = req.params;
            if (!solicitacaoId) {
                return res.status(400).json({ error: 'solicitacaoId é obrigatório' });
            }
            const list = await ServicoCandidaturaService_1.default.listarPorSolicitacao(solicitacaoId);
            return res.json(list);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao listar candidaturas' });
        }
    }
    // ✅ PRESTADOR RETIRA CANDIDATURA
    async retirar(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const { candidaturaId } = req.params;
            if (!candidaturaId) {
                return res.status(400).json({ error: 'candidaturaId é obrigatório' });
            }
            const updated = await ServicoCandidaturaService_1.default.retirarCandidatura(candidaturaId, user.usuarioId);
            return res.json(updated);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message || 'Erro' });
        }
    }
    // ✅ MORADOR OU PRESTADOR ENVIA PROPOSTA (NEGOCIAÇÃO)
    async enviarProposta(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const { candidaturaId, valor, mensagem } = req.body;
            if (!candidaturaId || !valor || !mensagem) {
                return res.status(400).json({
                    error: 'candidaturaId, valor e mensagem são obrigatórios'
                });
            }
            const result = await ServicoCandidaturaService_1.default.enviarProposta({
                candidaturaId,
                usuarioId: user.usuarioId,
                valor,
                mensagem
            });
            return res.json(result);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message });
        }
    }
    // ✅ ACEITAR A PROPOSTA
    async aceitarProposta(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const { candidaturaId } = req.body;
            if (!candidaturaId) {
                return res.status(400).json({ error: 'candidaturaId é obrigatório' });
            }
            const result = await ServicoCandidaturaService_1.default.aceitarProposta(candidaturaId, user.usuarioId);
            return res.json(result);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message });
        }
    }
    // ✅ RECUSAR A PROPOSTA
    async recusarProposta(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const { candidaturaId } = req.body;
            if (!candidaturaId) {
                return res.status(400).json({ error: 'candidaturaId é obrigatório' });
            }
            const result = await ServicoCandidaturaService_1.default.recusarProposta(candidaturaId, user.usuarioId);
            return res.json(result);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message });
        }
    }
}
exports.default = new ServicoCandidaturaController();
