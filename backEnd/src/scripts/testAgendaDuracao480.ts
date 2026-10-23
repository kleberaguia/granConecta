import * as dotenv from "dotenv";
import path from "node:path";
import "reflect-metadata";

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

import { AppDataSource } from "../config/data-source";
import AgendaService from "../services/AgendaService";

const OFERTA_ID = "test-pedreiro-480-oferta-001";

async function main(): Promise<void> {
  console.log("==========================================");
  console.log("TESTE DE AGENDA COM 480 MINUTOS");
  console.log("==========================================");
  console.log("");

  try {
    await AppDataSource.initialize();

    console.log("Banco conectado.");
    console.log("");

    console.log("Cenário:");
    console.log("Profissional: Pedreiro");
    console.log("Início:       08:00");
    console.log("Duração:      480 minutos");
    console.log("Fim esperado: 16:00");
    console.log("");

    console.log("Criando agenda...");

    const agenda = await AgendaService.agendarSessao(
      OFERTA_ID,
      "TESTE - Jornada de pedreiro de 8 horas",
      "2026-10-22",
      "08:00",
      undefined,
      480,
    );

    console.log("");
    console.log("Agenda criada:");
    console.log({
      id: agenda.id,
      data: agenda.data,
      hora: agenda.hora,
      duracaoMinutos: agenda.duracaoMinutos,
      moradorId: (agenda as any).moradorId,
      prestadorId: (agenda as any).prestadorId,
      ofertaId: agenda.ofertaId,
      status: agenda.status,
    });

    if (Number(agenda.duracaoMinutos) !== 480) {
      throw new Error(
        `DURACAO_INCORRETA_${agenda.duracaoMinutos}`,
      );
    }

    console.log("");
    console.log("✅ TESTE PASSOU");
    console.log(
      "A agenda armazenou corretamente um bloco de 480 minutos (08:00-16:00).",
    );
  } catch (error: any) {
    console.error("");
    console.error("❌ TESTE FALHOU");
    console.error(error?.message || error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();