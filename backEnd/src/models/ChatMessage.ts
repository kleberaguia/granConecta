import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ChatConversation } from "./ChatConversation";

@Entity("chat_messages")
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 36,
  })
  conversationId!: string;

  @ManyToOne(
    () => ChatConversation,
    (conversation) =>
      conversation.messages,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({
    name: "conversationId",
  })
  conversation!: ChatConversation;

  @Column({
    name: "is_read",
    type: "boolean",
    default: false,
  })
  isRead!: boolean;

  @Column({
    type: "varchar",
    length: 20,
  })
  role!: "user" | "assistant";

  @Column({
    type: "text",
  })
  content!: string;

  /**
   * ID da mensagem no canal externo.
   *
   * Exemplo Instagram:
   * message.mid
   */
  @Column({
    name: "external_message_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  externalMessageId!: string | null;

  /**
   * Canal de origem da mensagem externa.
   *
   * Exemplos:
   * INSTAGRAM
   * WHATSAPP
   */
  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  channel!: string | null;

  @CreateDateColumn({
    type: "datetime",
    precision: 6,
  })
  createdAt!: Date;
}