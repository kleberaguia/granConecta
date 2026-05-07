import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Store } from '../models/StoreModels';

export async function ensureIsStoreOwner(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.usuarioId; // Pegue o ID do usuário logado (vindo do authMiddleware)
  const { storeId } = req.params;

  const storeRepository = AppDataSource.getRepository(Store);

   if(!storeId) return res.status(400).json('storeId não localizado')
  // Busca a loja e verifica se o dono dela é o usuário logado
  const store = await storeRepository.findOne({
    where: { 
        id: storeId
       
    }
  });

  if (!store) {
    return res.status(403).json({ 
        error: "Acesso negado. Você não é o proprietário desta loja." 
    });
  }

  return next();
}