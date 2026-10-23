// controllers/VendasController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';

export class VendasController {

  static async trackingCheckout(req: Request, res: Response) {
    try {
      const { usuarioId, itens, total } = req.body;

      // Exemplo simples (sem banco por enquanto)
      return res.status(200).json({
        success: true,
        message: 'Checkout tracking registrado'
      });

    } catch (error) {
      console.error('Erro tracking checkout:', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
}