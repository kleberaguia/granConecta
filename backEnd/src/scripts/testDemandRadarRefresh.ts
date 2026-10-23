
import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import GranConectaDemandRadarService from "../services/chat/GranConectaDemandRadarService";

async function main(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const radar = new GranConectaDemandRadarService();

    const result = await radar.updateRegion({
      conversationId: "2918abef-43ba-4180-be5a-f6e3c974c996",
      bairro: "Jaraguá",
      cidade: "São Paulo",
      uf: "SP",
    });

    console.log("Região atualizada:", result);

    const alerts = await AppDataSource.query(
      `SELECT id, categoria_id, chave_regiao,
              clientes_distintos, pesquisas_total, status
       FROM demand_admin_alerts
       WHERE categoria_id = 32
         AND chave_regiao = 'jaragua sao paulo sp'`
    );

    console.table(alerts);
  } catch (error) {
    console.error("Erro no teste:", error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();
