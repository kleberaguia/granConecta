"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const PageLandingController_1 = require("../controller/PageLandingController");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // ajuste se precisar
const routerPageLanding = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const controller = new PageLandingController_1.PageLandingController();
// ✅ IMPORTANTE: o field name tem que bater com o front: fd.append("image", file)
routerPageLanding.post("/generate-from-image", authMiddleware_1.authMiddleware, // se sua rota é privada (opcional)
upload.single("image"), // ✅ TEM QUE SER "image"
controller.generateFromImage);
exports.default = routerPageLanding;
