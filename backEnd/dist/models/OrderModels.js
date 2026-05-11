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
exports.Order = exports.DeliveryMode = exports.OrderType = exports.OrderStatus = void 0;
const typeorm_1 = require("typeorm");
const OrderItemModels_1 = require("./OrderItemModels");
const UserModels_1 = require("./UserModels");
const StoreModels_1 = require("./StoreModels");
// =========================
// STATUS (EXPANDIDO)
// =========================
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pendente";
    OrderStatus["PAID"] = "pago";
    OrderStatus["PREPARING"] = "em_preparo";
    OrderStatus["DELIVERING"] = "em_transporte";
    OrderStatus["DELIVERED"] = "entregue";
    OrderStatus["CANCELED"] = "cancelado";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// =========================
// TIPO DE PEDIDO
// =========================
var OrderType;
(function (OrderType) {
    OrderType["PRODUCT"] = "produto";
    OrderType["SERVICE"] = "servico";
})(OrderType || (exports.OrderType = OrderType = {}));
// =========================
// ENTREGA
// =========================
var DeliveryMode;
(function (DeliveryMode) {
    DeliveryMode["DELIVERY"] = "entrega";
    DeliveryMode["PICKUP"] = "retirada";
})(DeliveryMode || (exports.DeliveryMode = DeliveryMode = {}));
let Order = class Order {
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserModels_1.Usuario, (user) => user.orders, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "customerId" }),
    __metadata("design:type", UserModels_1.Usuario)
], Order.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StoreModels_1.Store, store => store.orders),
    (0, typeorm_1.JoinColumn)({ name: "storeId" }),
    __metadata("design:type", StoreModels_1.Store)
], Order.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => OrderItemModels_1.OrderItem, (item) => item.order, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json", nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "payment_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "deliveryAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DeliveryMode,
        default: DeliveryMode.DELIVERY
    }),
    __metadata("design:type", String)
], Order.prototype, "deliveryMode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: OrderType,
        default: OrderType.PRODUCT
    }),
    __metadata("design:type", String)
], Order.prototype, "orderType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 30 }),
    __metadata("design:type", Number)
], Order.prototype, "estimatedTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "customerNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "condominio_id", nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "condominio_Id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "deliveryCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "deliveryValidationIp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "deliveredAt", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)("orders")
], Order);
