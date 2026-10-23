// src/controllers/AgendaController.ts

import {
  Request,
  Response,
} from "express";

import AgendaService from "../services/AgendaService";

class AgendaController {
  private getUsuarioId(
    req: Request
  ): string | null {
    const user = (req as any).user;

    const id =
      user?.usuarioId ||
      user?.id;

    return id
      ? String(id)
      : null;
  }

  /**
   * Prestador sugere uma sessão.
   */
  async agendar(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const {
        ofertaId,
        descricao,
        data,
        hora,
      } = req.body;

      if (
        !ofertaId ||
        !data ||
        !hora
      ) {
        return res
          .status(400)
          .json({
            error:
              "Campos obrigatórios ausentes",
          });
      }

      const agenda =
        await AgendaService.agendarSessao(
          String(ofertaId),
          String(descricao || ""),
          String(data),
          String(hora),
          usuarioId
        );

      return res
        .status(201)
        .json(agenda);
    } catch (error: any) {
      console.error(
        "[AgendaController.agendar]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao criar agendamento",
        });
    }
  }

  /**
   * Morador confirma a sugestão do prestador.
   */
  async confirmarHorarioMorador(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { agendaId } =
        req.params;

      if (!agendaId) {
        return res
          .status(400)
          .json({
            error:
              "ID da agenda é obrigatório",
          });
      }

      const resultado =
        await AgendaService.confirmarHorarioMorador(
          agendaId,
          usuarioId
        );

      return res.json(resultado);
    } catch (error: any) {
      console.error(
        "[AgendaController.confirmarHorarioMorador]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao confirmar horário",
        });
    }
  }

  /**
   * Morador propõe outra data/hora.
   */
  async proporHorarioMorador(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { agendaId } =
        req.params;

      const {
        data,
        hora,
      } = req.body;

      if (
        !agendaId ||
        !data ||
        !hora
      ) {
        return res
          .status(400)
          .json({
            error:
              "agendaId, data e hora são obrigatórios",
          });
      }

      const resultado =
        await AgendaService.proporNovoHorarioMorador(
          agendaId,
          usuarioId,
          String(data),
          String(hora)
        );

      /**
       * Se o horário não estiver disponível,
       * retornamos 409 junto das alternativas.
       */
      if (
        (resultado as any)
          ?.disponivel === false
      ) {
        return res
          .status(409)
          .json(resultado);
      }

      return res.json(resultado);
    } catch (error: any) {
      console.error(
        "[AgendaController.proporHorarioMorador]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao propor novo horário",
        });
    }
  }

  /**
   * Morador recusa horário.
   */
  async recusarHorarioMorador(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { agendaId } =
        req.params;

      if (!agendaId) {
        return res
          .status(400)
          .json({
            error:
              "ID da agenda é obrigatório",
          });
      }

      const resultado =
        await AgendaService.recusarHorarioMorador(
          agendaId,
          usuarioId
        );

      return res.json(resultado);
    } catch (error: any) {
      console.error(
        "[AgendaController.recusarHorarioMorador]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao recusar horário",
        });
    }
  }

  /**
   * Prestador aceita contraproposta do morador.
   */
  async confirmarHorarioPrestador(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { agendaId } =
        req.params;

      if (!agendaId) {
        return res
          .status(400)
          .json({
            error:
              "ID da agenda é obrigatório",
          });
      }

      const resultado =
        await AgendaService.confirmarHorarioPrestador(
          agendaId,
          usuarioId
        );

      return res.json(resultado);
    } catch (error: any) {
      console.error(
        "[AgendaController.confirmarHorarioPrestador]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao confirmar horário",
        });
    }
  }

  /**
   * Prestador faz nova contraproposta.
   */
  async proporHorarioPrestador(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { agendaId } =
        req.params;

      const {
        data,
        hora,
      } = req.body;

      if (
        !agendaId ||
        !data ||
        !hora
      ) {
        return res
          .status(400)
          .json({
            error:
              "agendaId, data e hora são obrigatórios",
          });
      }

      const resultado =
        await AgendaService.proporNovoHorarioPrestador(
          agendaId,
          usuarioId,
          String(data),
          String(hora)
        );

      return res.json(resultado);
    } catch (error: any) {
      console.error(
        "[AgendaController.proporHorarioPrestador]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao propor novo horário",
        });
    }
  }

  /**
   * Check-in do morador.
   */
  async checkinCliente(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { agendaId } =
        req.params;

      if (!agendaId) {
        return res
          .status(400)
          .json({
            error:
              "Id da Agenda é necessário",
          });
      }

      const resultado =
        await AgendaService.confirmarPresencaCliente(
          agendaId,
          usuarioId
        );

      return res.json(resultado);
    } catch (err: any) {
      console.error(
        "[AgendaController.checkinCliente]",
        err
      );

      return res
        .status(400)
        .json({
          error: err.message,
        });
    }
  }

  /**
   * Prestador encerra sessão.
   */
  async assinarEEncerrar(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { agendaId } =
        req.body;

      if (!agendaId) {
        return res
          .status(400)
          .json({
            error:
              "ID do agendamento é obrigatório",
          });
      }

      const resultado =
        await AgendaService.assinarEEncerrarSessao(
          String(agendaId),
          usuarioId
        );

      return res.json(resultado);
    } catch (error: any) {
      console.error(
        "[AgendaController.assinarEEncerrar]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao assinar ata da sessão",
        });
    }
  }

  /**
   * Distrato.
   */
  async rescindirPacote(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const { ofertaId } =
        req.params;

      if (!ofertaId) {
        return res
          .status(400)
          .json({
            error:
              "ID da oferta/contrato é obrigatório",
          });
      }

      const resultado =
        await AgendaService.realizarDistratoPacote(
          ofertaId,
          usuarioId
        );

      return res.json(resultado);
    } catch (error: any) {
      console.error(
        "[AgendaController.rescindirPacote]",
        error
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Erro ao processar distrato proporcional",
        });
    }
  }

  /**
   * Agenda do usuário logado.
   */
  async listarMinhaAgenda(
    req: Request,
    res: Response
  ) {
    try {
      const usuarioId =
        this.getUsuarioId(req);

      const user =
        (req as any).user;

      const perfil =
        user?.perfil ||
        user?.role;

      if (!usuarioId) {
        return res
          .status(401)
          .json({
            error:
              "Sessão inválida ou expirada.",
          });
      }

      if (
        perfil === "PRESTADOR" ||
        perfil === "PROFISSIONAL"
      ) {
        const dadosPrestador =
          await AgendaService.listarSessoesPorPrestador(
            usuarioId
          );

        return res.json(
          dadosPrestador
        );
      }

      const dadosMorador =
        await AgendaService.listarSessoesPorMorador(
          usuarioId
        );

      return res.json(
        dadosMorador
      );
    } catch (err: any) {
      console.error(
        "[AgendaController Error]:",
        err.message
      );

      return res
        .status(500)
        .json({
          error: err.message,
        });
    }
  }
}

export default new AgendaController();