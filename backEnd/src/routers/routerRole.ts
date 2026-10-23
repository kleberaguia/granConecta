import express from 'express'
import RoleController from "../controller/RoleController";

export const routerRoles =  express.Router()

routerRoles.get("/", RoleController.getAll);
routerRoles.get("/:id", RoleController.getById);
routerRoles.post("/", RoleController.create);
routerRoles.put("/:id", RoleController.update);
routerRoles.delete("/:id", RoleController.delete);