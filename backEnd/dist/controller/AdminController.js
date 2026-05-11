"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// controllers/AdminController.js
const AdminService_1 = __importDefault(require("../services/AdminService"));
class AdminController {
    // --- Outros Métodos Existentes ---
    async listarPrestadoresParaAprovacao(req, res) {
        try {
            const prestadores = await AdminService_1.default.getPrestadoresParaAprovacao();
            return res.json(prestadores);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async confirmarPagamento(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json('Id é obrigatorio');
            const result = await AdminService_1.default.confirmarPagamento(id);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getStats(req, res) {
        try {
            const stats = await AdminService_1.default.getDashboardStats();
            return res.json(stats);
        }
        catch (error) {
            console.error("Erro no Controller Stats:", error);
            return res.status(500).json({ error: "Erro ao buscar estatísticas." });
        }
    }
    async getSubscriptions(req, res) {
        try {
            const assinaturas = await AdminService_1.default.getSubscriptionsList();
            return res.json(assinaturas);
        }
        catch (error) {
            console.error("Erro no Controller Assinaturas:", error);
            return res.status(500).json({ error: "Erro ao buscar assinaturas." });
        }
    }
    async getRefundRequests(req, res) {
        try {
            const requests = await AdminService_1.default.getPendingRefunds();
            return res.json(requests);
        }
        catch (error) {
            console.error("Erro ao buscar pedidos de reembolso:", error);
            return res.status(500).json({ error: "Erro ao buscar solicitações." });
        }
    }
    async processRefund(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        try {
            const result = await AdminService_1.default.updateRefundStatus(Number(id), status);
            return res.json(result);
        }
        catch (error) {
            console.error("Erro ao processar reembolso:", error);
            return res.status(400).json({ error: error.message });
        }
    }
    async confirmPayment(req, res) {
        try {
            console.log("Chegou aqui no confirmar");
            const { id } = req.params;
            if (!id)
                return res.status(400).json({ error: "ID do usuário é obrigatório." });
            const resultado = await AdminService_1.default.confirmarPagamento(id);
            return res.status(200).json(resultado);
        }
        catch (error) {
            console.error("ERRO NO CONTROLLER (confirmarPagamento):", error.message);
            if (error.message.includes("não encontrado"))
                return res.status(404).json({ error: error.message });
            return res.status(400).json({ error: error.message || "Erro ao processar confirmação de pagamento." });
        }
    }
    async aprovarEmpreendedor(req, res) {
        try {
            console.log('Chegou aquiiiiiiiiiiiiii');
            const { usuarioId } = req.params;
            const { status_conta } = req.body;
            if (!status_conta)
                return res.status(400).json({ error: 'O status é obrigatório' });
            if (!usuarioId)
                return res.status(400).json({ error: 'O Id é obrigatório' });
            const resultado = await AdminService_1.default.atualizarStatusUsuario(usuarioId, status_conta);
            return res.status(200).json(resultado);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new AdminController();
