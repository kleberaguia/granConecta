import { Router } from 'express';
import PaymentController from '../controller/PaymentController';
import { authMiddleware } from '../middlewares/authMiddleware'; // Essencial para saber QUEM é o user
import { PaymentGatewayController } from '../controller/PaymentGatewayController';

const routerPayment = Router();

routerPayment.post('/create-session', (req, res) => {
    console.log("Rota /create-session foi chamada!");
    PaymentController.handleCreateSession(req, res);
});
routerPayment.post('/webhook/mercadopago', PaymentController.handleMercadoPagoWebhook.bind(PaymentController));
routerPayment.get('/pix-status/:id', authMiddleware, PaymentController.checkPixStatus);
routerPayment.get("/meus-creditos", authMiddleware, PaymentController.getBalanceAndTransactions);

export default routerPayment;