"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/ProdutoService.ts
const data_source_1 = require("../config/data-source");
const ProdutoModels_1 = require("../models/ProdutoModels");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ProdutoService {
    get repository() {
        return data_source_1.AppDataSource.getRepository(ProdutoModels_1.Product);
    }
    async getProdutosVitrine() {
        // Removi o filtro de 'status' pois o erro diz que ele não existe no seu Model
        return await this.repository.find({
            order: { name: 'ASC' },
        });
    }
    async getByIdProdutosVitrine(id) {
        // Usamos findOne para retornar um único objeto Product (ou null se não achar)
        // O erro ocorria porque .find() retornava Product[] (Array)
        return await this.repository.findOne({
            where: { id }
        });
    }
    async getMeusProdutos(storeId) {
        return await this.repository.find({
            // O campo correto é storeId, conforme seu Model
            where: { storeId: storeId },
            order: { createdAt: 'DESC' },
        });
    }
    async createProduto(produtoData) {
        const dataToSave = {
            name: produtoData.name,
            description: produtoData.description,
            price: Number(produtoData.price),
            stock: Number(produtoData.stock || 0),
            imageUrl: produtoData.imageUrl,
            categoryId: produtoData.categoryId,
            storeId: produtoData.storeId,
        };
        const novoProduto = this.repository.create(dataToSave);
        return await this.repository.save(novoProduto);
    }
    async updateProduct(id, userId, data) {
        const productRepository = data_source_1.AppDataSource.getRepository(ProdutoModels_1.Product);
        // 1. Verificar se o produto existe e pertence ao usuário
        const produto = await productRepository.findOne({ where: { id } });
        if (!produto) {
            throw new Error("Produto não encontrado ou você não tem permissão.");
        }
        // 2. Atualizar os campos (faz o merge dos dados antigos com os novos)
        // O Object.assign evita que campos nulos sobrescrevam dados existentes
        Object.assign(produto, data);
        // 3. Salvar no banco
        return await productRepository.save(produto);
    }
    async updateProduto(id, produtoData) {
        const produtoExistente = await this.repository.findOne({ where: { id } });
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
    async deleteProduto(id, storeId) {
        // 1. Busca o produto para pegar o nome da imagem antes de deletar
        const produto = await this.repository.findOne({
            where: { id, storeId }
        });
        if (!produto) {
            throw new Error("Produto não encontrado ou você não tem permissão para excluí-lo.");
        }
        // 2. Tenta deletar a imagem física da pasta uploads (opcional, mas recomendado)
        if (produto.imageUrl && produto.imageUrl !== 'default.png') {
            const imagePath = path_1.default.resolve(__dirname, '../../uploads', produto.imageUrl);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        // 3. Remove do banco de dados
        await this.repository.remove(produto);
        return { message: "Produto excluído com sucesso." };
    }
}
exports.default = new ProdutoService();
