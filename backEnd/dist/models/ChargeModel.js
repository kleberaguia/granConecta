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
exports.Charge = exports.ChargeStatus = void 0;
// src/entities/Charge.ts
const typeorm_1 = require("typeorm");
const SubscriptionModel_1 = require("./SubscriptionModel");
const UserModels_1 = require("./UserModels");
var ChargeStatus;
(function (ChargeStatus) {
    ChargeStatus["PENDING"] = "pending";
    ChargeStatus["PAID"] = "paid";
    ChargeStatus["FAILED"] = "failed";
    ChargeStatus["CANCELED"] = "canceled";
})(ChargeStatus || (exports.ChargeStatus = ChargeStatus = {}));
let Charge = class Charge {
};
exports.Charge = Charge;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Charge.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Charge.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SubscriptionModel_1.Subscription, (sub) => sub.charges),
    (0, typeorm_1.JoinColumn)({ name: "subscriptionId" }),
    __metadata("design:type", SubscriptionModel_1.Subscription)
], Charge.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Charge.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "usuarioId" }),
    __metadata("design:type", UserModels_1.Usuario)
], Charge.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Charge.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], Charge.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Charge.prototype, "txid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Charge.prototype, "pix_copia_cola", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Charge.prototype, "pago_em", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Charge.prototype, "createdAt", void 0);
exports.Charge = Charge = __decorate([
    (0, typeorm_1.Entity)("charges")
], Charge);
