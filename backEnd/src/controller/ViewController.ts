import { Request, Response } from "express";
import { ViewService } from "../services/ViewService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export class ViewController {
  constructor(private service: ViewService) { }

  // GET /api/home/contador-nao-vistos
  contadorNaoVistos = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) return res.status(401).json({ error: "NAO_AUTENTICADO" });

    const data = await this.service.contarNaoVistos(
      authReq.user.condominio_id,
      authReq.user.id
    );

    return res.json(data);
  };

  // GET /api/home/nao-vistos?limit=8
  naoVistos = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) return res.status(401).json({ error: "NAO_AUTENTICADO" });

    const limit = Number(req.query.limit ?? 8);

    const data = await this.service.listarNaoVistos(
      authReq.user.condominio_id,
      authReq.user.id,
      limit
    );

    return res.json(data);
  };

  // POST /api/avisos/:id/visto
  marcarAvisoVisto = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) return res.status(401).json({ error: "NAO_AUTENTICADO" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "AVISO_ID_OBRIGATORIO" });

    const row = await this.service.marcarAvisoVisto(String(id), authReq.user.id);
    return res.status(201).json(row);
  };

  // POST /api/posts/:id/visto
  marcarPostVisto = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) return res.status(401).json({ error: "NAO_AUTENTICADO" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "POST_ID_OBRIGATORIO" });

    const row = await this.service.marcarPostVisto(String(id), authReq.user.id);
    return res.status(201).json(row);
  };


}
