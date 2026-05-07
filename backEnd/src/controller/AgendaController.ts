import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import AgendaService from "../services/AgendaService";

class AgendaController {

  // Morador sugere um dia/horário
  async sugerir(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.usuarioId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { servicoId, data, hora } = req.body;

      if (!servicoId || !data || !hora) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      const agenda = await AgendaService.sugerirHorario(
        servicoId,
        req.user.usuarioId.toString(),
        data,
        hora
      );

      return res.status(201).json(agenda);

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        error: error.message || "Erro ao sugerir agendamento"
      });
    }
  }

  // Prestador confirma o agendamento sugerido
  async confirmar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.usuarioId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { agendaId } = req.params;

      if (!agendaId) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const agenda = await AgendaService.confirmar(
        agendaId,
        req.user.usuarioId.toString()
      );

      return res.json(agenda);

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        error: error.message || "Erro ao confirmar agendamento"
      });
    }
  }

}

export default new AgendaController();
