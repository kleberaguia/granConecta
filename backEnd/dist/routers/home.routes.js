"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeHomeRouter = makeHomeRouter;
const express_1 = require("express");
const ViewService_1 = require("../services/ViewService");
const ViewController_1 = require("../controller/ViewController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
function makeHomeRouter(ds) {
    const router = (0, express_1.Router)();
    const service = new ViewService_1.ViewService(ds);
    const controller = new ViewController_1.ViewController(service);
    router.use(authMiddleware_1.authMiddleware);
    router.get("/home/contador-nao-vistos", controller.contadorNaoVistos);
    router.get("/home/nao-vistos", controller.naoVistos);
    return router;
}
