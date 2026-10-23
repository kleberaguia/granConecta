import { Router } from "express";
import PagamentoController from "../controller/PagamentoController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload, processImage } from '../config/multerConfig';

const routerPagamento = Router();

routerPagamento.get('/link-conexao-bancaria', authMiddleware, PagamentoController.obterLinkConexaoBancaria);
routerPagamento.get('/oauth-callback', PagamentoController.oauthCallback);
routerPagamento.get("/meus", authMiddleware, PagamentoController.listarMeusPagamentos);
routerPagamento.get("/:id", authMiddleware, PagamentoController.getById);
routerPagamento.post("/", authMiddleware, PagamentoController.criar); // cria cobrança e retorna link
routerPagamento.post("/liberar", authMiddleware, PagamentoController.liberarDinheiro);
routerPagamento.patch("/config/chave-pix", authMiddleware, PagamentoController.updatePixKey);

routerPagamento.post(
  "/config/upload-qrcode", 
  authMiddleware, 
  upload.fields([
  { name: 'foto_perfil', maxCount: 1 },
  { name: 'foto_hero', maxCount: 1 }
]), processImage,
  PagamentoController.uploadQRCode
);
routerPagamento.post(
   '/webhook/mercadopago',
   PagamentoController.webhookMercadoPago
);


export default routerPagamento;
    