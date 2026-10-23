// src/routes/routerAgenda.ts

import { Router } from "express";
import AgendaController from "../controller/AgendaController";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerAgenda = Router();

/**
 * ============================================================
 * CRIAÇÃO / PROPOSTA INICIAL
 * ============================================================
 */

routerAgenda.post(
  "/agenda/agendar",
  authMiddleware,
  AgendaController.agendar.bind(
    AgendaController
  )
);

/**
 * ============================================================
 * NEGOCIAÇÃO DO HORÁRIO - MORADOR
 * ============================================================
 */

routerAgenda.post(
  "/agenda/:agendaId/confirmar-horario",
  authMiddleware,
  AgendaController.confirmarHorarioMorador.bind(
    AgendaController
  )
);

routerAgenda.post(
  "/agenda/:agendaId/propor-horario",
  authMiddleware,
  AgendaController.proporHorarioMorador.bind(
    AgendaController
  )
);

routerAgenda.post(
  "/agenda/:agendaId/recusar-horario",
  authMiddleware,
  AgendaController.recusarHorarioMorador.bind(
    AgendaController
  )
);

/**
 * ============================================================
 * NEGOCIAÇÃO DO HORÁRIO - PRESTADOR
 * ============================================================
 */

routerAgenda.post(
  "/agenda/:agendaId/confirmar-horario-prestador",
  authMiddleware,
  AgendaController.confirmarHorarioPrestador.bind(
    AgendaController
  )
);

routerAgenda.post(
  "/agenda/:agendaId/propor-horario-prestador",
  authMiddleware,
  AgendaController.proporHorarioPrestador.bind(
    AgendaController
  )
);

/**
 * ============================================================
 * EXECUÇÃO
 * ============================================================
 */

routerAgenda.post(
  "/agenda/:agendaId/checkin-cliente",
  authMiddleware,
  AgendaController.checkinCliente.bind(
    AgendaController
  )
);

routerAgenda.post(
  "/agenda/assinar-encerrar",
  authMiddleware,
  AgendaController.assinarEEncerrar.bind(
    AgendaController
  )
);

/**
 * ============================================================
 * CONTRATO / DISTRATO
 * ============================================================
 */

routerAgenda.post(
  "/agenda/contrato/:ofertaId/distrato",
  authMiddleware,
  AgendaController.rescindirPacote.bind(
    AgendaController
  )
);

/**
 * ============================================================
 * CONSULTA DA AGENDA
 * ============================================================
 */

routerAgenda.get(
  "/servicos/agenda/meus",
  authMiddleware,
  AgendaController.listarMinhaAgenda.bind(
    AgendaController
  )
);

export default routerAgenda;