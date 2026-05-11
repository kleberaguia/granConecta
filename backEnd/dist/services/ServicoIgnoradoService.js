"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicoIgnoradoService = void 0;
const data_source_1 = require("../config/data-source");
const ServicoIgnoradoModels_1 = require("../models/ServicoIgnoradoModels");
class ServicoIgnoradoService {
    constructor() {
        this.repo = data_source_1.AppDataSource.getRepository(ServicoIgnoradoModels_1.ServicoIgnorado);
    }
    async ignorar(prestadorId, solicitacaoId) {
        // Verifica se já existe para não duplicar
        const existe = await this.repo.findOneBy({ prestadorId, solicitacaoId });
        if (existe)
            return existe;
        const novoIgnorado = this.repo.create({
            prestadorId,
            solicitacaoId
        });
        return await this.repo.save(novoIgnorado);
    }
}
exports.ServicoIgnoradoService = ServicoIgnoradoService;
