import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

import { BusinessTeamMemberRole } from "./BusinessTeamMemberModel";

export enum BusinessTeamInvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

@Entity("business_team_invitations")
@Index("IDX_business_team_invitation_store_status", ["storeId", "status"])
@Index("IDX_business_team_invitation_email_status", ["email", "status"])
@Index("IDX_business_team_invitation_expires_at", ["expiresAt"])
export class BusinessTeamInvitation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "store_id",
    type: "varchar",
    length: 36,
    collation: "utf8mb4_unicode_ci",
  })
  storeId!: string;

  @Column({
    name: "invited_by_user_id",
    type: "varchar",
    length: 36,
    collation: "utf8mb4_unicode_ci",
  })
  invitedByUserId!: string;

  @Column({
    name: "accepted_by_user_id",
    type: "varchar",
    length: 36,
    nullable: true,
    collation: "utf8mb4_unicode_ci",
  })
  acceptedByUserId!: string | null;

  @Column({
    name: "name",
    type: "varchar",
    length: 160,
    collation: "utf8mb4_unicode_ci",
  })
  name!: string;

  @Column({
    name: "email",
    type: "varchar",
    length: 190,
    collation: "utf8mb4_unicode_ci",
  })
  email!: string;

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

  /**
   * Guardamos somente o hash SHA-256 do token.
   * O token original é entregue no link do convite e nunca persiste no banco.
   */
  @Column({
    name: "token_hash",
    type: "char",
    length: 64,
    unique: true,
    collation: "ascii_general_ci",
  })
  tokenHash!: string;

  @Column({
    name: "status",
    type: "enum",
    enum: BusinessTeamInvitationStatus,
    default: BusinessTeamInvitationStatus.PENDING,
  })
  status!: BusinessTeamInvitationStatus;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;

  @Column({ name: "accepted_at", type: "datetime", nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: "cancelled_at", type: "datetime", nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}

export default BusinessTeamInvitation;