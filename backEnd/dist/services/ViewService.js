"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewService = void 0;
const crypto_1 = require("crypto");
const AvisoView_1 = require("../models/AvisoView");
const PostView_1 = require("../models/PostView");
class ViewService {
    constructor(ds) {
        this.ds = ds;
    }
    // ✅ MARCAR AVISO COMO VISTO
    async marcarAvisoVisto(avisoId, usuarioId) {
        const repo = this.ds.getRepository(AvisoView_1.AvisoView);
        const existing = await repo.findOneBy({ avisoId, usuarioId });
        if (existing)
            return existing;
        const row = repo.create({ id: (0, crypto_1.randomUUID)(), avisoId, usuarioId });
        return repo.save(row);
    }
    // ✅ MARCAR POST COMO VISTO
    async marcarPostVisto(postId, usuarioId) {
        const repo = this.ds.getRepository(PostView_1.PostView);
        const existing = await repo.findOneBy({ postId, usuarioId });
        if (existing)
            return existing;
        const row = repo.create({ id: (0, crypto_1.randomUUID)(), postId, usuarioId });
        return repo.save(row);
    }
    // ✅ CONTADOR HOME (Badge) - Corrigido com DISTINCT e Filtro de Autor
    async contarNaoVistos(condominio_id, usuarioId) {
        // 1. AVISOS
        const avisosNaoVistos = await this.ds
            .createQueryBuilder()
            .select("COUNT(DISTINCT a.id)", "count")
            .from("avisos", "a")
            .leftJoin("aviso_views", "av", "av.aviso_id = a.id AND av.usuario_id = :usuarioId", { usuarioId })
            .leftJoin("aviso_targets", "t", "t.aviso_id = a.id AND t.condominio_id = :condominio_id", { condominio_id })
            .where("a.status = 'ATIVO'")
            .andWhere("a.autor_id != :usuarioId", { usuarioId }) // Não conta o que eu mesmo postei
            .andWhere("av.id IS NULL")
            .andWhere(`((a.visibilidade='CONDOMINIO' AND a.condominio_id=:condominio_id) OR (a.visibilidade='REDE') OR (a.visibilidade='ALVO' AND t.aviso_id IS NOT NULL))`, { condominio_id })
            .getRawOne();
        // 2. POSTS
        const postsNaoVistos = await this.ds
            .createQueryBuilder()
            .select("COUNT(DISTINCT p.id)", "count")
            .from("posts", "p")
            .leftJoin("post_views", "pv", "pv.post_id = p.id AND pv.usuario_id = :usuarioId", { usuarioId })
            .leftJoin("post_targets", "pt", "pt.post_id = p.id AND pt.condominio_id = :condominio_id", { condominio_id })
            .where("p.status = 'ATIVO'")
            .andWhere("p.autor_id != :usuarioId", { usuarioId }) // Não conta o que eu mesmo postei
            .andWhere("pv.id IS NULL")
            .andWhere(`((p.visibilidade='CONDOMINIO' AND p.condominio_id=:condominio_id) OR (p.visibilidade='REDE') OR (p.visibilidade='ALVO' AND pt.post_id IS NOT NULL))`, { condominio_id })
            .getRawOne();
        const total = Number(avisosNaoVistos?.count ?? 0) + Number(postsNaoVistos?.count ?? 0);
        console.log('Totalllllllllllllllllll ', total);
        return {
            total: Number(avisosNaoVistos?.count ?? 0) + Number(postsNaoVistos?.count ?? 0),
            detalhe: {
                avisos: Number(avisosNaoVistos?.count),
                posts: Number(postsNaoVistos?.count)
            }
        };
    }
    // ✅ LISTAR NÃO VISTOS PARA HOME
    async listarNaoVistos(condominio_id, usuarioId, limit = 8) {
        const safeLimit = Math.min(30, Math.max(1, Number(limit) || 8));
        // 1. AVISOS
        const avisos = await this.ds
            .createQueryBuilder()
            .select([
            "'AVISO' as kind",
            "a.id as id",
            "a.titulo as titulo",
            "LEFT(a.conteudo, 140) as resumo",
            "a.createdAt as createdAt",
            "a.visibilidade as visibilidade",
            "a.tipo as tipo",
            // Avisos prioritários ganham Score 1
            "CASE WHEN a.prioridade = 1 THEN 1 ELSE 0 END as priorityScore",
        ])
            .from("avisos", "a")
            .leftJoin("aviso_views", "av", "av.aviso_id = a.id AND av.usuario_id = :usuarioId", { usuarioId })
            .leftJoin("aviso_targets", "t", "t.aviso_id = a.id AND t.condominio_id = :condominio_id", { condominio_id })
            .where("a.status = 'ATIVO'")
            .andWhere("a.autor_id != :usuarioId", { usuarioId })
            .andWhere("av.id IS NULL") // Só o que não foi visto
            .andWhere(`((a.visibilidade='CONDOMINIO' AND a.condominio_id=:condominio_id) OR (a.visibilidade='REDE') OR (a.visibilidade='ALVO' AND t.aviso_id IS NOT NULL))`, { condominio_id })
            .orderBy("priorityScore", "DESC")
            .addOrderBy("a.createdAt", "DESC")
            .limit(safeLimit)
            .getRawMany();
        // 2. POSTS (ADAPTADO PARA PROPAGANDA)
        const posts = await this.ds
            .createQueryBuilder()
            .select([
            "'POST' as kind",
            "p.id as id",
            "p.titulo as titulo",
            "LEFT(p.descricao, 140) as resumo",
            "p.createdAt as createdAt",
            "p.visibilidade as visibilidade",
            "p.categoria as categoria",
            // 💡 MUDANÇA: Destaque ganha Score 2 para ficar ACIMA dos avisos na Home
            "CASE WHEN p.destaque = 1 THEN 2 ELSE 0 END as priorityScore",
            "m.url as midiaUrl",
        ])
            .from("posts", "p")
            .leftJoin("post_views", "pv", "pv.post_id = p.id AND pv.usuario_id = :usuarioId", { usuarioId })
            .leftJoin("post_targets", "pt", "pt.post_id = p.id AND pt.condominio_id = :condominio_id", { condominio_id })
            .leftJoin((qb) => qb.select("pm.post_id", "post_id").addSelect("MIN(pm.ordem)", "min_ordem").from("post_midias", "pm").groupBy("pm.post_id"), "pm_min", "pm_min.post_id = p.id")
            .leftJoin("post_midias", "m", "m.post_id = p.id AND m.ordem = pm_min.min_ordem")
            .where("p.status = 'ATIVO'")
            .andWhere("p.autor_id != :usuarioId", { usuarioId })
            .andWhere("pv.id IS NULL") // Só o que não foi visto
            .andWhere(`((p.visibilidade='CONDOMINIO' AND p.condominio_id=:condominio_id) OR (p.visibilidade='REDE') OR (p.visibilidade='ALVO' AND pt.post_id IS NOT NULL))`, { condominio_id })
            .orderBy("priorityScore", "DESC")
            .addOrderBy("p.createdAt", "DESC")
            .limit(safeLimit)
            .getRawMany();
        // 3. MERGE E ORDENAÇÃO
        const merged = [...avisos, ...posts];
        // Ordena primeiro pelo Score (Destaques=2, AvisosPrioritarios=1, Outros=0) e depois por data
        merged.sort((a, b) => (b.priorityScore - a.priorityScore) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return { items: merged.slice(0, safeLimit) };
    }
}
exports.ViewService = ViewService;
