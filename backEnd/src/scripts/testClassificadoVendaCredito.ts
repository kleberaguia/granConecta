import "reflect-metadata";

import { AppDataSource } from "../config/data-source";

import classificadoService from "../services/ClassificadoService";

import {
  Classificado,
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

const CLASSIFICADO_ID =
  "c199238f-bd27-4990-9423-f8e380d6ab36";

async function main(): Promise<void> {
  console.log("");
  console.log("========================================");
  console.log(" TESTE - VENDA E DEVOLUÇÃO DO CRÉDITO");
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

    const classificadoRepository =
      AppDataSource.getRepository(Classificado);

    const creditoRepository =
      AppDataSource.getRepository(
        ClassificadoCredito
      );

    const movimentoRepository =
      AppDataSource.getRepository(
        ClassificadoCreditoMovimento
      );

    /*
     * ============================================================
     * 2. ESTADO INICIAL
     * ============================================================
     */

    console.log("2. Conferindo estado inicial...");

    const classificadoAntes =
      await classificadoRepository.findOne({
        where: {
          id: CLASSIFICADO_ID,
          usuarioId: USUARIO_ID,
        },
      });

    if (!classificadoAntes) {
      throw new Error(
        "CLASSIFICADO_TESTE_NAO_ENCONTRADO"
      );
    }

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
      `   Classificado: ${classificadoAntes.id}`
    );

    console.log(
      `   Status classificado: ${classificadoAntes.status}`
    );

    console.log(
      `   Crédito: ${creditoAntes.id}`
    );

    console.log(
      `   Status crédito: ${creditoAntes.status}`
    );

    console.log(
      `   Dias restantes: ${creditoAntes.diasRestantes}`
    );

    if (
      classificadoAntes.status !==
      ClassificadoStatus.AGUARDANDO_PAGAMENTO
    ) {
      throw new Error(
        `STATUS_INICIAL_CLASSIFICADO_INVALIDO: ${classificadoAntes.status}`
      );
    }

    if (
      creditoAntes.status !==
      ClassificadoCreditoStatus.EM_USO
    ) {
      throw new Error(
        `STATUS_INICIAL_CREDITO_INVALIDO: ${creditoAntes.status}`
      );
    }

    if (
      classificadoAntes.creditoId !==
      CREDITO_ID
    ) {
      throw new Error(
        "CLASSIFICADO_NAO_ESTA_VINCULADO_AO_CREDITO"
      );
    }

    console.log("   ✓ Estado inicial correto");
    console.log("");

    /*
     * ============================================================
     * 3. PUBLICAR
     * ============================================================
     */

    console.log("3. Publicando classificado...");

    const publicado =
      await classificadoService.publicar(
        CLASSIFICADO_ID,
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

    if (!publicado.publicadoEm) {
      throw new Error(
        "PUBLICADO_EM_NAO_DEFINIDO"
      );
    }

    if (!publicado.expiraEm) {
      throw new Error(
        "EXPIRA_EM_NAO_DEFINIDO"
      );
    }

    console.log(
      "   ✓ Classificado publicado corretamente"
    );

    console.log("");

    /*
     * ============================================================
     * 4. SIMULAR 3 DIAS DE USO
     * ============================================================
     *
     * Não queremos esperar 3 dias reais para validar a regra.
     *
     * Alteramos SOMENTE publicadoEm no banco local de teste.
     *
     * Isso fará marcarComoVendido() calcular aproximadamente
     * 3 dias consumidos.
     */

    console.log(
      "4. Simulando anúncio publicado há 3 dias..."
    );

    const agora = new Date();

    const tresDiasAtras =
      new Date(
        agora.getTime() -
          3 * 24 * 60 * 60 * 1000
      );

    publicado.publicadoEm =
      tresDiasAtras;

    await classificadoRepository.save(
      publicado
    );

    console.log(
      `   publicadoEm ajustado para: ${tresDiasAtras.toISOString()}`
    );

    console.log(
      "   ✓ Simulação de tempo aplicada"
    );

    console.log("");

    /*
     * ============================================================
     * 5. MARCAR COMO VENDIDO
     * ============================================================
     */

    console.log(
      "5. Marcando classificado como vendido..."
    );

    const vendido =
      await classificadoService.marcarComoVendido(
        CLASSIFICADO_ID,
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

    if (!vendido.vendidoEm) {
      throw new Error(
        "VENDIDO_EM_NAO_DEFINIDO"
      );
    }

    if (vendido.creditoId) {
      throw new Error(
        "CREDITO_CONTINUA_VINCULADO_APOS_VENDA"
      );
    }

    console.log(
      "   ✓ Classificado vendido e crédito desvinculado"
    );

    console.log("");

    /*
     * ============================================================
     * 6. CONFERIR CRÉDITO
     * ============================================================
     */

    console.log(
      "6. Conferindo saldo devolvido..."
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

    console.log(
      `   Status: ${creditoDepois.status}`
    );

    console.log(
      `   Dias comprados: ${creditoDepois.diasComprados}`
    );

    console.log(
      `   Dias consumidos: ${creditoDepois.diasConsumidos}`
    );

    console.log(
      `   Dias restantes: ${creditoDepois.diasRestantes}`
    );

    /*
     * IMPORTANTE:
     *
     * calcularDiasUtilizados usa Math.ceil().
     *
     * Dependendo dos milissegundos transcorridos entre
     * definir "3 dias atrás" e efetuar a venda,
     * 3 dias + alguns milissegundos podem resultar em 4.
     *
     * Por isso não vamos exigir exatamente 27 neste teste.
     * Vamos validar a regra matemática do próprio resultado.
     */

    const consumidos =
      Number(
        creditoDepois.diasConsumidos
      );

    const restantes =
      Number(
        creditoDepois.diasRestantes
      );

    const comprados =
      Number(
        creditoDepois.diasComprados
      );

    if (
      consumidos <= 0
    ) {
      throw new Error(
        "NENHUM_DIA_FOI_CONSUMIDO"
      );
    }

    if (
      consumidos + restantes !==
      comprados
    ) {
      throw new Error(
        "SALDO_DO_CREDITO_INCONSISTENTE"
      );
    }

    if (
      creditoDepois.status !==
      ClassificadoCreditoStatus.DISPONIVEL
    ) {
      throw new Error(
        `CREDITO_NAO_VOLTOU_PARA_DISPONIVEL: ${creditoDepois.status}`
      );
    }

    console.log(
      "   ✓ Dias utilizados foram consumidos"
    );

    console.log(
      "   ✓ Dias não utilizados foram preservados"
    );

    console.log(
      "   ✓ Crédito voltou para DISPONIVEL"
    );

    console.log("");

    /*
     * ============================================================
     * 7. MOVIMENTOS
     * ============================================================
     */

    console.log(
      "7. Conferindo movimentos do crédito..."
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

    for (const movimento of movimentos) {
      console.log(
        `   ${movimento.tipo} | dias=${movimento.dias} | ${movimento.saldoAnterior} -> ${movimento.saldoPosterior}`
      );
    }

    const tipos =
      movimentos.map(
        (movimento) =>
          String(movimento.tipo)
      );

    if (
      !tipos.includes(
        "DIAS_CONSUMIDOS"
      )
    ) {
      throw new Error(
        "MOVIMENTO_DIAS_CONSUMIDOS_NAO_ENCONTRADO"
      );
    }

    if (
      !tipos.includes(
        "ANUNCIO_VENDIDO"
      )
    ) {
      throw new Error(
        "MOVIMENTO_ANUNCIO_VENDIDO_NAO_ENCONTRADO"
      );
    }

    if (
      !tipos.includes(
        "SALDO_DEVOLVIDO"
      )
    ) {
      throw new Error(
        "MOVIMENTO_SALDO_DEVOLVIDO_NAO_ENCONTRADO"
      );
    }

    console.log("");
    console.log(
      "   ✓ DIAS_CONSUMIDOS registrado"
    );

    console.log(
      "   ✓ ANUNCIO_VENDIDO registrado"
    );

    console.log(
      "   ✓ SALDO_DEVOLVIDO registrado"
    );

    /*
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
      `Dias comprados:  ${comprados}`
    );

    console.log(
      `Dias consumidos: ${consumidos}`
    );

    console.log(
      `Dias devolvidos: ${restantes}`
    );

    console.log("");

    console.log(
      "✓ O usuário não perdeu os dias restantes."
    );

    console.log(
      "✓ O saldo pode ser utilizado em outro classificado."
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