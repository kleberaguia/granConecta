"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendasController = void 0;
class VendasController {
    static async trackingCheckout(req, res) {
        try {
            const { usuarioId, itens, total } = req.body;
            // Aqui você pode salvar em tabela de logs ou analytics
            console.log('📦 CHECKOUT START', {
                usuarioId,
                total,
                itensCount: itens?.length,
                itens
            });
            // Exemplo simples (sem banco por enquanto)
            return res.status(200).json({
                success: true,
                message: 'Checkout tracking registrado'
            });
        }
        catch (error) {
            console.error('Erro tracking checkout:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }
}
exports.VendasController = VendasController;
