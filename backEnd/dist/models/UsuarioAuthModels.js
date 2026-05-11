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
exports.UsuarioAuth = void 0;
// models/UsuarioAuthModels.ts
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
let UsuarioAuth = class UsuarioAuth {
};
exports.UsuarioAuth = UsuarioAuth;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UsuarioAuth.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], UsuarioAuth.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash' }),
    __metadata("design:type", String)
], UsuarioAuth.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'MORADOR' }),
    __metadata("design:type", String)
], UsuarioAuth.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], UsuarioAuth.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], UsuarioAuth.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'usuarioId' }),
    __metadata("design:type", Promise)
], UsuarioAuth.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], UsuarioAuth.prototype, "emailVerificado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], UsuarioAuth.prototype, "codigoVerificacao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reset_token", type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], UsuarioAuth.prototype, "reset_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reset_token_expires", type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], UsuarioAuth.prototype, "reset_token_expires", void 0);
exports.UsuarioAuth = UsuarioAuth = __decorate([
    (0, typeorm_1.Entity)('usuarios_auth')
], UsuarioAuth);
