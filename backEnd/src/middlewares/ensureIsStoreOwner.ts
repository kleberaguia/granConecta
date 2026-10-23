import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Store } from '../models/StoreModels';
import { Order } from '../models/OrderModels';

export async function ensureIsStoreOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const userId = (req as any).user?.id;

    if (!userId) {

      return res.status(401).json({
        error: "Usuário não autenticado"
      });
    }

    const storeRepo =
      AppDataSource.getRepository(Store);

    // rota com storeId
    if (req.params.storeId) {

      const store = await storeRepo.findOne({
        where: {
          id: req.params.storeId,
          usuarioId: userId
        }
      });

      if (!store) {

        return res.status(403).json({
          error: "Loja não encontrada"
        });
      }

      (req as any).store = store;

      return next();
    }

    // rota com pedido
    if (req.params.id) {

      const orderRepo =
        AppDataSource.getRepository(Order);

      const order = await orderRepo.findOne({
        where: {
          id: Number(req.params.id)
        },
        relations: [
          "store"
        ]
      });

      if (!order) {

        return res.status(404).json({
          error: "Pedido não encontrado"
        });
      }

      if (order.store?.usuarioId !== userId) {

        return res.status(403).json({
          error: "Pedido não pertence à sua loja"
        });
      }

      return next();
    }

    // fallback:
    const store = await storeRepo.findOne({
      where: {
        usuarioId: userId
      }
    });

    if (!store) {

      return res.status(403).json({
        error: "Usuário não possui loja"
      });
    }

    (req as any).store = store;

    return next();

  } catch (err) {

    console.error(
      "ERRO ensureIsStoreOwner:",
      err
    );

    return res.status(500).json({
      error: "Erro interno"
    });
  }
}