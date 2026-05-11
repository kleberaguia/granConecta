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
exports.ServicoCandidatura = void 0;
const typeorm_1 = require("typeorm");
const servicoSolicitacaoModels_1 = require("./servicoSolicitacaoModels");
const UserModels_1 = require("./UserModels");
let ServicoCandidatura = class ServicoCandidatura {
};
exports.ServicoCandidatura = ServicoCandidatura;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ServicoCandidatura.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => servicoSolicitacaoModels_1.ServicoSolicitacao),
    (0, typeorm_1.JoinColumn)({ name: "solicitacaoId" }),
    __metadata("design:type", servicoSolicitacaoModels_1.ServicoSolicitacao)
], ServicoCandidatura.prototype, "solicitacao", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoCandidatura.prototype, "solicitacaoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "prestadorId" }),
    __metadata("design:type", UserModels_1.Usuario)
], ServicoCandidatura.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoCandidatura.prototype, "prestadorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ServicoCandidatura.prototype, "valor_proposto", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ServicoCandidatura.prototype, "escolhido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ServicoCandidatura.prototype, "mensagem", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["PENDENTE", "RECUSADO", "PROPOSTA_MORADOR", "ACORDO_FECHADO"],
        default: "PENDENTE"
    }),
    __metadata("design:type", String)
], ServicoCandidatura.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServicoCandidatura.prototype, "createdAt", void 0);
exports.ServicoCandidatura = ServicoCandidatura = __decorate([
    (0, typeorm_1.Entity)("servico_candidatura")
], ServicoCandidatura);
