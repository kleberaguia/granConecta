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
exports.Subscription = exports.Frequencia = exports.SubscriptionStatus = void 0;
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
const ChargeModel_1 = require("./ChargeModel");
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["PENDING"] = "pending";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var Frequencia;
(function (Frequencia) {
    Frequencia["MONTHLY"] = "mensal";
    Frequencia["ANNUAL"] = "anual";
})(Frequencia || (exports.Frequencia = Frequencia = {}));
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subscription.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, (u) => u.subscriptions),
    (0, typeorm_1.JoinColumn)({ name: 'usuarioId' }),
    __metadata("design:type", UserModels_1.Usuario)
], Subscription.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: ['PRESTADOR', 'LOJA'] }),
    __metadata("design:type", String)
], Subscription.prototype, "tipo_objeto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: ["BASICO", "INTERMEDIARIO", "PREMIUM"] }),
    __metadata("design:type", String)
], Subscription.prototype, "plano", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: ["mensal", "anual"] }),
    __metadata("design:type", String)
], Subscription.prototype, "frequencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "pending" }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], Subscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], Subscription.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Subscription.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChargeModel_1.Charge, (charge) => charge.subscription),
    __metadata("design:type", Array)
], Subscription.prototype, "charges", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)("subscriptions")
], Subscription);
