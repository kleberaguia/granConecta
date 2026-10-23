import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type StoreChatbotKnowledgeTipo =
  | "GERAL"
  | "SOBRE"
  | "ENTREGA"
  | "PAGAMENTO"
  | "CARDAPIO"
  | "PROMOCAO"
  | "NORMA"
  | "FAQ"
  | "ATENDIMENTO";

@Entity("store_chatbot_knowledge")
@Index(["store_id", "ativo"])
export class StoreChatbotKnowledge {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "char", length: 36 })
  store_id!: string;

  @Column({ type: "varchar", length: 150 })
  titulo!: string;

  @Column({
    type: "enum",
    enum: [
      "GERAL",
      "SOBRE",
      "ENTREGA",
      "PAGAMENTO",
      "CARDAPIO",
      "PROMOCAO",
      "NORMA",
      "FAQ",
      "ATENDIMENTO",
    ],
    default: "GERAL",
  })
  tipo!: StoreChatbotKnowledgeTipo;

  @Column({ type: "longtext" })
  conteudo!: string;

  @Column({ type: "tinyint", default: 1 })
  ativo!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}