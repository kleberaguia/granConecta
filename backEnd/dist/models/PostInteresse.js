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
exports.PostInteresse = exports.InteresseStatus = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./Post");
var InteresseStatus;
(function (InteresseStatus) {
    InteresseStatus["ENVIADO"] = "ENVIADO";
    InteresseStatus["LIDO"] = "LIDO";
    InteresseStatus["RESPONDIDO"] = "RESPONDIDO";
    InteresseStatus["CANCELADO"] = "CANCELADO";
})(InteresseStatus || (exports.InteresseStatus = InteresseStatus = {}));
let PostInteresse = class PostInteresse {
};
exports.PostInteresse = PostInteresse;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostInteresse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "post_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostInteresse.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Post_1.Post, (p) => p.interesses, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "post_id" }),
    __metadata("design:type", Post_1.Post)
], PostInteresse.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "interessado_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostInteresse.prototype, "interessadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PostInteresse.prototype, "mensagem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: InteresseStatus, default: InteresseStatus.ENVIADO }),
    __metadata("design:type", String)
], PostInteresse.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "createdAt", type: "timestamp" }),
    __metadata("design:type", Date)
], PostInteresse.prototype, "createdAt", void 0);
exports.PostInteresse = PostInteresse = __decorate([
    (0, typeorm_1.Entity)({ name: "post_interesses" }),
    (0, typeorm_1.Index)(["postId", "createdAt"])
], PostInteresse);
