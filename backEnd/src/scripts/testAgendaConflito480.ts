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
  console.log("TESTE DE CONFLITO COM BLOCO DE 480 MINUTOS");
  console.log("==========================================");
  console.log("");

  try {
    await AppDataSource.initialize();

    console.log("Banco conectado.");
    console.log("");

    console.log("Cenário:");
    console.log(
      "Agenda existente: mesmo pedreiro = 08:00-16:00 (480 min)",
    );
    console.log(
      "Nova tentativa: outro cliente = 14:00-15:00 (60 min)",
    );
    console.log("");

    console.log("Tentando criar agenda sobreposta...");

    await AgendaService.agendarSessao(
      OFERTA_ID,
      "TESTE - Conflito dentro de jornada de 8 horas",
      "2026-10-22",
      "14:00",
      undefined,
      60,
    );

    console.error("");
    console.error("❌ TESTE FALHOU");
    console.error(
      "A agenda foi criada, mas deveria ter sido bloqueada.",
    );

    process.exitCode = 1;
  } catch (error: any) {
    const mensagem =
      error?.message || String(error);

    console.log("");
    console.log("Erro retornado:");
    console.log(mensagem);
    console.log("");

    if (
      mensagem ===
      "HORARIO_INDISPONIVEL_PRESTADOR"
    ) {
      console.log("✅ TESTE PASSOU");
      console.log(
        "O bloco 08:00-16:00 impediu corretamente uma nova agenda às 14:00.",
      );
    } else {
      console.error("❌ TESTE FALHOU");
      console.error(
        "Era esperado HORARIO_INDISPONIVEL_PRESTADOR.",
      );
      process.exitCode = 1;
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();