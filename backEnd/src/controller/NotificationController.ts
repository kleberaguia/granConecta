    // src/controllers/NotificationController.ts
    import { Request, Response } from "express"; // <--- Use Request do Express
    import { NotificationService } from "../services/NotificationService";
    import { AppDataSource } from "../config/data-source";
    import { Notificacao } from "../models/NotificationModel";

    // REMOVIDO: import { AuthenticatedRequest } ...

    const notificacaoRepo = AppDataSource.getRepository(Notificacao);

    class NotificationController {

        // -------------------------
        // ENVIA NOTIFICAÇÃO
        // -------------------------
        async enviar(req: Request, res: Response) {
            try {
                // Usamos (req as any) para garantir que o TS não reclame do .user
                const user = (req as any).user;

                if (!user?.usuarioId) {
                    return res.status(401).json({ error: "Não autenticado" });
                }

                const { usuarioId, titulo, mensagem } = req.body; // ID do destino

                if (!usuarioId || !titulo || !mensagem) {
                    return res.status(400).json({ error: "Dados incompletos" });
                }

                const notif = await NotificationService.enviar(usuarioId, titulo, mensagem);

                return res.status(201).json(notif);

            } catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Erro ao enviar notificação" });
            }
        }

        // -------------------------
        // LISTA NOTIFICAÇÕES DO USUÁRIO
        // -------------------------
        async listar(req: Request, res: Response) {
            try {
                const user = (req as any).user;

                if (!user?.usuarioId) {
                    return res.status(401).json({ error: "Não autenticado" });
                }

                const lista = await NotificationService.listar(user.usuarioId);
                return res.json(lista);

            } catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Erro ao carregar notificações" });
            }
        }

        // -------------------------
        // MARCAR NOTIFICAÇÃO COMO LIDA
        // -------------------------
        async marcarComoLida(req: Request, res: Response) {
            try {
                const user = (req as any).user;

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

            } catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Erro ao atualizar notificação" });
            }
        }

        // -------------------------
        // MARCAR TODAS COMO LIDAS
        // -------------------------
        async marcarTodas(req: Request, res: Response) {
            try {
                const user = (req as any).user;

                if (!user?.usuarioId) {
                    return res.status(401).json({ error: "Não autenticado" });
                }

                await notificacaoRepo.update(
                    { usuarioId: user.usuarioId, lido: false },
                    { lido: true }
                );

                return res.json({ sucesso: true });

            } catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Erro ao marcar todas como lidas" });
            }
        }

        // -------------------------
        // EXCLUIR
        // -------------------------
        async excluir(req: Request, res: Response) {
            try {
                const user = (req as any).user;

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

            } catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Erro ao excluir notificação" });
            }
        }
    }

    export default new NotificationController();