import { Router } from "express";

import PlanController from "../controller/PlanController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { isAdminMiddleware } from "../middlewares/isAdminMiddleware";

const routerPlan = Router();

/*
 * Rota pública.
 * Permite que visitantes consultem os planos antes do cadastro.
 */
routerPlan.get(
  "/plans",
  PlanController.getAll
);

/*
 * Rotas administrativas.
 */
routerPlan.post(
  "/plans",
  authMiddleware,
  isAdminMiddleware,
  PlanController.create
);

routerPlan.put(
  "/plans/:id",
  authMiddleware,
  isAdminMiddleware,
  PlanController.update
);

routerPlan.delete(
  "/plans/:id",
  authMiddleware,
  isAdminMiddleware,
  PlanController.delete
);

export default routerPlan;