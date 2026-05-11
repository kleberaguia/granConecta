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
exports.CreditTransactions = exports.TransactionType = void 0;
// src/models/CreditTransactions.ts
const typeorm_1 = require("typeorm");
const UserModels_1 = require("./UserModels");
var TransactionType;
(function (TransactionType) {
    TransactionType["REFUND"] = "REFUND";
    TransactionType["USAGE"] = "USAGE";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["BONUS"] = "BONUS";
    TransactionType["MANUAL_ADJUST"] = "MANUAL_ADJUST"; // Ajuste feito pelo Admin
})(TransactionType || (exports.TransactionType = TransactionType = {}));
let CreditTransactions = class CreditTransactions {
};
exports.CreditTransactions = CreditTransactions;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CreditTransactions.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], CreditTransactions.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: TransactionType }),
    __metadata("design:type", String)
], CreditTransactions.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], CreditTransactions.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: "usuarioId" }),
    __metadata("design:type", UserModels_1.Usuario)
], CreditTransactions.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CreditTransactions.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CreditTransactions.prototype, "created_at", void 0);
exports.CreditTransactions = CreditTransactions = __decorate([
    (0, typeorm_1.Entity)("credit_transactions")
], CreditTransactions);
