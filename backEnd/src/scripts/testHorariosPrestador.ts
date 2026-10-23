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
import AgendaDisponibilidadeService from "../services/AgendaDisponibilidadeService";

const PRESTADOR_ID =
  "af30b0f0-0e95-4518-beb5-8785516948f9";

async function main() {
  try {
    await AppDataSource.initialize();

    console.log("Banco conectado.");

    const horarios =
      await AgendaDisponibilidadeService.listarHorariosLivres({
        prestadorId: PRESTADOR_ID,

        // IMPORTANTE:
        // não informar moradorId aqui.
        // Queremos enxergar somente a disponibilidade
        // do prestador.
        data: "2026-10-22",
        duracaoMinutos: 60,
        modalidade: null,
      });

    console.log(
      "\nHORÁRIOS LIVRES DO PRESTADOR:"
    );

    console.log(
      JSON.stringify(horarios, null, 2)
    );

    console.log(
      "\nQuantidade:",
      horarios.length
    );
  } catch (error) {
    console.error(
      "ERRO:",
      error instanceof Error
        ? error.message
        : error
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();