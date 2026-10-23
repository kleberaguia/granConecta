import { Brackets } from "typeorm";
import { AppDataSource } from "../config/data-source";
import {
  Agenda,
  StatusAgenda,
} from "../models/AgendaModels";
import {
  AgendaBloqueio,
  AgendaDisponibilidade,
  AgendaDisponibilidadeModalidade,
  AgendaDisponibilidadeTipo,
} from "../models/AgendaDisponibilidadeModel";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";

export type ConsultarDisponibilidadeInput = {
  prestadorId: string;
  moradorId?: string | null;
  data: string;
  hora: string;
  duracaoMinutos: number;
  modalidade?: AgendaDisponibilidadeModalidade | string | null;
  limiteAlternativas?: number;
  diasBuscaAlternativas?: number;
};

export type AgendaSlot = {
  data: string;
  hora: string;
  fim: string;
};

export type ConsultarDisponibilidadeResult = {
  disponivel: boolean;
  solicitado: AgendaSlot;
  alternativas: AgendaSlot[];
  motivo:
    | "DISPONIVEL"
    | "FORA_DA_DISPONIBILIDADE"
    | "BLOQUEADO"
    | "HORARIO_OCUPADO"
    | "CLIENTE_HORARIO_OCUPADO"
    | "ASSINATURA_INADIMPLENTE";
};

type Intervalo = {
  inicio: number;
  fim: number;
};

export class AgendaDisponibilidadeService {
  private get disponibilidadeRepo() {
    return AppDataSource.getRepository(
      AgendaDisponibilidade,
    );
  }

  private get bloqueioRepo() {
    return AppDataSource.getRepository(
      AgendaBloqueio,
    );
  }

  private get agendaRepo() {
    return AppDataSource.getRepository(Agenda);
  }

  private get perfilPrestadorRepo() {
    return AppDataSource.getRepository(PerfilPrestador);
  }

  private async isProviderSubscriptionActive(
    prestadorId: string,
  ): Promise<boolean> {
    const perfil = await this.perfilPrestadorRepo.findOne({
      where: { usuarioId: prestadorId },
    });

    if (!perfil) {
      console.warn(
        "[AGENDA] Perfil de assinatura não encontrado; mantendo compatibilidade com prestadores antigos",
        { prestadorId },
      );
      return true;
    }

    const status = String(
      perfil.status_assinatura || "",
    ).toUpperCase();
    const expiration = perfil.assinatura_vence_em
      ? new Date(perfil.assinatura_vence_em)
      : null;
    const expired = Boolean(
      expiration &&
      !Number.isNaN(expiration.getTime()) &&
      expiration.getTime() <= Date.now(),
    );
    const blockedStatuses = new Set([
      "PENDENTE",
      "VENCIDA",
      "CANCELADA",
      "INATIVA",
      "SUSPENSA",
      "BLOQUEADA",
    ]);
    const active =
      perfil.bloqueado_por_assinatura !== true &&
      !expired &&
      !blockedStatuses.has(status);

    console.log(
      "[AGENDA] Status financeiro do prestador",
      {
        prestadorId,
        perfilId: perfil.id,
        statusAssinatura: status || null,
        assinaturaVenceEm:
          perfil.assinatura_vence_em || null,
        bloqueadoPorAssinatura:
          perfil.bloqueado_por_assinatura,
        ativo: perfil.ativo,
        resultado: active,
      },
    );

    return active;
  }

  async consultarHorario(
    input: ConsultarDisponibilidadeInput,
  ): Promise<ConsultarDisponibilidadeResult> {
    const prestadorId =
      String(input.prestadorId || "").trim();

    const data =
      this.normalizarData(input.data);

    const hora =
      this.normalizarHora(input.hora);

    const duracaoMinutos =
      Math.max(
        1,
        Number(input.duracaoMinutos || 60),
      );

    if (!prestadorId) {
      throw new Error(
        "prestadorId é obrigatório.",
      );
    }

    const assinaturaEmDia =
      await this.isProviderSubscriptionActive(
        prestadorId,
      );

    if (!assinaturaEmDia) {
      const solicitado: AgendaSlot = {
        data,
        hora,
        fim: this.minutesToTime(
          this.timeToMinutes(hora) +
          duracaoMinutos,
        ),
      };

      return {
        disponivel: false,
        solicitado,
        alternativas: [],
        motivo: "ASSINATURA_INADIMPLENTE",
      };
    }

    const solicitado: AgendaSlot = {
      data,
      hora,
      fim:
        this.minutesToTime(
          this.timeToMinutes(hora) +
          duracaoMinutos,
        ),
    };

    const reason =
      await this.getUnavailableReason({
        prestadorId,
        moradorId:
          input.moradorId
            ? String(input.moradorId).trim()
            : null,
        data,
        hora,
        duracaoMinutos,
        modalidade:
          input.modalidade || null,
      });

    if (!reason) {
      return {
        disponivel: true,
        solicitado,
        alternativas: [],
        motivo: "DISPONIVEL",
      };
    }

    const alternativas =
      await this.buscarAlternativas({
        prestadorId,
        moradorId:
          input.moradorId
            ? String(input.moradorId).trim()
            : null,
        data,
        hora,
        duracaoMinutos,
        modalidade:
          input.modalidade || null,
        limite:
          Math.max(
            1,
            Math.min(
              6,
              Number(
                input.limiteAlternativas || 3,
              ),
            ),
          ),
        diasBusca:
          Math.max(
            1,
            Math.min(
              30,
              Number(
                input.diasBuscaAlternativas ||
                14,
              ),
            ),
          ),
      });

    return {
      disponivel: false,
      solicitado,
      alternativas,
      motivo: reason,
    };
  }

  /**
   * Lista os próximos horários realmente livres do prestador sem exigir
   * que o cliente escolha previamente uma data/hora.
   *
   * Uso típico no chatbot:
   * - "quais horários vocês têm?"
   * - "me mostra a agenda"
   * - "que dias estão disponíveis?"
   *
   * A consulta respeita:
   * - assinatura do prestador;
   * - janelas de disponibilidade;
   * - modalidade;
   * - bloqueios;
   * - compromissos já ocupados.
   */
  async listarProximosHorariosLivres(input: {
    prestadorId: string;
    duracaoMinutos: number;
    modalidade?: string | null;
    dataInicial?: string | null;
    limite?: number;
    diasBusca?: number;
  }): Promise<AgendaSlot[]> {
    const prestadorId =
      String(input.prestadorId || "").trim();

    if (!prestadorId) {
      throw new Error(
        "prestadorId é obrigatório.",
      );
    }

    const assinaturaEmDia =
      await this.isProviderSubscriptionActive(
        prestadorId,
      );

    if (!assinaturaEmDia) {
      return [];
    }

    const duracaoMinutos =
      Math.max(
        1,
        Number(input.duracaoMinutos || 60),
      );

    const limite =
      Math.max(
        1,
        Math.min(
          12,
          Number(input.limite || 6),
        ),
      );

    const diasBusca =
      Math.max(
        1,
        Math.min(
          30,
          Number(input.diasBusca || 14),
        ),
      );

    const dataInicial =
      input.dataInicial
        ? this.normalizarData(input.dataInicial)
        : this.todaySaoPaulo();

    const slots: AgendaSlot[] = [];

    for (
      let offset = 0;
      offset <= diasBusca;
      offset += 1
    ) {
      const data =
        this.addDays(
          dataInicial,
          offset,
        );

      const livresDoDia =
        await this.listarHorariosLivres({
          prestadorId,
          data,
          duracaoMinutos,
          modalidade:
            input.modalidade || null,
        });

      for (const slot of livresDoDia) {
        slots.push(slot);

        if (slots.length >= limite) {
          return slots;
        }
      }
    }

    return slots;
  }

  async buscarAlternativas(input: {
    prestadorId: string;
    moradorId?: string | null;
    data: string;
    hora: string;
    duracaoMinutos: number;
    modalidade?: string | null;
    limite?: number;
    diasBusca?: number;
  }): Promise<AgendaSlot[]> {
    const limite =
      Math.max(
        1,
        Math.min(
          6,
          Number(input.limite || 3),
        ),
      );

    const diasBusca =
      Math.max(
        1,
        Math.min(
          30,
          Number(input.diasBusca || 14),
        ),
      );

    const requestedMinutes =
      this.timeToMinutes(
        this.normalizarHora(input.hora),
      );

    const candidates:
      Array<
        AgendaSlot & {
          dayDistance: number;
          timeDistance: number;
        }
      > = [];

    for (
      let offset = 0;
      offset <= diasBusca;
      offset += 1
    ) {
      const data =
        this.addDays(
          this.normalizarData(input.data),
          offset,
        );

      const slots =
        await this.listarHorariosLivres({
          prestadorId:
            input.prestadorId,
          moradorId:
            input.moradorId || null,
          data,
          duracaoMinutos:
            input.duracaoMinutos,
          modalidade:
            input.modalidade || null,
        });

      for (const slot of slots) {
        /**
         * Não devolvemos exatamente o horário que já sabemos
         * estar indisponível.
         */
        if (
          offset === 0 &&
          slot.hora ===
            this.normalizarHora(input.hora)
        ) {
          continue;
        }

        candidates.push({
          ...slot,
          dayDistance:
            offset,
          timeDistance:
            Math.abs(
              this.timeToMinutes(
                slot.hora,
              ) -
              requestedMinutes,
            ),
        });
      }
    }

    return candidates
      .sort((a, b) => {
        /**
         * 1) Prioriza o mesmo dia.
         * 2) Dentro do dia, horário mais próximo.
         * 3) Depois, próximos dias.
         */
        if (
          a.dayDistance !==
          b.dayDistance
        ) {
          return (
            a.dayDistance -
            b.dayDistance
          );
        }

        return (
          a.timeDistance -
          b.timeDistance
        );
      })
      .slice(0, limite)
      .map(
        ({
          dayDistance: _dayDistance,
          timeDistance: _timeDistance,
          ...slot
        }) => slot,
      );
  }

  async listarHorariosLivres(input: {
    prestadorId: string;
    moradorId?: string | null;
    data: string;
    duracaoMinutos: number;
    modalidade?: string | null;
  }): Promise<AgendaSlot[]> {
    const data =
      this.normalizarData(input.data);

    const duracaoMinutos =
      Math.max(
        1,
        Number(input.duracaoMinutos || 60),
      );

    const windows =
      await this.getAvailabilityWindows(
        input.prestadorId,
        data,
        input.modalidade || null,
      );

    if (!windows.length) {
      return [];
    }

    const bloqueios =
      await this.getBlockIntervals(
        input.prestadorId,
        data,
      );

    if (
      bloqueios.some(
        (item) =>
          item.inicio === 0 &&
          item.fim >= 24 * 60,
      )
    ) {
      return [];
    }

    const ocupados =
      await this.getOccupiedIntervals(
        input.prestadorId,
        data,
      );

    const ocupadosCliente =
      input.moradorId
        ? await this.getCustomerOccupiedIntervals(
            input.moradorId,
            data,
          ) : [];

    const slots: AgendaSlot[] = [];

    for (const window of windows) {
      const start =
        this.timeToMinutes(
          window.horaInicio,
        );

      const end =
        this.timeToMinutes(
          window.horaFim,
        );

      const step =
        Math.max(
          5,
          Number(
            window.intervaloMinutos || 30,
          ),
        );

      for (
        let cursor = start;
        cursor + duracaoMinutos <= end;
        cursor += step
      ) {
        const candidate: Intervalo = {
          inicio: cursor,
          fim:
            cursor +
            duracaoMinutos,
        };

        const blocked =
          bloqueios.some(
            (interval) =>
              this.overlaps(
                candidate,
                interval,
              ),
          );

        const occupied =
          ocupados.some(
            (interval) =>
              this.overlaps(
                candidate,
                interval,
              ),
          );

        const customerOccupied =
          ocupadosCliente.some(
            (interval) =>
              this.overlaps(
                candidate,
                interval,
              ),
          );

        if (
          blocked ||
          occupied ||
          customerOccupied
        ) {
          continue;
        }

        slots.push({
          data,
          hora:
            this.minutesToTime(
              candidate.inicio,
            ),
          fim:
            this.minutesToTime(
              candidate.fim,
            ),
        });
      }
    }

    /**
     * Remove duplicações caso disponibilidade específica
     * e recorrente se sobreponham.
     */
    return Array.from(
      new Map(
        slots.map(
          (slot) => [
            `${slot.data}|${slot.hora}`,
            slot,
          ],
        ),
      ).values(),
    ).sort(
      (a, b) =>
        a.hora.localeCompare(
          b.hora,
        ),
    );
  }

  private async getUnavailableReason(input: {
    prestadorId: string;
    moradorId?: string | null;
    data: string;
    hora: string;
    duracaoMinutos: number;
    modalidade?: string | null;
  }): Promise<
    | "FORA_DA_DISPONIBILIDADE"
    | "BLOQUEADO"
    | "HORARIO_OCUPADO"
    | "CLIENTE_HORARIO_OCUPADO"
    | null
  > {
    const windows =
      await this.getAvailabilityWindows(
        input.prestadorId,
        input.data,
        input.modalidade || null,
      );

    const candidate: Intervalo = {
      inicio:
        this.timeToMinutes(
          input.hora,
        ),
      fim:
        this.timeToMinutes(
          input.hora,
        ) +
        input.duracaoMinutos,
    };

    const fitsWindow =
      windows.some(
        (window) => {
          const interval: Intervalo = {
            inicio:
              this.timeToMinutes(
                window.horaInicio,
              ),
            fim:
              this.timeToMinutes(
                window.horaFim,
              ),
          };

          return (
            candidate.inicio >=
              interval.inicio &&
            candidate.fim <=
              interval.fim
          );
        },
      );

    if (!fitsWindow) {
      return "FORA_DA_DISPONIBILIDADE";
    }

    const bloqueios =
      await this.getBlockIntervals(
        input.prestadorId,
        input.data,
      );

    if (
      bloqueios.some(
        (interval) =>
          this.overlaps(
            candidate,
            interval,
          ),
      )
    ) {
      return "BLOQUEADO";
    }

    const ocupados =
      await this.getOccupiedIntervals(
        input.prestadorId,
        input.data,
      );

    if (
      ocupados.some(
        (interval) =>
          this.overlaps(
            candidate,
            interval,
          ),
      )
    ) {
      return "HORARIO_OCUPADO";
    }

    if (input.moradorId) {
      const ocupadosCliente =
        await this.getCustomerOccupiedIntervals(
          input.moradorId,
          input.data,
        );

      if (
        ocupadosCliente.some(
          (interval) =>
            this.overlaps(
              candidate,
              interval,
            ),
        )
      ) {
        return "CLIENTE_HORARIO_OCUPADO";
      }
    }

    return null;
  }

  private async getAvailabilityWindows(
    prestadorId: string,
    data: string,
    modalidade?: string | null,
  ): Promise<
    AgendaDisponibilidade[]
  > {
    const dayOfWeek =
      this.dayOfWeek(data);

    const qb =
      this.disponibilidadeRepo
        .createQueryBuilder(
          "disponibilidade",
        )
        .where(
          "disponibilidade.prestador_id = :prestadorId",
          {
            prestadorId,
          },
        )
        .andWhere(
          "disponibilidade.ativo = :ativo",
          {
            ativo: true,
          },
        )
        .andWhere(
          new Brackets((where) => {
            where
              .where(
                `(
                  disponibilidade.tipo = :specificType
                  AND disponibilidade.data_especifica = :data
                )`,
                {
                  specificType:
                    AgendaDisponibilidadeTipo.DATA_ESPECIFICA,
                  data,
                },
              )
              .orWhere(
                `(
                  disponibilidade.tipo = :recurringType
                  AND disponibilidade.dia_semana = :dayOfWeek
                )`,
                {
                  recurringType:
                    AgendaDisponibilidadeTipo.RECORRENTE,
                  dayOfWeek,
                },
              );
          }),
        );

    const normalizedModality =
      String(
        modalidade || "",
      )
        .trim()
        .toUpperCase();

    if (
      normalizedModality ===
        AgendaDisponibilidadeModalidade.ONLINE ||
      normalizedModality ===
        AgendaDisponibilidadeModalidade.PRESENCIAL
    ) {
      qb.andWhere(
        `(
          disponibilidade.modalidade = :modalidade
          OR disponibilidade.modalidade = :ambos
        )`,
        {
          modalidade:
            normalizedModality,
          ambos:
            AgendaDisponibilidadeModalidade.AMBOS,
        },
      );
    }

    return qb
      .orderBy(
        "disponibilidade.hora_inicio",
        "ASC",
      )
      .getMany();
  }

  private async getBlockIntervals(
    prestadorId: string,
    data: string,
  ): Promise<Intervalo[]> {
    const rows =
      await this.bloqueioRepo.find({
        where: {
          prestadorId,
          data,
          ativo: true,
        },
      });

    return rows.map(
      (row) => {
        if (row.diaInteiro) {
          return {
            inicio: 0,
            fim: 24 * 60,
          };
        }

        return {
          inicio:
            this.timeToMinutes(
              row.horaInicio ||
              "00:00",
            ),
          fim:
            this.timeToMinutes(
              row.horaFim ||
              "23:59",
            ),
        };
      },
    );
  }

  private async getCustomerOccupiedIntervals(
    moradorId: string,
    data: string,
  ): Promise<Intervalo[]> {
    const blockedStatuses = [
      "SUGERIDO",
      "CONFIRMADO",
      StatusAgenda.AGENDADO,
      StatusAgenda.LIBERADO_CLIENTE,
      StatusAgenda.FILA_ASSINATURA,
    ];

    const rows =
      await this.agendaRepo
        .createQueryBuilder("agenda")
        .where(
          "agenda.moradorId = :moradorId",
          { moradorId },
        )
        .andWhere(
          "agenda.data = :data",
          { data },
        )
        .andWhere(
          "agenda.status IN (:...statuses)",
          { statuses: blockedStatuses },
        )
        .getMany();

    return rows.map((row) => {
      const inicio =
        this.timeToMinutes(row.hora);

      const duration =
        Math.max(
          1,
          Number(
            (row as Agenda & {
              duracaoMinutos?: number;
            }).duracaoMinutos || 60,
          ),
        );

      return {
        inicio,
        fim: inicio + duration,
      };
    });
  }

  private async getOccupiedIntervals(
    prestadorId: string,
    data: string,
  ): Promise<Intervalo[]> {
    const blockedStatuses = [
      "SUGERIDO",
      "CONFIRMADO",
      StatusAgenda.AGENDADO,
      StatusAgenda.LIBERADO_CLIENTE,
      StatusAgenda.FILA_ASSINATURA,
    ];

    const rows =
      await this.agendaRepo
        .createQueryBuilder(
          "agenda",
        )
        .where(
          "agenda.prestadorId = :prestadorId",
          {
            prestadorId,
          },
        )
        .andWhere(
          "agenda.data = :data",
          {
            data,
          },
        )
        .andWhere(
          "agenda.status IN (:...statuses)",
          {
            statuses:
              blockedStatuses,
          },
        )
        .getMany();

    return rows.map(
      (row) => {
        const inicio =
          this.timeToMinutes(
            row.hora,
          );

        const duration =
          Math.max(
            1,
            Number(
              (row as Agenda & {
                duracaoMinutos?: number;
              }).duracaoMinutos ||
              60,
            ),
          );

        return {
          inicio,
          fim:
            inicio +
            duration,
        };
      },
    );
  }

  private overlaps(
    a: Intervalo,
    b: Intervalo,
  ): boolean {
    return (
      a.inicio < b.fim &&
      b.inicio < a.fim
    );
  }

  /**
   * Aceita:
   * - YYYY-MM-DD
   * - DD/MM/YYYY
   */
  normalizarData(
    value: string,
  ): string {
    const raw =
      String(value || "").trim();

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        raw,
      )
    ) {
      return raw;
    }

    const br =
      raw.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/,
      );

    if (br) {
      return (
        `${br[3]}-${br[2]}-${br[1]}`
      );
    }

    throw new Error(
      "DATA_AGENDA_INVALIDA",
    );
  }

  normalizarHora(
    value: string,
  ): string {
    const raw =
      String(value || "")
        .trim()
        .toLowerCase();

    const match =
      raw.match(
        /^(\d{1,2})(?::(\d{2}))?\s*h?$/,
      );

    if (!match) {
      throw new Error(
        "HORA_AGENDA_INVALIDA",
      );
    }

    const hour =
      Number(match[1]);

    const minute =
      Number(
        match[2] || 0,
      );

    if (
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new Error(
        "HORA_AGENDA_INVALIDA",
      );
    }

    return `${String(hour).padStart(
      2,
      "0",
    )}:${String(minute).padStart(
      2,
      "0",
    )}`;
  }

  /**
   * Converte expressões como "sexta", "sexta-feira" ou data explícita
   * para uma data real. Para dia da semana usa a próxima ocorrência,
   * considerando America/Sao_Paulo.
   */
  resolverDataPreferida(
    value: string,
  ): string | null {
    const raw =
      String(value || "").trim();

    if (!raw) {
      return null;
    }

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        raw,
      ) ||
      /^\d{2}\/\d{2}\/\d{4}$/.test(
        raw,
      )
    ) {
      return this.normalizarData(
        raw,
      );
    }

    const normalized =
      raw
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          "",
        )
        .toLowerCase();

    const weekdays: Array<{
      terms: string[];
      day: number;
    }> = [
      {
        terms: [
          "domingo",
        ],
        day: 0,
      },
      {
        terms: [
          "segunda",
          "segunda-feira",
          "segundas",
          "segundas-feiras",
        ],
        day: 1,
      },
      {
        terms: [
          "terca",
          "terca-feira",
          "tercas",
          "tercas-feiras",
        ],
        day: 2,
      },
      {
        terms: [
          "quarta",
          "quarta-feira",
          "quartas",
          "quartas-feiras",
        ],
        day: 3,
      },
      {
        terms: [
          "quinta",
          "quinta-feira",
          "quintas",
          "quintas-feiras",
        ],
        day: 4,
      },
      {
        terms: [
          "sexta",
          "sexta-feira",
          "sextas",
          "sextas-feiras",
        ],
        day: 5,
      },
      {
        terms: [
          "sabado",
        ],
        day: 6,
      },
    ];

    const found =
      weekdays.find(
        (item) =>
          item.terms.some(
            (term) =>
              normalized.includes(
                term,
              ),
          ),
      );

    if (!found) {
      return null;
    }

    const today =
      this.todaySaoPaulo();

    const currentDay =
      this.dayOfWeek(today);

    let diff =
      (
        found.day -
        currentDay +
        7
      ) % 7;

    /**
     * Se o usuário disser apenas "sexta" e hoje for sexta,
     * ainda consideramos hoje. O motor depois validará se o
     * horário já passou/está disponível.
     */
    return this.addDays(
      today,
      diff,
    );
  }

  private todaySaoPaulo(): string {
    const parts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        },
      ).formatToParts(
        new Date(),
      );

    const map =
      Object.fromEntries(
        parts.map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
      );

    return (
      `${map.year}-${map.month}-${map.day}`
    );
  }

  private dayOfWeek(
    data: string,
  ): number {
    return new Date(
      `${data}T12:00:00`,
    ).getDay();
  }

  private addDays(
    data: string,
    days: number,
  ): string {
    const parts =
      data
        .split("-")
        .map(Number);

    const year =
      parts[0];

    const month =
      parts[1];

    const day =
      parts[2];

    if (
      year === undefined ||
      month === undefined ||
      day === undefined
    ) {
      throw new Error(
        "DATA_AGENDA_INVALIDA",
      );
    }

    const date =
      new Date(
        year,
        month - 1,
        day + days,
        12,
        0,
        0,
        0,
      );

    return [
      date
        .getFullYear(),
      String(
        date.getMonth() + 1,
      ).padStart(2, "0"),
      String(
        date.getDate(),
      ).padStart(2, "0"),
    ].join("-");
  }

  private timeToMinutes(
    value: string,
  ): number {
    const normalized =
      String(value || "")
        .slice(0, 5);

    const parts =
      normalized
        .split(":")
        .map(Number);

    const hour =
      parts[0] ?? 0;

    const minute =
      parts[1] ?? 0;

    return (
      hour * 60 +
      minute
    );
  }

  private minutesToTime(
    minutes: number,
  ): string {
    const safe =
      Math.max(
        0,
        Math.min(
          24 * 60,
          minutes,
        ),
      );

    const hour =
      Math.floor(
        safe / 60,
      );

    const minute =
      safe % 60;

    return `${String(hour).padStart(
      2,
      "0",
    )}:${String(minute).padStart(
      2,
      "0",
    )}`;
  }
}

export default new AgendaDisponibilidadeService();