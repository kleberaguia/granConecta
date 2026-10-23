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
    envMap[ENV] || ".env.dev"
  ),
  override: true,
});

import { AppDataSource } from "../config/data-source";
import { AgendaService } from "../services/AgendaService";

const OFERTA_ID = "test-conflito-prestador-001";

async function main() {
  try {
    console.log("==========================================");
    console.log("TESTE DE CONFLITO DO PRESTADOR");
    console.log("==========================================");

    await AppDataSource.initialize();

    console.log("\nBanco conectado.");

    console.log("\nCenário:");
    console.log(
      "Agenda existente: Cliente A + Prestador Almarse = 15:00-16:00"
    );
    console.log(
      "Nova tentativa:   Cliente B + Prestador Almarse = 15:30-16:30"
    );

    console.log("\nTentando criar agenda sobreposta...");

    try {
      const agenda = await AgendaService.agendarSessao(
        OFERTA_ID,
        "Teste conflito de horário do prestador",
        "2026-10-21",
        "15:30",
        undefined,
        60
      );

      console.log("\n❌ TESTE FALHOU");
      console.log(
        "A agenda foi criada, mas deveria ter sido bloqueada."
      );
      console.log("Agenda ID:", agenda.id);
    } catch (error: any) {
      const mensagem =
        error?.message || String(error);

      console.log("\nErro retornado:");
      console.log(mensagem);

      if (
        mensagem ===
        "HORARIO_INDISPONIVEL_PRESTADOR"
      ) {
        console.log("\n✅ TESTE PASSOU");
        console.log(
          "O mesmo prestador não pode atender dois clientes em horários sobrepostos."
        );
      } else {
        console.log("\n❌ TESTE INCONCLUSIVO");
        console.log(
          "O agendamento foi bloqueado, mas por outro motivo."
        );
      }
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error("\nERRO FATAL:", error);
  process.exit(1);
});