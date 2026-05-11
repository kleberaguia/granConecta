"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VitrineController_1 = require("../controller/VitrineController");
const routerVitrine = (0, express_1.Router)();
const vitrineController = new VitrineController_1.VitrineController();
// Rota pública
routerVitrine.get('/:slug', vitrineController.getPrestadoresPorCategoria);
exports.default = routerVitrine;
