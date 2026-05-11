"use strict";
// src/routes/authRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controller/AuthController"));
const routerRegister = (0, express_1.Router)();
routerRegister.post('/', AuthController_1.default.register);
exports.default = routerRegister;
