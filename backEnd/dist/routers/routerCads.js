"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerCads = void 0;
const express_1 = __importDefault(require("express"));
const cardController_1 = __importDefault(require("../controller/cardController"));
exports.routerCads = express_1.default.Router();
exports.routerCads.get('/', cardController_1.default.getAllCard);
exports.routerCads.get('/:id', cardController_1.default.getByIdcard);
exports.routerCads.post('/', cardController_1.default.newCard);
exports.routerCads.patch('/:id', cardController_1.default.editPartialCard);
exports.routerCads.delete('/:id', cardController_1.default.removerCad);
