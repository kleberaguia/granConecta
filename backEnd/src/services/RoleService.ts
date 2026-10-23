import { AppDataSource } from "../config/data-source";
import { Role } from "../models/RoleModels";

const roleRepo = AppDataSource.getRepository(Role);

export default {
  async getAllRoles() {
    return await roleRepo.find({ relations: ["permissions"] });
  },

  async getRoleById(id: number) {
    return await roleRepo.findOne({ where: { id }, relations: ["permissions"] });
  },

  async createRole(data: Partial<Role>) {
    const role = roleRepo.create(data);
    return await roleRepo.save(role);
  },

  async updateRole(id: number, data: Partial<Role>) {
    const role = await roleRepo.findOne({ where: { id } });
    if (!role) return null;
    roleRepo.merge(role, data);
    return await roleRepo.save(role);
  },

  async deleteRole(id: number) {
    const result = await roleRepo.delete(id);
    return result.affected && result.affected > 0;
  }
};
