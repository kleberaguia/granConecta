import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

import { Classificado } from "./ClassificadoModel";

/**
 * ============================================================
 * CLASSIFICADO IMAGEM
 * ============================================================
 *
 * Representa uma imagem pertencente a um anúncio dos
 * Classificados GranConecta.
 *
 * Um classificado poderá possuir várias imagens.
 *
 * A coluna "principal" identifica a imagem utilizada como
 * capa do anúncio nas vitrines e resultados de busca.
 */
@Entity("classificado_imagens")
@Index(
  "IDX_classificado_imagens_classificado",
  ["classificadoId"]
)
export class ClassificadoImagem {
  /**
   * A tabela utiliza BIGINT AUTO_INCREMENT.
   *
   * Como a quantidade de imagens não deverá chegar aos limites
   * do JavaScript Number neste cenário, mantemos number.
   */
  @PrimaryGeneratedColumn({
    type: "bigint",
  })
  id!: number;

  /**
   * ID do classificado ao qual a imagem pertence.
   */
  @Column({
    name: "classificado_id",
    type: "varchar",
    length: 36,
  })
  classificadoId!: string;

  /**
   * Relação:
   *
   * Classificado 1 ---- N ClassificadoImagem
   *
   * ON DELETE CASCADE:
   * se o classificado for removido fisicamente, suas imagens
   * também serão removidas da tabela.
   *
   * Isso remove apenas o registro do banco.
   * Posteriormente, o serviço responsável pelos uploads deverá
   * cuidar também da remoção do arquivo físico/storage.
   */
  @ManyToOne(
    () => Classificado,
    {
      nullable: false,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    }
  )
  @JoinColumn({
    name: "classificado_id",
  })
  classificado!: Classificado;

  /**
   * URL/caminho público da imagem.
   *
   * O tamanho 700 corresponde exatamente ao varchar(700)
   * existente no banco.
   */
  @Column({
    type: "varchar",
    length: 700,
  })
  url!: string;

  /**
   * Ordem de exibição.
   *
   * 0 = primeira imagem
   * 1 = segunda imagem
   * 2 = terceira imagem
   * ...
   */
  @Column({
    type: "int",
    default: 0,
  })
  ordem!: number;

  /**
   * Define a imagem utilizada como capa do anúncio.
   *
   * MySQL:
   * tinyint(1)
   *
   * TypeORM:
   * boolean
   */
  @Column({
    type: "boolean",
    default: false,
  })
  principal!: boolean;

  /**
   * Data de inclusão da imagem.
   */
  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 6,
  })
  createdAt!: Date;
}

export default ClassificadoImagem;
