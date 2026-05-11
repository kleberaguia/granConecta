"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const CustomerModels_1 = require("../models/CustomerModels");
const customerRepo = data_source_1.AppDataSource.getRepository(CustomerModels_1.Customer);
exports.default = {
    async getAllCustomers() {
        return await customerRepo.find();
    },
    async getCustomerById(id) {
        return await customerRepo.findOne({ where: { id } });
    },
    async createCustomer(data) {
        const customer = customerRepo.create(data);
        return await customerRepo.save(customer);
    },
    async updateCustomer(id, data) {
        const customer = await customerRepo.findOne({ where: { id } });
        if (!customer)
            return null;
        customerRepo.merge(customer, data);
        return await customerRepo.save(customer);
    },
    async deleteCustomer(id) {
        const result = await customerRepo.delete(id);
        return result.affected && result.affected > 0;
    }
};
