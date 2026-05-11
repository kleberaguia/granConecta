"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerRoles = void 0;
const express_1 = __importDefault(require("express"));
const RoleController_1 = __importDefault(require("../controller/RoleController"));
exports.routerRoles = express_1.default.Router();
exports.routerRoles.get("/", RoleController_1.default.getAll);
exports.routerRoles.get("/:id", RoleController_1.default.getById);
exports.routerRoles.post("/", RoleController_1.default.create);
exports.routerRoles.put("/:id", RoleController_1.default.update);
exports.routerRoles.delete("/:id", RoleController_1.default.delete);
