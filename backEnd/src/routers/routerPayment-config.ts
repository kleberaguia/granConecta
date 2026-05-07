import { Router } from "express";
import { StorePaymentConfigController } from "../controller/StorePaymentConfigController";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerPaymentconfig = Router();

// buscar config
routerPaymentconfig.get(
  "/stores/:storeId/payment-config", authMiddleware,
  StorePaymentConfigController.getByStore
);

// criar/atualizar config
routerPaymentconfig.put(
  "/stores/:storeId/payment-config", authMiddleware,
  StorePaymentConfigController.upsert
);

export default routerPaymentconfig;