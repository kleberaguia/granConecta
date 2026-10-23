import { AppDataSource } from "../config/data-source";
import { Notificacao } from "../models/NotificationModel";
import { Usuario } from "../models/UserModels";
import { WhatsAppConsentimento } from "../models/WhatsAppConsentimentoModel";
import { EmailService } from "./EmailService";
import MetaWhatsAppService from "./MetaWhatsAppService";
import { getIO } from "../socket/socket";

export type TipoNotificacaoWhatsApp =
  | "UTILIDADE"
  | "MARKETING"
  | "DOACAO";

type ResultadoCanais = {
  notificacao: Notificacao;
  whatsappEnviado: boolean;
  emailEnviado: boolean;
};

const notificacaoRepo =
  AppDataSource.getRepository(Notificacao);

const usuarioRepo =
  AppDataSource.getRepository(Usuario);

const consentimentoRepo =
  AppDataSource.getRepository(
    WhatsAppConsentimento,
  );

function nomeTemplate(
  tipo: TipoNotificacaoWhatsApp,
): string {
  if (tipo === "MARKETING") {
    return (
      process.env
        .WHATSAPP_TEMPLATE_MARKETING_GERAL ||
      "marketing_geral"
    );
  }

  if (tipo === "DOACAO") {
    return (
      process.env
        .WHATSAPP_TEMPLATE_DOACAO ||
      "aviso_doacao"
    );
  }

  return (
    process.env
      .WHATSAPP_TEMPLATE_NOTIFICACAO_GERAL ||
    "notificacao_geral"
  );
}

async function buscarUsuario(
  usuarioId: string,
): Promise<Usuario | null> {
  const id = String(usuarioId || "").trim();

  if (!id) {
    return null;
  }

  return usuarioRepo.findOne({
    where: {
      id,
    },
  });
}

async function salvarNotificacao(
  usuario: Usuario,
  titulo: string,
  mensagem: string,
): Promise<Notificacao> {
  const notificacao =
    notificacaoRepo.create({
      usuario,
      usuarioId: usuario.id,
      titulo,
      mensagem,
      lido: false,
    });

  return notificacaoRepo.save(
    notificacao,
  );
}

function emitirSocketUsuario(
  usuarioId: string,
  titulo: string,
  mensagem: string,
) {
  try {
    const ioAtivo = getIO();

    if (!ioAtivo) {
      return;
    }

    ioAtivo
      .to(usuarioId)
      .emit("status_changed", {
        message: `${titulo}: ${mensagem}`,
        tipo: "NOTIFICACAO",
      });
  } catch (error) {
    console.warn(
      "[NotificationService] Falha ao emitir socket.",
      {
        usuarioId,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
    );
  }
}

async function consentimentoPermite(
  usuarioId: string,
  tipo: TipoNotificacaoWhatsApp,
): Promise<boolean> {
  const consentimento =
    await consentimentoRepo.findOne({
      where: {
        usuarioId,
      },
    });

  if (!consentimento) {
    return false;
  }

  if (tipo === "UTILIDADE") {
    return (
      consentimento.aceita_utilidade ===
      true
    );
  }

  return (
    consentimento.aceita_marketing ===
    true &&
    !consentimento.marketing_cancelado_em
  );
}

async function enviarWhatsAppPorUsuario(
  usuario: Usuario,
  titulo: string,
  mensagem: string,
  tipo: TipoNotificacaoWhatsApp,
): Promise<boolean> {
  if (process.env.NODE_ENV === "local") {
    console.log("[NotificationService][LOCAL] WhatsApp externo bloqueado", { usuarioId: usuario.id, tipo, titulo });
    return false;
  }
  if (!usuario.telefone) {
    console.warn(
      "[NotificationService] Usuário sem telefone.",
      {
        usuarioId: usuario.id,
      },
    );

    return false;
  }

  const permitido =
    await consentimentoPermite(
      usuario.id,
      tipo,
    );

  if (!permitido) {
    console.warn(
      "[NotificationService] WhatsApp bloqueado por consentimento.",
      {
        usuarioId: usuario.id,
        tipo,
      },
    );

    return false;
  }

  try {
    const input = {
      telefone: usuario.telefone,
      nomeTemplate: nomeTemplate(tipo),
      parametrosCorpo: [
        titulo,
        mensagem,
      ],
    };

    const resultado =
      tipo === "UTILIDADE"
        ? await MetaWhatsAppService.enviarTemplate(
          input,
        )
        : await MetaWhatsAppService.enviarMarketing(
          {
            ...input,
            consentimentoConfirmado: true,
          },
        );

    if (
      resultado.ignorado ||
      !resultado.enviado
    ) {
      console.warn(
        "[NotificationService] Envio de WhatsApp não confirmado.",
        {
          usuarioId: usuario.id,
          tipo,
          template: resultado.template,
          motivo: resultado.motivo,
        },
      );

      return false;
    }

    console.log(
      "[NotificationService] WhatsApp enviado.",
      {
        usuarioId: usuario.id,
        tipo,
        template: resultado.template,
        messageId: resultado.messageId,
        telefoneFinal:
          resultado.telefone.slice(-4),
      },
    );

    return true;
  } catch (error) {
    console.error(
      "[NotificationService] Falha no WhatsApp.",
      {
        usuarioId: usuario.id,
        tipo,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
    );

    return false;
  }
}

async function enviarEmailSeguro(
  usuario: Usuario,
  titulo: string,
  mensagem: string,
): Promise<boolean> {
  if (process.env.NODE_ENV === "local") {
    console.log("[NotificationService][LOCAL] E-mail externo bloqueado", { usuarioId: usuario.id, titulo });
    return false;
  }
  if (!usuario.email) {
    return false;
  }

  try {
    await EmailService.send(
      usuario.email,
      titulo,
      mensagem,
    );

    console.log(
      `[Email] Enviado com sucesso para ${usuario.email}`,
    );

    return true;
  } catch (error) {
    console.error(
      "[NotificationService] Falha no e-mail.",
      {
        usuarioId: usuario.id,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
    );

    return false;
  }
}

async function enviarPorCanais(
  usuarioId: string,
  titulo: string,
  mensagem: string,
  tipo: TipoNotificacaoWhatsApp,
  incluirEmail: boolean,
): Promise<ResultadoCanais | null> {
  const usuario =
    await buscarUsuario(usuarioId);

  if (!usuario) {
    console.warn(
      `[NotificationService] Usuário ${usuarioId} não encontrado.`,
    );

    return null;
  }

  const notificacao =
    await salvarNotificacao(
      usuario,
      titulo,
      mensagem,
    );

  emitirSocketUsuario(
    usuario.id,
    titulo,
    mensagem,
  );

  const [
    whatsappEnviado,
    emailEnviado,
  ] = await Promise.all([
    enviarWhatsAppPorUsuario(
      usuario,
      titulo,
      mensagem,
      tipo,
    ),
    incluirEmail
      ? enviarEmailSeguro(
        usuario,
        titulo,
        mensagem,
      )
      : Promise.resolve(false),
  ]);

  return {
    notificacao,
    whatsappEnviado,
    emailEnviado,
  };
}

export const NotificationService = {
  /*
   * Compatibilidade com os usos atuais:
   * salva no sistema, emite socket, envia aviso
   * de utilidade por WhatsApp e envia e-mail.
   */
  async dispararTudo(
    usuarioId: string,
    titulo: string,
    mensagem: string,
  ) {
    const resultado =
      await enviarPorCanais(
        usuarioId,
        titulo,
        mensagem,
        "UTILIDADE",
        true,
      );

    return resultado?.notificacao || null;
  },

  async dispararInteresseRecado(
    usuarioId: string,
    tituloRecado: string,
    mensagemInterna: string,
  ) {
    const usuario =
      await buscarUsuario(usuarioId);

    if (!usuario) {
      console.warn(
        "[NotificationService] Autor do recado não encontrado.",
        {
          usuarioId,
        },
      );

      return null;
    }

    const titulo =
      "Alguém se interessou pelo seu recado";

    // 1. Notificação interna
    const notificacao =
      await salvarNotificacao(
        usuario,
        titulo,
        mensagemInterna,
      );

    // 2. Atualização em tempo real
    emitirSocketUsuario(
      usuario.id,
      titulo,
      mensagemInterna,
    );

    // 3. WhatsApp + e-mail
    const [whatsappEnviado, emailEnviado] =
      await Promise.all([
        (async () => {
          if (process.env.NODE_ENV === "local") {
            console.log("[NotificationService][LOCAL] Template interesse_recado bloqueado", { usuarioId: usuario.id });
            return false;
          }
          if (!usuario.telefone) {
            return false;
          }

          const permitido =
            await consentimentoPermite(
              usuario.id,
              "UTILIDADE",
            );

          if (!permitido) {
            console.warn(
              "[NotificationService] WhatsApp de interesse bloqueado por consentimento.",
              {
                usuarioId: usuario.id,
              },
            );

            return false;
          }

          try {
            const resultado =
              await MetaWhatsAppService.enviarTemplate({
                telefone: usuario.telefone,
                nomeTemplate: "interesse_recado",
                idioma: "pt_BR",
                parametrosCorpo: [
                  tituloRecado,
                ],
              });

            if (
              resultado.ignorado ||
              !resultado.enviado
            ) {
              console.warn(
                "[NotificationService] WhatsApp de interesse não confirmado.",
                {
                  usuarioId: usuario.id,
                  template:
                    resultado.template,
                  motivo:
                    resultado.motivo,
                },
              );

              return false;
            }

            console.log(
              "[NotificationService] WhatsApp de interesse enviado.",
              {
                usuarioId: usuario.id,
                template:
                  resultado.template,
                messageId:
                  resultado.messageId,
              },
            );

            return true;
          } catch (error) {
            console.error(
              "[NotificationService] Falha no WhatsApp de interesse.",
              {
                usuarioId: usuario.id,
                error:
                  error instanceof Error
                    ? error.message
                    : "Erro desconhecido",
              },
            );

            return false;
          }
        })(),

        enviarEmailSeguro(
          usuario,
          titulo,
          mensagemInterna,
        ),
      ]);

    console.log(
      "[NotificationService] Interesse no recado processado.",
      {
        usuarioId: usuario.id,
        whatsappEnviado,
        emailEnviado,
      },
    );

    return notificacao;
  },

  /*
   * Compatibilidade com os usos atuais:
   * salva no sistema, emite socket e envia
   * aviso de utilidade por WhatsApp.
   */
  async enviar(
    usuarioId: string,
    titulo: string,
    mensagem: string,
  ) {
    const resultado =
      await enviarPorCanais(
        usuarioId,
        titulo,
        mensagem,
        "UTILIDADE",
        false,
      );

    return resultado?.notificacao || null;
  },

  /*
   * Notificação interna sem WhatsApp e sem e-mail.
   */
  async enviarSomenteInterna(
    usuarioId: string,
    titulo: string,
    mensagem: string,
  ) {
    const usuario =
      await buscarUsuario(usuarioId);

    if (!usuario) {
      return null;
    }

    const notificacao =
      await salvarNotificacao(
        usuario,
        titulo,
        mensagem,
      );

    emitirSocketUsuario(
      usuario.id,
      titulo,
      mensagem,
    );

    return notificacao;
  },

  /*
   * Avisos de condomínio:
   * portaria, encomenda, manutenção, segurança etc.
   */
  async enviarAvisoCondominio(
    usuarioId: string,
    titulo: string,
    mensagem: string,
  ) {
    return enviarPorCanais(
      usuarioId,
      titulo,
      mensagem,
      "UTILIDADE",
      true,
    );
  },

  /*
   * Propaganda exige consentimento de marketing.
   */
  async enviarPropaganda(
    usuarioId: string,
    titulo: string,
    mensagem: string,
  ) {
    return enviarPorCanais(
      usuarioId,
      titulo,
      mensagem,
      "MARKETING",
      false,
    );
  },

  /*
   * Doações são tratadas como marketing para
   * exigir consentimento explícito.
   */
  async enviarAvisoDoacao(
    usuarioId: string,
    titulo: string,
    mensagem: string,
  ) {
    return enviarPorCanais(
      usuarioId,
      titulo,
      mensagem,
      "DOACAO",
      false,
    );
  },

  async enviarWhatsApp(
    usuarioId: string,
    mensagem: string,
    titulo = "GranConecta",
    tipo: TipoNotificacaoWhatsApp =
      "UTILIDADE",
  ): Promise<boolean> {
    const usuario =
      await buscarUsuario(usuarioId);

    if (!usuario) {
      return false;
    }

    return enviarWhatsAppPorUsuario(
      usuario,
      titulo,
      mensagem,
      tipo,
    );
  },

  enviarWhatsAppPorUsuario,

  async enviarEmail(
    destinatario: string,
    titulo: string,
    mensagem: string,
  ) {
    if (process.env.NODE_ENV === "local") {
      console.log("[NotificationService][LOCAL] E-mail direto bloqueado", { titulo });
      return false;
    }
    if (destinatario.includes("@")) {
      await EmailService.send(
        destinatario,
        titulo,
        mensagem,
      );

      return true;
    }

    const usuario =
      await buscarUsuario(
        destinatario,
      );

    if (!usuario) {
      throw new Error(
        "USUARIO_NAO_ENCONTRADO",
      );
    }

    if (!usuario.email) {
      throw new Error(
        "USUARIO_SEM_EMAIL",
      );
    }

    await EmailService.send(
      usuario.email,
      titulo,
      mensagem,
    );

    return true;
  },

  async enviarEmailDireto(
    email: string,
    titulo: string,
    mensagem: string,
  ) {
    if (process.env.NODE_ENV === "local") {
      console.log("[NotificationService][LOCAL] E-mail direto bloqueado", { titulo });
      return false;
    }
    await EmailService.send(
      email,
      titulo,
      mensagem,
    );

    return true;
  },

  async listar(usuarioId: string) {
    return notificacaoRepo.find({
      where: {
        usuarioId,
      },
      order: {
        dataCriacao: "DESC",
      },
    });
  },
};

export default NotificationService;