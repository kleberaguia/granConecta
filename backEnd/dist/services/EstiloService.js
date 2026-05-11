"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstiloService = void 0;
class EstiloService {
    constructor(estiloRepository) {
        this.estiloRepository = estiloRepository;
    }
    async generateOrRetrieve(descricao, usuarioId) {
        // 1. Verifica se já existe estilo para esse usuário
        let estilo = await this.estiloRepository.findOne({ where: { descricao } });
        if (!estilo) {
            // 2. Gera novo estilo com base no descritivo
            estilo = this.estiloRepository.create({
                nome_estilo: `Estilo-${Date.now()}`,
                descricao,
                body_bg: "bg-gray-50",
                body_font: "Inter",
                primary_color: "#2563EB",
                secondary_color: "#FACC15",
                border_style: "rounded-xl"
            });
            await this.estiloRepository.save(estilo);
        }
        return estilo;
    }
}
exports.EstiloService = EstiloService;
