import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinTable, OneToMany } from 'typeorm';
import { Role } from './RoleModels';


@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[];
}
