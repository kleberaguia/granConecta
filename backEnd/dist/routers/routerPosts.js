"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePostRouter = void 0;
const express_1 = require("express");
const PostService_1 = require("../services/PostService");
const PostController_1 = require("../controller/PostController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multerConfig_1 = require("../config/multerConfig");
const makePostRouter = (dataSource) => {
    const router = (0, express_1.Router)();
    const service = new PostService_1.PostService(dataSource);
    const controller = new PostController_1.PostController(service);
    router.get("/posts/:id", authMiddleware_1.authMiddleware, (req, res) => controller.show(req, res));
    /**
     * ================================
     * POSTS (MURAL)
     * ================================
     */
    // Criar post
    router.post("/posts", authMiddleware_1.authMiddleware, multerConfig_1.upload.array("files"), multerConfig_1.processImage, // <--- Use a configuração que você já tem
    (req, res) => controller.create(req, res));
    // Listar posts por condomínio
    //router.get("/condominios/:condominio_id/posts", authMiddleware, controller.list);
    router.get("/condominios/:condominio_id/posts", authMiddleware_1.authMiddleware, (req, res) => controller.listarPosts(req, res));
    // Atualizar status do post
    router.patch("/posts/:postId/status", authMiddleware_1.authMiddleware, controller.updateStatus);
    // Registrar interesse em post
    router.post("/posts/:postId/interesses", authMiddleware_1.authMiddleware, controller.interesse);
    return router;
};
exports.makePostRouter = makePostRouter;
