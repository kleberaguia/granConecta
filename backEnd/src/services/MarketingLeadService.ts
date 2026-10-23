import { AppDataSource } from "../config/data-source";
import {
  MarketingLead,
  MarketingLeadOrigem,
} from "../models/MarketingLeadModel";
import { Usuario } from "../models/UserModels";
import { Condominio } from "../models/condominiosModels";
import { WhatsAppConsentimento } from "../models/WhatsAppConsentimentoModel";
import MetaWhatsAppService from "./MetaWhatsAppService";

export type CapturarMarketingLeadInput = {
  telefone: string;
  nome?: string | null;
  email?: string | null;
  usuarioId?: string | null;
  condominioId?: string | null;
  origem: MarketingLeadOrigem;
  origemReferencia?: string | null;
  aceitaMarketing?: boolean;
  aceitaUtilidade?: boolean;
  origemConsentimento?: string;
};

export type ResultadoCapturaMarketingLead = {
  lead: MarketingLead;
  consentimentoRegistrado: boolean;
  elegivelParaMarketing: boolean;
  motivo: string | null;
};

function textoOpcional(
  valor: string | null | undefined,
): string | null {
  const texto = String(valor || "").trim();
  return texto || null;
}

function validarEmail(
  email: string | null,
): string | null {
  if (!email) {
    return null;
  }

  const normalizado = email.trim().toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizado,
    )
  ) {
    throw new Error("E-mail do lead inválido.");
  }

  return normalizado;
}

export const MarketingLeadService = {
  async capturarOuAtualizar(
    input: CapturarMarketingLeadInput,
  ): Promise<ResultadoCapturaMarketingLead> {
    const telefone =
      MetaWhatsAppService.normalizarTelefone(
        input.telefone,
      );

    const nome = textoOpcional(input.nome);
    const email = validarEmail(
      textoOpcional(input.email),
    );
    const usuarioId = textoOpcional(
      input.usuarioId,
    );
    const condominioId = textoOpcional(
      input.condominioId,
    );

    if (
      !Object.values(MarketingLeadOrigem).includes(
        input.origem,
      )
    ) {
      throw new Error(
        "Origem do lead não reconhecida.",
      );
    }

    return AppDataSource.transaction(
      async (manager) => {
        const leadRepo =
          manager.getRepository(MarketingLead);
        const usuarioRepo =
          manager.getRepository(Usuario);
        const condominioRepo =
          manager.getRepository(Condominio);
        const consentimentoRepo =
          manager.getRepository(
            WhatsAppConsentimento,
          );

        if (usuarioId) {
          const usuarioExiste =
            await usuarioRepo.exist({
              where: {
                id: usuarioId,
              },
            });

          if (!usuarioExiste) {
            throw new Error(
              "Usuário informado para o lead não encontrado.",
            );
          }
        }

        if (condominioId) {
          const condominioExiste =
            await condominioRepo.exist({
              where: {
                id: condominioId,
              },
            });

          if (!condominioExiste) {
            throw new Error(
              "Condomínio informado para o lead não encontrado.",
            );
          }
        }

        let lead = await leadRepo.findOne({
          where: {
            telefone,
          },
        });

        if (!lead) {
          lead = leadRepo.create({
            telefone,
            nome,
            email,
            usuario_id: usuarioId,
            condominio_id: condominioId,
            origem: input.origem,
            origem_referencia: textoOpcional(
              input.origemReferencia,
            ),
            ativo: true,
          });
        } else {
          lead.nome = nome || lead.nome;
          lead.email = email || lead.email;
          lead.usuario_id =
            usuarioId || lead.usuario_id;
          lead.condominio_id =
            condominioId ||
            lead.condominio_id;
          lead.origem = input.origem;
          lead.origem_referencia =
            textoOpcional(
              input.origemReferencia,
            ) || lead.origem_referencia;
          lead.ativo = true;
        }

        lead = await leadRepo.save(lead);

        /*
         * O modelo atual de whatsapp_consentimentos exige usuarioId.
         * Um lead público sem usuário é capturado, mas não entra na
         * audiência até adaptarmos a tabela para consentimento por lead.
         */
        if (!usuarioId) {
          return {
            lead,
            consentimentoRegistrado: false,
            elegivelParaMarketing: false,
            motivo:
              input.aceitaMarketing === true
                ? "Lead capturado, mas o consentimento atual exige usuarioId."
                : "Lead sem consentimento de marketing registrado.",
          };
        }

        if (input.aceitaMarketing === undefined) {
          const consentimentoExistente =
            await consentimentoRepo.findOne({
              where: {
                usuarioId,
              },
            });

          const elegivel =
            consentimentoExistente?.aceita_marketing ===
              true &&
            !consentimentoExistente
              .marketing_cancelado_em;

          return {
            lead,
            consentimentoRegistrado: false,
            elegivelParaMarketing: elegivel,
            motivo: elegivel
              ? null
              : "Consentimento de marketing não confirmado.",
          };
        }

        let consentimento =
          await consentimentoRepo.findOne({
            where: {
              usuarioId,
            },
          });

        if (!consentimento) {
          consentimento =
            consentimentoRepo.create({
              usuarioId,
              telefone,
              aceita_utilidade:
                input.aceitaUtilidade ?? true,
              aceita_marketing: false,
              marketing_aceito_em: null,
              marketing_origem: null,
              marketing_cancelado_em: null,
            });
        }

        consentimento.telefone = telefone;
        consentimento.aceita_utilidade =
          input.aceitaUtilidade ??
          consentimento.aceita_utilidade;

        if (input.aceitaMarketing) {
          consentimento.aceita_marketing = true;
          consentimento.marketing_aceito_em =
            new Date();
          consentimento.marketing_origem =
            textoOpcional(
              input.origemConsentimento,
            ) ||
            input.origem;
          consentimento.marketing_cancelado_em =
            null;
        } else {
          consentimento.aceita_marketing = false;
          consentimento.marketing_cancelado_em =
            new Date();
        }

        await consentimentoRepo.save(
          consentimento,
        );

        return {
          lead,
          consentimentoRegistrado: true,
          elegivelParaMarketing:
            consentimento.aceita_marketing &&
            !consentimento.marketing_cancelado_em,
          motivo: consentimento.aceita_marketing
            ? null
            : "Marketing recusado ou cancelado pelo titular.",
        };
      },
    );
  },

  async podeReceberMarketing(input: {
    telefone: string;
    usuarioId?: string | null;
  }): Promise<boolean> {
    const telefone =
      MetaWhatsAppService.normalizarTelefone(
        input.telefone,
      );
    const usuarioId = textoOpcional(
      input.usuarioId,
    );

    const consentimentoRepo =
      AppDataSource.getRepository(
        WhatsAppConsentimento,
      );

    const query =
      consentimentoRepo
        .createQueryBuilder("consentimento")
        .where(
          "consentimento.aceita_marketing = :aceita",
          {
            aceita: true,
          },
        )
        .andWhere(
          "consentimento.marketing_cancelado_em IS NULL",
        );

    if (usuarioId) {
      query.andWhere(
        "consentimento.usuarioId = :usuarioId",
        {
          usuarioId,
        },
      );
    } else {
      query.andWhere(
        "consentimento.telefone = :telefone",
        {
          telefone,
        },
      );
    }

    return (await query.getCount()) > 0;
  },

  async cancelarMarketingPorTelefone(
    telefoneInformado: string,
  ): Promise<boolean> {
    const telefone =
      MetaWhatsAppService.normalizarTelefone(
        telefoneInformado,
      );

    const consentimentoRepo =
      AppDataSource.getRepository(
        WhatsAppConsentimento,
      );

    const consentimentos =
      await consentimentoRepo.find({
        where: {
          telefone,
        },
      });

    if (consentimentos.length === 0) {
      return false;
    }

    const agora = new Date();

    for (const consentimento of consentimentos) {
      consentimento.aceita_marketing = false;
      consentimento.marketing_cancelado_em =
        agora;
    }

    await consentimentoRepo.save(
      consentimentos,
    );

    return true;
  },

  async listarAtivosPorCondominio(
    condominioId: string,
  ): Promise<MarketingLead[]> {
    return AppDataSource.getRepository(
      MarketingLead,
    ).find({
      where: {
        condominio_id: condominioId,
        ativo: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  },
};

export default MarketingLeadService;