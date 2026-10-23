import type {
  Request,
  Response,
} from "express";

import classificadoService from "../services/ClassificadoService";

import classificadoCreditoService from "../services/ClassificadoCreditoService";

import {
  ClassificadoCategoria,
  ClassificadoCondicao,
  ClassificadoStatus,
} from "../models/ClassificadoModel";

/**
 * ============================================================
 * AUXILIARES
 * ============================================================
 */

function obterUsuarioId(
  req: Request
): string | null {
  const usuarioId =
    req.user?.usuarioId ||
    req.user?.id;

  if (!usuarioId) {
    return null;
  }

  return String(
    usuarioId
  ).trim() || null;
}

/**
 * Centraliza os erros conhecidos do módulo de classificados.
 */
function responderErro(
  res: Response,
  error: unknown
): Response {
  const codigo =
    error instanceof Error
      ? error.message
      : "ERRO_DESCONHECIDO";

  switch (codigo) {
    /**
     * --------------------------------------------------------
     * AUTENTICAÇÃO / IDENTIFICAÇÃO
     * --------------------------------------------------------
     */

    case "CLASSIFICADO_USUARIO_OBRIGATORIO":
    case "CLASSIFICADO_USUARIO_NAO_AUTENTICADO":
    case "USUARIO_ID_OBRIGATORIO":
      return res.status(401).json({
        error: codigo,
        message:
          "Usuário autenticado não identificado.",
      });

    /**
     * --------------------------------------------------------
     * CLASSIFICADO
     * --------------------------------------------------------
     */

    case "CLASSIFICADO_NAO_ENCONTRADO":
    case "CLASSIFICADO_NAO_ENCONTRADO_APOS_ENCERRAMENTO":
      return res.status(404).json({
        error: codigo,
        message:
          "Classificado não encontrado.",
      });

    case "CLASSIFICADO_ID_OBRIGATORIO":
      return res.status(400).json({
        error: codigo,
        message:
          "O identificador do classificado é obrigatório.",
      });

    case "CLASSIFICADO_NAO_PERTENCE_AO_USUARIO":
      return res.status(403).json({
        error: codigo,
        message:
          "Este classificado não pertence ao usuário autenticado.",
      });

    case "CLASSIFICADO_NAO_E_RASCUNHO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este classificado não pode mais ser alterado como rascunho.",
      });

    case "CLASSIFICADO_NAO_AGUARDA_PAGAMENTO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este classificado não está aguardando pagamento ou utilização de crédito.",
      });

    case "CLASSIFICADO_NAO_ESTA_PUBLICADO":
    case "CLASSIFICADO_NAO_PUBLICADO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este classificado não está publicado.",
      });

    case "CLASSIFICADO_JA_POSSUI_CREDITO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este classificado já possui um crédito vinculado.",
      });

    case "CLASSIFICADO_SEM_CREDITO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este classificado ainda não possui crédito vinculado.",
      });

    case "STATUS_CLASSIFICADO_NAO_PERMITE_CREDITO":
      return res.status(409).json({
        error: codigo,
        message:
          "O status atual do classificado não permite utilizar crédito.",
      });

    case "CLASSIFICADO_DURACAO_INVALIDA":
      return res.status(400).json({
        error: codigo,
        message:
          "A duração do classificado é inválida.",
      });

    /**
     * --------------------------------------------------------
     * CRÉDITO
     * --------------------------------------------------------
     */

    case "CREDITO_ID_OBRIGATORIO":
      return res.status(400).json({
        error: codigo,
        message:
          "Informe o crédito que será utilizado.",
      });

    case "CREDITO_NAO_ENCONTRADO":
      return res.status(404).json({
        error: codigo,
        message:
          "Crédito não encontrado.",
      });

    case "CREDITO_NAO_PERTENCE_AO_USUARIO":
      return res.status(403).json({
        error: codigo,
        message:
          "Este crédito não pertence ao usuário autenticado.",
      });

    case "CREDITO_NAO_DISPONIVEL":
      return res.status(409).json({
        error: codigo,
        message:
          "Este crédito não está disponível para utilização.",
      });

    case "CREDITO_NAO_ESTA_EM_USO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este crédito não está vinculado a um anúncio em utilização.",
      });

    case "CREDITO_SEM_SALDO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este crédito não possui dias disponíveis.",
      });

    case "CREDITO_EXPIRADO":
      return res.status(409).json({
        error: codigo,
        message:
          "Este crédito está expirado.",
      });

    case "DIAS_INVALIDOS":
      return res.status(400).json({
        error: codigo,
        message:
          "A quantidade de dias do crédito é inválida.",
      });

    case "DATA_CREDITO_INVALIDA":
    case "DATA_ENCERRAMENTO_ANTERIOR_PUBLICACAO":
      return res.status(409).json({
        error: codigo,
        message:
          "Não foi possível calcular corretamente o período de utilização do crédito.",
      });

    case "MOTIVO_ENCERRAMENTO_INVALIDO":
      return res.status(400).json({
        error: codigo,
        message:
          "Motivo de encerramento do crédito inválido.",
      });

    /**
     * --------------------------------------------------------
     * TÍTULO
     * --------------------------------------------------------
     */

    case "CLASSIFICADO_TITULO_OBRIGATORIO":
      return res.status(400).json({
        error: codigo,
        message:
          "Informe o título do anúncio.",
      });

    case "CLASSIFICADO_TITULO_MUITO_CURTO":
      return res.status(400).json({
        error: codigo,
        message:
          "O título do anúncio está muito curto.",
      });

    case "CLASSIFICADO_TITULO_MUITO_LONGO":
      return res.status(400).json({
        error: codigo,
        message:
          "O título pode possuir no máximo 160 caracteres.",
      });

    /**
     * --------------------------------------------------------
     * DESCRIÇÃO
     * --------------------------------------------------------
     */

    case "CLASSIFICADO_DESCRICAO_OBRIGATORIA":
      return res.status(400).json({
        error: codigo,
        message:
          "Informe a descrição do anúncio.",
      });

    case "CLASSIFICADO_DESCRICAO_MUITO_CURTA":
      return res.status(400).json({
        error: codigo,
        message:
          "A descrição do anúncio está muito curta.",
      });

    /**
     * --------------------------------------------------------
     * CATEGORIA / CONDIÇÃO
     * --------------------------------------------------------
     */

    case "CLASSIFICADO_CATEGORIA_INVALIDA":
      return res.status(400).json({
        error: codigo,
        message:
          "Categoria de classificado inválida.",
      });

    case "CLASSIFICADO_CONDICAO_INVALIDA":
      return res.status(400).json({
        error: codigo,
        message:
          "Condição do produto inválida.",
      });

    /**
     * --------------------------------------------------------
     * PREÇO
     * --------------------------------------------------------
     */

    case "CLASSIFICADO_PRECO_INVALIDO":
      return res.status(400).json({
        error: codigo,
        message:
          "Informe um preço válido maior que zero.",
      });

    case "CLASSIFICADO_PRECO_ACIMA_LIMITE":
      return res.status(400).json({
        error: codigo,
        message:
          "O preço informado ultrapassa o limite permitido.",
      });

    /**
     * --------------------------------------------------------
     * IMAGENS
     * --------------------------------------------------------
     */

    case "CLASSIFICADO_IMAGEM_OBRIGATORIA":
      return res.status(400).json({
        error: codigo,
        message:
          "Envie pelo menos uma imagem para o classificado.",
      });

    case "CLASSIFICADO_MAXIMO_8_IMAGENS":
      return res.status(400).json({
        error: codigo,
        message:
          "Cada classificado pode possuir no máximo 8 imagens.",
      });

    case "CLASSIFICADO_ARQUIVO_INVALIDO":
      return res.status(400).json({
        error: codigo,
        message:
          "Um dos arquivos enviados não é uma imagem válida.",
      });

    case "CLASSIFICADO_IMAGEM_ID_INVALIDO":
      return res.status(400).json({
        error: codigo,
        message:
          "Identificador da imagem inválido.",
      });

    case "CLASSIFICADO_IMAGEM_NAO_ENCONTRADA":
      return res.status(404).json({
        error: codigo,
        message:
          "Imagem não encontrada neste classificado.",
      });

    /**
     * --------------------------------------------------------
     * ERRO NÃO MAPEADO
     * --------------------------------------------------------
     */

    default:
      console.error(
        "[ClassificadoController] Erro:",
        error
      );

      return res.status(500).json({
        error: "ERRO_INTERNO",
        message:
          "Não foi possível processar o classificado.",
      });
  }
}

/**
 * ============================================================
 * POST /api/classificados
 * ============================================================
 *
 * Cria um novo classificado como RASCUNHO.
 *
 * O usuarioId nunca é recebido do frontend.
 * Ele é obtido exclusivamente através do usuário autenticado.
 */
export async function criarClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const {
      titulo,
      descricao,
      categoria,
      condicao,
      preco,
    } = req.body ?? {};

    const classificado =
      await classificadoService.criarRascunho({
        usuarioId,

        titulo,
        descricao,

        categoria:
          categoria as ClassificadoCategoria,

        condicao:
          condicao as ClassificadoCondicao,

        preco,
      });

    return res.status(201).json(
      classificado
    );
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * GET /api/classificados/meus
 * ============================================================
 *
 * Lista somente os classificados pertencentes
 * ao usuário autenticado.
 */
export async function listarMeusClassificados(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const classificados =
      await classificadoService.listarMeus(
        usuarioId
      );

    return res.json(
      classificados
    );
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * GET /api/classificados/creditos/saldo
 * ============================================================
 *
 * Retorna o saldo de créditos disponível para o usuário
 * autenticado.
 *
 * O frontend utiliza este endpoint depois da aprovação
 * do classificado para decidir se oferece:
 *
 * - utilização de saldo existente;
 * - ou novo checkout/pagamento.
 */
export async function consultarSaldoClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const saldo =
      await classificadoCreditoService
        .buscarSaldoUsuario(
          usuarioId
        );

    return res.json({
      message:
        saldo.diasDisponiveis > 0
          ? "Você possui crédito disponível para publicar classificados."
          : "Você não possui crédito disponível.",

      possuiCredito:
        saldo.diasDisponiveis > 0,

      ...saldo,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * GET /api/classificados/:id
 * ============================================================
 *
 * Retorna um classificado pertencente
 * ao usuário autenticado.
 */
export async function buscarMeuClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const id =
      String(
        req.params.id ?? ""
      ).trim();

    if (!id) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const classificado =
      await classificadoService.buscarMeuPorId(
        id,
        usuarioId
      );

    return res.json(
      classificado
    );
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * PATCH /api/classificados/:id
 * ============================================================
 *
 * Atualiza os dados de um classificado enquanto
 * ele ainda estiver em RASCUNHO.
 */
export async function atualizarMeuClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const id =
      String(
        req.params.id ?? ""
      ).trim();

    if (!id) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const {
      titulo,
      descricao,
      categoria,
      condicao,
      preco,
    } = req.body ?? {};

    const classificado =
      await classificadoService.atualizarRascunho(
        id,
        usuarioId,
        {
          titulo,

          descricao,

          categoria:
            categoria === undefined
              ? undefined
              : categoria as ClassificadoCategoria,

          condicao:
            condicao === undefined
              ? undefined
              : condicao as ClassificadoCondicao,

          preco,
        }
      );

    return res.json(
      classificado
    );
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * POST /api/classificados/:id/imagens
 * ============================================================
 *
 * Recebe as URLs geradas pelo processImage
 * do multerConfig.
 *
 * O Service:
 * - valida propriedade do classificado;
 * - exige RASCUNHO;
 * - limita o total a 8 imagens;
 * - define automaticamente a primeira como principal.
 */
export async function adicionarImagensClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const classificadoId =
      String(
        req.params.id ?? ""
      ).trim();

    if (!classificadoId) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    /**
     * O processImage grava as URLs finais no body.
     */
    const urlsRaw =
      req.body?.classificado_imagens_urls;

    const urls: string[] =
      Array.isArray(urlsRaw)
        ? urlsRaw
          .map((url) =>
            String(
              url ?? ""
            ).trim()
          )
          .filter(Boolean)
        : urlsRaw
          ? [
            String(
              urlsRaw
            ).trim(),
          ].filter(Boolean)
          : [];

    if (
      urls.length === 0
    ) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_IMAGEM_OBRIGATORIA",
        message:
          "Envie pelo menos uma imagem.",
      });
    }

    const imagens =
      await classificadoService.adicionarImagens(
        classificadoId,
        usuarioId,
        urls
      );

    return res.status(201).json({
      message:
        "Imagens adicionadas com sucesso.",

      total:
        imagens.length,

      imagens,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * GET /api/classificados/:id/imagens
 * ============================================================
 *
 * Lista as imagens do classificado do próprio usuário.
 */
export async function listarImagensClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const classificadoId =
      String(
        req.params.id ?? ""
      ).trim();

    if (!classificadoId) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const imagens =
      await classificadoService.listarImagens(
        classificadoId,
        usuarioId
      );

    return res.json({
      total:
        imagens.length,

      imagens,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * PATCH /api/classificados/:id/imagens/:imagemId/principal
 * ============================================================
 *
 * Define uma imagem existente como capa do anúncio.
 *
 * O Service garante que:
 * - o anúncio pertence ao usuário;
 * - a imagem pertence ao anúncio;
 * - somente uma imagem fique marcada como principal.
 */
export async function definirImagemPrincipalClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const classificadoId =
      String(
        req.params.id ?? ""
      ).trim();

    if (!classificadoId) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const imagemId =
      Number(
        req.params.imagemId
      );

    if (
      !Number.isInteger(
        imagemId
      ) ||
      imagemId <= 0
    ) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_IMAGEM_ID_INVALIDO",
        message:
          "Imagem inválida.",
      });
    }

    const imagens =
      await classificadoService.definirImagemPrincipal(
        classificadoId,
        imagemId,
        usuarioId
      );

    return res.json({
      message:
        "Imagem principal alterada com sucesso.",

      imagens,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * POST /api/classificados/:id/enviar-analise
 * ============================================================
 *
 * Envia um classificado em RASCUNHO para a moderação.
 *
 * O Service:
 * - valida se pertence ao usuário autenticado;
 * - exige pelo menos uma imagem;
 * - calcula a recorrência dos últimos 30 dias;
 * - executa a moderação;
 * - libera para pagamento ou bloqueia conteúdo comercial;
 * - registra todos os eventos de auditoria.
 */
export async function enviarClassificadoParaAnalise(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",

        message:
          "Usuário não autenticado.",
      });
    }

    const classificadoId =
      String(
        req.params.id ?? ""
      ).trim();

    if (!classificadoId) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",

        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const resultado =
      await classificadoService.enviarParaAnalise(
        classificadoId,
        usuarioId
      );

    /**
     * O frontend recebe a decisão completa.
     *
     * Permitido:
     *   status -> AGUARDANDO_PAGAMENTO
     *
     * Comercial/serviço:
     *   status -> BLOQUEADO_COMERCIAL
     *   destino -> EMPREENDEDOR ou PRESTADOR
     */
    let message: string;

    switch (resultado.classificado.status) {
      case ClassificadoStatus.AGUARDANDO_PAGAMENTO:
        message =
          "Classificado analisado. O anúncio pode seguir para o pagamento.";
        break;

      case ClassificadoStatus.BLOQUEADO_COMERCIAL:
        if (
          resultado.moderacao.destino === "PRESTADOR" ||
          resultado.moderacaoImagens.destino === "PRESTADOR"
        ) {
          message =
            "Identificamos que este anúncio parece divulgar uma prestação de serviço. " +
            "O Classificados é destinado a vendas ocasionais entre moradores. " +
            "Você pode cadastrar seus serviços como prestador no GranConecta.";
        } else {
          message =
            "Identificamos que este anúncio parece divulgar uma atividade comercial. " +
            "O Classificados é destinado a vendas ocasionais entre moradores. " +
            "Você pode cadastrar seu negócio no GranConecta.";
        }
        break;

      case ClassificadoStatus.REJEITADO:
        message =
          "Uma ou mais imagens do anúncio não atendem às regras do Classificados. " +
          "Remova ou substitua o conteúdo indicado para continuar.";
        break;

      case ClassificadoStatus.EM_ANALISE:
        message =
          "Não foi possível concluir a análise automática deste anúncio. " +
          "Ele permanecerá em análise antes de poder ser publicado.";
        break;

      default:
        message =
          "Classificado analisado.";
        break;
    }

    return res.json({
      message,

      classificado:
        resultado.classificado,

      moderacao:
        resultado.moderacao,

      moderacaoImagens:
        resultado.moderacaoImagens,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * POST /api/classificados/:id/usar-credito
 * ============================================================
 *
 * Vincula um crédito já comprado ao classificado.
 *
 * BODY:
 *
 * {
 *   "creditoId": "uuid-do-credito"
 * }
 *
 * IMPORTANTE:
 *
 * Esta operação NÃO publica o classificado.
 *
 * Ela apenas:
 *
 * - valida o crédito;
 * - valida que pertence ao usuário;
 * - valida o saldo;
 * - valida a validade;
 * - vincula o crédito ao classificado;
 * - muda o crédito para EM_USO;
 * - copia os dias disponíveis para duracaoDias.
 *
 * Depois desta operação o frontend chama:
 *
 * POST /api/classificados/:id/publicar
 */
export async function usarCreditoClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const classificadoId =
      String(
        req.params.id ?? ""
      ).trim();

    if (!classificadoId) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const creditoId =
      String(
        req.body?.creditoId ?? ""
      ).trim();

    if (!creditoId) {
      return res.status(400).json({
        error:
          "CREDITO_ID_OBRIGATORIO",
        message:
          "Informe o crédito que será utilizado.",
      });
    }

    const resultado =
      await classificadoCreditoService
        .vincularCreditoAoClassificado(
          creditoId,
          classificadoId,
          usuarioId
        );

    return res.json({
      message:
        "Crédito vinculado ao classificado com sucesso.",

      classificado:
        resultado.classificado,

      credito:
        resultado.credito,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * POST /api/classificados/:id/publicar
 * ============================================================
 *
 * Publica um classificado depois que o crédito
 * já estiver vinculado.
 *
 * Requisitos tratados pelo Service:
 *
 * - classificado pertence ao usuário;
 * - status = AGUARDANDO_PAGAMENTO;
 * - possui creditoId;
 * - possui duracaoDias válida.
 *
 * Ao publicar:
 *
 * - status -> ATIVO;
 * - publicadoEm -> agora;
 * - expiraEm -> agora + duracaoDias.
 */
export async function publicarClassificado(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const classificadoId =
      String(
        req.params.id ?? ""
      ).trim();

    if (!classificadoId) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const classificado =
      await classificadoService.publicar(
        classificadoId,
        usuarioId
      );

    return res.json({
      message:
        "Classificado publicado com sucesso.",

      classificado,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}

/**
 * ============================================================
 * POST /api/classificados/:id/vendido
 * ============================================================
 *
 * Marca um anúncio ATIVO como vendido.
 *
 * O ClassificadoService executa o encerramento do crédito
 * dentro da mesma transação.
 *
 * Isso garante:
 *
 * - cálculo dos dias efetivamente utilizados;
 * - atualização de diasConsumidos;
 * - atualização de diasRestantes;
 * - devolução do saldo não utilizado;
 * - crédito volta para DISPONIVEL se houver saldo;
 * - creditoId é removido do classificado;
 * - classificado passa para VENDIDO.
 */
export async function marcarClassificadoComoVendido(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const usuarioId =
      obterUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({
        error:
          "CLASSIFICADO_USUARIO_NAO_AUTENTICADO",
        message:
          "Usuário não autenticado.",
      });
    }

    const classificadoId =
      String(
        req.params.id ?? ""
      ).trim();

    if (!classificadoId) {
      return res.status(400).json({
        error:
          "CLASSIFICADO_ID_OBRIGATORIO",
        message:
          "O identificador do classificado é obrigatório.",
      });
    }

    const classificado =
      await classificadoService
        .marcarComoVendido(
          classificadoId,
          usuarioId
        );

    /**
     * Depois da venda consultamos novamente o saldo.
     *
     * Isso é útil para o frontend mostrar imediatamente:
     *
     * "Você ainda possui X dias disponíveis."
     */
    const saldo =
      await classificadoCreditoService
        .buscarSaldoUsuario(
          usuarioId
        );

    return res.json({
      message:
        saldo.diasDisponiveis > 0
          ? `Classificado marcado como vendido. Você ainda possui ${saldo.diasDisponiveis} dias disponíveis.`
          : "Classificado marcado como vendido.",

      classificado,

      saldoCredito: saldo,
    });
  } catch (error) {
    return responderErro(
      res,
      error
    );
  }
}