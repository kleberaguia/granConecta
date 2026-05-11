"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerContent = void 0;
const express_1 = __importDefault(require("express"));
const ContentController_1 = __importDefault(require("../controller/ContentController"));
exports.routerContent = express_1.default.Router();
exports.routerContent.get("/contents", ContentController_1.default.getAll);
exports.routerContent.get("/contents/:id", ContentController_1.default.getById);
exports.routerContent.post("/contents", ContentController_1.default.create);
exports.routerContent.put("/contents/:id", ContentController_1.default.update);
exports.routerContent.delete("/contents/:id", ContentController_1.default.delete);
exports.routerContent.get("/contents/section/:sectionId", ContentController_1.default.getBySection);
