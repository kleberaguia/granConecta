import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { ChatMessage } from "./ChatMessage";

@Entity("chat_conversations")
export class ChatConversation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  userId!: string | null;

  /** Hash SHA-256 da credencial de acesso à conversa anônima. */
  @Column({
    name: "access_token_hash",
    type: "char",
    length: 64,
    nullable: true,
    select: false,
  })
  accessTokenHash!: string | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  userName!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  userType!: string | null;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  condominioId!: string | null;

  @Column({
    name: "chatbot_tipo",
    type: "varchar",
    length: 20,
    default: "GRANCONECTA",
  })
  chatbotTipo!:
    | "GRANCONECTA"
    | "LOJA"
    | "PRESTADOR";

  @Column({
    name: "chatbot_owner_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  chatbotOwnerId!: string | null;

  @Column({
    name: "campanha_id",
    type: "bigint",
    nullable: true,
  })
  campanhaId!: number | null;

  @Column({
    name: "categoria_id",
    type: "bigint",
    nullable: true,
  })
  categoriaId!: number | null;

  @Column({
    name: "selected_store_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  selectedStoreId!: string | null;

  @Column({
    name: "selected_store_name",
    type: "varchar",
    length: 160,
    nullable: true,
  })
  selectedStoreName!: string | null;

  @Column({
    name: "selected_store_slug",
    type: "varchar",
    length: 190,
    nullable: true,
  })
  selectedStoreSlug!: string | null;

  @Column({
    name: "negocio_selecionado_em",
    type: "datetime",
    nullable: true,
  })
  negocioSelecionadoEm!: Date | null;

  @Column({
    name: "campaign_stage",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  campaignStage!:
    | "QUALIFICANDO"
    | "APRESENTANDO_OPCOES"
    | "NEGOCIO_SELECIONADO"
    | null;

  @Column({
    name: "playbook_step",
    type: "int",
    default: 0,
  })
  playbookStep!: number;

  @Column({
    type: "varchar",
    length: 30,
    default: "CHAT_HOME",
  })
  origem!:
    | "CHAT_HOME"
    | "CHAT_LOJA"
    | "CHAT_PRESTADOR"
    | "LANDING_PAGE"
    | "WHATSAPP"
    | "INSTAGRAM"
    | "FACEBOOK";

  @Column({
    type: "varchar",
    length: 30,
    default: "ABERTA",
  })
  status!:
    | "ABERTA"
    | "IA_ATIVA"
    | "AGUARDANDO_ATENDENTE"
    | "EM_ATENDIMENTO_HUMANO"
    | "FINALIZADA";

  @Column({
    name: "atendente_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  atendenteId!: string | null;

  @Column({
    name: "atendimento_iniciado_em",
    type: "datetime",
    nullable: true,
  })
  atendimentoIniciadoEm!: Date | null;

  @Column({
    name: "atendimento_finalizado_em",
    type: "datetime",
    nullable: true,
  })
  atendimentoFinalizadoEm!: Date | null;

  @OneToMany(
    () => ChatMessage,
    (message) => message.conversation,
  )
  messages!: ChatMessage[];

  @CreateDateColumn({
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "datetime",
  })
  updatedAt!: Date;
}