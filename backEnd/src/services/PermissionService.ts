import { AppDataSource } from "../config/data-source";
import { Permission } from "../models/PermissionModels";

const permissionRepo = AppDataSource.getRepository(Permission);

export default {
  async getAllPermissions() {
    return await permissionRepo.find();
  },

  async getPermissionById(id: number) {
    return await permissionRepo.findOne({ where: { id } });
  },

  async createPermission(data: Partial<Permission>) {
    const permission = permissionRepo.create(data);
    return await permissionRepo.save(permission);
  },

  async updatePermission(id: number, data: Partial<Permission>) {
    const permission = await permissionRepo.findOne({ where: { id } });
    if (!permission) return null;
    permissionRepo.merge(permission, data);
    return await permissionRepo.save(permission);
  },

  async deletePermission(id: number) {
    const result = await permissionRepo.delete(id);
    return result.affected && result.affected > 0;
  }
};
