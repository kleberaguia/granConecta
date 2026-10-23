import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

import { Usuario } from "./UserModels";
import { CondominioUnidade } from "./CondominioUnidadeModel";

export enum UsuarioCondominioTipoVinculo {
  MORADOR = "MORADOR",
  PROPRIETARIO = "PROPRIETARIO",
  INQUILINO = "INQUILINO",
  DEPENDENTE = "DEPENDENTE",
}

export enum UsuarioCondominioStatusValidacao {
  PENDENTE = "PENDENTE",
  VERIFICADO = "VERIFICADO",
  REJEITADO = "REJEITADO",
}

@Entity("usuario_condominio_unidades")
@Index(
  "UQ_usuario_condominio_unidade",
  ["usuario_id", "condominio_unidade_id"],
  {
    unique: true,
  }
)
@Index(
  "IDX_usuario_unidade_usuario",
  ["usuario_id"]
)
@Index(
  "IDX_usuario_unidade_unidade",
  ["condominio_unidade_id"]
)
export class UsuarioCondominioUnidade {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Usuário vinculado à residência.
   */
  @Column({
    type: "varchar",
    length: 36,
  })
  usuario_id!: string;

  /**
   * Unidade residencial.
   *
   * Exemplo:
   * CPS-T1-1501
   */
  @Column({
    type: "varchar",
    length: 36,
  })
  condominio_unidade_id!: string;

  /**
   * Relação com o usuário.
   *
   * ON DELETE CASCADE corresponde exatamente
   * à FK criada no MySQL.
   */
  @ManyToOne(
    () => Usuario,
    {
      nullable: false,
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({
    name: "usuario_id",
  })
  usuario!: Usuario;

  /**
   * Relação com a unidade residencial.
   */
  @ManyToOne(
    () => CondominioUnidade,
    {
      nullable: false,
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({
    name: "condominio_unidade_id",
  })
  condominio_unidade!: CondominioUnidade;

  @Column({
    type: "enum",
    enum: UsuarioCondominioTipoVinculo,
    default: UsuarioCondominioTipoVinculo.MORADOR,
  })
  tipo_vinculo!: UsuarioCondominioTipoVinculo;

  /**
   * PENDENTE:
   * usuário declarou morar na unidade.
   *
   * VERIFICADO:
   * vínculo residencial confirmado.
   *
   * REJEITADO:
   * vínculo analisado e considerado inválido.
   */
  @Column({
    type: "enum",
    enum: UsuarioCondominioStatusValidacao,
    default:
      UsuarioCondominioStatusValidacao.PENDENTE,
  })
  status_validacao!: UsuarioCondominioStatusValidacao;

  /**
   * Permite futuramente um usuário possuir mais
   * de um vínculo residencial.
   *
   * Exemplo:
   * residência principal + outro imóvel.
   */
  @Column({
    type: "boolean",
    default: true,
  })
  principal!: boolean;

  @CreateDateColumn({
    type: "datetime",
    name: "created_at",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "datetime",
    name: "updated_at",
  })
  updated_at!: Date;
}

export default UsuarioCondominioUnidade;