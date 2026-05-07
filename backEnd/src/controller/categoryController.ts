import { Request, Response } from 'express';
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/CategoryModels";
import categoryService from '../services/categoryService';

export class CategoryController {
    private categoryRepo = AppDataSource.getRepository(Category);


    listAll = async (req: Request, res: Response) => {
        try {
            const categories = await categoryService.listAll();
            return res.json(categories);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao listar categorias" });
        }
    };

    // Listar categorias de uma loja específica
    listByStore = async (req: Request, res: Response) => {
        try {
            const { storeId } = req.params; // ou req.query
            if (!storeId) return res.status(400).json('storeId Não localizado')
            const categories = await this.categoryRepo.find({
                where: { storeId },
                order: { name: "ASC" }
            });
            return res.json(categories);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao buscar categorias" });
        }
    };


    CategoriaById = async (req: Request, res: Response) => {
        try {
            // 1. Pegamos o ID dos parâmetros da URL
            const { categoriaId } = req.params;

            console.log('CategoriaById ', categoriaId)

            // 2. Verificação básica
            if (!categoriaId) {
                return res.status(400).json('categoriaId não localizado');
            }

            // 3. Busca no banco de dados (MySQL)
            // Usamos findOne porque o ID é único. 
            // Se usar 'find', ele retornará uma lista [].
            const category = await this.categoryRepo.findOne({
                where: { id: Number(categoriaId) } // Garantimos que o ID seja tratado como número se necessário
            });

            // 4. Verifica se a categoria realmente existe
            if (!category) {
                return res.status(404).json({ error: "Categoria não encontrada" });
            }

            return res.json(category);
        } catch (error) {
            console.error("Erro ao buscar categoria:", error);
            return res.status(500).json({ error: "Erro ao buscar categoria no banco de dados" });
        }
    };

    // Criar nova categoria
    create = async (req: Request, res: Response) => {
        try {
            const { name, tipo } = req.body; // tipo: 'PRODUTO' ou 'SERVICO'
            const user = (req as any).user; // Pegue o user do seu authMiddleware

            // Validação de Admin (Ajuste conforme sua coluna de cargo no banco)
            if (user?.role !== 'ADMIN') {
                return res.status(403).json({ error: "Apenas administradores podem criar categorias." });
            }

            const novaCategoria = await this.categoryRepo.save({ name, tipo });
            return res.status(201).json(novaCategoria);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao criar categoria" });
        }
    };

    // Deletar categoria
    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json('storeId Não localizado')
            await this.categoryRepo.delete(id);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: "Erro ao deletar categoria. Verifique se existem produtos nela." });
        }
    };
}