import { Request, Response } from "express";
import { PlanService } from "../services/PlanService";

const service = new PlanService();

export default class PlanController {
  static async create(req: Request, res: Response) {
    try {
      const plan = await service.create(req.body);
      return res.json(plan);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const plans = await service.findAll();
      return res.json(plans);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if(!id) return res.status(400).json('O Id não foi encontrado')
      const plan = await service.update(id, req.body);
      return res.json(plan);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if(!id) return res.status(400).json('O Id não foi encontrado')
      await service.delete(id);
      return res.json({ message: "Plano desativado" });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
}