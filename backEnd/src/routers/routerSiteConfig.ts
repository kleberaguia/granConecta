// src/routers/routerSiteConfig.ts

import { Router } from 'express';
import { SiteConfigController } from "../controller/SiteConfigController";
import { authMiddleware } from '../middlewares/authMiddleware';
import { PaymentGatewayController } from '../controller/PaymentGatewayController';

const routerSiteConfig = Router();
const configController = new SiteConfigController();

routerSiteConfig.get("/", configController.get);
routerSiteConfig.post("/home", configController.save);
routerSiteConfig.post(
  '/gateway/create-payment/:orderId', 
  authMiddleware, 
  PaymentGatewayController.createPayment // Sem parênteses, sem instância
);




export { routerSiteConfig };