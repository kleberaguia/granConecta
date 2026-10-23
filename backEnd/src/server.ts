import * as dotenv from "dotenv";
import path from "node:path";
import http from "node:http";
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

const PORT = Number(process.env.PORT || 3000);
const isLocal = ENV === "local";

function validarConfiguracaoLocal(): void {
  if (!isLocal) return;

  const database = String(process.env.DB_DATABASE || "").trim();
  const host = String(process.env.DB_HOST || "").trim().toLowerCase();
  const provider = String(process.env.PAYMENT_PROVIDER || "").trim().toUpperCase();

  if (database !== "granconecta_teste") {
    throw new Error(
      `[LOCAL] Inicialização bloqueada: DB_DATABASE deve ser granconecta_teste (atual: ${database || "não definido"}).`,
    );
  }

  if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
    throw new Error(
      `[LOCAL] Inicialização bloqueada: DB_HOST deve apontar para a máquina local (atual: ${host || "não definido"}).`,
    );
  }

  if (provider !== "MOCK") {
    throw new Error(
      `[LOCAL] Inicialização bloqueada: PAYMENT_PROVIDER deve ser MOCK (atual: ${provider || "não definido"}).`,
    );
  }

  if (process.env.GRANCONECTA_TEST_MODE !== "true") {
    throw new Error("[LOCAL] Inicialização bloqueada: GRANCONECTA_TEST_MODE deve ser true.");
  }

  console.log(`[LOCAL] Configuração inicial validada: banco ${database} em ${host}; pagamentos MOCK.`);
}

async function bootstrap(): Promise<void> {
  try {
    validarConfiguracaoLocal();

    // Instalar antes de importar app, banco ou integrações externas.
    if (isLocal) {
      const { installLocalExternalApiGuard } = await import("./config/localExternalApiGuard");
      installLocalExternalApiGuard();
    }

    const { AppDataSource } = await import("./config/data-source");

    // Conferência adicional da configuração efetivamente montada pelo TypeORM.
    if (isLocal) {
      const options = AppDataSource.options;
      const actualDatabase = String(options.database || "").trim();
      const actualHost = String((options as { host?: string }).host || "").trim().toLowerCase();

      if (
        actualDatabase !== "granconecta_teste" ||
        !["127.0.0.1", "localhost", "::1"].includes(actualHost)
      ) {
        throw new Error(
          `[LOCAL] TypeORM bloqueado: configuração efetiva inesperada (database=${actualDatabase || "não definido"}, host=${actualHost || "não definido"}).`,
        );
      }
    }

    const { app } = await import("./app");
    const { initSocket } = await import("./socket/socket");

    await AppDataSource.initialize();

    console.log("Banco de dados conectado:", AppDataSource.options.database);

    if (!isLocal) {
      await import("./cron/agendaReminder");
      await import("./cron/pagamentoCron");
      const assinaturaCron = await import("./cron/assinaturaCron");
      const { iniciarMarketingCron } = await import("./cron/marketingCron");
      iniciarMarketingCron();

      if (process.env.EXECUTAR_CRON_ASSINATURA_AO_INICIAR === "true") {
        console.log("Executando cron de assinatura...");
        await assinaturaCron.processarAssinaturas();
      }
    } else {
      console.log(
        "AMBIENTE LOCAL: crons de agenda, pagamentos, assinaturas e marketing desativados.",
      );
    }

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Uploads: http://localhost:${PORT}/uploads`);
    });
  } catch (error) {
    console.error("Erro fatal ao subir servidor:", error);
    process.exit(1);
  }
}

void bootstrap();
