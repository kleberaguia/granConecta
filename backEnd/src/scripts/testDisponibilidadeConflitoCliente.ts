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
import AgendaDisponibilidadeService from "../services/AgendaDisponibilidadeService";

const MORADOR_ID =
  "00ab56d3-226b-4342-b03f-3d6225bf9dba";

// Outro profissional, para que o conflito seja do CLIENTE
// e não do pedreiro já ocupado.
const OUTRO_PRESTADOR_ID =
  "af30b0f0-0e95-4518-beb5-8785516948f9";

async function main(): Promise<void> {
  console.log("==========================================");
  console.log("TESTE DISPONIBILIDADE - CONFLITO CLIENTE");
  console.log("==========================================");
  console.log("");

  try {
    await AppDataSource.initialize();

    console.log("Banco conectado.");
    console.log("");

    console.log("Cenário:");
    console.log(
      "Cliente possui agenda existente = 08:00-16:00",
    );
    console.log(
      "Consulta com outro profissional = 14:00-15:00",
    );
    console.log("");

    const resultado =
      await AgendaDisponibilidadeService.consultarHorario({
        prestadorId: OUTRO_PRESTADOR_ID,
        moradorId: MORADOR_ID,
        data: "2026-10-22",
        hora: "14:00",
        duracaoMinutos: 60,
        limiteAlternativas: 3,
      });

    console.log("Resultado:");
    console.log({
      disponivel: resultado.disponivel,
      motivo: resultado.motivo,
      solicitado: resultado.solicitado,
      alternativas: resultado.alternativas,
    });

    console.log("");

    if (
      resultado.disponivel === false &&
      resultado.motivo ===
        "CLIENTE_HORARIO_OCUPADO"
    ) {
      console.log("✅ TESTE PASSOU");
      console.log(
        "A disponibilidade detectou o conflito do cliente antes do agendamento.",
      );
      return;
    }

    console.error("❌ TESTE FALHOU");
    console.error(
      "Era esperado CLIENTE_HORARIO_OCUPADO.",
    );

    process.exitCode = 1;
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