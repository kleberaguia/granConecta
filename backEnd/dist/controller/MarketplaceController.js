"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MarketplaceService_1 = __importDefault(require("../services/MarketplaceService"));
class MarketplaceController {
    async listByStore(req, res) {
        try {
            const { lojaId } = req.params;
            if (!lojaId) {
                return res.status(400).json({ error: "ID da loja não fornecido." });
            }
            // Chama o service que busca os banners dessa loja específica
            const banners = await MarketplaceService_1.default.getMyBanners(lojaId);
            return res.json(banners);
        }
        catch (error) {
            console.error("Erro ao listar banners da loja:", error);
            return res.status(500).json({ error: "Erro interno ao buscar banners." });
        }
    }
    async listActive(req, res) {
        try {
            const { condominioId } = req.params;
            console.log('testeeeeeeeeeeeeeeeeeee ', condominioId);
            // Se vier 'global', passamos null para o service
            const id = condominioId === 'global' ? null : condominioId;
            if (!id)
                return res.status(400).json('ID condominio é obrigatorio');
            const banners = await MarketplaceService_1.default.getActiveBanners(id);
            return res.json(banners);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar banners' });
        }
    }
    async store(req, res) {
        try {
            // Removido o [] pois o createBanner retorna apenas UM objeto
            const banner = await MarketplaceService_1.default.createBanner(req.body);
            return res.status(201).json({
                message: 'Solicitação enviada!',
                banner
            });
        }
        catch (error) {
            console.error(error); // Sempre bom logar o erro real no console
            return res.status(500).json({ error: 'Erro ao solicitar banner' });
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, pago } = req.body;
            await MarketplaceService_1.default.updateBannerStatus(Number(id), status, pago);
            return res.json({ message: 'Banner atualizado com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar banner' });
        }
    }
    async createBanner(req, res) {
        try {
            const { titulo, subtitulo, loja_id, plano, condominio_id } = req.body;
            const file = req.file;
            if (!file)
                return res.status(400).json({ error: "Imagem obrigatória" });
            // 1. Definir a duração com base no plano
            let diasDuracao = 7;
            if (plano === 'prata')
                diasDuracao = 15;
            if (plano === 'ouro')
                diasDuracao = 30;
            // 2. Calcular datas
            const data_inicio = new Date(); // Hoje
            const data_fim = new Date();
            data_fim.setDate(data_inicio.getDate() + diasDuracao); // Soma os dias do plano
            // 3. Salvar no banco
            const novoBanner = await MarketplaceService_1.default.createBanner({
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
        }
        catch (error) {
            console.error("Erro no Service:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new MarketplaceController();
