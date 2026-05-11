"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicoIgnoradoController = void 0;
const data_source_1 = require("../config/data-source");
const ServicoIgnoradoModels_1 = require("../models/ServicoIgnoradoModels");
exports.ServicoIgnoradoController = {
    async ignorar(req, res) {
        try {
            const { solicitacaoId } = req.body;
            const prestadorId = req.user?.usuarioId; // Pegando do token via seu middleware de auth
            const repo = data_source_1.AppDataSource.getRepository(ServicoIgnoradoModels_1.ServicoIgnorado);
            if (!prestadorId) {
                return res.status(401).json({ error: "Usuário não autenticado" });
            }
            // Evita duplicados
            const jaExiste = await repo.findOneBy({ prestadorId, solicitacaoId });
            if (jaExiste) {
                return res.json({ message: "Já ignorado" });
            }
            const novo = repo.create({
                prestadorId,
                solicitacaoId
            });
            await repo.save(novo);
            return res.status(201).json({ message: "Oportunidade ocultada com sucesso" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao ignorar serviço" });
        }
    }
};
