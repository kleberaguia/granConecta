import { Brackets, In } from "typeorm";

import { AppDataSource } from "../config/data-source";
import {
  MarketingAgendamento,
  MarketingStatus,
} from "../models/MarketingAgendamentoModels";
import {
  MarketingCampanha,
  MarketingCampanhaStatus,
} from "../models/MarketingCampanhaModel";
import {
  MarketingCampanhaCanal,
  MarketingCanal,
  MarketingCanalStatus,
} from "../models/MarketingCampanhaCanalModel";
import { MarketPlaceModel } from "../models/MarketPlaceModel";
import MarketingCanalService from "./MarketingCanalService";

const CANAIS_AUTOMATICOS = [
  MarketingCanal.NOTIFICACAO,
  MarketingCanal.BANNER,
];

const STATUS_CAMPANHA_EXECUTAVEIS = [
  MarketingCampanhaStatus.AGENDADA,
  MarketingCampanhaStatus.PROCESSANDO,
  /*
   * CONCLUIDA entra somente para recuperar inconsistências antigas em que
   * ainda exista um canal pendente. Uma campanha realmente concluída não
   * possuirá canal RASCUNHO/AGENDADO e, portanto, não será selecionada.
   */
  MarketingCampanhaStatus.CONCLUIDA,
];

const STATUS_CANAIS_ABERTOS: MarketingCanalStatus[] = [
  MarketingCanalStatus.RASCUNHO,
  MarketingCanalStatus.AGENDADO,
  MarketingCanalStatus.PROCESSANDO,
];

export type ResultadoCicloCanais = {
  canaisAvaliados: number;
  canaisExecutados: number;
  canaisIgnorados: number;
  canaisComFalha: number;
  bannersExpirados: number;
  bannersCancelados: number;
  campanhasReconciliadas: number;
};

function limiteSeguro(
  valor: number | undefined,
  padrao: number,
): number {
  const numero = Number(valor || padrao);

  if (!Number.isFinite(numero)) {
    return padrao;
  }

  return Math.min(
    200,
    Math.max(1, Math.trunc(numero)),
  );
}

function mensagemErro(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Erro desconhecido";
}

async function expirarBanners(
  agora: Date,
  limite: number,
): Promise<{
  total: number;
  campanhaIds: number[];
}> {
  const bannerRepo = AppDataSource.getRepository(
    MarketPlaceModel,
  );

  const banners = await bannerRepo
    .createQueryBuilder("banner")
    .where("banner.ativo = :ativo", {
      ativo: true,
    })
    .andWhere("banner.data_fim <= :agora", {
      agora,
    })
    .orderBy("banner.data_fim", "ASC")
    .addOrderBy("banner.id", "ASC")
    .take(limite)
    .getMany();

  if (banners.length === 0) {
    return {
      total: 0,
      campanhaIds: [],
    };
  }

  const bannerIds = banners.map((banner) => banner.id);

  await bannerRepo.update(
    { id: In(bannerIds) },
    { ativo: false },
  );

  const campanhas = await AppDataSource.getRepository(
    MarketingCampanha,
  ).find({
    where: {
      banner_id: In(bannerIds),
    },
  });

  return {
    total: banners.length,
    campanhaIds: campanhas.map((campanha) => Number(campanha.id)),
  };
}

async function desativarBannersCancelados(
  limite: number,
): Promise<{
  total: number;
  campanhaIds: number[];
}> {
  const campanhas = await AppDataSource.getRepository(
    MarketingCampanha,
  )
    .createQueryBuilder("campanha")
    .innerJoinAndSelect("campanha.banner", "banner")
    .where("campanha.status = :status", {
      status: MarketingCampanhaStatus.CANCELADA,
    })
    .andWhere("banner.ativo = :ativo", {
      ativo: true,
    })
    .orderBy("campanha.id", "ASC")
    .take(limite)
    .getMany();

  const banners = campanhas
    .map((campanha) => campanha.banner)
    .filter(
      (banner): banner is MarketPlaceModel => Boolean(banner),
    );

  if (banners.length > 0) {
    await AppDataSource.getRepository(MarketPlaceModel).update(
      {
        id: In(banners.map((banner) => banner.id)),
      },
      {
        ativo: false,
      },
    );
  }

  return {
    total: banners.length,
    campanhaIds: campanhas.map((campanha) => Number(campanha.id)),
  };
}

async function listarCanaisVencidos(
  agora: Date,
  limite: number,
): Promise<MarketingCampanhaCanal[]> {
  return AppDataSource.getRepository(MarketingCampanhaCanal)
    .createQueryBuilder("canal")
    .innerJoinAndSelect("canal.campanha", "campanha")
    .where("canal.status IN (:...statusCanais)", {
      statusCanais: [
        MarketingCanalStatus.RASCUNHO,
        MarketingCanalStatus.AGENDADO,
      ],
    })
    .andWhere("canal.canal IN (:...canais)", {
      canais: CANAIS_AUTOMATICOS,
    })
    .andWhere("campanha.status IN (:...statusCampanhas)", {
      statusCampanhas: STATUS_CAMPANHA_EXECUTAVEIS,
    })
    .andWhere("campanha.aprovado = :aprovado", {
      aprovado: true,
    })
    .andWhere("campanha.pago = :pago", {
      pago: true,
    })
    .andWhere("campanha.data_agendamento <= :agora", {
      agora,
    })
    .orderBy("campanha.data_agendamento", "ASC")
    .addOrderBy("canal.id", "ASC")
    .take(limite)
    .getMany();
}

async function reconciliarCampanha(
  campanhaId: number,
  agora: Date,
): Promise<boolean> {
  const campanhaRepo = AppDataSource.getRepository(
    MarketingCampanha,
  );

  const campanha = await campanhaRepo.findOne({
    where: {
      id: campanhaId,
    },
    relations: {
      banner: true,
      canais: true,
    },
  });

  if (!campanha) {
    return false;
  }

  if (
    campanha.status === MarketingCampanhaStatus.CANCELADA ||
    campanha.status === MarketingCampanhaStatus.FALHOU
  ) {
    return false;
  }

  const statusAnterior = campanha.status;
  const banner = campanha.banner;
  const bannerAtivo = Boolean(
    banner &&
      banner.ativo &&
      banner.pago &&
      banner.status === "aprovado" &&
      new Date(banner.data_inicio).getTime() <= agora.getTime() &&
      new Date(banner.data_fim).getTime() > agora.getTime(),
  );

  const canais = campanha.canais || [];
  const possuiCanalEmAberto = canais.some((canal) =>
    STATUS_CANAIS_ABERTOS.includes(canal.status),
  );

  const possuiCanalComFalha = canais.some(
    (canal) => canal.status === MarketingCanalStatus.FALHOU,
  );

  const agendamentosEmAberto = await AppDataSource.getRepository(
    MarketingAgendamento,
  ).count({
    where: {
      campanha_id: campanhaId,
      status: In([
        MarketingStatus.PENDENTE,
        MarketingStatus.PROCESSANDO,
      ]),
    },
  });

  if (bannerAtivo || agendamentosEmAberto > 0) {
    campanha.status = MarketingCampanhaStatus.PROCESSANDO;
  } else if (possuiCanalEmAberto) {
    campanha.status =
      new Date(campanha.data_agendamento).getTime() > agora.getTime()
        ? MarketingCampanhaStatus.AGENDADA
        : MarketingCampanhaStatus.PROCESSANDO;
  } else if (canais.length > 0 || campanha.total_destinatarios > 0) {
    campanha.status = possuiCanalComFalha
      ? MarketingCampanhaStatus.FALHOU
      : MarketingCampanhaStatus.CONCLUIDA;
  }

  if (campanha.status === statusAnterior) {
    return false;
  }

  await campanhaRepo.save(campanha);
  return true;
}

async function campanhasParaReconciliar(
  limite: number,
): Promise<number[]> {
  const campanhas = await AppDataSource.getRepository(
    MarketingCampanha,
  )
    .createQueryBuilder("campanha")
    .leftJoin("campanha.banner", "banner")
    .where(
      new Brackets((query) => {
        query
          .where("campanha.status IN (:...status)", {
            status: [
              MarketingCampanhaStatus.AGENDADA,
              MarketingCampanhaStatus.PROCESSANDO,
            ],
          })
          .orWhere("banner.ativo = :bannerAtivo", {
            bannerAtivo: true,
          });
      }),
    )
    .andWhere("campanha.status NOT IN (:...statusFinais)", {
      statusFinais: [
        MarketingCampanhaStatus.CANCELADA,
        MarketingCampanhaStatus.FALHOU,
      ],
    })
    .orderBy("campanha.updatedAt", "ASC")
    .take(limite)
    .getMany();

  return campanhas.map((campanha) => Number(campanha.id));
}

export const MarketingCicloService = {
  async reconciliarCampanha(
    campanhaId: number,
    agora = new Date(),
  ) {
    return reconciliarCampanha(campanhaId, agora);
  },

  async executar(input: {
    limiteCanais?: number;
    limiteBanners?: number;
    limiteCampanhas?: number;
  } = {}): Promise<ResultadoCicloCanais> {
    const agora = new Date();
    const limiteCanais = limiteSeguro(input.limiteCanais, 50);
    const limiteBanners = limiteSeguro(input.limiteBanners, 100);
    const limiteCampanhas = limiteSeguro(input.limiteCampanhas, 100);

    const resultado: ResultadoCicloCanais = {
      canaisAvaliados: 0,
      canaisExecutados: 0,
      canaisIgnorados: 0,
      canaisComFalha: 0,
      bannersExpirados: 0,
      bannersCancelados: 0,
      campanhasReconciliadas: 0,
    };

    const expirados = await expirarBanners(agora, limiteBanners);
    resultado.bannersExpirados = expirados.total;

    const cancelados = await desativarBannersCancelados(limiteBanners);
    resultado.bannersCancelados = cancelados.total;

    const campanhaIds = new Set<number>([
      ...expirados.campanhaIds,
      ...cancelados.campanhaIds,
    ]);

    const canais = await listarCanaisVencidos(agora, limiteCanais);

    for (const canal of canais) {
      resultado.canaisAvaliados += 1;
      campanhaIds.add(Number(canal.campanha_id));

      try {
        const execucao = await MarketingCanalService.executar(
          Number(canal.campanha_id),
          canal.canal,
        );

        if (execucao.ignorado) {
          resultado.canaisIgnorados += 1;
        } else {
          resultado.canaisExecutados += 1;
        }
      } catch (error) {
        resultado.canaisComFalha += 1;
        console.error(
          "[MarketingCicloService] Falha ao executar canal.",
          {
            campanhaId: canal.campanha_id,
            canal: canal.canal,
            erro: mensagemErro(error),
          },
        );
      }
    }

    const emAndamento = await campanhasParaReconciliar(limiteCampanhas);
    emAndamento.forEach((id) => campanhaIds.add(id));

    for (const campanhaId of campanhaIds) {
      try {
        const alterada = await reconciliarCampanha(campanhaId, agora);
        if (alterada) {
          resultado.campanhasReconciliadas += 1;
        }
      } catch (error) {
        console.error(
          "[MarketingCicloService] Falha ao reconciliar campanha.",
          {
            campanhaId,
            erro: mensagemErro(error),
          },
        );
      }
    }

    return resultado;
  },
};

export default MarketingCicloService;