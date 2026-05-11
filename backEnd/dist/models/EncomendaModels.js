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
exports.Encomenda = void 0;
const typeorm_1 = require("typeorm");
// Importe as suas entidades de Usuário e Condomínio
// Ajuste os caminhos conforme a estrutura das suas pastas
const UserModels_1 = require("../models/UserModels");
const condominiosModels_1 = require("../models/condominiosModels");
let Encomenda = class Encomenda {
};
exports.Encomenda = Encomenda;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Encomenda.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Encomenda.prototype, "codigoRastreio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Encomenda.prototype, "transportadora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Encomenda.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'PENDENTE' }) // PENDENTE ou ENTREGUE
    ,
    __metadata("design:type", String)
], Encomenda.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Encomenda.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Encomenda.prototype, "morador_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Encomenda.prototype, "porteiro_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => condominiosModels_1.Condominio),
    (0, typeorm_1.JoinColumn)({ name: 'condominio_id' }),
    __metadata("design:type", condominiosModels_1.Condominio)
], Encomenda.prototype, "condominio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'morador_id' }),
    __metadata("design:type", UserModels_1.Usuario)
], Encomenda.prototype, "morador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'porteiro_id' }),
    __metadata("design:type", UserModels_1.Usuario)
], Encomenda.prototype, "porteiro", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Encomenda.prototype, "quemRetirou", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Encomenda.prototype, "dataRetirada", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Encomenda.prototype, "dataRecebimento", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Encomenda.prototype, "updatedAt", void 0);
exports.Encomenda = Encomenda = __decorate([
    (0, typeorm_1.Entity)('encomendas')
], Encomenda);
