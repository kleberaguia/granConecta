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
exports.Avaliacao = void 0;
const typeorm_1 = require("typeorm");
const servicoSolicitacaoModels_1 = require("./servicoSolicitacaoModels");
const UserModels_1 = require("./UserModels");
let Avaliacao = class Avaliacao {
};
exports.Avaliacao = Avaliacao;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Avaliacao.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Avaliacao.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Avaliacao.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)("ServicoSolicitacao", (servico) => servico.avaliacao),
    (0, typeorm_1.JoinColumn)({ name: 'servicoId' }),
    __metadata("design:type", servicoSolicitacaoModels_1.ServicoSolicitacao)
], Avaliacao.prototype, "servico", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Avaliacao.prototype, "servicoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, (usuario) => usuario.avaliacoesFeitas),
    (0, typeorm_1.JoinColumn)({ name: 'usuarioId' }),
    __metadata("design:type", UserModels_1.Usuario)
], Avaliacao.prototype, "morador", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Avaliacao.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, (usuario) => usuario.avaliacoesRecebidas),
    (0, typeorm_1.JoinColumn)({ name: 'prestadorId' }),
    __metadata("design:type", UserModels_1.Usuario)
], Avaliacao.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Avaliacao.prototype, "prestadorId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Avaliacao.prototype, "nota", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Avaliacao.prototype, "comentario", void 0);
exports.Avaliacao = Avaliacao = __decorate([
    (0, typeorm_1.Entity)('avaliacoes')
], Avaliacao);
