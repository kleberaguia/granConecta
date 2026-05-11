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
exports.Category = void 0;
const typeorm_1 = require("typeorm");
const ProdutoModels_1 = require("./ProdutoModels");
const StoreModels_1 = require("./StoreModels");
const GrupoHomeModel_1 = require("./GrupoHomeModel");
let Category = class Category {
};
exports.Category = Category;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Category.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'PRODUTO' }),
    __metadata("design:type", String)
], Category.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], Category.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StoreModels_1.Store, (store) => store.categories, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "storeId" }),
    __metadata("design:type", StoreModels_1.Store)
], Category.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProdutoModels_1.Product, (product) => product.category),
    __metadata("design:type", Array)
], Category.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StoreModels_1.Store, (store) => store.category),
    __metadata("design:type", Array)
], Category.prototype, "stores", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GrupoHomeModel_1.GrupoHome, (grupo) => grupo.categorias),
    (0, typeorm_1.JoinColumn)({ name: "grupo_id" }),
    __metadata("design:type", GrupoHomeModel_1.GrupoHome)
], Category.prototype, "grupo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Category.prototype, "grupo_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "urlCategoria", nullable: true }),
    __metadata("design:type", String)
], Category.prototype, "urlCategoria", void 0);
exports.Category = Category = __decorate([
    (0, typeorm_1.Entity)("categories")
], Category);
