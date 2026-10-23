import type { Request, Response } from "express";
import StoreChatbotKnowledgeService from "../services/StoreChatbotKnowledgeService";

export class StoreChatbotKnowledgeController {
  async listarPorLoja(req: Request, res: Response): Promise<void> {
    try {
      const storeId = String(req.params.storeId || "");

      const result =
        await StoreChatbotKnowledgeService.listarPorLoja(storeId);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Erro ao listar conteúdos do chatbot.",
      });
    }
  }

  async criar(req: Request, res: Response): Promise<void> {
    try {
      const result = await StoreChatbotKnowledgeService.criar({
        store_id: req.body.store_id,
        titulo: req.body.titulo,
        tipo: req.body.tipo,
        conteudo: req.body.conteudo,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Erro ao criar conteúdo do chatbot.",
      });
    }
  }

  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || "");

      const result =
        await StoreChatbotKnowledgeService.atualizar(id, {
          titulo: req.body.titulo,
          tipo: req.body.tipo,
          conteudo: req.body.conteudo,
          ativo: req.body.ativo,
        });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Erro ao atualizar conteúdo do chatbot.",
      });
    }
  }

  async remover(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || "");

      const result =
        await StoreChatbotKnowledgeService.remover(id);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Erro ao remover conteúdo do chatbot.",
      });
    }
  }
}