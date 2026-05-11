"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const CategoryModels_1 = require("../models/CategoryModels");
const CategoryRepo = data_source_1.AppDataSource.getRepository(CategoryModels_1.Category);
exports.default = {
    async listAll() {
        // Busca todas as categorias ordenadas por nome
        return await CategoryRepo.find({
            order: { name: 'ASC' }
        });
    },
    async getAllCategorys() {
        return await CategoryRepo.find();
    },
    async getCategoryById(id) {
        return await CategoryRepo.findOne({ where: { id } });
    },
    async createCategory(data) {
        const Category = CategoryRepo.create(data);
        return await CategoryRepo.save(Category);
    },
    async updateCategory(id, data) {
        const Category = await CategoryRepo.findOne({ where: { id } });
        if (!Category)
            return null;
        CategoryRepo.merge(Category, data);
        return await CategoryRepo.save(Category);
    },
    async deleteCategory(id) {
        const result = await CategoryRepo.delete(id);
        return result.affected && result.affected > 0;
    },
};
