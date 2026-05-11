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
exports.Agenda = exports.StatusAgenda = void 0;
const typeorm_1 = require("typeorm");
const servicoSolicitacaoModels_1 = require("./servicoSolicitacaoModels");
const UserModels_1 = require("./UserModels");
var StatusAgenda;
(function (StatusAgenda) {
    StatusAgenda["SUGERIDO"] = "SUGERIDO";
    StatusAgenda["CONFIRMADO"] = "CONFIRMADO";
    StatusAgenda["CANCELADO"] = "CANCELADO";
})(StatusAgenda || (exports.StatusAgenda = StatusAgenda = {}));
let Agenda = class Agenda {
};
exports.Agenda = Agenda;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Agenda.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => servicoSolicitacaoModels_1.ServicoSolicitacao),
    __metadata("design:type", servicoSolicitacaoModels_1.ServicoSolicitacao)
], Agenda.prototype, "servico", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    __metadata("design:type", UserModels_1.Usuario)
], Agenda.prototype, "morador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    __metadata("design:type", UserModels_1.Usuario)
], Agenda.prototype, "prestador", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Agenda.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Agenda.prototype, "hora", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: StatusAgenda,
        default: StatusAgenda.SUGERIDO
    }),
    __metadata("design:type", String)
], Agenda.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Agenda.prototype, "criadoEm", void 0);
exports.Agenda = Agenda = __decorate([
    (0, typeorm_1.Entity)("agenda")
], Agenda);
