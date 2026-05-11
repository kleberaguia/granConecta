"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ServicoTipoModels_1 = require("../models/ServicoTipoModels"); // Verifique se o nome bate com o arquivo
const data_source_1 = require("../config/data-source");
const CategoryModels_1 = require("../models/CategoryModels");
const GrupoHomeModel_1 = require("../models/GrupoHomeModel");
class ServicoTipoService {
    constructor() {
        this.repo = data_source_1.AppDataSource.getRepository(ServicoTipoModels_1.ServicoTipo);
        this.repoCat = data_source_1.AppDataSource.getRepository(CategoryModels_1.Category);
        this.repoGrupo = data_source_1.AppDataSource.getRepository(GrupoHomeModel_1.GrupoHome);
    }
    async listar() {
        return await this.repoCat.find();
    }
    async listarGrupos() {
        return await this.repoGrupo.find({
            where: { ativo: true },
            order: { nome: "ASC" }
        });
    }
    async findOrCreate(data) {
        const { name, tipo, grupo_id, storeId } = data;
        // 1. Tenta encontrar a categoria existente
        let categoria = await this.repoCat.findOne({
            where: {
                name: name,
                tipo: tipo
            },
            relations: ["grupo"]
        });
        if (!categoria) {
            // 1. Instancia a classe diretamente
            const novaCategoria = new CategoryModels_1.Category();
            // 2. Atribui apenas o que é obrigatório
            novaCategoria.name = name;
            novaCategoria.tipo = tipo;
            // 3. Atribui o grupo_id apenas se ele realmente existir
            if (grupo_id !== null && grupo_id !== undefined) {
                novaCategoria.grupo_id = grupo_id;
            }
            if (storeId) {
                novaCategoria.storeId = storeId;
            }
            // 4. Salva a instância
            categoria = await this.repoCat.save(novaCategoria);
        }
        return categoria; // ✅ Cast final para garantir o tipo ao TS
    }
    // --- MÉTODO ADAPTADO PARA CORRIGIR OS ERROS ---
    async criar(dados) {
        // 1. Lógica de Geração do Slug (Resolve o erro "Field 'slug' doesn't have a default value")
        let slugFinal = dados.slug;
        if (!slugFinal) {
            // Se não veio slug, cria baseado no nome (ex: "Eletricista Predial" -> "eletricista-predial")
            slugFinal = dados.nome
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        // 2. Validação rápida para evitar erro de banco duplicado
        const existe = await this.repo.findOneBy({ slug: slugFinal });
        if (existe) {
            throw new Error(`Já existe um serviço com o slug '${slugFinal}'`);
        }
        // 3. Criação do objeto (Resolve o erro TS2769 usando 'as any')
        const novo = this.repo.create({
            nome: dados.nome,
            slug: slugFinal,
            descricao: dados.descricao || null, // Garante null se for undefined
            icone: dados.icone || null // Garante null se for undefined
        }); // <--- O 'as any' silencia o erro chato de tipagem do TypeScript
        return await this.repo.save(novo);
    }
    async atualizar(id, dados) {
        const item = await this.repo.findOneBy({ id: id });
        if (!item)
            throw new Error("Tipo de serviço não encontrado");
        this.repo.merge(item, dados);
        return await this.repo.save(item);
    }
    async excluir(id) {
        const result = await this.repo.delete(id);
        return result.affected ? true : false;
    }
    // Método extra útil para o front-end depois
    async buscarPorSlug(slug) {
        return await this.repo.findOneBy({ slug });
    }
    async buscarPorId(id) {
        return await this.repoCat.findOne({
            where: { id },
            relations: ["grupo"]
        });
    }
}
exports.default = new ServicoTipoService();
