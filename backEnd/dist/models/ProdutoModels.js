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
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const StoreModels_1 = require("./StoreModels");
const CategoryModels_1 = require("./CategoryModels");
// Importe a entidade Store se ela existir para criar o relacionamento
// import { Store } from "./Store"; 
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "stock", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuarioId' }) // ✅ Nova coluna mapeada
    ,
    __metadata("design:type", String)
], Product.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "image_url", nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "store_id" }),
    __metadata("design:type", String)
], Product.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StoreModels_1.Store, (store) => store.products),
    (0, typeorm_1.JoinColumn)({ name: "store_id" }),
    __metadata("design:type", StoreModels_1.Store)
], Product.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "category_id", nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CategoryModels_1.Category, (category) => category.products),
    (0, typeorm_1.JoinColumn)({ name: "category_id" }),
    __metadata("design:type", CategoryModels_1.Category)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'foto_perfil', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "fotoPerfil", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'foto_hero', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "heroUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hero_video', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'section_image', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "sectionImageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hero_carousel', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "carouselImages", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'galeria', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "galeriaImages", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'layoutConfig', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "layoutConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "link_contato", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)("product")
], Product);
