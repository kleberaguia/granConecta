import express from 'express'
import PermissionController from "../controller/PermissionController";

export const routerPermissao =  express.Router()

routerPermissao.get("/", PermissionController.getAll);
routerPermissao.get("/:id", PermissionController.getById);
routerPermissao.post("/", PermissionController.create);
routerPermissao.put("/:id", PermissionController.update);
routerPermissao.delete("/:id", PermissionController.delete);