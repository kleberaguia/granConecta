"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const condominiosModels_1 = require("../models/condominiosModels");
class ListCondominioService {
    async execute() {
        const condominioRepository = data_source_1.AppDataSource.getRepository(condominiosModels_1.Condominio);
        const condominios = await condominioRepository.find({
            order: {
                nome: 'ASC',
            },
            relations: {
                endereco: true // Usa o objeto para habilitar a relação
            },
            select: {
                id: true,
                nome: true,
                // Aqui você seleciona os campos específicos da entidade Endereco que você postou
                endereco: {
                    id: true,
                    logradouro: true,
                    cidade: true,
                    bairro: true,
                    uf: true,
                    numero: true
                }
            }
        });
        return condominios;
    }
}
exports.default = ListCondominioService;
