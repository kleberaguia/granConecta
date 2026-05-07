import { Repository } from "typeorm";
import { StorePaymentConfig } from "../models/StorePaymentConfigModels";

export class StorePaymentConfigService {
  constructor(private repo: Repository<StorePaymentConfig>) {}

  async getByStore(storeId: string) {
    return this.repo.findOne({
      where: { store_id: storeId }
    });
  }

  async createOrUpdate(storeId: string, data: Partial<StorePaymentConfig>) {
    let config = await this.repo.findOne({ where: { store_id: storeId } });

    if (!config) {
      config = this.repo.create({ store_id: storeId, ...data });
    } else {
      Object.assign(config, data);
    }

    return this.repo.save(config);
  }
}