"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const MarketPlaceModel_1 = require("../models/MarketPlaceModel");
const typeorm_1 = require("typeorm");
class MarketplaceService {
    constructor() {
        this.bannerRepository = data_source_1.AppDataSource.getRepository(MarketPlaceModel_1.MarketPlaceModel);
    }
    async getMyBanners(lojaId) {
        return await this.bannerRepository.find({
            where: { loja_id: lojaId },
            order: { data_inicio: 'DESC' }
        });
    }
    async getActiveBanners(condominioId) {
        // Montamos a condição base que é comum a todos
        const condicoes = {
            status: 'aprovado',
            pago: true,
            ativo: true,
            data_fim: (0, typeorm_1.Raw)((alias) => `${alias} >= NOW()`),
            data_inicio: (0, typeorm_1.Raw)((alias) => `${alias} <= NOW()`)
        };
        // Adicionamos o filtro de condomínio dinamicamente
        // Se vier ID, filtra pelo ID. Se for null, filtra por IsNull() [cite: 2026-01-27]
        if (condominioId) {
            condicoes.condominio_id = condominioId;
        }
        else {
            condicoes.condominio_id = (0, typeorm_1.IsNull)();
        }
        return await this.bannerRepository.find({
            where: condicoes, // Passamos o objeto direto, SEM o []
            order: { id: 'DESC' }
        });
    }
    async createBanner(data) {
        try {
            // O .create() apenas prepara o objeto na memória
            const novoBanner = this.bannerRepository.create({
                ...data,
                status: 'pendente', // Garante o fluxo de aprovação
                pago: false, // Garante que comece como não pago
                ativo: true // Garante que nasça ativo (mas não aprovado)
            });
            // O .save() persiste no banco e retorna o objeto com o ID gerado
            return await this.bannerRepository.save(novoBanner);
        }
        catch (error) {
            console.error("Erro no Service ao criar banner:", error);
            throw error;
        }
    }
    async updateBannerStatus(id, status, pago) {
        await this.bannerRepository.update(id, {
            status,
            pago
        });
    }
}
exports.default = new MarketplaceService();
