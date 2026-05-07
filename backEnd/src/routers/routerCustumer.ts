import express from 'express'
import custumerController from '../controller/CustomerController'

export const routerCustumer = express.Router()


routerCustumer.get("/customers", custumerController.getAll);
routerCustumer.get("/customers/:id", custumerController.getById);
routerCustumer.post("/customers", custumerController.create);
routerCustumer.put("/customers/:id", custumerController.update);
routerCustumer.delete("/customers/:id", custumerController.delete);