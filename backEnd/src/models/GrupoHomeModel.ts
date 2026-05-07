import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Category } from "./CategoryModels"; // Importe sua classe de Categoria

@Entity("grupos_home")
export class GrupoHome {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string; // Ex: "Saúde & bem-estar"

  @Column({ unique: true })
  slug!: string; // Ex: "saude-bem-estar" (Deve ser igual ao 'grupo' no seu JSON)

  @Column({ default: true })
  ativo!: boolean;

  @OneToMany(() => Category, (categoria) => categoria.grupo)
  categorias!: Category[];
}