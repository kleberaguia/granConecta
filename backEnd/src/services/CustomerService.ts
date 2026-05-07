import { AppDataSource } from "../config/data-source";
import { Customer } from "../models/CustomerModels";

const customerRepo = AppDataSource.getRepository(Customer);

export default {
  async getAllCustomers() {
    return await customerRepo.find();
  },

  async getCustomerById(id: number) {
    return await customerRepo.findOne({ where: { id } });
  },

  async createCustomer(data: Partial<Customer>) {
    const customer = customerRepo.create(data);
    return await customerRepo.save(customer);
  },

  async updateCustomer(id: number, data: Partial<Customer>) {
    const customer = await customerRepo.findOne({ where: { id } });
    if (!customer) return null;
    customerRepo.merge(customer, data);
    return await customerRepo.save(customer);
  },

  async deleteCustomer(id: number) {
    const result = await customerRepo.delete(id);
    return result.affected && result.affected > 0;
  }
};
