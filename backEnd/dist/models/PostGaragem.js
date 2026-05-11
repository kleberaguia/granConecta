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
exports.PostGaragem = exports.GaragemTipoVaga = exports.GaragemOperacao = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./Post");
var GaragemOperacao;
(function (GaragemOperacao) {
    GaragemOperacao["OFERECO"] = "OFERECO";
    GaragemOperacao["PRECISO"] = "PRECISO";
})(GaragemOperacao || (exports.GaragemOperacao = GaragemOperacao = {}));
var GaragemTipoVaga;
(function (GaragemTipoVaga) {
    GaragemTipoVaga["ALUGUEL"] = "ALUGUEL";
    GaragemTipoVaga["EMPRESTIMO"] = "EMPRESTIMO";
})(GaragemTipoVaga || (exports.GaragemTipoVaga = GaragemTipoVaga = {}));
let PostGaragem = class PostGaragem {
};
exports.PostGaragem = PostGaragem;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "post_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostGaragem.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Post_1.Post, (p) => p.garagem, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "post_id" }),
    __metadata("design:type", Post_1.Post)
], PostGaragem.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: GaragemOperacao }),
    __metadata("design:type", String)
], PostGaragem.prototype, "operacao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "tipo_vaga", type: "enum", enum: GaragemTipoVaga }),
    __metadata("design:type", String)
], PostGaragem.prototype, "tipoVaga", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "valor_mensal", type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PostGaragem.prototype, "valorMensal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], PostGaragem.prototype, "bloco", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "vaga_codigo", type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], PostGaragem.prototype, "vagaCodigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PostGaragem.prototype, "observacoes", void 0);
exports.PostGaragem = PostGaragem = __decorate([
    (0, typeorm_1.Entity)({ name: "post_garagem" })
], PostGaragem);
