import { AppDataSource } from "../config/data-source";

import {
  MarketingLead,
  MarketingLeadOrigem,
  MarketingPublicoTipo,
} from "../models/MarketingLeadModel";

export type CapturarAudienciaInput = {
  usuarioId?: string | null;
  condominioId?: string | null;
  nome?: string | null;
  telefone: string;
  email?: string | null;
  origem: MarketingLeadOrigem;
  origemReferencia?: string | null;
  tipoPublico?: MarketingPublicoTipo;
};

/**
 * Converte qualquer valor recebido em texto limpo.
 */
function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

/**
 * Mantém somente números no telefone.
 *
 * Exemplo:
 * +55 (11) 99999-9999
 * vira:
 * 5511999999999
 */
function normalizarTelefone(valor: unknown): string {
  const numero = texto(valor).replace(/\D/g, "");

  if (numero.length < 10 || numero.length > 15) {
    throw new Error(
      "Telefone inválido para audiência de marketing.",
    );
  }

  return numero;
}

/**
 * Normaliza o tipo de público utilizando o enum
 * definido no próprio MarketingLeadModel.
 *
 * Dessa forma evitamos criar dois tipos diferentes
 * representando MORADOR / VISITANTE / DESCONHECIDO.
 */
function normalizarTipoPublico(
  valor: unknown,
): MarketingPublicoTipo {
  const tipo = texto(valor || "DESCONHECIDO")
    .toUpperCase();

  switch (tipo) {
    case "MORADOR":
      return MarketingPublicoTipo.MORADOR;

    case "VISITANTE":
      return MarketingPublicoTipo.VISITANTE;

    case "DESCONHECIDO":
    default:
      return MarketingPublicoTipo.DESCONHECIDO;
  }
}

export const MarketingAudienciaService = {
  /**
   * Cria um novo lead de marketing ou atualiza
   * um lead já existente pelo telefone.
   *
   * O telefone funciona neste momento como
   * identificador principal da audiência.
   */
  async capturarOuAtualizar(
    input: CapturarAudienciaInput,
  ): Promise<MarketingLead> {
    const repo =
      AppDataSource.getRepository(MarketingLead);

    const telefone =
      normalizarTelefone(input.telefone);

    let lead = await repo.findOne({
      where: {
        telefone,
      },
    });

    const agora = new Date();

    /*
     * ==========================================================
     * NOVO LEAD
     * ==========================================================
     */
    if (!lead) {
      lead = repo.create({
        usuario_id:
          input.usuarioId || null,

        condominio_id:
          input.condominioId || null,

        nome:
          texto(input.nome) || null,

        telefone,

        email:
          texto(input.email) || null,

        origem:
          input.origem,

        origem_referencia:
          texto(input.origemReferencia) || null,

        ativo: true,

        tipo_publico:
          normalizarTipoPublico(
            input.tipoPublico,
          ),

        ultima_interacao_em:
          agora,
      });

      const salvo =
        await repo.save(lead);

      console.log(
        "[MarketingAudienciaService] Novo lead criado.",
        {
          leadId: salvo.id,
          tipoPublico:
            salvo.tipo_publico,
          origem:
            salvo.origem,
          telefoneFinal:
            salvo.telefone?.slice(-4),
        },
      );

      return salvo;
    }

    /*
     * ==========================================================
     * LEAD EXISTENTE
     * ==========================================================
     */

    /*
     * Não apagamos informações existentes caso
     * o novo evento não possua o dado.
     */
    if (input.usuarioId) {
      lead.usuario_id =
        input.usuarioId;
    }

    if (input.condominioId) {
      lead.condominio_id =
        input.condominioId;
    }

    const nome =
      texto(input.nome);

    if (nome) {
      lead.nome = nome;
    }

    const email =
      texto(input.email);

    if (email) {
      lead.email = email;
    }

    /*
     * A origem mais recente pode ser útil para
     * sabermos por onde o contato voltou ao GranConecta.
     */
    lead.origem =
      input.origem;

    const origemReferencia =
      texto(input.origemReferencia);

    if (origemReferencia) {
      lead.origem_referencia =
        origemReferencia;
    }

    /*
     * Caso um lead anteriormente desclassificado
     * passe a ser identificado como morador ou
     * visitante, fazemos a classificação.
     *
     * Não trocamos MORADOR por VISITANTE
     * automaticamente para evitar classificação
     * incorreta.
     */
    if (
      lead.tipo_publico ===
        MarketingPublicoTipo.DESCONHECIDO &&
      input.tipoPublico
    ) {
      lead.tipo_publico =
        normalizarTipoPublico(
          input.tipoPublico,
        );
    }

    lead.ativo = true;

    lead.ultima_interacao_em =
      agora;

    const salvo =
      await repo.save(lead);

    console.log(
      "[MarketingAudienciaService] Lead atualizado.",
      {
        leadId:
          salvo.id,

        tipoPublico:
          salvo.tipo_publico,

        origem:
          salvo.origem,

        telefoneFinal:
          salvo.telefone?.slice(-4),
      },
    );

    return salvo;
  },

  /**
   * Atualiza somente a última interação.
   *
   * Pode ser chamado futuramente quando houver:
   * - clique;
   * - resposta WhatsApp;
   * - visita;
   * - chat;
   * - interação Instagram;
   * - conversão etc.
   */
  async marcarInteracao(
    leadId: string,
  ): Promise<void> {
    const repo =
      AppDataSource.getRepository(
        MarketingLead,
      );

    await repo
      .createQueryBuilder()
      .update(MarketingLead)
      .set({
        ultima_interacao_em:
          new Date(),
      })
      .where(
        "id = :id",
        {
          id: leadId,
        },
      )
      .execute();

    console.log(
      "[MarketingAudienciaService] Interação atualizada.",
      {
        leadId,
      },
    );
  },
};

export default MarketingAudienciaService;