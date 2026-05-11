"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlanController_1 = __importDefault(require("../controller/PlanController"));
const routerPlan = (0, express_1.Router)();
routerPlan.post("/plans", PlanController_1.default.create);
routerPlan.get("/plans", PlanController_1.default.getAll);
routerPlan.put("/plans/:id", PlanController_1.default.update);
routerPlan.delete("/plans/:id", PlanController_1.default.delete);
exports.default = routerPlan;
