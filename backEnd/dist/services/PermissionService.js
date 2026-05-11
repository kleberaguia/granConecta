"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const PermissionModels_1 = require("../models/PermissionModels");
const permissionRepo = data_source_1.AppDataSource.getRepository(PermissionModels_1.Permission);
exports.default = {
    async getAllPermissions() {
        return await permissionRepo.find();
    },
    async getPermissionById(id) {
        return await permissionRepo.findOne({ where: { id } });
    },
    async createPermission(data) {
        const permission = permissionRepo.create(data);
        return await permissionRepo.save(permission);
    },
    async updatePermission(id, data) {
        const permission = await permissionRepo.findOne({ where: { id } });
        if (!permission)
            return null;
        permissionRepo.merge(permission, data);
        return await permissionRepo.save(permission);
    },
    async deletePermission(id) {
        const result = await permissionRepo.delete(id);
        return result.affected && result.affected > 0;
    }
};
