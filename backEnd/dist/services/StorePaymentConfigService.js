"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorePaymentConfigService = void 0;
class StorePaymentConfigService {
    constructor(repo) {
        this.repo = repo;
    }
    async getByStore(storeId) {
        return this.repo.findOne({
            where: { store_id: storeId }
        });
    }
    async createOrUpdate(storeId, data) {
        let config = await this.repo.findOne({ where: { store_id: storeId } });
        if (!config) {
            config = this.repo.create({ store_id: storeId, ...data });
        }
        else {
            Object.assign(config, data);
        }
        return this.repo.save(config);
    }
}
exports.StorePaymentConfigService = StorePaymentConfigService;
