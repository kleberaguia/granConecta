import { Router } from "express";
import { ChatHumanController } from "../controller/ChatHumanController";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerChatHuman = Router();
const controller = new ChatHumanController();

routerChatHuman.get(
  "/human/inbox",
  authMiddleware,
  controller.inbox.bind(controller),
);

routerChatHuman.get(
  "/human/:conversationId/messages",
  authMiddleware,
  controller.messages.bind(controller),
);

routerChatHuman.post(
  "/human/:conversationId/take",
  authMiddleware,
  controller.take.bind(controller),
);

routerChatHuman.post(
  "/human/:conversationId/reply",
  authMiddleware,
  controller.reply.bind(controller),
);

routerChatHuman.post(
  "/human/:conversationId/finish",
  authMiddleware,
  controller.finish.bind(controller),
);

routerChatHuman.get(
  "/human/unread-count", // Rota que o seu setInterval chama
  authMiddleware,
  controller.unreadCount.bind(controller),
);

export default routerChatHuman;