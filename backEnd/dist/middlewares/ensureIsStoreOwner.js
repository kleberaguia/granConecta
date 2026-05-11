"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureIsStoreOwner = ensureIsStoreOwner;
const data_source_1 = require("../config/data-source");
const StoreModels_1 = require("../models/StoreModels");
async function ensureIsStoreOwner(req, res, next) {
    const userId = req.user?.usuarioId; // Pegue o ID do usuário logado (vindo do authMiddleware)
    const { storeId } = req.params;
    const storeRepository = data_source_1.AppDataSource.getRepository(StoreModels_1.Store);
    if (!storeId)
        return res.status(400).json('storeId não localizado');
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
