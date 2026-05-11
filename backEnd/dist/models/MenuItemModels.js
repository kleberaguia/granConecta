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
exports.MenuItem = void 0;
// src/entities/MenuItem.ts
const typeorm_1 = require("typeorm");
const MenuModels_1 = require("./MenuModels");
let MenuItem = class MenuItem {
};
exports.MenuItem = MenuItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment') // Mapeia BIGINT UNSIGNED AUTO_INCREMENT
    ,
    __metadata("design:type", Number)
], MenuItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MenuItem.prototype, "ordem", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], MenuItem.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], MenuItem.prototype, "caminho", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'menu_id' }),
    __metadata("design:type", Number)
], MenuItem.prototype, "menuId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MenuModels_1.Menu, menu => menu.itens, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'menu_id' }) // Especifica qual coluna é a FK
    ,
    __metadata("design:type", MenuModels_1.Menu)
], MenuItem.prototype, "menu", void 0);
exports.MenuItem = MenuItem = __decorate([
    (0, typeorm_1.Entity)('menu_itens') // Nome da tabela no banco de dados
], MenuItem);
