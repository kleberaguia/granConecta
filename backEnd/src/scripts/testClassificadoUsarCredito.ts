import "reflect-metadata";

import { AppDataSource } from "../config/data-source";

import classificadoService from "../services/ClassificadoService";
import classificadoCreditoService from "../services/ClassificadoCreditoService";

import {
  ClassificadoCategoria,
  ClassificadoCondicao,
  ClassificadoStatus,
} from "../models/ClassificadoModel";

import {
  ClassificadoCredito,
  ClassificadoCreditoStatus,
} from "../models/ClassificadoCreditoModel";

import {
  ClassificadoCreditoMovimento,
} from "../models/ClassificadoCreditoMovimentoModel";

const USUARIO_ID =
  "31a74354-06d1-42eb-a3b9-e32744122ec6";

const CREDITO_ID =
  "2ad31a32-b3bd-4468-8976-1b4982cd4942";

async function main(): Promise<void> {
  console.log("");
  console.log("========================================");
  console.log(" TESTE - USAR CRÉDITO NO CLASSIFICADO");
  console.log("========================================");
  console.log("");

  try {
    /*
     * ============================================================
     * 1. BANCO
     * ============================================================
     */

    console.log("1. Inicializando banco de dados...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("   ✓ Banco conectado");
    console.log("");

    /*
     * ============================================================
     * 2. CONFERIR CRÉDITO EXISTENTE
     * ============================================================
     */

    console.log("2. Conferindo crédito existente...");

    const creditoRepository =
      AppDataSource.getRepository(
        ClassificadoCredito
      );

    const creditoAntes =
      await creditoRepository.findOne({
        where: {
          id: CREDITO_ID,
          usuarioId: USUARIO_ID,
        },
      });

    if (!creditoAntes) {
      throw new Error(
        "CREDITO_TESTE_NAO_ENCONTRADO"
      );
    }

    console.log(
      `   ID: ${creditoAntes.id}`
    );

    console.log(
      `   Plano: ${creditoAntes.plano}`
    );

    console.log(
      `   Status: ${creditoAntes.status}`
    );

    console.log(
      `   Dias restantes: ${creditoAntes.diasRestantes}`
    );

    if (
      creditoAntes.status !==
      ClassificadoCreditoStatus.DISPONIVEL
    ) {
      throw new Error(
        `CREDITO_NAO_ESTA_DISPONIVEL: ${creditoAntes.status}`
      );
    }

    console.log("   ✓ Crédito disponível");
    console.log("");

    /*
     * ============================================================
     * 3. CRIAR CLASSIFICADO
     * ============================================================
     */

    console.log(
      "3. Criando classificado de teste..."
    );

    const classificado =
      await classificadoService.criarRascunho({
        usuarioId: USUARIO_ID,

        titulo:
          "Bicicleta usada para venda",

        descricao:
          "Bicicleta usada em bom estado, venda ocasional para teste do sistema de classificados.",

        /*
         * Se o seu enum utilizar outro nome,
         * o TypeScript indicará aqui.
         *
         * Estes são os valores mais prováveis
         * para o modelo atual.
         */
        categoria:
          ClassificadoCategoria.OUTROS,

        condicao:
          ClassificadoCondicao.USADO,

        preco: 500,
      });

    console.log(
      `   ID: ${classificado.id}`
    );

    console.log(
      `   Status: ${classificado.status}`
    );

    if (
      classificado.status !==
      ClassificadoStatus.RASCUNHO
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_NASCEU_COMO_RASCUNHO"
      );
    }

    console.log(
      "   ✓ Classificado criado como RASCUNHO"
    );

    console.log("");

    /*
     * ============================================================
     * 4. ADICIONAR IMAGEM
     * ============================================================
     *
     * O service grava apenas a URL.
     * Para este teste não precisamos fazer upload físico.
     */

    console.log(
      "4. Adicionando imagem de teste..."
    );

    const imagens =
      await classificadoService.adicionarImagens(
        classificado.id,
        USUARIO_ID,
        [
          "https://teste.local/classificados/bicicleta-teste.jpg",
        ]
      );

    console.log(
      `   Imagens cadastradas: ${imagens.length}`
    );

    if (imagens.length <= 0) {
      throw new Error(
        "IMAGEM_NAO_FOI_CADASTRADA"
      );
    }

    console.log("   ✓ Imagem cadastrada");
    console.log("");

    /*
     * ============================================================
     * 5. ENVIAR PARA ANÁLISE
     * ============================================================
     */

    console.log(
      "5. Enviando classificado para análise..."
    );

    const resultadoAnalise =
      await classificadoService.enviarParaAnalise(
        classificado.id,
        USUARIO_ID
      );

    const classificadoAnalisado =
      resultadoAnalise.classificado;

    console.log(
      `   Permitido: ${resultadoAnalise.moderacao.permitido}`
    );

    console.log(
      `   Classificação: ${resultadoAnalise.moderacao.classificacao}`
    );

    console.log(
      `   Destino: ${resultadoAnalise.moderacao.destino}`
    );

    console.log(
      `   Status: ${classificadoAnalisado.status}`
    );

    if (!resultadoAnalise.moderacao.permitido) {
      console.log("");
      console.log(
        "   Motivos da moderação:"
      );

      console.log(
        resultadoAnalise.moderacao.motivos
      );

      throw new Error(
        "CLASSIFICADO_BLOQUEADO_PELA_MODERACAO"
      );
    }

    if (
      classificadoAnalisado.status !==
      ClassificadoStatus.AGUARDANDO_PAGAMENTO
    ) {
      throw new Error(
        `STATUS_INESPERADO_APOS_ANALISE: ${classificadoAnalisado.status}`
      );
    }

    console.log(
      "   ✓ Classificado aguardando pagamento/crédito"
    );

    console.log("");

    /*
     * ============================================================
     * 6. VINCULAR CRÉDITO
     * ============================================================
     */

    console.log(
      "6. Vinculando crédito ao classificado..."
    );

    const resultadoVinculo =
      await classificadoCreditoService
        .vincularCreditoAoClassificado(
          CREDITO_ID,
          classificado.id,
          USUARIO_ID
        );

    console.log(
      `   Classificado: ${resultadoVinculo.classificado.id}`
    );

    console.log(
      `   Crédito: ${resultadoVinculo.credito.id}`
    );

    console.log(
      `   creditoId no classificado: ${resultadoVinculo.classificado.creditoId}`
    );

    console.log(
      `   Duração: ${resultadoVinculo.classificado.duracaoDias} dias`
    );

    console.log(
      `   Status do crédito: ${resultadoVinculo.credito.status}`
    );

    console.log("");

    /*
     * ============================================================
     * 7. VALIDAR VÍNCULO
     * ============================================================
     */

    console.log(
      "7. Validando resultado..."
    );

    if (
      resultadoVinculo.classificado.creditoId !==
      CREDITO_ID
    ) {
      throw new Error(
        "CREDITO_NAO_VINCULADO_AO_CLASSIFICADO"
      );
    }

    console.log(
      "   ✓ creditoId vinculado corretamente"
    );

    if (
      Number(
        resultadoVinculo.classificado.duracaoDias
      ) !==
      Number(creditoAntes.diasRestantes)
    ) {
      throw new Error(
        "DURACAO_CLASSIFICADO_DIFERENTE_DO_SALDO"
      );
    }

    console.log(
      `   ✓ Duração recebeu os ${creditoAntes.diasRestantes} dias disponíveis`
    );

    if (
      resultadoVinculo.credito.status !==
      ClassificadoCreditoStatus.EM_USO
    ) {
      throw new Error(
        "CREDITO_NAO_MUDOU_PARA_EM_USO"
      );
    }

    console.log(
      "   ✓ Crédito mudou para EM_USO"
    );

    /*
     * ============================================================
     * 8. CONFERIR MOVIMENTO
     * ============================================================
     */

    const movimentoRepository =
      AppDataSource.getRepository(
        ClassificadoCreditoMovimento
      );

    const movimentos =
      await movimentoRepository.find({
        where: {
          creditoId: CREDITO_ID,
        },
        order: {
          id: "ASC",
        },
      });

    const movimentoInicio =
      movimentos.find(
        (movimento) =>
          String(movimento.tipo) ===
          "ANUNCIO_INICIADO"
      );

    if (!movimentoInicio) {
      throw new Error(
        "MOVIMENTO_ANUNCIO_INICIADO_NAO_ENCONTRADO"
      );
    }

    console.log(
      "   ✓ Movimento ANUNCIO_INICIADO registrado"
    );

    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      " TESTE CONCLUÍDO COM SUCESSO"
    );

    console.log(
      "========================================"
    );

    console.log("");

    console.log(
      `Classificado criado: ${classificado.id}`
    );

    console.log(
      `Crédito utilizado: ${CREDITO_ID}`
    );

    console.log(
      `Saldo reservado: ${resultadoVinculo.credito.diasRestantes} dias`
    );

    console.log("");

    console.log(
      "IMPORTANTE: não execute este teste novamente"
    );

    console.log(
      "antes do próximo passo, pois o crédito agora"
    );

    console.log(
      "deverá estar EM_USO."
    );

    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "========================================"
    );

    console.error(
      " ERRO NO TESTE"
    );

    console.error(
      "========================================"
    );

    if (error instanceof Error) {
      console.error(
        `Mensagem: ${error.message}`
      );

      console.error("");
      console.error(error.stack);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      console.log("");
      console.log(
        "Fechando conexão com o banco..."
      );

      await AppDataSource.destroy();

      console.log(
        "✓ Conexão encerrada"
      );
    }
  }
}

main();