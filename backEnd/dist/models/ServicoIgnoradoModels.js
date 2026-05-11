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
exports.ServicoIgnorado = void 0;
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
const servicoSolicitacaoModels_1 = require("./servicoSolicitacaoModels");
let ServicoIgnorado = class ServicoIgnorado {
};
exports.ServicoIgnorado = ServicoIgnorado;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServicoIgnorado.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServicoIgnorado.prototype, "prestadorId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ServicoIgnorado.prototype, "solicitacaoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    __metadata("design:type", UserModels_1.Usuario)
], ServicoIgnorado.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => servicoSolicitacaoModels_1.ServicoSolicitacao),
    __metadata("design:type", servicoSolicitacaoModels_1.ServicoSolicitacao)
], ServicoIgnorado.prototype, "solicitacao", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServicoIgnorado.prototype, "data_rejeicao", void 0);
exports.ServicoIgnorado = ServicoIgnorado = __decorate([
    (0, typeorm_1.Entity)("servico_ignorado")
], ServicoIgnorado);
