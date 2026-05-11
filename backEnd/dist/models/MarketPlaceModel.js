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
exports.MarketPlaceModel = void 0;
const typeorm_1 = require("typeorm");
const StoreModels_1 = require("./StoreModels"); // Ajuste conforme seu arquivo
const condominiosModels_1 = require("./condominiosModels");
let MarketPlaceModel = class MarketPlaceModel {
};
exports.MarketPlaceModel = MarketPlaceModel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'int', unsigned: true }),
    __metadata("design:type", Number)
], MarketPlaceModel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "loja_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }) // Remova o 'unsigned: true'
    ,
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "subtitulo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "imagem_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '#3b82f6' }),
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "cor_destaque", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "link_destino", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], MarketPlaceModel.prototype, "data_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], MarketPlaceModel.prototype, "data_fim", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['pendente', 'aprovado', 'recusado'], default: 'pendente' }),
    __metadata("design:type", String)
], MarketPlaceModel.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], MarketPlaceModel.prototype, "pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], MarketPlaceModel.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StoreModels_1.Store),
    (0, typeorm_1.JoinColumn)({ name: 'loja_id' }),
    __metadata("design:type", StoreModels_1.Store)
], MarketPlaceModel.prototype, "loja", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => condominiosModels_1.Condominio),
    (0, typeorm_1.JoinColumn)({ name: 'condominio_id' }),
    __metadata("design:type", condominiosModels_1.Condominio)
], MarketPlaceModel.prototype, "condominio", void 0);
exports.MarketPlaceModel = MarketPlaceModel = __decorate([
    (0, typeorm_1.Entity)({ name: "marketplace_banners" })
], MarketPlaceModel);
