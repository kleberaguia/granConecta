// routes/vendasRoutes.ts
import { Router } from 'express';
import { VendasController } from '../controller/VendasController';

const vendasRoutes = Router();

vendasRoutes.post('/tracking-checkout', VendasController.trackingCheckout);

export default vendasRoutes;