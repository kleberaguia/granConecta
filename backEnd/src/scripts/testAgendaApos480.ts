import * as dotenv from "dotenv";
import path from "node:path";
import "reflect-metadata";

const ENV = process.env.NODE_ENV || "development";

const envMap: Record<string, string> = {
  local: ".env.local",
  development: ".env.dev",
  production: ".env.production",
};

dotenv.config({
  path: path.resolve(
    process.cwd(),
    envMap[ENV] || ".env.dev",
  ),
  override: true,
});

import { AppDataSource } from "../config/data-source";
import AgendaService from "../services/AgendaService";

const OFERTA_ID =
  "test-pedreiro-480-oferta-002";

async function main(): Promise<void> {
  console.log("==========================================");
  console.log("TESTE APÓS BLOCO DE 480 MINUTOS");
  console.log("==========================================");
  console.log("");

  try {
    await AppDataSource.initialize();

    console.log("Banco conectado.");
    console.log("");

    console.log("Cenário:");
    console.log(
      "Agenda existente: Pedreiro = 08:00-16:00 (480 min)",
    );
    console.log(
      "Nova agenda:       Pedreiro = 16:00-17:00 (60 min)",
    );
    console.log("");
    console.log(
      "Os intervalos encostam às 16:00, mas não se sobrepõem.",
    );
    console.log("");

    console.log("Tentando criar agenda às 16:00...");

    const agenda = await AgendaService.agendarSessao(
      OFERTA_ID,
      "TESTE - Agenda imediatamente após jornada de 8 horas",
      "2026-10-22",
      "16:00",
      undefined,
      60,
    );

    console.log("");
    console.log("Agenda criada:");
    console.log({
      id: agenda.id,
      data: agenda.data,
      hora: agenda.hora,
      duracaoMinutos: agenda.duracaoMinutos,
      ofertaId: agenda.ofertaId,
      status: agenda.status,
    });

    if (
      agenda.data !== "2026-10-22" ||
      agenda.hora !== "16:00" ||
      Number(agenda.duracaoMinutos) !== 60
    ) {
      throw new Error("AGENDA_CRIADA_COM_DADOS_INCORRETOS");
    }

    console.log("");
    console.log("✅ TESTE PASSOU");
    console.log(
      "O horário 16:00 foi permitido corretamente após o bloco 08:00-16:00.",
    );
    console.log(
      "Intervalos consecutivos não são tratados como sobreposição.",
    );
  } catch (error: any) {
    console.error("");
    console.error("❌ TESTE FALHOU");
    console.error("");
    console.error("Erro retornado:");
    console.error(error?.message || error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();