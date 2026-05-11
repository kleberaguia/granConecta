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
exports.Condominio = void 0;
const typeorm_1 = require("typeorm");
const PostTargetModels_1 = require("./PostTargetModels");
const EnderecoModel_1 = require("./EnderecoModel");
let Condominio = class Condominio {
};
exports.Condominio = Condominio;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Condominio.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Condominio.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Condominio.prototype, "codigo_acesso", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Condominio.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Condominio.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostTargetModels_1.PostTarget, (target) => target.condominio),
    __metadata("design:type", Array)
], Condominio.prototype, "postTargets", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EnderecoModel_1.Endereco, (endereco) => endereco.condominio),
    __metadata("design:type", Array)
], Condominio.prototype, "endereco", void 0);
exports.Condominio = Condominio = __decorate([
    (0, typeorm_1.Entity)('condominios')
], Condominio);
