import { In } from "typeorm";

import { AppDataSource } from "../config/data-source";
import {
  MarketingCampanha,
  MarketingCampanhaStatus,
  MarketingCampanhaTipo,
  MarketingCampanhaDestinoTipo,
  MarketingSegmentacao,
  MarketingTemplateParametros,
} from "../models/MarketingCampanhaModel";
import {
  MarketingAgendamento,
  MarketingStatus,
} from "../models/MarketingAgendamentoModels";
import { MarketPlaceModel } from "../models/MarketPlaceModel";
import { Store } from "../models/StoreModels";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import {
  MarketingCampanhaCanal,
  MarketingCanal,
  MarketingCanalStatus,
} from "../models/MarketingCampanhaCanalModel";

export type CriarMarketingCampanhaInput = {
  lojaId?: string | null;
  prestadorId?: string | null;
  bannerId?: number | null;
  nome: string;
  descricao?: string | null;
  tipoCampanha?: MarketingCampanhaTipo | string;
  tipoDestino?: MarketingCampanhaDestinoTipo | string;
  categoriaId?: number | string | null;
  criadoPor?: string | null;
  templateNome?: string | null;
  templateIdioma?: string;
  parametrosTemplate?: MarketingTemplateParametros | null;
  segmentacao?: MarketingSegmentacao | null;
  dataAgendamento: Date | string;
};

export type AtualizarMarketingCampanhaInput =
  Partial<
    Omit<
      CriarMarketingCampanhaInput,
      "criadoPor" | "tipoCampanha"
    >
  >;

export type FiltrosMarketingCampanha = {
  status?: MarketingCampanhaStatus;
  lojaId?: string;
  prestadorId?: string;
  tipoDestino?: MarketingCampanhaDestinoTipo | string;
  categoriaId?: number | string;
  pagina?: number;
  limite?: number;
};


export type MarketingWhatsappAgendamentoResumo = {
  id: number;
  status: MarketingStatus;
  tentativas: number;
  data_execucao: Date | string | null;
  meta_message_id: string | null;
  ultimo_erro: string | null;
};

export type MarketingSituacaoWhatsapp =
  | "REAGENDADA"
  | null;

export type MarketingCampanhaComWhatsapp =
  MarketingCampanha & {
    situacao_whatsapp: MarketingSituacaoWhatsapp;
    whatsapp_agendamento:
    | MarketingWhatsappAgendamentoResumo
    | null;
  };

function textoObrigatorio(
  valor: unknown,
  campo: string,
): string {
  const texto = String(valor || "").trim();

  if (!texto) {
    throw new Error(`${campo} não informado.`);
  }

  return texto;
}

function textoOpcional(
  valor: unknown,
): string | null {
  const texto = String(valor || "").trim();
  return texto || null;
}

function normalizarTemplateNome(
  valor: unknown,
): string | null {
  const nome = textoOpcional(valor)?.toLowerCase() || null;

  if (!nome) {
    return null;
  }

  if (!/^[a-z0-9_]+$/.test(nome)) {
    throw new Error(
      "Nome do template inválido. Use apenas letras minúsculas, números e sublinhado.",
    );
  }

  return nome;
}

function normalizarTipoCampanha(
  valor: unknown,
): MarketingCampanhaTipo {
  const tipo = String(
    valor || MarketingCampanhaTipo.CONTRATADA,
  )
    .trim()
    .toUpperCase() as MarketingCampanhaTipo;

  if (!Object.values(MarketingCampanhaTipo).includes(tipo)) {
    throw new Error("Tipo de campanha inválido.");
  }

  return tipo;
}

function normalizarTipoDestino(
  valor: unknown,
): MarketingCampanhaDestinoTipo {
  const tipo = String(
    valor || MarketingCampanhaDestinoTipo.GRANCONECTA,
  )
    .trim()
    .toUpperCase() as MarketingCampanhaDestinoTipo;

  if (
    !Object.values(MarketingCampanhaDestinoTipo).includes(tipo)
  ) {
    throw new Error("Tipo de destino da campanha inválido.");
  }

  return tipo;
}

function normalizarCategoriaId(
  valor: unknown,
): number | null {
  if (
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ""
  ) {
    return null;
  }

  const categoriaId = Number(valor);

  if (
    !Number.isInteger(categoriaId) ||
    categoriaId <= 0
  ) {
    throw new Error("Categoria da campanha inválida.");
  }

  return categoriaId;
}

function validarDestino(input: {
  tipoDestino: MarketingCampanhaDestinoTipo;
  categoriaId: number | null;
  lojaId: string | null;
  prestadorId: string | null;
}) {
  if (
    input.tipoDestino ===
      MarketingCampanhaDestinoTipo.CATEGORIA &&
    !input.categoriaId
  ) {
    throw new Error(
      "Campanha com destino CATEGORIA exige uma categoria.",
    );
  }

  if (
    input.tipoDestino ===
      MarketingCampanhaDestinoTipo.LOJA &&
    !input.lojaId
  ) {
    throw new Error(
      "Campanha com destino LOJA exige uma loja.",
    );
  }

  if (
    input.tipoDestino ===
      MarketingCampanhaDestinoTipo.PRESTADOR &&
    !input.prestadorId
  ) {
    throw new Error(
      "Campanha com destino PRESTADOR exige um prestador.",
    );
  }
}

function normalizarIdioma(
  valor: unknown,
): string {
  const idioma =
    textoOpcional(valor) || "pt_BR";

  if (!/^[a-z]{2}_[A-Z]{2}$/.test(idioma)) {
    throw new Error(
      "Idioma do template inválido. Exemplo esperado: pt_BR.",
    );
  }

  return idioma;
}

function normalizarData(
  valor: Date | string,
): Date {
  const data =
    valor instanceof Date
      ? new Date(valor.getTime())
      : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new Error(
      "Data de agendamento inválida.",
    );
  }

  return data;
}

function validarResponsavel(
  lojaId: string | null,
  prestadorId: string | null,
  tipoCampanha: MarketingCampanhaTipo,
) {
  if (
    tipoCampanha === MarketingCampanhaTipo.CONTRATADA &&
    !lojaId &&
    !prestadorId
  ) {
    throw new Error(
      "Campanha contratada exige uma loja ou um prestador responsável.",
    );
  }

  if (lojaId && prestadorId) {
    throw new Error(
      "A campanha não pode pertencer simultaneamente a uma loja e a um prestador.",
    );
  }
}


type MarketingAgendamentoRawResumo = {
  id: string | number;
  campanha_id: string | number;
  canal_id: string | number | null;
  status: MarketingStatus;
  tentativas: string | number | null;
  data_execucao: Date | string | null;
  meta_message_id: string | null;
  ultimo_erro: string | null;
  updatedAt: Date | string | null;
};

function ehReagendamentoMeta131049(
  agendamento: MarketingAgendamentoRawResumo,
): boolean {
  const dataExecucao = agendamento.data_execucao
    ? new Date(agendamento.data_execucao)
    : null;

  const dataFutura = Boolean(
    dataExecucao &&
    !Number.isNaN(dataExecucao.getTime()) &&
    dataExecucao.getTime() > Date.now(),
  );

  return (
    agendamento.status === MarketingStatus.PENDENTE &&
    Number(agendamento.tentativas || 0) > 0 &&
    dataFutura &&
    String(agendamento.ultimo_erro || "").includes(
      "131049",
    )
  );
}

function paraResumoWhatsapp(
  agendamento: MarketingAgendamentoRawResumo,
): MarketingWhatsappAgendamentoResumo {
  return {
    id: Number(agendamento.id),
    status: agendamento.status,
    tentativas: Number(
      agendamento.tentativas || 0,
    ),
    data_execucao:
      agendamento.data_execucao || null,
    meta_message_id:
      agendamento.meta_message_id || null,
    ultimo_erro:
      agendamento.ultimo_erro || null,
  };
}

/**
 * Carrega a situação operacional do WhatsApp sem usar relations/joins.
 *
 * Isso é intencional: marketing_agendamentos possui chaves textuais que
 * podem estar com collation diferente de outras tabelas. Como já tivemos
 * erro "Illegal mix of collations" em JOIN automático do TypeORM, esta
 * consulta lê somente marketing_agendamentos e relaciona os dados em
 * memória pelo campanha_id.
 */
async function buscarSituacoesWhatsapp(
  campanhaIds: number[],
): Promise<
  Map<
    number,
    {
      situacao_whatsapp: MarketingSituacaoWhatsapp;
      whatsapp_agendamento:
      | MarketingWhatsappAgendamentoResumo
      | null;
    }
  >
> {
  const ids = Array.from(
    new Set(
      campanhaIds
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) && id > 0,
        ),
    ),
  );

  const resultado = new Map<
    number,
    {
      situacao_whatsapp: MarketingSituacaoWhatsapp;
      whatsapp_agendamento:
      | MarketingWhatsappAgendamentoResumo
      | null;
    }
  >();

  if (ids.length === 0) {
    return resultado;
  }

  /*
   * Primeiro buscamos os registros concretos do canal WHATSAPP.
   * Não usamos relations/joins com marketing_agendamentos.
   */
  const canaisWhatsapp =
    await AppDataSource.getRepository(
      MarketingCampanhaCanal,
    )
      .createQueryBuilder("canal")
      .select(
        "canal.id",
        "id",
      )
      .addSelect(
        "canal.campanha_id",
        "campanha_id",
      )
      .where(
        "canal.campanha_id IN (:...campanhaIds)",
        {
          campanhaIds: ids,
        },
      )
      .andWhere(
        "canal.canal = :canal",
        {
          canal: MarketingCanal.WHATSAPP,
        },
      )
      .getRawMany<{
        id: string | number;
        campanha_id: string | number;
      }>();

  const canalPorCampanha =
    new Map<number, number>();

  for (const canal of canaisWhatsapp) {
    const campanhaId = Number(
      canal.campanha_id,
    );

    const canalId = Number(
      canal.id,
    );

    if (
      Number.isInteger(campanhaId) &&
      campanhaId > 0 &&
      Number.isInteger(canalId) &&
      canalId > 0
    ) {
      canalPorCampanha.set(
        campanhaId,
        canalId,
      );
    }
  }

  const canalIds = Array.from(
    canalPorCampanha.values(),
  );

  if (canalIds.length === 0) {
    for (const campanhaId of ids) {
      resultado.set(campanhaId, {
        situacao_whatsapp: null,
        whatsapp_agendamento: null,
      });
    }

    return resultado;
  }

  const linhas =
    await AppDataSource.getRepository(
      MarketingAgendamento,
    )
      .createQueryBuilder("agendamento")
      .select(
        "agendamento.id",
        "id",
      )
      .addSelect(
        "agendamento.campanha_id",
        "campanha_id",
      )
      .addSelect(
        "agendamento.canal_id",
        "canal_id",
      )
      .addSelect(
        "agendamento.status",
        "status",
      )
      .addSelect(
        "agendamento.tentativas",
        "tentativas",
      )
      .addSelect(
        "agendamento.data_execucao",
        "data_execucao",
      )
      .addSelect(
        "agendamento.meta_message_id",
        "meta_message_id",
      )
      .addSelect(
        "agendamento.ultimo_erro",
        "ultimo_erro",
      )
      .addSelect(
        "agendamento.updatedAt",
        "updatedAt",
      )
      .where(
        "agendamento.canal_id IN (:...canalIds)",
        {
          canalIds,
        },
      )
      .orderBy(
        "agendamento.campanha_id",
        "ASC",
      )
      .addOrderBy(
        "agendamento.data_execucao",
        "ASC",
      )
      .addOrderBy(
        "agendamento.updatedAt",
        "DESC",
      )
      .getRawMany<MarketingAgendamentoRawResumo>();

  const porCampanha = new Map<
    number,
    MarketingAgendamentoRawResumo[]
  >();

  for (const linha of linhas) {
    const campanhaId = Number(
      linha.campanha_id,
    );

    const canalEsperado =
      canalPorCampanha.get(
        campanhaId,
      );

    if (
      !Number.isInteger(campanhaId) ||
      campanhaId <= 0 ||
      !canalEsperado ||
      Number(linha.canal_id) !==
      canalEsperado
    ) {
      continue;
    }

    const lista =
      porCampanha.get(campanhaId) || [];

    lista.push(linha);
    porCampanha.set(
      campanhaId,
      lista,
    );
  }

  for (const campanhaId of ids) {
    const agendamentos =
      porCampanha.get(campanhaId) || [];

    const reagendado =
      agendamentos.find(
        ehReagendamentoMeta131049,
      );

    if (reagendado) {
      resultado.set(campanhaId, {
        situacao_whatsapp: "REAGENDADA",
        whatsapp_agendamento:
          paraResumoWhatsapp(
            reagendado,
          ),
      });

      continue;
    }

    const maisRecente =
      [...agendamentos].sort(
        (a, b) => {
          const dataA = new Date(
            a.updatedAt || 0,
          ).getTime();

          const dataB = new Date(
            b.updatedAt || 0,
          ).getTime();

          return dataB - dataA;
        },
      )[0] || null;

    resultado.set(campanhaId, {
      situacao_whatsapp: null,
      whatsapp_agendamento:
        maisRecente
          ? paraResumoWhatsapp(
            maisRecente,
          )
          : null,
    });
  }

  return resultado;
}

async function enriquecerCampanhasComWhatsapp(
  campanhas: MarketingCampanha[],
): Promise<MarketingCampanhaComWhatsapp[]> {
  const situacoes =
    await buscarSituacoesWhatsapp(
      campanhas.map(
        (campanha) =>
          Number(campanha.id),
      ),
    );

  return campanhas.map(
    (campanha) => {
      const dadosWhatsapp =
        situacoes.get(
          Number(campanha.id),
        ) || {
          situacao_whatsapp: null,
          whatsapp_agendamento: null,
        };

      return Object.assign(
        campanha,
        dadosWhatsapp,
      ) as MarketingCampanhaComWhatsapp;
    },
  );
}

async function buscarCampanhaObrigatoria(
  id: number,
): Promise<MarketingCampanha> {
  const campanha =
    await AppDataSource.getRepository(
      MarketingCampanha,
    ).findOne({
      where: {
        id,
      },
      relations: {
        loja: true,
        banner: true,
        categoria: true,
      },
    });

  if (!campanha) {
    throw new Error(
      "Campanha de marketing não encontrada.",
    );
  }

  return campanha;
}

async function validarResponsavelEBanner(input: {
  lojaId: string | null;
  prestadorId: string | null;
  bannerId: number | null;
}): Promise<MarketPlaceModel | null> {
  if (input.lojaId) {
    const lojaExiste =
      await AppDataSource.getRepository(
        Store,
      ).exist({
        where: {
          id: input.lojaId,
        },
      });

    if (!lojaExiste) {
      throw new Error(
        "Loja responsável pela campanha não encontrada.",
      );
    }
  }

  if (input.prestadorId) {
    console.log(
      "[MarketingCampanhaService] Validando prestador da campanha.",
      {
        prestadorIdRecebido: input.prestadorId,
      },
    );

    /*
     * marketing_campanhas.prestador_id usa o ID do usuário.
     *
     * O PerfilPrestador possui o vínculo com esse usuário em usuarioId.
     * Mantemos também a busca por prestador.id como compatibilidade
     * com registros/campanhas antigas que possam ter sido gravados
     * usando o ID do próprio perfil.
     *
     * Usamos QueryBuilder de propósito para evitar depender de como
     * o TypeORM tipou/mapeou o campo usuarioId no FindOptions.
     */
    const prestador =
      await AppDataSource.getRepository(
        PerfilPrestador,
      )
        .createQueryBuilder("prestador")
        .where(
          "prestador.usuarioId = :prestadorId",
          {
            prestadorId: input.prestadorId,
          },
        )
        .orWhere(
          "prestador.id = :prestadorId",
          {
            prestadorId: input.prestadorId,
          },
        )
        .getOne();

    console.log(
      "[MarketingCampanhaService] Resultado da validação do prestador.",
      {
        prestadorIdRecebido:
          input.prestadorId,
        encontrado:
          Boolean(prestador),
        perfilId:
          prestador?.id || null,
        usuarioId:
          prestador?.usuarioId || null,
      },
    );

    if (!prestador) {
      throw new Error(
        `Prestador responsável pela campanha não encontrado. ID recebido: ${input.prestadorId}`,
      );
    }
  }

  if (!input.bannerId) {
    return null;
  }

  const banner =
    await AppDataSource.getRepository(
      MarketPlaceModel,
    ).findOne({
      where: {
        id: input.bannerId,
      },
    });

  if (!banner) {
    throw new Error(
      "Banner informado para a campanha não encontrado.",
    );
  }

  if (
    input.lojaId &&
    banner.loja_id !== input.lojaId
  ) {
    throw new Error(
      "O banner informado não pertence à loja da campanha.",
    );
  }

  return banner;
}

async function validarCategoria(
  categoriaId: number | null,
): Promise<void> {
  if (!categoriaId) {
    return;
  }

  const linhas = await AppDataSource.query(
    "SELECT id FROM categories WHERE id = ? LIMIT 1",
    [categoriaId],
  );

  if (!Array.isArray(linhas) || linhas.length === 0) {
    throw new Error(
      "Categoria informada para a campanha não encontrada.",
    );
  }
}

function podeEditar(
  campanha: MarketingCampanha,
) {
  const permitidos = [
    MarketingCampanhaStatus.RASCUNHO,
    MarketingCampanhaStatus.AGUARDANDO_PAGAMENTO,
    MarketingCampanhaStatus.AGUARDANDO_APROVACAO,
  ];

  if (!permitidos.includes(campanha.status)) {
    throw new Error(
      `Campanha no status ${campanha.status} não pode mais ser editada.`,
    );
  }
}

export const MarketingCampanhaService = {
  async criar(
    input: CriarMarketingCampanhaInput,
  ): Promise<MarketingCampanha> {
    const lojaId = textoOpcional(input.lojaId);
    const prestadorId = textoOpcional(
      input.prestadorId,
    );
    const bannerId = input.bannerId || null;
    const tipoCampanha = normalizarTipoCampanha(
      input.tipoCampanha,
    );
    const tipoDestino = normalizarTipoDestino(
      input.tipoDestino,
    );
    const categoriaId = normalizarCategoriaId(
      input.categoriaId,
    );

    validarResponsavel(
      lojaId,
      prestadorId,
      tipoCampanha,
    );

    validarDestino({
      tipoDestino,
      categoriaId,
      lojaId,
      prestadorId,
    });

    await validarCategoria(categoriaId);

    await validarResponsavelEBanner({
      lojaId,
      prestadorId,
      bannerId,
    });

    const campanhaRepo =
      AppDataSource.getRepository(
        MarketingCampanha,
      );

    const campanha = campanhaRepo.create({
      loja_id: lojaId,
      prestador_id: prestadorId,
      tipo_campanha: tipoCampanha,
      tipo_destino: tipoDestino,
      categoria_id: categoriaId,
      criado_por: textoOpcional(input.criadoPor),
      banner_id: bannerId,
      nome: textoObrigatorio(
        input.nome,
        "Nome da campanha",
      ),
      descricao: textoOpcional(input.descricao),
      template_nome: normalizarTemplateNome(
        input.templateNome,
      ),
      template_idioma: normalizarIdioma(
        input.templateIdioma,
      ),
      parametros_template:
        input.parametrosTemplate || null,
      segmentacao: input.segmentacao || null,
      data_agendamento: normalizarData(
        input.dataAgendamento,
      ),
      status:
        MarketingCampanhaStatus.RASCUNHO,
      pago:
        tipoCampanha !== MarketingCampanhaTipo.CONTRATADA,
      aprovado:
        tipoCampanha !== MarketingCampanhaTipo.CONTRATADA,
      total_destinatarios: 0,
      total_enviados: 0,
      total_falhas: 0,
      total_entregues: 0,
      total_lidos: 0,
    });

    return campanhaRepo.save(campanha);
  },

  async atualizar(
    id: number,
    input: AtualizarMarketingCampanhaInput,
  ): Promise<MarketingCampanha> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    podeEditar(campanha);

    const lojaId =
      input.lojaId === undefined
        ? campanha.loja_id || null
        : textoOpcional(input.lojaId);

    const prestadorId =
      input.prestadorId === undefined
        ? campanha.prestador_id || null
        : textoOpcional(input.prestadorId);

    const bannerId =
      input.bannerId === undefined
        ? campanha.banner_id || null
        : input.bannerId || null;

    const tipoDestino =
      input.tipoDestino === undefined
        ? campanha.tipo_destino ||
          MarketingCampanhaDestinoTipo.GRANCONECTA
        : normalizarTipoDestino(input.tipoDestino);

    const categoriaId =
      input.categoriaId === undefined
        ? campanha.categoria_id || null
        : normalizarCategoriaId(input.categoriaId);

    validarResponsavel(
      lojaId,
      prestadorId,
      campanha.tipo_campanha,
    );

    validarDestino({
      tipoDestino,
      categoriaId,
      lojaId,
      prestadorId,
    });

    await validarCategoria(categoriaId);

    const banner =
      await validarResponsavelEBanner({
        lojaId,
        prestadorId,
        bannerId,
      });

    if (input.nome !== undefined) {
      campanha.nome = textoObrigatorio(
        input.nome,
        "Nome da campanha",
      );
    }

    if (input.descricao !== undefined) {
      campanha.descricao = textoOpcional(
        input.descricao,
      );
    }

    if (input.templateNome !== undefined) {
      campanha.template_nome =
        normalizarTemplateNome(
          input.templateNome,
        );
    }

    if (input.templateIdioma !== undefined) {
      campanha.template_idioma =
        normalizarIdioma(
          input.templateIdioma,
        );
    }

    if (input.parametrosTemplate !== undefined) {
      campanha.parametros_template =
        input.parametrosTemplate;
    }

    if (input.segmentacao !== undefined) {
      campanha.segmentacao =
        input.segmentacao;
    }

    if (input.dataAgendamento !== undefined) {
      campanha.data_agendamento =
        normalizarData(
          input.dataAgendamento,
        );
    }

    campanha.loja_id = lojaId;
    campanha.prestador_id = prestadorId;
    campanha.tipo_destino = tipoDestino;
    campanha.categoria_id = categoriaId;
    campanha.banner_id = bannerId;
    campanha.banner = banner;

    const repo = AppDataSource.getRepository(
      MarketingCampanha,
    );
    await repo.save(campanha);

    return buscarCampanhaObrigatoria(id);
  },

  async solicitarContratacao(
    id: number,
  ): Promise<MarketingCampanha> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    if (
      campanha.tipo_campanha !==
      MarketingCampanhaTipo.CONTRATADA
    ) {
      throw new Error(
        "Somente campanhas contratadas passam pelo fluxo de contratação.",
      );
    }

    if (
      campanha.status !==
      MarketingCampanhaStatus.RASCUNHO
    ) {
      throw new Error(
        "Somente campanhas em rascunho podem seguir para contratação.",
      );
    }

    campanha.status =
      MarketingCampanhaStatus.AGUARDANDO_PAGAMENTO;

    return AppDataSource.getRepository(
      MarketingCampanha,
    ).save(campanha);
  },

  async marcarComoPaga(
    id: number,
  ): Promise<MarketingCampanha> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    if (
      campanha.tipo_campanha !==
      MarketingCampanhaTipo.CONTRATADA
    ) {
      throw new Error(
        "Campanha institucional ou automática não exige pagamento.",
      );
    }

    if (
      campanha.status ===
      MarketingCampanhaStatus.CANCELADA ||
      campanha.status ===
      MarketingCampanhaStatus.CONCLUIDA
    ) {
      throw new Error(
        "Não é possível registrar pagamento para esta campanha.",
      );
    }

    campanha.pago = true;
    campanha.status = campanha.aprovado
      ? MarketingCampanhaStatus.AGENDADA
      : MarketingCampanhaStatus.AGUARDANDO_APROVACAO;

    return AppDataSource.getRepository(
      MarketingCampanha,
    ).save(campanha);
  },

  async aprovar(
    id: number,
  ): Promise<MarketingCampanha> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    if (
      campanha.status ===
      MarketingCampanhaStatus.CANCELADA ||
      campanha.status ===
      MarketingCampanhaStatus.CONCLUIDA
    ) {
      throw new Error(
        "Não é possível aprovar esta campanha.",
      );
    }

    campanha.aprovado = true;
    campanha.status = campanha.pago
      ? MarketingCampanhaStatus.AGENDADA
      : MarketingCampanhaStatus.AGUARDANDO_PAGAMENTO;

    return AppDataSource.getRepository(
      MarketingCampanha,
    ).save(campanha);
  },

  async agendar(
    id: number,
    dataAgendamento?: Date | string,
  ): Promise<MarketingCampanha> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    if (!campanha.pago) {
      throw new Error(
        "Campanha ainda não possui pagamento confirmado.",
      );
    }

    if (!campanha.aprovado) {
      throw new Error(
        "Campanha ainda não foi aprovada pelo administrador.",
      );
    }

    if (dataAgendamento !== undefined) {
      campanha.data_agendamento =
        normalizarData(dataAgendamento);
    }

    if (
      new Date(campanha.data_agendamento).getTime() <=
      Date.now()
    ) {
      throw new Error(
        "A data da campanha precisa estar no futuro.",
      );
    }

    campanha.status =
      MarketingCampanhaStatus.AGENDADA;

    await AppDataSource.transaction(async (manager) => {
      await manager
        .getRepository(MarketingCampanha)
        .save(campanha);

      await manager
        .getRepository(MarketingCampanhaCanal)
        .createQueryBuilder()
        .update(MarketingCampanhaCanal)
        .set({
          status: MarketingCanalStatus.AGENDADO,
          ultimo_erro: null,
          iniciado_em: null,
          concluido_em: null,
        })
        .where("campanha_id = :campanhaId", {
          campanhaId: id,
        })
        .andWhere("status = :status", {
          status: MarketingCanalStatus.RASCUNHO,
        })
        .execute();
    });

    return buscarCampanhaObrigatoria(id);
  },

  async cancelar(
    id: number,
  ): Promise<MarketingCampanha> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    if (
      campanha.status ===
      MarketingCampanhaStatus.CONCLUIDA
    ) {
      throw new Error(
        "Campanha concluída não pode ser cancelada.",
      );
    }

    campanha.status =
      MarketingCampanhaStatus.CANCELADA;

    await AppDataSource.transaction(
      async (manager) => {
        await manager
          .getRepository(MarketingCampanha)
          .save(campanha);

        await manager
          .getRepository(MarketingAgendamento)
          .createQueryBuilder()
          .update(MarketingAgendamento)
          .set({
            status:
              MarketingStatus.CANCELADO,
          })
          .where("campanha_id = :campanhaId", {
            campanhaId: id,
          })
          .andWhere(
            "status IN (:...statusPendentes)",
            {
              statusPendentes: [
                MarketingStatus.PENDENTE,
                MarketingStatus.PROCESSANDO,
              ],
            },
          )
          .execute();

        await manager
          .getRepository(MarketingCampanhaCanal)
          .createQueryBuilder()
          .update(MarketingCampanhaCanal)
          .set({
            status: MarketingCanalStatus.CANCELADO,
            concluido_em: new Date(),
          })
          .where("campanha_id = :campanhaId", {
            campanhaId: id,
          })
          .andWhere("status IN (:...statusAbertos)", {
            statusAbertos: [
              MarketingCanalStatus.RASCUNHO,
              MarketingCanalStatus.AGENDADO,
              MarketingCanalStatus.PROCESSANDO,
            ],
          })
          .execute();

        if (campanha.banner_id) {
          await manager
            .getRepository(MarketPlaceModel)
            .update(
              { id: campanha.banner_id },
              { ativo: false },
            );
        }
      },
    );

    return campanha;
  },

  async buscarPorId(
    id: number,
  ): Promise<MarketingCampanhaComWhatsapp> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    const campanhasEnriquecidas =
      await enriquecerCampanhasComWhatsapp([
        campanha,
      ]);

    const campanhaEnriquecida =
      campanhasEnriquecidas[0];

    if (!campanhaEnriquecida) {
      throw new Error(
        "Não foi possível montar os dados operacionais da campanha.",
      );
    }

    return campanhaEnriquecida;
  },

  async listar(
    filtros: FiltrosMarketingCampanha = {},
  ) {
    const pagina = Math.max(
      1,
      Number(filtros.pagina || 1),
    );
    const limite = Math.min(
      100,
      Math.max(
        1,
        Number(filtros.limite || 20),
      ),
    );

    const query =
      AppDataSource.getRepository(
        MarketingCampanha,
      )
        .createQueryBuilder("campanha")
        .leftJoinAndSelect(
          "campanha.loja",
          "loja",
        )
        .leftJoinAndSelect(
          "campanha.banner",
          "banner",
        )
        .leftJoinAndSelect(
          "campanha.categoria",
          "categoria",
        )
        .orderBy(
          "campanha.createdAt",
          "DESC",
        )
        .skip((pagina - 1) * limite)
        .take(limite);

    if (filtros.status) {
      query.andWhere(
        "campanha.status = :status",
        {
          status: filtros.status,
        },
      );
    }

    if (filtros.lojaId) {
      query.andWhere(
        "campanha.loja_id = :lojaId",
        {
          lojaId: filtros.lojaId,
        },
      );
    }

    if (filtros.prestadorId) {
      query.andWhere(
        "campanha.prestador_id = :prestadorId",
        {
          prestadorId:
            filtros.prestadorId,
        },
      );
    }

    if (filtros.tipoDestino) {
      query.andWhere(
        "campanha.tipo_destino = :tipoDestino",
        {
          tipoDestino: normalizarTipoDestino(
            filtros.tipoDestino,
          ),
        },
      );
    }

    if (filtros.categoriaId !== undefined) {
      const categoriaId = normalizarCategoriaId(
        filtros.categoriaId,
      );

      if (categoriaId) {
        query.andWhere(
          "campanha.categoria_id = :categoriaId",
          { categoriaId },
        );
      }
    }

    const [dados, total] =
      await query.getManyAndCount();

    const dadosComWhatsapp =
      await enriquecerCampanhasComWhatsapp(
        dados,
      );

    return {
      dados: dadosComWhatsapp,
      total,
      pagina,
      limite,
      totalPaginas:
        Math.ceil(total / limite),
    };
  },

  async recalcularTotais(
    id: number,
  ): Promise<MarketingCampanha> {
    const campanha =
      await buscarCampanhaObrigatoria(id);

    const linhas =
      await AppDataSource.getRepository(
        MarketingAgendamento,
      )
        .createQueryBuilder("agendamento")
        .select(
          "agendamento.status",
          "status",
        )
        .addSelect("COUNT(*)", "total")
        .where(
          "agendamento.campanha_id = :campanhaId",
          {
            campanhaId: id,
          },
        )
        .groupBy("agendamento.status")
        .getRawMany<{
          status: MarketingStatus;
          total: string;
        }>();

    const totais = new Map<
      MarketingStatus,
      number
    >(
      linhas.map((linha) => [
        linha.status,
        Number(linha.total),
      ]),
    );

    const valor = (
      status: MarketingStatus,
    ) => totais.get(status) || 0;

    campanha.total_destinatarios =
      linhas.reduce(
        (total, linha) =>
          total + Number(linha.total),
        0,
      );
    campanha.total_enviados =
      valor(MarketingStatus.ENVIADO) +
      valor(MarketingStatus.ENTREGUE) +
      valor(MarketingStatus.LIDO);
    campanha.total_falhas = valor(
      MarketingStatus.FALHA,
    );
    campanha.total_entregues =
      valor(MarketingStatus.ENTREGUE) +
      valor(MarketingStatus.LIDO);
    campanha.total_lidos = valor(
      MarketingStatus.LIDO,
    );

    /*
     * Mantém as métricas do canal WHATSAPP sincronizadas com a fila
     * concreta vinculada por canal_id. Esse recalculo também é chamado
     * pelo webhook da Meta, então delivered/read/failed passam a refletir
     * automaticamente no registro marketing_campanha_canais.
     */
    const canalWhatsapp =
      await AppDataSource.getRepository(
        MarketingCampanhaCanal,
      ).findOne({
        where: {
          campanha_id: id,
          canal: MarketingCanal.WHATSAPP,
        },
      });

    if (canalWhatsapp) {
      const linhasWhatsapp =
        await AppDataSource.getRepository(
          MarketingAgendamento,
        )
          .createQueryBuilder(
            "agendamentoWhatsapp",
          )
          .select(
            "agendamentoWhatsapp.status",
            "status",
          )
          .addSelect(
            "COUNT(*)",
            "total",
          )
          .where(
            "agendamentoWhatsapp.campanha_id = :campanhaId",
            {
              campanhaId: id,
            },
          )
          .andWhere(
            "agendamentoWhatsapp.canal_id = :canalId",
            {
              canalId:
                canalWhatsapp.id,
            },
          )
          .groupBy(
            "agendamentoWhatsapp.status",
          )
          .getRawMany<{
            status: MarketingStatus;
            total: string;
          }>();

      const totaisWhatsapp =
        new Map<
          MarketingStatus,
          number
        >(
          linhasWhatsapp.map(
            (linha) => [
              linha.status,
              Number(linha.total),
            ],
          ),
        );

      const valorWhatsapp = (
        status: MarketingStatus,
      ) =>
        totaisWhatsapp.get(status) || 0;

      canalWhatsapp.total_destinatarios =
        linhasWhatsapp.reduce(
          (total, linha) =>
            total +
            Number(linha.total),
          0,
        );

      canalWhatsapp.total_enviados =
        valorWhatsapp(
          MarketingStatus.ENVIADO,
        ) +
        valorWhatsapp(
          MarketingStatus.ENTREGUE,
        ) +
        valorWhatsapp(
          MarketingStatus.LIDO,
        );

      canalWhatsapp.total_entregues =
        valorWhatsapp(
          MarketingStatus.ENTREGUE,
        ) +
        valorWhatsapp(
          MarketingStatus.LIDO,
        );

      canalWhatsapp.total_falhas =
        valorWhatsapp(
          MarketingStatus.FALHA,
        );

      canalWhatsapp.total_abertos =
        valorWhatsapp(
          MarketingStatus.LIDO,
        );

      const whatsappPendentes =
        valorWhatsapp(
          MarketingStatus.PENDENTE,
        );

      const whatsappProcessando =
        valorWhatsapp(
          MarketingStatus.PROCESSANDO,
        );

      if (
        canalWhatsapp.total_destinatarios >
        0 &&
        whatsappPendentes === 0 &&
        whatsappProcessando === 0
      ) {
        canalWhatsapp.status =
          MarketingCanalStatus.CONCLUIDO;
        canalWhatsapp.concluido_em =
          canalWhatsapp.concluido_em ||
          new Date();
      } else if (
        canalWhatsapp.total_destinatarios >
        0
      ) {
        canalWhatsapp.status =
          MarketingCanalStatus.PROCESSANDO;
        canalWhatsapp.iniciado_em =
          canalWhatsapp.iniciado_em ||
          new Date();
        canalWhatsapp.concluido_em =
          null;
      }

      await AppDataSource.getRepository(
        MarketingCampanhaCanal,
      ).save(canalWhatsapp);
    }

    const canaisEmAberto =
      await AppDataSource.getRepository(
        MarketingCampanhaCanal,
      ).count({
        where: {
          campanha_id: id,
          status: In([
            MarketingCanalStatus.RASCUNHO,
            MarketingCanalStatus.AGENDADO,
            MarketingCanalStatus.PROCESSANDO,
          ]),
        },
      });

    const bannerAtivo = Boolean(
      campanha.banner &&
      campanha.banner.ativo &&
      new Date(campanha.banner.data_fim).getTime() > Date.now(),
    );

    if (
      campanha.total_destinatarios > 0 &&
      valor(MarketingStatus.PENDENTE) === 0 &&
      valor(MarketingStatus.PROCESSANDO) === 0 &&
      canaisEmAberto === 0 &&
      !bannerAtivo
    ) {
      campanha.status =
        MarketingCampanhaStatus.CONCLUIDA;
    }

    return AppDataSource.getRepository(
      MarketingCampanha,
    ).save(campanha);
  },
};

export default MarketingCampanhaService;