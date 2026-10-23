import { Router } from "express";
import { StoreChatbotKnowledgeController } from "../controller/StoreChatbotKnowledgeController";

// se você já usa autenticação:
import { authMiddleware } from "../middlewares/authMiddleware";

// se possui middleware admin:
// import { isAdminMiddleware } from "../middlewares/isAdminMiddleware";

const routerStoreChatbotKnowledge = Router();
const controller = new StoreChatbotKnowledgeController();

/*
|--------------------------------------------------------------------------
| LISTAR CONHECIMENTO DE UMA LOJA
|--------------------------------------------------------------------------
*/

routerStoreChatbotKnowledge.get(
  "/stores/:storeId/chatbot-knowledge",
  authMiddleware,
  controller.listarPorLoja.bind(controller),
);

/*
|--------------------------------------------------------------------------
| CRIAR CONHECIMENTO
|--------------------------------------------------------------------------
*/

routerStoreChatbotKnowledge.post(
  "/stores/chatbot-knowledge",
  authMiddleware,
  controller.criar.bind(controller),
);

/*
|--------------------------------------------------------------------------
| ATUALIZAR CONHECIMENTO
|--------------------------------------------------------------------------
*/

routerStoreChatbotKnowledge.put(
  "/stores/chatbot-knowledge/:id",
  authMiddleware,
  controller.atualizar.bind(controller),
);

/*
|--------------------------------------------------------------------------
| REMOVER CONHECIMENTO
|--------------------------------------------------------------------------
*/

routerStoreChatbotKnowledge.delete(
  "/stores/chatbot-knowledge/:id",
  authMiddleware,
  controller.remover.bind(controller),
);

export default routerStoreChatbotKnowledge;