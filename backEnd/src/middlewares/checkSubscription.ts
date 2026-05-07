import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Subscription, SubscriptionStatus } from '../models/SubscriptionModel';

export const checkSubscription = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = req.user?.usuarioId; // ID vindo do middleware de login (JWT)

    const subRepo = AppDataSource.getRepository(Subscription);

    if (!userId) {
      return res.status(401).json({ message: "Usuário não identificado." });
    }

    // Busca a assinatura mais recente deste cliente
    const subscription = await subRepo.findOne({
      where: { usuarioId: userId },
      order: { createdAt: 'DESC' }
    });

    // 1. Verifica se existe assinatura
    if (!subscription) {
      return res.status(403).json({ 
        message: "Assinatura não encontrada. Por favor, escolha um plano." 
      });
    }

    // 2. Verifica se o status é ATIVO
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      // Caso esteja atrasado (PAST_DUE), você pode enviar uma mensagem específica
      const message = subscription.status === SubscriptionStatus.PAST_DUE
        ? "Pagamento pendente. Regularize sua assinatura para acessar."
        : "Sua assinatura está cancelada ou expirada.";

      return res.status(403).json({ 
        status: subscription.status,
        message 
      });
    }

    // 3. Tudo certo! Prossegue para a rota
    next();

  } catch (error) {
    return res.status(500).json({ message: "Erro ao verificar assinatura." });
  }
};