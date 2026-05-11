"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ServicoOfertaService_1 = __importDefault(require("../services/ServicoOfertaService"));
class ServicoOfertaController {
    async criarPorCandidatura(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId)
                return res.status(401).json({ error: 'Não autenticado' });
            const { candidaturaId, valor_negociado } = req.body;
            const oferta = await ServicoOfertaService_1.default.criarOfertaPorCandidatura(candidaturaId, user.usuarioId, valor_negociado);
            return res.status(201).json(oferta);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message || 'Erro' });
        }
    }
    async aceitar(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId)
                return res.status(401).json({ error: 'Não autenticado' });
            const { ofertaId } = req.params;
            if (!ofertaId)
                return res.status(400).json({ error: 'ofertaId obrigatório' });
            const oferta = await ServicoOfertaService_1.default.aceitarOferta(ofertaId, user.usuarioId);
            return res.json(oferta);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message || 'Erro' });
        }
    }
    async iniciar(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId)
                return res.status(401).json({ error: 'Não autenticado' });
            const { ofertaId } = req.params;
            if (!ofertaId)
                return res.status(400).json({ error: 'ofertaId obrigatório' });
            const oferta = await ServicoOfertaService_1.default.marcarEmAndamento(ofertaId, user.usuarioId);
            return res.json(oferta);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message || 'Erro' });
        }
    }
    async concluir(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId)
                return res.status(401).json({ error: 'Não autenticado' });
            const { ofertaId } = req.params;
            if (!ofertaId)
                return res.status(400).json({ error: 'ofertaId obrigatório' });
            const resultado = await ServicoOfertaService_1.default.concluirOferta(ofertaId, user.usuarioId);
            return res.json(resultado);
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ error: err.message || 'Erro' });
        }
    }
    async listarPorPrestador(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId)
                return res.status(401).json({ error: 'Não autenticado' });
            const list = await ServicoOfertaService_1.default.listarPorPrestador(user.usuarioId);
            return res.json(list);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro' });
        }
    }
    async listarMinhasOfertas(req, res) {
        try {
            const user = req.user;
            // No seu padrão, o ID do prestador vem de user.usuarioId
            if (!user?.usuarioId)
                return res.status(401).json({ error: 'Não autenticado' });
            // Chamamos o novo método do Service que faz o INNER JOIN
            const list = await ServicoOfertaService_1.default.listarMinhasOfertas(user.usuarioId);
            return res.json(list);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao listar ofertas detalhadas' });
        }
    }
}
exports.default = new ServicoOfertaController();
