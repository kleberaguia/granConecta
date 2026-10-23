import "reflect-metadata";

import { AppDataSource } from "../config/data-source";

import classificadoCreditoService from "../services/ClassificadoCreditoService";

import {
  ClassificadoCreditoPlano,
} from "../models/ClassificadoCreditoModel";

/**
 * ============================================================
 * TESTE MANUAL - CRÉDITO DE CLASSIFICADO
 * ============================================================
 *
 * Objetivo:
 *
 * 1. conectar ao banco;
 * 2. criar um crédito aprovado de teste;
 * 3. consultar o saldo do usuário;
 * 4. exibir todas as informações importantes;
 * 5. fechar corretamente a conexão.
 *
 * ATENÇÃO:
 *
 * Este teste grava um crédito REAL no banco configurado
 * no ambiente em que o script for executado.
 */

async function main(): Promise<void> {
  /**
   * ==========================================================
   * CONFIGURAÇÃO DO TESTE
   * ==========================================================
   *
   * TROQUE pelo UUID de um usuário real de teste.
   */
  const usuarioId =
    "31a74354-06d1-42eb-a3b9-e32744122ec6";

  console.log("");
  console.log("========================================");
  console.log(" TESTE - CLASSIFICADO CRÉDITO");
  console.log("========================================");
  console.log("");

  try {
    /**
     * ========================================================
     * 1. BANCO
     * ========================================================
     */

    console.log("1. Inicializando banco de dados...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("   ✓ Banco conectado");
    console.log("");

    /**
     * ========================================================
     * 2. SALDO ANTES
     * ========================================================
     */

    console.log("2. Consultando saldo ANTES da compra...");

    const saldoAntes =
      await classificadoCreditoService.buscarSaldoUsuario(
        usuarioId
      );

    console.log(
      "   Créditos disponíveis:",
      saldoAntes.totalCreditos
    );

    console.log(
      "   Dias disponíveis:",
      saldoAntes.diasDisponiveis
    );

    console.log("");

    /**
     * ========================================================
     * 3. CRIAR CRÉDITO
     * ========================================================
     */

    console.log(
      "3. Criando crédito DESTAQUE de 30 dias..."
    );

    const credito =
      await classificadoCreditoService.criarCredito({
        usuarioId,

        plano:
          ClassificadoCreditoPlano.DESTAQUE,

        diasComprados: 30,

        /**
         * Valor somente para o teste.
         *
         * Depois utilizaremos o valor oficial do plano.
         */
        valorPago: 29.90,

        /**
         * Permissão existente no service especificamente
         * para testes antes da integração definitiva
         * com o webhook do Mercado Pago.
         */
        pagamentoAprovado: true,

        /**
         * O usuário poderá começar a utilizar este crédito
         * dentro de 90 dias.
         */
        validadeUsoDias: 90,

        /**
         * Identificadores fáceis de reconhecer no banco.
         */
        paymentId:
          `TESTE-CREDITO-${Date.now()}`,

        checkoutSessionId:
          `TESTE-SESSION-${Date.now()}`,
      });

    console.log("   ✓ Crédito criado");
    console.log("");

    console.log("   ID:", credito.id);
    console.log("   Usuário:", credito.usuarioId);
    console.log("   Plano:", credito.plano);

    console.log(
      "   Dias comprados:",
      credito.diasComprados
    );

    console.log(
      "   Dias consumidos:",
      credito.diasConsumidos
    );

    console.log(
      "   Dias restantes:",
      credito.diasRestantes
    );

    console.log("   Status:", credito.status);

    console.log(
      "   Valor pago:",
      credito.valorPago
    );

    console.log(
      "   Adquirido em:",
      credito.adquiridoEm
    );

    console.log(
      "   Validade:",
      credito.validadeEm
    );

    console.log("");

    /**
     * ========================================================
     * 4. SALDO DEPOIS
     * ========================================================
     */

    console.log(
      "4. Consultando saldo DEPOIS da compra..."
    );

    const saldoDepois =
      await classificadoCreditoService.buscarSaldoUsuario(
        usuarioId
      );

    console.log("");

    console.log(
      "   Créditos disponíveis:",
      saldoDepois.totalCreditos
    );

    console.log(
      "   Dias disponíveis:",
      saldoDepois.diasDisponiveis
    );

    console.log("");

    /**
     * ========================================================
     * 5. VALIDAÇÕES
     * ========================================================
     */

    console.log("5. Validando resultado...");

    if (credito.diasComprados !== 30) {
      throw new Error(
        `TESTE_FALHOU_DIAS_COMPRADOS: esperado=30 recebido=${credito.diasComprados}`
      );
    }

    if (credito.diasRestantes !== 30) {
      throw new Error(
        `TESTE_FALHOU_DIAS_RESTANTES: esperado=30 recebido=${credito.diasRestantes}`
      );
    }

    if (
      saldoDepois.diasDisponiveis <
      saldoAntes.diasDisponiveis + 30
    ) {
      throw new Error(
        "TESTE_FALHOU_SALDO_NAO_INCREMENTADO"
      );
    }

    console.log("   ✓ Dias comprados corretos");
    console.log("   ✓ Dias restantes corretos");
    console.log("   ✓ Saldo atualizado corretamente");

    console.log("");
    console.log("========================================");
    console.log(" TESTE CONCLUÍDO COM SUCESSO");
    console.log("========================================");
    console.log("");

    console.log(
      "Crédito criado para o próximo teste:"
    );

    console.log(credito.id);

    console.log("");
  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error(" ERRO NO TESTE");
    console.error("========================================");

    if (error instanceof Error) {
      console.error("Mensagem:", error.message);
      console.error("");
      console.error(error.stack);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    /**
     * ========================================================
     * FECHAR CONEXÃO
     * ========================================================
     */

    if (AppDataSource.isInitialized) {
      console.log("");
      console.log("Fechando conexão com o banco...");

      await AppDataSource.destroy();

      console.log("✓ Conexão encerrada");
    }
  }
}

main();