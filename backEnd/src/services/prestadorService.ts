// src/services/prestadorService.ts
import { AppDataSource } from "../config/data-source";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { Usuario } from "../models/UserModels";

const usuarioRepo = AppDataSource.getRepository(Usuario);

const perfilRepo = AppDataSource.getRepository(PerfilPrestador);


export default {
  async atualizarPerfil(usuarioId: string, data: any) {
    const perfilRepo = AppDataSource.getRepository(PerfilPrestador);

    // 1. Buscamos o PERFIL que pertence a esse usuário
    const perfil = await perfilRepo.findOne({
      where: { usuarioId: usuarioId }
    });

    if (!perfil) throw new Error("PERFIL_PRESTADOR_NAO_ENCONTRADO");

    // 2. Agora sim, as propriedades existem neste objeto (perfil)
    perfil.descricao_bio = data.descricao_bio;
    perfil.servicos_oferecidos = data.servicos_oferecidos;

    // Você usou 'ativo' no model para o prestador ligar/desligar
    perfil.ativo = false;

    // No seu model você tem 'status_aprovacao' e 'disponivel'
    perfil.status_aprovacao = 'PENDENTE';
    perfil.disponivel = false; // Aguardando Admin

    // 3. Salvamos no repositório de PERFIL
    return await perfilRepo.save(perfil);
  },

  async atualizarFoto(usuarioId: string, foto: string) {
    const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
    if (!usuario) throw new Error("USUARIO_NAO_ENCONTRADO");

    usuario.foto_perfil_url = foto;
    return await usuarioRepo.save(usuario);
  },

  async buscarPerfil(usuarioId: string) {
    return await usuarioRepo.findOneBy({ id: usuarioId });
  },

  async getVitrineService(categoria?: string) {
    // Usamos o perfilRepo definido lá no topo
    const query = usuarioRepo.createQueryBuilder("pp")
      .innerJoinAndSelect("pp.usuario", "u")
      .where("pp.status_aprovacao = :status", { status: 'APROVADO' })
      .andWhere("pp.ativo = :ativo", { ativo: true });

    // Se vier categoria na URL (?categoria=Limpeza), filtra no SQL
    if (categoria) {
      query.andWhere("pp.servicos_oferecidos LIKE :cat", { cat: `%${categoria}%` });
    }

    // Ordenação por Tiers (Planos)
    query.orderBy("CASE WHEN pp.plano = 'PREMIUM' THEN 1 WHEN pp.plano = 'INTERMEDIARIO' THEN 2 ELSE 3 END", "ASC")
      .addOrderBy("pp.id", "DESC");

    return await query.getMany();
  }
};
