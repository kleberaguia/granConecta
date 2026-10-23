import { Router } from "express";
import { ChatController } from "../controller/ChatController";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware";


const routerChat = Router();
const chatController = new ChatController();

routerChat.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "granconecta-chat",
  });
});

routerChat.post(
  "/messages",
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      await chatController.sendMessage(req, res);
    } catch (error: any) {
      console.error("Erro não tratado na rota do chat:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message:
            error?.message ||
            "Erro interno no atendimento GranConecta.",
        });
      }
    }
  },
);

routerChat.get(
  "/messages/:conversationId",
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      const conversationId = String(req.params.conversationId || "");

      await chatController.getMessagesPublic(
        conversationId,
        req,
        res,
      );

    } catch (error: any) {
      console.error("Erro ao buscar mensagens públicas:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error?.message || "Erro ao buscar mensagens.",
        });
      }
    }
  },
);

routerChat.get(
  "/nao-lidas",
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      await chatController.getUnreadCount(req, res);
    } catch (error: any) {
      console.error("Erro na rota /chat/nao-lidas:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error?.message || "Erro ao buscar mensagens pendentes.",
        });
      }
    }
  },
);

export default routerChat;