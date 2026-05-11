"use strict";
// src/models/servicoSolicitacaoModels.ts
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
exports.ServicoSolicitacao = void 0;
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
const ServicoCategoriaModels_1 = require("./ServicoCategoriaModels"); // Assumindo que você tem esta entity
let ServicoSolicitacao = class ServicoSolicitacao {
};
exports.ServicoSolicitacao = ServicoSolicitacao;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, (usuario) => usuario.servicosSolicitados),
    (0, typeorm_1.JoinColumn)({ name: "usuarioId" }),
    __metadata("design:type", UserModels_1.Usuario)
], ServicoSolicitacao.prototype, "morador", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ServicoCategoriaModels_1.ServicoTipo),
    (0, typeorm_1.JoinColumn)({ name: "tipoId" }),
    __metadata("design:type", ServicoCategoriaModels_1.ServicoTipo)
], ServicoSolicitacao.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "tipoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, (usuario) => usuario.servicosComoPrestador),
    (0, typeorm_1.JoinColumn)({ name: "prestadorEscolhidoId" }),
    __metadata("design:type", UserModels_1.Usuario)
], ServicoSolicitacao.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "prestadorEscolhidoId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: [
            "BUSCANDO_PRESTADOR",
            "CANDIDATOS",
            "PRESTADOR_ESCOLHIDO",
            "EM_ANDAMENTO",
            "CONCLUIDO",
            "CANCELADO",
        ],
        default: "BUSCANDO_PRESTADOR",
    }),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ServicoSolicitacao.prototype, "valor_sugerido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ServicoSolicitacao.prototype, "valor_final", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServicoSolicitacao.prototype, "createdAt", void 0);
exports.ServicoSolicitacao = ServicoSolicitacao = __decorate([
    (0, typeorm_1.Entity)("servico_solicitacao")
], ServicoSolicitacao);
