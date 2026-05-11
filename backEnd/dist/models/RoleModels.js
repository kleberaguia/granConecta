"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
// src/entities/Role.ts
const typeorm_1 = require("typeorm");
const PermissionModels_1 = require("./PermissionModels"); // Certifique-se que este import está correto
const UserModels_1 = require("./UserModels"); // Certifique-se que este import está correto
let Role = class Role {
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Role.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => PermissionModels_1.Permission, permission => permission.roles),
    (0, typeorm_1.JoinTable)({
        // --- CORREÇÕES AQUI ---
        name: 'role_permissions_permission_map', // 1. Nome exato da tabela da migration
        joinColumn: { name: 'roleId' }, // 2. Nome exato da coluna da migration
        inverseJoinColumn: { name: 'permissionId' } // 3. Nome exato da coluna da migration
    }),
    __metadata("design:type", Array)
], Role.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserModels_1.Usuario, user => user.tipo),
    __metadata("design:type", Array)
], Role.prototype, "user", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)()
], Role);
