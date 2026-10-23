type TipoAvisoAssinatura =
  | "10_DIAS"
  | "5_DIAS"
  | "VENCIDA";

type ParametroTexto = {
  type: "text";
  text: string;
};

type ComponenteTemplate = {
  type: "header" | "body";
  parameters: ParametroTexto[];
};

type EnviarTemplateInput = {
  telefone: string;
  nomeTemplate: string;
  parametrosCorpo?: Array<string | number>;
  idioma?: string;
  componentesExtras?: ComponenteTemplate[];
};

type EnviarMarketingInput = {
  telefone: string;
  nomeTemplate: string;
  parametrosCorpo?: Array<string | number>;
  idioma?: string;

  /**
   * Deve ser true somente depois de consultar whatsapp_consentimentos.
   * O serviço recusa marketing sem essa confirmação explícita.
   */
  consentimentoConfirmado: boolean;
};

type MetaApiResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id?: string;
    message_status?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
    error_data?: {
      details?: string;
    };
  };
};

export type ResultadoEnvioWhatsApp = {
  enviado: boolean;
  ignorado: boolean;
  telefone: string;
  template: string;
  messageId: string | null;
  motivo: string | null;
};

function whatsappHabilitado(): boolean {
  return (
    String(process.env.WHATSAPP_META_ENABLED || "")
      .trim()
      .toLowerCase() === "true"
  );
}

function normalizarTelefone(
  telefoneInformado: string,
): string {
  const original = String(
    telefoneInformado || "",
  ).trim();

  let digitos = original.replace(
    /\D/g,
    "",
  );

  if (digitos.startsWith("00")) {
    digitos = digitos.slice(2);
  }

  /*
   * Telefones brasileiros sem DDI:
   * DDD + número = 10 ou 11 dígitos.
   */
  if (
    !original.startsWith("+") &&
    (digitos.length === 10 ||
      digitos.length === 11)
  ) {
    digitos = `55${digitos}`;
  }

  if (
    digitos.length < 10 ||
    digitos.length > 15
  ) {
    throw new Error(
      "Telefone inválido para envio pelo WhatsApp.",
    );
  }

  return digitos;
}

function obterConfiguracao() {
  const accessToken =
    process.env.WHATSAPP_META_ACCESS_TOKEN;

  const phoneNumberId =
    process.env
      .WHATSAPP_META_PHONE_NUMBER_ID;

  const graphVersion = String(
    process.env
      .WHATSAPP_META_GRAPH_VERSION ||
      "",
  )
    .trim()
    .replace(/^\/+|\/+$/g, "");

  const idioma =
    process.env
      .WHATSAPP_META_TEMPLATE_LANGUAGE ||
    "pt_BR";

  if (
    !accessToken ||
    !phoneNumberId ||
    !graphVersion
  ) {
    throw new Error(
      "Configuração WhatsApp Meta incompleta. Verifique WHATSAPP_META_ACCESS_TOKEN, WHATSAPP_META_PHONE_NUMBER_ID e WHATSAPP_META_GRAPH_VERSION.",
    );
  }

  return {
    accessToken,
    phoneNumberId,
    graphVersion,
    idioma,
  };
}

function parametrosTexto(
  valores: Array<string | number>,
): ParametroTexto[] {
  return valores.map((valor) => ({
    type: "text",
    text: String(valor),
  }));
}

async function enviarTemplate(
  input: EnviarTemplateInput,
): Promise<ResultadoEnvioWhatsApp> {
  const telefone = normalizarTelefone(
    input.telefone,
  );

  const nomeTemplate = String(
    input.nomeTemplate || "",
  )
    .trim()
    .toLowerCase();

  if (!nomeTemplate) {
    throw new Error(
      "Nome do template WhatsApp não informado.",
    );
  }

  // Bloqueio obrigatório em testes locais, mesmo que a flag de WhatsApp
  // tenha sido ativada por engano. Nenhuma chamada à API da Meta ocorre.
  if (process.env.NODE_ENV === "local") {
    console.log("[LOCAL][WHATSAPP MOCK] Envio externo bloqueado.", {
      telefoneFinal: telefone.slice(-4),
      template: nomeTemplate,
    });

    return {
      enviado: false,
      ignorado: true,
      telefone,
      template: nomeTemplate,
      messageId: null,
      motivo: "ENVIO_BLOQUEADO_AMBIENTE_LOCAL",
    };
  }

  if (!whatsappHabilitado()) {
    console.log(
      "[MetaWhatsAppService] Envio ignorado porque WHATSAPP_META_ENABLED não está ativo.",
      {
        telefoneFinal:
          telefone.slice(-4),
        template:
          nomeTemplate,
      },
    );

    return {
      enviado: false,
      ignorado: true,
      telefone,
      template: nomeTemplate,
      messageId: null,
      motivo:
        "WHATSAPP_META_ENABLED desativado",
    };
  }

  const config = obterConfiguracao();

  const parametrosCorpo =
    input.parametrosCorpo || [];

  const components: ComponenteTemplate[] =
    [
      ...(input.componentesExtras || []),
    ];

  if (parametrosCorpo.length > 0) {
    components.push({
      type: "body",
      parameters:
        parametrosTexto(
          parametrosCorpo,
        ),
    });
  }

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telefone,
    type: "template",
    template: {
      name: nomeTemplate,
      language: {
        code:
          input.idioma ||
          config.idioma,
      },
      ...(components.length > 0
        ? { components }
        : {}),
    },
  };

  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    15_000,
  );

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${config.accessToken}`,
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(body),
        signal:
          controller.signal,
      },
    );

    const data =
      (await response.json()) as MetaApiResponse;

    if (
      !response.ok ||
      data.error
    ) {
      const detalhes =
        data.error?.error_data
          ?.details;

      throw new Error(
        [
          data.error?.message ||
            `Erro HTTP ${response.status}`,
          detalhes,
          data.error?.code
            ? `Código ${data.error.code}`
            : null,
        ]
          .filter(Boolean)
          .join(" - "),
      );
    }

    const messageId =
      data.messages?.[0]?.id ||
      null;

    console.log(
      "[MetaWhatsAppService] Template enviado.",
      {
        telefoneFinal:
          telefone.slice(-4),
        template:
          nomeTemplate,
        messageId,
      },
    );

    return {
      enviado: true,
      ignorado: false,
      telefone,
      template:
        nomeTemplate,
      messageId,
      motivo: null,
    };
  } catch (error) {
    const mensagemErro =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    console.error(
      "[MetaWhatsAppService] Falha ao enviar template.",
      {
        telefoneFinal:
          telefone.slice(-4),
        template:
          nomeTemplate,
        error:
          mensagemErro,
      },
    );

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function nomeTemplateAssinatura(
  tipo: TipoAvisoAssinatura,
): string {
  if (tipo === "10_DIAS") {
    return (
      process.env
        .WHATSAPP_TEMPLATE_ASSINATURA_10_DIAS ||
      "aviso_assinatura_10_dias"
    );
  }

  if (tipo === "5_DIAS") {
    return (
      process.env
        .WHATSAPP_TEMPLATE_ASSINATURA_5_DIAS ||
      "aviso_assinatura_5_dias"
    );
  }

  return (
    process.env
      .WHATSAPP_TEMPLATE_ASSINATURA_VENCIDA ||
    "assinatura_vencida"
  );
}

export const MetaWhatsAppService = {
  enviarTemplate,

  async enviarAvisoAssinatura(input: {
    telefone: string;
    tipo: TipoAvisoAssinatura;
    nome: string;
    diasRestantes: number;
    vencimentoFormatado: string;
  }): Promise<ResultadoEnvioWhatsApp> {
    const parametros =
      input.tipo === "VENCIDA"
        ? [
            input.nome,
            input.vencimentoFormatado,
          ]
        : [
            input.nome,
            input.diasRestantes,
            input.vencimentoFormatado,
          ];

    return enviarTemplate({
      telefone:
        input.telefone,
      nomeTemplate:
        nomeTemplateAssinatura(
          input.tipo,
        ),
      parametrosCorpo:
        parametros,
    });
  },

  /**
   * Use somente depois de consultar whatsapp_consentimentos e confirmar:
   * aceita_marketing = 1 e marketing_cancelado_em IS NULL.
   */
  async enviarMarketing(
    input: EnviarMarketingInput,
  ): Promise<ResultadoEnvioWhatsApp> {
    if (
      !input
        .consentimentoConfirmado
    ) {
      throw new Error(
        "Envio de marketing bloqueado: consentimento não confirmado.",
      );
    }

    return enviarTemplate({
      telefone:
        input.telefone,
      nomeTemplate:
        input.nomeTemplate,
      parametrosCorpo:
        input.parametrosCorpo,
      idioma:
        input.idioma,
    });
  },

  normalizarTelefone,

  habilitado:
    whatsappHabilitado,
};

export default MetaWhatsAppService;