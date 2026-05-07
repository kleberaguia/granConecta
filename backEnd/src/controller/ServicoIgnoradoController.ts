import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { ServicoIgnorado } from "../models/ServicoIgnoradoModels";

export const ServicoIgnoradoController = {
    async ignorar(req: Request, res: Response) {
        try {
            const { solicitacaoId } = req.body;
            const prestadorId = (req as any).user?.usuarioId;// Pegando do token via seu middleware de auth

            const repo = AppDataSource.getRepository(ServicoIgnorado);
            if (!prestadorId) {
                return res.status(401).json({ error: "Usuário não autenticado" });
            }
            // Evita duplicados
            const jaExiste = await repo.findOneBy({ prestadorId, solicitacaoId });
            if (jaExiste) {
                return res.json({ message: "Já ignorado" });
            }

            const novo = repo.create({
                prestadorId,
                solicitacaoId
            });

            await repo.save(novo);

            return res.status(201).json({ message: "Oportunidade ocultada com sucesso" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao ignorar serviço" });
        }
    }
};