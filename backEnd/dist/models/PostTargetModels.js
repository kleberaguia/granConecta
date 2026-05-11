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
exports.PostTarget = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./Post");
const condominiosModels_1 = require("./condominiosModels");
let PostTarget = class PostTarget {
};
exports.PostTarget = PostTarget;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PostTarget.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Post_1.Post, (post) => post.targets, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "post_id" }),
    __metadata("design:type", Post_1.Post)
], PostTarget.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => condominiosModels_1.Condominio, (condominio) => condominio.postTargets, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "condominio_id" }),
    __metadata("design:type", condominiosModels_1.Condominio)
], PostTarget.prototype, "condominio", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], PostTarget.prototype, "createdAt", void 0);
exports.PostTarget = PostTarget = __decorate([
    (0, typeorm_1.Entity)("post_targets")
], PostTarget);
