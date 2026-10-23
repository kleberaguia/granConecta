import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import GranConectaAgentService from "../services/agent/GranConectaAgentService";

async function main(): Promise<void> {
  try {
    console.log("========================================");
    console.log(" TESTE - AGENTE COMERCIAL GRANCONECTA");
    console.log("========================================");

    await AppDataSource.initialize();

    console.log("✅ Banco conectado.");

    const storeId =
      "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

    console.log("");
    console.log("🏪 Store piloto:", storeId);

    // ==========================================================
    // 1. CRIAR OU RECUPERAR AGENTE
    // ==========================================================

    const agent =
      await GranConectaAgentService.getOrCreateCommercialAgent({
        storeId,

        name: "Agente Comercial - Espaço Almarse",

        responsibility:
          "Atender clientes do Espaço Almarse, compreender suas necessidades, apresentar serviços disponíveis e conduzir oportunidades comerciais pelos fluxos autorizados do GranConecta.",

        objective:
          "Transformar atendimentos do Espaço Almarse em oportunidades qualificadas, pagamentos e agendamentos, preservando as regras comerciais e de segurança do GranConecta.",

        metadata: {
          pilot: true,
          business: "Espaço Almarse",
          slug: "almarse",
        },
      });

    console.log("");
    console.log("✅ AGENTE CRIADO/LOCALIZADO");
    console.log("----------------------------------------");

    console.log({
      id: agent.id,
      store_id: agent.store_id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      autonomy_level: agent.autonomy_level,
    });

    // ==========================================================
    // 2. TESTAR RUNTIME CONFIG
    // ==========================================================

    const runtime =
      await GranConectaAgentService.getCommercialRuntimeConfig(
        storeId
      );

    console.log("");
    console.log("🧠 RUNTIME CONFIG");
    console.log("----------------------------------------");

    console.dir(runtime, {
      depth: null,
    });

    // ==========================================================
    // 3. TESTAR PERMISSÕES
    // ==========================================================

    console.log("");
    console.log("🔐 PERMISSÕES");
    console.log("----------------------------------------");

    console.log(
      "Ler catálogo:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_read_catalog"
      )
    );

    console.log(
      "Criar oportunidade:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_create_opportunity"
      )
    );

    console.log(
      "Avançar fluxo comercial:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_advance_commercial_flow"
      )
    );

    console.log(
      "Solicitar humano:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_request_human_handoff"
      )
    );

    console.log(
      "Propor campanha:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_propose_campaign"
      )
    );

    console.log(
      "Enviar campanha:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_send_campaign"
      )
    );

    console.log(
      "Alterar preço:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_change_price"
      )
    );

    console.log(
      "Estornar pagamento:",
      GranConectaAgentService.hasPermission(
        agent,
        "can_refund_payment"
      )
    );

    console.log("");
    console.log("========================================");
    console.log(" ✅ TESTE FINALIZADO");
    console.log("========================================");
  } catch (error) {
    console.error("");
    console.error("❌ ERRO NO TESTE DO AGENTE");
    console.error(error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();

      console.log("");
      console.log("🔌 Banco desconectado.");
    }
  }
}

main();