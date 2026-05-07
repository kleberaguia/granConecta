// src/routers/routerServicoAdmin.ts
import { Router } from "express";
import ServicoAdminController from "../controller/ServicoAdminController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { isAdminMiddleware } from "../middlewares/isAdminMiddleware";
import { SubscriptionController } from "../controller/SubscriptionController";


const routerServicoAdmin = Router();
const subController = new SubscriptionController();

routerServicoAdmin.get("/servicos",authMiddleware, isAdminMiddleware,ServicoAdminController.listar);
routerServicoAdmin.get("/servicos/:id",authMiddleware,isAdminMiddleware, ServicoAdminController.detalhe);
routerServicoAdmin.get('/servicos/prestador/:id', authMiddleware,isAdminMiddleware,ServicoAdminController.buscarPrestador)
routerServicoAdmin.patch('/servicos/prestador/:id/aprovar',authMiddleware, isAdminMiddleware, ServicoAdminController.aprovarPrestador)
routerServicoAdmin.post('/admin/subscriptions/process-renewals', subController.triggerManualRenewal);

routerServicoAdmin.get("/credits/my-balance", authMiddleware, subController.getMyBalance);
routerServicoAdmin.post("/subscriptions/request-refund", authMiddleware, subController.requestWithdrawal);

export default routerServicoAdmin;
