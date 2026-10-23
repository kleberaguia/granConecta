import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("chat_leads")
export class ChatLead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36, unique: true })
  conversationId!: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  userId!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  nome!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  telefone!: string | null;

  @Column({ type: "varchar", length: 150, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  condominioId!: string | null;

  @Column({ type: "text", nullable: true })
  interesse!: string | null;

  @Column({ type: "varchar", length: 30, default: "NOVO" })
  status!:
    | "NOVO"
    | "QUALIFICANDO"
    | "INTERESSADO"
    | "ENCAMINHADO"
    | "CONVERTIDO"
    | "PERDIDO";

  @Column({ type: "varchar", length: 50, default: "CHAT_HOME" })
  origem!:
    | "WHATSAPP"
    | "LANDING_PAGE"
    | "CHAT_HOME"
    | "CHAT_LOJA"
    | "CHAT_PRESTADOR"
    | "INSTAGRAM"
    | "FACEBOOK";

  @Column({
    name: "chatbot_tipo",
    type: "varchar",
    length: 20,
    default: "GRANCONECTA",
  })
  chatbotTipo!: "GRANCONECTA" | "LOJA" | "PRESTADOR";

  @Column({
    name: "chatbot_owner_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  chatbotOwnerId!: string | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}