import { AppDataSource } from "../config/data-source";
import { Plan } from "../models/PlanModel";

export class PlanService {
  private repo = AppDataSource.getRepository(Plan);

  async create(data: Partial<Plan>) {
    const plan = this.repo.create(data);
    return this.repo.save(plan);
  }

  async findAll() {
    return this.repo.find({ where: { ativo: true } });
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Plan>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string) {
    return this.repo.update(id, { ativo: false });
  }
}