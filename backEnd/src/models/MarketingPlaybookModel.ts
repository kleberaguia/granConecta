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

import { Category } from "./CategoryModels";

export type MarketingPlaybookOpcao =
  | string
  | {
      id?: string;
      label: string;
      valor?: string;
      descricao?: string;
    };

export type MarketingPlaybookPergunta = {
  chave: string;
  pergunta: string;
  opcoes?: MarketingPlaybookOpcao[];
  obrigatoria?: boolean;
  ordem?: number;
};

export type MarketingPlaybookFAQ = {
  pergunta: string;
  resposta: string;
};

@Entity("marketing_playbooks")
@Index("uk_marketing_playbook_categoria", ["categoria_id"], {
  unique: true,
})
@Index("idx_marketing_playbook_ativo", ["ativo"])
export class MarketingPlaybook {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: number;

  @Column({
    type: "int",
    nullable: false,
  })
  categoria_id!: number;

  @ManyToOne(() => Category, {
    nullable: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "categoria_id",
    foreignKeyConstraintName: "fk_marketing_playbook_categoria",
  })
  categoria!: Category;

  @Column({
    type: "varchar",
    length: 150,
  })
  nome!: string;

  @Column({
    type: "text",
  })
  mensagem_abertura!: string;

  @Column({
    type: "json",
    nullable: true,
  })
  perguntas?: MarketingPlaybookPergunta[] | null;

  @Column({
    type: "json",
    nullable: true,
  })
  respostas_frequentes?: MarketingPlaybookFAQ[] | null;

  @Column({
    type: "text",
    nullable: true,
  })
  instrucoes_ia?: string | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  cta_texto?: string | null;

  @Column({
    type: "boolean",
    default: true,
  })
  ativo!: boolean;

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

export default MarketingPlaybook;