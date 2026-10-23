import { Router } from 'express';
import { VitrineController } from '../controller/VitrineController';

const routerVitrine = Router();
const vitrineController = new VitrineController();

// Rota pública
routerVitrine.get('/:slug', vitrineController.getPrestadoresPorCategoria);

export default routerVitrine;
