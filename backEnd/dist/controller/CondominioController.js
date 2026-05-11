"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CreateCondominioService_1 = __importDefault(require("../services/CreateCondominioService"));
const data_source_1 = require("../config/data-source");
const condominiosModels_1 = require("../models/condominiosModels");
class CondominioController {
    async create(request, response) {
        const createCondominio = new CreateCondominioService_1.default();
        const dados = request.body;
        try {
            // Verifica se é Array (Lote) ou Objeto (Único)
            if (Array.isArray(dados)) {
                const condominios = await createCondominio.executeBatch(dados);
                return response.status(201).json(condominios);
            }
            else {
                const condominio = await createCondominio.execute(dados);
                return response.status(201).json(condominio);
            }
        }
        catch (err) {
            return response.status(400).json({ error: err.message });
        }
    }
    async validarCodigo(req, res) {
        const createCondominio = new CreateCondominioService_1.default();
        try {
            const result = await createCondominio.validarCodigoParaUsuario(req.body.codigo, req.body.usuarioId);
            return res.status(201).json(result);
        }
        catch (error) {
            console.error("ERRO NO REGISTRO:", error.message);
            return res.status(400).json({ error: error.message });
        }
    }
    async getIdCondominio(request, response) {
        const { id } = request.params;
        // 1. Verificação de segurança (Type Guard)
        if (!id) {
            return response.status(400).json({ message: "O ID do condomínio é obrigatório." });
        }
        const condominioRepository = data_source_1.AppDataSource.getRepository(condominiosModels_1.Condominio);
        // Agora o TypeScript sabe que 'id' não é undefined
        const condominio = await condominioRepository.findOneBy({ id });
        if (!condominio) {
            return response.status(404).json({ message: "Condomínio não encontrado." });
        }
        return response.json(condominio);
    }
    async index(request, response) {
        const condominioRepository = data_source_1.AppDataSource.getRepository(condominiosModels_1.Condominio);
        const condominios = await condominioRepository.find({ order: { nome: 'ASC' } });
        return response.json(condominios);
    }
}
exports.default = CondominioController;
