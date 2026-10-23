import {
  Request,
  Response,
} from "express";
import { AppDataSource } from "../config/data-source";
import {
  AgendaBloqueio,
  AgendaDisponibilidade,
} from "../models/AgendaDisponibilidadeModel";
import AgendaDisponibilidadeService from "../services/AgendaDisponibilidadeService";

class AgendaDisponibilidadeController {
  async listar(
    req: Request,
    res: Response,
  ) {
    try {
      const user =
        (req as any).user;

      const prestadorId =
        String(
          user?.usuarioId ||
          user?.id ||
          "",
        ).trim();

      if (!prestadorId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const disponibilidade =
        await AppDataSource
          .getRepository(
            AgendaDisponibilidade,
          )
          .find({
            where: {
              prestadorId,
              ativo: true,
            },
            order: {
              diaSemana: "ASC",
              horaInicio: "ASC",
            },
          });

      const bloqueios =
        await AppDataSource
          .getRepository(
            AgendaBloqueio,
          )
          .find({
            where: {
              prestadorId,
              ativo: true,
            },
            order: {
              data: "ASC",
              horaInicio: "ASC",
            },
          });

      return res.json({
        disponibilidade,
        bloqueios,
      });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          error:
            error?.message ||
            "Erro ao consultar disponibilidade.",
        });
    }
  }

  async criarDisponibilidade(
    req: Request,
    res: Response,
  ) {
    try {
      const user =
        (req as any).user;

      const prestadorId =
        String(
          user?.usuarioId ||
          user?.id ||
          "",
        ).trim();

      if (!prestadorId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const repo =
        AppDataSource
          .getRepository(
            AgendaDisponibilidade,
          );

      const item =
        repo.create({
          ...req.body,
          prestadorId,
          ativo: true,
        });

      const saved =
        await repo.save(item);

      return res
        .status(201)
        .json(saved);
    } catch (error: any) {
      return res
        .status(400)
        .json({
          error:
            error?.message ||
            "Erro ao cadastrar disponibilidade.",
        });
    }
  }

  async criarBloqueio(
    req: Request,
    res: Response,
  ) {
    try {
      const user =
        (req as any).user;

      const prestadorId =
        String(
          user?.usuarioId ||
          user?.id ||
          "",
        ).trim();

      if (!prestadorId) {
        return res
          .status(401)
          .json({
            error:
              "Não autenticado",
          });
      }

      const repo =
        AppDataSource
          .getRepository(
            AgendaBloqueio,
          );

      const item =
        repo.create({
          ...req.body,
          prestadorId,
          ativo: true,
        });

      const saved =
        await repo.save(item);

      return res
        .status(201)
        .json(saved);
    } catch (error: any) {
      return res
        .status(400)
        .json({
          error:
            error?.message ||
            "Erro ao cadastrar bloqueio.",
        });
    }
  }

  async consultarHorario(
    req: Request,
    res: Response,
  ) {
    try {
      const result =
        await AgendaDisponibilidadeService
          .consultarHorario(
            req.body,
          );

      return res.json(
        result,
      );
    } catch (error: any) {
      return res
        .status(400)
        .json({
          error:
            error?.message ||
            "Erro ao consultar horário.",
        });
    }
  }
}

export default new AgendaDisponibilidadeController();