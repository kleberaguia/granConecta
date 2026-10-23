import { AppDataSource } from "../config/data-source";

import {
  MarketingCanal,
} from "../models/MarketingCampanhaCanalModel";

import {
  MarketingConsentimento,
  MarketingConsentimentoFonte,
} from "../models/MarketingConsentimento";

export type RegistrarConsentimentoInput = {
  leadId: string;
  canal: MarketingCanal;
  permitido: boolean;
  fonte: MarketingConsentimentoFonte;
  referencia?: string | null;
  ipOrigem?: string | null;
  userAgent?: string | null;
};

export const MarketingConsentimentoService = {
  /**
   * Registra ou atualiza o consentimento
   * de um lead para um canal específico.
   *
   * Exemplo:
   * lead X + WHATSAPP = permitido
   * lead X + EMAIL = não permitido
   */
  async registrar(
    input: RegistrarConsentimentoInput,
  ): Promise<MarketingConsentimento> {
    const repo =
      AppDataSource.getRepository(
        MarketingConsentimento,
      );

    let registro =
      await repo.findOne({
        where: {
          lead_id: input.leadId,
          canal: input.canal,
        },
      });

    const agora = new Date();

    /*
     * ==========================================================
     * NOVO CONSENTIMENTO
     * ==========================================================
     */
    if (!registro) {
      registro = repo.create({
        lead_id: input.leadId,

        canal:
          input.canal,

        permitido:
          input.permitido,

        fonte:
          input.fonte,

        referencia:
          input.referencia || null,

        consentido_em:
          input.permitido
            ? agora
            : null,

        revogado_em:
          input.permitido
            ? null
            : agora,

        ip_origem:
          input.ipOrigem || null,

        user_agent:
          input.userAgent || null,
      });

      const salvo =
        await repo.save(registro);

      console.log(
        "[MarketingConsentimentoService] Consentimento criado.",
        {
          consentimentoId:
            salvo.id,

          leadId:
            salvo.lead_id,

          canal:
            salvo.canal,

          permitido:
            salvo.permitido,

          fonte:
            salvo.fonte,
        },
      );

      return salvo;
    }

    /*
     * ==========================================================
     * CONSENTIMENTO EXISTENTE
     * ==========================================================
     */

    registro.permitido =
      input.permitido;

    registro.fonte =
      input.fonte;

    if (input.referencia) {
      registro.referencia =
        input.referencia;
    }

    if (input.ipOrigem) {
      registro.ip_origem =
        input.ipOrigem;
    }

    if (input.userAgent) {
      registro.user_agent =
        input.userAgent;
    }

    /*
     * Se o usuário voltou a permitir,
     * removemos a revogação anterior.
     */
    if (input.permitido) {
      registro.consentido_em =
        registro.consentido_em ||
        agora;

      registro.revogado_em =
        null;
    } else {
      /*
       * Se deixou de permitir,
       * registramos a data do opt-out.
       */
      registro.revogado_em =
        agora;
    }

    const salvo =
      await repo.save(registro);

    console.log(
      "[MarketingConsentimentoService] Consentimento atualizado.",
      {
        consentimentoId:
          salvo.id,

        leadId:
          salvo.lead_id,

        canal:
          salvo.canal,

        permitido:
          salvo.permitido,

        fonte:
          salvo.fonte,

        revogadoEm:
          salvo.revogado_em || null,
      },
    );

    return salvo;
  },

  /**
   * Consulta o consentimento sem confundir
   * "registro inexistente" com "consentimento revogado".
   *
   * Isso permite migrar o fluxo legado com segurança:
   * se existe registro por canal, ele é a fonte de verdade;
   * se ainda não existe, o disparo pode usar temporariamente
   * a regra legada de consentimento.
   */
  async consultar(
    leadId: string,
    canal: MarketingCanal,
  ): Promise<{
    encontrado: boolean;
    permitido: boolean;
    consentimento: MarketingConsentimento | null;
  }> {
    const registro =
      await AppDataSource.getRepository(
        MarketingConsentimento,
      ).findOne({
        where: {
          lead_id: leadId,
          canal,
        },
      });

    if (!registro) {
      return {
        encontrado: false,
        permitido: false,
        consentimento: null,
      };
    }

    return {
      encontrado: true,
      permitido: Boolean(
        registro.permitido &&
        !registro.revogado_em,
      ),
      consentimento: registro,
    };
  },

  /**
   * Verifica se o lead pode receber
   * marketing pelo canal informado.
   */
  async permitido(
    leadId: string,
    canal: MarketingCanal,
  ): Promise<boolean> {
    const registro =
      await AppDataSource.getRepository(
        MarketingConsentimento,
      ).findOne({
        where: {
          lead_id: leadId,
          canal,
        },
      });

    if (!registro) {
      return false;
    }

    return Boolean(
      registro.permitido &&
      !registro.revogado_em,
    );
  },

  /**
   * Atalho para revogar um consentimento.
   *
   * Será útil futuramente para mensagens como:
   * "não quero mais receber"
   * "parar"
   * "sair"
   */
  async revogar(
    leadId: string,
    canal: MarketingCanal,
    fonte:
      MarketingConsentimentoFonte,
  ): Promise<MarketingConsentimento> {
    const repo =
      AppDataSource.getRepository(
        MarketingConsentimento,
      );

    const registro =
      await repo.findOne({
        where: {
          lead_id: leadId,
          canal,
        },
      });

    if (!registro) {
      throw new Error(
        "Consentimento não encontrado para este lead e canal.",
      );
    }

    registro.permitido =
      false;

    registro.fonte =
      fonte;

    registro.revogado_em =
      new Date();

    const salvo =
      await repo.save(registro);

    console.log(
      "[MarketingConsentimentoService] Consentimento revogado.",
      {
        consentimentoId:
          salvo.id,

        leadId:
          salvo.lead_id,

        canal:
          salvo.canal,

        fonte:
          salvo.fonte,
      },
    );

    return salvo;
  },
};

export default MarketingConsentimentoService;