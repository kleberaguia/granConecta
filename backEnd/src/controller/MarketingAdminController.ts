import type {
  Request,
  Response,
} from "express";

import {
  MarketingCampanhaStatus,
  MarketingCampanhaTipo,
  MarketingCampanhaDestinoTipo,
  MarketingSegmentacao,
  MarketingTemplateParametros,
} from "../models/MarketingCampanhaModel";
import { MarketingLeadOrigem } from "../models/MarketingLeadModel";
import {
  MarketingCanal,
  MarketingCanalConfiguracao,
} from "../models/MarketingCampanhaCanalModel";
import { executarMarketingAgora } from "../cron/marketingCron";
import MarketingCampanhaService from "../services/MarketingCampanhaService";
import MarketingDisparoService from "../services/MarketingDisparoService";
import MarketingLeadService from "../services/MarketingLeadService";
import MarketingCanalService from "../services/MarketingCanalService";
import MetaWhatsAppService from "../services/MetaWhatsAppService";
import { AppDataSource } from "../config/data-source";
import { Condominio } from "../models/condominiosModels";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { Store } from "../models/StoreModels";
import { Usuario } from "../models/UserModels";

type CorpoCampanha = {
  lojaId?: string | null;
  prestadorId?: string | null;
  bannerId?: number | null;
  nome?: string;
  descricao?: string | null;
  tipoCampanha?: MarketingCampanhaTipo | string;
  tipoDestino?: MarketingCampanhaDestinoTipo | string;
  categoriaId?: number | string | null;
  templateNome?: string;
  templateIdioma?: string;
  parametrosTemplate?: MarketingTemplateParametros | null;
  segmentacao?: MarketingSegmentacao | null;
  dataAgendamento?: Date | string;
};

type CorpoCanal = {
  canal?: MarketingCanal | string;
  configuracao?: MarketingCanalConfiguracao | null;
};

type CorpoBannerInstitucional = {
  titulo?: string;
  subtitulo?: string | null;
  imagemUrl?: string;
  corDestaque?: string;
  linkDestino?: string;
  condominioId?: string | null;
  localExibicao?: "MARKETPLACE" | "SERVICOS" | "AMBOS" | string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
};

function idObrigatorio(
  request: Request,
): number {
  const id = Number(request.params.id);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "ID da campanha inválido.",
    );
  }

  return id;
}

function numeroOpcional(
  valor: unknown,
): number | undefined {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return undefined;
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    throw new Error(
      "Valor numérico inválido.",
    );
  }

  return numero;
}

function canalObrigatorio(
  request: Request,
): MarketingCanal {
  const canalRecebido = String(
    request.params.canal || "",
  )
    .trim()
    .toUpperCase();

  const aliases: Record<string, string> = {
    INSTAGRAM: "INSTAGRAM_ORGANICO",
    FACEBOOK: "FACEBOOK_ORGANICO",
  };

  const canalNormalizado =
    aliases[canalRecebido] ||
    canalRecebido;

  const canaisPermitidos = [
    "WHATSAPP",
    "EMAIL",
    "NOTIFICACAO",
    "BANNER",
    "PUSH",
    "FACEBOOK_ADS",
    "INSTAGRAM_ADS",
    "FACEBOOK_ORGANICO",
    "INSTAGRAM_ORGANICO",
    "SMS",
  ];

  console.log(
    "[MarketingAdminController] Canal recebido.",
    {
      canalRecebido,
      canalNormalizado,
    },
  );

  if (
    !canaisPermitidos.includes(
      canalNormalizado,
    )
  ) {
    throw new Error(
      `Canal de marketing inválido: ${canalRecebido}`,
    );
  }

  return canalNormalizado as MarketingCanal;
}

function statusHttp(error: unknown): number {
  const mensagem =
    error instanceof Error
      ? error.message.toLowerCase()
      : "";

  if (
    mensagem.includes("não encontrad")
  ) {
    return 404;
  }

  if (
    mensagem.includes("consentimento") ||
    mensagem.includes("não foi aprovada") ||
    mensagem.includes(
      "pagamento confirmado",
    )
  ) {
    return 403;
  }

  if (
    mensagem.includes("não pode") ||
    mensagem.includes("somente campanhas")
  ) {
    return 409;
  }

  return 400;
}

function responderErro(
  response: Response,
  error: unknown,
) {
  const mensagem =
    error instanceof Error
      ? error.message
      : "Erro interno desconhecido.";

  console.error(
    "[MarketingAdminController]",
    {
      erro: mensagem,
    },
  );

  return response
    .status(statusHttp(error))
    .json({
      sucesso: false,
      mensagem,
    });
}

export class MarketingAdminController {
  static async listarCondominios(
    _request: Request,
    response: Response,
  ) {
    try {
      const condominios = await AppDataSource.getRepository(Condominio)
        .createQueryBuilder("condominio")
        .select([
          "condominio.id",
          "condominio.nome",
        ])
        .orderBy("condominio.nome", "ASC")
        .getMany();

      return response.json({
        sucesso: true,
        total: condominios.length,
        condominios,
      });
    } catch (error) {
      return responderErro(response, error);
    }
  }

  static async listarPrestadores(
    _request: Request,
    response: Response,
  ) {
    try {
      const prestadores =
        await AppDataSource
          .getRepository(Usuario)
          .createQueryBuilder("usuario")

          .leftJoin(
            PerfilPrestador,
            "perfil",
            "perfil.usuarioId = usuario.id",
          )

          .leftJoin(
            "categories",
            "categoria",
            "categoria.id = perfil.categoriaid",
          )

          .leftJoin(
            "grupos_home",
            "grupo",
            "grupo.id = categoria.grupo_id",
          )

          .select(
            "usuario.id",
            "id",
          )

          .addSelect(
            "usuario.name",
            "nomeUsuario",
          )

          .addSelect(
            "usuario.email",
            "email",
          )

          .addSelect(
            "usuario.tipo",
            "usuarioTipo",
          )

          .addSelect(
            "usuario.is_prestador",
            "isPrestador",
          )

          .addSelect(
            "usuario.status_conta",
            "statusConta",
          )

          .addSelect(
            "perfil.id",
            "perfilId",
          )

          .addSelect(
            "perfil.nome_profissional",
            "nomeProfissional",
          )

          .addSelect(
            "perfil.ativo",
            "perfilAtivo",
          )

          .addSelect(
            "perfil.status_aprovacao",
            "statusAprovacao",
          )

          .addSelect(
            "categoria.id",
            "categoriaId",
          )

          .addSelect(
            "categoria.name",
            "categoriaNome",
          )

          .addSelect(
            "categoria.tipo",
            "categoriaTipo",
          )

          .addSelect(
            "grupo.id",
            "grupoId",
          )

          .addSelect(
            "grupo.nome",
            "grupoNome",
          )

          .addSelect(
            "grupo.slug",
            "grupoSlug",
          )

          /*
           * A pessoa é considerada prestadora quando:
           *
           * usuario.tipo = PRESTADOR
           * OU
           * usuario.is_prestador = 1
           *
           * Não dependemos da existência de perfil/categoria.
           */
          .where(
            `
          (
            usuario.tipo = :tipoPrestador
            OR usuario.is_prestador = :isPrestador
          )
          `,
            {
              tipoPrestador: "PRESTADOR",
              isPrestador: true,
            },
          )

          /*
           * Para o painel de marketing usamos
           * somente contas ativas.
           */
          .andWhere(
            "usuario.status_conta = :statusConta",
            {
              statusConta: "ativo",
            },
          )

          .orderBy(
            "grupo.nome",
            "ASC",
          )

          .addOrderBy(
            "categoria.name",
            "ASC",
          )

          .addOrderBy(
            "usuario.name",
            "ASC",
          )

          .getRawMany<{
            id: string;
            nomeUsuario: string | null;
            email: string | null;
            usuarioTipo: string | null;
            isPrestador: boolean | number | string;
            statusConta: string | null;

            perfilId: string | null;
            nomeProfissional: string | null;
            perfilAtivo: boolean | number | string | null;
            statusAprovacao: string | null;

            categoriaId: string | number | null;
            categoriaNome: string | null;
            categoriaTipo: string | null;

            grupoId: string | number | null;
            grupoNome: string | null;
            grupoSlug: string | null;
          }>();

      const opcoes =
        prestadores
          .map((item) => ({
            /*
             * IMPORTANTE:
             *
             * marketing_campanhas.prestador_id
             * continua guardando usuarios.id.
             */
            id:
              String(
                item.id || "",
              ).trim(),

            usuarioId:
              String(
                item.id || "",
              ).trim(),

            perfilId:
              item.perfilId
                ? String(
                  item.perfilId,
                )
                : null,

            nome:
              String(
                item.nomeProfissional ||
                item.nomeUsuario ||
                "Prestador sem nome",
              ).trim(),

            nomeUsuario:
              item.nomeUsuario
                ? String(
                  item.nomeUsuario,
                )
                : null,

            email:
              item.email
                ? String(
                  item.email,
                )
                : null,

            categoriaId:
              item.categoriaId ??
              null,

            categoriaNome:
              item.categoriaNome
                ? String(
                  item.categoriaNome,
                )
                : null,

            categoriaTipo:
              item.categoriaTipo
                ? String(
                  item.categoriaTipo,
                )
                : null,

            grupoId:
              item.grupoId ??
              null,

            grupoNome:
              item.grupoNome
                ? String(
                  item.grupoNome,
                )
                : null,

            grupoSlug:
              item.grupoSlug
                ? String(
                  item.grupoSlug,
                )
                : null,

            status:
              item.statusAprovacao
                ? String(
                  item.statusAprovacao,
                )
                : null,
          }))

          /*
           * Mesmo que o perfil esteja incompleto,
           * o prestador continua disponível.
           */
          .filter(
            (item) =>
              Boolean(item.id),
          );

      return response.json({
        sucesso: true,
        total:
          opcoes.length,
        prestadores:
          opcoes,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async listarLojas(
    _request: Request,
    response: Response,
  ) {
    try {
      const lojas =
        await AppDataSource
          .getRepository(Store)
          .createQueryBuilder("loja")

          /*
           * O proprietário pode ser:
           * MORADOR,
           * PRESTADOR,
           * EMPREENDEDOR,
           * etc.
           *
           * O que importa aqui é existir uma STORE ativa.
           */
          .leftJoin(
            "usuarios",
            "usuario",
            "usuario.id = loja.usuarioId",
          )

          .leftJoin(
            "categories",
            "categoria",
            "categoria.id = loja.categoriaid",
          )

          .leftJoin(
            "grupos_home",
            "grupo",
            "grupo.id = categoria.grupo_id",
          )

          .select(
            "loja.id",
            "id",
          )

          .addSelect(
            "loja.usuarioId",
            "usuarioId",
          )

          .addSelect(
            "loja.name",
            "nome",
          )

          .addSelect(
            "loja.tipo",
            "tipo",
          )

          .addSelect(
            "loja.ativa",
            "ativa",
          )

          .addSelect(
            "usuario.name",
            "nomeProprietario",
          )

          .addSelect(
            "usuario.email",
            "emailProprietario",
          )

          .addSelect(
            "usuario.tipo",
            "usuarioTipo",
          )

          .addSelect(
            "usuario.status_conta",
            "statusConta",
          )

          .addSelect(
            "categoria.id",
            "categoriaId",
          )

          .addSelect(
            "categoria.name",
            "categoriaNome",
          )

          .addSelect(
            "categoria.tipo",
            "categoriaTipo",
          )

          .addSelect(
            "grupo.id",
            "grupoId",
          )

          .addSelect(
            "grupo.nome",
            "grupoNome",
          )

          .addSelect(
            "grupo.slug",
            "grupoSlug",
          )

          /*
           * Loja precisa estar ativa.
           */
          .where(
            "loja.ativa = :ativa",
            {
              ativa: true,
            },
          )

          /*
           * Se existir usuário vinculado,
           * não mostramos conta desativada.
           *
           * Mas não exigimos tipo EMPREENDEDOR.
           */
          .andWhere(
            `
          (
            usuario.id IS NULL
            OR usuario.status_conta = :statusConta
          )
          `,
            {
              statusConta: "ativo",
            },
          )

          .orderBy(
            "grupo.nome",
            "ASC",
          )

          .addOrderBy(
            "categoria.name",
            "ASC",
          )

          .addOrderBy(
            "loja.name",
            "ASC",
          )

          .getRawMany<{
            id: string;
            usuarioId: string | null;
            nome: string | null;
            tipo: string | null;
            ativa: boolean | number | string;

            nomeProprietario: string | null;
            emailProprietario: string | null;
            usuarioTipo: string | null;
            statusConta: string | null;

            categoriaId: string | number | null;
            categoriaNome: string | null;
            categoriaTipo: string | null;

            grupoId: string | number | null;
            grupoNome: string | null;
            grupoSlug: string | null;
          }>();

      const opcoes =
        lojas
          .map((item) => ({
            /*
             * IMPORTANTE:
             *
             * marketing_campanhas.loja_id
             * guarda stores.id.
             */
            id:
              String(
                item.id || "",
              ).trim(),

            usuarioId:
              item.usuarioId
                ? String(
                  item.usuarioId,
                )
                : null,

            nome:
              String(
                item.nome ||
                "Loja sem nome",
              ).trim(),

            nomeProprietario:
              item.nomeProprietario
                ? String(
                  item.nomeProprietario,
                )
                : null,

            emailProprietario:
              item.emailProprietario
                ? String(
                  item.emailProprietario,
                )
                : null,

            usuarioTipo:
              item.usuarioTipo
                ? String(
                  item.usuarioTipo,
                )
                : null,

            tipo:
              item.tipo
                ? String(
                  item.tipo,
                )
                : null,

            categoriaId:
              item.categoriaId ??
              null,

            categoriaNome:
              item.categoriaNome
                ? String(
                  item.categoriaNome,
                )
                : null,

            categoriaTipo:
              item.categoriaTipo
                ? String(
                  item.categoriaTipo,
                )
                : null,

            grupoId:
              item.grupoId ??
              null,

            grupoNome:
              item.grupoNome
                ? String(
                  item.grupoNome,
                )
                : null,

            grupoSlug:
              item.grupoSlug
                ? String(
                  item.grupoSlug,
                )
                : null,
          }))

          .filter(
            (item) =>
              Boolean(item.id),
          );

      return response.json({
        sucesso: true,
        total:
          opcoes.length,
        lojas:
          opcoes,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async criarBannerInstitucional(
    request: Request,
    response: Response,
  ) {
    try {
      const body = request.body as CorpoBannerInstitucional;
      const banner = await MarketingCanalService.criarBannerInstitucional({
        titulo: String(body.titulo || ""),
        subtitulo: body.subtitulo,
        imagemUrl: String(body.imagemUrl || ""),
        corDestaque: body.corDestaque,
        linkDestino: String(body.linkDestino || ""),
        condominioId: body.condominioId,
        localExibicao: body.localExibicao,
        dataInicio: body.dataInicio,
        dataFim: body.dataFim || "",
      });

      return response.status(201).json({
        sucesso: true,
        banner,
      });
    } catch (error) {
      return responderErro(response, error);
    }
  }

  static async criarCampanha(
    request: Request,
    response: Response,
  ) {
    try {
      const body =
        request.body as CorpoCampanha;
      const usuario = (request as Request & {
        user?: {
          id?: string;
          usuarioId?: string;
        };
      }).user;

      const campanha =
        await MarketingCampanhaService.criar({
          lojaId: body.lojaId,
          prestadorId:
            body.prestadorId,
          bannerId: body.bannerId,
          nome: String(body.nome || ""),
          descricao: body.descricao,
          tipoCampanha:
            body.tipoCampanha,
          tipoDestino:
            body.tipoDestino,
          categoriaId:
            body.categoriaId,
          criadoPor:
            usuario?.usuarioId ||
            usuario?.id ||
            null,
          templateNome: String(
            body.templateNome || "",
          ),
          templateIdioma:
            body.templateIdioma,
          parametrosTemplate:
            body.parametrosTemplate,
          segmentacao:
            body.segmentacao,
          dataAgendamento:
            body.dataAgendamento || "",
        });

      return response.status(201).json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async atualizarCampanha(
    request: Request,
    response: Response,
  ) {
    try {
      const id = idObrigatorio(request);
      const body =
        request.body as CorpoCampanha;

      /*
       * Distingue corretamente os três casos:
       * - campo ausente: mantém o banner atual;
       * - null: remove o vínculo;
       * - número/string numérica: vincula o banner informado.
       */
      const possuiBannerId =
        Object.prototype.hasOwnProperty.call(
          body,
          "bannerId",
        );

      const bannerId = !possuiBannerId
        ? undefined
        : body.bannerId === null
          ? null
          : numeroOpcional(
            body.bannerId,
          );

      const possuiLojaId =
        Object.prototype.hasOwnProperty.call(
          body,
          "lojaId",
        );

      const possuiPrestadorId =
        Object.prototype.hasOwnProperty.call(
          body,
          "prestadorId",
        );

      const lojaId = possuiLojaId
        ? String(body.lojaId || "").trim() || null
        : undefined;

      const prestadorId =
        possuiPrestadorId
          ? String(
            body.prestadorId || "",
          ).trim() || null
          : undefined;

      const possuiTipoDestino =
        Object.prototype.hasOwnProperty.call(
          body,
          "tipoDestino",
        );

      const possuiCategoriaId =
        Object.prototype.hasOwnProperty.call(
          body,
          "categoriaId",
        );

      const tipoDestino = possuiTipoDestino
        ? body.tipoDestino
        : undefined;

      const categoriaId = !possuiCategoriaId
        ? undefined
        : body.categoriaId === null ||
            body.categoriaId === ""
          ? null
          : numeroOpcional(body.categoriaId);

      console.log(
        "[MarketingAdminController] Atualizando campanha.",
        {
          campanhaId: id,
          possuiBannerId,
          bannerIdRecebido:
            body.bannerId,
          bannerIdNormalizado:
            bannerId,
          lojaId,
          prestadorId,
          tipoDestino,
          categoriaId,
        },
      );

      const campanha =
        await MarketingCampanhaService.atualizar(
          id,
          {
            lojaId,
            prestadorId,
            tipoDestino,
            categoriaId,
            bannerId,
            nome: body.nome,
            descricao: body.descricao,
            templateNome:
              body.templateNome,
            templateIdioma:
              body.templateIdioma,
            parametrosTemplate:
              body.parametrosTemplate,
            segmentacao:
              body.segmentacao,
            dataAgendamento:
              body.dataAgendamento,
          },
        );

      if (
        bannerId !== undefined &&
        Number(
          campanha.banner_id || 0,
        ) !== Number(bannerId || 0)
      ) {
        throw new Error(
          `O banner ${bannerId ?? "nenhum"} não foi persistido na campanha ${id}.`,
        );
      }

      console.log(
        "[MarketingAdminController] Campanha atualizada.",
        {
          campanhaId: campanha.id,
          bannerIdPersistido:
            campanha.banner_id || null,
        },
      );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async listarCampanhas(
    request: Request,
    response: Response,
  ) {
    try {
      const statusInformado = String(
        request.query.status || "",
      );

      const status =
        Object.values(
          MarketingCampanhaStatus,
        ).includes(
          statusInformado as MarketingCampanhaStatus,
        )
          ? (statusInformado as MarketingCampanhaStatus)
          : undefined;

      const resultado =
        await MarketingCampanhaService.listar(
          {
            status,
            lojaId: request.query.lojaId
              ? String(
                request.query.lojaId,
              )
              : undefined,
            prestadorId:
              request.query.prestadorId
                ? String(
                  request.query
                    .prestadorId,
                )
                : undefined,
            tipoDestino:
              request.query.tipoDestino
                ? String(
                  request.query.tipoDestino,
                )
                : undefined,
            categoriaId:
              request.query.categoriaId
                ? numeroOpcional(
                  request.query.categoriaId,
                )
                : undefined,
            pagina: numeroOpcional(
              request.query.pagina,
            ),
            limite: numeroOpcional(
              request.query.limite,
            ),
          },
        );

      return response.json({
        sucesso: true,
        ...resultado,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async buscarCampanha(
    request: Request,
    response: Response,
  ) {
    try {
      const campanha =
        await MarketingCampanhaService.buscarPorId(
          idObrigatorio(request),
        );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async configurarCanais(
    request: Request,
    response: Response,
  ) {
    try {

      const canaisInformados =
        Array.isArray(request.body)
          ? request.body
          : request.body?.canais;

      if (!Array.isArray(canaisInformados)) {
        throw new Error(
          "Informe a lista de canais da campanha.",
        );
      }

      const canais = await MarketingCanalService.configurar(
        idObrigatorio(request),
        canaisInformados.map(
          (item: CorpoCanal) => ({
            canal: String(
              item?.canal || "",
            )
              .trim()
              .toUpperCase() as MarketingCanal,
            configuracao:
              item?.configuracao || {},
          }),
        ),
      );

      return response.json({
        sucesso: true,
        total: canais.length,
        canais,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async listarCanais(
    request: Request,
    response: Response,
  ) {
    try {
      const campanhaId = idObrigatorio(request);
      const canais = await MarketingCanalService.listar(
        campanhaId,
      );

      /*
       * Auditoria do WhatsApp no próprio retorno de /canais.
       * Assim o frontend consegue mostrar exatamente quem entrou na fila,
       * telefone, status, tentativas e eventual erro sem criar uma nova rota.
       */
      let destinatariosWhatsapp: Array<{
        id: number;
        usuarioId: string | null;
        leadId: string | null;
        nome: string;
        telefone: string;
        status: string;
        tentativas: number;
        dataExecucao: Date | string | null;
        metaMessageId: string | null;
        ultimoErro: string | null;
        createdAt: Date | string | null;
        updatedAt: Date | string | null;
      }> = [];

      try {
        const destinatarios = await AppDataSource.query(
          `
    SELECT
      a.id AS id,
      a.usuario_id AS usuarioId,
      a.lead_id AS leadId,

      COALESCE(
        NULLIF(TRIM(l.nome), ''),
        NULLIF(TRIM(u.name), ''),
        'Destinatário'
      ) AS nome,

      COALESCE(
        NULLIF(TRIM(a.telefone), ''),
        NULLIF(TRIM(l.telefone), ''),
        NULLIF(TRIM(u.telefone), ''),
        ''
      ) AS telefone,

      a.status AS status,

      COALESCE(
        a.tentativas,
        0
      ) AS tentativas,

      a.data_execucao AS dataExecucao,
      a.meta_message_id AS metaMessageId,
      a.ultimo_erro AS ultimoErro,
      a.createdAt AS createdAt,
      a.updatedAt AS updatedAt

    FROM marketing_agendamentos a

    LEFT JOIN marketing_leads l
      ON
        l.id COLLATE utf8mb4_unicode_ci =
        a.lead_id COLLATE utf8mb4_unicode_ci

    LEFT JOIN usuarios u
      ON
        u.id COLLATE utf8mb4_unicode_ci =
        a.usuario_id COLLATE utf8mb4_unicode_ci

    WHERE a.campanha_id = ?

    ORDER BY a.id ASC
  `,
          [campanhaId],
        );

        destinatariosWhatsapp = (Array.isArray(destinatarios) ? destinatarios : []).map(
          (item: any) => ({
            id: Number(item.id),
            usuarioId: item.usuarioId ? String(item.usuarioId) : null,
            leadId: item.leadId ? String(item.leadId) : null,
            nome: String(item.nome || 'Destinatário').trim(),
            telefone: String(item.telefone || '').trim(),
            status: String(item.status || 'PENDENTE').trim().toUpperCase(),
            tentativas: Number(item.tentativas || 0),
            dataExecucao: item.dataExecucao || null,
            metaMessageId: item.metaMessageId
              ? String(item.metaMessageId)
              : null,
            ultimoErro: item.ultimoErro ? String(item.ultimoErro) : null,
            createdAt: item.createdAt || null,
            updatedAt: item.updatedAt || null,
          }),
        );
      } catch (auditError) {
        /*
         * A auditoria não pode derrubar a configuração dos canais.
         * Se houver diferença de schema no ambiente, os canais continuam abrindo
         * e o erro fica explícito no log para ajuste.
         */
        console.error(
          '[MarketingAdminController] Falha ao carregar destinatários WhatsApp.',
          {
            campanhaId,
            erro:
              auditError instanceof Error
                ? auditError.message
                : String(auditError),
          },
        );
      }

      const canaisComAuditoria = canais.map((canal: any) =>
        String(canal?.canal || '').toUpperCase() === 'WHATSAPP'
          ? {
            ...canal,
            destinatarios: destinatariosWhatsapp,
          }
          : canal,
      );

      return response.json({
        sucesso: true,
        total: canaisComAuditoria.length,
        canais: canaisComAuditoria,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async executarCanal(
    request: Request,
    response: Response,
  ) {
    try {
      const resultado = await MarketingCanalService.executar(
        idObrigatorio(request),
        canalObrigatorio(request),
      );

      return response.json({
        sucesso: true,
        resultado,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async cancelarCanal(
    request: Request,
    response: Response,
  ) {
    try {
      const canal = await MarketingCanalService.cancelar(
        idObrigatorio(request),
        canalObrigatorio(request),
      );

      return response.json({
        sucesso: true,
        canal,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async solicitarContratacao(
    request: Request,
    response: Response,
  ) {
    try {
      const campanha =
        await MarketingCampanhaService.solicitarContratacao(
          idObrigatorio(request),
        );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async confirmarPagamento(
    request: Request,
    response: Response,
  ) {
    try {
      const campanha =
        await MarketingCampanhaService.marcarComoPaga(
          idObrigatorio(request),
        );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async aprovarCampanha(
    request: Request,
    response: Response,
  ) {
    try {
      const campanha =
        await MarketingCampanhaService.aprovar(
          idObrigatorio(request),
        );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async agendarCampanha(
    request: Request,
    response: Response,
  ) {
    try {
      const dataAgendamento =
        request.body?.dataAgendamento as
        | Date
        | string
        | undefined;

      const campanha =
        await MarketingCampanhaService.agendar(
          idObrigatorio(request),
          dataAgendamento,
        );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async cancelarCampanha(
    request: Request,
    response: Response,
  ) {
    try {
      const campanha =
        await MarketingCampanhaService.cancelar(
          idObrigatorio(request),
        );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async gerarFila(
    request: Request,
    response: Response,
  ) {
    try {
      const resultado =
        await MarketingDisparoService.gerarFila(
          idObrigatorio(request),
        );

      return response.json({
        sucesso: true,
        resultado,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async processarFila(
    request: Request,
    response: Response,
  ) {
    try {
      const campanhaId =
        request.body?.campanhaId !==
          undefined
          ? Number(
            request.body.campanhaId,
          )
          : undefined;

      const resultado =
        await MarketingDisparoService.processarPendentes(
          {
            campanhaId,
            limite: numeroOpcional(
              request.body?.limite,
            ),
            maxTentativas:
              numeroOpcional(
                request.body
                  ?.maxTentativas,
              ),
          },
        );

      return response.json({
        sucesso: true,
        resultado,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async executarCiclo(
    _request: Request,
    response: Response,
  ) {
    try {
      const resultado =
        await executarMarketingAgora();

      return response.json({
        sucesso: true,
        resultado,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async recalcularTotais(
    request: Request,
    response: Response,
  ) {
    try {
      const campanha =
        await MarketingCampanhaService.recalcularTotais(
          idObrigatorio(request),
        );

      return response.json({
        sucesso: true,
        campanha,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async testarEnvio(
    request: Request,
    response: Response,
  ) {
    try {
      const telefone = String(
        request.body?.telefone || "",
      ).trim();
      const usuarioId = request.body
        ?.usuarioId
        ? String(
          request.body.usuarioId,
        )
        : null;
      const nomeTemplate = String(
        request.body?.nomeTemplate ||
        "",
      ).trim();
      const idioma = request.body?.idioma
        ? String(request.body.idioma)
        : undefined;
      const parametrosCorpo =
        Array.isArray(
          request.body
            ?.parametrosCorpo,
        )
          ? request.body
            .parametrosCorpo
          : [];

      const permitido =
        await MarketingLeadService.podeReceberMarketing(
          {
            telefone,
            usuarioId,
          },
        );

      if (!permitido) {
        return response.status(403).json({
          sucesso: false,
          mensagem:
            "Teste bloqueado: destinatário sem consentimento de marketing.",
        });
      }

      const resultado =
        await MetaWhatsAppService.enviarMarketing(
          {
            telefone,
            nomeTemplate,
            idioma,
            parametrosCorpo,
            consentimentoConfirmado: true,
          },
        );

      return response.json({
        sucesso: true,
        resultado,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async capturarLead(
    request: Request,
    response: Response,
  ) {
    try {
      const origemInformada = String(
        request.body?.origem || "",
      ) as MarketingLeadOrigem;

      if (
        !Object.values(
          MarketingLeadOrigem,
        ).includes(origemInformada)
      ) {
        throw new Error(
          "Origem do lead inválida.",
        );
      }

      const resultado =
        await MarketingLeadService.capturarOuAtualizar(
          {
            telefone: String(
              request.body?.telefone ||
              "",
            ),
            nome:
              request.body?.nome || null,
            email:
              request.body?.email ||
              null,
            usuarioId:
              request.body?.usuarioId ||
              null,
            condominioId:
              request.body
                ?.condominioId || null,
            origem: origemInformada,
            origemReferencia:
              request.body
                ?.origemReferencia ||
              null,
            aceitaMarketing:
              request.body
                ?.aceitaMarketing ===
              true,
            aceitaUtilidade:
              request.body
                ?.aceitaUtilidade !==
              false,
            origemConsentimento:
              request.body
                ?.origemConsentimento,
          },
        );

      return response.status(201).json({
        sucesso: true,
        resultado,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }

  static async listarLeads(
    request: Request,
    response: Response,
  ) {
    try {
      const condominioId = String(
        request.query.condominioId || "",
      ).trim();

      if (!condominioId) {
        throw new Error(
          "condominioId não informado.",
        );
      }

      const leads =
        await MarketingLeadService.listarAtivosPorCondominio(
          condominioId,
        );

      return response.json({
        sucesso: true,
        total: leads.length,
        leads,
      });
    } catch (error) {
      return responderErro(
        response,
        error,
      );
    }
  }
}

export default MarketingAdminController;