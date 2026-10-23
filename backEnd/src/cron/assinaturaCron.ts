import cron from "node-cron";
import { AppDataSource } from "../config/data-source";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { EmailService } from "../services/EmailService";
import { NotificationService } from "../services/NotificationService";
import { MetaWhatsAppService } from "../services/MetaWhatsAppService";

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

let processamentoEmAndamento = false;

type TipoAviso = "10_DIAS" | "5_DIAS" | "VENCIDA";

function calcularDiasRestantes(dataVencimento: Date, agora: Date): number {
  const diferenca = dataVencimento.getTime() - agora.getTime();

  if (diferenca <= 0) {
    return 0;
  }

  return Math.ceil(diferenca / UM_DIA_EM_MS);
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function obterUrlRenovacao(): string {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "https://granconecta.net.br";

  return `${frontendUrl.replace(/\/+$/, "")}/pagamento-orientacoes?renovacao=1`;
}

function escaparHtml(valor: unknown): string {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function montarEmailHtml(
  titulo: string,
  mensagem: string,
  nome: string,
  dataVencimento: Date,
  diasRestantes: number,
): string {
  const urlRenovacao = obterUrlRenovacao();
  const vencimento = formatarData(dataVencimento);

  const logoUrl =
    process.env.EMAIL_LOGO_URL ||
    "https://api.granconecta.net.br/uploads/images/logo1.png";

  const situacaoHtml =
    diasRestantes > 0
      ? `
        <p style="color:#d97706;font-weight:700;font-size:15px;">
          Faltam ${diasRestantes} dias para o vencimento.
        </p>
      `
      : `
        <p style="color:#dc2626;font-weight:700;font-size:15px;">
          Sua assinatura está vencida.
        </p>
      `;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escaparHtml(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background:#f3f4f6;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08);">
          <tr>
            <td style="background:#120a8f;padding:28px;text-align:center;">
<div
  style="
    display:inline-block;
    background:#ffffff;
    padding:12px 18px;
    border-radius:12px;
  "
>
  <img
    src="${escaparHtml(logoUrl)}"
    width="180"
    alt="GranConecta"
    style="
      display:block;
      width:180px;
      max-width:100%;
      height:auto;
      margin:0 auto;
      border:0;
      outline:none;
      text-decoration:none;
    "
  />
</div>

<div
  style="
    color:#c7d2fe;
    font-size:14px;
    margin-top:12px;
  "
>
  Sua vitrine permanece visível
</div>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 30px;">
              <h1 style="margin:0 0 18px;color:#120a8f;font-size:24px;line-height:1.3;">
                ${escaparHtml(titulo)}
              </h1>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">
                Olá, <strong>${escaparHtml(nome)}</strong>.
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;white-space:pre-line;">
                ${escaparHtml(mensagem)}
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="margin:24px 0;background:#eef2ff;border-radius:12px;">
                <tr>
                  <td style="padding:18px;">
                    <div style="color:#475569;font-size:13px;font-weight:700;text-transform:uppercase;">
                      Plano
                    </div>
                    <div style="color:#120a8f;font-size:18px;font-weight:800;margin-top:4px;">
                      PREMIUM
                    </div>
                  </td>
                  <td style="padding:18px;">
                    <div style="color:#475569;font-size:13px;font-weight:700;text-transform:uppercase;">
                      Vencimento
                    </div>
                    <div style="color:#120a8f;font-size:18px;font-weight:800;margin-top:4px;">
                      ${escaparHtml(vencimento)}
                    </div>
                  </td>
                </tr>
              </table>

              ${situacaoHtml}

              <div style="text-align:center;margin:30px 0 20px;">
                <a href="${escaparHtml(urlRenovacao)}" target="_blank"
                  style="display:inline-block;background:#120a8f;color:#ffffff;padding:15px 28px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:800;">
                  Renovar assinatura
                </a>
              </div>

              <p style="margin:22px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                Se o botão não abrir, copie este endereço:<br />
                <a href="${escaparHtml(urlRenovacao)}"
                  style="color:#120a8f;word-break:break-all;">
                  ${escaparHtml(urlRenovacao)}
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 30px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px;">
              GranConecta — conectando negócios, profissionais e clientes.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function montarMensagem(
  tipo: TipoAviso,
  nome: string,
  dataVencimento: Date,
  diasRestantes: number,
) {
  const vencimentoFormatado = formatarData(dataVencimento);
  const urlRenovacao = obterUrlRenovacao();

  if (tipo === "10_DIAS") {
    return {
      titulo: "Sua assinatura GranConecta está próxima do vencimento",
      mensagem:
        `Olá, ${nome}. Sua assinatura PREMIUM vence em ${diasRestantes} dias, ` +
        `no dia ${vencimentoFormatado}. Renove antecipadamente para manter seu ` +
        `atendimento e contratações disponíveis.\n\nRenovar assinatura: ${urlRenovacao}`,
    };
  }

  if (tipo === "5_DIAS") {
    return {
      titulo: "Faltam poucos dias para renovar sua assinatura",
      mensagem:
        `Olá, ${nome}. Faltam ${diasRestantes} dias para o vencimento da sua ` +
        `assinatura PREMIUM, em ${vencimentoFormatado}. Faça a renovação para ` +
        `evitar o bloqueio de novos atendimentos e contratações.\n\nRenovar assinatura: ${urlRenovacao}`,
    };
  }

  return {
    titulo: "Sua assinatura GranConecta venceu",
    mensagem:
      `Olá, ${nome}. Sua assinatura PREMIUM venceu em ${vencimentoFormatado}. ` +
      "Novos atendimentos e contratações foram temporariamente bloqueados; sua vitrine poderá permanecer visível. " +
      `Renove a assinatura para reativar o acesso.\n\nRenovar assinatura: ${urlRenovacao}`,
  };
}

async function enviarAvisos(
  perfil: PerfilPrestador,
  tipo: TipoAviso,
  diasRestantes: number,
  dataVencimento: Date,
): Promise<boolean> {
  const usuario = (perfil as any).usuario;

  const nome =
    perfil.nome_profissional ||
    usuario?.name ||
    "cliente";

  const email =
    usuario?.email ||
    null;

  const telefone =
    perfil.whatsapp_comercial ||
    usuario?.telefone ||
    null;

  const { titulo, mensagem } = montarMensagem(
    tipo,
    nome,
    dataVencimento,
    diasRestantes,
  );

  const emailHtml = montarEmailHtml(
    titulo,
    mensagem,
    nome,
    dataVencimento,
    diasRestantes,
  );

  const resultados = await Promise.allSettled([
    NotificationService.enviar(
      perfil.usuarioId,
      titulo,
      mensagem,
    ),

    email
      ? EmailService.send(
        email,
        titulo,
        mensagem,
        emailHtml,
      )
      : Promise.resolve(false),

    telefone
      ? MetaWhatsAppService.enviarAvisoAssinatura({
          telefone,
          tipo,
          nome,
          diasRestantes,
          vencimentoFormatado:
            formatarData(dataVencimento),
        }).then((resultado) => resultado.enviado)
      : Promise.resolve(false),
  ]);

  resultados.forEach((resultado, indice) => {
    if (resultado.status === "rejected") {
      const canais = [
        "notificação interna",
        "e-mail",
        "WhatsApp",
      ];

      console.error(
        `[AssinaturaCron] Falha no canal ${canais[indice]}:`,
        resultado.reason,
      );
    }
  });

  return resultados.some(
    (resultado) =>
      resultado.status === "fulfilled" &&
      resultado.value !== false,
  );
}

async function processarPerfil(
  perfil: PerfilPrestador,
  agora: Date,
): Promise<void> {
  if (!perfil.assinatura_vence_em) {
    return;
  }

  const pagamentoStatus = String(
    perfil.payment_status || "",
  ).toUpperCase();

  /*
   * Perfis sem pagamento confirmado não entram no ciclo de renovação.
   */
  if (
    pagamentoStatus !== "PAGO" &&
    pagamentoStatus !== "ATIVO" &&
    pagamentoStatus !== "PAID" &&
    pagamentoStatus !== "AUTHORIZED"
  ) {
    return;
  }

  // Cancelamentos exigem um novo pagamento confirmado; o cron não reativa.
  if (String(perfil.status_assinatura).toUpperCase() === "CANCELADA") {
    return;
  }

  const dataVencimento = new Date(
    perfil.assinatura_vence_em,
  );

  if (Number.isNaN(dataVencimento.getTime())) {
    console.error(
      "[AssinaturaCron] Data de vencimento inválida:",
      {
        perfilId: perfil.id,
        assinaturaVenceEm:
          perfil.assinatura_vence_em,
      },
    );

    return;
  }

  const perfilRepo =
    AppDataSource.getRepository(
      PerfilPrestador,
    );

  const diferencaEmMs =
    dataVencimento.getTime() -
    agora.getTime();

  const diasRestantes =
    calcularDiasRestantes(
      dataVencimento,
      agora,
    );

  /*
   * ASSINATURA VENCIDA
   */
  if (diferencaEmMs <= 0) {
    perfil.status_assinatura =
      "VENCIDA";

    perfil.bloqueado_por_assinatura =
      true;

    perfil.ativo =
      false;

    perfil.disponivel =
      false;

    perfil.status =
      "bloqueado" as any;

    perfil.assinatura_atualizada_em =
      agora;

    // A vitrine pública é independente do direito de contratar.
    // Não alteramos stores.ativa: o DOT valida a assinatura separadamente.
    await perfilRepo.save(perfil);

    if (
      !perfil
        .aviso_vencimento_enviado_em
    ) {
      const avisoEnviado =
        await enviarAvisos(
          perfil,
          "VENCIDA",
          0,
          dataVencimento,
        );

      if (avisoEnviado) {
        perfil.aviso_vencimento_enviado_em =
          agora;

        await perfilRepo.save(perfil);
      }
    }

    console.log(
      "[AssinaturaCron] Assinatura vencida e bloqueada:",
      {
        perfilId: perfil.id,
        usuarioId:
          perfil.usuarioId,
      },
    );

    return;
  }

  /*
   * ASSINATURA A VENCER
   */
  if (diasRestantes <= 10) {
    perfil.status_assinatura =
      "A_VENCER";

    // Não desbloquear por data apenas: reativação depende de pagamento.
    perfil.assinatura_atualizada_em =
      agora;

    await perfilRepo.save(perfil);

    /*
     * O aviso de cinco dias tem prioridade.
     * Se o cron ficou alguns dias desligado, ele envia o aviso mais urgente.
     */
    if (
      diasRestantes <= 5 &&
      !perfil.aviso_5_dias_enviado_em
    ) {
      const avisoEnviado =
        await enviarAvisos(
          perfil,
          "5_DIAS",
          diasRestantes,
          dataVencimento,
        );

      if (avisoEnviado) {
        perfil.aviso_5_dias_enviado_em =
          agora;

        await perfilRepo.save(perfil);
      }

      return;
    }

    if (
      diasRestantes > 5 &&
      !perfil.aviso_10_dias_enviado_em
    ) {
      const avisoEnviado =
        await enviarAvisos(
          perfil,
          "10_DIAS",
          diasRestantes,
          dataVencimento,
        );

      if (avisoEnviado) {
        perfil.aviso_10_dias_enviado_em =
          agora;

        await perfilRepo.save(perfil);
      }
    }

    return;
  }

  /*
   * ASSINATURA NORMAL
   */
  if (
    perfil.status_assinatura !==
    "ATIVA" ||
    perfil.bloqueado_por_assinatura
  ) {
    perfil.status_assinatura =
      "ATIVA";

    // Não remover bloqueio por assinatura sem confirmação de pagamento.
    perfil.assinatura_atualizada_em =
      agora;

    await perfilRepo.save(perfil);
  }
}

export async function processarAssinaturas(): Promise<void> {
  if (processamentoEmAndamento) {
    console.warn(
      "[AssinaturaCron] Execução anterior ainda está em andamento.",
    );

    return;
  }

  processamentoEmAndamento = true;

  const inicio = new Date();

  console.log(
    "[AssinaturaCron] Iniciando verificação:",
    inicio.toISOString(),
  );

  try {
    const perfilRepo =
      AppDataSource.getRepository(
        PerfilPrestador,
      );

    const perfis =
      await perfilRepo
        .createQueryBuilder("perfil")
        .leftJoinAndSelect(
          "perfil.usuario",
          "usuario",
        )
        .where(
          "perfil.assinatura_vence_em IS NOT NULL",
        )
        .getMany();

    let processados = 0;
    let erros = 0;

    for (const perfil of perfis) {
      try {
        await processarPerfil(
          perfil,
          inicio,
        );

        processados += 1;
      } catch (error) {
        erros += 1;

        console.error(
          "[AssinaturaCron] Erro ao processar perfil:",
          {
            perfilId: perfil.id,
            usuarioId:
              perfil.usuarioId,
            error,
          },
        );
      }
    }

    console.log(
      "[AssinaturaCron] Verificação concluída:",
      {
        encontrados: perfis.length,
        processados,
        erros,
      },
    );
  } catch (error) {
    console.error(
      "[AssinaturaCron] Falha geral:",
      error,
    );
  } finally {
    processamentoEmAndamento = false;
  }
}

/*
 * Executa no minuto zero de cada hora.
 */
cron.schedule(
  "0 * * * *",
  processarAssinaturas,
  {
    timezone: "America/Sao_Paulo",
  },
);

console.log(
  "[AssinaturaCron] Agendado para executar de hora em hora (America/Sao_Paulo).",
);