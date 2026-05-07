import { Request, Response } from 'express';
import MarketplaceService from '../services/MarketplaceService';
import { MarketPlaceModel } from '../models/MarketPlaceModel';
import { addDays } from 'date-fns';

class MarketplaceController {


    async listByStore(req: Request, res: Response) {
        try {
            const { lojaId } = req.params;

            if (!lojaId) {
                return res.status(400).json({ error: "ID da loja não fornecido." });
            }

            // Chama o service que busca os banners dessa loja específica
            const banners = await MarketplaceService.getMyBanners(lojaId);

            return res.json(banners);
        } catch (error) {
            console.error("Erro ao listar banners da loja:", error);
            return res.status(500).json({ error: "Erro interno ao buscar banners." });
        }
    }

    async listActive(req: Request, res: Response) {
        try {
            const { condominioId } = req.params;

            console.log('testeeeeeeeeeeeeeeeeeee ', condominioId )
            // Se vier 'global', passamos null para o service
            const id = condominioId === 'global' ? null : condominioId;
            if(!id) return res.status(400).json('ID condominio é obrigatorio')
            const banners = await MarketplaceService.getActiveBanners(id);
            return res.json(banners);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar banners' });
        }
    }

    async store(req: Request, res: Response) {
        try {
            // Removido o [] pois o createBanner retorna apenas UM objeto
            const banner: MarketPlaceModel = await MarketplaceService.createBanner(req.body);

            return res.status(201).json({
                message: 'Solicitação enviada!',
                banner
            });
        } catch (error) {
            console.error(error); // Sempre bom logar o erro real no console
            return res.status(500).json({ error: 'Erro ao solicitar banner' });
        }
    }

    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, pago } = req.body;
            await MarketplaceService.updateBannerStatus(Number(id), status, pago);
            return res.json({ message: 'Banner atualizado com sucesso' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar banner' });
        }
    }

    async createBanner(req: Request, res: Response) {
        try {
            const { titulo, subtitulo, loja_id, plano, condominio_id } = req.body;
            const file = req.file;

            if (!file) return res.status(400).json({ error: "Imagem obrigatória" });

            // 1. Definir a duração com base no plano
            let diasDuracao = 7;
            if (plano === 'prata') diasDuracao = 15;
            if (plano === 'ouro') diasDuracao = 30;

            // 2. Calcular datas
            const data_inicio = new Date(); // Hoje
            const data_fim = new Date();
            data_fim.setDate(data_inicio.getDate() + diasDuracao); // Soma os dias do plano

            // 3. Salvar no banco
            const novoBanner = await MarketplaceService.createBanner({
                loja_id,
                condominio_id, // [cite: 2026-01-27]
                titulo,
                subtitulo,
                imagem_url: `/uploads/images/${file.filename}`,
                data_inicio,
                data_fim, // ✅ AGORA O BANCO NÃO VAI RECLAMAR
                status: 'pendente',
                pago: false,
                ativo: true
            });

            return res.status(201).json(novoBanner);
        } catch (error: any) {
            console.error("Erro no Service:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new MarketplaceController();