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
exports.Parcela = void 0;
// src/models/ParcelaModel.ts
const typeorm_1 = require("typeorm");
const servicoOfertaModels_1 = require("./servicoOfertaModels");
let Parcela = class Parcela {
};
exports.Parcela = Parcela;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Parcela.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Parcela.prototype, "servicoOfertaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => servicoOfertaModels_1.ServicoOferta),
    (0, typeorm_1.JoinColumn)({ name: "servicoOfertaId" }),
    __metadata("design:type", servicoOfertaModels_1.ServicoOferta)
], Parcela.prototype, "servicoOferta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Parcela.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Parcela.prototype, "data_vencimento", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Parcela.prototype, "paga", void 0);
exports.Parcela = Parcela = __decorate([
    (0, typeorm_1.Entity)("parcelas")
], Parcela);
