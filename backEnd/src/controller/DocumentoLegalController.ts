import { Request, Response } from "express";
import { DocumentoLegalService } from "../services/DocumentoLegalService";

const service = new DocumentoLegalService();

export class DocumentoLegalController {
    async listar(req: Request, res: Response) {
        try {
            const docs = await service.listarAtivos();
            return res.json(docs);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async visualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    error: "ID do documento não informado.",
                });
            }

            const doc = await service.buscarPorId(id);

            return res.json(doc);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    }

    async aceitar(req: Request, res: Response) {
        try {
            const { email, usuarioId, tipo_usuario, documentosIds } = req.body;

            const aceites = await service.registrarAceites({
                email,
                usuarioId,
                tipo_usuario,
                documentosIds,

                ip:
                    req.headers["x-forwarded-for"]?.toString() ||
                    req.socket.remoteAddress ||
                    req.ip,

                userAgent:
                    req.headers["user-agent"] || "",
            });

            return res.status(201).json({
                message: "Aceite registrado com sucesso.",
                aceites,
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}