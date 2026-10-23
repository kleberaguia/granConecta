// src/services/ServicoTipoService.ts
import { v4 as uuidv4 } from 'uuid';
import { ServicoTipo } from "../models/ServicoTipoModels"; // Verifique se o nome bate com o arquivo
import { AppDataSource } from '../config/data-source';
import { Category } from '../models/CategoryModels';
import { GrupoHome } from '../models/GrupoHomeModel';

// Atualizei a interface para aceitar os campos que existem na sua tabela
interface CreateTipoDTO {
    nome: string;
    slug?: string;     // Opcional (se não vier, geramos)
    descricao?: string; // Opcional
    icone?: string;    // Opcional
}

class ServicoTipoService {

    private repo = AppDataSource.getRepository(ServicoTipo);
    private repoCat = AppDataSource.getRepository(Category);
    private repoGrupo = AppDataSource.getRepository(GrupoHome);

    async listar() {
        return await this.repoCat.find();
    }

    async listarGrupos() {
        return await this.repoGrupo.find({
            where: { ativo: true },
            order: { nome: "ASC" }
        });
    }

    async findOrCreate(data: {
        name: string;
        tipo: string;
        grupo_id?: number | null;
        storeId?: string | null
    }): Promise<Category> { // ✅ Garantimos que o retorno é uma única Category
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
            const novaCategoria = new Category();

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
        return categoria as Category; // ✅ Cast final para garantir o tipo ao TS
    }

    // --- MÉTODO ADAPTADO PARA CORRIGIR OS ERROS ---
    async criar(dados: CreateTipoDTO) {

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
            icone: dados.icone || null          // Garante null se for undefined
        } as any); // <--- O 'as any' silencia o erro chato de tipagem do TypeScript

        return await this.repo.save(novo);
    }

    async atualizar(id: string, dados: Partial<ServicoTipo>) {
        const item = await this.repo.findOneBy({ id: id });

        if (!item) throw new Error("Tipo de serviço não encontrado");

        this.repo.merge(item, dados);
        return await this.repo.save(item);
    }

    async excluir(id: number) {
        const result = await this.repo.delete(id);
        return result.affected ? true : false;
    }

    // Método extra útil para o front-end depois
    async buscarPorSlug(slug: string) {
        return await this.repo.findOneBy({ slug });
    }

    async buscarPorId(id: number) {
        return await this.repoCat.findOne({
            where: { id },
            relations: ["grupo"]
        });
    }
}

export default new ServicoTipoService();