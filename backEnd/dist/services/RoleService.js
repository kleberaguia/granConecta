"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const RoleModels_1 = require("../models/RoleModels");
const roleRepo = data_source_1.AppDataSource.getRepository(RoleModels_1.Role);
exports.default = {
    async getAllRoles() {
        return await roleRepo.find({ relations: ["permissions"] });
    },
    async getRoleById(id) {
        return await roleRepo.findOne({ where: { id }, relations: ["permissions"] });
    },
    async createRole(data) {
        const role = roleRepo.create(data);
        return await roleRepo.save(role);
    },
    async updateRole(id, data) {
        const role = await roleRepo.findOne({ where: { id } });
        if (!role)
            return null;
        roleRepo.merge(role, data);
        return await roleRepo.save(role);
    },
    async deleteRole(id) {
        const result = await roleRepo.delete(id);
        return result.affected && result.affected > 0;
    }
};
