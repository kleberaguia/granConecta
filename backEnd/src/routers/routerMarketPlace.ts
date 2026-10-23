import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import MarketplaceController from '../controller/MarketplaceController';
import { upload, processImage } from '../config/multerConfig';

const routerMarketplace = Router();


routerMarketplace.post('/marketplace/banners/solicitar', upload.single('image'),authMiddleware, MarketplaceController.createBanner);

// Rota de listagem que criamos antes
//routerMarketplace.get('/meus/:lojaId', MarketplaceController.listByStore);

// Listagem pública para o carrossel (Filtra por condomínio e aprovados)
routerMarketplace.get('/marketplace/banners/:condominioId', MarketplaceController.listActive);
routerMarketplace.get('/marketplace/banners/meus/:lojaId', authMiddleware, MarketplaceController.listByStore);

// Admin gerencia (aprova/paga)
routerMarketplace.patch('/admin/banners/:id/status', authMiddleware, MarketplaceController.updateStatus);

export default routerMarketplace;