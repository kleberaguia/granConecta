import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";

import { Endereco } from "./EnderecoModel";
import { PostTarget } from "./PostTargetModels";

/**
 * Status de validação cadastral do condomínio.
 *
 * PENDENTE_VALIDACAO:
 * condomínio informado/cadastrado, mas ainda não validado.
 *
 * VERIFICADO:
 * condomínio conferido pelo GranConecta.
 *
 * REJEITADO:
 * cadastro analisado e considerado inválido.
 */
export enum CondominioStatusValidacao {
  PENDENTE_VALIDACAO = "PENDENTE_VALIDACAO",
  VERIFICADO = "VERIFICADO",
  REJEITADO = "REJEITADO",
}

/**
 * Situação da geocodificação.
 *
 * A geocodificação não deve impedir o cadastro.
 * Caso o serviço externo falhe, podemos tentar novamente depois.
 */
export enum CondominioGeocodingStatus {
  PENDENTE = "PENDENTE",
  LOCALIZADO = "LOCALIZADO",
  FALHOU = "FALHOU",
}

/**
 * Precisão/origem das coordenadas armazenadas.
 */
export enum CondominioGeocodingPrecision {
  NENHUMA = "NENHUMA",
  CEP = "CEP",
  ENDERECO = "ENDERECO",
}

@Entity("condominios")
export class Condominio {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  nome!: string;

  /**
   * Mantido por compatibilidade com o fluxo antigo
   * de cadastro/validação de condomínio.
   *
   * Não confundir com:
   * - código da unidade;
   * - código de verificação;
   * - código 2FA.
   */
  @Column({
    type: "varchar",
    length: 255,
    unique: true,
  })
  codigo_acesso!: string;

  /**
   * Sigla curta e única.
   *
   * Exemplo:
   * Chácara das Flores -> CHF
   *
   * Será utilizada posteriormente na composição:
   * CHF-T2-1801
   */
  @Index("IDX_condominios_sigla", {
    unique: true,
  })
  @Column({
    type: "varchar",
    length: 12,
    nullable: true,
  })
  sigla!: string | null;

  /**
   * CEP armazenado somente com números.
   *
   * Exemplo:
   * 01234567
   */
  @Index("IDX_condominios_cep")
  @Column({
    type: "varchar",
    length: 8,
    nullable: true,
  })
  cep!: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  logradouro!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  numero!: string | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  complemento!: string | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  bairro!: string | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  cidade!: string | null;

  @Column({
    type: "varchar",
    length: 2,
    nullable: true,
  })
  uf!: string | null;

  /**
   * DECIMAL do MySQL normalmente é retornado
   * pelo driver como string.
   *
   * As coordenadas não precisam ser mostradas
   * ao usuário no formulário.
   */
  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude!: string | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude!: string | null;

  @Column({
    type: "enum",
    enum: CondominioStatusValidacao,
    default: CondominioStatusValidacao.PENDENTE_VALIDACAO,
  })
  status_validacao!: CondominioStatusValidacao;

  @Column({
    type: "enum",
    enum: CondominioGeocodingStatus,
    default: CondominioGeocodingStatus.PENDENTE,
  })
  geocoding_status!: CondominioGeocodingStatus;

  @Column({
    type: "enum",
    enum: CondominioGeocodingPrecision,
    default: CondominioGeocodingPrecision.NENHUMA,
  })
  geocoding_precision!: CondominioGeocodingPrecision;

  /**
   * ============================================================
   * RELAÇÕES EXISTENTES
   * ============================================================
   *
   * Estas relações são importantes para preservar funcionalidades
   * que já existiam antes da evolução do cadastro de condomínio.
   */

  /**
   * Um condomínio pode aparecer em vários registros de endereço.
   *
   * Endereco possui:
   *
   * @ManyToOne(() => Condominio)
   *
   * portanto o lado inverso aqui é OneToMany.
   *
   * Mantemos o nome "endereco" porque ListCondominioService
   * já utiliza relations: { endereco: true }.
   */
  @OneToMany(
    () => Endereco,
    (endereco) => endereco.condominio
  )
  endereco!: Endereco[];

  /**
   * Relação inversa usada por PostTarget:
   *
   * @ManyToOne(
   *   () => Condominio,
   *   (condominio) => condominio.postTargets
   * )
   */
  @OneToMany(
    () => PostTarget,
    (postTarget) => postTarget.condominio
  )
  postTargets!: PostTarget[];

  /**
   * Campos existentes na tabela original.
   *
   * O banco utiliza DATETIME(6), portanto mantemos
   * precision: 6 para refletir exatamente a estrutura.
   */
  @CreateDateColumn({
    type: "datetime",
    precision: 6,
    name: "created_at",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "datetime",
    precision: 6,
    name: "updated_at",
  })
  updated_at!: Date;
}

export default Condominio;