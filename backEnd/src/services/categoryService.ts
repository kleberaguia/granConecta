import { AppDataSource } from "../config/data-source";
import { Category } from "../models/CategoryModels";

const CategoryRepo = AppDataSource.getRepository(Category);

export default {

  async listAll() {
    // Busca todas as categorias ordenadas por nome
    return await CategoryRepo.find({
      order: { name: 'ASC' }
    });
  },

  async getAllCategorys() {
    return await CategoryRepo.find();
  },

  async getCategoryById(id: number) {
    return await CategoryRepo.findOne({ where: { id } });
  },

  async createCategory(data: Partial<Category>) {
    const Category = CategoryRepo.create(data);
    return await CategoryRepo.save(Category);
  },

  async updateCategory(id: number, data: Partial<Category>) {
    const Category = await CategoryRepo.findOne({ where: { id } });
    if (!Category) return null;
    CategoryRepo.merge(Category, data);
    return await CategoryRepo.save(Category);
  },

  async deleteCategory(id: number) {
    const result = await CategoryRepo.delete(id);
    return result.affected && result.affected > 0;
  },

};
