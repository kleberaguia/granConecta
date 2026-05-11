"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanService = void 0;
const data_source_1 = require("../config/data-source");
const PlanModel_1 = require("../models/PlanModel");
class PlanService {
    constructor() {
        this.repo = data_source_1.AppDataSource.getRepository(PlanModel_1.Plan);
    }
    async create(data) {
        const plan = this.repo.create(data);
        return this.repo.save(plan);
    }
    async findAll() {
        return this.repo.find({ where: { ativo: true } });
    }
    async findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        return this.repo.update(id, { ativo: false });
    }
}
exports.PlanService = PlanService;
