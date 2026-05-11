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
exports.Aviso = exports.AvisoVisibilidade = exports.AvisoTipo = void 0;
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
const AvisoTarget_1 = require("./AvisoTarget");
var AvisoTipo;
(function (AvisoTipo) {
    AvisoTipo["GERAL"] = "GERAL";
    AvisoTipo["ASSEMBLEIA"] = "ASSEMBLEIA";
    AvisoTipo["MANUTENCAO"] = "MANUTENCAO";
    AvisoTipo["CLASSIFICADOS"] = "CLASSIFICADOS";
})(AvisoTipo || (exports.AvisoTipo = AvisoTipo = {}));
var AvisoVisibilidade;
(function (AvisoVisibilidade) {
    AvisoVisibilidade["CONDOMINIO"] = "CONDOMINIO";
    AvisoVisibilidade["REDE"] = "REDE";
    AvisoVisibilidade["ALVO"] = "ALVO";
})(AvisoVisibilidade || (exports.AvisoVisibilidade = AvisoVisibilidade = {}));
let Aviso = class Aviso {
};
exports.Aviso = Aviso;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Aviso.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Aviso.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], Aviso.prototype, "conteudo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AvisoTipo,
        default: AvisoTipo.CLASSIFICADOS,
    }),
    __metadata("design:type", String)
], Aviso.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "ATIVO" }) // ATIVO, ENCERRADO, ARQUIVADO
    ,
    __metadata("design:type", String)
], Aviso.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "tinyint", width: 1, default: 0 }),
    __metadata("design:type", Boolean)
], Aviso.prototype, "prioridade", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Aviso.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Aviso.prototype, "autor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AvisoVisibilidade,
        default: AvisoVisibilidade.CONDOMINIO,
    }),
    __metadata("design:type", String)
], Aviso.prototype, "visibilidade", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "autor_id" }),
    __metadata("design:type", UserModels_1.Usuario)
], Aviso.prototype, "autor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AvisoTarget_1.AvisoTarget, (t) => t.aviso, { cascade: true }),
    __metadata("design:type", Array)
], Aviso.prototype, "targets", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Aviso.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Aviso.prototype, "updatedAt", void 0);
exports.Aviso = Aviso = __decorate([
    (0, typeorm_1.Entity)("avisos"),
    (0, typeorm_1.Index)(["condominio_id", "status"]),
    (0, typeorm_1.Index)(["visibilidade", "status"])
], Aviso);
