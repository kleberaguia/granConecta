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
exports.Store = void 0;
const typeorm_1 = require("typeorm");
const ProdutoModels_1 = require("./ProdutoModels");
const PerfilPrestadorModel_1 = require("./PerfilPrestadorModel");
const EstiloModels_1 = require("./EstiloModels");
const CategoryModels_1 = require("./CategoryModels");
const OrderModels_1 = require("./OrderModels");
const DeliveryConfig_1 = require("./DeliveryConfig");
const StorePaymentConfigModels_1 = require("./StorePaymentConfigModels");
let Store = class Store {
};
exports.Store = Store;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Store.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "char", length: 36 }),
    __metadata("design:type", String)
], Store.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], Store.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, unique: true }),
    __metadata("design:type", String)
], Store.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "descricao_loja", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "tinyint", width: 1, default: () => "1" }),
    __metadata("design:type", Boolean)
], Store.prototype, "ativa", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "datetime" }),
    __metadata("design:type", Date)
], Store.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "datetime" }),
    __metadata("design:type", Date)
], Store.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "modern" }),
    __metadata("design:type", String)
], Store.prototype, "preset", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json", nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "layoutConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "chave_pix", type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "chave_pix", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "qrcode_pix_url", type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "qrcode_pix_url", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProdutoModels_1.Product, (product) => product.store),
    __metadata("design:type", Array)
], Store.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => PerfilPrestadorModel_1.PerfilPrestador) // ou ManyToOne
    ,
    (0, typeorm_1.JoinColumn)({ name: "usuarioId" }),
    __metadata("design:type", PerfilPrestadorModel_1.PerfilPrestador)
], Store.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "CLEAN_MINIMAL" }),
    __metadata("design:type", String)
], Store.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "logo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "capa_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "longtext", nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "pageHtmlDraft", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "longtext", nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "pageHtmlPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "longtext", nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "pageCssDraft", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "loja" }),
    __metadata("design:type", String)
], Store.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "longtext", nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "pageCssPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json", nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "pageSpecDraft", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json", nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "pageSpecPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "bodyBgColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "footerBgColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "footerTextColor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CategoryModels_1.Category, (category) => category.stores, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "categoriaid" }),
    __metadata("design:type", CategoryModels_1.Category)
], Store.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }) // Permite NULL no Banco de Dados
    ,
    __metadata("design:type", Object)
], Store.prototype, "categoriaid", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CategoryModels_1.Category, (category) => category.store),
    __metadata("design:type", Array)
], Store.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 150, nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "categoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "categoria_tag", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => EstiloModels_1.Estilo),
    (0, typeorm_1.JoinColumn)({ name: "estilo_id" }),
    __metadata("design:type", EstiloModels_1.Estilo)
], Store.prototype, "estilo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => OrderModels_1.Order, order => order.store),
    __metadata("design:type", Array)
], Store.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => DeliveryConfig_1.DeliveryConfig, (deliveryConfig) => deliveryConfig.store),
    __metadata("design:type", DeliveryConfig_1.DeliveryConfig)
], Store.prototype, "deliveryConfig", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => StorePaymentConfigModels_1.StorePaymentConfig, (config) => config.store),
    __metadata("design:type", StorePaymentConfigModels_1.StorePaymentConfig)
], Store.prototype, "paymentConfig", void 0);
exports.Store = Store = __decorate([
    (0, typeorm_1.Entity)("stores")
], Store);
