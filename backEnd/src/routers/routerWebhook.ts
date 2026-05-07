// src/routers/routerWebhook.ts
import { Router, Request, Response } from "express";
import PagamentoService from "../services/PagamentoService";

const router = Router();

// Mercado Pago posts here
router.post("/mercadopago", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    await PagamentoService.processarWebhookMercadoPago(body);
    // responder 200 rápido
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Erro webhook MP:", err);
    return res.status(500).send("ERROR");
  }
});

export default router;
