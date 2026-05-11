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
exports.StorePaymentConfig = void 0;
const typeorm_1 = require("typeorm");
const StoreModels_1 = require("./StoreModels");
let StorePaymentConfig = class StorePaymentConfig {
};
exports.StorePaymentConfig = StorePaymentConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StorePaymentConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StorePaymentConfig.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => StoreModels_1.Store),
    (0, typeorm_1.JoinColumn)({ name: "store_id" }),
    __metadata("design:type", StoreModels_1.Store)
], StorePaymentConfig.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StorePaymentConfig.prototype, "pix_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StorePaymentConfig.prototype, "pix_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StorePaymentConfig.prototype, "cash_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StorePaymentConfig.prototype, "card_terminal_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StorePaymentConfig.prototype, "mercado_pago_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StorePaymentConfig.prototype, "stripe_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json", nullable: true }),
    __metadata("design:type", Array)
], StorePaymentConfig.prototype, "accepted_methods", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StorePaymentConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StorePaymentConfig.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StorePaymentConfig.prototype, "mercadoPagoAccessToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StorePaymentConfig.prototype, "mercadoPagoEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], StorePaymentConfig.prototype, "stripe_secret_key", void 0);
exports.StorePaymentConfig = StorePaymentConfig = __decorate([
    (0, typeorm_1.Entity)("store_payment_config")
], StorePaymentConfig);
