import { Request, Response } from "express";
import { PlanService } from "../services/PlanService";

const service = new PlanService();

export default class PlanController {
  static async create(req: Request, res: Response) {
    try {
      const plan = await service.create(req.body);

      return res.status(201).json(plan);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao cadastrar plano";

      const status =
        message.includes("obrigatório") ||
        message.includes("inválido") ||
        message.includes("já existe")
          ? 400
          : 500;

      return res.status(status).json({
        error: message,
      });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const plans = await service.findAll();

      return res.status(200).json(plans);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao carregar planos";

      return res.status(500).json({
        error: message,
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        return res.status(400).json({
          error: "O ID do plano não foi informado",
        });
      }

      const plan = await service.update(
        id.trim(),
        req.body
      );

      return res.status(200).json(plan);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar plano";

      const status =
        message.includes("não encontrado")
          ? 404
          : message.includes("inválido") ||
              message.includes("obrigatório")
            ? 400
            : 500;

      return res.status(status).json({
        error: message,
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        return res.status(400).json({
          error: "O ID do plano não foi informado",
        });
      }

      await service.delete(id.trim());

      return res.status(200).json({
        message: "Plano desativado com sucesso",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao desativar plano";

      const status = message.includes("não encontrado")
        ? 404
        : 500;

      return res.status(status).json({
        error: message,
      });
    }
  }
}