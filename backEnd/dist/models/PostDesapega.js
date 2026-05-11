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
exports.PostDesapega = exports.DesapegaCondicao = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./Post");
var DesapegaCondicao;
(function (DesapegaCondicao) {
    DesapegaCondicao["NOVO"] = "NOVO";
    DesapegaCondicao["SEMINOVO"] = "SEMINOVO";
    DesapegaCondicao["USADO"] = "USADO";
    DesapegaCondicao["PARA_REPARO"] = "PARA_REPARO";
})(DesapegaCondicao || (exports.DesapegaCondicao = DesapegaCondicao = {}));
let PostDesapega = class PostDesapega {
};
exports.PostDesapega = PostDesapega;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "post_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostDesapega.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Post_1.Post, (p) => p.desapega, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "post_id" }),
    __metadata("design:type", Post_1.Post)
], PostDesapega.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: DesapegaCondicao, default: DesapegaCondicao.USADO }),
    __metadata("design:type", String)
], PostDesapega.prototype, "condicao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PostDesapega.prototype, "preco", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "e_doacao", type: "tinyint", width: 1, default: 1 }),
    __metadata("design:type", Number)
], PostDesapega.prototype, "eDoacao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "categoria_item", type: "varchar", length: 80, nullable: true }),
    __metadata("design:type", Object)
], PostDesapega.prototype, "categoriaItem", void 0);
exports.PostDesapega = PostDesapega = __decorate([
    (0, typeorm_1.Entity)({ name: "post_desapega" })
], PostDesapega);
