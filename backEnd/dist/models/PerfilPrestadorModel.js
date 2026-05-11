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
exports.PerfilPrestador = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("./enums");
const UserModels_1 = require("./UserModels");
const StoreModels_1 = require("./StoreModels");
const CategoryModels_1 = require("./CategoryModels");
let PerfilPrestador = class PerfilPrestador {
};
exports.PerfilPrestador = PerfilPrestador;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => UserModels_1.Usuario, (u) => u.perfil),
    (0, typeorm_1.JoinColumn)({ name: 'usuarioId' }),
    __metadata("design:type", UserModels_1.Usuario)
], PerfilPrestador.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "nome_profissional", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "descricao_bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 550, nullable: true }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "foto_perfil_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 550, nullable: true }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "foto_hero_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PerfilPrestador.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], PerfilPrestador.prototype, "servicos_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "whatsapp_comercial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PerfilPrestador.prototype, "visualizacoes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: enums_1.UserStatus,
        default: enums_1.UserStatus.PENDENTE
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], PerfilPrestador.prototype, "disponivel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PerfilPrestador.prototype, "is_destaque_hero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], PerfilPrestador.prototype, "portfolio_imagens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], PerfilPrestador.prototype, "servicos_oferecidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "chavePix", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "qrCodePixUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['BASICO', 'INTERMEDIARIO', 'PREMIUM'],
        default: 'BASICO'
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "plano", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['MENSAL', 'ANUAL'],
        default: 'MENSAL'
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "tipo_assinatura", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: 'PENDENTE',
        name: 'status_aprovacao' // ✅ Nome exato que você usou no SQL do confirmarPagamento
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "status_aprovacao", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 30,
        default: 'PENDENTE'
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "checkout_session_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "checkout_url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true
    }),
    __metadata("design:type", Date)
], PerfilPrestador.prototype, "checkout_expira_em", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "categoriaid", nullable: true }),
    __metadata("design:type", Number)
], PerfilPrestador.prototype, "categoriaid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CategoryModels_1.Category),
    (0, typeorm_1.JoinColumn)({ name: "categoriaid" }) // Aponta para a coluna acima
    ,
    __metadata("design:type", CategoryModels_1.Category)
], PerfilPrestador.prototype, "categoriaidoPrincipal", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => StoreModels_1.Store, (store) => store.owner),
    __metadata("design:type", StoreModels_1.Store)
], PerfilPrestador.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "mini_bio", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 255,
        nullable: true,
        unique: true
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "subscription_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 50,
        nullable: true,
        default: "MERCADO_PAGO"
    }),
    __metadata("design:type", String)
], PerfilPrestador.prototype, "payment_gateway", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "timestamp",
        nullable: true
    }),
    __metadata("design:type", Date)
], PerfilPrestador.prototype, "subscription_renews_at", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "timestamp",
        nullable: true
    }),
    __metadata("design:type", Date)
], PerfilPrestador.prototype, "subscription_cancelled_at", void 0);
exports.PerfilPrestador = PerfilPrestador = __decorate([
    (0, typeorm_1.Entity)('perfil_prestador'),
    (0, typeorm_1.Unique)(['usuarioId', 'tipo'])
], PerfilPrestador);
