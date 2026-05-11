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
exports.ServicoSolicitacao = void 0;
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
const AvaliacaoModel_1 = require("./AvaliacaoModel");
const servicoOfertaModels_1 = require("./servicoOfertaModels");
const condominiosModels_1 = require("./condominiosModels");
const servicoCandidatura_1 = require("./servicoCandidatura");
const CategoryModels_1 = require("./CategoryModels");
let ServicoSolicitacao = class ServicoSolicitacao {
};
exports.ServicoSolicitacao = ServicoSolicitacao;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "id", void 0);
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
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ServicoSolicitacao.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "usuarioId" }),
    __metadata("design:type", UserModels_1.Usuario)
], ServicoSolicitacao.prototype, "morador", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, (usuario) => usuario.servicosComoPrestador, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'prestadorId' }),
    __metadata("design:type", UserModels_1.Usuario)
], ServicoSolicitacao.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServicoSolicitacao.prototype, "prestadorId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AvaliacaoModel_1.Avaliacao, (avaliacao) => avaliacao.servico),
    __metadata("design:type", AvaliacaoModel_1.Avaliacao)
], ServicoSolicitacao.prototype, "avaliacao", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => servicoCandidatura_1.ServicoCandidatura, (candidatura) => candidatura.solicitacao),
    __metadata("design:type", Array)
], ServicoSolicitacao.prototype, "candidaturas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => servicoOfertaModels_1.ServicoOferta, (oferta) => oferta.solicitacao),
    __metadata("design:type", Array)
], ServicoSolicitacao.prototype, "ofertas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], ServicoSolicitacao.prototype, "progresso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'condominio_id', type: 'varchar', nullable: true }) // 👈 nullable: true é a chave
    ,
    __metadata("design:type", Object)
], ServicoSolicitacao.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => condominiosModels_1.Condominio),
    (0, typeorm_1.JoinColumn)({ name: "condominio_id" }),
    __metadata("design:type", condominiosModels_1.Condominio)
], ServicoSolicitacao.prototype, "condominio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "categoriaId" }) // Mapeia o nome físico da coluna no MySQL
    ,
    __metadata("design:type", Number)
], ServicoSolicitacao.prototype, "categoriaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CategoryModels_1.Category),
    (0, typeorm_1.JoinColumn)({ name: "categoriaId" }) // Vincula a relação à nova coluna
    ,
    __metadata("design:type", CategoryModels_1.Category)
], ServicoSolicitacao.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ServicoSolicitacao.prototype, "metadata", void 0);
exports.ServicoSolicitacao = ServicoSolicitacao = __decorate([
    (0, typeorm_1.Entity)("servico_solicitacao")
], ServicoSolicitacao);
