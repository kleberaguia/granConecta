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
exports.ServicoOferta = void 0;
// src/models/servicoOfertaModels.ts
const typeorm_1 = require("typeorm");
const servicoSolicitacaoModels_1 = require("./servicoSolicitacaoModels");
const UserModels_1 = require("./UserModels");
const ParcelaModel_1 = require("./ParcelaModel");
const PagamentoModel_1 = require("./PagamentoModel");
let ServicoOferta = class ServicoOferta {
};
exports.ServicoOferta = ServicoOferta;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ServicoOferta.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoOferta.prototype, "solicitacaoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => servicoSolicitacaoModels_1.ServicoSolicitacao, solicitacao => solicitacao.candidaturas),
    (0, typeorm_1.JoinColumn)({ name: "solicitacaoId" }),
    __metadata("design:type", servicoSolicitacaoModels_1.ServicoSolicitacao)
], ServicoOferta.prototype, "solicitacao", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoOferta.prototype, "prestadorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "prestadorId" }),
    __metadata("design:type", UserModels_1.Usuario)
], ServicoOferta.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoOferta.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServicoOferta.prototype, "mensagem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ServicoOferta.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["PENDENTE", "ACEITA", "RECUSADA", "EM_ANDAMENTO", "CONCLUIDA"],
        default: "PENDENTE"
    }),
    __metadata("design:type", String)
], ServicoOferta.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServicoOferta.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParcelaModel_1.Parcela, parcela => parcela.servicoOferta),
    __metadata("design:type", Array)
], ServicoOferta.prototype, "parcelas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PagamentoModel_1.Pagamento, (pagamento) => pagamento.oferta),
    __metadata("design:type", Array)
], ServicoOferta.prototype, "pagamentos", void 0);
exports.ServicoOferta = ServicoOferta = __decorate([
    (0, typeorm_1.Entity)("servico_oferta")
], ServicoOferta);
