import { existsSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { In } from "typeorm";

import { AppDataSource } from "../config/data-source";
import {
  MarketingCampanha,
  MarketingCampanhaStatus,
  MarketingCampanhaTipo,
  MarketingSegmentacao,
} from "../models/MarketingCampanhaModel";
import {
  MarketingCampanhaCanal,
  MarketingCanal,
  MarketingCanalConfiguracao,
  MarketingCanalStatus,
} from "../models/MarketingCampanhaCanalModel";
import {
  BannerLocalExibicao,
  MarketPlaceModel,
} from "../models/MarketPlaceModel";
import { Usuario } from "../models/UserModels";
import { NotificationService } from "./NotificationService";

export type ConfigurarMarketingCanalInput = {
  canal: MarketingCanal;
  configuracao?: MarketingCanalConfiguracao | null;
};

export type ResultadoCanal = {
  campanhaId: number;
  canal: MarketingCanal;
  destinatarios: number;
  enviados: number;
  falhas: number;
  ignorado: boolean;
  motivo: string | null;
};

export type CriarBannerInstitucionalInput = {
  titulo: string;
  subtitulo?: string | null;
  imagemUrl: string;
  corDestaque?: string;
  linkDestino: string;
  condominioId?: string | null;
  localExibicao?: BannerLocalExibicao | string;
  dataInicio?: Date | string;
  dataFim: Date | string;
};

const CANAL_INSTAGRAM_ORGANICO = (
  Object.values(MarketingCanal).includes("INSTAGRAM_ORGANICO" as MarketingCanal)
    ? "INSTAGRAM_ORGANICO"
    : "INSTAGRAM"
) as MarketingCanal;

const CANAL_FACEBOOK_ORGANICO = (
  Object.values(MarketingCanal).includes("FACEBOOK_ORGANICO" as MarketingCanal)
    ? "FACEBOOK_ORGANICO"
    : "FACEBOOK"
) as MarketingCanal;

const CANAIS_IMPLEMENTADOS = [
  MarketingCanal.NOTIFICACAO,
  MarketingCanal.BANNER,
  CANAL_INSTAGRAM_ORGANICO,
  CANAL_FACEBOOK_ORGANICO,
];

type MetaInstagramError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type MetaInstagramIdResponse = MetaInstagramError & {
  id?: string;
};

type MetaInstagramStatusResponse = MetaInstagramError & {
  id?: string;
  status?: string;
  status_code?: string;
};

type MetaInstagramMediaResponse = MetaInstagramError & {
  id?: string;
  permalink?: string;
  media_type?: string;
  timestamp?: string;
};

type InstagramConfiguracaoPersistida = MarketingCanalConfiguracao & {
  imagemUrl?: string;
  legenda?: string;
  instagramContainerId?: string;
  instagramMediaId?: string;
  instagramPermalink?: string;
  instagramPublicadoEm?: string;
};

type MetaFacebookError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type MetaFacebookPublicacaoResponse = MetaFacebookError & {
  id?: string;
  post_id?: string;
};

type MetaFacebookPostResponse = MetaFacebookError & {
  id?: string;
  permalink_url?: string;
  created_time?: string;
};

type FacebookConfiguracaoPersistida = MarketingCanalConfiguracao & {
  imagemUrl?: string;
  legenda?: string;
  facebookPhotoId?: string;
  facebookPostId?: string;
  facebookPermalink?: string;
  facebookPublicadoEm?: string;
};

function idNumerico(valor: unknown, nome: string): number {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${nome} inválido.`);
  }

  return id;
}

function textoObrigatorio(valor: unknown, nome: string): string {
  const texto = String(valor || "").trim();

  if (!texto) {
    throw new Error(`${nome} não informado.`);
  }

  return texto;
}

function normalizarCanal(valor: unknown): MarketingCanal {
  let canal = String(valor || "")
    .trim()
    .toUpperCase() as MarketingCanal;

  if (
    canal === ("INSTAGRAM" as MarketingCanal) &&
    Object.values(MarketingCanal).includes(
      "INSTAGRAM_ORGANICO" as MarketingCanal,
    )
  ) {
    canal = "INSTAGRAM_ORGANICO" as MarketingCanal;
  }

  if (
    canal === ("FACEBOOK" as MarketingCanal) &&
    Object.values(MarketingCanal).includes(
      "FACEBOOK_ORGANICO" as MarketingCanal,
    )
  ) {
    canal = "FACEBOOK_ORGANICO" as MarketingCanal;
  }

  if (!Object.values(MarketingCanal).includes(canal)) {
    throw new Error("Canal de marketing inválido.");
  }

  return canal;
}

function mensagemErro(error: unknown): string {
  return error instanceof Error ? error.message : "Erro desconhecido";
}

function dataValida(valor: Date | string | undefined, nome: string): Date {
  const data =
    valor instanceof Date
      ? new Date(valor.getTime())
      : new Date(String(valor || ""));
  if (Number.isNaN(data.getTime())) {
    throw new Error(`${nome} inválida.`);
  }
  return data;
}

function normalizarLocalExibicao(valor: unknown): BannerLocalExibicao {
  const local = String(valor || BannerLocalExibicao.MARKETPLACE)
    .trim()
    .toUpperCase() as BannerLocalExibicao;

  if (!Object.values(BannerLocalExibicao).includes(local)) {
    throw new Error("Local de exibição do banner inválido.");
  }
  return local;
}

function bloquearPublicacaoSocialLocal(canal: string): void {
  if (process.env.NODE_ENV === "local") {
    throw new Error(
      `[LOCAL] Publicação externa em ${canal} bloqueada. Nenhuma publicação foi enviada.`,
    );
  }
}

function obterConfiguracaoInstagram() {
  bloquearPublicacaoSocialLocal("Instagram");
  const habilitado =
    String(process.env.META_SOCIAL_ENABLED || "")
      .trim()
      .toLowerCase() === "true";
  const accountId = String(process.env.META_INSTAGRAM_ACCOUNT_ID || "").trim();
  const accessToken = String(
    process.env.META_INSTAGRAM_ACCESS_TOKEN || "",
  ).trim();

  if (!habilitado) {
    throw new Error("Publicação social desativada. Ative META_SOCIAL_ENABLED.");
  }

  if (!accountId || !accessToken) {
    throw new Error(
      "Configuração do Instagram incompleta. Verifique META_INSTAGRAM_ACCOUNT_ID e META_INSTAGRAM_ACCESS_TOKEN.",
    );
  }

  return {
    accountId,
    accessToken,
  };
}

function obterConfiguracaoFacebook() {
  bloquearPublicacaoSocialLocal("Facebook");
  const habilitado =
    String(process.env.META_SOCIAL_ENABLED || "")
      .trim()
      .toLowerCase() === "true";
  const pageId = String(process.env.META_FACEBOOK_PAGE_ID || "").trim();
  const accessToken = String(
    process.env.META_FACEBOOK_ACCESS_TOKEN || "",
  ).trim();
  const graphVersion = String(
    process.env.META_GRAPH_VERSION ||
      process.env.WHATSAPP_META_GRAPH_VERSION ||
      "v20.0",
  )
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!habilitado) {
    throw new Error("Publicação social desativada. Ative META_SOCIAL_ENABLED.");
  }

  if (!pageId || !accessToken) {
    throw new Error(
      "Configuração do Facebook incompleta. Verifique META_FACEBOOK_PAGE_ID e META_FACEBOOK_ACCESS_TOKEN.",
    );
  }

  return {
    pageId,
    accessToken,
    graphVersion,
  };
}

function obterBasePublica(): string {
  const base = String(
    process.env.META_SOCIAL_PUBLIC_BASE_URL ||
      process.env.PUBLIC_API_URL ||
      process.env.API_PUBLIC_URL ||
      "",
  )
    .trim()
    .replace(/\/+$/, "");

  if (!base) {
    throw new Error(
      "Configure META_SOCIAL_PUBLIC_BASE_URL com a URL pública da API.",
    );
  }

  let url: URL;

  try {
    url = new URL(base);
  } catch {
    throw new Error("META_SOCIAL_PUBLIC_BASE_URL inválida.");
  }

  if (url.protocol !== "https:") {
    throw new Error("META_SOCIAL_PUBLIC_BASE_URL precisa utilizar HTTPS.");
  }

  return url.origin;
}

function aguardar(milisegundos: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milisegundos);
  });
}

async function chamarInstagram<T extends MetaInstagramError>(
  caminho: string,
  init: RequestInit = {},
): Promise<T> {
  bloquearPublicacaoSocialLocal("Instagram");
  const { accessToken } = obterConfiguracaoInstagram();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const url = `https://graph.instagram.com/${String(caminho).replace(
    /^\/+/,
    "",
  )}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });
    const texto = await response.text();
    let data: T;

    try {
      data = (texto ? JSON.parse(texto) : {}) as T;
    } catch {
      throw new Error(
        `Resposta inválida da API do Instagram (HTTP ${response.status}).`,
      );
    }

    if (!response.ok || data.error) {
      const partes = [
        data.error?.message || `Erro HTTP ${response.status}`,
        data.error?.code ? `Código ${data.error.code}` : null,
        data.error?.error_subcode
          ? `Subcódigo ${data.error.error_subcode}`
          : null,
      ].filter(Boolean);

      throw new Error(partes.join(" - "));
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tempo limite excedido ao acessar o Instagram.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function chamarFacebook<T extends MetaFacebookError>(
  caminho: string,
  init: RequestInit = {},
): Promise<T> {
  bloquearPublicacaoSocialLocal("Facebook");
  const { accessToken, graphVersion } = obterConfiguracaoFacebook();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const url = `https://graph.facebook.com/${graphVersion}/${String(
    caminho,
  ).replace(/^\/+/, "")}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });
    const texto = await response.text();
    let data: T;

    try {
      data = (texto ? JSON.parse(texto) : {}) as T;
    } catch {
      throw new Error(
        `Resposta inválida da API do Facebook (HTTP ${response.status}).`,
      );
    }

    if (!response.ok || data.error) {
      const partes = [
        data.error?.message || `Erro HTTP ${response.status}`,
        data.error?.code ? `Código ${data.error.code}` : null,
        data.error?.error_subcode
          ? `Subcódigo ${data.error.error_subcode}`
          : null,
      ].filter(Boolean);

      throw new Error(partes.join(" - "));
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tempo limite excedido ao acessar o Facebook.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function prepararImagemInstagram(
  imagemInformada: string,
): Promise<string> {
  const imagem = textoObrigatorio(imagemInformada, "Imagem do Instagram");
  const absoluta = /^https?:\/\//i.test(imagem);
  const basePublica = absoluta ? new URL(imagem).origin : obterBasePublica();
  const caminhoPublico = absoluta
    ? new URL(imagem).pathname
    : `/${imagem.replace(/^\/+/, "")}`;
  const extensao = path.extname(caminhoPublico).toLowerCase();

  if (extensao === ".jpg" || extensao === ".jpeg") {
    return absoluta ? imagem : `${basePublica}${caminhoPublico}`;
  }

  if (!caminhoPublico.startsWith("/uploads/")) {
    throw new Error(
      "A imagem remota do Instagram precisa estar em JPEG. Imagens locais de /uploads são convertidas automaticamente.",
    );
  }

  const raiz = path.resolve(process.cwd());
  const arquivoOrigem = path.resolve(raiz, caminhoPublico.replace(/^\/+/, ""));

  if (
    arquivoOrigem !== raiz &&
    !arquivoOrigem.startsWith(`${raiz}${path.sep}`)
  ) {
    throw new Error("Caminho da imagem do Instagram inválido.");
  }

  if (!existsSync(arquivoOrigem)) {
    throw new Error(
      "Arquivo da imagem do Instagram não encontrado no servidor.",
    );
  }

  const dadosCaminho = path.parse(arquivoOrigem);
  const arquivoJpeg = path.join(
    dadosCaminho.dir,
    `${dadosCaminho.name}-instagram.jpg`,
  );

  if (!existsSync(arquivoJpeg)) {
    await sharp(arquivoOrigem)
      .resize(1080, 1080, {
        fit: "contain",
        background: "#ffffff",
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 90 })
      .toFile(arquivoJpeg);
  }

  const caminhoRelativo = path
    .relative(raiz, arquivoJpeg)
    .split(path.sep)
    .join("/");

  return `${basePublica}/${caminhoRelativo}`;
}

async function aguardarContainerInstagram(containerId: string): Promise<void> {
  const maxConsultas = 12;

  for (let tentativa = 1; tentativa <= maxConsultas; tentativa += 1) {
    const resultado = await chamarInstagram<MetaInstagramStatusResponse>(
      `${containerId}?fields=id,status_code,status`,
    );
    const status = String(
      resultado.status_code || resultado.status || "",
    ).toUpperCase();

    if (status === "FINISHED") {
      return;
    }

    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(
        `Processamento da mídia do Instagram terminou com status ${status}.`,
      );
    }

    if (tentativa < maxConsultas) {
      await aguardar(1_500);
    }
  }

  throw new Error(
    "A mídia do Instagram não ficou pronta dentro do tempo esperado.",
  );
}

async function buscarCampanha(campanhaId: number): Promise<MarketingCampanha> {
  const campanha = await AppDataSource.getRepository(MarketingCampanha).findOne(
    {
      where: { id: campanhaId },
      relations: {
        banner: true,
        canais: true,
      },
    },
  );

  if (!campanha) {
    throw new Error("Campanha de marketing não encontrada.");
  }

  return campanha;
}

async function buscarCanal(
  campanhaId: number,
  canal: MarketingCanal,
): Promise<MarketingCampanhaCanal> {
  const registro = await AppDataSource.getRepository(
    MarketingCampanhaCanal,
  ).findOne({
    where: {
      campanha_id: campanhaId,
      canal,
    },
    relations: {
      campanha: true,
    },
  });

  if (!registro) {
    throw new Error(`Canal ${canal} não configurado para a campanha.`);
  }

  return registro;
}

function validarConfiguracao(
  campanha: MarketingCampanha,
  canal: MarketingCanal,
  configuracao: MarketingCanalConfiguracao,
) {
  if (canal === MarketingCanal.NOTIFICACAO) {
    textoObrigatorio(configuracao.titulo, "Título da notificação");
    textoObrigatorio(configuracao.mensagem, "Mensagem da notificação");
  }

  if (canal === MarketingCanal.WHATSAPP) {
    const templateNome = textoObrigatorio(
      configuracao.templateNome,
      "Template do WhatsApp",
    );

    if (!/^[a-z0-9_]+$/.test(templateNome)) {
      throw new Error(
        "Template do WhatsApp inválido. Use apenas letras minúsculas, números e sublinhado.",
      );
    }

    const idioma = String(
      configuracao.idioma ||
      configuracao.templateIdioma ||
      "pt_BR",
    ).trim();

    if (!/^[a-z]{2}_[A-Z]{2}$/.test(idioma)) {
      throw new Error(
        "Idioma do template WhatsApp inválido. Exemplo esperado: pt_BR.",
      );
    }

    configuracao.templateNome = templateNome;
    configuracao.idioma = idioma;
  }

  if (canal === MarketingCanal.BANNER && !campanha.banner_id) {
    throw new Error(
      "A campanha precisa ter um banner vinculado para ativar este canal.",
    );
  }

  if (canal === CANAL_INSTAGRAM_ORGANICO) {
    const configuracaoInstagram =
      configuracao as InstagramConfiguracaoPersistida;
    const imagem = String(
      configuracaoInstagram.imagemUrl || campanha.banner?.imagem_url || "",
    ).trim();

    if (!imagem) {
      throw new Error(
        "Informe configuracao.imagemUrl ou vincule um banner à campanha para publicar no Instagram.",
      );
    }
  }

  if (canal === CANAL_FACEBOOK_ORGANICO) {
    const configuracaoFacebook =
      configuracao as FacebookConfiguracaoPersistida;
    const imagem = String(
      configuracaoFacebook.imagemUrl || campanha.banner?.imagem_url || "",
    ).trim();

    if (!imagem) {
      throw new Error(
        "Informe configuracao.imagemUrl ou vincule um banner à campanha para publicar no Facebook.",
      );
    }
  }
}

function campanhaPodeExecutar(
  campanha: MarketingCampanha,
  configuracao: MarketingCanalConfiguracao,
) {
  if (!campanha.aprovado) {
    throw new Error("Campanha ainda não foi aprovada.");
  }

  const institucional =
    campanha.tipo_campanha !== MarketingCampanhaTipo.CONTRATADA ||
    configuracao.institucional === true;

  if (!campanha.pago && !institucional) {
    throw new Error("Campanha ainda não possui pagamento confirmado.");
  }

  if (
    campanha.status === MarketingCampanhaStatus.CANCELADA ||
    campanha.status === MarketingCampanhaStatus.FALHOU
  ) {
    throw new Error(
      `Campanha no status ${campanha.status} não pode ser executada.`,
    );
  }
}

async function listarDestinatarios(
  segmentacao: MarketingSegmentacao | null | undefined,
): Promise<Usuario[]> {
  const query = AppDataSource.getRepository(Usuario)
    .createQueryBuilder("usuario")
    .select("usuario");

  const condominioIds = (segmentacao?.condominioIds || [])
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean);

  if (condominioIds.length > 0) {
    query.andWhere("usuario.condominio_id IN (:...condominioIds)", {
      condominioIds,
    });
  }

  const usuarioTipos = (segmentacao?.usuarioTipos || [])
    .map(String)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  if (usuarioTipos.length > 0) {
    query.andWhere("UPPER(usuario.tipo) IN (:...usuarioTipos)", {
      usuarioTipos,
    });
  }

  if (segmentacao?.somenteUsuariosAtivos !== false) {
    query.andWhere("LOWER(usuario.status_conta) IN (:...statusAtivos)", {
      statusAtivos: ["ativo", "aprovado"],
    });
  }

  return query.orderBy("usuario.id", "ASC").getMany();
}

async function executarNotificacao(
  registro: MarketingCampanhaCanal,
): Promise<ResultadoCanal> {
  const configuracao = registro.configuracao || {};
  const campanha = await buscarCampanha(registro.campanha_id);

  campanhaPodeExecutar(campanha, configuracao);
  validarConfiguracao(campanha, MarketingCanal.NOTIFICACAO, configuracao);

  const titulo = textoObrigatorio(configuracao.titulo, "Título da notificação");
  const mensagem = textoObrigatorio(
    configuracao.mensagem,
    "Mensagem da notificação",
  );
  const destinatarios = await listarDestinatarios(campanha.segmentacao);

  registro.total_destinatarios = destinatarios.length;

  let enviados = 0;
  let falhas = 0;

  for (const usuario of destinatarios) {
    try {
      const notificacao = await NotificationService.enviarSomenteInterna(
        usuario.id,
        titulo,
        mensagem,
      );

      if (notificacao) {
        enviados += 1;
      } else {
        falhas += 1;
      }
    } catch (error) {
      falhas += 1;
      console.error("[MarketingCanalService] Falha na notificação interna.", {
        campanhaId: campanha.id,
        usuarioId: usuario.id,
        error: mensagemErro(error),
      });
    }
  }

  registro.total_enviados = enviados;
  registro.total_falhas = falhas;

  return {
    campanhaId: campanha.id,
    canal: MarketingCanal.NOTIFICACAO,
    destinatarios: destinatarios.length,
    enviados,
    falhas,
    ignorado: false,
    motivo: null,
  };
}

async function executarBanner(
  registro: MarketingCampanhaCanal,
): Promise<ResultadoCanal> {
  const configuracao = registro.configuracao || {};
  const campanha = await buscarCampanha(registro.campanha_id);

  campanhaPodeExecutar(campanha, configuracao);
  validarConfiguracao(campanha, MarketingCanal.BANNER, configuracao);

  const banner = await AppDataSource.getRepository(MarketPlaceModel).findOne({
    where: { id: campanha.banner_id! },
  });

  if (!banner) {
    throw new Error("Banner da campanha não encontrado.");
  }

  const agora = new Date();
  const dataFimInformada = configuracao.dataFim
    ? new Date(String(configuracao.dataFim))
    : banner.data_fim;

  if (
    !dataFimInformada ||
    Number.isNaN(dataFimInformada.getTime()) ||
    dataFimInformada.getTime() <= agora.getTime()
  ) {
    throw new Error("Data final do banner inválida.");
  }

  banner.status = "aprovado";
  banner.pago = campanha.pago || configuracao.institucional === true;
  banner.ativo = true;
  banner.data_inicio = agora;
  banner.data_fim = dataFimInformada;

  if (configuracao.linkDestino) {
    banner.link_destino = String(configuracao.linkDestino).trim();
  }

  await AppDataSource.getRepository(MarketPlaceModel).save(banner);

  registro.external_id = String(banner.id);
  registro.total_destinatarios = 1;
  registro.total_enviados = 1;
  registro.total_falhas = 0;

  return {
    campanhaId: campanha.id,
    canal: MarketingCanal.BANNER,
    destinatarios: 1,
    enviados: 1,
    falhas: 0,
    ignorado: false,
    motivo: null,
  };
}

async function executarInstagram(
  registro: MarketingCampanhaCanal,
): Promise<ResultadoCanal> {
  const configuracao = (registro.configuracao ||
    {}) as InstagramConfiguracaoPersistida;
  const campanha = await buscarCampanha(registro.campanha_id);

  campanhaPodeExecutar(campanha, configuracao);
  validarConfiguracao(campanha, CANAL_INSTAGRAM_ORGANICO, configuracao);

  const { accountId } = obterConfiguracaoInstagram();
  const imagemInformada = String(
    configuracao.imagemUrl || campanha.banner?.imagem_url || "",
  ).trim();
  const imagemUrl = await prepararImagemInstagram(imagemInformada);
  const legenda = String(
    configuracao.legenda ||
      configuracao.mensagem ||
      campanha.descricao ||
      campanha.nome,
  )
    .trim()
    .slice(0, 2_200);
  const repo = AppDataSource.getRepository(MarketingCampanhaCanal);

  let containerId = String(configuracao.instagramContainerId || "").trim();

  if (!containerId) {
    const bodyContainer = new URLSearchParams({
      image_url: imagemUrl,
      caption: legenda,
    });
    const container = await chamarInstagram<MetaInstagramIdResponse>(
      `${accountId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyContainer,
      },
    );

    containerId = textoObrigatorio(
      container.id,
      "ID do contêiner do Instagram",
    );
    configuracao.instagramContainerId = containerId;
    registro.configuracao = configuracao;
    await repo.save(registro);
  }

  await aguardarContainerInstagram(containerId);

  let mediaId = String(configuracao.instagramMediaId || "").trim();

  if (!mediaId) {
    const bodyPublicacao = new URLSearchParams({
      creation_id: containerId,
    });
    const publicacao = await chamarInstagram<MetaInstagramIdResponse>(
      `${accountId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyPublicacao,
      },
    );

    mediaId = textoObrigatorio(publicacao.id, "ID da publicação do Instagram");
    configuracao.instagramMediaId = mediaId;
    registro.external_id = mediaId;
    registro.configuracao = configuracao;
    await repo.save(registro);
  }

  const media = await chamarInstagram<MetaInstagramMediaResponse>(
    `${mediaId}?fields=id,permalink,media_type,timestamp`,
  );

  configuracao.instagramPermalink = String(media.permalink || "").trim();
  configuracao.instagramPublicadoEm =
    String(media.timestamp || "").trim() || new Date().toISOString();
  registro.configuracao = configuracao;
  registro.external_id = mediaId;
  registro.total_destinatarios = 1;
  registro.total_enviados = 1;
  registro.total_falhas = 0;

  console.log("[MarketingCanalService] Publicação enviada ao Instagram.", {
    campanhaId: campanha.id,
    mediaId,
    permalink: configuracao.instagramPermalink || null,
  });

  return {
    campanhaId: campanha.id,
    canal: CANAL_INSTAGRAM_ORGANICO,
    destinatarios: 1,
    enviados: 1,
    falhas: 0,
    ignorado: false,
    motivo: null,
  };
}

async function executarFacebook(
  registro: MarketingCampanhaCanal,
): Promise<ResultadoCanal> {
  const configuracao = (registro.configuracao ||
    {}) as FacebookConfiguracaoPersistida;
  const campanha = await buscarCampanha(registro.campanha_id);

  campanhaPodeExecutar(campanha, configuracao);
  validarConfiguracao(campanha, CANAL_FACEBOOK_ORGANICO, configuracao);

  const { pageId } = obterConfiguracaoFacebook();
  const imagemInformada = String(
    configuracao.imagemUrl || campanha.banner?.imagem_url || "",
  ).trim();
  const imagemUrl = /^https?:\/\//i.test(imagemInformada)
    ? imagemInformada
    : `${obterBasePublica()}/${imagemInformada.replace(/^\/+/, "")}`;
  const legenda = String(
    configuracao.legenda ||
      configuracao.mensagem ||
      campanha.descricao ||
      campanha.nome,
  )
    .trim()
    .slice(0, 63_206);
  const repo = AppDataSource.getRepository(MarketingCampanhaCanal);

  let photoId = String(configuracao.facebookPhotoId || "").trim();
  let postId = String(configuracao.facebookPostId || "").trim();

  if (!photoId && !postId) {
    const body = new URLSearchParams({
      url: imagemUrl,
      message: legenda,
      published: "true",
    });
    const publicacao = await chamarFacebook<MetaFacebookPublicacaoResponse>(
      `${pageId}/photos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    photoId = String(publicacao.id || "").trim();
    postId = String(publicacao.post_id || "").trim();

    if (!photoId && !postId) {
      throw new Error("A Meta não retornou o ID da publicação do Facebook.");
    }

    configuracao.facebookPhotoId = photoId || undefined;
    configuracao.facebookPostId = postId || undefined;
    registro.external_id = postId || photoId;
    registro.configuracao = configuracao;
    await repo.save(registro);
  }

  const idConsulta = postId || photoId;
  const post = await chamarFacebook<MetaFacebookPostResponse>(
    `${idConsulta}?fields=id,permalink_url,created_time`,
  );

  configuracao.facebookPermalink = String(post.permalink_url || "").trim();
  configuracao.facebookPublicadoEm =
    String(post.created_time || "").trim() || new Date().toISOString();
  registro.configuracao = configuracao;
  registro.external_id = postId || photoId;
  registro.total_destinatarios = 1;
  registro.total_enviados = 1;
  registro.total_falhas = 0;

  console.log("[MarketingCanalService] Publicação enviada ao Facebook.", {
    campanhaId: campanha.id,
    photoId: photoId || null,
    postId: postId || null,
    permalink: configuracao.facebookPermalink || null,
  });

  return {
    campanhaId: campanha.id,
    canal: CANAL_FACEBOOK_ORGANICO,
    destinatarios: 1,
    enviados: 1,
    falhas: 0,
    ignorado: false,
    motivo: null,
  };
}

export const MarketingCanalService = {
  async criarBannerInstitucional(
    input: CriarBannerInstitucionalInput,
  ): Promise<MarketPlaceModel> {
    const titulo = textoObrigatorio(input.titulo, "Título do banner");
    const imagemUrl = textoObrigatorio(input.imagemUrl, "Imagem do banner");
    const linkDestino = textoObrigatorio(input.linkDestino, "Link de destino");
    const dataInicio = input.dataInicio
      ? dataValida(input.dataInicio, "Data inicial do banner")
      : new Date();
    const dataFim = dataValida(input.dataFim, "Data final do banner");

    if (dataFim.getTime() <= dataInicio.getTime()) {
      throw new Error(
        "A data final do banner deve ser posterior à data inicial.",
      );
    }

    const banner = AppDataSource.getRepository(MarketPlaceModel).create({
      loja_id: null,
      condominio_id: String(input.condominioId || "").trim() || null,
      local_exibicao: normalizarLocalExibicao(input.localExibicao),
      titulo,
      subtitulo: String(input.subtitulo || "").trim() || null,
      imagem_url: imagemUrl,
      cor_destaque: String(input.corDestaque || "#3b82f6").trim(),
      link_destino: linkDestino,
      data_inicio: dataInicio,
      data_fim: dataFim,
      status: "pendente",
      pago: false,
      ativo: false,
    });

    return AppDataSource.getRepository(MarketPlaceModel).save(banner);
  },

  async configurar(
    campanhaIdInformado: number,
    inputs: ConfigurarMarketingCanalInput[],
  ): Promise<MarketingCampanhaCanal[]> {
    const campanhaId = idNumerico(campanhaIdInformado, "ID da campanha");
    const campanha = await buscarCampanha(campanhaId);

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new Error("Informe ao menos um canal para a campanha.");
    }

    const canais = inputs.map((input) => normalizarCanal(input.canal));

    if (new Set(canais).size !== canais.length) {
      throw new Error("Existem canais duplicados na configuração.");
    }

    const repo = AppDataSource.getRepository(MarketingCampanhaCanal);
    const existentes = await repo.find({
      where: {
        campanha_id: campanhaId,
        canal: In(canais),
      },
    });

    const porCanal = new Map(existentes.map((item) => [item.canal, item]));
    const registros: MarketingCampanhaCanal[] = [];

    for (const input of inputs) {
      const canal = normalizarCanal(input.canal);
      const configuracao = input.configuracao || {};

      validarConfiguracao(campanha, canal, configuracao);

      const registro =
        porCanal.get(canal) ||
        repo.create({
          campanha_id: campanhaId,
          canal,
        });

      registro.configuracao = configuracao;

      /*
       * Estado do canal após uma configuração válida:
       *
       * - campanha já AGENDADA/PROCESSANDO -> AGENDADO
       * - demais campanhas editáveis -> CONFIGURADO
       *
       * Assim "Salvar configuração" não deixa um canal válido
       * preso em RASCUNHO e também não finge que ele já foi agendado.
       */
      registro.status =
        campanha.status === MarketingCampanhaStatus.AGENDADA ||
        campanha.status === MarketingCampanhaStatus.PROCESSANDO
          ? MarketingCanalStatus.AGENDADO
          : MarketingCanalStatus.CONFIGURADO;

      registro.ultimo_erro = null;
      registro.concluido_em = null;
      registros.push(registro);
    }

    return repo.save(registros);
  },

  async listar(campanhaIdInformado: number) {
    const campanhaId = idNumerico(campanhaIdInformado, "ID da campanha");

    await buscarCampanha(campanhaId);

    return AppDataSource.getRepository(MarketingCampanhaCanal).find({
      where: { campanha_id: campanhaId },
      order: { id: "ASC" },
    });
  },

  async executar(
    campanhaIdInformado: number,
    canalInformado: MarketingCanal,
  ): Promise<ResultadoCanal> {
    const campanhaId = idNumerico(campanhaIdInformado, "ID da campanha");
    const canal = normalizarCanal(canalInformado);
    const registro = await buscarCanal(campanhaId, canal);

    // LOCAL: recusar publicações externas antes de alterar o estado do canal.
    // Notificações internas e banners continuam disponíveis para testes.
    if (canal === CANAL_INSTAGRAM_ORGANICO || canal === CANAL_FACEBOOK_ORGANICO) {
      bloquearPublicacaoSocialLocal(String(canal));
    }

    if (!CANAIS_IMPLEMENTADOS.includes(canal)) {
      throw new Error(
        `O canal ${canal} ainda não possui executor implementado.`,
      );
    }

    if (registro.status === MarketingCanalStatus.CONCLUIDO) {
      return {
        campanhaId,
        canal,
        destinatarios: registro.total_destinatarios,
        enviados: registro.total_enviados,
        falhas: registro.total_falhas,
        ignorado: true,
        motivo: "Canal já processado.",
      };
    }

    registro.status = MarketingCanalStatus.PROCESSANDO;
    registro.iniciado_em = new Date();
    registro.concluido_em = null;
    registro.ultimo_erro = null;

    const repo = AppDataSource.getRepository(MarketingCampanhaCanal);
    await repo.save(registro);

    try {
      let resultado: ResultadoCanal;

      switch (canal) {
        case MarketingCanal.NOTIFICACAO:
          resultado = await executarNotificacao(registro);
          break;
        case MarketingCanal.BANNER:
          resultado = await executarBanner(registro);
          break;
        case CANAL_INSTAGRAM_ORGANICO:
          resultado = await executarInstagram(registro);
          break;
        case CANAL_FACEBOOK_ORGANICO:
          resultado = await executarFacebook(registro);
          break;
        default:
          throw new Error(
            `O canal ${canal} ainda não possui executor implementado.`,
          );
      }

      registro.status = MarketingCanalStatus.CONCLUIDO;
      registro.concluido_em = new Date();
      await repo.save(registro);

      return resultado;
    } catch (error) {
      registro.status = MarketingCanalStatus.FALHOU;
      registro.total_falhas = Math.max(1, registro.total_falhas || 0);
      registro.ultimo_erro = mensagemErro(error);
      registro.concluido_em = new Date();
      await repo.save(registro);
      throw error;
    }
  },

  async cancelar(campanhaIdInformado: number, canalInformado: MarketingCanal) {
    const campanhaId = idNumerico(campanhaIdInformado, "ID da campanha");
    const canal = normalizarCanal(canalInformado);
    const registro = await buscarCanal(campanhaId, canal);

    registro.status = MarketingCanalStatus.CANCELADO;
    registro.concluido_em = new Date();

    if (canal === MarketingCanal.BANNER && registro.external_id) {
      await AppDataSource.getRepository(MarketPlaceModel).update(
        { id: Number(registro.external_id) },
        { ativo: false },
      );
    }

    return AppDataSource.getRepository(MarketingCampanhaCanal).save(registro);
  },
};

export default MarketingCanalService;