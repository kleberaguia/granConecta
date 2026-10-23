import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import AgendaDisponibilidadeService from "../services/AgendaDisponibilidadeService";

const PRESTADOR_ID =
  "af30b0f0-0e95-4518-beb5-8785516948f9";

async function main(): Promise<void> {
  console.log(
    "==========================================",
  );
  console.log(
    "TESTE DISPONIBILIDADE - SEM CLIENTE",
  );
  console.log(
    "==========================================",
  );

  try {
    await AppDataSource.initialize();

    console.log("\nBanco conectado.");

    console.log("\nCenário:");
    console.log(
      "Consulta de disponibilidade apenas do profissional.",
    );
    console.log(
      "moradorId NÃO será informado.",
    );
    console.log(
      "Data = 2026-10-22",
    );
    console.log(
      "Horário = 14:00-15:00",
    );

    const resultado =
      await AgendaDisponibilidadeService.consultarHorario({
        prestadorId: PRESTADOR_ID,
        data: "2026-10-22",
        hora: "14:00",
        duracaoMinutos: 60,
        limiteAlternativas: 3,
      });

    console.log("\nResultado:");
    console.dir(
      resultado,
      {
        depth: null,
      },
    );

    /**
     * O objetivo deste teste NÃO é exigir que
     * 14:00 esteja disponível.
     *
     * O profissional pode possuir outro compromisso,
     * bloqueio ou configuração de disponibilidade.
     *
     * Queremos provar que a ausência de moradorId
     * continua sendo aceita normalmente.
     */
    if (
      typeof resultado.disponivel !== "boolean"
    ) {
      throw new Error(
        "TESTE_FALHOU_RESULTADO_INVALIDO",
      );
    }

    if (
      !resultado.solicitado ||
      resultado.solicitado.data !==
        "2026-10-22" ||
      resultado.solicitado.hora !==
        "14:00"
    ) {
      throw new Error(
        "TESTE_FALHOU_HORARIO_SOLICITADO",
      );
    }

    /**
     * Sem moradorId, o motivo nunca deve ser
     * CLIENTE_HORARIO_OCUPADO.
     */
    if (
      resultado.motivo ===
      "CLIENTE_HORARIO_OCUPADO"
    ) {
      throw new Error(
        "TESTE_FALHOU_CONFLITO_CLIENTE_SEM_CLIENTE",
      );
    }

    console.log(
      "\n✅ TESTE PASSOU",
    );

    console.log(
      "A disponibilidade continua funcionando sem moradorId.",
    );

    console.log(
      "A consulta permanece compatível com buscas apenas pela agenda do profissional.",
    );
  } catch (error) {
    console.error(
      "\n❌ TESTE FALHOU",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    if (
      AppDataSource.isInitialized
    ) {
      await AppDataSource.destroy();
    }
  }
}

main();