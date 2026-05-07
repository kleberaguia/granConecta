import { Router } from "express";
import { DataSource } from "typeorm";
import { ViewService } from "../services/ViewService";
import { ViewController } from "../controller/ViewController";
import { authMiddleware } from "../middlewares/authMiddleware";

export function makeHomeRouter(ds: DataSource) {
  const router = Router();
  const service = new ViewService(ds);
  const controller = new ViewController(service);

  router.use(authMiddleware);

  router.get("/home/contador-nao-vistos", controller.contadorNaoVistos);
  router.get("/home/nao-vistos", controller.naoVistos)


  return router;
}
