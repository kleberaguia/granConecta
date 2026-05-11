"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EncomendaService_1 = require("../services/EncomendaService");
class EncomendaController {
    // 🟢 Trocamos Request por AuthRequest aqui
    async getMeusPacotes(req, res) {
        const service = new EncomendaService_1.EncomendaService();
        if (!req.user) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        // Agora o erro TS2339 desaparece!
        const { condominio_id, usuarioId } = req.user;
        try {
            const encomendas = await service.listByMorador(usuarioId, condominio_id);
            return res.json(encomendas);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    async store(req, res) {
        const service = new EncomendaService_1.EncomendaService();
        if (!req.user || !req.user.condominio_id) {
            return res.status(401).json({ message: "Dados de condomínio não encontrados." });
        }
        const { codigoRastreio, transportadora, morador_id, descricao } = req.body;
        try {
            const encomenda = await service.create({
                codigoRastreio,
                transportadora,
                morador_id,
                descricao,
                porteiro_id: req.user.usuarioId,
                condominio_id: req.user.condominio_id
            });
            return res.status(201).json(encomenda);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    async darBaixa(req, res) {
        const service = new EncomendaService_1.EncomendaService();
        const { id } = req.params;
        const { quemRetirou } = req.body;
        if (!id)
            return res.status(400).json({ message: 'Id não encontrado' });
        try {
            const atualizado = await service.registrarRetirada(id, quemRetirou);
            return res.json(atualizado);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
exports.default = new EncomendaController();
