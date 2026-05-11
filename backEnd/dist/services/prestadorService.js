"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/prestadorService.ts
const data_source_1 = require("../config/data-source");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
const UserModels_1 = require("../models/UserModels");
const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
exports.default = {
    async atualizarPerfil(usuarioId, data) {
        const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
        // 1. Buscamos o PERFIL que pertence a esse usuário
        const perfil = await perfilRepo.findOne({
            where: { usuarioId: usuarioId }
        });
        if (!perfil)
            throw new Error("PERFIL_PRESTADOR_NAO_ENCONTRADO");
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
    async atualizarFoto(usuarioId, foto) {
        const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
        if (!usuario)
            throw new Error("USUARIO_NAO_ENCONTRADO");
        usuario.foto_perfil_url = foto;
        return await usuarioRepo.save(usuario);
    },
    async buscarPerfil(usuarioId) {
        return await usuarioRepo.findOneBy({ id: usuarioId });
    },
    async getVitrineService(categoria) {
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
