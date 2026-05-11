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
exports.UserCredits = void 0;
// src/models/UserCredits.ts
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
let UserCredits = class UserCredits {
};
exports.UserCredits = UserCredits;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserCredits.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], UserCredits.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "usuarioId" }) // Vincula a propriedade abaixo à coluna do banco
    ,
    __metadata("design:type", UserModels_1.Usuario)
], UserCredits.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserCredits.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserCredits.prototype, "updated_at", void 0);
exports.UserCredits = UserCredits = __decorate([
    (0, typeorm_1.Entity)("user_credits")
], UserCredits);
