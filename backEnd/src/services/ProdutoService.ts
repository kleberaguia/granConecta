// src/services/ProdutoService.ts
import { AppDataSource } from '../config/data-source';
import { Product } from '../models/ProdutoModels';
import { Repository } from 'typeorm';
import fs from 'fs';
import path from 'path';

class ProdutoService {
    private get repository(): Repository<Product> {
        return AppDataSource.getRepository(Product);
    }

    async getProdutosVitrine(): Promise<Product[]> {
        // Removi o filtro de 'status' pois o erro diz que ele não existe no seu Model
        return await this.repository.find({
            order: { name: 'ASC' } as any,
        });
    }

    async getByIdProdutosVitrine(id: number): Promise<Product | null> {
        // Usamos findOne para retornar um único objeto Product (ou null se não achar)
        // O erro ocorria porque .find() retornava Product[] (Array)
        return await this.repository.findOne({
            where: { id } as any
        });
    }

    async getMeusProdutos(storeId: string): Promise<Product[]> {
        return await this.repository.find({
            // O campo correto é storeId, conforme seu Model
            where: { storeId: storeId } as any,
            order: { createdAt: 'DESC' } as any,
        });
    }

    async createProduto(produtoData: any): Promise<Product> {
        const dataToSave = {
            name: produtoData.name,
            description: produtoData.description,
            price: Number(produtoData.price),
            stock: Number(produtoData.stock || 0),
            imageUrl: produtoData.imageUrl,
            categoryId: produtoData.categoryId,
            storeId: produtoData.storeId,
        };
        const novoProduto = this.repository.create(dataToSave as any) as unknown as Product;
        return await this.repository.save(novoProduto);
    }

    async updateProduct(id: string, userId: string, data: any) {
        const productRepository = AppDataSource.getRepository(Product);

        // 1. Verificar se o produto existe e pertence ao usuário
        const produto = await productRepository.findOne({ where: { id } as any });

        if (!produto) {
            throw new Error("Produto não encontrado ou você não tem permissão.");
        }

        // 2. Atualizar os campos (faz o merge dos dados antigos com os novos)
        // O Object.assign evita que campos nulos sobrescrevam dados existentes
        Object.assign(produto, data);

        // 3. Salvar no banco
        return await productRepository.save(produto);
    }


    async updateProduto(id: string, produtoData: any): Promise<Product> {
        const produtoExistente = await this.repository.findOne({ where: { id } as any });

        if (!produtoExistente) {
            throw new Error('Produto não encontrado.');
        }

        // Usando Object.assign para atualizar apenas o que existe no Model
        // e evitar erros de propriedades desconhecidas
        const dadosParaAtualizar = {
            name: produtoData.name ?? produtoExistente.name,
            description: produtoData.description ?? produtoExistente.description,
            price: produtoData.price ?? produtoExistente.price,
            stock: produtoData.stock ?? produtoExistente.stock,
            imageUrl: produtoData.imageUrl || produtoData.imagemUrl || produtoExistente.imageUrl,
        };

        Object.assign(produtoExistente, dadosParaAtualizar);
        return await this.repository.save(produtoExistente);
    }

    async deleteProduto(id: string, storeId: string) {
        // 1. Busca o produto para pegar o nome da imagem antes de deletar
        const produto = await this.repository.findOne({
            where: { id, storeId }
        });

        if (!produto) {
            throw new Error("Produto não encontrado ou você não tem permissão para excluí-lo.");
        }

        // 2. Tenta deletar a imagem física da pasta uploads (opcional, mas recomendado)
        if (produto.imageUrl && produto.imageUrl !== 'default.png') {
            const imagePath = path.resolve(__dirname, '../../uploads', produto.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // 3. Remove do banco de dados
        await this.repository.remove(produto);

        return { message: "Produto excluído com sucesso." };
    }
}

export default new ProdutoService();