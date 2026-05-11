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
exports.PostAnimal = exports.AnimalPorte = exports.AnimalSexo = exports.AnimalEspecie = exports.AnimalTipo = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./Post");
var AnimalTipo;
(function (AnimalTipo) {
    AnimalTipo["DOACAO"] = "DOACAO";
    AnimalTipo["ACHADO"] = "ACHADO";
    AnimalTipo["PERDIDO"] = "PERDIDO";
})(AnimalTipo || (exports.AnimalTipo = AnimalTipo = {}));
var AnimalEspecie;
(function (AnimalEspecie) {
    AnimalEspecie["CAO"] = "CAO";
    AnimalEspecie["GATO"] = "GATO";
    AnimalEspecie["OUTRO"] = "OUTRO";
})(AnimalEspecie || (exports.AnimalEspecie = AnimalEspecie = {}));
var AnimalSexo;
(function (AnimalSexo) {
    AnimalSexo["M"] = "M";
    AnimalSexo["F"] = "F";
    AnimalSexo["NAO_INFORMADO"] = "NAO_INFORMADO";
})(AnimalSexo || (exports.AnimalSexo = AnimalSexo = {}));
var AnimalPorte;
(function (AnimalPorte) {
    AnimalPorte["PEQUENO"] = "PEQUENO";
    AnimalPorte["MEDIO"] = "MEDIO";
    AnimalPorte["GRANDE"] = "GRANDE";
    AnimalPorte["NAO_INFORMADO"] = "NAO_INFORMADO";
})(AnimalPorte || (exports.AnimalPorte = AnimalPorte = {}));
let PostAnimal = class PostAnimal {
};
exports.PostAnimal = PostAnimal;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "post_id", type: "varchar", length: 36 }),
    __metadata("design:type", String)
], PostAnimal.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Post_1.Post, (p) => p.animal, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "post_id" }),
    __metadata("design:type", Post_1.Post)
], PostAnimal.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: AnimalTipo }),
    __metadata("design:type", String)
], PostAnimal.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: AnimalEspecie, default: AnimalEspecie.OUTRO }),
    __metadata("design:type", String)
], PostAnimal.prototype, "especie", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: AnimalSexo, default: AnimalSexo.NAO_INFORMADO }),
    __metadata("design:type", String)
], PostAnimal.prototype, "sexo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: AnimalPorte, default: AnimalPorte.NAO_INFORMADO }),
    __metadata("design:type", String)
], PostAnimal.prototype, "porte", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "tinyint", width: 1, nullable: true }),
    __metadata("design:type", Object)
], PostAnimal.prototype, "vacinado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "tinyint", width: 1, nullable: true }),
    __metadata("design:type", Object)
], PostAnimal.prototype, "castrado", void 0);
exports.PostAnimal = PostAnimal = __decorate([
    (0, typeorm_1.Entity)({ name: "post_animais" })
], PostAnimal);
