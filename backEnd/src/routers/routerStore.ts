import { Router } from "express";
import { StoreController } from "../controller/StoreController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload, processImage } from '../config/multerConfig';

import multer from "multer";
const memUpload = multer({
  storage: multer.memoryStorage(),
 limits: {
    // 150MB em bytes (150 * 1024 * 1024)
    fileSize: 750 * 1024 * 1024, 
    fieldSize: 750 * 1024 * 1024
  }
});

const routerStore = Router();
const storeController = new StoreController();

// Públicas
routerStore.get("/publica/todas", storeController.listPublicStores);
routerStore.get("/publica/slug/:slug", storeController.getStoreBySlug);
routerStore.get("/publica/categoria/:categoria", storeController.listCategoriasByGrupo);
routerStore.get("/publica/grupos-com-lojas",storeController.listGruposComLojas);

routerStore.get("/publica/id/:id", storeController.getStoreById);
routerStore.get("/leads/meus", authMiddleware, storeController.listMyLeads);

// Privadas
routerStore.get("/me", authMiddleware, storeController.getStoreByUser);

routerStore.get(
  "/delivery-config/:storeId",
  authMiddleware,
  storeController.getDeliveryConfig
);

// Salva ou atualiza a configuração de entrega
routerStore.post(
  "/delivery-config",
  authMiddleware,
  storeController.upsertDeliveryConfig
);

//routerStore.post("/stores", authMiddleware, storeController.upsertStore);
routerStore.post("/registrar-interacao", storeController.registrarInteracao);
routerStore.post(
  "/stores",
  authMiddleware,
  memUpload.any(), processImage,
  storeController.upsertStore
);

routerStore.post(
  "/store/upload",
  authMiddleware,
  upload.single("file"), processImage,
  storeController.uploadStoreImage
);

routerStore.put(
  "/stores/:id", // 👈 O endpoint que o seu frontend está chamando
  authMiddleware,
  memUpload.any(), processImage, // Se estiver enviando FormData
  storeController.updateStore // Você precisará criar esse método no Controller
);
routerStore.patch(
  "/stores/:id/draft",
  authMiddleware,
  storeController.updateHtmlDraft
);


routerStore.post(
  "/store/publish-html",
  authMiddleware,
  storeController.publishHtml
);

routerStore.post("/lista-desejos", storeController.criarDesejo);

routerStore.patch(

  
  "/stores/:id/capa",
  
  authMiddleware,
  storeController.updateStoreCover,
);

routerStore.patch(
  "/stores/:id/capa",
  authMiddleware,
  storeController.updateStore
);

export default routerStore;