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
exports.PostView = void 0;
const typeorm_1 = require("typeorm");
let PostView = class PostView {
};
exports.PostView = PostView;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostView.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "post_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostView.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "usuario_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostView.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "visto_em", type: "timestamp" }),
    __metadata("design:type", Date)
], PostView.prototype, "vistoEm", void 0);
exports.PostView = PostView = __decorate([
    (0, typeorm_1.Entity)({ name: "post_views" }),
    (0, typeorm_1.Index)(["postId", "usuarioId"], { unique: true })
], PostView);
