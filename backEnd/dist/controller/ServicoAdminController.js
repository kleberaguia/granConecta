"use strict";
// src/controller/ServicoAdminController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const servicosService_1 = __importDefault(require("../services/servicosService")); // Ajuste o nome do arquivo se for 'servicosService'
class ServicoAdminController {
    // GET /admin/servicos
    async listar(req, res) {
        try {
            const { status, usuarioId, prestadorId, categoria_slug, dataInicio, dataFim, } = req.query;
            // Monta o objeto de filtros
            // Tipamos como 'any' ou definimos interface simples para não precisar importar Enum de outro arquivo
            const filtros = {};
            if (status) {
                filtros.status = String(status);
            }
            if (usuarioId) {
                filtros.usuarioId = String(usuarioId);
            }
            if (prestadorId) {
                filtros.prestadorId = String(prestadorId);
            }
            if (categoria_slug) {
                filtros.categoria_slug = String(categoria_slug);
            }
            if (dataInicio) {
                filtros.dataInicio = String(dataInicio);
            }
            if (dataFim) {
                filtros.dataFim = String(dataFim);
            }
            // Chama o método do service que criamos anteriormente
            const servicos = await servicosService_1.default.listarTodosServicosAdmin(filtros);
            return res.json(servicos);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao listar serviços (admin)" });
        }
    }
    // GET /admin/servicos/:id
    async detalhe(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: "Id é obrigatório" });
            }
            const servico = await servicosService_1.default.getServicoDetalheAdmin(id);
            if (!servico) {
                return res.status(404).json({ error: "Serviço não encontrado" });
            }
            return res.json(servico);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao buscar serviço (admin)" });
        }
    }
    async listarPrestadoresPendentes(req, res) {
        try {
            const prestadores = await servicosService_1.default.listarPrestadoresPendentes();
            return res.json(prestadores);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao listar prestadores" });
        }
    }
    // ✅ Buscar perfil completo de um prestador
    async buscarPrestador(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json("Id não fornecido");
            const prestador = await servicosService_1.default.buscarPrestadorPorId(id);
            if (!prestador) {
                return res.status(404).json({ error: "Prestador não encontrado" });
            }
            return res.json(prestador);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao buscar prestador" });
        }
    }
    // ✅ Aprovar prestador
    async aprovarPrestador(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json('Id não encontrado');
            const prestador = await servicosService_1.default.aprovarPrestador(id);
            return res.json({ message: "Prestador aprovado com sucesso", prestador });
        }
        catch (err) {
            console.error(err);
            if (err.message === "PRESTADOR_NAO_ENCONTRADO") {
                return res.status(404).json({ error: "Prestador não encontrado" });
            }
            return res.status(500).json({ error: "Erro ao aprovar prestador" });
        }
    }
    // ✅ Reprovar prestador (opcional)
    async reprovarPrestador(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json('Id não encontrado');
            const prestador = await servicosService_1.default.reprovarPrestador(id);
            return res.json({ message: "Prestador reprovado", prestador });
        }
        catch (err) {
            console.error(err);
            if (err.message === "PRESTADOR_NAO_ENCONTRADO") {
                return res.status(404).json({ error: "Prestador não encontrado" });
            }
            return res.status(500).json({ error: "Erro ao reprovar prestador" });
        }
    }
}
exports.default = new ServicoAdminController();
