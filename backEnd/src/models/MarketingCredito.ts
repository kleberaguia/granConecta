import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum MarketingCreditoBeneficiarioTipo {
  PRESTADOR = "PRESTADOR",
  EMPREENDEDOR = "EMPREENDEDOR",
}

@Entity("marketing_creditos")
@Index(
  "uk_marketing_credito_beneficiario_competencia",
  ["beneficiario_tipo", "beneficiario_id", "competencia"],
  { unique: true },
)
@Index("idx_marketing_credito_competencia", ["competencia", "expira_em"])
export class MarketingCredito {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: number;

  @Column({ type: "enum", enum: MarketingCreditoBeneficiarioTipo })
  beneficiario_tipo!: MarketingCreditoBeneficiarioTipo;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
  })
  beneficiario_id!: string;

  /** Formato YYYY-MM. */
  @Column({ type: "char", length: 7 })
  competencia!: string;

  @Column({ type: "int", unsigned: true, default: 1 })
  quantidade_incluida!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  quantidade_extra!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  quantidade_utilizada!: number;

  @Column({ type: "datetime", nullable: true })
  expira_em?: Date | null;

  @Column({ type: "datetime", nullable: true })
  ultimo_uso_em?: Date | null;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;

  get saldo(): number {
    return Math.max(
      0,
      this.quantidade_incluida +
        this.quantidade_extra -
        this.quantidade_utilizada,
    );
  }
}

export default MarketingCredito;
