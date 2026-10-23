import { AppDataSource } from "../config/data-source";
import { MarketingCanal } from "../models/MarketingCampanhaCanalModel";
import { MarketingContato } from "../models/MarketingContato";
import { MarketingPolitica } from "../models/MarketingPoliticaModel";

export type AvaliarSaturacaoInput = {
  leadId: string;
  canal: MarketingCanal;
  anuncianteId?: string | null;
};

export type ResultadoSaturacao = {
  permitido: boolean;
  motivo: string | null;
  proximaData?: Date | null;
};

type PoliticaEfetiva = {
  intervaloMinimoHoras: number;
  maximo7Dias: number;
  maximo30Dias: number;
  intervaloMesmoAnuncianteDias: number;
};

const POLITICA_PADRAO: PoliticaEfetiva = {
  intervaloMinimoHoras: 72,
  maximo7Dias: 2,
  maximo30Dias: 6,
  intervaloMesmoAnuncianteDias: 14,
};

function subtrairHoras(
  data: Date,
  horas: number,
): Date {
  return new Date(
    data.getTime() - horas * 60 * 60 * 1000,
  );
}

function subtrairDias(
  data: Date,
  dias: number,
): Date {
  return new Date(
    data.getTime() -
    dias * 24 * 60 * 60 * 1000,
  );
}

async function carregarPolitica(
  canal: MarketingCanal,
): Promise<PoliticaEfetiva> {
  const repo =
    AppDataSource.getRepository(
      MarketingPolitica,
    );

  /*
   * O campo escopo do Model aceita:
   * MarketingCanal | "GLOBAL"
   *
   * Não devemos converter canal para String,
   * porque isso perde o tipo do enum e causa:
   *
   * Type 'string' is not assignable to type
   * 'MarketingCanal | "GLOBAL"'
   */
  const escopoCanal: MarketingCanal =
    canal;

  const especifica =
    await repo.findOne({
      where: {
        escopo: escopoCanal,
        ativo: true,
      },
    });

  const global =
    await repo.findOne({
      where: {
        escopo: "GLOBAL",
        ativo: true,
      },
    });

  const base =
    especifica || global;

  if (!base) {
    return POLITICA_PADRAO;
  }

  return {
    intervaloMinimoHoras: Number(
      base.intervalo_minimo_horas ??
      POLITICA_PADRAO.intervaloMinimoHoras,
    ),

    maximo7Dias: Number(
      base.maximo_7_dias ??
      POLITICA_PADRAO.maximo7Dias,
    ),

    maximo30Dias: Number(
      base.maximo_30_dias ??
      POLITICA_PADRAO.maximo30Dias,
    ),

    intervaloMesmoAnuncianteDias:
      Number(
        base.intervalo_mesmo_anunciante_dias ??
        POLITICA_PADRAO
          .intervaloMesmoAnuncianteDias,
      ),
  };
}

export const MarketingAntiSaturacaoService = {
  async avaliar(
    input: AvaliarSaturacaoInput,
  ): Promise<ResultadoSaturacao> {
    const politica =
      await carregarPolitica(input.canal);

    const agora = new Date();

    const repo =
      AppDataSource.getRepository(
        MarketingContato,
      );

    const ultimo = await repo
      .createQueryBuilder("contato")
      .where(
        "contato.lead_id = :leadId",
        { leadId: input.leadId },
      )
      .andWhere(
        "contato.canal = :canal",
        { canal: input.canal },
      )
      .andWhere(
        "contato.resultado IN (:...resultados)",
        {
          resultados: [
            "AGENDADO",
            "ENVIADO",
            "ENTREGUE",
            "LIDO",
            "CLICOU",
            "RESPONDEU",
            "CONVERTEU",
          ],
        },
      )
      .orderBy(
        "contato.contato_em",
        "DESC",
      )
      .getOne();

    if (ultimo?.contato_em) {
      const minimo = new Date(
        ultimo.contato_em.getTime() +
        politica.intervaloMinimoHoras *
        60 *
        60 *
        1000,
      );

      if (minimo.getTime() > agora.getTime()) {
        return {
          permitido: false,
          motivo:
            "Intervalo mínimo entre contatos de marketing ainda não foi atingido.",
          proximaData: minimo,
        };
      }
    }

    const total7 = await repo
      .createQueryBuilder("contato")
      .where(
        "contato.lead_id = :leadId",
        { leadId: input.leadId },
      )
      .andWhere(
        "contato.contato_em >= :inicio",
        {
          inicio: subtrairDias(
            agora,
            7,
          ),
        },
      )
      .andWhere(
        "contato.resultado IN (:...resultados)",
        {
          resultados: [
            "AGENDADO",
            "ENVIADO",
            "ENTREGUE",
            "LIDO",
            "CLICOU",
            "RESPONDEU",
            "CONVERTEU",
          ],
        },
      )
      .getCount();

    if (
      total7 >= politica.maximo7Dias
    ) {
      return {
        permitido: false,
        motivo:
          "Limite de campanhas nos últimos 7 dias atingido.",
      };
    }

    const total30 = await repo
      .createQueryBuilder("contato")
      .where(
        "contato.lead_id = :leadId",
        { leadId: input.leadId },
      )
      .andWhere(
        "contato.contato_em >= :inicio",
        {
          inicio: subtrairDias(
            agora,
            30,
          ),
        },
      )
      .andWhere(
        "contato.resultado IN (:...resultados)",
        {
          resultados: [
            "AGENDADO",
            "ENVIADO",
            "ENTREGUE",
            "LIDO",
            "CLICOU",
            "RESPONDEU",
            "CONVERTEU",
          ],
        },
      )
      .getCount();

    if (
      total30 >= politica.maximo30Dias
    ) {
      return {
        permitido: false,
        motivo:
          "Limite de campanhas nos últimos 30 dias atingido.",
      };
    }

    if (input.anuncianteId) {
      const desdeMesmoAnunciante =
        subtrairDias(
          agora,
          politica.intervaloMesmoAnuncianteDias,
        );

      const repeticao = await repo
        .createQueryBuilder("contato")
        .where(
          "contato.lead_id = :leadId",
          { leadId: input.leadId },
        )
        .andWhere(
          "contato.anunciante_id = :anuncianteId",
          {
            anuncianteId:
              input.anuncianteId,
          },
        )
        .andWhere(
          "contato.contato_em >= :inicio",
          {
            inicio:
              desdeMesmoAnunciante,
          },
        )
        .andWhere(
          "contato.resultado IN (:...resultados)",
          {
            resultados: [
              "AGENDADO",
              "ENVIADO",
              "ENTREGUE",
              "LIDO",
              "CLICOU",
              "RESPONDEU",
              "CONVERTEU",
            ],
          },
        )
        .getCount();

      if (repeticao > 0) {
        return {
          permitido: false,
          motivo:
            "Contato recente do mesmo anunciante.",
        };
      }
    }

    return {
      permitido: true,
      motivo: null,
    };
  },
};

export default MarketingAntiSaturacaoService;
