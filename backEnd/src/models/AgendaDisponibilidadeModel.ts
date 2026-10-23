import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum AgendaDisponibilidadeTipo {
  RECORRENTE = "RECORRENTE",
  DATA_ESPECIFICA = "DATA_ESPECIFICA",
}

export enum AgendaDisponibilidadeModalidade {
  PRESENCIAL = "PRESENCIAL",
  ONLINE = "ONLINE",
  AMBOS = "AMBOS",
}

@Entity("agenda_disponibilidade")
@Index(
  "idx_agenda_disp_prestador_ativo",
  ["prestadorId", "ativo"],
)
@Index(
  "idx_agenda_disp_dia",
  ["prestadorId", "diaSemana", "ativo"],
)
@Index(
  "idx_agenda_disp_data",
  ["prestadorId", "dataEspecifica", "ativo"],
)
export class AgendaDisponibilidade {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "prestador_id",
    type: "varchar",
    length: 36,
  })
  prestadorId!: string;

  @Column({
    type: "enum",
    enum: AgendaDisponibilidadeTipo,
    default: AgendaDisponibilidadeTipo.RECORRENTE,
  })
  tipo!: AgendaDisponibilidadeTipo;

  /**
   * 0=domingo, 1=segunda, ..., 6=sábado.
   */
  @Column({
    name: "dia_semana",
    type: "tinyint",
    nullable: true,
  })
  diaSemana!: number | null;

  @Column({
    name: "data_especifica",
    type: "date",
    nullable: true,
  })
  dataEspecifica!: string | null;

  @Column({
    name: "hora_inicio",
    type: "time",
  })
  horaInicio!: string;

  @Column({
    name: "hora_fim",
    type: "time",
  })
  horaFim!: string;

  @Column({
    name: "intervalo_minutos",
    type: "int",
    default: 30,
  })
  intervaloMinutos!: number;

  @Column({
    type: "enum",
    enum: AgendaDisponibilidadeModalidade,
    default: AgendaDisponibilidadeModalidade.AMBOS,
  })
  modalidade!: AgendaDisponibilidadeModalidade;

  @Column({
    type: "boolean",
    default: true,
  })
  ativo!: boolean;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
  })
  updatedAt!: Date;
}

@Entity("agenda_bloqueios")
@Index(
  "idx_agenda_bloq_prestador_data",
  ["prestadorId", "data", "ativo"],
)
export class AgendaBloqueio {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "prestador_id",
    type: "varchar",
    length: 36,
  })
  prestadorId!: string;

  @Column({
    type: "date",
  })
  data!: string;

  @Column({
    name: "hora_inicio",
    type: "time",
    nullable: true,
  })
  horaInicio!: string | null;

  @Column({
    name: "hora_fim",
    type: "time",
    nullable: true,
  })
  horaFim!: string | null;

  @Column({
    name: "dia_inteiro",
    type: "boolean",
    default: false,
  })
  diaInteiro!: boolean;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  motivo!: string | null;

  @Column({
    type: "boolean",
    default: true,
  })
  ativo!: boolean;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
  })
  createdAt!: Date;
}

export default AgendaDisponibilidade;