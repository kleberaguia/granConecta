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
exports.Usuario = exports.PlanoPrestador = void 0;
const typeorm_1 = require("typeorm");
// ... mantenha seus imports ...
const servicoSolicitacaoModels_1 = require("./servicoSolicitacaoModels");
const AvaliacaoModel_1 = require("./AvaliacaoModel");
const NotificationModel_1 = require("./NotificationModel");
const condominiosModels_1 = require("./condominiosModels");
const OrderModels_1 = require("./OrderModels");
const PerfilPrestadorModel_1 = require("./PerfilPrestadorModel");
const StoreModels_1 = require("./StoreModels");
const EnderecoModel_1 = require("./EnderecoModel");
const SubscriptionModel_1 = require("./SubscriptionModel");
const UsuarioAuthModels_1 = require("./UsuarioAuthModels");
const enums_1 = require("./enums");
const ChargeModel_1 = require("./ChargeModel");
const creditTransactionsModels_1 = require("./creditTransactionsModels");
const usercreditsModels_1 = require("./usercreditsModels");
const CategoryModels_1 = require("./CategoryModels");
var PlanoPrestador;
(function (PlanoPrestador) {
    PlanoPrestador["BASICO"] = "BASICO";
    PlanoPrestador["INTERMEDIARIO"] = "INTERMEDIARIO";
    PlanoPrestador["PREMIUM"] = "PREMIUM";
})(PlanoPrestador || (exports.PlanoPrestador = PlanoPrestador = {}));
let Usuario = class Usuario {
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Usuario.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Usuario.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['MORADOR', 'PRESTADOR', 'ADMIN', 'EMPREENDEDOR', 'PORTARIA', 'VISITANTE'] }),
    __metadata("design:type", String)
], Usuario.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "is_empreendedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "is_prestador", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "is_interno", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "telefone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 25, nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "documento", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.UserStatus,
        default: enums_1.UserStatus.PENDENTE // ✅ Use o valor do Enum diretamente
    }),
    __metadata("design:type", String)
], Usuario.prototype, "status_conta", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "condominio_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => condominiosModels_1.Condominio),
    (0, typeorm_1.JoinColumn)({ name: 'condominio_id' }),
    __metadata("design:type", condominiosModels_1.Condominio)
], Usuario.prototype, "condominio", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => UsuarioAuthModels_1.UsuarioAuth, (auth) => auth.usuario),
    (0, typeorm_1.JoinColumn)({ name: "authId" }) // O TypeORM procurará essa coluna aqui
    ,
    __metadata("design:type", UsuarioAuthModels_1.UsuarioAuth)
], Usuario.prototype, "auth", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "authId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => EnderecoModel_1.Endereco, (end) => end.usuario),
    __metadata("design:type", EnderecoModel_1.Endereco)
], Usuario.prototype, "endereco", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => PerfilPrestadorModel_1.PerfilPrestador, (perfil) => perfil.usuario),
    __metadata("design:type", PerfilPrestadorModel_1.PerfilPrestador)
], Usuario.prototype, "perfil", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => StoreModels_1.Store, (store) => store.owner),
    __metadata("design:type", StoreModels_1.Store)
], Usuario.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SubscriptionModel_1.Subscription, (sub) => sub.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "subscriptions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Usuario.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Usuario.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => servicoSolicitacaoModels_1.ServicoSolicitacao, (solicitacao) => solicitacao.morador),
    __metadata("design:type", Array)
], Usuario.prototype, "solicitacoesAbertas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => servicoSolicitacaoModels_1.ServicoSolicitacao, (solicitacao) => solicitacao.prestador),
    __metadata("design:type", Array)
], Usuario.prototype, "servicosComoPrestador", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => servicoSolicitacaoModels_1.ServicoSolicitacao, (solicitacao) => solicitacao.morador),
    __metadata("design:type", Array)
], Usuario.prototype, "servicosSolicitados", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AvaliacaoModel_1.Avaliacao, (avaliacao) => avaliacao.morador),
    __metadata("design:type", Array)
], Usuario.prototype, "avaliacoesFeitas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AvaliacaoModel_1.Avaliacao, (avaliacao) => avaliacao.prestador),
    __metadata("design:type", Array)
], Usuario.prototype, "avaliacoesRecebidas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => NotificationModel_1.Notificacao, (notificacao) => notificacao.usuario),
    __metadata("design:type", Promise)
], Usuario.prototype, "notificacoes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => OrderModels_1.Order, (order) => order.customer),
    __metadata("design:type", Promise)
], Usuario.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ChargeModel_1.Charge, (charge) => charge.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "charges", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => usercreditsModels_1.UserCredits, (credits) => credits.usuario),
    __metadata("design:type", usercreditsModels_1.UserCredits)
], Usuario.prototype, "credits", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => creditTransactionsModels_1.CreditTransactions, (transaction) => transaction.user),
    __metadata("design:type", Array)
], Usuario.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'categoriaid', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "categoriaid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CategoryModels_1.Category),
    (0, typeorm_1.JoinColumn)({ name: 'categoriaid' }) // Nome exato da coluna no banco
    ,
    __metadata("design:type", CategoryModels_1.Category)
], Usuario.prototype, "categoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "foto_perfil_url", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)('usuarios')
], Usuario);
