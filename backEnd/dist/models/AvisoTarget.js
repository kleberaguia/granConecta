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
exports.AvisoTarget = void 0;
const typeorm_1 = require("typeorm");
const AvisoModels_1 = require("./AvisoModels");
let AvisoTarget = class AvisoTarget {
};
exports.AvisoTarget = AvisoTarget;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "aviso_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], AvisoTarget.prototype, "avisoId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "condominio_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], AvisoTarget.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AvisoModels_1.Aviso, (a) => a.targets, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "aviso_id" }),
    __metadata("design:type", AvisoModels_1.Aviso)
], AvisoTarget.prototype, "aviso", void 0);
exports.AvisoTarget = AvisoTarget = __decorate([
    (0, typeorm_1.Entity)({ name: "aviso_targets" })
], AvisoTarget);
