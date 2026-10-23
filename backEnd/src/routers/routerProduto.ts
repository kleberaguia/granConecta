import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { upload, processImage } from '../config/multerConfig';
import { ProductController } from '../controller/ProdutoController';
import { validateContent } from '../middlewares/contentValidator';

const routerProduto = Router();
const productController = new ProductController();


routerProduto.post('/', authMiddleware, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'foto_perfil', maxCount: 1 },
  { name: 'foto_hero', maxCount: 1 },
  { name: 'hero_video', maxCount: 1 },
  { name: 'section_image', maxCount: 1 },
  { name: 'hero_carousel', maxCount: 3 },
  { name: 'galeria', maxCount: 20 }
]),processImage,  productController.createProduto);

routerProduto.get('/publicos/:store_id', productController.getProdutosPublicosPorLoja);

routerProduto.get('/meus-produtos', authMiddleware, productController.getMeusProdutos);

routerProduto.get('/meus-produtos/:store_id', authMiddleware,  productController.getEditorContext);
routerProduto.post('/generate-ai', authMiddleware, productController.createWithAI);
routerProduto.put('/:id', authMiddleware, upload.fields([
  { name: 'foto_perfil', maxCount: 1 },
  { name: 'foto_hero', maxCount: 1 }
]), validateContent, processImage, productController.updateProduto);
routerProduto.delete('/:id', authMiddleware, productController.delete);

export default routerProduto;
