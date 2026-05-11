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
exports.Card = void 0;
// src/models/Card.ts
const typeorm_1 = require("typeorm");
const secaoModels_1 = require("./secaoModels"); // Supondo que você tenha a entidade Secao
let Card = class Card {
};
exports.Card = Card;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Card.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Card.prototype, "ordem", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Card.prototype, "icone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Card.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'link_url', nullable: true }) // Mapeia para link_url no banco
    ,
    __metadata("design:type", String)
], Card.prototype, "linkUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'texto_botao', default: 'Saiba Mais' }),
    __metadata("design:type", String)
], Card.prototype, "textoBotao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'secao_id' }),
    __metadata("design:type", Number)
], Card.prototype, "secaoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => secaoModels_1.Secao, secao => secao.cards),
    (0, typeorm_1.JoinColumn)({ name: 'secao_id' }),
    __metadata("design:type", secaoModels_1.Secao)
], Card.prototype, "secao", void 0);
exports.Card = Card = __decorate([
    (0, typeorm_1.Entity)('cards')
], Card);
