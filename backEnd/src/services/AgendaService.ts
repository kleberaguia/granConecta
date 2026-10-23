// src/services/AgendaService.ts

import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Agenda, StatusAgenda } from "../models/AgendaModels";
import { Pagamento } from "../models/PagamentoModel";
import { ServicoOferta } from "../models/servicoOfertaModels";
import { Usuario } from "../models/UserModels";
import { NotificationService } from "./NotificationService";
import axios from "axios";
import PagamentoService from "./PagamentoService";
import AgendaDisponibilidadeService from "./AgendaDisponibilidadeService";

const agendaRepo = AppDataSource.getRepository(Agenda);
const ofertaRepo = AppDataSource.getRepository(ServicoOferta);
const pagamentoRepo = AppDataSource.getRepository(Pagamento);
const usuarioRepo = AppDataSource.getRepository(Usuario);

const STATUS_AGENDA_ATIVOS: StatusAgenda[] = [
  StatusAgenda.SUGERIDO,
  StatusAgenda.CONFIRMADO,
  StatusAgenda.AGENDADO,
  StatusAgenda.LIBERADO_CLIENTE,
  StatusAgenda.FILA_ASSINATURA,
  StatusAgenda.CONCLUIDO,
];

function formatarDataBR(data: string): string {
  try {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

export const AgendaService = {
  /**
   * ============================================================
   * PRESTADOR PROPÕE UMA DATA/HORÁRIO
   * ============================================================
   *
   * IMPORTANTE:
   * A sessão NÃO nasce mais como AGENDADO.
   *
   * Ela nasce como SUGERIDO e precisa ser aceita pelo morador.
   */
  // async agendarSessao(ofertaId: string,descricao: string, data: string,hora: string,usuarioLogadoId?: string, duracaoMinutos?: number) {
  //   const oferta = await ofertaRepo.findOne({
  //     where: { id: ofertaId },
  //     relations: [
  //       "solicitacao",
  //       "solicitacao.morador",
  //     ],
  //   });

  //   if (!oferta) {
  //     throw new Error("CONTRATO_NAO_ENCONTRADO");
  //   }

  //   /**
  //    * Se a chamada veio do controller autenticado,
  //    * garante que somente o prestador dono da oferta
  //    * possa sugerir uma sessão.
  //    *
  //    * O parâmetro é opcional para preservar chamadas internas
  //    * antigas do sistema.
  //    */
  //   if (
  //     usuarioLogadoId &&
  //     String(oferta.prestadorId) !== String(usuarioLogadoId)
  //   ) {
  //     throw new Error(
  //       "SEM_PERMISSAO_APENAS_PRESTADOR_DO_CONTRATO_PODE_AGENDAR"
  //     );
  //   }

  //   const statusUpper = String(
  //     oferta.status || ""
  //   ).toUpperCase();

  //   const estaLiberado =
  //     oferta.agenda_liberada ||
  //     ["EM_ANDAMENTO", "PAGO", "ACEITA"].includes(
  //       statusUpper
  //     );

  //   if (!estaLiberado) {
  //     throw new Error(
  //       "AGENDAMENTO_BLOQUEADO_AGUARDANDO_START"
  //     );
  //   }

  //   const dataNormalizada =
  //     AgendaDisponibilidadeService.normalizarData(data);

  //   const horaNormalizada =
  //     AgendaDisponibilidadeService.normalizarHora(hora);

  //   /**
  //    * Idempotência.
  //    *
  //    * Não reaproveitamos uma agenda CANCELADA,
  //    * pois aquele horário pode ter sido recusado anteriormente.
  //    */
  //   const sessaoExistente =
  //     await agendaRepo.findOne({
  //       where: {
  //         ofertaId,
  //         data: dataNormalizada,
  //         hora: horaNormalizada,
  //         status: In(STATUS_AGENDA_ATIVOS),
  //       } as any,
  //     });

  //   if (sessaoExistente) {
  //     console.log(
  //       `[Agenda Backend] Sessão ativa já existente para oferta ${ofertaId} em ${dataNormalizada} às ${horaNormalizada}. Reutilizando ${sessaoExistente.id}.`
  //     );

  //     return sessaoExistente;
  //   }

  //   /**
  //    * CANCELADO não conta como sessão utilizada.
  //    */
  //   const sessoesCriadas =
  //     await agendaRepo.count({
  //       where: {
  //         ofertaId,
  //         status: In(STATUS_AGENDA_ATIVOS),
  //       } as any,
  //     });

  //   const limiteSessoes = Math.max(
  //     1,
  //     Number(oferta.total_sessoes || 1)
  //   );

  //   console.log(
  //     `[Agenda Backend] Sessões ativas: ${sessoesCriadas} | Limite do Pacote: ${limiteSessoes}`
  //   );

  //   if (sessoesCriadas >= limiteSessoes) {
  //     throw new Error(
  //       "LIMITE_DE_SESSOES_DO_PACOTE_ATINGIDO"
  //     );
  //   }

  //   const valorTotalContrato =
  //     Number(oferta.valor || 0);

  //   const valorProporcionalSessao =
  //     valorTotalContrato / limiteSessoes;

  //   const moradorId =
  //     oferta.usuarioId ||
  //     oferta.solicitacao?.usuarioId;

  //   if (!moradorId) {
  //     throw new Error(
  //       "DADO_DO_MORADOR_NAO_LOCALIZADO"
  //     );
  //   }

  //   const novaSessao = agendaRepo.create();

  //   novaSessao.ofertaId = oferta.id;

  //   novaSessao.prestador = {
  //     id: oferta.prestadorId,
  //   } as any;

  //   novaSessao.morador = {
  //     id: moradorId,
  //   } as any;

  //   novaSessao.descricao =
  //     descricao ||
  //     `Sessão ${(sessoesCriadas + 1)
  //       .toString()
  //       .padStart(2, "0")}`;

  //   novaSessao.data = dataNormalizada;
  //   novaSessao.hora = horaNormalizada;

  //   novaSessao.duracaoMinutos = Math.max(
  //     1,
  //     Number(duracaoMinutos || 60)
  //   );

  //   /**
  //    * NOVA REGRA:
  //    *
  //    * Prestador apenas PROPÕE.
  //    * O morador ainda precisa concordar.
  //    */
  //   novaSessao.status =
  //     StatusAgenda.SUGERIDO;

  //   novaSessao.valor_parcela =
  //     Number(
  //       valorProporcionalSessao.toFixed(2)
  //     );

  //   const saved =
  //     await agendaRepo.save(novaSessao);

  //   await NotificationService.enviar(
  //     moradorId,
  //     "Novo horário proposto!",
  //     `O profissional sugeriu "${novaSessao.descricao}" para ${formatarDataBR(
  //       dataNormalizada
  //     )} às ${horaNormalizada}. Confirme ou proponha outro horário.`
  //   );

  //   /**
  //    * O prestador também precisa saber imediatamente que existe
  //    * uma nova contratação/sessão vinculada à agenda dele.
  //    *
  //    * Aqui usamos somente a notificação interna para não acoplar
  //    * a criação da agenda ao WhatsApp/e-mail. O aviso de confirmação
  //    * do horário continua sendo enviado separadamente quando o
  //    * morador aceitar a proposta.
  //    */
  //   const prestadorId = String(oferta.prestadorId || "").trim();

  //   if (prestadorId) {
  //     const clienteNome =
  //       oferta.solicitacao?.morador?.name ||
  //       "Cliente";

  //     await NotificationService.enviarSomenteInterna(
  //       prestadorId,
  //       "Novo serviço contratado",
  //       `${clienteNome} solicitou "${novaSessao.descricao}" para ${formatarDataBR(
  //         dataNormalizada
  //       )} às ${horaNormalizada}. O horário está aguardando confirmação do cliente.`
  //     );
  //   }

  //   return saved;
  // },
  async agendarSessao(
    ofertaId: string,
    descricao: string,
    data: string,
    hora: string,
    usuarioLogadoId?: string,
    duracaoMinutos?: number
  ) {
    /**
     * Carregamento inicial.
     *
     * Ainda NÃO tomamos nenhuma decisão de concorrência aqui.
     * As verificações críticas serão repetidas dentro da transação.
     */
    const ofertaInicial = await ofertaRepo.findOne({
      where: { id: ofertaId },
      relations: [
        "solicitacao",
        "solicitacao.morador",
      ],
    });

    if (!ofertaInicial) {
      throw new Error("CONTRATO_NAO_ENCONTRADO");
    }

    if (
      usuarioLogadoId &&
      String(ofertaInicial.prestadorId) !==
      String(usuarioLogadoId)
    ) {
      throw new Error(
        "SEM_PERMISSAO_APENAS_PRESTADOR_DO_CONTRATO_PODE_AGENDAR"
      );
    }

    const statusUpper = String(
      ofertaInicial.status || ""
    ).toUpperCase();

    const estaLiberado =
      ofertaInicial.agenda_liberada ||
      ["EM_ANDAMENTO", "PAGO", "ACEITA"].includes(
        statusUpper
      );

    if (!estaLiberado) {
      throw new Error(
        "AGENDAMENTO_BLOQUEADO_AGUARDANDO_START"
      );
    }

    const dataNormalizada =
      AgendaDisponibilidadeService.normalizarData(data);

    const horaNormalizada =
      AgendaDisponibilidadeService.normalizarHora(hora);

    const duracaoNormalizada = Math.max(
      1,
      Number(duracaoMinutos || 60)
    );

    const moradorId = String(
      ofertaInicial.usuarioId ||
      ofertaInicial.solicitacao?.usuarioId ||
      ""
    ).trim();

    const prestadorId = String(
      ofertaInicial.prestadorId || ""
    ).trim();

    if (!moradorId) {
      throw new Error(
        "DADO_DO_MORADOR_NAO_LOCALIZADO"
      );
    }

    if (!prestadorId) {
      throw new Error(
        "DADO_DO_PRESTADOR_NAO_LOCALIZADO"
      );
    }

    /**
     * ============================================================
     * TRANSAÇÃO ATÔMICA DA AGENDA
     * ============================================================
     *
     * Bloqueamos cliente e profissional antes de verificar conflitos.
     *
     * A ordenação dos IDs garante que duas transações concorrentes
     * tentem obter os locks sempre na mesma ordem, reduzindo o risco
     * de deadlock.
     */
    const transactionResult = await AppDataSource.transaction(
      async (manager) => {
        const agendaTx =
          manager.getRepository(Agenda);

        const ofertaTx =
          manager.getRepository(ServicoOferta);

        const usuarioTx =
          manager.getRepository(Usuario);

        /**
         * Lock do cliente e do profissional.
         *
         * IMPORTANTE:
         * não basta bloquear somente a oferta.
         *
         * O mesmo cliente pode tentar agendar duas ofertas diferentes
         * com profissionais diferentes no mesmo horário.
         *
         * O mesmo profissional também pode receber duas ofertas
         * diferentes para clientes diferentes no mesmo horário.
         */
        const idsParaLock = Array.from(
          new Set([
            moradorId,
            prestadorId,
          ])
        ).sort();

        for (const usuarioId of idsParaLock) {
          const usuarioBloqueado =
            await usuarioTx.findOne({
              where: {
                id: usuarioId,
              },
              lock: {
                mode: "pessimistic_write",
              },
            });

          if (!usuarioBloqueado) {
            throw new Error(
              "USUARIO_DA_AGENDA_NAO_ENCONTRADO"
            );
          }
        }

        /**
         * Também recarregamos/bloqueamos a oferta dentro da transação.
         */
        const oferta =
          await ofertaTx.findOne({
            where: {
              id: ofertaId,
            },
            relations: [
              "solicitacao",
              "solicitacao.morador",
            ],
            lock: {
              mode: "pessimistic_write",
            },
          });

        if (!oferta) {
          throw new Error(
            "CONTRATO_NAO_ENCONTRADO"
          );
        }

        /**
         * ============================================================
         * 1. IDEMPOTÊNCIA DA MESMA OFERTA
         * ============================================================
         *
         * Dois webhooks simultâneos para a mesma compra devem receber
         * a mesma Agenda, nunca criar duas.
         */
        const sessaoExistente =
          await agendaTx.findOne({
            where: {
              ofertaId,
              data: dataNormalizada,
              hora: horaNormalizada,
              status: In(
                STATUS_AGENDA_ATIVOS
              ),
            } as any,
          });

        if (sessaoExistente) {
          console.log(
            `[Agenda Backend] Sessão ativa já existente para oferta ${ofertaId} em ${dataNormalizada} às ${horaNormalizada}. Reutilizando ${sessaoExistente.id}.`
          );

          return {
            agenda: sessaoExistente,
            created: false,
          };
        }

        /**
         * ============================================================
         * 2. INTERVALO SOLICITADO
         * ============================================================
         */
        const horaParaMinutos = (
          valor: string
        ): number => {
          const [hh, mm] =
            String(valor)
              .split(":")
              .map(Number);

          return (
            Number(hh || 0) * 60 +
            Number(mm || 0)
          );
        };

        const inicioSolicitado =
          horaParaMinutos(
            horaNormalizada
          );

        const fimSolicitado =
          inicioSolicitado +
          duracaoNormalizada;

        const existeSobreposicao = (
          agenda: Agenda
        ): boolean => {
          const inicioExistente =
            horaParaMinutos(
              agenda.hora
            );

          const duracaoExistente =
            Math.max(
              1,
              Number(
                agenda.duracaoMinutos ||
                60
              )
            );

          const fimExistente =
            inicioExistente +
            duracaoExistente;

          return (
            inicioSolicitado <
            fimExistente &&
            inicioExistente <
            fimSolicitado
          );
        };

        /**
         * ============================================================
         * 3. CONFLITO DO PROFISSIONAL
         * ============================================================
         *
         * Exemplo:
         *
         * Pedreiro:
         * 08:00 -> 16:00
         *
         * Outro serviço do mesmo pedreiro:
         * 10:00 -> 12:00
         *
         * BLOQUEADO.
         */
        const agendasPrestador =
          await agendaTx.find({
            where: {
              prestador: {
                id: prestadorId,
              },
              data: dataNormalizada,
              status: In(
                STATUS_AGENDA_ATIVOS
              ),
            } as any,
          });

        const conflitoPrestador =
          agendasPrestador.find(
            existeSobreposicao
          );

        if (conflitoPrestador) {
          console.warn(
            "[Agenda Backend] Conflito de horário do profissional",
            {
              prestadorId,
              data:
                dataNormalizada,
              hora:
                horaNormalizada,
              duracaoMinutos:
                duracaoNormalizada,
              agendaConflitanteId:
                conflitoPrestador.id,
              horaExistente:
                conflitoPrestador.hora,
              duracaoExistente:
                conflitoPrestador.duracaoMinutos,
            }
          );

          throw new Error(
            "HORARIO_INDISPONIVEL_PRESTADOR"
          );
        }

        /**
         * ============================================================
         * 4. CONFLITO DO CLIENTE
         * ============================================================
         *
         * O cliente não pode estar simultaneamente com dois
         * profissionais diferentes.
         */
        const agendasMorador =
          await agendaTx.find({
            where: {
              morador: {
                id: moradorId,
              },
              data: dataNormalizada,
              status: In(
                STATUS_AGENDA_ATIVOS
              ),
            } as any,
          });

        const conflitoMorador =
          agendasMorador.find(
            existeSobreposicao
          );

        if (conflitoMorador) {
          console.warn(
            "[Agenda Backend] Conflito de horário do cliente",
            {
              moradorId,
              data:
                dataNormalizada,
              hora:
                horaNormalizada,
              duracaoMinutos:
                duracaoNormalizada,
              agendaConflitanteId:
                conflitoMorador.id,
              horaExistente:
                conflitoMorador.hora,
              duracaoExistente:
                conflitoMorador.duracaoMinutos,
            }
          );

          throw new Error(
            "HORARIO_INDISPONIVEL_CLIENTE"
          );
        }

        /**
         * ============================================================
         * 5. LIMITE DE SESSÕES DA OFERTA/PACOTE
         * ============================================================
         *
         * CANCELADO não entra em STATUS_AGENDA_ATIVOS,
         * portanto libera novamente a sessão.
         */
        const sessoesCriadas =
          await agendaTx.count({
            where: {
              ofertaId,
              status: In(
                STATUS_AGENDA_ATIVOS
              ),
            } as any,
          });

        const limiteSessoes =
          Math.max(
            1,
            Number(
              oferta.total_sessoes ||
              1
            )
          );

        console.log(
          `[Agenda Backend] Sessões ativas: ${sessoesCriadas} | Limite do Pacote: ${limiteSessoes}`
        );

        if (
          sessoesCriadas >=
          limiteSessoes
        ) {
          throw new Error(
            "LIMITE_DE_SESSOES_DO_PACOTE_ATINGIDO"
          );
        }

        const valorTotalContrato =
          Number(
            oferta.valor || 0
          );

        const valorProporcionalSessao =
          valorTotalContrato /
          limiteSessoes;

        /**
         * ============================================================
         * 6. CRIAÇÃO
         * ============================================================
         */
        const novaSessao =
          agendaTx.create();

        novaSessao.ofertaId =
          oferta.id;

        novaSessao.prestador = {
          id: prestadorId,
        } as any;

        novaSessao.morador = {
          id: moradorId,
        } as any;

        novaSessao.descricao =
          descricao ||
          `Sessão ${(
            sessoesCriadas + 1
          )
            .toString()
            .padStart(2, "0")}`;

        novaSessao.data =
          dataNormalizada;

        novaSessao.hora =
          horaNormalizada;

        novaSessao.duracaoMinutos =
          duracaoNormalizada;

        /**
         * Prestador apenas PROPÕE.
         * O morador ainda precisa concordar.
         */
        novaSessao.status =
          StatusAgenda.SUGERIDO;

        novaSessao.valor_parcela =
          Number(
            valorProporcionalSessao.toFixed(
              2
            )
          );

        const agendaCriada = await agendaTx.save(
          novaSessao
        );

        return {
          agenda: agendaCriada,
          created: true,
        };
      }
    );

    /**
     * ============================================================
     * NOTIFICAÇÕES
     * ============================================================
     *
     * Executadas somente depois do COMMIT.
     * Não mantemos locks de banco enquanto notificações são enviadas.
     */

    const saved = transactionResult.agenda;

    if (!transactionResult.created) {
      console.log(
        `[Agenda Backend] Agenda ${saved.id} reutilizada. Notificações não serão reenviadas.`
      );

      return saved;
    }

    await NotificationService.enviar(
      moradorId,
      "Novo horário proposto!",
      `O profissional sugeriu "${saved.descricao}" para ${formatarDataBR(
        dataNormalizada
      )} às ${horaNormalizada}. Confirme ou proponha outro horário.`
    );

    if (prestadorId) {
      const clienteNome =
        ofertaInicial.solicitacao
          ?.morador?.name ||
        "Cliente";

      await NotificationService.enviarSomenteInterna(
        prestadorId,
        "Novo serviço contratado",
        `${clienteNome} solicitou "${saved.descricao}" para ${formatarDataBR(
          dataNormalizada
        )} às ${horaNormalizada}. O horário está aguardando confirmação do cliente.`
      );
    }

    return saved;
  },
  /**
   * ============================================================
   * MORADOR CONFIRMA HORÁRIO PROPOSTO PELO PRESTADOR
   * ============================================================
   */
  async confirmarHorarioMorador(
    agendaId: string,
    moradorId: string
  ) {
    const sessao =
      await agendaRepo.findOne({
        where: { id: agendaId },
        relations: [
          "oferta",
          "oferta.solicitacao",
        ],
      });

    if (!sessao) {
      throw new Error(
        "AGENDAMENTO_NAO_ENCONTRADO"
      );
    }

    const donoId =
      sessao.oferta?.usuarioId ||
      sessao.oferta?.solicitacao?.usuarioId;

    if (
      String(donoId || "") !==
      String(moradorId)
    ) {
      throw new Error(
        "SEM_PERMISSAO_APENAS_CONTRATANTE_PODE_CONFIRMAR_HORARIO"
      );
    }

    if (
      sessao.status ===
      StatusAgenda.AGENDADO
    ) {
      return sessao;
    }

    if (
      sessao.status !==
      StatusAgenda.SUGERIDO
    ) {
      throw new Error(
        "AGENDAMENTO_NAO_AGUARDA_CONFIRMACAO_DO_MORADOR"
      );
    }

    /**
     * Agora houve acordo entre as partes.
     */
    sessao.status =
      StatusAgenda.AGENDADO;

    const atualizada =
      await agendaRepo.save(sessao);

    const prestadorId =
      sessao.oferta?.prestadorId;

    if (prestadorId) {
      await NotificationService.enviar(
        prestadorId,
        "Horário confirmado!",
        `O cliente confirmou "${sessao.descricao}" para ${formatarDataBR(
          sessao.data
        )} às ${sessao.hora}.`
      );
    }

    return atualizada;
  },

  /**
   * ============================================================
   * MORADOR PROPÕE OUTRO HORÁRIO
   * ============================================================
   *
   * SUGERIDO -> CONFIRMADO
   *
   * Neste fluxo, CONFIRMADO significa:
   * "horário contraproposto pelo morador aguardando o prestador".
   */
  async proporNovoHorarioMorador(
    agendaId: string,
    moradorId: string,
    data: string,
    hora: string
  ) {
    const sessao =
      await agendaRepo.findOne({
        where: { id: agendaId },
        relations: [
          "oferta",
          "oferta.solicitacao",
        ],
      });

    if (!sessao) {
      throw new Error(
        "AGENDAMENTO_NAO_ENCONTRADO"
      );
    }

    const donoId =
      sessao.oferta?.usuarioId ||
      sessao.oferta?.solicitacao?.usuarioId;

    if (
      String(donoId || "") !==
      String(moradorId)
    ) {
      throw new Error(
        "SEM_PERMISSAO_APENAS_CONTRATANTE_PODE_PROPOR_HORARIO"
      );
    }

    if (
      sessao.status !==
      StatusAgenda.SUGERIDO
    ) {
      throw new Error(
        "AGENDAMENTO_NAO_AGUARDA_RESPOSTA_DO_MORADOR"
      );
    }

    const prestadorId =
      sessao.oferta?.prestadorId;

    if (!prestadorId) {
      throw new Error(
        "PRESTADOR_NAO_LOCALIZADO"
      );
    }

    const dataNormalizada =
      AgendaDisponibilidadeService.normalizarData(
        data
      );

    const horaNormalizada =
      AgendaDisponibilidadeService.normalizarHora(
        hora
      );

    /**
     * Se o morador estiver escolhendo exatamente
     * o horário já sugerido pelo prestador, basta confirmar.
     */
    if (
      dataNormalizada === sessao.data &&
      horaNormalizada ===
      String(sessao.hora).slice(0, 5)
    ) {
      return this.confirmarHorarioMorador(
        agendaId,
        moradorId
      );
    }

    /**
     * Aqui usamos a disponibilidade REAL cadastrada
     * pelo prestador.
     */
    // const disponibilidade =
    //   await AgendaDisponibilidadeService.consultarHorario({
    //     prestadorId,
    //     data: dataNormalizada,
    //     hora: horaNormalizada,
    //     duracaoMinutos:
    //       Number(
    //         sessao.duracaoMinutos || 60
    //       ),
    //     limiteAlternativas: 3,
    //     diasBuscaAlternativas: 14,
    //   });

    // if (!disponibilidade.disponivel) {
    //   return {
    //     success: false,
    //     disponivel: false,
    //     motivo: disponibilidade.motivo,
    //     solicitado:
    //       disponibilidade.solicitado,
    //     alternativas:
    //       disponibilidade.alternativas,
    //     agenda: sessao,
    //   };
    // }

    sessao.data = dataNormalizada;
    sessao.hora = horaNormalizada;

    /**
     * CONFIRMADO =
     * contraproposta feita pelo morador,
     * aguardando aceite do prestador.
     */
    sessao.status =
      StatusAgenda.CONFIRMADO;

    const atualizada =
      await agendaRepo.save(sessao);

    await NotificationService.enviar(
      prestadorId,
      "Cliente propôs outro horário",
      `O cliente sugeriu ${formatarDataBR(
        dataNormalizada
      )} às ${horaNormalizada} para "${sessao.descricao}". Confirme ou proponha outro horário.`
    );

    return {
      success: true,
      disponivel: true,
      agenda: atualizada,
    };
  },

  /**
   * ============================================================
   * MORADOR RECUSA A PROPOSTA
   * ============================================================
   */
  async recusarHorarioMorador(
    agendaId: string,
    moradorId: string
  ) {
    const sessao =
      await agendaRepo.findOne({
        where: { id: agendaId },
        relations: [
          "oferta",
          "oferta.solicitacao",
        ],
      });

    if (!sessao) {
      throw new Error(
        "AGENDAMENTO_NAO_ENCONTRADO"
      );
    }

    const donoId =
      sessao.oferta?.usuarioId ||
      sessao.oferta?.solicitacao?.usuarioId;

    if (
      String(donoId || "") !==
      String(moradorId)
    ) {
      throw new Error(
        "SEM_PERMISSAO_APENAS_CONTRATANTE_PODE_RECUSAR_HORARIO"
      );
    }

    if (
      sessao.status !==
      StatusAgenda.SUGERIDO
    ) {
      throw new Error(
        "AGENDAMENTO_NAO_AGUARDA_RESPOSTA_DO_MORADOR"
      );
    }

    sessao.status =
      StatusAgenda.CANCELADO;

    const atualizada =
      await agendaRepo.save(sessao);

    const prestadorId =
      sessao.oferta?.prestadorId;

    if (prestadorId) {
      await NotificationService.enviar(
        prestadorId,
        "Horário não aceito",
        `O cliente não pôde aceitar ${formatarDataBR(
          sessao.data
        )} às ${sessao.hora}. Você pode sugerir um novo horário.`
      );
    }

    return atualizada;
  },

  /**
   * ============================================================
   * PRESTADOR ACEITA A CONTRAPROPOSTA DO MORADOR
   * ============================================================
   */
  async confirmarHorarioPrestador(
    agendaId: string,
    prestadorId: string
  ) {
    const sessao =
      await agendaRepo.findOne({
        where: { id: agendaId },
        relations: [
          "oferta",
          "oferta.solicitacao",
        ],
      });

    if (!sessao) {
      throw new Error(
        "AGENDAMENTO_NAO_ENCONTRADO"
      );
    }

    if (
      String(
        sessao.oferta?.prestadorId || ""
      ) !== String(prestadorId)
    ) {
      throw new Error(
        "SEM_PERMISSAO_APENAS_PRESTADOR_DO_CONTRATO_PODE_CONFIRMAR"
      );
    }

    if (
      sessao.status ===
      StatusAgenda.AGENDADO
    ) {
      return sessao;
    }

    if (
      sessao.status !==
      StatusAgenda.CONFIRMADO
    ) {
      throw new Error(
        "AGENDAMENTO_NAO_AGUARDA_CONFIRMACAO_DO_PRESTADOR"
      );
    }

    sessao.status =
      StatusAgenda.AGENDADO;

    const atualizada =
      await agendaRepo.save(sessao);

    const moradorId =
      sessao.oferta?.usuarioId ||
      sessao.oferta?.solicitacao?.usuarioId;

    if (moradorId) {
      await NotificationService.enviar(
        moradorId,
        "Horário confirmado pelo profissional!",
        `O profissional confirmou "${sessao.descricao}" para ${formatarDataBR(
          sessao.data
        )} às ${sessao.hora}.`
      );
    }

    return atualizada;
  },

  /**
   * ============================================================
   * PRESTADOR FAZ NOVA CONTRAPROPOSTA
   * ============================================================
   *
   * CONFIRMADO -> SUGERIDO
   */
  async proporNovoHorarioPrestador(
    agendaId: string,
    prestadorId: string,
    data: string,
    hora: string
  ) {
    const sessao =
      await agendaRepo.findOne({
        where: { id: agendaId },
        relations: [
          "oferta",
          "oferta.solicitacao",
        ],
      });

    if (!sessao) {
      throw new Error(
        "AGENDAMENTO_NAO_ENCONTRADO"
      );
    }

    if (
      String(
        sessao.oferta?.prestadorId || ""
      ) !== String(prestadorId)
    ) {
      throw new Error(
        "SEM_PERMISSAO_APENAS_PRESTADOR_DO_CONTRATO_PODE_PROPOR"
      );
    }

    if (
      sessao.status !==
      StatusAgenda.CONFIRMADO
    ) {
      throw new Error(
        "AGENDAMENTO_NAO_AGUARDA_RESPOSTA_DO_PRESTADOR"
      );
    }

    const dataNormalizada =
      AgendaDisponibilidadeService.normalizarData(
        data
      );

    const horaNormalizada =
      AgendaDisponibilidadeService.normalizarHora(
        hora
      );

    /**
     * Se aceitar exatamente o horário do morador,
     * transforma diretamente em AGENDADO.
     */
    if (
      dataNormalizada === sessao.data &&
      horaNormalizada ===
      String(sessao.hora).slice(0, 5)
    ) {
      return this.confirmarHorarioPrestador(
        agendaId,
        prestadorId
      );
    }

    sessao.data = dataNormalizada;
    sessao.hora = horaNormalizada;

    /**
     * Volta para o morador analisar.
     */
    sessao.status =
      StatusAgenda.SUGERIDO;

    const atualizada =
      await agendaRepo.save(sessao);

    const moradorId =
      sessao.oferta?.usuarioId ||
      sessao.oferta?.solicitacao?.usuarioId;

    if (moradorId) {
      await NotificationService.enviar(
        moradorId,
        "Profissional sugeriu outro horário",
        `O profissional sugeriu ${formatarDataBR(
          dataNormalizada
        )} às ${horaNormalizada} para "${sessao.descricao}".`
      );
    }

    return atualizada;
  },

  /**
   * ============================================================
   * CHECK-IN DO CLIENTE
   * ============================================================
   */
  async confirmarPresencaCliente(
    agendaId: string,
    usuarioLogadoId: string
  ) {
    const sessao =
      await agendaRepo.findOne({
        where: { id: agendaId },
        relations: [
          "oferta",
          "oferta.solicitacao",
        ],
      });

    if (!sessao) {
      throw new Error(
        "AGENDAMENTO_NAO_ENCONTRADO"
      );
    }

    const moradorDonoId =
      sessao.oferta?.usuarioId ||
      sessao.oferta?.solicitacao?.usuarioId ||
      "";

    const prestadorId =
      sessao.oferta?.prestadorId || "";

    if (
      String(moradorDonoId) !==
      String(usuarioLogadoId)
    ) {
      throw new Error(
        "SEM_PERMISSAO_APENAS_O_CONTRATANTE_PODE_FAZER_CHECKIN"
      );
    }

    /**
     * Blindagem:
     * não existe check-in antes de as partes
     * concordarem com o horário.
     */
    if (
      sessao.status !==
      StatusAgenda.AGENDADO
    ) {
      throw new Error(
        "CHECKIN_BLOQUEADO_HORARIO_AINDA_NAO_CONFIRMADO"
      );
    }

    sessao.status =
      StatusAgenda.LIBERADO_CLIENTE;

    const sessaoAtualizada =
      await agendaRepo.save(sessao);

    if (prestadorId) {
      await NotificationService.enviar(
        prestadorId,
        "Cliente fez Check-in!",
        `O morador liberou a entrada para a sessão "${sessao.descricao}". Você já pode iniciar o atendimento.`
      );
    }

    return sessaoAtualizada;
  },

  /**
   * ============================================================
   * ASSINAR ATA E ENCERRAR SESSÃO
   * ============================================================
   */
  async assinarEEncerrarSessao(
    agendaId: string,
    prestadorId: string
  ) {
    const sessao = await agendaRepo.findOne({
      where: { id: agendaId },
      relations: ["oferta"],
    });

    if (!sessao) {
      throw new Error("SESSAO_NAO_ENCONTRADA");
    }

    const oferta = sessao.oferta;

    if (!oferta) {
      throw new Error("OFERTA_NAO_ENCONTRADA");
    }

    if (oferta.prestadorId !== prestadorId) {
      throw new Error("SEM_PERMISSAO");
    }

    if (sessao.status === StatusAgenda.CONCLUIDO) {
      throw new Error("SESSAO_JA_ASSINADA_E_CONCLUIDA");
    }

    // ============================================================
    // 1. CONCLUI A SESSÃO / VISITA
    // ============================================================

    sessao.status = StatusAgenda.CONCLUIDO;

    await agendaRepo.save(sessao);

    // ============================================================
    // 2. ATUALIZA O PROGRESSO DA OFERTA
    // ============================================================

    oferta.sessoes_concluidas =
      Number(oferta.sessoes_concluidas || 0) + 1;

    const totalSessoes = Math.max(
      1,
      Number(oferta.total_sessoes || 1)
    );

    const ultimaSessao =
      Number(oferta.sessoes_concluidas) >= totalSessoes;

    // ============================================================
    // 3. CONCLUSÃO OPERACIONAL
    // ============================================================
    //
    // IMPORTANTE:
    //
    // Para pacote recorrente:
    //   sessão 1/4 -> não conclui oferta
    //   sessão 2/4 -> não conclui oferta
    //   sessão 3/4 -> não conclui oferta
    //   sessão 4/4 -> conclui oferta
    //
    // Para serviço simples:
    //   visita 1/1 -> conclui oferta
    // ============================================================

    if (ultimaSessao) {
      oferta.status = "CONCLUIDA";
    }

    await ofertaRepo.save(oferta);

    // ============================================================
    // 4. PROCESSAMENTO FINANCEIRO DA ÚLTIMA SESSÃO
    // ============================================================
    //
    // ENTRADA + SALDO:
    //
    // Entrada R$ 0,50 -> já PAGA
    // Serviço concluído
    //        ↓
    // finalizarPagamentoPorOferta()
    //        ↓
    // procura SALDO com gatilho CONCLUSAO
    //        ↓
    // gera Preference Mercado Pago somente do SALDO
    //
    // IMPORTANTE:
    // isso NÃO deve marcar o saldo como pago.
    // Apenas disponibiliza o checkout.
    // O webhook do Mercado Pago continuará sendo responsável
    // por confirmar o pagamento.
    // ============================================================

    let pagamentoSaldo: unknown = null;

    if (ultimaSessao) {
      try {
        pagamentoSaldo =
          await PagamentoService.finalizarPagamentoPorOferta(
            oferta.id
          );

        console.log(
          "[AGENDA] Última sessão concluída - financeiro processado",
          {
            agendaId: sessao.id,
            ofertaId: oferta.id,
            sessoesConcluidas:
              Number(oferta.sessoes_concluidas || 0),
            totalSessoes,
            pagamentoSaldoGerado: Boolean(pagamentoSaldo),
          }
        );
      } catch (error: any) {
        /**
         * Não desfazemos a conclusão da sessão.
         *
         * A sessão realmente aconteceu.
         * Se houver erro no Mercado Pago ou na criação
         * da cobrança do saldo, o atendimento continua
         * registrado como concluído.
         *
         * O financeiro poderá ser recuperado posteriormente.
         */
        console.error(
          "[AGENDA] Erro ao processar saldo após conclusão:",
          {
            agendaId: sessao.id,
            ofertaId: oferta.id,
            erro: error?.message || error,
          }
        );

        pagamentoSaldo = null;
      }
    }

    // ============================================================
    // 5. NOTIFICAÇÃO
    // ============================================================

    await NotificationService.enviar(
      oferta.usuarioId,
      "Sessão Assinada com Sucesso!",
      ultimaSessao
        ? `A sessão "${sessao.descricao}" foi encerrada e o serviço foi concluído.`
        : `A sessão "${sessao.descricao}" foi encerrada.`
    );

    // ============================================================
    // 6. RETORNO
    // ============================================================

    return {
      sessao,
      oferta,

      // Útil para o frontend saber se encerrou o contrato operacional
      ultimaSessao,

      // Se houver ENTRADA + SALDO, poderá conter
      // os dados da cobrança criada para o saldo.
      pagamentoSaldo,
    };
  },

  /**
   * ============================================================
   * DISTRATO / CANCELAMENTO PARCIAL
   * ============================================================
   */
  async realizarDistratoPacote(
    ofertaId: string,
    usuarioId: string
  ) {
    const oferta =
      await ofertaRepo.findOne({
        where: { id: ofertaId },
      });

    if (!oferta) {
      throw new Error(
        "CONTRATO_NAO_ENCONTRADO"
      );
    }

    if (
      oferta.usuarioId !== usuarioId
    ) {
      throw new Error(
        "SEM_PERMISSAO_PARA_DISTRATO"
      );
    }

    if (
      oferta.status === "CONCLUIDA"
    ) {
      throw new Error(
        "CONTRATO_JA_ENCERRADO_OU_COMPLETO"
      );
    }

    const valorTotalContrato =
      Number(oferta.valor || 0);

    const totalSessoes =
      Math.max(
        1,
        Number(oferta.total_sessoes || 1)
      );

    const valorPorSessao =
      valorTotalContrato / totalSessoes;

    const valorTotalDevidoAoPrestador =
      valorPorSessao *
      Number(
        oferta.sessoes_concluidas || 0
      );

    const valorEstornoAoCliente =
      valorTotalContrato -
      valorTotalDevidoAoPrestador -
      valorTotalContrato * 0.1;

    /**
     * Cancela qualquer etapa futura ainda não concluída.
     */
    await agendaRepo.update(
      {
        ofertaId: oferta.id,
        status: In([
          StatusAgenda.SUGERIDO,
          StatusAgenda.CONFIRMADO,
          StatusAgenda.AGENDADO,
        ]),
      } as any,
      {
        status: StatusAgenda.CANCELADO,
      }
    );

    oferta.status = "CONCLUIDA";

    await ofertaRepo.save(oferta);

    // LOCAL: distrato altera somente o banco de testes. Nenhum estorno externo
    // e nenhuma notificação afirmando que um reembolso real foi solicitado.
    if (process.env.NODE_ENV === "local") {
      console.log("[AgendaService][LOCAL] Distrato registrado; estorno apenas calculado, não executado.", {
        ofertaId,
        valorEstornoAoCliente,
      });
      return { valorEstornoAoCliente };
    }

    if (valorEstornoAoCliente > 0) {
      try {
        await PagamentoService.solicitarReembolso(
          oferta.id,
          valorEstornoAoCliente
        );

        await NotificationService.enviar(
          oferta.usuarioId,
          "Reembolso Processado",
          `O estorno de R$ ${valorEstornoAoCliente.toFixed(
            2
          )} foi solicitado ao Mercado Pago.`
        );
      } catch (error) {
        console.error(
          "ERRO_AO_ESTORNAR:",
          error
        );
      }
    }

    /**
     * Mantido como estava no fluxo atual.
     *
     * ATENÇÃO:
     * depois vamos revisar esta parte porque o token
     * do Mercado Pago agora está criptografado.
     */
    await this.processarEstornoFinanceiro(
      ofertaId,
      valorEstornoAoCliente
    );

    return {
      valorEstornoAoCliente,
    };
  },

  async processarEstornoFinanceiro(
    ofertaId: string,
    valorEstorno: number
  ) {
    // Proteção independente para chamadas diretas a este método.
    if (process.env.NODE_ENV === "local") {
      throw new Error("ESTORNO_REAL_BLOQUEADO_NO_AMBIENTE_LOCAL");
    }

    const pagamento =
      await pagamentoRepo.findOne({
        where: { ofertaId },
        relations: ["prestador"],
      });

    if (
      !pagamento ||
      !pagamento.transacao_gateway_id
    ) {
      throw new Error(
        "PAGAMENTO_NAO_ENCONTRADO_OU_SEM_ID_GATEWAY"
      );
    }

    const prestador =
      await usuarioRepo.findOne({
        where: {
          id: pagamento.prestadorId,
        },
      });

    if (
      !prestador?.mercadoPagoAccessToken
    ) {
      throw new Error(
        "PRESTADOR_SEM_TOKEN_PARA_ESTORNO"
      );
    }

    try {
      const response =
        await axios.post(
          `https://api.mercadopago.com/v1/payments/${pagamento.transacao_gateway_id}/refunds`,
          {
            amount: Number(
              valorEstorno.toFixed(2)
            ),
          },
          {
            headers: {
              Authorization:
                `Bearer ${prestador.mercadoPagoAccessToken}`,
              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        `✅ Estorno de R$ ${valorEstorno} realizado com sucesso. ID Refund: ${response.data.id}`
      );

      return {
        success: true,
        refundId: response.data.id,
      };
    } catch (error: any) {
      console.error(
        "❌ Erro ao processar estorno no Mercado Pago:",
        error.response?.data ||
        error.message
      );

      throw new Error(
        "FALHA_AO_REALIZAR_ESTORNO_NO_GATEWAY"
      );
    }
  },

  /**
   * ============================================================
   * AGENDA DO PRESTADOR
   * ============================================================
   */
  async listarSessoesPorPrestador(
    prestadorId: string
  ) {
    const sessoes =
      await agendaRepo.find({
        where: {
          prestador: {
            id: prestadorId,
          },
        },
        relations: [
          "oferta",
          "oferta.solicitacao",
          "oferta.solicitacao.morador",
        ],
        order: {
          data: "ASC",
          hora: "ASC",
        },
      });

    console.log(
      `[Agenda Backend] Linhas encontradas para o prestador ${prestadorId}:`,
      sessoes.length
    );

    return sessoes.map((s) => ({
      id: s.id,

      ofertaId: s.ofertaId,
      oferta_id: s.ofertaId,

      descricao: s.descricao,

      data: s.data,
      hora: s.hora,

      duracaoMinutos:
        s.duracaoMinutos,

      status: s.status,

      valor_parcela:
        s.valor_parcela,

      solicitacao_titulo:
        s.oferta?.solicitacao
          ?.titulo ||
        "Serviço Contratado",

      solicitacaoTitulo:
        s.oferta?.solicitacao
          ?.titulo ||
        "Serviço Contratado",

      cliente_nome:
        s.oferta?.solicitacao
          ?.morador?.name ||
        "Morador",

      clienteNome:
        s.oferta?.solicitacao
          ?.morador?.name ||
        "Morador",

      /**
       * Facilita o frontend.
       */
      aguardandoMorador:
        s.status ===
        StatusAgenda.SUGERIDO,

      aguardandoPrestador:
        s.status ===
        StatusAgenda.CONFIRMADO,

      horarioConfirmado:
        [
          StatusAgenda.AGENDADO,
          StatusAgenda.LIBERADO_CLIENTE,
          StatusAgenda.FILA_ASSINATURA,
          StatusAgenda.CONCLUIDO,
        ].includes(s.status),
    }));
  },

  /**
   * ============================================================
   * AGENDA DO MORADOR
   * ============================================================
   */
  async listarSessoesPorMorador(
    moradorId: string
  ) {
    const sessoes =
      await agendaRepo.find({
        where: {
          morador: {
            id: moradorId,
          },
        },
        relations: [
          "oferta",
          "oferta.solicitacao",
          "oferta.prestador",
        ],
        order: {
          data: "ASC",
          hora: "ASC",
        },
      });

    console.log(
      `[Agenda Backend] Linhas encontradas para o morador ${moradorId}:`,
      sessoes.length
    );

    return sessoes.map((s) => ({
      id: s.id,

      ofertaId: s.ofertaId,
      oferta_id: s.ofertaId,

      descricao: s.descricao,

      data: s.data,
      hora: s.hora,

      duracaoMinutos:
        s.duracaoMinutos,

      status: s.status,

      valor_parcela:
        s.valor_parcela,

      solicitacao_titulo:
        s.oferta?.solicitacao
          ?.titulo ||
        "Serviço Contratado",

      prestador_nome:
        (s.oferta as any)
          ?.prestador?.name ||
        "Profissional",

      /**
       * Facilita bastante o MoradorDashboard.
       */
      aguardandoMorador:
        s.status ===
        StatusAgenda.SUGERIDO,

      aguardandoPrestador:
        s.status ===
        StatusAgenda.CONFIRMADO,

      horarioConfirmado:
        [
          StatusAgenda.AGENDADO,
          StatusAgenda.LIBERADO_CLIENTE,
          StatusAgenda.FILA_ASSINATURA,
          StatusAgenda.CONCLUIDO,
        ].includes(s.status),
    }));
  },
};

export default AgendaService;