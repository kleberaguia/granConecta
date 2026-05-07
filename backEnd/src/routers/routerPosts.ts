import { Router } from "express";
import { DataSource } from "typeorm";
import { PostService } from "../services/PostService";
import { PostController } from "../controller/PostController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload, processImage } from '../config/multerConfig';

export const makePostRouter = (dataSource: DataSource) => {
  const router = Router();

  const service = new PostService(dataSource);
  const controller = new PostController(service);


  router.get("/posts/:id", authMiddleware, (req, res) => controller.show(req, res));

  /**
   * ================================
   * POSTS (MURAL)
   * ================================
   */

  // Criar post
  router.post(
    "/posts",
    authMiddleware,
    upload.array("files"), processImage,// <--- Use a configuração que você já tem
    (req, res) => controller.create(req, res)
  );



  // Listar posts por condomínio
  //router.get("/condominios/:condominio_id/posts", authMiddleware, controller.list);

  router.get(
    "/condominios/:condominio_id/posts", 
    authMiddleware, 
    (req, res) => controller.listarPosts(req, res)
  );

  // Atualizar status do post
  router.patch(
    "/posts/:postId/status",
    authMiddleware,
    controller.updateStatus
  );

  // Registrar interesse em post
  router.post(
    "/posts/:postId/interesses",
    authMiddleware,
    controller.interesse
  );


  return router;
};