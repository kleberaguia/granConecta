import "reflect-metadata";
import * as dotenv from "dotenv";
import path from "node:path";

// ============================================================
// ENV
// ============================================================

const ENV = process.env.NODE_ENV || "development";

const envMap: Record<string, string> = {
  local: ".env.local",
  development: ".env.dev",
  production: ".env.production",
};

const envFile = envMap[ENV] || ".env.dev";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: true,
});

// ============================================================
// IMPORTS
// ============================================================

import { AppDataSource } from "../config/data-source";

import GranConectaAgentContextService from "../services/agent/GranConectaAgentContextService";

// ============================================================
// TEST DATA
// ============================================================

const STORE_ID_ALMARSE =
  "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

// ============================================================
// HELPERS
// ============================================================

function money(value: number | null | undefined): string {
  const numericValue = Number(value || 0);

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function separator(title: string): void {
  console.log("");
  console.log("============================================================");
  console.log(title);
  console.log("============================================================");
}

// ============================================================
// TEST
// ============================================================

async function run(): Promise<void> {
  try {
    separator("GRANCONECTA AGENT CONTEXT TEST");

    console.log("NODE_ENV:", ENV);
    console.log("ENV FILE:", envFile);

    // ========================================================
    // DATABASE
    // ========================================================

    if (!AppDataSource.isInitialized) {
      console.log("");
      console.log("Conectando ao banco...");

      await AppDataSource.initialize();

      console.log("Banco conectado.");
    }

    // ========================================================
    // BUILD CONTEXT
    // ========================================================

    separator("MONTANDO CONTEXTO");

    console.log("Store:", STORE_ID_ALMARSE);

    const context =
      await GranConectaAgentContextService.build({
        storeId: STORE_ID_ALMARSE,
      });

    // ========================================================
    // AGENT
    // ========================================================

    separator("AGENTE");

    console.log("ID:", context.agent.id);
    console.log("Nome:", context.agent.name);
    console.log("Tipo:", context.agent.type);
    console.log("Status:", context.agent.status);
    console.log(
      "Autonomia:",
      context.agent.autonomyLevel
    );
    console.log(
      "Responsabilidade:",
      context.agent.responsibility
    );
    console.log(
      "Objetivo:",
      context.agent.objective
    );
    console.log(
      "Provider:",
      context.agent.provider
    );
    console.log(
      "Model:",
      context.agent.model || "(padrão)"
    );

    // ========================================================
    // PERMISSIONS
    // ========================================================

    separator("PERMISSÕES");

    console.log(
      JSON.stringify(
        context.agent.permissions,
        null,
        2
      )
    );

    // ========================================================
    // STORE
    // ========================================================

    separator("NEGÓCIO");

    console.log("ID:", context.store.id);
    console.log("Nome:", context.store.name);
    console.log("Slug:", context.store.slug);
    console.log("Tipo:", context.store.type);
    console.log("Ativa:", context.store.ativa);
    console.log(
      "Usuário proprietário:",
      context.store.usuarioId
    );

    // ========================================================
    // CATALOG
    // ========================================================

    separator("CATÁLOGO");

    console.log(
      "Quantidade de itens:",
      context.catalog.length
    );

    if (!context.catalog.length) {
      console.log(
        "Nenhum item ativo/vigente encontrado."
      );
    }

    for (const [index, item] of
      context.catalog.entries()) {
      console.log("");
      console.log(
        `--- ITEM ${index + 1} ---`
      );

      console.log("ID:", item.id);
      console.log("Tipo:", item.type);
      console.log("Nome:", item.name);

      console.log(
        "Descrição:",
        item.description || "-"
      );

      console.log(
        "Preço base:",
        money(item.price)
      );

      console.log(
        "Preço promocional:",
        item.promotionalPrice !== null
          ? money(item.promotionalPrice)
          : "-"
      );

      console.log(
        "Preço vigente:",
        money(item.currentPrice)
      );

      console.log(
        "Promoção ativa:",
        item.promotionActive
      );

      console.log(
        "Duração:",
        item.durationMinutes
          ? `${item.durationMinutes} minutos`
          : "-"
      );

      console.log(
        "Total sessões:",
        item.totalSessions
      );

      console.log(
        "Modalidade:",
        item.modality || "-"
      );

      console.log(
        "Política de agenda:",
        item.schedulingPolicy || "-"
      );

      console.log(
        "Máximo sessões/semana:",
        item.maxSessionsPerWeek ?? "-"
      );

      console.log(
        "Compra avulsa:",
        item.allowStandalonePurchase
      );

      console.log(
        "Destaque:",
        item.highlighted
      );
    }

    // ========================================================
    // OPPORTUNITY
    // ========================================================

    separator("OPORTUNIDADE");

    if (!context.opportunity) {
      console.log(
        "Nenhuma oportunidade encontrada."
      );
    } else {
      console.log(
        JSON.stringify(
          context.opportunity,
          null,
          2
        )
      );
    }

    // ========================================================
    // COMMERCIAL FLOW
    // ========================================================

    separator("COMMERCIAL FLOW");

    if (!context.commercialFlow) {
      console.log(
        "Nenhum fluxo comercial ativo encontrado."
      );
    } else {
      console.log(
        JSON.stringify(
          context.commercialFlow,
          null,
          2
        )
      );
    }

    // ========================================================
    // CUSTOMER
    // ========================================================

    separator("CLIENTE");

    console.log(
      "Identificado:",
      context.customer.identified
    );

    console.log(
      "User ID:",
      context.customer.userId || "-"
    );

    // ========================================================
    // CONVERSATION
    // ========================================================

    separator("CONVERSA");

    console.log(
      "Conversation ID:",
      context.conversation.id || "-"
    );

    // ========================================================
    // RAW CONTEXT
    // ========================================================

    separator("CONTEXTO COMPLETO");

    console.log(
      JSON.stringify(
        context,
        null,
        2
      )
    );

    separator("TESTE FINALIZADO COM SUCESSO");

  } catch (error) {
    console.error("");
    console.error(
      "============================================================"
    );

    console.error(
      "ERRO NO TESTE DO AGENTE"
    );

    console.error(
      "============================================================"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      console.log("");
      console.log("Encerrando conexão com banco...");

      await AppDataSource.destroy();

      console.log("Conexão encerrada.");
    }
  }
}

// ============================================================
// EXECUTE
// ============================================================

run();