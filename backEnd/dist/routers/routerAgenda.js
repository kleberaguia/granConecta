"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AgendaController_1 = __importDefault(require("../controller/AgendaController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/agenda/sugerir", authMiddleware_1.authMiddleware, AgendaController_1.default.sugerir);
router.post("/agenda/:agendaId/confirmar", authMiddleware_1.authMiddleware, AgendaController_1.default.confirmar);
exports.default = router;
