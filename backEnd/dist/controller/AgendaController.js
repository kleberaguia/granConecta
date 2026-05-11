"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AgendaService_1 = __importDefault(require("../services/AgendaService"));
class AgendaController {
    // Morador sugere um dia/horário
    async sugerir(req, res) {
        try {
            if (!req.user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const { servicoId, data, hora } = req.body;
            if (!servicoId || !data || !hora) {
                return res.status(400).json({ error: "Dados incompletos" });
            }
            const agenda = await AgendaService_1.default.sugerirHorario(servicoId, req.user.usuarioId.toString(), data, hora);
            return res.status(201).json(agenda);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                error: error.message || "Erro ao sugerir agendamento"
            });
        }
    }
    // Prestador confirma o agendamento sugerido
    async confirmar(req, res) {
        try {
            if (!req.user?.usuarioId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const { agendaId } = req.params;
            if (!agendaId) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const agenda = await AgendaService_1.default.confirmar(agendaId, req.user.usuarioId.toString());
            return res.json(agenda);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                error: error.message || "Erro ao confirmar agendamento"
            });
        }
    }
}
exports.default = new AgendaController();
