import { AppDataSource } from "../config/data-source";

import {
  MarketingCredito,
  MarketingCreditoBeneficiarioTipo,
} from "../models/MarketingCredito";

export type GarantirCreditoMensalInput = {
  beneficiarioTipo:
    MarketingCreditoBeneficiarioTipo;

  beneficiarioId: string;

  competencia?: string;

  quantidadeIncluida?: number;

  expiraEm?: Date | null;
};

function competenciaAtual(
  data = new Date(),
): string {
  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  return `${ano}-${mes}`;
}

export const MarketingCreditoService = {
  competenciaAtual,

  async garantirCreditoMensal(
    input: GarantirCreditoMensalInput,
  ): Promise<MarketingCredito> {
    const repo =
      AppDataSource.getRepository(
        MarketingCredito,
      );

    const competencia =
      input.competencia ||
      competenciaAtual();

    let credito =
      await repo.findOne({
        where: {
          beneficiario_tipo:
            input.beneficiarioTipo,

          beneficiario_id:
            input.beneficiarioId,

          competencia,
        },
      });

    if (credito) {
      return credito;
    }

    credito =
      repo.create({
        beneficiario_tipo:
          input.beneficiarioTipo,

        beneficiario_id:
          input.beneficiarioId,

        competencia,

        quantidade_incluida:
          Math.max(
            0,
            Number(
              input.quantidadeIncluida ??
                1,
            ),
          ),

        quantidade_extra:
          0,

        quantidade_utilizada:
          0,

        expira_em:
          input.expiraEm ??
          null,

        ultimo_uso_em:
          null,

        metadata:
          null,
      });

    const salvo =
      await repo.save(
        credito,
      );

    console.log(
      "[MarketingCreditoService] Crédito mensal criado.",
      {
        creditoId:
          salvo.id,

        beneficiarioTipo:
          salvo.beneficiario_tipo,

        beneficiarioId:
          salvo.beneficiario_id,

        competencia:
          salvo.competencia,

        quantidadeIncluida:
          salvo.quantidade_incluida,
      },
    );

    return salvo;
  },

  async saldo(
    beneficiarioTipo:
      MarketingCreditoBeneficiarioTipo,

    beneficiarioId:
      string,

    competencia?:
      string,
  ): Promise<{
    credito: MarketingCredito;
    disponiveis: number;
  }> {
    const credito =
      await this.garantirCreditoMensal({
        beneficiarioTipo,
        beneficiarioId,
        competencia,
      });

    const total =
      Number(
        credito.quantidade_incluida ??
          0,
      ) +
      Number(
        credito.quantidade_extra ??
          0,
      );

    const utilizados =
      Number(
        credito.quantidade_utilizada ??
          0,
      );

    const disponiveis =
      Math.max(
        0,
        total -
          utilizados,
      );

    return {
      credito,
      disponiveis,
    };
  },

  async consumir(
    beneficiarioTipo:
      MarketingCreditoBeneficiarioTipo,

    beneficiarioId:
      string,

    competencia?:
      string,
  ): Promise<MarketingCredito> {
    const {
      credito,
      disponiveis,
    } =
      await this.saldo(
        beneficiarioTipo,
        beneficiarioId,
        competencia,
      );

    if (
      disponiveis <= 0
    ) {
      throw new Error(
        "Beneficiário sem crédito de campanha disponível nesta competência.",
      );
    }

    credito.quantidade_utilizada =
      Number(
        credito.quantidade_utilizada ??
          0,
      ) + 1;

    credito.ultimo_uso_em =
      new Date();

    const salvo =
      await AppDataSource.getRepository(
        MarketingCredito,
      ).save(
        credito,
      );

    console.log(
      "[MarketingCreditoService] Crédito consumido.",
      {
        creditoId:
          salvo.id,

        beneficiarioTipo:
          salvo.beneficiario_tipo,

        beneficiarioId:
          salvo.beneficiario_id,

        competencia:
          salvo.competencia,

        utilizados:
          salvo.quantidade_utilizada,
      },
    );

    return salvo;
  },

  async adicionarExtra(
    beneficiarioTipo:
      MarketingCreditoBeneficiarioTipo,

    beneficiarioId:
      string,

    quantidade:
      number,

    competencia?:
      string,
  ): Promise<MarketingCredito> {
    const quantidadeNormalizada =
      Math.max(
        0,
        Number(
          quantidade || 0,
        ),
      );

    if (
      quantidadeNormalizada <=
      0
    ) {
      throw new Error(
        "A quantidade de créditos extras deve ser maior que zero.",
      );
    }

    const credito =
      await this.garantirCreditoMensal({
        beneficiarioTipo,
        beneficiarioId,
        competencia,
      });

    credito.quantidade_extra =
      Number(
        credito.quantidade_extra ??
          0,
      ) +
      quantidadeNormalizada;

    const salvo =
      await AppDataSource.getRepository(
        MarketingCredito,
      ).save(
        credito,
      );

    console.log(
      "[MarketingCreditoService] Crédito extra adicionado.",
      {
        creditoId:
          salvo.id,

        beneficiarioTipo:
          salvo.beneficiario_tipo,

        beneficiarioId:
          salvo.beneficiario_id,

        competencia:
          salvo.competencia,

        quantidadeExtra:
          salvo.quantidade_extra,
      },
    );

    return salvo;
  },
};

export default MarketingCreditoService;