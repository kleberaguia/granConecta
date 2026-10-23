// controllers/AdminController.js
import AdminService from '../services/AdminService';
import GranConectaDemandRadarAdminService from '../services/chat/GranConectaDemandRadarAdminService';
import { Request, Response } from "express";

class AdminController {

    async atualizarOportunidadeRadar(req: Request, res: Response) {
        try {
            const categoriaId = Number(req.body?.categoriaId);
            const chaveRegiao = String(req.body?.chaveRegiao || "").trim();
            const status = String(req.body?.status || "");
            if (!["NOVO", "EM_CAPTACAO", "RESOLVIDO", "DESCARTADO"].includes(status)) {
                return res.status(400).json({ error: "Status inválido." });
            }
            const adminId = (req as any).user?.usuarioId || (req as any).user?.id || null;
            const result = await GranConectaDemandRadarAdminService.updateOpportunity({
                categoriaId, chaveRegiao,
                status: status as "NOVO" | "EM_CAPTACAO" | "RESOLVIDO" | "DESCARTADO",
                observacao: String(req.body?.observacao || ""), adminId,
            });
            return res.json(result);
        } catch (error: any) {
            console.error("[RADAR ADMIN] Falha ao atualizar oportunidade:", error);
            return res.status(400).json({ error: error?.message || "Erro ao atualizar oportunidade." });
        }
    }

    async getRadarDemanda(_req: Request, res: Response) {
        try {
            const data = await GranConectaDemandRadarAdminService.getOverview();
            return res.json(data);
        } catch (error) {
            console.error("[ADMIN RADAR] Erro ao carregar relatório:", error);
            return res.status(500).json({ error: "Erro ao carregar Radar de Demanda." });
        }
    }


    // Radar: vínculos comerciais de profissionais, acessíveis apenas pelas rotas de Admin.
    async listarProfissionaisRadar(req: Request, res: Response) {
        try {
            const alertaId = String(req.params.alertaId || "");
            const result = await GranConectaDemandRadarAdminService.listOpportunityProfessionals(alertaId);
            return res.json(result);
        } catch (error: any) {
            console.error("[RADAR ADMIN] Erro ao listar profissionais:", error);
            return res.status(400).json({ error: error?.message || "Erro ao listar profissionais." });
        }
    }

    async vincularProfissionalRadar(req: Request, res: Response) {
        try {
            const alertaId = String(req.params.alertaId || "");
            const result = await GranConectaDemandRadarAdminService.addOpportunityProfessional({
                alertaId,
                prestadorId: req.body?.prestadorId,
                nomeExterno: req.body?.nomeExterno,
                observacao: req.body?.observacao,
            });
            return res.status(201).json(result);
        } catch (error: any) {
            console.error("[RADAR ADMIN] Erro ao vincular profissional:", error);
            return res.status(400).json({ error: error?.message || "Erro ao vincular profissional." });
        }
    }

    async atualizarProfissionalRadar(req: Request, res: Response) {
        try {
            const vinculoId = String(req.params.vinculoId || "");
            const status = String(req.body?.status || "");
            const validos = ["PROSPECTADO", "CONTATADO", "INTERESSADO", "CADASTRADO", "DESCARTADO"] as const;
            if (!validos.includes(status as typeof validos[number])) {
                return res.status(400).json({ error: "Status de profissional inválido." });
            }
            const result = await GranConectaDemandRadarAdminService.updateOpportunityProfessional({
                vinculoId,
                status: status as typeof validos[number],
                observacao: req.body?.observacao,
            });
            return res.json(result);
        } catch (error: any) {
            console.error("[RADAR ADMIN] Erro ao atualizar profissional:", error);
            return res.status(400).json({ error: error?.message || "Erro ao atualizar profissional." });
        }
    }

      // Associa um profissional externo prospectado ao cadastro real, sem criar outro vínculo.
    async associarCadastroProfissionalRadar(req: Request, res: Response) {
        try {
            const vinculoId = String(req.params.vinculoId || "");
            const prestadorId = String(req.body?.prestadorId || "");
            const result = await GranConectaDemandRadarAdminService.associateExternalProfessional({
                vinculoId,
                prestadorId,
            });
            return res.json(result);
        } catch (error: any) {
            console.error("[RADAR ADMIN] Erro ao associar cadastro do profissional:", error);
            return res.status(400).json({ error: error?.message || "Erro ao associar cadastro." });
        }
    }

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