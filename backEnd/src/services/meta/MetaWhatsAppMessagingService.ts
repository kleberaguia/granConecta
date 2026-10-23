type WhatsAppSendMessageResponse = {
  messaging_product?: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
};

export class MetaWhatsAppMessagingService {
  private readonly accessToken: string;
  private readonly graphVersion: string;
  private readonly phoneNumberId: string;

  constructor(
    accessToken = process.env.WHATSAPP_META_SYSTEM_USER_ACCESS_TOKEN || process.env.META_WHATSAPP_ACCESS_TOKEN || "",
    graphVersion = process.env.META_GRAPH_VERSION || "v20.0",
    phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  ) {
    this.accessToken = accessToken.trim();
    this.graphVersion = graphVersion.trim();
    this.phoneNumberId = phoneNumberId.trim();
  }

  private validateConfig(): void {
    if (!this.accessToken) {
      throw new Error("WHATSAPP_META_SYSTEM_USER_ACCESS_TOKEN não configurado.");
    }
    if (!this.phoneNumberId) {
      throw new Error("META_WHATSAPP_PHONE_NUMBER_ID não configurado.");
    }
  }

  async sendTextMessage(
    { to, text }: { to: string; text: string }
  ): Promise<WhatsAppSendMessageResponse> {

    // BLOQUEIA ENVIOS REAIS SOMENTE NO AMBIENTE LOCAL
    if (process.env.NODE_ENV === "local") {
      throw new Error(
        "[WHATSAPP] Envio real bloqueado no ambiente local de testes."
      );
    }

    // CÓDIGO ORIGINAL - MANTIDO
    this.validateConfig();

    const normalizedPhone = String(to || "").replace(/\D/g, "").trim();
    const normalizedText = String(text || "").trim();

    if (!normalizedPhone) {
      throw new Error("Telefone do destinatário é obrigatório.");
    }

    if (!normalizedText) {
      throw new Error("Texto da mensagem é obrigatório.");
    }


    const url = `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedPhone,
        type: "text",
        text: { body: normalizedText },
      }),
    });

    let data: WhatsAppSendMessageResponse;

    try {
      data = (await response.json()) as WhatsAppSendMessageResponse;
    } catch {
      throw new Error(`Resposta inválida da API do WhatsApp. HTTP ${response.status}`);
    }

    if (!response.ok) {
      console.error("[WHATSAPP SEND] Falha ao enviar mensagem", {
        status: response.status,
        error: data?.error,
      });

      throw new Error(
        data?.error?.message || `Falha ao enviar mensagem ao WhatsApp. HTTP ${response.status}`,
      );
    }

    return data;
  }
}

export default new MetaWhatsAppMessagingService();