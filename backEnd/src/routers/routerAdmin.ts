
// src/routers/routerAdmin.ts

import { Router } from "express";

import AdminController from "../controller/AdminController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { isAdminMiddleware } from "../middlewares/isAdminMiddleware";

const routerAdmin = Router();

/**
 * ============================================================
 * SEGURANÇA ADMINISTRATIVA
 * ============================================================
 *
 * Todas as rotas deste módulo exigem:
 * 1. Usuário autenticado
 * 2. Permissão de administrador
 *
 * Evita que informações administrativas e operações
 * financeiras sejam acessadas por usuários comuns.
 */
routerAdmin.use(authMiddleware);
routerAdmin.use(isAdminMiddleware);

/**
 * ============================================================
 * RADAR DE DEMANDA
 * ============================================================
 */

// Consultar Radar de Demanda
routerAdmin.get(
  "/radar-demanda",
  AdminController.getRadarDemanda
);

// Atualizar oportunidade do Radar
routerAdmin.patch(
  "/radar-demanda/oportunidade",
  AdminController.atualizarOportunidadeRadar
);

/**
 * ============================================================
 * VÍNCULOS DE PROFISSIONAIS ÀS OPORTUNIDADES
 * ============================================================
 */

// Listar profissionais vinculados a uma oportunidade
routerAdmin.get(
  "/radar-demanda/oportunidades/:alertaId/profissionais",
  AdminController.listarProfissionaisRadar
);

// Vincular profissional à oportunidade
routerAdmin.post(
  "/radar-demanda/oportunidades/:alertaId/profissionais",
  AdminController.vincularProfissionalRadar
);

// Atualizar vínculo de profissional
routerAdmin.patch(
  "/radar-demanda/profissionais/:vinculoId",
  AdminController.atualizarProfissionalRadar
);

// Associar vínculo a um cadastro existente
routerAdmin.patch(
  "/radar-demanda/profissionais/:vinculoId/associar-cadastro",
  AdminController.associarCadastroProfissionalRadar
);

/**
 * ============================================================
 * ESTATÍSTICAS E ASSINATURAS
 * ============================================================
 */

// Estatísticas administrativas
routerAdmin.get(
  "/stats",
  AdminController.getStats
);

// Listagem de assinaturas
routerAdmin.get(
  "/assinaturas",
  AdminController.getSubscriptions
);

/**
 * ============================================================
 * REEMBOLSOS E SAQUES
 * ============================================================
 */

// Listar solicitações de reembolso
routerAdmin.get(
  "/refund-requests",
  AdminController.getRefundRequests
);

// Processar reembolso
// Rota única, protegida por autenticação e autorização.
routerAdmin.post(
  "/refunds/:id/process",
  AdminController.processRefund
);

/**
 * ============================================================
 * CONFIRMAÇÃO ADMINISTRATIVA DE PAGAMENTO
 * ============================================================
 *
 * TEMPORARIAMENTE DESABILITADA
 *
 * O método antigo AdminService.confirmarPagamento()
 * seleciona o pagamento mais recente diferente de PAID.
 *
 * Isso pode permitir a confirmação indevida de pagamentos
 * FAILED, CANCELED, REFUNDED ou IN_PROCESS.
 *
 * A rota deverá ser reativada somente após implementar:
 *
 * - Identificação do pagamento específico
 * - Validação da origem e situação financeira
 * - Auditoria da confirmação manual
 * - Idempotência
 * - Atualização correta da assinatura PREMIUM
 * - Validação do ciclo MENSAL/TRIMESTRAL/ANUAL
 */

// routerAdmin.patch(
//   "/prestadores/:id/pagamento",
//   AdminController.confirmPayment
// );

/**
 * ============================================================
 * GESTÃO DE USUÁRIOS E PRESTADORES
 * ============================================================
 */

// Atualizar status da conta de empreendedor
routerAdmin.patch(
  "/usuarios/:usuarioId/status_conta",
  AdminController.aprovarEmpreendedor
);

// Listar prestadores aguardando aprovação
routerAdmin.get(
  "/prestadores/aprovacao",
  AdminController.listarPrestadoresParaAprovacao
);

export default routerAdmin;
