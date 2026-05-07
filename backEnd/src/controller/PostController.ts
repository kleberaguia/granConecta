import { Request, Response } from "express";
import { PostService } from "../services/PostService";
import { PostStatus } from "../models/Post";

// Helpers de normalização
function upperOrUndefined(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s ? s.toUpperCase() : undefined;
}

function toInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parsePostStatus(value: unknown): PostStatus | undefined {
  const s = String(value ?? "").trim().toUpperCase();
  if (!s) return undefined;

  return (Object.values(PostStatus) as string[]).includes(s)
    ? (s as PostStatus)
    : undefined;
}

export class PostController {
  constructor(private service: PostService) { }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json('O Id é obrigatório')
      const post = await this.service.findById(id);
      return res.json(post);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { titulo, descricao, categoria, condominio_id, usuarioId, preco } = req.body;
      const files = req.files as Express.Multer.File[];

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
    } catch (error: any) {
      console.error("Erro no Controller:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  list = async (req: Request, res: Response) => {

    console.log('kleber é aquiiiiiiiiii')
    try {
      const condominio_id = req.user?.condominio_id ?? req.params.condominio_id;
      if (!condominio_id) {
        return res.status(400).json({ error: "CONDOMINIO_ID_OBRIGATORIO" });
      }

      const page = Math.max(1, toInt(req.query.page, 1));
      const pageSize = Math.min(50, Math.max(1, toInt(req.query.pageSize, 20)));

      const q =
        typeof req.query.q === "string" && req.query.q.trim()
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
        ...(categoria ? { categoria: categoria as any } : {}),
        ...(status ? { status: status as any } : {}),
      };

      console.log('posttttttttttt')

      const data = await this.service.list(params as any);
      return res.status(200).json(data);
    } catch (error: any) {
      console.error("❌ Erro List Posts:", error);
      return res.status(500).json({ error: "ERRO_INTERNO" });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const statusRaw = req.body?.status;

      const usuarioId: string | undefined =
        req.user?.usuarioId ?? req.user?.usuarioId ?? req.body?.usuarioId;

      if (!postId) {
        return res.status(400).json({ error: "POST_ID_OBRIGATORIO" });
      }

      if (!usuarioId) {
        return res.status(401).json({ error: "NAO_AUTENTICADO" });
      }

      const status = parsePostStatus(statusRaw);

      if (!status) {
        const vazio =
          statusRaw === undefined || statusRaw === null || String(statusRaw).trim() === "";
        return res.status(400).json({
          error: vazio ? "STATUS_OBRIGATORIO" : "STATUS_INVALIDO",
          message: vazio
            ? "Informe o status do post."
            : `Status inválido: ${String(statusRaw)}`,
          allowed: Object.values(PostStatus),
        });
      }

      const updated = await this.service.updateStatus(postId, usuarioId, status);
      return res.status(200).json(updated);
    } catch (error: any) {
      console.error("❌ Erro UpdateStatus:", error);
      return res.status(500).json({ error: "ERRO_INTERNO" });
    }
  };

  interesse = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      const usuarioId: string | undefined =
        req.user?.usuarioId ?? req.user?.usuarioId ?? req.body?.usuarioId;

      if (!postId) {
        return res.status(400).json({ error: "POST_ID_OBRIGATORIO" });
      }

      if (!usuarioId) {
        return res.status(401).json({ error: "NAO_AUTENTICADO" });
      }

      const mensagem =
        typeof req.body?.mensagem === "string" ? req.body.mensagem.trim() : undefined;

      const row = await this.service.createInteresse({
        postId,
        interessadoId: usuarioId,
        mensagem,
      });

      return res.status(201).json(row);
    } catch (error: any) {
      console.error("❌ Erro Interesse:", error);
      return res.status(500).json({ error: "ERRO_INTERNO" });
    }
  };

  async listarPosts(req: Request, res: Response) {
    const { condominio_id } = req.params;
    const usuarioId = (req as any).user?.usuarioId;

    if (!condominio_id || !usuarioId) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    try {
      const posts = await this.service.listarPostsComStatusVisto(condominio_id, usuarioId);
      return res.json(posts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao carregar posts' });
    }
  }
}