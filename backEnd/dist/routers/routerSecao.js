"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerSecao = void 0;
const express_1 = __importDefault(require("express"));
const secaoController_1 = __importDefault(require("../controller/secaoController"));
exports.routerSecao = express_1.default.Router();
exports.routerSecao.get('/', secaoController_1.default.getHome);
exports.routerSecao.post('/', secaoController_1.default.createSecao);
exports.routerSecao.put('/:id', secaoController_1.default.updateSecao);
exports.routerSecao.delete('/:id', secaoController_1.default.deleteSecao);
