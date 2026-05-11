"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewController = void 0;
class ViewController {
    constructor(service) {
        this.service = service;
        // GET /api/home/contador-nao-vistos
        this.contadorNaoVistos = async (req, res) => {
            const authReq = req;
            if (!authReq.user)
                return res.status(401).json({ error: "NAO_AUTENTICADO" });
            const data = await this.service.contarNaoVistos(authReq.user.condominio_id, authReq.user.id);
            return res.json(data);
        };
        // GET /api/home/nao-vistos?limit=8
        this.naoVistos = async (req, res) => {
            const authReq = req;
            if (!authReq.user)
                return res.status(401).json({ error: "NAO_AUTENTICADO" });
            const limit = Number(req.query.limit ?? 8);
            const data = await this.service.listarNaoVistos(authReq.user.condominio_id, authReq.user.id, limit);
            return res.json(data);
        };
        // POST /api/avisos/:id/visto
        this.marcarAvisoVisto = async (req, res) => {
            const authReq = req;
            if (!authReq.user)
                return res.status(401).json({ error: "NAO_AUTENTICADO" });
            const { id } = req.params;
            if (!id)
                return res.status(400).json({ error: "AVISO_ID_OBRIGATORIO" });
            const row = await this.service.marcarAvisoVisto(String(id), authReq.user.id);
            return res.status(201).json(row);
        };
        // POST /api/posts/:id/visto
        this.marcarPostVisto = async (req, res) => {
            const authReq = req;
            if (!authReq.user)
                return res.status(401).json({ error: "NAO_AUTENTICADO" });
            const { id } = req.params;
            if (!id)
                return res.status(400).json({ error: "POST_ID_OBRIGATORIO" });
            const row = await this.service.marcarPostVisto(String(id), authReq.user.id);
            return res.status(201).json(row);
        };
    }
}
exports.ViewController = ViewController;
