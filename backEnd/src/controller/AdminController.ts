// controllers/AdminController.js
import AdminService from '../services/AdminService';
import { Request, Response } from "express";

class AdminController {
      // --- Outros Métodos Existentes ---

    async listarPrestadoresParaAprovacao(req: Request, res: Response) {
        try {
            const prestadores = await AdminService.getPrestadoresParaAprovacao();
            return res.json(prestadores);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async confirmarPagamento(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json('Id é obrigatorio')
            const result = await AdminService.confirmarPagamento(id);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getStats(req: Request, res: Response) {
        try {
            const stats = await AdminService.getDashboardStats();
            return res.json(stats);
        } catch (error) {
            console.error("Erro no Controller Stats:", error);
            return res.status(500).json({ error: "Erro ao buscar estatísticas." });
        }
    }

    async getSubscriptions(req: Request, res: Response) {
        try {
            const assinaturas = await AdminService.getSubscriptionsList();
            return res.json(assinaturas);
        } catch (error) {
            console.error("Erro no Controller Assinaturas:", error);
            return res.status(500).json({ error: "Erro ao buscar assinaturas." });
        }
    }

    async getRefundRequests(req: Request, res: Response) {
        try {
            const requests = await AdminService.getPendingRefunds();
            return res.json(requests);
        } catch (error) {
            console.error("Erro ao buscar pedidos de reembolso:", error);
            return res.status(500).json({ error: "Erro ao buscar solicitações." });
        }
    }

    async processRefund(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;
        try {
            const result = await AdminService.updateRefundStatus(Number(id), status);
            return res.json(result);
        } catch (error: any) {
            console.error("Erro ao processar reembolso:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    async confirmPayment(req: Request, res: Response) {
        try {
            console.log("Chegou aqui no confirmar")
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: "ID do usuário é obrigatório." });
            const resultado = await AdminService.confirmarPagamento(id);
            return res.status(200).json(resultado);
        } catch (error: any) {
            console.error("ERRO NO CONTROLLER (confirmarPagamento):", error.message);
            if (error.message.includes("não encontrado")) return res.status(404).json({ error: error.message });
            return res.status(400).json({ error: error.message || "Erro ao processar confirmação de pagamento." });
        }
    }

    async aprovarEmpreendedor(req: Request, res: Response) {
        try {
            console.log('Chegou aquiiiiiiiiiiiiii')

            const { usuarioId } = req.params;
            const { status_conta } = req.body;
            if (!status_conta) return res.status(400).json({ error: 'O status é obrigatório' });
            if (!usuarioId) return res.status(400).json({ error: 'O Id é obrigatório' });
            const resultado = await AdminService.atualizarStatusUsuario(usuarioId, status_conta);
            return res.status(200).json(resultado);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new AdminController();