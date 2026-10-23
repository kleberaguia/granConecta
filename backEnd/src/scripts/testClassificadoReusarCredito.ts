import "reflect-metadata";

import { AppDataSource } from "../config/data-source";

import classificadoService from "../services/ClassificadoService";
import classificadoCreditoService from "../services/ClassificadoCreditoService";

import {
  Classificado,
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

/**
 * ============================================================
 * DADOS FIXOS DO TESTE
 * ============================================================
 */

const USUARIO_ID =
  "31a74354-06d1-42eb-a3b9-e32744122ec6";

const CREDITO_ID =
  "2ad31a32-b3bd-4468-8976-1b4982cd4942";

/**
 * Quantidade de períodos de 24h que queremos simular.
 *
 * O saldo inicial NÃO é fixo.
 * O teste consulta o saldo atual do banco e calcula:
 *
 * saldoEsperado = saldoInicial - DIAS_SIMULADOS
 */
const DIAS_SIMULADOS = 3;

const MS_POR_DIA =
  24 * 60 * 60 * 1000;

async function main(): Promise<void> {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    " TESTE - REUTILIZAÇÃO DINÂMICA DO CRÉDITO"
  );
  console.log(
    "========================================"
  );
  console.log("");

  let novoClassificadoId:
    | string
    | null = null;

  try {
    /**
     * ============================================================
     * 1. BANCO
     * ============================================================
     */

    console.log(
      "1. Inicializando banco de dados..."
    );

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log(
      "   ✓ Banco conectado"
    );

    console.log("");

    const creditoRepository =
      AppDataSource.getRepository(
        ClassificadoCredito
      );

    const classificadoRepository =
      AppDataSource.getRepository(
        Classificado
      );

    const movimentoRepository =
      AppDataSource.getRepository(
        ClassificadoCreditoMovimento
      );

    /**
     * ============================================================
     * 2. CONSULTAR SALDO ATUAL
     * ============================================================
     */

    console.log(
      "2. Consultando crédito atual..."
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

    const saldoInicial =
      Number(
        creditoAntes.diasRestantes
      );

    const consumidosAntes =
      Number(
        creditoAntes.diasConsumidos
      );

    const comprados =
      Number(
        creditoAntes.diasComprados
      );

    console.log(
      `   Crédito: ${creditoAntes.id}`
    );

    console.log(
      `   Plano: ${creditoAntes.plano}`
    );

    console.log(
      `   Status: ${creditoAntes.status}`
    );

    console.log(
      `   Dias comprados: ${comprados}`
    );

    console.log(
      `   Dias consumidos anteriormente: ${consumidosAntes}`
    );

    console.log(
      `   Saldo disponível: ${saldoInicial}`
    );

    if (
      creditoAntes.status !==
      ClassificadoCreditoStatus.DISPONIVEL
    ) {
      throw new Error(
        `CREDITO_NAO_DISPONIVEL: ${creditoAntes.status}`
      );
    }

    if (
      saldoInicial <= 0
    ) {
      throw new Error(
        "CREDITO_SEM_SALDO"
      );
    }

    if (
      saldoInicial <
      DIAS_SIMULADOS
    ) {
      throw new Error(
        `SALDO_INSUFICIENTE_PARA_TESTE: saldo=${saldoInicial}, necessario=${DIAS_SIMULADOS}`
      );
    }

    /**
     * Regra fundamental do crédito.
     */
    if (
      consumidosAntes +
        saldoInicial !==
      comprados
    ) {
      throw new Error(
        `CREDITO_INCONSISTENTE_ANTES_DO_TESTE: comprados=${comprados}, consumidos=${consumidosAntes}, restantes=${saldoInicial}`
      );
    }

    const saldoEsperado =
      saldoInicial -
      DIAS_SIMULADOS;

    console.log("");
    console.log(
      "   Resultado esperado:"
    );

    console.log(
      `   ${saldoInicial} - ${DIAS_SIMULADOS} = ${saldoEsperado}`
    );

    console.log(
      "   ✓ Crédito disponível para reutilização"
    );

    console.log("");

    /**
     * ============================================================
     * 3. CRIAR NOVO CLASSIFICADO
     * ============================================================
     */

    console.log(
      "3. Criando novo classificado..."
    );

    const timestamp =
      Date.now();

    const novoClassificado =
      await classificadoService
        .criarRascunho({
          usuarioId:
            USUARIO_ID,

          titulo:
            `Item usado teste ${timestamp}`,

          descricao:
            "Produto residencial usado em bom estado. Classificado criado automaticamente para validar a reutilização dinâmica do crédito.",

          categoria:
            ClassificadoCategoria.OUTROS,

          condicao:
            ClassificadoCondicao.USADO,

          preco: 250,
        });

    novoClassificadoId =
      novoClassificado.id;

    console.log(
      `   ID: ${novoClassificado.id}`
    );

    console.log(
      `   Status: ${novoClassificado.status}`
    );

    if (
      novoClassificado.status !==
      ClassificadoStatus.RASCUNHO
    ) {
      throw new Error(
        "NOVO_CLASSIFICADO_NAO_ESTA_EM_RASCUNHO"
      );
    }

    console.log(
      "   ✓ Rascunho criado"
    );

    console.log("");

    /**
     * ============================================================
     * 4. IMAGEM
     * ============================================================
     */

    console.log(
      "4. Adicionando imagem..."
    );

    const imagens =
      await classificadoService
        .adicionarImagens(
          novoClassificado.id,
          USUARIO_ID,
          [
            `https://teste.local/classificados/item-${timestamp}.jpg`,
          ]
        );

    console.log(
      `   Imagens cadastradas: ${imagens.length}`
    );

    if (
      imagens.length === 0
    ) {
      throw new Error(
        "IMAGEM_NAO_CADASTRADA"
      );
    }

    console.log(
      "   ✓ Imagem cadastrada"
    );

    console.log("");

    /**
     * ============================================================
     * 5. MODERAÇÃO
     * ============================================================
     */

    console.log(
      "5. Enviando para análise..."
    );

    const analise =
      await classificadoService
        .enviarParaAnalise(
          novoClassificado.id,
          USUARIO_ID
        );

    console.log(
      `   Permitido: ${analise.moderacao.permitido}`
    );

    console.log(
      `   Classificação: ${analise.moderacao.classificacao}`
    );

    console.log(
      `   Destino: ${analise.moderacao.destino}`
    );

    console.log(
      `   Status: ${analise.classificado.status}`
    );

    if (
      !analise.moderacao.permitido
    ) {
      throw new Error(
        "CLASSIFICADO_BLOQUEADO_PELA_MODERACAO"
      );
    }

    if (
      analise.classificado.status !==
      ClassificadoStatus.AGUARDANDO_PAGAMENTO
    ) {
      throw new Error(
        `STATUS_APOS_ANALISE_INVALIDO: ${analise.classificado.status}`
      );
    }

    console.log(
      "   ✓ Classificado aprovado"
    );

    console.log("");

    /**
     * ============================================================
     * 6. VINCULAR SALDO EXISTENTE
     * ============================================================
     */

    console.log(
      "6. Vinculando crédito existente..."
    );

    const vinculo =
      await classificadoCreditoService
        .vincularCreditoAoClassificado(
          CREDITO_ID,
          novoClassificado.id,
          USUARIO_ID
        );

    console.log(
      `   Crédito: ${vinculo.credito.id}`
    );

    console.log(
      `   Status crédito: ${vinculo.credito.status}`
    );

    console.log(
      `   Classificado: ${vinculo.classificado.id}`
    );

    console.log(
      `   Duração recebida: ${vinculo.classificado.duracaoDias}`
    );

    if (
      vinculo.credito.status !==
      ClassificadoCreditoStatus.EM_USO
    ) {
      throw new Error(
        "CREDITO_NAO_MUDOU_PARA_EM_USO"
      );
    }

    if (
      Number(
        vinculo.classificado
          .duracaoDias
      ) !== saldoInicial
    ) {
      throw new Error(
        `DURACAO_INCORRETA: esperado=${saldoInicial}, atual=${vinculo.classificado.duracaoDias}`
      );
    }

    console.log(
      `   ✓ ${saldoInicial} dias vinculados ao anúncio`
    );

    console.log("");

    /**
     * ============================================================
     * 7. PUBLICAR
     * ============================================================
     */

    console.log(
      "7. Publicando classificado..."
    );

    const publicado =
      await classificadoService
        .publicar(
          novoClassificado.id,
          USUARIO_ID
        );

    console.log(
      `   Status: ${publicado.status}`
    );

    console.log(
      `   Publicado em: ${publicado.publicadoEm?.toISOString()}`
    );

    console.log(
      `   Expira em: ${publicado.expiraEm?.toISOString()}`
    );

    if (
      publicado.status !==
      ClassificadoStatus.ATIVO
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_FICOU_ATIVO"
      );
    }

    if (
      !publicado.publicadoEm ||
      !publicado.expiraEm
    ) {
      throw new Error(
        "DATAS_PUBLICACAO_INVALIDAS"
      );
    }

    console.log(
      "   ✓ Classificado publicado"
    );

    console.log("");

    /**
     * ============================================================
     * 8. SIMULAR 3 PERÍODOS DE 24 HORAS
     * ============================================================
     *
     * A regra atual do ClassificadoCreditoService é:
     *
     * fração iniciada = dia consumido.
     *
     * Existe uma pequena tolerância operacional para evitar:
     *
     * 72h + alguns milissegundos => 4 dias.
     *
     * Portanto esperamos exatamente 3.
     */

    console.log(
      `8. Simulando ${DIAS_SIMULADOS} dias de utilização...`
    );

    const referencia =
      new Date();

    const publicadoEmSimulado =
      new Date(
        referencia.getTime() -
          DIAS_SIMULADOS *
            MS_POR_DIA
      );

    publicado.publicadoEm =
      publicadoEmSimulado;

    await classificadoRepository.save(
      publicado
    );

    console.log(
      `   Publicado em ajustado: ${publicadoEmSimulado.toISOString()}`
    );

    console.log(
      `   Períodos simulados: ${DIAS_SIMULADOS}`
    );

    console.log(
      "   ✓ Tempo simulado"
    );

    console.log("");

    /**
     * ============================================================
     * 9. VENDER
     * ============================================================
     */

    console.log(
      "9. Marcando como vendido..."
    );

    const vendido =
      await classificadoService
        .marcarComoVendido(
          novoClassificado.id,
          USUARIO_ID
        );

    console.log(
      `   Status: ${vendido.status}`
    );

    console.log(
      `   Vendido em: ${vendido.vendidoEm?.toISOString()}`
    );

    console.log(
      `   creditoId após venda: ${vendido.creditoId}`
    );

    if (
      vendido.status !==
      ClassificadoStatus.VENDIDO
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_FICOU_VENDIDO"
      );
    }

    if (
      vendido.creditoId
    ) {
      throw new Error(
        "CREDITO_CONTINUA_VINCULADO"
      );
    }

    console.log(
      "   ✓ Classificado vendido"
    );

    console.log(
      "   ✓ Crédito desvinculado"
    );

    console.log("");

    /**
     * ============================================================
     * 10. CONSULTAR RESULTADO
     * ============================================================
     */

    console.log(
      "10. Conferindo resultado financeiro..."
    );

    const creditoDepois =
      await creditoRepository.findOne({
        where: {
          id: CREDITO_ID,
          usuarioId: USUARIO_ID,
        },
      });

    if (!creditoDepois) {
      throw new Error(
        "CREDITO_NAO_ENCONTRADO_APOS_VENDA"
      );
    }

    const saldoFinal =
      Number(
        creditoDepois.diasRestantes
      );

    const consumidosDepois =
      Number(
        creditoDepois.diasConsumidos
      );

    const consumidosNesteAnuncio =
      consumidosDepois -
      consumidosAntes;

    console.log(
      `   Status crédito: ${creditoDepois.status}`
    );

    console.log(
      `   Saldo inicial: ${saldoInicial}`
    );

    console.log(
      `   Consumido neste anúncio: ${consumidosNesteAnuncio}`
    );

    console.log(
      `   Saldo esperado: ${saldoEsperado}`
    );

    console.log(
      `   Saldo encontrado: ${saldoFinal}`
    );

    console.log(
      `   Consumidos acumulados: ${consumidosDepois}`
    );

    /**
     * Aqui está a validação principal.
     */
    if (
      consumidosNesteAnuncio !==
      DIAS_SIMULADOS
    ) {
      throw new Error(
        `DIAS_CONSUMIDOS_INCORRETOS: esperado=${DIAS_SIMULADOS}, atual=${consumidosNesteAnuncio}`
      );
    }

    if (
      saldoFinal !==
      saldoEsperado
    ) {
      throw new Error(
        `SALDO_FINAL_INCORRETO: esperado=${saldoEsperado}, atual=${saldoFinal}`
      );
    }

    /**
     * A soma sempre precisa fechar.
     */
    if (
      consumidosDepois +
        saldoFinal !==
      comprados
    ) {
      throw new Error(
        `CREDITO_INCONSISTENTE_APOS_TESTE: comprados=${comprados}, consumidos=${consumidosDepois}, restantes=${saldoFinal}`
      );
    }

    /**
     * Como ainda deve existir saldo,
     * esperamos DISPONIVEL.
     */
    if (
      saldoFinal > 0 &&
      creditoDepois.status !==
        ClassificadoCreditoStatus.DISPONIVEL
    ) {
      throw new Error(
        `CREDITO_NAO_VOLTOU_PARA_DISPONIVEL: ${creditoDepois.status}`
      );
    }

    console.log("");
    console.log(
      `   ✓ Foram consumidos exatamente ${DIAS_SIMULADOS} dias`
    );

    console.log(
      `   ✓ Restaram ${saldoFinal} dias`
    );

    console.log(
      "   ✓ A conta comprados = consumidos + restantes fechou"
    );

    console.log("");

    /**
     * ============================================================
     * 11. VALIDAR MOVIMENTOS DESTE ANÚNCIO
     * ============================================================
     */

    console.log(
      "11. Conferindo movimentos deste classificado..."
    );

    const movimentos =
      await movimentoRepository.find({
        where: {
          creditoId:
            CREDITO_ID,
        },
        order: {
          id: "ASC",
        },
      });

    const movimentosDoAnuncio =
      movimentos.filter(
        (movimento) =>
          movimento.classificadoId ===
          novoClassificado.id
      );

    for (
      const movimento of
      movimentosDoAnuncio
    ) {
      console.log(
        `   ${movimento.tipo} | dias=${movimento.dias} | ${movimento.saldoAnterior} -> ${movimento.saldoPosterior}`
      );
    }

    const iniciado =
      movimentosDoAnuncio.find(
        (movimento) =>
          String(
            movimento.tipo
          ) ===
          "ANUNCIO_INICIADO"
      );

    const consumido =
      movimentosDoAnuncio.find(
        (movimento) =>
          String(
            movimento.tipo
          ) ===
          "DIAS_CONSUMIDOS"
      );

    const vendidoMovimento =
      movimentosDoAnuncio.find(
        (movimento) =>
          String(
            movimento.tipo
          ) ===
          "ANUNCIO_VENDIDO"
      );

    const devolvido =
      movimentosDoAnuncio.find(
        (movimento) =>
          String(
            movimento.tipo
          ) ===
          "SALDO_DEVOLVIDO"
      );

    if (!iniciado) {
      throw new Error(
        "MOVIMENTO_ANUNCIO_INICIADO_NAO_ENCONTRADO"
      );
    }

    if (!consumido) {
      throw new Error(
        "MOVIMENTO_DIAS_CONSUMIDOS_NAO_ENCONTRADO"
      );
    }

    if (
      Number(
        consumido.dias
      ) !== DIAS_SIMULADOS
    ) {
      throw new Error(
        `MOVIMENTO_DIAS_CONSUMIDOS_INVALIDO: esperado=${DIAS_SIMULADOS}, atual=${consumido.dias}`
      );
    }

    if (!vendidoMovimento) {
      throw new Error(
        "MOVIMENTO_ANUNCIO_VENDIDO_NAO_ENCONTRADO"
      );
    }

    if (
      saldoFinal > 0 &&
      !devolvido
    ) {
      throw new Error(
        "MOVIMENTO_SALDO_DEVOLVIDO_NAO_ENCONTRADO"
      );
    }

    console.log("");
    console.log(
      "   ✓ ANUNCIO_INICIADO"
    );

    console.log(
      `   ✓ DIAS_CONSUMIDOS = ${DIAS_SIMULADOS}`
    );

    console.log(
      "   ✓ ANUNCIO_VENDIDO"
    );

    if (saldoFinal > 0) {
      console.log(
        `   ✓ SALDO_DEVOLVIDO = ${saldoFinal}`
      );
    }

    /**
     * ============================================================
     * RESULTADO
     * ============================================================
     */

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
      `Classificado: ${novoClassificado.id}`
    );

    console.log(
      `Crédito:      ${CREDITO_ID}`
    );

    console.log("");

    console.log(
      `Saldo inicial:    ${saldoInicial}`
    );

    console.log(
      `Dias utilizados:  ${consumidosNesteAnuncio}`
    );

    console.log(
      `Saldo final:      ${saldoFinal}`
    );

    console.log("");

    console.log(
      `Total comprado:   ${comprados}`
    );

    console.log(
      `Total consumido:  ${consumidosDepois}`
    );

    console.log(
      `Total disponível: ${saldoFinal}`
    );

    console.log("");

    console.log(
      "✓ O mesmo crédito foi reutilizado."
    );

    console.log(
      "✓ O cálculo de períodos de 24h funcionou."
    );

    console.log(
      "✓ O saldo restante foi preservado."
    );

    console.log(
      "✓ O teste agora é dinâmico."
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

    if (novoClassificadoId) {
      console.error(
        `Classificado criado durante o teste: ${novoClassificadoId}`
      );
    }

    if (
      error instanceof Error
    ) {
      console.error(
        `Mensagem: ${error.message}`
      );

      console.error("");
      console.error(
        error.stack
      );
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    if (
      AppDataSource.isInitialized
    ) {
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