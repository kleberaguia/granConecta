import { AppDataSource } from "../config/data-source";
import { Content } from "../models/ContentModels";

const contentRepo = AppDataSource.getRepository(Content);

export default {
  async getAllContents() {
    return await contentRepo.find({ relations: ["secao"] });
  },

  async getContentById(id: number) {
    return await contentRepo.findOne({ where: { id }, relations: ["secao"] });
  },

  async createContent(data: Partial<Content>) {
    const content = contentRepo.create(data);
    return await contentRepo.save(content);
  },

  async updateContent(id: number, data: Partial<Content>) {
    const content = await contentRepo.findOne({ where: { id } });
    if (!content) return null;
    contentRepo.merge(content, data);
    return await contentRepo.save(content);
  },

  async deleteContent(id: number) {
    const result = await contentRepo.delete(id);
    return result.affected && result.affected > 0;
  },

  async getContentsBySection(sectionId: number) {
    return await contentRepo.find({ where: { section: { id: sectionId } } });
  }
};
