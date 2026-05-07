import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("webhook_events")
export class WebhookEvent {
  @PrimaryColumn()
  id!: string;

  @Column()
  type!: string;

  @Column({ default: false })
  processed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}