import cron from "node-cron";

import MarketingDisparoService from "../services/MarketingDisparoService";
import MarketingCicloService, {
  ResultadoCicloCanais,
} from "../services/MarketingCicloService";

type OrigemExecucao = "AGENDADO" | "MANUAL" | "INICIAL";

type ResultadoCicloMarketing = {
  ignorado: boolean;
  motivo?: string;
  recuperados?: number;
  processamento?: Awaited<
    ReturnType<
      typeof MarketingDisparoService.processarCampanhasVencidas
    >
  >;
  canais?: ResultadoCicloCanais;
};

let tarefaMarketing:
  | ReturnType<typeof cron.schedule>
  | null = null;

let executando = false;

function envBoolean(
  nome: string,
  padrao = false,
): boolean {
  const valor = process.env[nome];

  if (valor === undefined) {
    return padrao;
  }

  return (
    String(valor)
      .trim()
      .toLowerCase() === "true"
  );
}

function envNumero(
  nome: string,
  padrao: number,
  minimo: number,
  maximo: number,
): number {
  const valor = Number(process.env[nome]);

  if (!Number.isFinite(valor)) {
    return padrao;
  }

  return Math.min(
    maximo,
    Math.max(minimo, Math.trunc(valor)),
  );
}

async function executarCicloMarketing(
  origem: OrigemExecucao,
): Promise<ResultadoCicloMarketing> {
  if (executando) {
    console.warn(
      "[marketingCron] Execução ignorada porque o ciclo anterior ainda está ativo.",
      {
        origem,
      },
    );

    return {
      ignorado: true,
      motivo:
        "Ciclo anterior ainda em execução.",
    };
  }

  executando = true;
  const inicio = Date.now();

  try {
    const minutosTravado = envNumero(
      "MARKETING_CRON_STUCK_MINUTES",
      15,
      5,
      1440,
    );
    const limiteCampanhas = envNumero(
      "MARKETING_CRON_CAMPAIGN_LIMIT",
      10,
      1,
      50,
    );
    const limiteLote = envNumero(
      "MARKETING_CRON_BATCH_SIZE",
      20,
      1,
      100,
    );
    const maxTentativas = envNumero(
      "MARKETING_CRON_MAX_ATTEMPTS",
      3,
      1,
      10,
    );
    const limiteCanais = envNumero(
      "MARKETING_CRON_CHANNEL_LIMIT",
      50,
      1,
      200,
    );
    const limiteBanners = envNumero(
      "MARKETING_CRON_BANNER_LIMIT",
      100,
      1,
      200,
    );
    const limiteReconciliacao = envNumero(
      "MARKETING_CRON_RECONCILE_LIMIT",
      100,
      1,
      200,
    );

    const recuperados =
      await MarketingDisparoService.recuperarProcessamentosTravados(
        minutosTravado,
      );

    const processamento =
      await MarketingDisparoService.processarCampanhasVencidas(
        limiteCampanhas,
        {
          limite: limiteLote,
          maxTentativas,
        },
      );

    const canais = await MarketingCicloService.executar({
      limiteCanais,
      limiteBanners,
      limiteCampanhas: limiteReconciliacao,
    });

    console.log(
      "[marketingCron] Ciclo concluído.",
      {
        origem,
        recuperados,
        campanhas:
          processamento.campanhas.length,
        lote:
          processamento.lote,
        canais,
        duracaoMs:
          Date.now() - inicio,
      },
    );

    return {
      ignorado: false,
      recuperados,
      processamento,
      canais,
    };
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    console.error(
      "[marketingCron] Falha no ciclo.",
      {
        origem,
        erro: mensagem,
        duracaoMs:
          Date.now() - inicio,
      },
    );

    throw error;
  } finally {
    executando = false;
  }
}

export function iniciarMarketingCron() {

  if (process.env.NODE_ENV === "local") {
    console.log(
      "[marketingCron] Ambiente local: inicialização bloqueada."
    );
    return null;
  }
  if (!envBoolean("MARKETING_CRON_ENABLED")) {
    console.log(
      "[marketingCron] Desativado por configuração.",
    );
    return null;
  }

  if (tarefaMarketing) {
    console.warn(
      "[marketingCron] Inicialização ignorada: tarefa já registrada.",
    );
    return tarefaMarketing;
  }

  const expressao =
    String(
      process.env
        .MARKETING_CRON_EXPRESSION ||
      "* * * * *",
    ).trim();

  const timezone =
    String(
      process.env
        .MARKETING_CRON_TIMEZONE ||
      "America/Sao_Paulo",
    ).trim();

  if (!cron.validate(expressao)) {
    throw new Error(
      `MARKETING_CRON_EXPRESSION inválida: ${expressao}`,
    );
  }

  tarefaMarketing = cron.schedule(
    expressao,
    () => {
      void executarCicloMarketing(
        "AGENDADO",
      ).catch(() => undefined);
    },
    {
      timezone,
    },
  );

  console.log(
    "[marketingCron] Registrado.",
    {
      expressao,
      timezone,
    },
  );

  if (
    envBoolean(
      "MARKETING_CRON_RUN_ON_START",
    )
  ) {
    void executarCicloMarketing(
      "INICIAL",
    ).catch(() => undefined);
  }

  return tarefaMarketing;
}

export function pararMarketingCron(): boolean {
  if (!tarefaMarketing) {
    return false;
  }

  tarefaMarketing.stop();
  tarefaMarketing = null;

  console.log(
    "[marketingCron] Tarefa interrompida.",
  );

  return true;
}

// export async function executarMarketingAgora() {
//   return executarCicloMarketing("MANUAL");
// }

export async function executarMarketingAgora() {
  if (process.env.NODE_ENV === "local") {
    throw new Error(
      "BLOQUEIO DE SEGURANÇA: disparos reais de marketing " +
      "não são permitidos no ambiente local."
    );
  }

  return executarCicloMarketing("MANUAL");
}

export function marketingCronEmExecucao() {
  return executando;
}

export default iniciarMarketingCron;