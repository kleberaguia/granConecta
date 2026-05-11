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
exports.Pagamento = void 0;
// src/models/PagamentoModel.ts
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
const servicoOfertaModels_1 = require("./servicoOfertaModels");
let Pagamento = class Pagamento {
};
exports.Pagamento = Pagamento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Pagamento.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Pagamento.prototype, "ofertaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => servicoOfertaModels_1.ServicoOferta),
    (0, typeorm_1.JoinColumn)({ name: "ofertaId" }),
    __metadata("design:type", servicoOfertaModels_1.ServicoOferta)
], Pagamento.prototype, "oferta", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Pagamento.prototype, "prestadorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "prestadorId" }),
    __metadata("design:type", UserModels_1.Usuario)
], Pagamento.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "moradorId" }) // ✅ ADICIONE O NAME AQUI
    ,
    __metadata("design:type", String)
], Pagamento.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "moradorId" }) // ✅ MUDE DE usuarioId PARA moradorId AQUI TAMBÉM
    ,
    __metadata("design:type", UserModels_1.Usuario)
], Pagamento.prototype, "morador", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Pagamento.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["PENDENTE", "PAGO", "CANCELADO", "ESTORNADO"],
        default: "PENDENTE",
    }),
    __metadata("design:type", String)
], Pagamento.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Pagamento.prototype, "link_pagamento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Pagamento.prototype, "transacao_gateway_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Pagamento.prototype, "createdAt", void 0);
exports.Pagamento = Pagamento = __decorate([
    (0, typeorm_1.Entity)("pagamentos")
], Pagamento);
