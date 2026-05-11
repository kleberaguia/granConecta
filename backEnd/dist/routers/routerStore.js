"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StoreController_1 = require("../controller/StoreController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multerConfig_1 = require("../config/multerConfig");
const multer_1 = __importDefault(require("multer"));
const memUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        // 150MB em bytes (150 * 1024 * 1024)
        fileSize: 750 * 1024 * 1024,
        fieldSize: 750 * 1024 * 1024
    }
});
const routerStore = (0, express_1.Router)();
const storeController = new StoreController_1.StoreController();
// Públicas
routerStore.get("/publica/todas", storeController.listPublicStores);
routerStore.get("/publica/slug/:slug", storeController.getStoreBySlug);
routerStore.get("/publica/categoria/:categoria", storeController.listCategoriasByGrupo);
routerStore.get("/publica/grupos-com-lojas", storeController.listGruposComLojas);
routerStore.get("/publica/id/:id", storeController.getStoreById);
routerStore.get("/leads/meus", authMiddleware_1.authMiddleware, storeController.listMyLeads);
// Privadas
routerStore.get("/me", authMiddleware_1.authMiddleware, storeController.getStoreByUser);
routerStore.get("/delivery-config/:storeId", authMiddleware_1.authMiddleware, storeController.getDeliveryConfig);
// Salva ou atualiza a configuração de entrega
routerStore.post("/delivery-config", authMiddleware_1.authMiddleware, storeController.upsertDeliveryConfig);
//routerStore.post("/stores", authMiddleware, storeController.upsertStore);
routerStore.post("/registrar-interacao", storeController.registrarInteracao);
routerStore.post("/stores", authMiddleware_1.authMiddleware, memUpload.any(), multerConfig_1.processImage, storeController.upsertStore);
routerStore.post("/store/upload", authMiddleware_1.authMiddleware, multerConfig_1.upload.single("file"), multerConfig_1.processImage, storeController.uploadStoreImage);
routerStore.put("/stores/:id", // 👈 O endpoint que o seu frontend está chamando
authMiddleware_1.authMiddleware, memUpload.any(), multerConfig_1.processImage, // Se estiver enviando FormData
storeController.updateStore // Você precisará criar esse método no Controller
);
routerStore.patch("/stores/:id/draft", authMiddleware_1.authMiddleware, storeController.updateHtmlDraft);
routerStore.post("/store/publish-html", authMiddleware_1.authMiddleware, storeController.publishHtml);
exports.default = routerStore;
