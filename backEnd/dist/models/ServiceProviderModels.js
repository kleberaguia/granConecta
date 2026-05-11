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
exports.ServiceProvider = exports.ServicePlan = void 0;
// src/entities/ServiceProvider.ts
const typeorm_1 = require("typeorm");
var ServicePlan;
(function (ServicePlan) {
    ServicePlan["BASIC"] = "BASIC";
    ServicePlan["INTERMEDIATE"] = "INTERMEDIATE";
    ServicePlan["PREMIUM"] = "PREMIUM"; // Hero + Carrossel Netflix
})(ServicePlan || (exports.ServicePlan = ServicePlan = {}));
let ServiceProvider = class ServiceProvider {
};
exports.ServiceProvider = ServiceProvider;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceProvider.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceProvider.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "photoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "heroImage", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceProvider.prototype, "categoryTag", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ServicePlan,
        default: ServicePlan.BASIC
    }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)("json", { nullable: true }),
    __metadata("design:type", Object)
], ServiceProvider.prototype, "attributes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ServiceProvider.prototype, "isHeroActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "whatsapp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServiceProvider.prototype, "createdAt", void 0);
exports.ServiceProvider = ServiceProvider = __decorate([
    (0, typeorm_1.Entity)("service_providers")
], ServiceProvider);
