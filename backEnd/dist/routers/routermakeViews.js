"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeViewsRouter = makeViewsRouter;
// src/routers/routermakeViews.ts
const express_1 = require("express");
const ViewService_1 = require("../services/ViewService");
const ViewController_1 = require("../controller/ViewController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Wrapper para capturar erro async e NÃO deixar request pendurado
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
function makeViewsRouter(ds) {
    if (!ds)
        throw new Error("DataSource não informado em makeViewsRouter");
    const routerMakeViews = (0, express_1.Router)();
    const service = new ViewService_1.ViewService(ds);
    const controller = new ViewController_1.ViewController(service);
    // Debug (pode remover depois)
    routerMakeViews.use((req, _res, next) => {
        console.log(">>> HIT VIEWS ROUTER:", req.method, req.originalUrl);
        next();
    });
    routerMakeViews.post("/avisos/:id/visto", authMiddleware_1.authMiddleware, asyncHandler(controller.marcarAvisoVisto));
    routerMakeViews.post("/posts/:id/visto", authMiddleware_1.authMiddleware, // <--- ADICIONE ISSO AQUI
    asyncHandler(controller.marcarPostVisto));
    return routerMakeViews;
}
