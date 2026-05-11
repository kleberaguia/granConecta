"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerCustumer = void 0;
const express_1 = __importDefault(require("express"));
const CustomerController_1 = __importDefault(require("../controller/CustomerController"));
exports.routerCustumer = express_1.default.Router();
exports.routerCustumer.get("/customers", CustomerController_1.default.getAll);
exports.routerCustumer.get("/customers/:id", CustomerController_1.default.getById);
exports.routerCustumer.post("/customers", CustomerController_1.default.create);
exports.routerCustumer.put("/customers/:id", CustomerController_1.default.update);
exports.routerCustumer.delete("/customers/:id", CustomerController_1.default.delete);
