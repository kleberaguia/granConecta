import { Router } from "express";
import PagamentoController from "../controller/PagamentoController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload, processImage } from '../config/multerConfig';

const routerPagamento = Router();

routerPagamento.get("/meus", authMiddleware, PagamentoController.listarMeusPagamentos);
routerPagamento.get("/:id", authMiddleware, PagamentoController.getById);
routerPagamento.post("/", authMiddleware, PagamentoController.criar); // cria cobrança e retorna link

// 1. Rota para atualizar a Chave PIX (Texto)
routerPagamento.patch("/config/chave-pix", authMiddleware, PagamentoController.updatePixKey);

// 2. Rota para upload do QR Code (Imagem)
// O 'upload.single("file")' usa a lógica que você já tem de criar pastas e validar tipo
routerPagamento.post(
  "/config/upload-qrcode", 
  authMiddleware, 
  upload.fields([
  { name: 'foto_perfil', maxCount: 1 },
  { name: 'foto_hero', maxCount: 1 }
]), processImage,
  PagamentoController.uploadQRCode
);


export default routerPagamento;
    