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
exports.Menu = void 0;
// src/entities/Menu.ts
const typeorm_1 = require("typeorm");
const MenuItemModels_1 = require("./MenuItemModels"); // Importa a entidade filha
let Menu = class Menu {
};
exports.Menu = Menu;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment') // Mapeia BIGINT UNSIGNED AUTO_INCREMENT
    ,
    __metadata("design:type", Number)
], Menu.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Menu.prototype, "ordem", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Menu.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Menu.prototype, "caminho", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Menu.prototype, "icone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'possui_submenu', default: false }),
    __metadata("design:type", Boolean)
], Menu.prototype, "possuiSubmenu", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MenuItemModels_1.MenuItem, menuItem => menuItem.menu, {
        cascade: true, // Permite salvar/excluir itens filhos ao manipular o pai
        eager: false // CRUCIAL: Busca automaticamente os submenus ao buscar o Menu
    }),
    __metadata("design:type", Array)
], Menu.prototype, "itens", void 0);
exports.Menu = Menu = __decorate([
    (0, typeorm_1.Entity)('menus') // Nome da tabela no banco de dados
], Menu);
