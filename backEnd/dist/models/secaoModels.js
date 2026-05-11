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
exports.Secao = void 0;
// /src/models/Secao.ts
const typeorm_1 = require("typeorm");
const CardModels_1 = require("./CardModels");
const ImagemGaleriaModels_1 = require("./ImagemGaleriaModels");
const ContentModels_1 = require("./ContentModels");
let Secao = class Secao {
};
exports.Secao = Secao;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Secao.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, typeorm_1.Index)() // Adicionamos o índice para a ordem
    ,
    __metadata("design:type", Number)
], Secao.prototype, "ordem", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Secao.prototype, "tipo_secao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Secao.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }) // 👈 ADICIONE type: 'varchar'
    ,
    __metadata("design:type", Object)
], Secao.prototype, "subtitulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Secao.prototype, "conteudo_principal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Secao.prototype, "imagem_principal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], Secao.prototype, "style_overrides", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CardModels_1.Card, card => card.secao),
    __metadata("design:type", Array)
], Secao.prototype, "cards", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ImagemGaleriaModels_1.ImagemGaleria, imagem => imagem.secao),
    __metadata("design:type", Array)
], Secao.prototype, "imagens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ContentModels_1.Content, content => content.section),
    __metadata("design:type", Array)
], Secao.prototype, "contents", void 0);
exports.Secao = Secao = __decorate([
    (0, typeorm_1.Entity)('sec_secoes')
], Secao);
