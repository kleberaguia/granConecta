import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import GranConectaAgentMemoryService from "../services/agent/GranConectaAgentMemoryService";

/**
 * Teste SOMENTE LEITURA. Não cria nem modifica conversas, mensagens ou flows.
 * Executar a partir da pasta backend, após compilar:
 * GRANCONECTA_MEMORY_TEST_CONVERSATION_ID=<id> \
 * GRANCONECTA_MEMORY_TEST_STORE_ID=<id> \
 * node dist/scripts/testGranConectaAgentMemory.js
 *
 * Opcional: GRANCONECTA_MEMORY_TEST_CUSTOMER_USER_ID=<id autenticado>
 */
async function main(): Promise<void> {
  const conversationId = String(process.env.GRANCONECTA_MEMORY_TEST_CONVERSATION_ID || "").trim();
  const storeId = String(process.env.GRANCONECTA_MEMORY_TEST_STORE_ID || "").trim();
  const customerUserId = String(process.env.GRANCONECTA_MEMORY_TEST_CUSTOMER_USER_ID || "").trim();

  if (!conversationId || !storeId) {
    throw new Error("Informe GRANCONECTA_MEMORY_TEST_CONVERSATION_ID e GRANCONECTA_MEMORY_TEST_STORE_ID.");
  }

  await AppDataSource.initialize();
  try {
    const memory = await GranConectaAgentMemoryService.build({
      conversationId,
      storeId,
      customerUserId: customerUserId || null,
      currentMessage: "Gostaria de continuar sobre o serviço e o horário que conversamos.",
      historyLimit: 100,
    });

    if (memory.conversationId !== conversationId || memory.storeId !== storeId) {
      throw new Error("FALHA: memória retornou escopo divergente.");
    }
    if (memory.recentConversation.length > 10 || memory.relevantHistory.length > 8) {
      throw new Error("FALHA: limites de histórico não respeitados.");
    }

    console.log("[OK] Leitura da conversa autorizada", {
      conversationId: memory.conversationId,
      storeId: memory.storeId,
      totalMessagesLoaded: memory.totalMessagesLoaded,
      recentMessages: memory.recentConversation.length,
      relevantMessages: memory.relevantHistory.length,
    });
    // Não imprime o conteúdo das mensagens para evitar expor dados de clientes.

    let blockedOtherStore = false;
    try {
      await GranConectaAgentMemoryService.build({
        conversationId,
        storeId: "00000000-0000-4000-8000-000000000001",
      });
    } catch (error) {
      blockedOtherStore = error instanceof Error &&
        error.message === "GRANCONECTA_AGENT_MEMORY_STORE_DIVERGENT";
    }
    if (!blockedOtherStore) {
      throw new Error("FALHA: isolamento entre lojas não foi comprovado.");
    }
    console.log("[OK] Acesso por loja divergente bloqueado");

    // Este teste só demonstra a proteção por usuário quando a conversa possui userId.
    const rows: Array<{ userId: string | null }> = await AppDataSource.query(
      "SELECT userId FROM chat_conversations WHERE id = ? LIMIT 1",
      [conversationId],
    );
    if (rows[0]?.userId) {
      let blockedOtherCustomer = false;
      try {
        await GranConectaAgentMemoryService.build({
          conversationId,
          storeId,
          customerUserId: "00000000-0000-4000-8000-000000000002",
        });
      } catch (error) {
        blockedOtherCustomer = error instanceof Error &&
          error.message === "GRANCONECTA_AGENT_MEMORY_CUSTOMER_DIVERGENT";
      }
      if (!blockedOtherCustomer) {
        throw new Error("FALHA: isolamento entre clientes não foi comprovado.");
      }
      console.log("[OK] Acesso por cliente divergente bloqueado");
    } else {
      console.log("[AVISO] Conversa anônima: validação de posse por sessão não é coberta por este teste.");
    }

    console.log("[OK] Testes de leitura e isolamento concluídos. Não houve escrita no banco.");
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error("[FALHA]", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
