
import nodemailer from "nodemailer";

/**
 * Obtém as configurações SMTP do ambiente.
 */
function obterConfiguracaoEmail() {
  const host = process.env.EMAIL_HOST;

  const port = Number(process.env.EMAIL_PORT);

  const user = process.env.EMAIL_USER;

  const pass = process.env.EMAIL_PASS;

  const from = process.env.EMAIL_FROM || user;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "Configuração de e-mail incompleta. " +
      "Verifique EMAIL_HOST, EMAIL_PORT, EMAIL_USER e EMAIL_PASS."
    );
  }

  return {
    host,
    port,
    user,
    pass,
    from,
  };
}

export const EmailService = {
  /**
   * Envia e-mail pelo SMTP configurado.
   *
   * Chamadas antigas continuam funcionando:
   * EmailService.send(email, assunto, texto)
   *
   * Também aceita HTML:
   * EmailService.send(email, assunto, texto, html)
   *
   * AMBIENTE LOCAL:
   * - Não conecta ao SMTP.
   * - Não envia e-mails reais.
   * - Simula o envio no console.
   *
   * DEV / PRODUÇÃO:
   * - Mantém o comportamento original.
   */
  async send(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {

    // ==========================================
    // PROTEÇÃO DO AMBIENTE LOCAL
    // ==========================================
    if (process.env.NODE_ENV === "local") {
      console.log(
        "[EmailService] SIMULAÇÃO LOCAL - e-mail não enviado.",
        {
          to,
          subject,
          possuiHtml: Boolean(html),
          tamanhoTexto: text?.length ?? 0,
        }
      );

      return;
    }

    // ==========================================
    // CONFIGURAÇÃO ORIGINAL DO SMTP
    // ==========================================
    const config = obterConfiguracaoEmail();

    const transporter = nodemailer.createTransport({
      host: config.host,

      port: config.port,

      /*
       * Porta 465 utiliza conexão segura direta.
       * Porta 587 normalmente utiliza STARTTLS.
       */
      secure: config.port === 465,

      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    // ==========================================
    // ENVIO REAL DO E-MAIL
    // ==========================================
    const resultado = await transporter.sendMail({
      from: `"GranConecta" <${config.from}>`,

      to,

      subject,

      text,

      /*
       * Inclui HTML somente quando informado.
       */
      ...(html ? { html } : {}),
    });

    console.log(
      "[EmailService] E-mail enviado:",
      {
        to,
        subject,
        messageId: resultado.messageId,
      }
    );
  },
};
