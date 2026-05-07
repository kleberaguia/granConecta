import { Router } from "express";
import PlanController from "../controller/PlanController";

const routerPlan = Router();

routerPlan.post("/plans", PlanController.create);
routerPlan.get("/plans", PlanController.getAll);
routerPlan.put("/plans/:id", PlanController.update);
routerPlan.delete("/plans/:id", PlanController.delete);

export default routerPlan;