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
exports.DeliveryConfig = void 0;
const typeorm_1 = require("typeorm");
const StoreModels_1 = require("./StoreModels"); // Importe sua entidade de Loja
let DeliveryConfig = class DeliveryConfig {
};
exports.DeliveryConfig = DeliveryConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DeliveryConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], DeliveryConfig.prototype, "acceptDelivery", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], DeliveryConfig.prototype, "acceptPickup", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryConfig.prototype, "deliveryFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryConfig.prototype, "estimatedTime", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryConfig.prototype, "minOrderValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", String)
], DeliveryConfig.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => StoreModels_1.Store, (store) => store.deliveryConfig),
    (0, typeorm_1.JoinColumn)({ name: "storeId" }),
    __metadata("design:type", StoreModels_1.Store)
], DeliveryConfig.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DeliveryConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DeliveryConfig.prototype, "updatedAt", void 0);
exports.DeliveryConfig = DeliveryConfig = __decorate([
    (0, typeorm_1.Entity)("delivery_configs")
], DeliveryConfig);
