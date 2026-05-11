"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const Post_1 = require("../models/Post");
// Helpers de normalização
function upperOrUndefined(v) {
    if (v === null || v === undefined)
        return undefined;
    const s = String(v).trim();
    return s ? s.toUpperCase() : undefined;
}
function toInt(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function parsePostStatus(value) {
    const s = String(value ?? "").trim().toUpperCase();
    if (!s)
        return undefined;
    return Object.values(Post_1.PostStatus).includes(s)
        ? s
        : undefined;
}
class PostController {
    constructor(service) {
        this.service = service;
        this.list = async (req, res) => {
            console.log('kleber é aquiiiiiiiiii');
            try {
                const condominio_id = req.user?.condominio_id ?? req.params.condominio_id;
                if (!condominio_id) {
                    return res.status(400).json({ error: "CONDOMINIO_ID_OBRIGATORIO" });
                }
                const page = Math.max(1, toInt(req.query.page, 1));
                const pageSize = Math.min(50, Math.max(1, toInt(req.query.pageSize, 20)));
                const q = typeof req.query.q === "string" && req.query.q.trim()
                    ? req.query.q.trim()
                    : undefined;
                const categoria = upperOrUndefined(req.query.categoria);
                const status = upperOrUndefined(req.query.status);
                res.set("Cache-Control", "no-store");
                const params = {
                    condominio_id: condominio_id,
                    page,
                    pageSize,
                    ...(q ? { q } : {}),
                    ...(categoria ? { categoria: categoria } : {}),
                    ...(status ? { status: status } : {}),
                };
                console.log('posttttttttttt');
                const data = await this.service.list(params);
                return res.status(200).json(data);
            }
            catch (error) {
                console.error("❌ Erro List Posts:", error);
                return res.status(500).json({ error: "ERRO_INTERNO" });
            }
        };
        this.updateStatus = async (req, res) => {
            try {
                const { postId } = req.params;
                const statusRaw = req.body?.status;
                const usuarioId = req.user?.usuarioId ?? req.user?.usuarioId ?? req.body?.usuarioId;
                if (!postId) {
                    return res.status(400).json({ error: "POST_ID_OBRIGATORIO" });
                }
                if (!usuarioId) {
                    return res.status(401).json({ error: "NAO_AUTENTICADO" });
                }
                const status = parsePostStatus(statusRaw);
                if (!status) {
                    const vazio = statusRaw === undefined || statusRaw === null || String(statusRaw).trim() === "";
                    return res.status(400).json({
                        error: vazio ? "STATUS_OBRIGATORIO" : "STATUS_INVALIDO",
                        message: vazio
                            ? "Informe o status do post."
                            : `Status inválido: ${String(statusRaw)}`,
                        allowed: Object.values(Post_1.PostStatus),
                    });
                }
                const updated = await this.service.updateStatus(postId, usuarioId, status);
                return res.status(200).json(updated);
            }
            catch (error) {
                console.error("❌ Erro UpdateStatus:", error);
                return res.status(500).json({ error: "ERRO_INTERNO" });
            }
        };
        this.interesse = async (req, res) => {
            try {
                const { postId } = req.params;
                const usuarioId = req.user?.usuarioId ?? req.user?.usuarioId ?? req.body?.usuarioId;
                if (!postId) {
                    return res.status(400).json({ error: "POST_ID_OBRIGATORIO" });
                }
                if (!usuarioId) {
                    return res.status(401).json({ error: "NAO_AUTENTICADO" });
                }
                const mensagem = typeof req.body?.mensagem === "string" ? req.body.mensagem.trim() : undefined;
                const row = await this.service.createInteresse({
                    postId,
                    interessadoId: usuarioId,
                    mensagem,
                });
                return res.status(201).json(row);
            }
            catch (error) {
                console.error("❌ Erro Interesse:", error);
                return res.status(500).json({ error: "ERRO_INTERNO" });
            }
        };
    }
    async show(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json('O Id é obrigatório');
            const post = await this.service.findById(id);
            return res.json(post);
        }
        catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
    async create(req, res) {
        try {
            const { titulo, descricao, categoria, condominio_id, usuarioId, preco } = req.body;
            const files = req.files;
            // Gerar as URLs das mídias com base no que o multer salvou
            const midias = files?.map((f, index) => {
                // Importante: A URL deve ser acessível pelo navegador.
                // Se sua pasta estática no Express for "uploads", a URL ficaria algo assim:
                const subfolder = f.mimetype.startsWith('image/') ? 'images' : 'videos';
                const url = `/uploads/${subfolder}/${f.filename}`;
                return {
                    url,
                    ordem: index,
                    tipo: f.mimetype.startsWith('image/') ? 'image' : 'video'
                };
            }) || [];
            const post = await this.service.create({
                titulo,
                descricao,
                categoria,
                condominio_id,
                usuarioId,
                preco: preco ? Number(preco) : undefined,
                midias
            });
            return res.status(201).json(post);
        }
        catch (error) {
            console.error("Erro no Controller:", error);
            return res.status(400).json({ error: error.message });
        }
    }
    async listarPosts(req, res) {
        const { condominio_id } = req.params;
        const usuarioId = req.user?.usuarioId;
        if (!condominio_id || !usuarioId) {
            return res.status(400).json({ message: 'Dados incompletos' });
        }
        try {
            const posts = await this.service.listarPostsComStatusVisto(condominio_id, usuarioId);
            return res.json(posts);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao carregar posts' });
        }
    }
}
exports.PostController = PostController;
