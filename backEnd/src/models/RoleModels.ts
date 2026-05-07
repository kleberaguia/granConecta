// src/entities/Role.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinTable, OneToMany } from 'typeorm';
import { Permission } from './PermissionModels'; // Certifique-se que este import está correto
import { Usuario } from './UserModels'; // Certifique-se que este import está correto

@Entity()
export class Role {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @ManyToMany(() => Permission, permission => permission.roles)
    @JoinTable({
        // --- CORREÇÕES AQUI ---
        name: 'role_permissions_permission_map',  // 1. Nome exato da tabela da migration
        joinColumn: { name: 'roleId' },            // 2. Nome exato da coluna da migration
        inverseJoinColumn: { name: 'permissionId' } // 3. Nome exato da coluna da migration
    })
    permissions!: Permission[];

    @OneToMany(() => Usuario, user => user.tipo)
    user!: Usuario[];
}