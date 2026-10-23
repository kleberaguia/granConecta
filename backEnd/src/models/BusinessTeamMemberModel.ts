import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum BusinessTeamMemberRole {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  ATTENDANT = "ATTENDANT",
}

@Entity("business_team_members")
@Index("idx_business_team_store_active", ["storeId", "active"])
@Index("idx_business_team_user_active", ["userId", "active"])
@Index("uq_business_team_store_user", ["storeId", "userId"], { unique: true })
export class BusinessTeamMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * ID real da Store.
   *
   * Mantemos somente o ID nesta primeira versão, sem relation/join TypeORM,
   * para não reproduzir os problemas históricos de relação/collation entre
   * stores, perfil_prestador e usuarios.
   */
  @Column({
    name: "store_id",
    type: "varchar",
    length: 36,
    collation: "utf8mb4_unicode_ci",
  })
  storeId!: string;

  /**
   * ID real de usuarios.id do membro da equipe.
   */
  @Column({
    name: "user_id",
    type: "varchar",
    length: 36,
    collation: "utf8mb4_unicode_ci",
  })
  userId!: string;

  @Column({
    name: "role",
    type: "enum",
    enum: BusinessTeamMemberRole,
    default: BusinessTeamMemberRole.ATTENDANT,
  })
  role!: BusinessTeamMemberRole;

  @Column({ name: "can_chat", type: "boolean", default: true })
  canChat!: boolean;

  @Column({
    name: "can_central_comercial",
    type: "boolean",
    default: true,
  })
  canCentralComercial!: boolean;

  @Column({ name: "can_agenda", type: "boolean", default: false })
  canAgenda!: boolean;

  @Column({ name: "can_orders", type: "boolean", default: false })
  canOrders!: boolean;

  @Column({ name: "can_catalog", type: "boolean", default: false })
  canCatalog!: boolean;

  @Column({ name: "can_finance", type: "boolean", default: false })
  canFinance!: boolean;

  @Column({ name: "can_settings", type: "boolean", default: false })
  canSettings!: boolean;

  @Column({ name: "active", type: "boolean", default: true })
  active!: boolean;

  @Column({
    name: "invited_by_user_id",
    type: "varchar",
    length: 36,
    collation: "utf8mb4_unicode_ci",
    nullable: true,
  })
  invitedByUserId!: string | null;

  @Column({
    name: "accepted_at",
    type: "datetime",
    nullable: true,
  })
  acceptedAt!: Date | null;

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

export default BusinessTeamMember;