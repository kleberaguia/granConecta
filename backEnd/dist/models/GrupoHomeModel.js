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
exports.GrupoHome = void 0;
const typeorm_1 = require("typeorm");
const CategoryModels_1 = require("./CategoryModels"); // Importe sua classe de Categoria
let GrupoHome = class GrupoHome {
};
exports.GrupoHome = GrupoHome;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GrupoHome.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GrupoHome.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], GrupoHome.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], GrupoHome.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CategoryModels_1.Category, (categoria) => categoria.grupo),
    __metadata("design:type", Array)
], GrupoHome.prototype, "categorias", void 0);
exports.GrupoHome = GrupoHome = __decorate([
    (0, typeorm_1.Entity)("grupos_home")
], GrupoHome);
