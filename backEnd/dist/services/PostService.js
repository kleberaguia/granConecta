"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const typeorm_1 = require("typeorm");
const crypto_1 = require("crypto");
const Post_1 = require("../models/Post");
const PostMidia_1 = require("../models/PostMidia");
const PostInteresse_1 = require("../models/PostInteresse");
const PostView_1 = require("../models/PostView");
const NotificationService_1 = require("../services/NotificationService"); // Exemplo de serviço de alerta
class PostService {
    constructor(ds) {
        this.ds = ds;
    }
    async findById(id) {
        const repo = this.ds.getRepository(Post_1.Post);
        const post = await repo.findOne({
            where: { id },
            relations: ["midias", "autor", "autor.endereco", "autor.perfil", "autor.condominio"],
        });
        if (!post) {
            throw new Error("Post não encontrado");
        }
        return post;
    }
    async create(payload) {
        return await this.ds.transaction(async (manager) => {
            const postId = (0, crypto_1.randomUUID)();
            const postRepo = manager.getRepository(Post_1.Post);
            // 1. Grava o Post Base
            const postData = {
                id: postId,
                condominio_id: payload.condominio_id,
                autor_id: payload.usuarioId,
                categoria: payload.categoria,
                titulo: payload.titulo,
                descricao: payload.descricao,
                status: Post_1.PostStatus.ATIVO,
                destaque: payload.destaque ? 1 : 0
            };
            const savedPost = await manager.save(postRepo.create(postData));
            // 2. Grava Mídias
            if (payload.midias && payload.midias.length > 0) {
                const midiasRepo = manager.getRepository(PostMidia_1.PostMidia);
                const midiasEntities = payload.midias.map((m, index) => midiasRepo.create({
                    id: (0, crypto_1.randomUUID)(),
                    postId: postId,
                    url: m.url,
                    tipo: m.tipo || 'image',
                    ordem: m.ordem ?? index
                }));
                await manager.save(midiasEntities);
            }
            // 3. Grava dados específicos
            if (payload.categoria === Post_1.PostCategoria.VAGA_GARAGEM && payload.preco) {
                await manager.query(`INSERT INTO post_garagem (id, post_id, valor) VALUES (?, ?, ?)`, [(0, crypto_1.randomUUID)(), postId, payload.preco]);
            }
            else if (payload.categoria === Post_1.PostCategoria.DESAPEGA) {
                await manager.query(`INSERT INTO post_desapega (id, post_id, preco) VALUES (?, ?, ?)`, [(0, crypto_1.randomUUID)(), postId, payload.preco || 0]);
            }
            return savedPost;
        });
    }
    async list(params) {
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));
        const skip = (page - 1) * pageSize;
        const repo = this.ds.getRepository(Post_1.Post);
        const whereCondition = { status: params.status || Post_1.PostStatus.ATIVO };
        if (params.condominio_id)
            whereCondition.condominio_id = params.condominio_id;
        if (params.categoria)
            whereCondition.categoria = params.categoria;
        if (params.q)
            whereCondition.titulo = (0, typeorm_1.ILike)(`%${params.q}%`);
        const [items, total] = await repo.findAndCount({
            where: whereCondition,
            relations: ["midias", "autor"],
            order: { destaque: "DESC", createdAt: "DESC" },
            take: pageSize,
            skip: skip,
        });
        return { items, total, page, pageSize, hasNext: (page * pageSize) < total };
    }
    async updateStatus(postId, usuarioId, status) {
        const repo = this.ds.getRepository(Post_1.Post);
        const post = await repo.findOne({ where: { id: postId } });
        if (!post)
            throw new Error("POST_NAO_ENCONTRADO");
        const donoId = post.usuarioId || post.autorId;
        if (donoId !== usuarioId)
            throw new Error("SEM_PERMISSAO");
        post.status = status;
        return repo.save(post);
    }
    async createInteresse(input) {
        const repo = this.ds.getRepository(PostInteresse_1.PostInteresse);
        const repoPost = this.ds.getRepository(Post_1.Post);
        // 1. Cria o registro de interesse
        const row = repo.create({
            id: (0, crypto_1.randomUUID)(),
            postId: input.postId,
            interessadoId: input.interessadoId,
            mensagem: input.mensagem ?? null,
        });
        const interesseSalvo = await repo.save(row);
        // 2. Lógica de Notificação Híbrida (Sistema + Email)
        try {
            // Buscamos o post e o autor (dono do anúncio)
            const post = await repoPost.findOne({
                where: { id: input.postId },
                relations: ["autor", "autor.auth"] // Importante carregar o auth para ter o e-mail
            });
            if (post && post.autor_id !== input.interessadoId) {
                const tituloNotif = "Novo interesse no seu post!";
                const corpoNotif = `Olá! Um vizinho demonstrou interesse no seu post "${post.titulo}".\n\n` +
                    `Mensagem: ${input.mensagem || "Tenho interesse neste anúncio!"}`;
                // ✅ Usa o seu NotificationService para enviar para a SINETA e para o EMAIL
                // Como o autorId é um ID, o seu método enviarEmail vai buscar o e-mail no banco e enviar.
                await NotificationService_1.NotificationService.enviarEmail(post.autor_id, tituloNotif, corpoNotif);
                console.log(`[Sucesso] Notificação enviada para o autor: ${post.autor_id}`);
            }
        }
        catch (error) {
            // Logamos o erro mas não travamos a resposta do interesse
            console.error("Erro ao processar notificação de interesse:", error);
        }
        return interesseSalvo;
    }
    async listarPostsComStatusVisto(condominio_id, usuarioId) {
        try {
            const repo = this.ds.getRepository(Post_1.Post);
            // Tenta pegar o repositório de views. 
            // Certifique-se que PostView está importado no topo do arquivo!
            const viewRepo = this.ds.getRepository(PostView_1.PostView);
            // 1. Buscamos os posts (removi a duplicidade de "autor")
            const posts = await repo.find({
                where: {
                    condominio_id,
                    status: Post_1.PostStatus.ATIVO
                },
                relations: ["midias", "autor", "autor.endereco", "autor.perfil", "autor.condominio"],
                order: { destaque: "DESC", createdAt: "DESC" }
            });
            // 2. Buscamos as visualizações
            // Se der erro aqui, verifique se na classe PostView a propriedade é 'usuarioId' ou 'usuario_id'
            const views = await viewRepo.find({
                where: { usuarioId: usuarioId },
                select: ["postId"]
            });
            const visualizadosIds = new Set(views.map(v => v.postId));
            // 3. Retorno formatado
            return posts.map(post => ({
                ...post,
                visualizado: visualizadosIds.has(post.id)
            }));
        }
        catch (error) {
            // ISSO AQUI VAI TE DIZER EXATAMENTE O QUE ESTÁ ERRADO NO TERMINAL
            console.error("ERRO DETALHADO NO SERVICE:", error.message);
            throw new Error("Erro ao listar posts: " + error.message);
        }
    }
} // <--- O arquivo DEVE terminar exatamente aqui.
exports.PostService = PostService;
