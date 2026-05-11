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
exports.ImagemGaleria = void 0;
// /src/models/ImagemGaleria.ts
const typeorm_1 = require("typeorm");
const secaoModels_1 = require("./secaoModels");
let ImagemGaleria = class ImagemGaleria {
};
exports.ImagemGaleria = ImagemGaleria;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ImagemGaleria.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }) // Garantindo que 'ordem' é lido como INT
    ,
    __metadata("design:type", Number)
], ImagemGaleria.prototype, "ordem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }) // 👈 CORREÇÃO: Especificar o tipo
    ,
    __metadata("design:type", String)
], ImagemGaleria.prototype, "url_imagem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }) // 👈 CORREÇÃO: Especificar o tipo
    ,
    __metadata("design:type", String)
], ImagemGaleria.prototype, "alt_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }) // 👈 CORREÇÃO: Especificar o tipo e manter nullable
    ,
    __metadata("design:type", Object)
], ImagemGaleria.prototype, "legenda", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ImagemGaleria.prototype, "secao_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => secaoModels_1.Secao, secao => secao.imagens, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'secao_id' }),
    __metadata("design:type", secaoModels_1.Secao)
], ImagemGaleria.prototype, "secao", void 0);
exports.ImagemGaleria = ImagemGaleria = __decorate([
    (0, typeorm_1.Entity)('galeria_imagens')
], ImagemGaleria);
