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
exports.Post = exports.PostVisibilidade = exports.PostStatus = exports.PostCategoria = void 0;
const typeorm_1 = require("typeorm");
const PostMidia_1 = require("./PostMidia");
const PostInteresse_1 = require("./PostInteresse");
const PostGaragem_1 = require("./PostGaragem");
const PostDesapega_1 = require("./PostDesapega");
const PostAnimal_1 = require("./PostAnimal");
const UserModels_1 = require("./UserModels");
const PostTargetModels_1 = require("./PostTargetModels");
var PostCategoria;
(function (PostCategoria) {
    PostCategoria["VAGA_GARAGEM"] = "VAGA_GARAGEM";
    PostCategoria["DESAPEGA"] = "DESAPEGA";
    PostCategoria["ANIMAIS"] = "ANIMAIS";
    PostCategoria["SERVICOS"] = "SERVICOS";
    PostCategoria["OUTROS"] = "OUTROS";
})(PostCategoria || (exports.PostCategoria = PostCategoria = {}));
var PostStatus;
(function (PostStatus) {
    PostStatus["ATIVO"] = "ATIVO";
    PostStatus["PAUSADO"] = "PAUSADO";
    PostStatus["FECHADO"] = "FECHADO";
    PostStatus["REMOVIDO"] = "REMOVIDO";
})(PostStatus || (exports.PostStatus = PostStatus = {}));
var PostVisibilidade;
(function (PostVisibilidade) {
    PostVisibilidade["CONDOMINIO"] = "CONDOMINIO";
    PostVisibilidade["REDE"] = "REDE";
    PostVisibilidade["ALVO"] = "ALVO";
})(PostVisibilidade || (exports.PostVisibilidade = PostVisibilidade = {}));
let Post = class Post {
};
exports.Post = Post;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], Post.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "condominio_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], Post.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "autor_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], Post.prototype, "autor_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "autor_id" }) // Isso diz ao TypeORM que 'autor' se liga via 'autor_id'
    ,
    __metadata("design:type", UserModels_1.Usuario)
], Post.prototype, "autor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: PostCategoria }),
    __metadata("design:type", String)
], Post.prototype, "categoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Post.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Post.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: PostStatus, default: PostStatus.ATIVO }),
    __metadata("design:type", String)
], Post.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "tinyint", width: 1, default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "destaque", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "createdAt", type: "timestamp" }),
    __metadata("design:type", Date)
], Post.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updatedAt", type: "timestamp" }),
    __metadata("design:type", Date)
], Post.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostMidia_1.PostMidia, (m) => m.post, { cascade: true }),
    __metadata("design:type", Array)
], Post.prototype, "midias", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostInteresse_1.PostInteresse, (i) => i.post),
    __metadata("design:type", Array)
], Post.prototype, "interesses", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => PostGaragem_1.PostGaragem, (g) => g.post),
    __metadata("design:type", PostGaragem_1.PostGaragem)
], Post.prototype, "garagem", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => PostDesapega_1.PostDesapega, (d) => d.post),
    __metadata("design:type", PostDesapega_1.PostDesapega)
], Post.prototype, "desapega", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => PostAnimal_1.PostAnimal, (a) => a.post),
    __metadata("design:type", PostAnimal_1.PostAnimal)
], Post.prototype, "animal", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostTargetModels_1.PostTarget, (target) => target.post),
    __metadata("design:type", Array)
], Post.prototype, "targets", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: PostVisibilidade, default: PostVisibilidade.CONDOMINIO }),
    __metadata("design:type", String)
], Post.prototype, "visibilidade", void 0);
exports.Post = Post = __decorate([
    (0, typeorm_1.Entity)({ name: "posts" }),
    (0, typeorm_1.Index)(["condominio_id", "categoria", "status"]),
    (0, typeorm_1.Index)(["condominio_id", "createdAt"])
], Post);
