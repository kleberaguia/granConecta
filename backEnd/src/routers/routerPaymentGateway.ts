// src/routers/routerSiteConfig.ts

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { PaymentGatewayController } from '../controller/PaymentGatewayController';

const routerGateWayLojista = Router();


routerGateWayLojista.post(
  '/gateway/create-payment/:orderId', 
  authMiddleware, 
  PaymentGatewayController.createPayment 
);

export { routerGateWayLojista };