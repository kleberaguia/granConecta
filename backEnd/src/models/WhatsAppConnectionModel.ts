import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum WhatsAppConnectionOwnerType {
  GRANCONECTA = "GRANCONECTA",
  EMPREENDEDOR = "EMPREENDEDOR",
  PRESTADOR = "PRESTADOR",
  LOJA = "LOJA",
}

export enum WhatsAppConnectionStatus {
  PENDENTE = "PENDENTE",
  ATIVO = "ATIVO",
  DESCONECTADO = "DESCONECTADO",
  ERRO = "ERRO",
}

@Entity("whatsapp_connections")
@Index(
  "IDX_whatsapp_connections_owner",
  ["ownerType", "ownerId"],
)
@Index(
  "IDX_whatsapp_connections_phone_number_id",
  ["phoneNumberId"],
  { unique: true },
)
@Index(
  "IDX_whatsapp_connections_waba_id",
  ["wabaId"],
)
export class WhatsAppConnection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /*
   * Proprietário da conexão dentro do GranConecta.
   *
   * Exemplos:
   * GRANCONECTA -> ownerId pode ser null
   * EMPREENDEDOR -> usuarioId do empreendedor
   * PRESTADOR -> usuarioId do prestador
   * LOJA -> storeId
   */
  @Column({
    type: "enum",
    enum: WhatsAppConnectionOwnerType,
    default:
      WhatsAppConnectionOwnerType.GRANCONECTA,
    name: "owner_type",
  })
  ownerType!: WhatsAppConnectionOwnerType;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
    name: "owner_id",
  })
  ownerId!: string | null;

  /*
   * WhatsApp Business Account ID retornado pela Meta.
   */
  @Column({
    type: "varchar",
    length: 64,
    name: "waba_id",
  })
  wabaId!: string;

  /*
   * Phone Number ID usado pela Cloud API.
   *
   * Esse é um dos campos mais importantes para envio.
   */
  @Column({
    type: "varchar",
    length: 64,
    name: "phone_number_id",
  })
  phoneNumberId!: string;

  /*
   * Número legível.
   * Exemplo: +55 11 99999-9999
   */
  @Column({
    type: "varchar",
    length: 32,
    nullable: true,
    name: "display_phone_number",
  })
  displayPhoneNumber!: string | null;

  /*
   * Nome comercial/verificado retornado pela Meta.
   */
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    name: "verified_name",
  })
  verifiedName!: string | null;

  @Column({
    type: "enum",
    enum: WhatsAppConnectionStatus,
    default: WhatsAppConnectionStatus.PENDENTE,
  })
  status!: WhatsAppConnectionStatus;

  /*
   * Token não entra neste model neste momento.
   *
   * Não quero misturar credencial sensível com a primeira
   * versão da entidade antes de definirmos a estratégia de
   * System User / token por conexão.
   */

  @Column({
    type: "datetime",
    nullable: true,
    name: "connected_at",
  })
  connectedAt!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
    name: "disconnected_at",
  })
  disconnectedAt!: Date | null;

  @Column({
    type: "text",
    nullable: true,
    name: "last_error",
  })
  lastError!: string | null;

  @CreateDateColumn({
    type: "datetime",
    name: "created_at",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "datetime",
    name: "updated_at",
  })
  updatedAt!: Date;
}

export default WhatsAppConnection;