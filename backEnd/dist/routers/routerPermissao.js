"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerPermissao = void 0;
const express_1 = __importDefault(require("express"));
const PermissionController_1 = __importDefault(require("../controller/PermissionController"));
exports.routerPermissao = express_1.default.Router();
exports.routerPermissao.get("/", PermissionController_1.default.getAll);
exports.routerPermissao.get("/:id", PermissionController_1.default.getById);
exports.routerPermissao.post("/", PermissionController_1.default.create);
exports.routerPermissao.put("/:id", PermissionController_1.default.update);
exports.routerPermissao.delete("/:id", PermissionController_1.default.delete);
