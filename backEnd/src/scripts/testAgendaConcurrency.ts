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
import { Agenda } from "../models/AgendaModels";

const OFERTA_ID = "test-concorrencia-agenda-002";
const DATA = "2026-10-21";
const HORA = "15:00";
const DURACAO_MINUTOS = 60;

async function main(): Promise<void> {
  try {
    console.log("\n==========================================");
    console.log("TESTE DE CONCORRÊNCIA DA AGENDA");
    console.log("==========================================\n");

    await AppDataSource.initialize();

    console.log("Banco conectado.\n");

    const agendaRepo =
      AppDataSource.getRepository(Agenda);

    const antes = await agendaRepo
      .createQueryBuilder("agenda")
      .where("agenda.ofertaId = :ofertaId", {
        ofertaId: OFERTA_ID,
      })
      .getCount();

    console.log("Agendas antes do teste:", antes);

    console.log(
      "\nDisparando DUAS chamadas simultâneas...\n"
    );

    const resultados = await Promise.allSettled([
      AgendaService.agendarSessao(
        OFERTA_ID,
        "Teste concorrência - chamada A",
        DATA,
        HORA,
        undefined,
        DURACAO_MINUTOS
      ),

      AgendaService.agendarSessao(
        OFERTA_ID,
        "Teste concorrência - chamada B",
        DATA,
        HORA,
        undefined,
        DURACAO_MINUTOS
      ),
    ]);

    console.log("\n==========================================");
    console.log("RESULTADOS DAS DUAS CHAMADAS");
    console.log("==========================================\n");

    resultados.forEach((resultado, index) => {
      const chamada =
        index === 0 ? "A" : "B";

      if (resultado.status === "fulfilled") {
        console.log(
          `Chamada ${chamada}: SUCESSO`
        );

        console.log(
          `Agenda ID: ${resultado.value.id}`
        );

        console.log(
          `Data/Hora: ${resultado.value.data} ${resultado.value.hora}`
        );
      } else {
        console.log(
          `Chamada ${chamada}: ERRO`
        );

        console.log(
          resultado.reason instanceof Error
            ? resultado.reason.message
            : resultado.reason
        );
      }

      console.log("");
    });

    const agendasDepois = await agendaRepo
      .createQueryBuilder("agenda")
      .where("agenda.ofertaId = :ofertaId", {
        ofertaId: OFERTA_ID,
      })
      .orderBy("agenda.createdAt", "ASC")
      .getMany();

    console.log("==========================================");
    console.log("ESTADO FINAL DO BANCO");
    console.log("==========================================\n");

    console.log(
      "Quantidade de agendas:",
      agendasDepois.length
    );

    for (const agenda of agendasDepois) {
      console.log({
        id: agenda.id,
        data: agenda.data,
        hora: agenda.hora,
        duracaoMinutos:
          agenda.duracaoMinutos,
        status: agenda.status,
        ofertaId: agenda.ofertaId,
      });
    }

    const idsSucesso = resultados
      .filter(
        (
          resultado
        ): resultado is PromiseFulfilledResult<Agenda> =>
          resultado.status === "fulfilled"
      )
      .map(resultado => resultado.value.id);

    console.log("\n==========================================");
    console.log("VALIDAÇÃO");
    console.log("==========================================\n");

    if (
      resultados.every(
        resultado =>
          resultado.status === "fulfilled"
      ) &&
      idsSucesso.length === 2 &&
      idsSucesso[0] === idsSucesso[1] &&
      agendasDepois.length === 1
    ) {
      console.log(
        "✅ TESTE PASSOU"
      );

      console.log(
        "As duas chamadas retornaram a MESMA agenda."
      );

      console.log(
        "Nenhuma agenda duplicada foi criada."
      );
    } else {
      console.log(
        "❌ TESTE NÃO PASSOU"
      );

      console.log(
        "Precisamos analisar os resultados acima."
      );
    }
  } catch (error) {
    console.error(
      "\n❌ ERRO GERAL DO TESTE:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();