import { DataSource, In, ILike } from "typeorm";
import { randomUUID } from "crypto";
import { Post, PostCategoria, PostStatus } from "../models/Post";
import { PostMidia } from "../models/PostMidia";
import { PostInteresse } from "../models/PostInteresse";
import { PostView } from "../models/PostView";


import {NotificationService} from '../services/NotificationService'; // Exemplo de serviço de alerta

type CreatePostPayload = {
  condominio_id: string;
  usuarioId: string;
  categoria: PostCategoria;
  titulo: string;
  descricao: string;
  destaque?: boolean;
  preco?: number | undefined;
  midias?: { url: string; ordem?: number; tipo?: string }[];
};

export class PostService {
  constructor(private ds: DataSource) { }

  async findById(id: string) {
    const repo = this.ds.getRepository(Post);

    const post = await repo.findOne({
      where: { id },
      relations: ["midias", "autor", "autor.endereco", "autor.perfil", "autor.condominio"],
    });

    if (!post) {
      throw new Error("Post não encontrado");
    }

    return post;
  }

  async create(payload: CreatePostPayload) {
    return await this.ds.transaction(async (manager) => {
      const postId = randomUUID();
      const postRepo = manager.getRepository(Post);

      // 1. Grava o Post Base
      const postData = {
        id: postId,
        condominio_id: payload.condominio_id,
        autor_id: payload.usuarioId,
        categoria: payload.categoria,
        titulo: payload.titulo,
        descricao: payload.descricao,
        status: PostStatus.ATIVO,
        destaque: payload.destaque ? 1 : 0
      };

      const savedPost = await manager.save(postRepo.create(postData as any));

      // 2. Grava Mídias
      if (payload.midias && payload.midias.length > 0) {
        const midiasRepo = manager.getRepository(PostMidia);
        const midiasEntities = payload.midias.map((m, index) =>
          midiasRepo.create({
            id: randomUUID(),
            postId: postId,
            url: m.url,
            tipo: m.tipo || 'image',
            ordem: m.ordem ?? index
          } as any)
        );
        await manager.save(midiasEntities);
      }

      // 3. Grava dados específicos
      if (payload.categoria === PostCategoria.VAGA_GARAGEM && payload.preco) {
        await manager.query(
          `INSERT INTO post_garagem (id, post_id, valor) VALUES (?, ?, ?)`,
          [randomUUID(), postId, payload.preco]
        );
      } else if (payload.categoria === PostCategoria.DESAPEGA) {
        await manager.query(
          `INSERT INTO post_desapega (id, post_id, preco) VALUES (?, ?, ?)`,
          [randomUUID(), postId, payload.preco || 0]
        );
      }

      return savedPost;
    });
  }

  async list(params: {
    condominio_id: string;
    categoria?: PostCategoria;
    status?: PostStatus;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const repo = this.ds.getRepository(Post);
    const whereCondition: any = { status: params.status || PostStatus.ATIVO };

    if (params.condominio_id) whereCondition.condominio_id = params.condominio_id;
    if (params.categoria) whereCondition.categoria = params.categoria;
    if (params.q) whereCondition.titulo = ILike(`%${params.q}%`);

    const [items, total] = await repo.findAndCount({
      where: whereCondition,
      relations: ["midias", "autor"],
      order: { destaque: "DESC", createdAt: "DESC" } as any,
      take: pageSize,
      skip: skip,
    });

    return { items, total, page, pageSize, hasNext: (page * pageSize) < total };
  }

  async updateStatus(postId: string, usuarioId: string, status: PostStatus) {
    const repo = this.ds.getRepository(Post);
    const post = await repo.findOne({ where: { id: postId } as any }) as Post | null;

    if (!post) throw new Error("POST_NAO_ENCONTRADO");

    const donoId = (post as any).usuarioId || (post as any).autorId;
    if (donoId !== usuarioId) throw new Error("SEM_PERMISSAO");

    post.status = status;
    return repo.save(post);
  }

  async createInteresse(input: { postId: string; interessadoId: string; mensagem?: string }) {
  const repo = this.ds.getRepository(PostInteresse);
  const repoPost = this.ds.getRepository(Post);

  // 1. Cria o registro de interesse
  const row = repo.create({
    id: randomUUID(),
    postId: input.postId,
    interessadoId: input.interessadoId,
    mensagem: input.mensagem ?? null,
  } as any);

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
      await NotificationService.enviarEmail(
        post.autor_id, 
        tituloNotif, 
        corpoNotif
      );
      
      console.log(`[Sucesso] Notificação enviada para o autor: ${post.autor_id}`);
    }
  } catch (error) {
    // Logamos o erro mas não travamos a resposta do interesse
    console.error("Erro ao processar notificação de interesse:", error);
  }

  return interesseSalvo;
}

  async listarPostsComStatusVisto(condominio_id: string, usuarioId: string) {
    try {
      const repo = this.ds.getRepository(Post);

      // Tenta pegar o repositório de views. 
      // Certifique-se que PostView está importado no topo do arquivo!
      const viewRepo = this.ds.getRepository(PostView);

      // 1. Buscamos os posts (removi a duplicidade de "autor")
      const posts = await repo.find({
        where: {
          condominio_id,
          status: PostStatus.ATIVO
        },
        relations: ["midias", "autor", "autor.endereco", "autor.perfil", "autor.condominio"],
        order: { destaque: "DESC", createdAt: "DESC" } as any
      });

      // 2. Buscamos as visualizações
      // Se der erro aqui, verifique se na classe PostView a propriedade é 'usuarioId' ou 'usuario_id'
      const views = await viewRepo.find({
        where: { usuarioId: usuarioId } as any,
        select: ["postId"] as any
      });

      const visualizadosIds = new Set(views.map(v => (v as any).postId));

      // 3. Retorno formatado
      return posts.map(post => ({
        ...post,
        visualizado: visualizadosIds.has(post.id)
      }));

    } catch (error: any) {
      // ISSO AQUI VAI TE DIZER EXATAMENTE O QUE ESTÁ ERRADO NO TERMINAL
      console.error("ERRO DETALHADO NO SERVICE:", error.message);
      throw new Error("Erro ao listar posts: " + error.message);
    }
  }
} // <--- O arquivo DEVE terminar exatamente aqui.