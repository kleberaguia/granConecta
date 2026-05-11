"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NotificationService_1 = require("../services/NotificationService");
const data_source_1 = require("../config/data-source");
const NotificationModel_1 = require("../models/NotificationModel");
// REMOVIDO: import { AuthenticatedRequest } ...
const notificacaoRepo = data_source_1.AppDataSource.getRepository(NotificationModel_1.Notificacao);
class NotificationController {
    // -------------------------
    // ENVIA NOTIFICAÇÃO
    // -------------------------
    async enviar(req, res) {
        try {
            // Usamos (req as any) para garantir que o TS não reclame do .user
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const { usuarioId, titulo, mensagem } = req.body; // ID do destino
            if (!usuarioId || !titulo || !mensagem) {
                return res.status(400).json({ error: "Dados incompletos" });
            }
            const notif = await NotificationService_1.NotificationService.enviar(usuarioId, titulo, mensagem);
            return res.status(201).json(notif);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao enviar notificação" });
        }
    }
    // -------------------------
    // LISTA NOTIFICAÇÕES DO USUÁRIO
    // -------------------------
    async listar(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const lista = await NotificationService_1.NotificationService.listar(user.usuarioId);
            return res.json(lista);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao carregar notificações" });
        }
    }
    // -------------------------
    // MARCAR NOTIFICAÇÃO COMO LIDA
    // -------------------------
    async marcarComoLida(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const notif = await notificacaoRepo.findOne({
                where: { id, usuarioId: user.usuarioId }
            });
            if (!notif) {
                return res.status(404).json({ error: "Notificação não encontrada" });
            }
            notif.lido = true;
            await notificacaoRepo.save(notif);
            return res.json({ sucesso: true });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao atualizar notificação" });
        }
    }
    // -------------------------
    // MARCAR TODAS COMO LIDAS
    // -------------------------
    async marcarTodas(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            await notificacaoRepo.update({ usuarioId: user.usuarioId, lido: false }, { lido: true });
            return res.json({ sucesso: true });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao marcar todas como lidas" });
        }
    }
    // -------------------------
    // EXCLUIR
    // -------------------------
    async excluir(req, res) {
        try {
            const user = req.user;
            if (!user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const notif = await notificacaoRepo.findOne({
                where: { id, usuarioId: user.usuarioId }
            });
            if (!notif) {
                return res.status(404).json({ error: "Notificação não encontrada" });
            }
            await notificacaoRepo.delete(id);
            return res.json({ sucesso: true });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao excluir notificação" });
        }
    }
}
exports.default = new NotificationController();
