// routes/adminRoutes.ts
import { Router } from 'express';
import AdminController from '../controller/AdminController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { isAdminMiddleware } from '../middlewares/isAdminMiddleware';
// import { isAdmin } from '../middlewares/authMiddleware'; 

const routerAdmin = Router();

// Estatísticas e Listagem
routerAdmin.get('/stats', AdminController.getStats);
routerAdmin.get('/assinaturas', AdminController.getSubscriptions);

// Gestão de Reembolsos/Saques
routerAdmin.get('/refund-requests', AdminController.getRefundRequests);
routerAdmin.post('/refunds/:id/process', AdminController.processRefund);

// Rota para confirmar o pagamento (Botão BAIXA PAGO)
routerAdmin.patch('/prestadores/:id/pagamento', authMiddleware,isAdminMiddleware, AdminController.confirmPayment);
routerAdmin.patch(
  '/usuarios/:usuarioId/status_conta', 
  authMiddleware, 
  isAdminMiddleware, 
  AdminController.aprovarEmpreendedor
);
routerAdmin.post('/refunds/:id/process', authMiddleware, AdminController.processRefund);

routerAdmin.get('/prestadores/aprovacao', AdminController.listarPrestadoresParaAprovacao);



export default routerAdmin;