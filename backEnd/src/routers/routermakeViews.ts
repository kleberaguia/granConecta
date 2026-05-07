// src/routers/routermakeViews.ts
import { Router, type RequestHandler } from "express";
import type { DataSource } from "typeorm";
import { ViewService } from "../services/ViewService";
import { ViewController } from "../controller/ViewController";
import { authMiddleware } from "../middlewares/authMiddleware";

// Wrapper para capturar erro async e NÃO deixar request pendurado
const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export function makeViewsRouter(ds: DataSource) {
  if (!ds) throw new Error("DataSource não informado em makeViewsRouter");

  const routerMakeViews = Router();

  const service = new ViewService(ds);
  const controller = new ViewController(service);

  // Debug (pode remover depois)
  routerMakeViews.use((req, _res, next) => {
    console.log(">>> HIT VIEWS ROUTER:", req.method, req.originalUrl);
    next();
  });

  routerMakeViews.post(
    "/avisos/:id/visto", authMiddleware,
    asyncHandler(controller.marcarAvisoVisto as any)
  );

  routerMakeViews.post(
    "/posts/:id/visto",
    authMiddleware, // <--- ADICIONE ISSO AQUI
    asyncHandler(controller.marcarPostVisto as any)
  );

  return routerMakeViews;
}