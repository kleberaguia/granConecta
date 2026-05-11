"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PageController_1 = __importDefault(require("../controller/PageController"));
// import { authMiddleware } from '../middlewares/authMiddleware'; 
const routerPages = (0, express_1.Router)();
// Rota da Lista
routerPages.get('/', PageController_1.default.getAllPages);
routerPages.get('/details', PageController_1.default.getPageBySlug);
routerPages.get('/details/:slug', PageController_1.default.getPageBySlug);
routerPages.get('/public/:slug', PageController_1.default.getPageBySlug);
routerPages.post('/', PageController_1.default.createPage);
routerPages.put('/:slug', PageController_1.default.updatePage);
exports.default = routerPages;
