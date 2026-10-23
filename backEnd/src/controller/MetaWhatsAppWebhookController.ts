import {
  createHmac,
  timingSafeEqual,
} from "crypto";
import type {
  Request,
  Response,
} from "express";

import { AppDataSource } from "../config/data-source";
import {
  MarketingAgendamento,
  MarketingStatus,
} from "../models/MarketingAgendamentoModels";
import MarketingCampanhaService from "../services/MarketingCampanhaService";
import MarketingLeadService from "../services/MarketingLeadService";
import { GranConectaChatService } from "../services/chat/GranConectaChatService";
import { ChatPersistenceService } from "../services/chat/ChatPersistenceService";
import {
  WhatsAppConnection,
  WhatsAppConnectionOwnerType,
  WhatsAppConnectionStatus,
} from "../models/WhatsAppConnectionModel";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { Usuario } from "../models/UserModels";
import { MarketingPlaybook } from "../models/MarketingPlaybookModel";

import MetaWhatsAppMessagingService from "../services/meta/MetaWhatsAppMessagingService";

type RequestComRawBody = Request & {
  rawBody?: Buffer;
};

type MetaWebhookError = {
  code?: number;
  title?: string;
  message?: string;
  error_data?: {
    details?: string;
  };
};

type MetaWebhookStatus = {
  id?: string;
  status?:
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "deleted";
  timestamp?: string;
  recipient_id?: string;
  errors?: MetaWebhookError[];
};

type MetaWebhookMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  context?: {
    id?: string;
    from?: string;
  };
  type?: string;
  text?: {
    body?: string;
  };
  button?: {
    text?: string;
    payload?: string;
  };
  interactive?: {
    type?: string;
    button_reply?: {
      id?: string;
      title?: string;
    };
    list_reply?: {
      id?: string;
      title?: string;
    };
  };
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        statuses?: MetaWebhookStatus[];
        messages?: MetaWebhookMessage[];
      };
    }>;
  }>;
};

const STATUS_ORDEM: Record<
  MarketingStatus,
  number
> = {
  [MarketingStatus.PENDENTE]: 0,
  [MarketingStatus.PROCESSANDO]: 1,
  [MarketingStatus.ENVIADO]: 2,
  [MarketingStatus.ENTREGUE]: 3,
  [MarketingStatus.LIDO]: 4,
  [MarketingStatus.CANCELADO]: 5,
  [MarketingStatus.FALHA]: 5,
};

const COMANDOS_CANCELAMENTO = new Set([
  "SAIR",
  "PARAR",
  "CANCELAR",
  "REMOVER",
  "STOP",
  "NAO QUERO RECEBER",
  "NAO QUERO MAIS",
  "CANCELAR MARKETING",
]);

const chatPersistence = new ChatPersistenceService();
const granConectaChatService = new GranConectaChatService(chatPersistence);

/**
 * Proteção em memória contra reentrega concorrente do MESMO message.id.
 *
 * A checagem no banco continua sendo a proteção persistente principal.
 * Este Set fecha a pequena janela entre:
 *   1) receber dois webhooks quase simultâneos;
 *   2) ambos consultarem o banco antes de a primeira mensagem ser salva.
 *
 * Funciona por processo Node/PM2.
 */
const mensagensEmProcessamento = new Set<string>();

/**
 * Proteção contra toque duplo em botão/resposta interativa.
 *
 * Dois toques reais no mesmo botão podem gerar IDs diferentes na Meta.
 * Nesse caso a idempotência por external_message_id, corretamente, não os
 * considera duplicados. Para evitar duas respostas do bot em sequência,
 * aplicamos uma janela curta SOMENTE para mensagens de botão/interativas.
 */
const JANELA_DUPLO_TOQUE_MS = 4_000;
const interacoesRecentes = new Map<string, number>();

function chaveInteracaoRapida(
  telefone: string,
  message: MetaWebhookMessage,
  texto: string,
): string | null {
  const ehInteracao =
    Boolean(message.button) ||
    Boolean(message.interactive?.button_reply) ||
    Boolean(message.interactive?.list_reply);

  if (!ehInteracao) {
    return null;
  }

  const textoNormalizado = normalizarComando(texto);

  if (!textoNormalizado) {
    return null;
  }

  return `${telefone}|${textoNormalizado}`;
}

function interacaoDuplicadaRecente(chave: string): boolean {
  const agora = Date.now();

  // Limpeza oportunista para impedir crescimento indefinido do Map.
  for (const [item, timestamp] of interacoesRecentes) {
    if (agora - timestamp > JANELA_DUPLO_TOQUE_MS * 3) {
      interacoesRecentes.delete(item);
    }
  }

  const anterior = interacoesRecentes.get(chave);

  if (
    anterior !== undefined &&
    agora - anterior < JANELA_DUPLO_TOQUE_MS
  ) {
    return true;
  }

  interacoesRecentes.set(chave, agora);
  return false;
}

function envBoolean(
  nome: string,
  padrao = false,
): boolean {
  const valor = process.env[nome];
  if (valor === undefined) {
    return padrao;
  }
  return String(valor).trim().toLowerCase() === "true";
}

function validarAssinatura(
  request: RequestComRawBody,
): boolean {
  const appSecret = String(
    process.env.WHATSAPP_META_APP_SECRET || "",
  ).trim();

  const obrigatoria = envBoolean(
    "WHATSAPP_META_SIGNATURE_REQUIRED",
    process.env.NODE_ENV === "production",
  );

  console.log("[MetaWhatsAppWebhook] CONFIG ASSINATURA", {
    obrigatoria,
    nodeEnv: process.env.NODE_ENV,
    signatureRequiredEnv: process.env.WHATSAPP_META_SIGNATURE_REQUIRED,
    temAppSecret: Boolean(appSecret),
    temRawBody: Boolean(request.rawBody),
    temAssinatura: Boolean(request.header("x-hub-signature-256")),
  });

  if (!obrigatoria) {
    return true;
  }

  if (!appSecret || !request.rawBody) {
    console.error(
      "[MetaWhatsAppWebhook] Assinatura obrigatória, mas appSecret ou rawBody estão ausentes.",
    );
    return false;
  }

  const assinaturaRecebida = request.header("x-hub-signature-256");
  const prefixo = "sha256=";

  if (!assinaturaRecebida || !assinaturaRecebida.startsWith(prefixo)) {
    return false;
  }

  try {
    const assinaturaEsperada = createHmac("sha256", appSecret)
      .update(request.rawBody)
      .digest("hex");

    const recebida = Buffer.from(
      assinaturaRecebida.slice(prefixo.length),
      "hex",
    );

    const esperada = Buffer.from(assinaturaEsperada, "hex");

    if (recebida.length !== esperada.length) {
      return false;
    }

    return timingSafeEqual(recebida, esperada);
  } catch (error) {
    console.error("[MetaWhatsAppWebhook] Erro ao validar assinatura HMAC:", error);
    return false;
  }
}

function dataMeta(timestamp?: string): Date {
  const segundos = Number(timestamp);
  if (Number.isFinite(segundos) && segundos > 0) {
    return new Date(segundos * 1000);
  }
  return new Date();
}

function detalhesErro(errors?: MetaWebhookError[]): string {
  if (!errors?.length) {
    return "A Meta informou falha no envio.";
  }

  return errors
    .map((error) =>
      [
        error.code ? `Código ${error.code}` : null,
        error.title,
        error.message,
        error.error_data?.details,
      ]
        .filter(Boolean)
        .join(" - "),
    )
    .filter(Boolean)
    .join(" | ")
    .slice(0, 4000);
}

const META_ERRO_LIMITE_MARKETING_USUARIO = 131049;
const META_REAGENDAR_131049_HORAS = 24;
const META_MAX_TENTATIVAS_131049 = 3;

function possuiErroMeta(
  errors: MetaWebhookError[] | undefined,
  codigo: number,
): boolean {
  return Boolean(
    errors?.some(
      (error) => Number(error.code) === codigo,
    ),
  );
}

function dataReagendamentoMeta131049(
  dataEvento: Date,
): Date {
  const base = Math.max(
    Date.now(),
    dataEvento.getTime(),
  );

  return new Date(
    base +
    META_REAGENDAR_131049_HORAS *
    60 *
    60 *
    1000,
  );
}

function textoMensagem(message: MetaWebhookMessage): string {
  return String(
    message.text?.body ||
    message.button?.text ||
    message.interactive?.button_reply?.title ||
    message.interactive?.button_reply?.id ||
    message.interactive?.list_reply?.title ||
    message.interactive?.list_reply?.id ||
    "",
  ).trim();
}

function normalizarComando(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[.!?,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function atualizarStatus(
  statusMeta: MetaWebhookStatus,
): Promise<number | null> {
  const messageId = String(statusMeta.id || "").trim();

  if (!messageId || !statusMeta.status) {
    return null;
  }

  const repo = AppDataSource.getRepository(MarketingAgendamento);
  const agendamento = await repo.findOne({
    where: { meta_message_id: messageId },
  });

  if (!agendamento) {
    console.warn("[MetaWhatsAppWebhook] Message ID não localizado.", {
      messageId,
      status: statusMeta.status,
    });
    return null;
  }

  const dataEvento = dataMeta(statusMeta.timestamp);

  if (statusMeta.status === "failed") {
    if (
      agendamento.status !== MarketingStatus.ENTREGUE &&
      agendamento.status !== MarketingStatus.LIDO
    ) {
      const erroDetalhado =
        detalhesErro(statusMeta.errors);

      const limiteMarketing131049 =
        possuiErroMeta(
          statusMeta.errors,
          META_ERRO_LIMITE_MARKETING_USUARIO,
        );

      if (limiteMarketing131049) {
        const jaReagendadoParaMesmoErro =
          agendamento.status ===
          MarketingStatus.PENDENTE &&
          String(
            agendamento.ultimo_erro || "",
          ).includes(
            `Código ${META_ERRO_LIMITE_MARKETING_USUARIO}`,
          );

        if (jaReagendadoParaMesmoErro) {
          console.log(
            "[MetaWhatsAppWebhook] Status 131049 duplicado ignorado; agendamento já está reagendado.",
            {
              agendamentoId:
                agendamento.id,
              campanhaId:
                agendamento.campanha_id ||
                null,
              messageId,
              tentativas:
                agendamento.tentativas,
              dataExecucao:
                agendamento.data_execucao,
            },
          );
        } else if (
          Number(
            agendamento.tentativas || 0,
          ) >=
          META_MAX_TENTATIVAS_131049
        ) {
          agendamento.status =
            MarketingStatus.FALHA;
          agendamento.falhou_em =
            dataEvento;
          agendamento.ultimo_erro =
            `Código ${META_ERRO_LIMITE_MARKETING_USUARIO} - limite temporário de marketing da Meta persistiu após ${META_MAX_TENTATIVAS_131049} tentativa(s). ${erroDetalhado}`;

          console.warn(
            "[MetaWhatsAppWebhook] Limite 131049 atingiu o máximo de tentativas; agendamento marcado como FALHA.",
            {
              agendamentoId:
                agendamento.id,
              campanhaId:
                agendamento.campanha_id ||
                null,
              messageId,
              tentativas:
                agendamento.tentativas,
            },
          );
        } else {
          const novaExecucao =
            dataReagendamentoMeta131049(
              dataEvento,
            );

          agendamento.status =
            MarketingStatus.PENDENTE;
          agendamento.data_execucao =
            novaExecucao;
          agendamento.falhou_em = null;

          /*
           * O messageId pertence à tentativa que acabou de falhar.
           * Como o registro voltou para PENDENTE, limpamos os dados
           * de envio da tentativa anterior. A próxima tentativa receberá
           * um novo wamid da Meta.
           */
          agendamento.meta_message_id =
            null;
          agendamento.enviado_em =
            null;

          agendamento.ultimo_erro =
            `Código ${META_ERRO_LIMITE_MARKETING_USUARIO} - limitação temporária de marketing da Meta. Reagendado automaticamente para ${novaExecucao.toISOString()}. ${erroDetalhado}`;

          console.warn(
            "[MetaWhatsAppWebhook] Limite temporário 131049; envio reagendado.",
            {
              agendamentoId:
                agendamento.id,
              campanhaId:
                agendamento.campanha_id ||
                null,
              messageId,
              tentativas:
                agendamento.tentativas,
              novaExecucao:
                novaExecucao.toISOString(),
            },
          );
        }
      } else {
        agendamento.status =
          MarketingStatus.FALHA;
        agendamento.falhou_em =
          dataEvento;
        agendamento.ultimo_erro =
          erroDetalhado;
      }
    }
  } else {
    const novoStatus =
      statusMeta.status === "read"
        ? MarketingStatus.LIDO
        : statusMeta.status === "delivered"
          ? MarketingStatus.ENTREGUE
          : MarketingStatus.ENVIADO;

    if (STATUS_ORDEM[novoStatus] >= STATUS_ORDEM[agendamento.status]) {
      agendamento.status = novoStatus;
      agendamento.ultimo_erro = null;

      if (novoStatus === MarketingStatus.ENVIADO) {
        agendamento.enviado_em = agendamento.enviado_em || dataEvento;
      }
      if (novoStatus === MarketingStatus.ENTREGUE) {
        agendamento.entregue_em = dataEvento;
      }
      if (novoStatus === MarketingStatus.LIDO) {
        agendamento.entregue_em = agendamento.entregue_em || dataEvento;
        agendamento.lido_em = dataEvento;
      }
    }
  }

  await repo.save(agendamento);
  return agendamento.campanha_id || null;
}

const JANELA_CONTEXTO_CAMPANHA_HORAS = 72;

type ContextoCampanhaRecente = {
  agendamentoId: number;
  campanhaId: number;
  campanhaNome: string;
  campanhaDescricao: string | null;
  lojaId: string | null;
  prestadorId: string | null;

  tipoDestino:
  | "GRANCONECTA"
  | "CATEGORIA"
  | "LOJA"
  | "PRESTADOR";

  categoriaId: number | null;
  categoriaNome: string | null;

  playbook:
  | {
    id?: number;
    nome?: string;
    mensagemAbertura?: string;
    perguntas?: any[];
    respostasFrequentes?: any[];
    instrucoesIa?: string;
    ctaTexto?: string;
  }
  | null;

  chatbotTipo: "GRANCONECTA" | "LOJA" | "PRESTADOR";
  chatbotOwnerId: string | null;
  storeName: string;
};

async function resolverNomePrestador(
  prestadorId: string,
): Promise<string> {
  const id = String(prestadorId || "").trim();

  if (!id) {
    return "";
  }

  try {
    /*
     * marketing_campanhas.prestador_id guarda usuarios.id.
     * Primeiro usamos nome_profissional e depois usuarios.name.
     */
    const perfil = await AppDataSource
      .getRepository(PerfilPrestador)
      .findOne({
        where: {
          usuarioId: id,
        },
      });

    const nomeProfissional = String(
      perfil?.nome_profissional || "",
    ).trim();

    if (nomeProfissional) {
      return nomeProfissional;
    }

    const usuario = await AppDataSource
      .getRepository(Usuario)
      .findOne({
        where: {
          id,
        },
      });

    return String(
      usuario?.name || "",
    ).trim();
  } catch (error) {
    console.warn(
      "[MetaWhatsAppWebhook] Não foi possível resolver o nome do prestador.",
      {
        prestadorId: id,
        erro:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    return "";
  }
}

async function carregarPlaybookCategoria(
  categoriaId: number | null,
): Promise<ContextoCampanhaRecente["playbook"]> {
  if (!categoriaId) {
    return null;
  }

  try {
    const playbook =
      await AppDataSource
        .getRepository(MarketingPlaybook)
        .findOne({
          where: {
            categoria_id: categoriaId,
            ativo: true,
          },
        });

    if (!playbook) {
      return null;
    }

    return {
      id: Number(playbook.id),
      nome: playbook.nome,
      mensagemAbertura:
        playbook.mensagem_abertura,
      perguntas:
        Array.isArray(playbook.perguntas)
          ? playbook.perguntas
          : [],
      respostasFrequentes:
        Array.isArray(
          playbook.respostas_frequentes,
        )
          ? playbook.respostas_frequentes
          : [],
      instrucoesIa:
        playbook.instrucoes_ia ||
        undefined,
      ctaTexto:
        playbook.cta_texto ||
        undefined,
    };
  } catch (error) {
    console.warn(
      "[MetaWhatsAppWebhook] Não foi possível carregar o playbook da categoria.",
      {
        categoriaId,
        erro:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    return null;
  }
}

async function montarContextoCampanha(
  agendamento: MarketingAgendamento,
): Promise<ContextoCampanhaRecente | null> {
  const campanha = (agendamento as any)?.campanha;

  if (!agendamento?.campanha_id || !campanha) {
    return null;
  }

  const lojaId =
    String(campanha.loja_id || "").trim() || null;

  const prestadorId =
    String(campanha.prestador_id || "").trim() || null;

  const tipoDestinoRaw =
    String(
      campanha.tipo_destino ||
      (
        prestadorId
          ? "PRESTADOR"
          : lojaId
            ? "LOJA"
            : "GRANCONECTA"
      ),
    )
      .trim()
      .toUpperCase();

  const tipoDestino:
    ContextoCampanhaRecente["tipoDestino"] =
    tipoDestinoRaw === "CATEGORIA"
      ? "CATEGORIA"
      : tipoDestinoRaw === "LOJA"
        ? "LOJA"
        : tipoDestinoRaw === "PRESTADOR"
          ? "PRESTADOR"
          : "GRANCONECTA";

  const categoriaIdNumero =
    campanha.categoria_id !== undefined &&
      campanha.categoria_id !== null
      ? Number(campanha.categoria_id)
      : null;

  const categoriaId =
    categoriaIdNumero &&
      Number.isInteger(categoriaIdNumero) &&
      categoriaIdNumero > 0
      ? categoriaIdNumero
      : null;

  const categoriaNome =
    String(
      campanha?.categoria?.name || "",
    ).trim() || null;

  /*
   * IMPORTANTE:
   * campanha de CATEGORIA continua no chatbot GRANCONECTA
   * até o usuário escolher uma loja/prestador real.
   */
  const chatbotTipo:
    ContextoCampanhaRecente["chatbotTipo"] =
    tipoDestino === "PRESTADOR" &&
      prestadorId
      ? "PRESTADOR"
      : tipoDestino === "LOJA" &&
        lojaId
        ? "LOJA"
        : "GRANCONECTA";

  const chatbotOwnerId =
    chatbotTipo === "PRESTADOR"
      ? prestadorId
      : chatbotTipo === "LOJA"
        ? lojaId
        : null;

  const nomeLoja =
    String(
      campanha?.loja?.name || "",
    ).trim();

  const nomePrestador =
    prestadorId
      ? await resolverNomePrestador(
        prestadorId,
      )
      : "";

  const campanhaNome =
    String(
      campanha.nome ||
      "Campanha GranConecta",
    ).trim();

  const nomeAtendimento =
    chatbotTipo === "LOJA"
      ? nomeLoja || "GranConecta"
      : chatbotTipo === "PRESTADOR"
        ? nomePrestador ||
        "GranConecta"
        : "GranConecta";

  const playbook =
    tipoDestino === "CATEGORIA"
      ? await carregarPlaybookCategoria(
        categoriaId,
      )
      : null;

  console.log(
    "[MetaWhatsAppWebhook] Contexto comercial da campanha resolvido.",
    {
      campanhaId:
        Number(campanha.id),
      tipoDestino,
      categoriaId,
      categoriaNome,
      playbookId:
        playbook?.id || null,
      chatbotTipo,
      lojaId,
      prestadorId,
      storeName:
        nomeAtendimento,
    },
  );

  return {
    agendamentoId:
      Number(agendamento.id),

    campanhaId:
      Number(campanha.id),

    campanhaNome,

    campanhaDescricao:
      campanha.descricao || null,

    lojaId,

    prestadorId,

    tipoDestino,

    categoriaId,

    categoriaNome,

    playbook,

    chatbotTipo,

    chatbotOwnerId,

    storeName:
      nomeAtendimento,
  };
}

/**
 * Melhor forma de recuperar o contexto:
 * a resposta do WhatsApp pode trazer context.id apontando para a mensagem
 * enviada originalmente. Quando essa mensagem saiu de um agendamento de
 * campanha, conseguimos vincular a resposta à campanha EXATA.
 */
async function buscarContextoCampanhaPorMensagemOrigem(
  metaMessageId?: string,
): Promise<ContextoCampanhaRecente | null> {
  const id = String(metaMessageId || "").trim();

  if (!id) {
    return null;
  }

  const agendamento =
    await AppDataSource
      .getRepository(MarketingAgendamento)
      .createQueryBuilder("agendamento")
      .leftJoinAndSelect(
        "agendamento.campanha",
        "campanha",
      )
      .leftJoinAndSelect(
        "campanha.loja",
        "loja",
      )
      .leftJoinAndSelect(
        "campanha.categoria",
        "categoria",
      )
      .where(
        "agendamento.meta_message_id = :metaMessageId",
        {
          metaMessageId: id,
        },
      )
      .andWhere(
        "agendamento.campanha_id IS NOT NULL",
      )
      .orderBy(
        "agendamento.id",
        "DESC",
      )
      .getOne();

  if (!agendamento) {
    return null;
  }

  return await montarContextoCampanha(
    agendamento,
  );
}

/**
 * Fallback:
 * procura a campanha de WhatsApp mais recente associada ao telefone.
 *
 * A janela evita que uma mensagem enviada muitos dias depois seja
 * vinculada indevidamente a uma campanha antiga.
 */
async function buscarContextoCampanhaRecente(
  telefone: string,
): Promise<ContextoCampanhaRecente | null> {
  const telefoneNormalizado =
    String(telefone || "")
      .replace(/\D/g, "")
      .trim();

  if (!telefoneNormalizado) {
    return null;
  }

  const limite = new Date(
    Date.now() -
    JANELA_CONTEXTO_CAMPANHA_HORAS *
    60 *
    60 *
    1000,
  );

  const agendamento =
    await AppDataSource
      .getRepository(MarketingAgendamento)
      .createQueryBuilder("agendamento")
      .leftJoinAndSelect(
        "agendamento.campanha",
        "campanha",
      )
      .leftJoinAndSelect(
        "campanha.loja",
        "loja",
      )
      .leftJoinAndSelect(
        "campanha.categoria",
        "categoria",
      )
      .where(
        "agendamento.telefone = :telefone",
        {
          telefone:
            telefoneNormalizado,
        },
      )
      .andWhere(
        "agendamento.campanha_id IS NOT NULL",
      )
      .andWhere(
        "agendamento.status IN (:...statusValidos)",
        {
          statusValidos: [
            MarketingStatus.ENVIADO,
            MarketingStatus.ENTREGUE,
            MarketingStatus.LIDO,
          ],
        },
      )
      .andWhere(
        `COALESCE(
          agendamento.lido_em,
          agendamento.entregue_em,
          agendamento.enviado_em,
          agendamento.createdAt
        ) >= :limite`,
        {
          limite,
        },
      )
      .orderBy(
        `COALESCE(
          agendamento.lido_em,
          agendamento.entregue_em,
          agendamento.enviado_em,
          agendamento.createdAt
        )`,
        "DESC",
      )
      .addOrderBy(
        "agendamento.id",
        "DESC",
      )
      .getOne();

  if (!agendamento) {
    return null;
  }

  return await montarContextoCampanha(
    agendamento,
  );
}

async function processarMensagemRecebida(
  message: MetaWebhookMessage,
) {
  const telefone =
    String(message.from || "").trim();

  const texto =
    textoMensagem(message);

  const externalMessageId =
    String(message.id || "").trim();

  const repliedToMessageId =
    String(message.context?.id || "").trim();

  if (!telefone || !texto) {
    return;
  }

  const comando =
    normalizarComando(texto);

  /**
   * ============================================================
   * IDEMPOTÊNCIA POR ID DA META
   * ============================================================
   *
   * 1) Set em memória fecha a janela de corrida do mesmo processo.
   * 2) Banco continua sendo a proteção persistente.
   */
  if (externalMessageId) {
    if (
      mensagensEmProcessamento.has(
        externalMessageId,
      )
    ) {
      console.log(
        "[MetaWhatsAppWebhook] Mensagem concorrente duplicada ignorada.",
        {
          externalMessageId,
          telefoneFinal:
            telefone.slice(-4),
        },
      );

      return;
    }

    mensagensEmProcessamento.add(
      externalMessageId,
    );
  }

  try {
    if (externalMessageId) {
      const alreadyExists =
        await chatPersistence
          .externalMessageExists(
            "WHATSAPP",
            externalMessageId,
          );

      if (alreadyExists) {
        console.log(
          "[MetaWhatsAppWebhook] Mensagem duplicada ignorada.",
          {
            externalMessageId,
            telefoneFinal:
              telefone.slice(-4),
          },
        );

        return;
      }
    }

    /**
     * ============================================================
     * DUPLO TOQUE EM BOTÃO
     * ============================================================
     *
     * Dois cliques podem gerar dois IDs válidos e diferentes.
     * Aplicamos debounce SOMENTE a button/interactive.
     */
    const chaveRapida =
      chaveInteracaoRapida(
        telefone,
        message,
        texto,
      );

    if (
      chaveRapida &&
      interacaoDuplicadaRecente(
        chaveRapida,
      )
    ) {
      console.log(
        "[MetaWhatsAppWebhook] Duplo toque em botão ignorado.",
        {
          externalMessageId:
            externalMessageId || null,
          telefoneFinal:
            telefone.slice(-4),
          texto,
        },
      );

      return;
    }

    /**
     * ============================================================
     * CANCELAMENTO DE MARKETING
     * ============================================================
     */
    if (
      COMANDOS_CANCELAMENTO.has(
        comando,
      )
    ) {
      const cancelado =
        await MarketingLeadService
          .cancelarMarketingPorTelefone(
            telefone,
          );

      console.log(
        "[MetaWhatsAppWebhook] Pedido de cancelamento processado.",
        {
          telefoneFinal:
            telefone.slice(-4),
          comando,
          consentimentoEncontrado:
            cancelado,
        },
      );

      return;
    }

    /**
     * ============================================================
     * CONTEXTO DA CAMPANHA
     * ============================================================
     *
     * Ordem:
     * 1) context.id da mensagem respondida -> campanha exata;
     * 2) campanha recente do mesmo telefone -> fallback.
     */
    let contextoCampanha =
      await buscarContextoCampanhaPorMensagemOrigem(
        repliedToMessageId,
      );

    let origemContexto:
      | "MENSAGEM_ORIGEM"
      | "TELEFONE_RECENTE"
      | null =
      contextoCampanha
        ? "MENSAGEM_ORIGEM"
        : null;

    if (!contextoCampanha) {
      contextoCampanha =
        await buscarContextoCampanhaRecente(
          telefone,
        );

      if (contextoCampanha) {
        origemContexto =
          "TELEFONE_RECENTE";
      }
    }

    if (contextoCampanha) {
      console.log(
        "[MetaWhatsAppWebhook] Contexto de campanha identificado.",
        {
          origemContexto,
          repliedToMessageId:
            repliedToMessageId || null,
          campanhaId:
            contextoCampanha.campanhaId,
          campanhaNome:
            contextoCampanha.campanhaNome,
          agendamentoId:
            contextoCampanha.agendamentoId,
          chatbotTipo:
            contextoCampanha.chatbotTipo,
          chatbotOwnerId:
            contextoCampanha.chatbotOwnerId,
          tipoDestino:
            contextoCampanha.tipoDestino,
          categoriaId:
            contextoCampanha.categoriaId,
          categoriaNome:
            contextoCampanha.categoriaNome,
          playbookId:
            contextoCampanha.playbook?.id || null,
          entradaDiretaCampanha:
            origemContexto === "MENSAGEM_ORIGEM",
          telefoneFinal:
            telefone.slice(-4),
          janelaHoras:
            JANELA_CONTEXTO_CAMPANHA_HORAS,
        },
      );
    }

    /**
     * ============================================================
     * CHAT OMNICHANNEL
     * ============================================================
     */
    const result =
      await granConectaChatService
        .sendMessage({
          userId:
            `whatsapp:${telefone}`,

          userName:
            `WhatsApp ${telefone.slice(-4)}`,

          userType:
            "WHATSAPP",

          message:
            texto,

          chatbotTipo:
            contextoCampanha
              ?.chatbotTipo ||
            "GRANCONECTA",

          chatbotOwnerId:
            contextoCampanha
              ?.chatbotOwnerId ||
            null,

          storeName:
            contextoCampanha
              ?.storeName ||
            "GranConecta",

          campanhaId:
            contextoCampanha
              ?.campanhaId,

          campanhaNome:
            contextoCampanha
              ?.campanhaNome,

          tipoDestino:
            contextoCampanha
              ?.tipoDestino,

          categoriaId:
            contextoCampanha
              ?.categoriaId,


          categoriaNome: contextoCampanha?.categoriaNome ?? undefined,

          playbook:
            contextoCampanha
              ?.playbook ||
            null,

          /*
           * Só é true quando context.id da Meta encontrou a mensagem
           * original da campanha. O fallback por telefone NÃO reabre
           * atendimento humano automaticamente.
           */
          entradaDiretaCampanha:
            Boolean(contextoCampanha) &&
            origemContexto ===
            "MENSAGEM_ORIGEM",

          origem:
            "WHATSAPP",

          channel:
            "WHATSAPP",

          externalMessageId:
            externalMessageId ||
            undefined,
        });

    console.log(
      "[MetaWhatsAppWebhook] Mensagem encaminhada ao chat GranConecta.",
      {
        conversationId:
          result.conversationId,
        externalMessageId:
          externalMessageId || null,
        repliedToMessageId:
          repliedToMessageId || null,
        telefoneFinal:
          telefone.slice(-4),
        action:
          result.action?.type ||
          null,
        campanhaId:
          contextoCampanha
            ?.campanhaId ||
          null,
        campanhaNome:
          contextoCampanha
            ?.campanhaNome ||
          null,
        chatbotTipo:
          contextoCampanha
            ?.chatbotTipo ||
          "GRANCONECTA",
        chatbotOwnerId:
          contextoCampanha
            ?.chatbotOwnerId ||
          null,
        tipoDestino:
          contextoCampanha
            ?.tipoDestino ||
          null,
        categoriaId:
          contextoCampanha
            ?.categoriaId ||
          null,
        categoriaNome:
          contextoCampanha
            ?.categoriaNome ||
          null,
        playbookId:
          contextoCampanha
            ?.playbook?.id ||
          null,
      },
    );

    const answerText =
      String(
        (result as any)?.answer ||
        (result as any)?.text ||
        (result as any)?.message ||
        (result as any)?.response ||
        "",
      ).trim();

    if (!answerText) {
      return;
    }

    try {
      console.log(
        `[MetaWhatsAppWebhook] Disparando resposta via Meta WhatsApp para ${telefone}...`,
      );

      await MetaWhatsAppMessagingService
        .sendTextMessage({
          to: telefone,
          text: answerText,
        });

      console.log(
        `[MetaWhatsAppWebhook] Resposta enviada com sucesso para final ${telefone.slice(-4)}.`,
      );
    } catch (sendError) {
      const errorMsg =
        sendError instanceof Error
          ? sendError.message
          : "Erro desconhecido";

      console.error(
        "[MetaWhatsAppWebhook] Falha ao disparar resposta via Meta WhatsApp:",
        {
          telefoneFinal:
            telefone.slice(-4),
          error:
            errorMsg,
        },
      );
    }
  } finally {
    if (externalMessageId) {
      mensagensEmProcessamento.delete(
        externalMessageId,
      );
    }
  }
}

async function processarPayload(payload: MetaWebhookPayload) {
  if (payload.object !== "whatsapp_business_account") {
    return;
  }

  const campanhasAlteradas = new Set<number>();

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      /**
       * Identificação da WABA/número que originou o webhook.
       *
       * Mantemos este log no código-fonte porque é útil para diagnosticar
       * ambientes com mais de uma WhatsApp Business Account e mais de um
       * número conectado.
       *
       * Não registra conteúdo da mensagem nem telefone do usuário.
       */
      console.log("[MetaWhatsAppWebhook] Contexto WABA recebido.", {
        wabaId: entry.id || null,
        phoneNumberId:
          change.value?.metadata?.phone_number_id || null,
        displayPhoneNumber:
          change.value?.metadata?.display_phone_number || null,
        field: change.field || null,
      });

      if (change.field !== "messages") {
        continue;
      }

      // Processamento em paralelo de atualizações de status
      if (change.value?.statuses?.length) {
        const resultadosStatus = await Promise.all(
          change.value.statuses.map((status) => atualizarStatus(status)),
        );

        for (const campanhaId of resultadosStatus) {
          if (campanhaId) {
            campanhasAlteradas.add(campanhaId);
          }
        }
      }

      // Processamento sequencial das mensagens recebidas por ordem de chegada
      for (const message of change.value?.messages || []) {
        await processarMensagemRecebida(message);
      }
    }
  }

  // Recalcula os totais das campanhas impactadas em paralelo
  if (campanhasAlteradas.size > 0) {
    await Promise.all(
      Array.from(campanhasAlteradas).map((campanhaId) =>
        MarketingCampanhaService.recalcularTotais(campanhaId),
      ),
    );
  }
}

type WhatsAppConnectionCandidate = {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
};

type MetaOAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type MetaDebugTokenResponse = {
  data?: {
    app_id?: string;
    type?: string;
    application?: string;
    is_valid?: boolean;
    user_id?: string;
    scopes?: string[];
    granular_scopes?: Array<{
      scope?: string;
      target_ids?: string[];
    }>;
    expires_at?: number;
    data_access_expires_at?: number;
  };
};

type MetaPhoneNumber = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  name_status?: string;
};

type MetaPhoneNumbersResponse = {
  data?: MetaPhoneNumber[];
};

type MetaClientWabasResponse = {
  data?: Array<{
    id?: string;
    name?: string;
  }>;
};

function envObrigatoria(nome: string): string {
  const valor = String(process.env[nome] || "").trim();
  if (!valor) {
    throw new Error(
      `Variável de ambiente obrigatória não configurada: ${nome}`,
    );
  }
  return valor;
}

function metaGraphVersion(): string {
  const value = String(
    process.env.WHATSAPP_META_GRAPH_VERSION || "v26.0",
  ).trim();
  return value.startsWith("v") ? value : `v${value}`;
}

function metaGraphUrl(caminho: string): string {
  const normalized = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `https://graph.facebook.com/${metaGraphVersion()}${normalized}`;
}

async function metaJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const raw = await response.text();

  let body: any = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = { raw };
    }
  }

  if (!response.ok) {
    const message =
      body?.error?.message || body?.message || `HTTP ${response.status}`;
    throw new Error(`Meta Graph API: ${message}`);
  }

  return body as T;
}

async function trocarCodigoPorToken(code: string): Promise<string> {
  const appId = envObrigatoria("WHATSAPP_META_APP_ID");
  const appSecret = envObrigatoria("WHATSAPP_META_APP_SECRET");
  const redirectUri = envObrigatoria("WHATSAPP_META_OAUTH_REDIRECT_URI");

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const result = await metaJson<MetaOAuthTokenResponse>(
    `${metaGraphUrl("/oauth/access_token")}?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  const accessToken = String(result.access_token || "").trim();

  if (!accessToken) {
    throw new Error("A Meta não retornou access_token para o código OAuth.");
  }

  return accessToken;
}

async function descobrirWabaIdsPeloToken(
  userAccessToken: string,
): Promise<string[]> {
  const systemUserAccessToken = envObrigatoria(
    "WHATSAPP_META_SYSTEM_USER_ACCESS_TOKEN",
  );

  const params = new URLSearchParams({
    input_token: userAccessToken,
  });

  const result = await metaJson<MetaDebugTokenResponse>(
    `${metaGraphUrl("/debug_token")}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${systemUserAccessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (result.data?.is_valid === false) {
    throw new Error("O token devolvido pelo Embedded Signup não é válido.");
  }

  const targetIds = new Set<string>();

  for (const granular of result.data?.granular_scopes || []) {
    if (granular.scope !== "whatsapp_business_management") {
      continue;
    }
    for (const targetId of granular.target_ids || []) {
      if (targetId) {
        targetIds.add(String(targetId));
      }
    }
  }

  return Array.from(targetIds);
}

async function descobrirWabaIdsPeloBusiness(
  userAccessToken: string,
): Promise<string[]> {
  const businessId = String(
    process.env.WHATSAPP_META_BUSINESS_ID || "",
  ).trim();

  if (!businessId) {
    return [];
  }

  const result = await metaJson<MetaClientWabasResponse>(
    metaGraphUrl(`/${businessId}/client_whatsapp_business_accounts`),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        Accept: "application/json",
      },
    },
  );

  return (result.data || [])
    .map((item) => String(item.id || "").trim())
    .filter(Boolean);
}

async function descobrirWabaIds(userAccessToken: string): Promise<string[]> {
  const ids = new Set<string>();
  const debugIds = await descobrirWabaIdsPeloToken(userAccessToken);

  for (const id of debugIds) {
    ids.add(id);
  }

  if (ids.size === 0) {
    const businessIds = await descobrirWabaIdsPeloBusiness(userAccessToken);
    for (const id of businessIds) {
      ids.add(id);
    }
  }

  return Array.from(ids);
}

async function obterNumerosDaWaba(
  wabaId: string,
  userAccessToken: string,
): Promise<MetaPhoneNumber[]> {
  const fields = [
    "id",
    "display_phone_number",
    "verified_name",
    "quality_rating",
    "name_status",
  ].join(",");

  const params = new URLSearchParams({ fields });

  const result = await metaJson<MetaPhoneNumbersResponse>(
    `${metaGraphUrl(`/${wabaId}/phone_numbers`)}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        Accept: "application/json",
      },
    },
  );

  return result.data || [];
}

async function assinarAppNaWaba(
  wabaId: string,
  userAccessToken: string,
): Promise<void> {
  await metaJson<{ success?: boolean }>(
    metaGraphUrl(`/${wabaId}/subscribed_apps`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        Accept: "application/json",
      },
    },
  );
}

async function persistirConexoesWhatsApp(
  connections: WhatsAppConnectionCandidate[],
): Promise<void> {
  const repo = AppDataSource.getRepository(WhatsAppConnection);

  for (const connection of connections) {
    const existing = await repo.findOne({
      where: { phoneNumberId: connection.phoneNumberId },
    });

    const entity =
      existing ||
      repo.create({
        ownerType: WhatsAppConnectionOwnerType.GRANCONECTA,
        ownerId: null,
        wabaId: connection.wabaId,
        phoneNumberId: connection.phoneNumberId,
        displayPhoneNumber: connection.displayPhoneNumber || null,
        verifiedName: connection.verifiedName || null,
        status: WhatsAppConnectionStatus.ATIVO,
        connectedAt: new Date(),
        disconnectedAt: null,
        lastError: null,
      });

    entity.wabaId = connection.wabaId;
    entity.phoneNumberId = connection.phoneNumberId;
    entity.displayPhoneNumber = connection.displayPhoneNumber || null;
    entity.verifiedName = connection.verifiedName || null;
    entity.status = WhatsAppConnectionStatus.ATIVO;
    entity.connectedAt = new Date();
    entity.disconnectedAt = null;
    entity.lastError = null;

    await repo.save(entity);
  }
}

function frontendWhatsappRedirect(
  status: "connected" | "error",
  params?: Record<string, string>,
): string {
  const base = String(
    process.env.WHATSAPP_META_OAUTH_FRONTEND_REDIRECT ||
    "https://dev.admin.granconecta.net.br/admin/dashboard",
  ).trim();

  const url = new URL(base);
  url.searchParams.set("whatsapp", status);

  for (const [key, value] of Object.entries(params || {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export class MetaWhatsAppWebhookController {
  static verificar(request: Request, response: Response) {
    const mode = String(request.query["hub.mode"] || "");
    const token = String(request.query["hub.verify_token"] || "");
    const challenge = String(request.query["hub.challenge"] || "");

    const tokenEsperado = String(
      process.env.WHATSAPP_META_WEBHOOK_VERIFY_TOKEN || "",
    ).trim();

    if (!tokenEsperado) {
      console.error(
        "[MetaWhatsAppWebhook] WHATSAPP_META_WEBHOOK_VERIFY_TOKEN não configurado.",
      );
      return response.sendStatus(500);
    }

    if (mode === "subscribe" && token === tokenEsperado) {
      console.log("[MetaWhatsAppWebhook] Webhook verificado pela Meta.");
      return response.status(200).send(challenge);
    }

    console.warn("[MetaWhatsAppWebhook] Tentativa de verificação recusada.");
    return response.sendStatus(403);
  }

  static async oauthCallback(
    request: Request,
    response: Response,
  ): Promise<void> {
    const code = String(request.query.code || "").trim();
    const oauthError = String(request.query.error || "").trim();
    const oauthErrorDescription = String(
      request.query.error_description || "",
    ).trim();

    if (oauthError) {
      console.warn("[MetaWhatsAppOAuth] Autorização recusada pela Meta.", {
        error: oauthError,
        hasDescription: Boolean(oauthErrorDescription),
      });

      response.redirect(
        frontendWhatsappRedirect("error", {
          reason: "authorization_denied",
        }),
      );
      return;
    }

    if (!code) {
      console.warn("[MetaWhatsAppOAuth] Callback recebido sem código OAuth.");

      response.redirect(
        frontendWhatsappRedirect("error", {
          reason: "missing_code",
        }),
      );
      return;
    }

    try {
      console.log(
        "[MetaWhatsAppOAuth] Código OAuth recebido. Iniciando Embedded Signup.",
      );

      const userAccessToken = await trocarCodigoPorToken(code);
      const wabaIds = await descobrirWabaIds(userAccessToken);

      if (wabaIds.length === 0) {
        throw new Error(
          "Nenhuma WhatsApp Business Account foi compartilhada pelo Embedded Signup.",
        );
      }

      const connections: WhatsAppConnectionCandidate[] = [];

      for (const wabaId of wabaIds) {
        await assinarAppNaWaba(wabaId, userAccessToken);

        const phoneNumbers = await obterNumerosDaWaba(
          wabaId,
          userAccessToken,
        );

        for (const phone of phoneNumbers) {
          const phoneNumberId = String(phone.id || "").trim();

          if (!phoneNumberId) {
            continue;
          }

          connections.push({
            wabaId,
            phoneNumberId,
            displayPhoneNumber: String(phone.display_phone_number || "").trim(),
            verifiedName: String(phone.verified_name || "").trim(),
          });
        }
      }

      if (connections.length === 0) {
        throw new Error(
          "A WABA foi encontrada, mas nenhum número de telefone foi retornado pela Meta.",
        );
      }

      await persistirConexoesWhatsApp(connections);

      console.log(
        "[MetaWhatsAppOAuth] Embedded Signup processado com sucesso.",
        {
          wabas: wabaIds.length,
          phones: connections.length,
        },
      );

      const first = connections[0];

      response.redirect(
        frontendWhatsappRedirect("connected", {
          waba_id: first?.wabaId || wabaIds[0] || "",
          phone_number_id: first?.phoneNumberId || "",
        }),
      );
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error(
        "[MetaWhatsAppOAuth] Falha ao concluir Embedded Signup.",
        { error: message },
      );

      response.redirect(
        frontendWhatsappRedirect("error", {
          reason: "integration_failed",
        }),
      );
      return;
    }
  }

  static receber(request: RequestComRawBody, response: Response) {
    if (!validarAssinatura(request)) {
      console.warn("[MetaWhatsAppWebhook] Assinatura inválida ou ausente.");
      return response.sendStatus(401);
    }

    const payload = request.body as MetaWebhookPayload;

    response.sendStatus(200);

    void processarPayload(payload).catch((error) => {
      const mensagem =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("[MetaWhatsAppWebhook] Falha ao processar evento.", {
        erro: mensagem,
      });
    });
  }
}

export default MetaWhatsAppWebhookController;