import express from 'express'
import ContentController from "../controller/ContentController";

export const routerContent =  express.Router()

routerContent.get("/contents", ContentController.getAll);
routerContent.get("/contents/:id", ContentController.getById);
routerContent.post("/contents", ContentController.create);
routerContent.put("/contents/:id", ContentController.update);
routerContent.delete("/contents/:id", ContentController.delete);
routerContent.get("/contents/section/:sectionId", ContentController.getBySection);