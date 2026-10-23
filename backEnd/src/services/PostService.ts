import { DataSource, In, ILike } from "typeorm";
import { randomUUID } from "crypto";
import {
  Post,
  PostCategoria,
  PostStatus,
  PostVisibilidade,
} from "../models/Post";
import { PostTarget } from "../models/PostTargetModels";
import { PostMidia } from "../models/PostMidia";
import { PostInteresse } from "../models/PostInteresse";
import { PostView } from "../models/PostView";


import { NotificationService } from '../services/NotificationService'; // Exemplo de serviço de alerta

type CreatePostPayload = {
  condominio_id: string;
  usuarioId: string;
  categoria: PostCategoria;
  titulo: string;
  descricao: string;
  destaque?: boolean;
  preco?: number | undefined;
  midias?: { url: string; ordem?: number; tipo?: string }[];

  visibilidade?: PostVisibilidade;
  targetCondominioIds?: string[];

  animal_tipo?: string;
  animal_especie?: string;
  animal_sexo?: string;
  animal_porte?: string;
  animal_vacinado?: string;
  animal_castrado?: string;

  desapega_condicao?: string;
  desapega_preco?: string | number;
  desapega_e_doacao?: string | boolean;
  desapega_categoria_item?: string;

  garagem_operacao?: string;
  garagem_tipo_vaga?: string;
  garagem_valor_mensal?: string | number;
  garagem_bloco?: string;
  garagem_vaga_codigo?: string;
  garagem_observacoes?: string;
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
      const visibilidade =
        payload.visibilidade ?? PostVisibilidade.CONDOMINIO;

      const postData = {
        id: postId,
        condominio_id: payload.condominio_id,
        autor_id: payload.usuarioId,
        categoria: payload.categoria,
        titulo: payload.titulo,
        descricao: payload.descricao,
        status: PostStatus.ATIVO,
        destaque: payload.destaque ? 1 : 0,
        visibilidade,
      };

      const savedPost = await manager.save(postRepo.create(postData as any));

      if (visibilidade === PostVisibilidade.ALVO) {
        const targetIds = Array.from(
          new Set(
            (payload.targetCondominioIds ?? [])
              .map((id) => String(id).trim())
              .filter(Boolean)
          )
        );

        if (targetIds.length === 0) {
          throw new Error(
            "POST_ALVO_EXIGE_PELO_MENOS_UM_CONDOMINIO"
          );
        }

        const targetRepo = manager.getRepository(PostTarget);

        const targets = targetIds.map((condominioId) =>
          targetRepo.create({
            post: { id: postId } as Post,
            condominio: { id: condominioId } as any,
          })
        );

        await targetRepo.save(targets);
      }

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
      if (payload.categoria === PostCategoria.VAGA_GARAGEM) {
        await manager.query(
          `
    INSERT INTO post_garagem 
      (post_id, operacao, tipo_vaga, valor_mensal, bloco, vaga_codigo, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
          [
            postId,
            payload.garagem_operacao || "OFERECO",
            payload.garagem_tipo_vaga || "ALUGUEL",
            payload.garagem_valor_mensal ? Number(payload.garagem_valor_mensal) : null,
            payload.garagem_bloco || null,
            payload.garagem_vaga_codigo || null,
            payload.garagem_observacoes || null,
          ]
        );
      }

      if (payload.categoria === PostCategoria.DESAPEGA) {
        await manager.query(
          `
        INSERT INTO post_desapega
          (post_id, condicao, preco, e_doacao, categoria_item)
        VALUES (?, ?, ?, ?, ?)
        `,
          [
            postId,
            payload.desapega_condicao || "USADO",
            payload.desapega_preco ? Number(payload.desapega_preco) : null,
            payload.desapega_e_doacao === "false" ? 0 : 1,
            payload.desapega_categoria_item || null,
          ]
        );
      }

      if (payload.categoria === PostCategoria.ANIMAIS) {
        await manager.query(
          `
            INSERT INTO post_animais
              (post_id, tipo, especie, sexo, porte, vacinado, castrado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
          [
            postId,
            payload.animal_tipo || "DOACAO",
            payload.animal_especie || "OUTRO",
            payload.animal_sexo || "NAO_INFORMADO",
            payload.animal_porte || "NAO_INFORMADO",
            payload.animal_vacinado === "" || payload.animal_vacinado == null
              ? null
              : payload.animal_vacinado === "true"
                ? 1
                : 0,
            payload.animal_castrado === "" || payload.animal_castrado == null
              ? null
              : payload.animal_castrado === "true"
                ? 1
                : 0,
          ]
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
    const pageSize = Math.min(
      50,
      Math.max(1, params.pageSize ?? 20)
    );

    const skip = (page - 1) * pageSize;

    const repo = this.ds.getRepository(Post);

    const qb = repo
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.midias", "midias")
      .leftJoinAndSelect("post.autor", "autor")
      .leftJoin("post.targets", "target")
      .leftJoin("target.condominio", "targetCondominio")
      .where("post.status = :status", {
        status: params.status || PostStatus.ATIVO,
      })
      .andWhere(
        `(
        post.visibilidade = :rede

        OR

        (
          post.visibilidade = :condominio
          AND post.condominio_id = :condominioId
        )

        OR

        (
          post.visibilidade = :alvo
          AND targetCondominio.id = :condominioId
        )
      )`,
        {
          rede: PostVisibilidade.REDE,
          condominio: PostVisibilidade.CONDOMINIO,
          alvo: PostVisibilidade.ALVO,
          condominioId: params.condominio_id,
        }
      );

    if (params.categoria) {
      qb.andWhere("post.categoria = :categoria", {
        categoria: params.categoria,
      });
    }

    if (params.q) {
      qb.andWhere("post.titulo LIKE :q", {
        q: `%${params.q}%`,
      });
    }

    qb
      .distinct(true)
      .orderBy("post.destaque", "DESC")
      .addOrderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      hasNext: page * pageSize < total,
    };
  }

  async updateStatus(postId: string, usuarioId: string, status: PostStatus) {
    const repo = this.ds.getRepository(Post);
    const post = await repo.findOne({ where: { id: postId } as any }) as Post | null;

    if (!post) throw new Error("POST_NAO_ENCONTRADO");

    const donoId =
      (post as any).autor_id ||
      (post as any).autorId ||
      (post as any).usuarioId;

    if (String(donoId) !== String(usuarioId)) {
      throw new Error("SEM_PERMISSAO");
    }

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
        const tituloNotif = "Alguém se interessou pelo seu recado";

        const corpoNotif =
          `Um morador demonstrou interesse em "${post.titulo}".\n\n` +
          `Mensagem: ${input.mensagem || "Tenho interesse neste recado."}\n\n` +
          `Acesse o GranConecta para responder e combinar a entrega com segurança.`;


        console.log("🔥 [POST INTERESSE] NOTIFICANDO AUTOR", {
          postId: post.id,
          postTitulo: post.titulo,
          autorId: post.autor_id,
          interessadoUsuarioId: input.interessadoId,
          mensagem: input.mensagem,
        });

        // ✅ Usa o seu NotificationService para enviar para a SINETA e para o EMAIL
        // Como o autorId é um ID, o seu método enviarEmail vai buscar o e-mail no banco e enviar.
        // await NotificationService.dispararTudo(
        //   post.autor_id,
        //   tituloNotif,
        //   corpoNotif
        // );

        await NotificationService.dispararInteresseRecado(
          post.autor_id,
          post.titulo,
         // tituloNotif,
          corpoNotif,
        );

        console.log(`[Sucesso] Notificação enviada para o autor: ${post.autor_id}`);
      }
    } catch (error) {
      // Logamos o erro mas não travamos a resposta do interesse
      console.error("Erro ao processar notificação de interesse:", error);
    }

    return interesseSalvo;
  }

  async listarPostsComStatusVisto(
    condominio_id: string,
    usuarioId: string
  ) {
    try {
      const repo = this.ds.getRepository(Post);
      const viewRepo = this.ds.getRepository(PostView);

      const posts = await repo
        .createQueryBuilder("post")
        .leftJoinAndSelect("post.midias", "midias")
        .leftJoinAndSelect("post.autor", "autor")
        .leftJoinAndSelect("autor.endereco", "endereco")
        .leftJoinAndSelect("autor.perfil", "perfil")
        .leftJoinAndSelect("autor.condominio", "autorCondominio")
        .leftJoin("post.targets", "target")
        .leftJoin("target.condominio", "targetCondominio")
        .where("post.status = :status", {
          status: PostStatus.ATIVO,
        })
        .andWhere(
          `(
          post.visibilidade = :rede

          OR

          (
            post.visibilidade = :condominio
            AND post.condominio_id = :condominioId
          )

          OR

          (
            post.visibilidade = :alvo
            AND targetCondominio.id = :condominioId
          )
        )`,
          {
            rede: PostVisibilidade.REDE,
            condominio: PostVisibilidade.CONDOMINIO,
            alvo: PostVisibilidade.ALVO,
            condominioId: condominio_id,
          }
        )
        .distinct(true)
        .orderBy("post.destaque", "DESC")
        .addOrderBy("post.createdAt", "DESC")
        .getMany();

      const views = await viewRepo.find({
        where: {
          usuarioId,
        } as any,
        select: ["postId"] as any,
      });

      const visualizadosIds = new Set(
        views.map((view) => view.postId)
      );

      return posts.map((post) => ({
        ...post,
        visualizado: visualizadosIds.has(post.id),
      }));
    } catch (error: any) {
      console.error(
        "ERRO DETALHADO NO SERVICE:",
        error.message
      );

      throw new Error(
        "Erro ao listar posts: " + error.message
      );
    }
  }
} // <--- O arquivo DEVE terminar exatamente aqui.