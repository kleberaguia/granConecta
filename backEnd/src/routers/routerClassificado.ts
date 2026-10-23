import { Router } from "express";

import {
  criarClassificado,
  listarMeusClassificados,
  buscarMeuClassificado,
  atualizarMeuClassificado,
  adicionarImagensClassificado,
  listarImagensClassificado,
  definirImagemPrincipalClassificado,
  enviarClassificadoParaAnalise,

  // Crédito / publicação
  consultarSaldoClassificado,
  usarCreditoClassificado,
  publicarClassificado,
  marcarClassificadoComoVendido,
} from "../controller/ClassificadoController";

import {
  authMiddleware,
} from "../middlewares/authMiddleware";

import {
  upload,
  processImage,
} from "../config/multerConfig";

const routerClassificado =
  Router();

/**
 * ============================================================
 * CLASSIFICADOS - ÁREA AUTENTICADA
 * ============================================================
 *
 * IMPORTANTE:
 *
 * Rotas específicas precisam ficar antes de:
 *
 * /classificados/:id
 *
 * Exemplos:
 *
 * /classificados/meus
 * /classificados/creditos/saldo
 *
 * precisam ser registradas antes de:
 *
 * /classificados/:id
 *
 * para que "meus" ou "creditos" não sejam
 * interpretados como ID.
 */

/**
 * ============================================================
 * CRIAR CLASSIFICADO
 * ============================================================
 *
 * POST /api/classificados
 *
 * Cria o anúncio inicialmente como RASCUNHO.
 */
routerClassificado.post(
  "/classificados",
  authMiddleware,
  criarClassificado
);

/**
 * ============================================================
 * MEUS CLASSIFICADOS
 * ============================================================
 *
 * GET /api/classificados/meus
 *
 * Retorna somente os anúncios pertencentes
 * ao usuário autenticado.
 */
routerClassificado.get(
  "/classificados/meus",
  authMiddleware,
  listarMeusClassificados
);

/**
 * ============================================================
 * SALDO DE CRÉDITOS
 * ============================================================
 *
 * GET /api/classificados/creditos/saldo
 *
 * Consulta os créditos disponíveis do usuário autenticado.
 *
 * Esta rota precisa ficar antes de:
 *
 * GET /api/classificados/:id
 *
 * para evitar que "creditos" seja interpretado como ID.
 */
routerClassificado.get(
  "/classificados/creditos/saldo",
  authMiddleware,
  consultarSaldoClassificado
);

/**
 * ============================================================
 * ENVIAR PARA ANÁLISE
 * ============================================================
 *
 * POST /api/classificados/:id/enviar-analise
 *
 * Fluxo esperado:
 *
 * RASCUNHO
 *    ↓
 * moderação
 *    ↓
 * AGUARDANDO_PAGAMENTO
 *
 * ou:
 *
 * BLOQUEADO_COMERCIAL
 */
routerClassificado.post(
  "/classificados/:id/enviar-analise",
  authMiddleware,
  enviarClassificadoParaAnalise
);

/**
 * ============================================================
 * UTILIZAR CRÉDITO EXISTENTE
 * ============================================================
 *
 * POST /api/classificados/:id/usar-credito
 *
 * Body:
 *
 * {
 *   "creditoId": "uuid-do-credito"
 * }
 *
 * O endpoint:
 *
 * - valida propriedade do crédito;
 * - valida saldo;
 * - valida validade;
 * - vincula o crédito ao classificado;
 * - muda o crédito para EM_USO;
 * - define duracaoDias usando o saldo disponível.
 *
 * IMPORTANTE:
 *
 * Esta operação NÃO publica o anúncio.
 *
 * Depois dela deve ser chamado:
 *
 * POST /api/classificados/:id/publicar
 */
routerClassificado.post(
  "/classificados/:id/usar-credito",
  authMiddleware,
  usarCreditoClassificado
);

/**
 * ============================================================
 * PUBLICAR CLASSIFICADO
 * ============================================================
 *
 * POST /api/classificados/:id/publicar
 *
 * Requisitos:
 *
 * - status AGUARDANDO_PAGAMENTO;
 * - crédito vinculado;
 * - duracaoDias válida.
 *
 * Resultado:
 *
 * status -> ATIVO
 * publicadoEm -> agora
 * expiraEm -> publicadoEm + duracaoDias
 */
routerClassificado.post(
  "/classificados/:id/publicar",
  authMiddleware,
  publicarClassificado
);

/**
 * ============================================================
 * MARCAR COMO VENDIDO
 * ============================================================
 *
 * POST /api/classificados/:id/vendido
 *
 * Resultado:
 *
 * ATIVO
 *   ↓
 * VENDIDO
 *
 * O ClassificadoService também encerra a utilização
 * do crédito dentro da mesma transação.
 *
 * Somente os dias efetivamente utilizados são consumidos.
 *
 * Se ainda existir saldo:
 *
 * crédito -> DISPONIVEL
 *
 * e os dias restantes poderão ser reutilizados
 * em outro classificado.
 */
routerClassificado.post(
  "/classificados/:id/vendido",
  authMiddleware,
  marcarClassificadoComoVendido
);

/**
 * ============================================================
 * ADICIONAR IMAGENS
 * ============================================================
 *
 * POST /api/classificados/:id/imagens
 *
 * Campo multipart esperado:
 *
 * classificado_imagens
 *
 * É possível enviar até 8 arquivos por requisição.
 *
 * O Service também valida o limite total
 * de 8 imagens por classificado.
 */
routerClassificado.post(
  "/classificados/:id/imagens",

  authMiddleware,

  upload.fields([
    {
      name:
        "classificado_imagens",

      maxCount: 8,
    },
  ]),

  processImage,

  adicionarImagensClassificado
);

/**
 * ============================================================
 * LISTAR IMAGENS
 * ============================================================
 *
 * GET /api/classificados/:id/imagens
 */
routerClassificado.get(
  "/classificados/:id/imagens",
  authMiddleware,
  listarImagensClassificado
);

/**
 * ============================================================
 * DEFINIR IMAGEM PRINCIPAL
 * ============================================================
 *
 * PATCH
 * /api/classificados/:id/imagens/:imagemId/principal
 *
 * Somente uma imagem do anúncio ficará
 * marcada como principal.
 */
routerClassificado.patch(
  "/classificados/:id/imagens/:imagemId/principal",
  authMiddleware,
  definirImagemPrincipalClassificado
);

/**
 * ============================================================
 * BUSCAR UM CLASSIFICADO
 * ============================================================
 *
 * GET /api/classificados/:id
 *
 * IMPORTANTE:
 *
 * Esta rota fica depois das rotas específicas:
 *
 * /meus
 * /creditos/saldo
 * /:id/enviar-analise
 * /:id/usar-credito
 * /:id/publicar
 * /:id/vendido
 * /:id/imagens
 */
routerClassificado.get(
  "/classificados/:id",
  authMiddleware,
  buscarMeuClassificado
);

/**
 * ============================================================
 * ATUALIZAR RASCUNHO
 * ============================================================
 *
 * PATCH /api/classificados/:id
 */
routerClassificado.patch(
  "/classificados/:id",
  authMiddleware,
  atualizarMeuClassificado
);

export default routerClassificado;