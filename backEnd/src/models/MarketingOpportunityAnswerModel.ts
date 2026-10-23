import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MarketingOpportunity } from "./MarketingOpportunityModel";

@Entity("marketing_opportunity_answers")
@Index(
  "uk_marketing_opportunity_answer_chave",
  ["opportunity_id", "pergunta_chave"],
  {
    unique: true,
  },
)
@Index("idx_marketing_opportunity_answer_opportunity", ["opportunity_id"])
@Index("idx_marketing_opportunity_answer_playbook", ["playbook_id"])
export class MarketingOpportunityAnswer {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: number;

  @Column({
    type: "varchar",
    length: 36,
    nullable: false,
  })
  opportunity_id!: string;

  @ManyToOne(
    () => MarketingOpportunity,
    (opportunity) => opportunity.answers,
    {
      nullable: false,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  )
  @JoinColumn({
    name: "opportunity_id",
    foreignKeyConstraintName:
      "fk_marketing_opportunity_answer_opportunity",
  })
  opportunity!: MarketingOpportunity;

  @Column({
    type: "bigint",
    nullable: true,
  })
  playbook_id!: number | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: false,
  })
  pergunta_chave!: string;

  @Column({
    type: "text",
    nullable: false,
  })
  pergunta!: string;

  @Column({
    type: "text",
    nullable: false,
  })
  resposta!: string;

  @Column({
    type: "int",
    default: 0,
  })
  ordem!: number;

  @Column({
    type: "boolean",
    default: false,
  })
  obrigatoria!: boolean;

  @CreateDateColumn({
    type: "datetime",
    name: "createdAt",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "datetime",
    name: "updatedAt",
  })
  updatedAt!: Date;
}

export default MarketingOpportunityAnswer;