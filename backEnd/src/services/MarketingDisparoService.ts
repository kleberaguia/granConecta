import { AppDataSource } from "../config/data-source";
import {
  MarketingAgendamento,
  MarketingStatus,
  MarketingTipo,
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
import {
  MarketingLead,
  MarketingLeadOrigem,
} from "../models/MarketingLeadModel";
import MarketingCampanhaService from "./MarketingCampanhaService";
import MarketingLeadService from "./MarketingLeadService";
import MetaWhatsAppService from "./MetaWhatsAppService";
import MarketingConsentimentoService from "./MarketingConsentimentoService";
import MarketingAntiSaturacaoService from "./MarketingAntiSaturacaoService";
import {
  MarketingContato,
  MarketingContatoResultado,
} from "../models/MarketingContato";

export type ResultadoGeracaoFila = {
  campanhaId: number;
  avaliados: number;
  adicionados: number;
  semConsentimento: number;
  duplicados: number;
  bloqueadosSaturacao: number;
};

export type ResultadoProcessamentoFila = {
  avaliados: number;
  enviados: number;
  canceladosSemConsentimento: number;
  reagendados: number;
  falhasDefinitivas: number;
};

const MAX_TENTATIVAS_PADRAO = 3;
const LIMITE_LOTE_PADRAO = 20;

function limitarLote(valor?: number): number {
  return Math.min(
    100,
    Math.max(
      1,
      Number(valor || LIMITE_LOTE_PADRAO),
    ),
  );
}

function normalizarErro(
  error: unknown,
): string {
  const mensagem =
    error instanceof Error
      ? error.message
      : "Erro desconhecido";

  return mensagem.slice(0, 4000);
}

function resolverParametros(
  campanha: MarketingCampanha,
  lead: MarketingLead | null,
): Array<string | number> {
  const configurados =
    campanha.parametros_template;

  if (!configurados) {
    return [];
  }

  if (!Array.isArray(configurados)) {
    throw new Error(
      "parametros_template precisa ser uma lista ordenada para envio pelo WhatsApp.",
    );
  }

  const variaveis: Record<string, string> = {
    nome: lead?.nome || "Cliente",
    telefone: lead?.telefone || "",
    email: lead?.email || "",
    campanha: campanha.nome,
  };

  return configurados.map((parametro) => {
    if (typeof parametro === "number") {
      return parametro;
    }

    return String(parametro).replace(
      /\{\{\s*(nome|telefone|email|campanha)\s*\}\}/gi,
      (_, chave: string) =>
        variaveis[chave.toLowerCase()] || "",
    );
  });
}

async function obterCampanha(
  campanhaId: number,
): Promise<MarketingCampanha> {
  const campanha =
    await AppDataSource.getRepository(
      MarketingCampanha,
    ).findOne({
      where: {
        id: campanhaId,
      },
    });

  if (!campanha) {
    throw new Error(
      "Campanha de marketing não encontrada.",
    );
  }

  return campanha;
}

async function obterCanalWhatsapp(
  campanhaId: number,
): Promise<MarketingCampanhaCanal> {
  const canal =
    await AppDataSource.getRepository(
      MarketingCampanhaCanal,
    ).findOne({
      where: {
        campanha_id: campanhaId,
        canal: MarketingCanal.WHATSAPP,
      },
    });

  if (!canal) {
    throw new Error(
      "Canal WHATSAPP não configurado para a campanha. Salve o canal WhatsApp antes de gerar a fila.",
    );
  }

  return canal;
}

async function recalcularTotaisCanalWhatsapp(
  campanhaId: number,
  canalId?: number | null,
): Promise<void> {
  const canal =
    canalId
      ? await AppDataSource.getRepository(
          MarketingCampanhaCanal,
        ).findOne({
          where: {
            id: canalId,
            campanha_id: campanhaId,
            canal: MarketingCanal.WHATSAPP,
          },
        })
      : await AppDataSource.getRepository(
          MarketingCampanhaCanal,
        ).findOne({
          where: {
            campanha_id: campanhaId,
            canal: MarketingCanal.WHATSAPP,
          },
        });

  if (!canal) {
    return;
  }

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
          campanhaId,
        },
      )
      .andWhere(
        "agendamento.canal_id = :canalId",
        {
          canalId: canal.id,
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

  canal.total_destinatarios =
    linhas.reduce(
      (total, linha) =>
        total + Number(linha.total),
      0,
    );

  canal.total_enviados =
    valor(MarketingStatus.ENVIADO) +
    valor(MarketingStatus.ENTREGUE) +
    valor(MarketingStatus.LIDO);

  canal.total_entregues =
    valor(MarketingStatus.ENTREGUE) +
    valor(MarketingStatus.LIDO);

  canal.total_falhas =
    valor(MarketingStatus.FALHA);

  canal.total_abertos =
    valor(MarketingStatus.LIDO);

  const pendentes =
    valor(MarketingStatus.PENDENTE);

  const processando =
    valor(MarketingStatus.PROCESSANDO);

  if (
    canal.total_destinatarios > 0 &&
    pendentes === 0 &&
    processando === 0
  ) {
    canal.status =
      MarketingCanalStatus.CONCLUIDO;
    canal.concluido_em =
      canal.concluido_em || new Date();
  } else if (
    canal.total_destinatarios > 0
  ) {
    canal.status =
      MarketingCanalStatus.PROCESSANDO;
    canal.iniciado_em =
      canal.iniciado_em || new Date();
    canal.concluido_em = null;
  }

  await AppDataSource.getRepository(
    MarketingCampanhaCanal,
  ).save(canal);
}

function resolverAnunciante(campanha: MarketingCampanha): {
  anuncianteId: string | null;
  anuncianteTipo: "LOJA" | "PRESTADOR" | "GRANCONECTA";
} {
  if (campanha.loja_id) {
    return {
      anuncianteId: String(campanha.loja_id),
      anuncianteTipo: "LOJA",
    };
  }

  if (campanha.prestador_id) {
    return {
      anuncianteId: String(campanha.prestador_id),
      anuncianteTipo: "PRESTADOR",
    };
  }

  return {
    anuncianteId: null,
    anuncianteTipo: "GRANCONECTA",
  };
}

async function verificarConsentimentoWhatsapp(
  lead: MarketingLead,
  telefone: string,
): Promise<boolean> {
  /*
   * Migração segura:
   * - se já existe consentimento por canal, ele é a fonte de verdade;
   * - se ainda não existe registro na tabela nova, preservamos o fluxo
   *   legado que já estava funcionando em produção/testes.
   */
  const situacao =
    await MarketingConsentimentoService.consultar(
      lead.id,
      MarketingCanal.WHATSAPP,
    );

  if (situacao.encontrado) {
    return situacao.permitido;
  }

  return MarketingLeadService.podeReceberMarketing({
    telefone,
    usuarioId: lead.usuario_id || null,
  });
}

async function registrarOuAtualizarContato(input: {
  leadId: string;
  campanhaId: number;
  canalId: number;
  canal: MarketingCanal;
  resultado: MarketingContatoResultado;
  anuncianteId?: string | null;
  anuncianteTipo?: "LOJA" | "PRESTADOR" | "GRANCONECTA" | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const repo = AppDataSource.getRepository(MarketingContato);

  let contato = await repo.findOne({
    where: {
      lead_id: input.leadId,
      campanha_id: input.campanhaId,
      canal_id: input.canalId,
    },
  });

  if (!contato) {
    contato = repo.create({
      lead_id: input.leadId,
      campanha_id: input.campanhaId,
      canal_id: input.canalId,
      canal: input.canal,
      resultado: input.resultado,
      contato_em: new Date(),
      anunciante_id: input.anuncianteId || null,
      anunciante_tipo: input.anuncianteTipo || null,
      metadata: input.metadata || null,
    });
  } else {
    contato.resultado = input.resultado;
    contato.contato_em = new Date();
    contato.anunciante_id = input.anuncianteId || contato.anunciante_id || null;
    contato.anunciante_tipo = input.anuncianteTipo || contato.anunciante_tipo || null;
    contato.metadata = {
      ...(contato.metadata || {}),
      ...(input.metadata || {}),
    };
  }

  await repo.save(contato);
}

function validarCampanhaParaFila(
  campanha: MarketingCampanha,
) {
  if (!campanha.pago) {
    throw new Error(
      "Campanha sem pagamento confirmado.",
    );
  }

  if (!campanha.aprovado) {
    throw new Error(
      "Campanha ainda não foi aprovada.",
    );
  }

  if (
    ![
      MarketingCampanhaStatus.AGENDADA,
      MarketingCampanhaStatus.PROCESSANDO,
    ].includes(campanha.status)
  ) {
    throw new Error(
      `Campanha no status ${campanha.status} não pode gerar fila.`,
    );
  }
}

async function reservarAgendamento(
  id: number,
): Promise<MarketingAgendamento | null> {
  console.log(
    "[MarketingDisparoService][RESERVA] A - iniciando reserva",
    { agendamentoId: id },
  );

  try {
    console.log(
      "[MarketingDisparoService][RESERVA] B - antes do UPDATE",
      { agendamentoId: id },
    );

    const resultado = await AppDataSource.getRepository(MarketingAgendamento,)
        .createQueryBuilder()
        .update(MarketingAgendamento)
        .set({
          status: MarketingStatus.PROCESSANDO,
          tentativas: () => "tentativas + 1",
          ultimo_erro: null,
        })
        .where("id = :id", {
          id,
        })
        .andWhere("status = :status", {
          status: MarketingStatus.PENDENTE,
        })
        .execute();

    console.log(
      "[MarketingDisparoService][RESERVA] C - UPDATE concluido",
      {
        agendamentoId: id,
        affected: resultado.affected,
      },
    );

    if (!resultado.affected) {
      console.warn(
        "[MarketingDisparoService][RESERVA] C.1 - registro nao reservado",
        {
          agendamentoId: id,
          motivo:
            "O registro provavelmente nao estava mais com status PENDENTE.",
        },
      );

      return null;
    }

    /*
     * IMPORTANTE:
     *
     * Nao carregamos as relations lead/campanha neste ponto.
     * O JOIN automatico do TypeORM estava comparando colunas
     * com collations diferentes no MySQL:
     *
     * utf8mb4_unicode_ci
     * x
     * utf8mb4_0900_ai_ci
     *
     * Isso fazia o UPDATE funcionar e o registro ir para PROCESSANDO,
     * mas o findOne quebrava antes de devolver o agendamento ao worker.
     *
     * A campanha ja possui fallback para ser carregada depois por
     * obterCampanha(agendamento.campanha_id), portanto essas relations
     * nao sao necessarias aqui.
     */
    console.log(
      "[MarketingDisparoService][RESERVA] D - antes do findOne SEM relations",
      {
        agendamentoId: id,
      },
    );

    const agendamento =
      await AppDataSource.getRepository(
        MarketingAgendamento,
      ).findOne({
        where: {
          id,
        },
      });

    console.log(
      "[MarketingDisparoService][RESERVA] E - findOne concluido",
      {
        agendamentoId: id,
        encontrado: Boolean(agendamento),
        status: agendamento?.status || null,
        tentativas: agendamento?.tentativas ?? null,
        leadId: agendamento?.lead_id || null,
        campanhaId: agendamento?.campanha_id || null,
      },
    );

    return agendamento;
  } catch (error) {
    console.error(
      "[MarketingDisparoService][RESERVA] ERRO",
      {
        agendamentoId: id,
        mensagem:
          error instanceof Error
            ? error.message
            : String(error),
        stack:
          error instanceof Error
            ? error.stack
            : null,
      },
    );

    throw error;
  }
}

async function cancelarSemConsentimento(
  agendamento: MarketingAgendamento,
) {
  agendamento.status =
    MarketingStatus.CANCELADO;
  agendamento.ultimo_erro =
    "Envio cancelado: consentimento de marketing ausente ou revogado.";

  await AppDataSource.getRepository(
    MarketingAgendamento,
  ).save(agendamento);
}

async function reagendarOuFalhar(
  agendamento: MarketingAgendamento,
  error: unknown,
  maxTentativas: number,
): Promise<"REAGENDADO" | "FALHA"> {
  const mensagem = normalizarErro(error);

  agendamento.ultimo_erro = mensagem;

  if (agendamento.tentativas >= maxTentativas) {
    agendamento.status =
      MarketingStatus.FALHA;
    agendamento.falhou_em = new Date();

    await AppDataSource.getRepository(
      MarketingAgendamento,
    ).save(agendamento);

    return "FALHA";
  }

  const minutos = Math.min(
    60,
    5 *
    Math.pow(
      2,
      Math.max(
        0,
        agendamento.tentativas - 1,
      ),
    ),
  );

  agendamento.status =
    MarketingStatus.PENDENTE;
  agendamento.data_execucao = new Date(
    Date.now() + minutos * 60_000,
  );

  await AppDataSource.getRepository(
    MarketingAgendamento,
  ).save(agendamento);

  return "REAGENDADO";
}

export const MarketingDisparoService = {
  async gerarFila(
    campanhaId: number,
  ): Promise<ResultadoGeracaoFila> {
    const campanha =
      await obterCampanha(campanhaId);

    validarCampanhaParaFila(campanha);

    const canalWhatsapp =
      await obterCanalWhatsapp(
        campanha.id,
      );

    if (!campanha.template_nome) {
      throw new Error(
        "Campanha sem template WhatsApp. Configure templateNome antes de gerar a fila.",
      );
    }

    const segmentacao =
      campanha.segmentacao || {};
    const condominioIds =
      segmentacao.condominioIds || [];
    const todosLeads =
      segmentacao.todosLeadsComConsentimento ===
      true;

    if (
      condominioIds.length === 0 &&
      !todosLeads
    ) {
      throw new Error(
        "Campanha sem segmentação. Informe condominioIds ou todosLeadsComConsentimento=true.",
      );
    }

    const query =
      AppDataSource.getRepository(
        MarketingLead,
      )
        .createQueryBuilder("lead")
        .where("lead.ativo = :ativo", {
          ativo: true,
        });

    if (condominioIds.length > 0) {
      query.andWhere(
        "lead.condominio_id IN (:...condominioIds)",
        {
          condominioIds,
        },
      );
    }

    const origens =
      segmentacao.origemLeads || [];

    if (origens.length > 0) {
      query.andWhere(
        "lead.origem IN (:...origens)",
        {
          origens:
            origens as MarketingLeadOrigem[],
        },
      );
    }

    const leads = await query
      .orderBy("lead.createdAt", "ASC")
      .getMany();

    const agendamentoRepo =
      AppDataSource.getRepository(
        MarketingAgendamento,
      );

    const existentes =
      await agendamentoRepo
        .createQueryBuilder("agendamento")
        .select(
          "agendamento.telefone",
          "telefone",
        )
        .where(
          "agendamento.campanha_id = :campanhaId",
          {
            campanhaId,
          },
        )
        .andWhere(
          "agendamento.canal_id = :canalId",
          {
            canalId: canalWhatsapp.id,
          },
        )
        .getRawMany<{
          telefone: string | null;
        }>();

    const telefonesExistentes = new Set(
      existentes
        .map((item) => item.telefone)
        .filter(
          (telefone): telefone is string =>
            Boolean(telefone),
        ),
    );

    const novos: MarketingAgendamento[] = [];
    let semConsentimento = 0;
    let duplicados = 0;
    let bloqueadosSaturacao = 0;

    for (const lead of leads) {
      const telefone =
        MetaWhatsAppService.normalizarTelefone(
          lead.telefone,
        );

      if (telefonesExistentes.has(telefone)) {
        duplicados += 1;
        continue;
      }

      const permitido =
        await verificarConsentimentoWhatsapp(
          lead,
          telefone,
        );

      if (!permitido) {
        semConsentimento += 1;
        continue;
      }

      const anunciante = resolverAnunciante(campanha);

      const saturacao =
        await MarketingAntiSaturacaoService.avaliar({
          leadId: lead.id,
          canal: MarketingCanal.WHATSAPP,
          anuncianteId: anunciante.anuncianteId,
        });

      if (!saturacao.permitido) {
        bloqueadosSaturacao += 1;

        console.log(
          "[MarketingDisparoService] Lead bloqueado por anti-saturação.",
          {
            campanhaId: campanha.id,
            leadId: lead.id,
            telefoneFinal: telefone.slice(-4),
            motivo: saturacao.motivo,
            proximaData: saturacao.proximaData || null,
          },
        );

        continue;
      }

      const parametros =
        resolverParametros(campanha, lead);

      novos.push(
        agendamentoRepo.create({
          campanha_id: campanha.id,
          canal_id: canalWhatsapp.id,
          usuario_id:
            lead.usuario_id || null,
          lead_id: lead.id,
          telefone,
          loja_id:
            campanha.loja_id || null,
          tipo: campanha.loja_id
            ? MarketingTipo.CAMPANHA_LOJA
            : MarketingTipo.CAMPANHA_PRESTADOR,
          template_nome:
            campanha.template_nome,
          template_parametros:
            parametros,
          status:
            MarketingStatus.PENDENTE,
          data_execucao:
            campanha.data_agendamento,
          metadata: {
            condominio_id:
              lead.condominio_id ||
              undefined,
            banner_id:
              campanha.banner_id ||
              undefined,
          },
          tentativas: 0,
        }),
      );

      telefonesExistentes.add(telefone);
    }

    if (novos.length > 0) {
      const salvos = await agendamentoRepo.save(
        novos,
        {
          chunk: 100,
        },
      );

      const anunciante = resolverAnunciante(campanha);

      for (const agendamento of salvos) {
        if (!agendamento.lead_id) {
          continue;
        }

        await registrarOuAtualizarContato({
          leadId: agendamento.lead_id,
          campanhaId: campanha.id,
          canalId: canalWhatsapp.id,
          canal: MarketingCanal.WHATSAPP,
          resultado: MarketingContatoResultado.AGENDADO,
          anuncianteId: anunciante.anuncianteId,
          anuncianteTipo: anunciante.anuncianteTipo,
          metadata: {
            agendamento_id: agendamento.id,
            origem: "GERAR_FILA",
          },
        });
      }
    }

    campanha.total_destinatarios =
      telefonesExistentes.size;

    await AppDataSource.getRepository(
      MarketingCampanha,
    ).save(campanha);

    await recalcularTotaisCanalWhatsapp(
      campanha.id,
      canalWhatsapp.id,
    );

    return {
      campanhaId,
      avaliados: leads.length,
      adicionados: novos.length,
      semConsentimento,
      duplicados,
      bloqueadosSaturacao,
    };
  },

  async processarPendentes(input: {
    campanhaId?: number;
    limite?: number;
    maxTentativas?: number;
  } = {}): Promise<ResultadoProcessamentoFila> {
    const limite = limitarLote(
      input.limite,
    );
    const maxTentativas = Math.max(
      1,
      Number(
        input.maxTentativas ||
        MAX_TENTATIVAS_PADRAO,
      ),
    );

    const resultado: ResultadoProcessamentoFila =
    {
      avaliados: 0,
      enviados: 0,
      canceladosSemConsentimento: 0,
      reagendados: 0,
      falhasDefinitivas: 0,
    };

    if (!MetaWhatsAppService.habilitado()) {
      console.warn(
        "[MarketingDisparoService] WhatsApp Meta desativado. Lote não processado.",
      );
      return resultado;
    }

    const canaisWhatsapp =
      await AppDataSource.getRepository(
        MarketingCampanhaCanal,
      )
        .createQueryBuilder("canal")
        .select("canal.id", "id")
        .where("canal.canal = :canal", {
          canal: MarketingCanal.WHATSAPP,
        })
        .getRawMany<{ id: string | number }>();

    const canalIdsWhatsapp =
      canaisWhatsapp
        .map((item) => Number(item.id))
        .filter(
          (id) =>
            Number.isInteger(id) && id > 0,
        );

    if (canalIdsWhatsapp.length === 0) {
      console.warn(
        "[MarketingDisparoService] Nenhum canal WHATSAPP configurado. Lote não processado.",
      );
      return resultado;
    }

    const query =
      AppDataSource.getRepository(
        MarketingAgendamento,
      )
        .createQueryBuilder("agendamento")
        .where(
          "agendamento.status = :status",
          {
            status: MarketingStatus.PENDENTE,
          },
        )
        .andWhere(
          "agendamento.canal_id IN (:...canalIdsWhatsapp)",
          {
            canalIdsWhatsapp,
          },
        )
        .andWhere(
          "agendamento.data_execucao <= :agora",
          {
            agora: new Date(),
          },
        )
        .orderBy(
          "agendamento.data_execucao",
          "ASC",
        )
        .addOrderBy(
          "agendamento.id",
          "ASC",
        )
        .take(limite);

    if (input.campanhaId) {
      query.andWhere(
        "agendamento.campanha_id = :campanhaId",
        {
          campanhaId: input.campanhaId,
        },
      );
    }

    const candidatos = await query.getMany();

    console.log("[MarketingDisparoService] PROCESSAR FILA - candidatos selecionados", {
      campanhaId: input.campanhaId || null,
      limite,
      maxTentativas,
      quantidade: candidatos.length,
      ids: candidatos.map((item) => item.id),
    });

    const campanhasAlteradas =
      new Set<number>();

    const canaisAlterados =
      new Map<number, number>();

    for (const candidato of candidatos) {
      console.log("[MarketingDisparoService] ETAPA 0 - candidato encontrado", {
        agendamentoId: candidato.id,
        campanhaId: candidato.campanha_id,
        status: candidato.status,
        tentativas: candidato.tentativas,
        dataExecucao: candidato.data_execucao,
      });

      const agendamento =
        await reservarAgendamento(
          candidato.id,
        );

      if (!agendamento) {
        console.warn("[MarketingDisparoService] ETAPA 0.1 - reserva recusada", {
          agendamentoId: candidato.id,
        });
        continue;
      }

      console.log("[MarketingDisparoService] ETAPA 1 - agendamento reservado", {
        agendamentoId: agendamento.id,
        campanhaId: agendamento.campanha_id,
        status: agendamento.status,
        tentativas: agendamento.tentativas,
        telefoneFinal: agendamento.telefone?.slice(-4),
      });

      resultado.avaliados += 1;

      if (agendamento.campanha_id) {
        campanhasAlteradas.add(
          agendamento.campanha_id,
        );

        if (agendamento.canal_id) {
          canaisAlterados.set(
            agendamento.campanha_id,
            agendamento.canal_id,
          );
        }
      }

      try {
        console.log("[MarketingDisparoService] ETAPA 2 - antes de carregar campanha", {
          agendamentoId: agendamento.id,
          campanhaId: agendamento.campanha_id,
          campanhaJaCarregada: Boolean(agendamento.campanha),
        });

        const campanha =
          agendamento.campanha ||
          (agendamento.campanha_id
            ? await obterCampanha(
              agendamento.campanha_id,
            )
            : null);

        console.log("[MarketingDisparoService] ETAPA 2.1 - campanha carregada", {
          agendamentoId: agendamento.id,
          campanhaId: campanha?.id || null,
          statusCampanha: campanha?.status || null,
          pago: campanha?.pago ?? null,
          aprovado: campanha?.aprovado ?? null,
          template: campanha?.template_nome || null,
          idioma: campanha?.template_idioma || null,
        });

        if (!campanha) {
          throw new Error(
            "Agendamento sem campanha vinculada.",
          );
        }

        validarCampanhaParaFila(campanha);

        if (
          campanha.status ===
          MarketingCampanhaStatus.AGENDADA
        ) {
          campanha.status =
            MarketingCampanhaStatus.PROCESSANDO;

          await AppDataSource.getRepository(
            MarketingCampanha,
          ).save(campanha);
        }

        const telefone =
          agendamento.telefone;

        if (!telefone) {
          throw new Error(
            "Agendamento sem telefone.",
          );
        }

        console.log("[MarketingDisparoService] ETAPA 3 - antes do consentimento", {
          agendamentoId: agendamento.id,
          telefoneFinal: telefone.slice(-4),
          usuarioId: agendamento.usuario_id || null,
        });

        const lead = agendamento.lead_id
          ? await AppDataSource.getRepository(
              MarketingLead,
            ).findOne({
              where: {
                id: agendamento.lead_id,
              },
            })
          : null;

        const permitido = lead
          ? await verificarConsentimentoWhatsapp(
              lead,
              telefone,
            )
          : await MarketingLeadService.podeReceberMarketing(
              {
                telefone,
                usuarioId:
                  agendamento.usuario_id || null,
              },
            );

        console.log("[MarketingDisparoService] ETAPA 3.1 - consentimento verificado", {
          agendamentoId: agendamento.id,
          permitido,
        });

        if (!permitido) {
          await cancelarSemConsentimento(
            agendamento,
          );
          resultado.canceladosSemConsentimento +=
            1;
          continue;
        }

        const nomeTemplate =
          agendamento.template_nome ||
          campanha.template_nome;

        if (!nomeTemplate) {
          throw new Error(
            "Campanha sem template WhatsApp configurado.",
          );
        }

        const parametros =
          agendamento.template_parametros ||
          [];

        console.log("[MarketingDisparoService] ETAPA 4 - antes do envio Meta", {
          agendamentoId: agendamento.id,
          campanhaId: campanha.id,
          telefoneFinal: telefone.slice(-4),
          template: nomeTemplate,
          idioma: campanha.template_idioma,
          parametros,
        });

        const inicioEnvioMeta = Date.now();

        const envio =
          await MetaWhatsAppService.enviarMarketing(
            {
              telefone,
              nomeTemplate,
              parametrosCorpo: parametros,
              idioma:
                campanha.template_idioma,
              consentimentoConfirmado: true,
            },
          );

        console.log("[MarketingDisparoService] ETAPA 5 - retorno da Meta", {
          agendamentoId: agendamento.id,
          duracaoMs: Date.now() - inicioEnvioMeta,
          enviado: envio.enviado,
          ignorado: envio.ignorado,
          messageId: envio.messageId,
          motivo: envio.motivo,
        });

        if (!envio.enviado) {
          throw new Error(
            envio.motivo ||
            "A Meta não confirmou o envio.",
          );
        }

        agendamento.status =
          MarketingStatus.ENVIADO;
        agendamento.meta_message_id =
          envio.messageId;
        agendamento.enviado_em =
          new Date();
        agendamento.ultimo_erro = null;

        console.log("[MarketingDisparoService] ETAPA 6 - salvando como ENVIADO", {
          agendamentoId: agendamento.id,
          messageId: envio.messageId,
        });

        await AppDataSource.getRepository(
          MarketingAgendamento,
        ).save(agendamento);

        if (agendamento.lead_id && agendamento.canal_id) {
          const anunciante = resolverAnunciante(campanha);

          await registrarOuAtualizarContato({
            leadId: agendamento.lead_id,
            campanhaId: campanha.id,
            canalId: agendamento.canal_id,
            canal: MarketingCanal.WHATSAPP,
            resultado: MarketingContatoResultado.ENVIADO,
            anuncianteId: anunciante.anuncianteId,
            anuncianteTipo: anunciante.anuncianteTipo,
            metadata: {
              agendamento_id: agendamento.id,
              meta_message_id: envio.messageId || null,
              origem: "PROCESSAR_FILA",
            },
          });
        }

        console.log("[MarketingDisparoService] ETAPA 7 - envio concluido", {
          agendamentoId: agendamento.id,
          campanhaId: agendamento.campanha_id,
          status: agendamento.status,
          messageId: agendamento.meta_message_id,
        });

        resultado.enviados += 1;
      } catch (error) {
        console.error("[MarketingDisparoService] ETAPA ERRO - excecao capturada", {
          agendamentoId: agendamento.id,
          campanhaId: agendamento.campanha_id,
          status: agendamento.status,
          tentativas: agendamento.tentativas,
          erro: normalizarErro(error),
        });
        const destino =
          await reagendarOuFalhar(
            agendamento,
            error,
            maxTentativas,
          );

        if (destino === "REAGENDADO") {
          resultado.reagendados += 1;
        } else {
          resultado.falhasDefinitivas += 1;
        }

        console.error(
          "[MarketingDisparoService] Falha no agendamento.",
          {
            agendamentoId:
              agendamento.id,
            campanhaId:
              agendamento.campanha_id,
            telefoneFinal:
              agendamento.telefone?.slice(
                -4,
              ),
            erro: normalizarErro(error),
          },
        );
      }
    }

    for (
      const [
        campanhaId,
        canalId,
      ] of canaisAlterados
    ) {
      await recalcularTotaisCanalWhatsapp(
        campanhaId,
        canalId,
      );
    }

    for (const campanhaId of campanhasAlteradas) {
      await MarketingCampanhaService.recalcularTotais(
        campanhaId,
      );
    }

    console.log("[MarketingDisparoService] PROCESSAR FILA - resultado final", {
      campanhaId: input.campanhaId || null,
      ...resultado,
    });

    return resultado;
  },

  async recuperarProcessamentosTravados(
    minutos = 15,
  ): Promise<number> {
    const limite = new Date(
      Date.now() -
      Math.max(1, minutos) * 60_000,
    );

    const canaisWhatsapp =
      await AppDataSource.getRepository(
        MarketingCampanhaCanal,
      )
        .createQueryBuilder("canal")
        .select("canal.id", "id")
        .where("canal.canal = :canal", {
          canal: MarketingCanal.WHATSAPP,
        })
        .getRawMany<{ id: string | number }>();

    const canalIdsWhatsapp =
      canaisWhatsapp
        .map((item) => Number(item.id))
        .filter(
          (id) =>
            Number.isInteger(id) && id > 0,
        );

    if (canalIdsWhatsapp.length === 0) {
      return 0;
    }

    const resultado =
      await AppDataSource.getRepository(
        MarketingAgendamento,
      )
        .createQueryBuilder()
        .update(MarketingAgendamento)
        .set({
          status: MarketingStatus.PENDENTE,
          ultimo_erro:
            "Processamento anterior interrompido; registro devolvido à fila.",
        })
        .where("status = :status", {
          status:
            MarketingStatus.PROCESSANDO,
        })
        .andWhere(
          "canal_id IN (:...canalIdsWhatsapp)",
          {
            canalIdsWhatsapp,
          },
        )
        .andWhere("updatedAt < :limite", {
          limite,
        })
        .execute();

    return resultado.affected || 0;
  },

  async processarCampanhasVencidas(
    limiteCampanhas = 10,
    opcoesLote: {
      limite?: number;
      maxTentativas?: number;
    } = {},
  ) {
    const campanhas =
      await AppDataSource.getRepository(
        MarketingCampanha,
      )
        .createQueryBuilder("campanha")
        .where(
          "campanha.status = :status",
          {
            status:
              MarketingCampanhaStatus.AGENDADA,
          },
        )
        .andWhere(
          "campanha.pago = :pago",
          {
            pago: true,
          },
        )
        .andWhere(
          "campanha.aprovado = :aprovado",
          {
            aprovado: true,
          },
        )
        .andWhere(
          "campanha.data_agendamento <= :agora",
          {
            agora: new Date(),
          },
        )
        .andWhere(
          "campanha.template_nome IS NOT NULL",
        )
        .orderBy(
          "campanha.data_agendamento",
          "ASC",
        )
        .take(
          Math.min(
            50,
            Math.max(
              1,
              limiteCampanhas,
            ),
          ),
        )
        .getMany();

    const resultados: Array<{
      campanhaId: number;
      fila?: ResultadoGeracaoFila;
      erro?: string;
    }> = [];

    for (const campanha of campanhas) {
      try {
        const fila =
          await this.gerarFila(
            campanha.id,
          );

        campanha.status =
          fila.adicionados > 0
            ? MarketingCampanhaStatus.PROCESSANDO
            : MarketingCampanhaStatus.CONCLUIDA;

        await AppDataSource.getRepository(
          MarketingCampanha,
        ).save(campanha);

        resultados.push({
          campanhaId: campanha.id,
          fila,
        });
      } catch (error) {
        campanha.status =
          MarketingCampanhaStatus.FALHOU;

        await AppDataSource.getRepository(
          MarketingCampanha,
        ).save(campanha);

        resultados.push({
          campanhaId: campanha.id,
          erro: normalizarErro(error),
        });
      }
    }

    const lote =
      await this.processarPendentes(
        opcoesLote,
      );

    return {
      campanhas: resultados,
      lote,
    };
  },
};

export default MarketingDisparoService;