type InstagramSendMessageResponse = {
  recipient_id?: string;
  message_id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export class MetaInstagramMessagingService {
  private readonly accessToken: string;
  private readonly graphVersion: string;
  private readonly instagramAccountId: string;

  constructor(
    accessToken =
      process.env.META_INSTAGRAM_ACCESS_TOKEN || "",

    graphVersion =
      process.env.META_GRAPH_VERSION || "v20.0",

    instagramAccountId =
      process.env.META_INSTAGRAM_ACCOUNT_ID || "",
  ) {
    this.accessToken =
      accessToken.trim();

    this.graphVersion =
      graphVersion.trim();

    this.instagramAccountId =
      instagramAccountId.trim();
  }

  private validateConfig(): void {
    if (!this.accessToken) {
      throw new Error(
        "META_INSTAGRAM_ACCESS_TOKEN não configurado.",
      );
    }

    if (!this.instagramAccountId) {
      throw new Error(
        "META_INSTAGRAM_ACCOUNT_ID não configurado.",
      );
    }
  }

  /**
   * Envia mensagem de texto para um usuário do Instagram.
   *
   * recipientId = senderId que recebemos no webhook.
   */
  async sendTextMessage(
    recipientId: string,
    message: string,
  ): Promise<InstagramSendMessageResponse> {

    if (process.env.NODE_ENV === "local") {
      throw new Error(
        "[INSTAGRAM] Envio real bloqueado no ambiente local de testes."
      );
    }
    this.validateConfig();

    const normalizedRecipientId =
      String(recipientId || "").trim();

    const normalizedMessage =
      String(message || "").trim();

    if (!normalizedRecipientId) {
      throw new Error(
        "recipientId do Instagram é obrigatório.",
      );
    }

    if (!normalizedMessage) {
      throw new Error(
        "Mensagem do Instagram é obrigatória.",
      );
    }

    const url =
      `https://graph.instagram.com/` +
      `${this.graphVersion}/` +
      `${this.instagramAccountId}/messages`;

    console.log(
      "[INSTAGRAM SEND] Enviando mensagem",
      {
        recipientId: normalizedRecipientId,
        messageLength: normalizedMessage.length,
        instagramAccountId: this.instagramAccountId,
        graphVersion: this.graphVersion,
      },
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        recipient: {
          id: normalizedRecipientId,
        },

        message: {
          text: normalizedMessage,
        },
      }),
    });

    let data: InstagramSendMessageResponse;

    try {
      data =
        (await response.json()) as InstagramSendMessageResponse;
    } catch {
      throw new Error(
        `Resposta inválida da API do Instagram. HTTP ${response.status}`,
      );
    }

    if (!response.ok) {
      console.error(
        "[INSTAGRAM SEND] Falha ao enviar mensagem",
        {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
        },
      );

      throw new Error(
        data?.error?.message ||
        `Falha ao enviar mensagem ao Instagram. HTTP ${response.status}`,
      );
    }

    console.log(
      "[INSTAGRAM SEND] ✅ Mensagem enviada",
      {
        recipientId:
          data.recipient_id ||
          normalizedRecipientId,

        messageId:
          data.message_id || null,
      },
    );

    return data;
  }
}

export default new MetaInstagramMessagingService();