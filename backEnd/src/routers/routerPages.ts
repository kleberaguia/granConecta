import { Router } from 'express';
import pageController from '../controller/PageController';
// import { authMiddleware } from '../middlewares/authMiddleware'; 

const routerPages = Router();

// Rota da Lista
routerPages.get('/', pageController.getAllPages);
routerPages.get('/details', pageController.getPageBySlug);
routerPages.get('/details/:slug', pageController.getPageBySlug);
routerPages.get('/public/:slug', pageController.getPageBySlug);

routerPages.post('/', pageController.createPage); 
routerPages.put('/:slug', pageController.updatePage);

export default routerPages;