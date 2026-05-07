import { AppDataSource } from '../config/data-source';
import { MarketPlaceModel } from '../models/MarketPlaceModel';
import { MoreThanOrEqual, LessThanOrEqual, And, IsNull, Raw } from 'typeorm';

class MarketplaceService {
    private bannerRepository = AppDataSource.getRepository(MarketPlaceModel);

    async getMyBanners(lojaId: string): Promise<MarketPlaceModel[]> {
        return await this.bannerRepository.find({
            where: { loja_id: lojaId },
            order: { data_inicio: 'DESC' }
        });
    }

    async getActiveBanners(condominioId: string | null): Promise<MarketPlaceModel[]> {
        // Montamos a condição base que é comum a todos
        const condicoes: any = {
            status: 'aprovado',
            pago: true,
            ativo: true,
            data_fim: Raw((alias) => `${alias} >= NOW()`),
            data_inicio: Raw((alias) => `${alias} <= NOW()`)
        };

        // Adicionamos o filtro de condomínio dinamicamente
        // Se vier ID, filtra pelo ID. Se for null, filtra por IsNull() [cite: 2026-01-27]
        if (condominioId) {
            condicoes.condominio_id = condominioId;
        } else {
            condicoes.condominio_id = IsNull();
        }

        return await this.bannerRepository.find({
            where: condicoes, // Passamos o objeto direto, SEM o []
            order: { id: 'DESC' }
        });
    }

    async createBanner(data: Partial<MarketPlaceModel>): Promise<MarketPlaceModel> {
        try {
            // O .create() apenas prepara o objeto na memória
            const novoBanner = this.bannerRepository.create({
                ...data,
                status: 'pendente', // Garante o fluxo de aprovação
                pago: false,        // Garante que comece como não pago
                ativo: true         // Garante que nasça ativo (mas não aprovado)
            });

            // O .save() persiste no banco e retorna o objeto com o ID gerado
            return await this.bannerRepository.save(novoBanner);
        } catch (error) {
            console.error("Erro no Service ao criar banner:", error);
            throw error;
        }
    }

    async updateBannerStatus(id: number, status: string, pago: boolean): Promise<void> {
        await this.bannerRepository.update(id, {
            status,
            pago
        });
    }
}

export default new MarketplaceService();