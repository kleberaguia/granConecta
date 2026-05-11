"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const ContentModels_1 = require("../models/ContentModels");
const contentRepo = data_source_1.AppDataSource.getRepository(ContentModels_1.Content);
exports.default = {
    async getAllContents() {
        return await contentRepo.find({ relations: ["secao"] });
    },
    async getContentById(id) {
        return await contentRepo.findOne({ where: { id }, relations: ["secao"] });
    },
    async createContent(data) {
        const content = contentRepo.create(data);
        return await contentRepo.save(content);
    },
    async updateContent(id, data) {
        const content = await contentRepo.findOne({ where: { id } });
        if (!content)
            return null;
        contentRepo.merge(content, data);
        return await contentRepo.save(content);
    },
    async deleteContent(id) {
        const result = await contentRepo.delete(id);
        return result.affected && result.affected > 0;
    },
    async getContentsBySection(sectionId) {
        return await contentRepo.find({ where: { section: { id: sectionId } } });
    }
};
