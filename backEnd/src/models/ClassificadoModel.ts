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
import { Condominio } from "./condominiosModels";
import { ClassificadoCredito } from "./ClassificadoCreditoModel";

/**
 * Categorias disponíveis para anúncios eventuais
 * nos Classificados GranConecta.
 */
export enum ClassificadoCategoria {
  ELETRONICOS = "ELETRONICOS",
  INFORMATICA = "INFORMATICA",
  CELULARES = "CELULARES",
  MOVEIS = "MOVEIS",
  ELETRODOMESTICOS = "ELETRODOMESTICOS",
  CASA = "CASA",
  INFANTIL = "INFANTIL",
  ESPORTES = "ESPORTES",
  BICICLETAS = "BICICLETAS",
  VEICULOS = "VEICULOS",
  LIVROS = "LIVROS",
  MODA = "MODA",
  OUTROS = "OUTROS",
}

/**
 * Estado de conservação informado pelo morador.
 */
export enum ClassificadoCondicao {
  NOVO = "NOVO",
  SEMINOVO = "SEMINOVO",
  USADO = "USADO",
}

/**
 * Ciclo de vida do anúncio.
 *
 * IMPORTANTE:
 * O frontend nunca deverá poder transformar diretamente
 * um anúncio em ATIVO.
 *
 * A publicação será controlada pelo backend e,
 * posteriormente, pela confirmação do pagamento.
 */
export enum ClassificadoStatus {
  RASCUNHO = "RASCUNHO",
  AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO",
  PAGO = "PAGO",
  EM_ANALISE = "EM_ANALISE",
  ATIVO = "ATIVO",
  RESERVADO = "RESERVADO",
  VENDIDO = "VENDIDO",
  EXPIRADO = "EXPIRADO",
  CANCELADO = "CANCELADO",
  REJEITADO = "REJEITADO",
  BLOQUEADO_COMERCIAL = "BLOQUEADO_COMERCIAL",
}

/**
 * Modalidade comercial do anúncio.
 *
 * Os valores e duração NÃO ficam definidos no enum.
 * Eles serão controlados pelo serviço comercial.
 */
export enum ClassificadoPlanoAnuncio {
  SIMPLES = "SIMPLES",
  DESTAQUE = "DESTAQUE",
  PREMIUM = "PREMIUM",
}

/**
 * Origem/precisão da localização utilizada pelo anúncio.
 *
 * As coordenadas são utilizadas internamente para
 * proximidade. Não significam que o endereço completo
 * poderá ser exibido publicamente.
 */
export enum ClassificadoLocalizacaoPrecision {
  NENHUMA = "NENHUMA",
  CONDOMINIO = "CONDOMINIO",
  CEP = "CEP",
  ENDERECO = "ENDERECO",
}

@Entity("classificados")
@Index("IDX_classificados_usuario", ["usuarioId"])
@Index("IDX_classificados_condominio", ["condominioId"])
@Index("IDX_classificados_status", ["status"])
@Index("IDX_classificados_categoria", ["categoria"])
@Index("IDX_classificados_publicado", ["publicadoEm"])
@Index("IDX_classificados_expira", ["expiraEm"])
@Index(
  "IDX_classificados_usuario_created",
  ["usuarioId", "createdAt"]
)
@Index(
  "IDX_classificados_geo",
  ["latitude", "longitude"]
)

@Index(
  "IDX_classificados_credito",
  ["creditoId"]
)
export class Classificado {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Proprietário do anúncio.
   */
  @Column({
    name: "usuario_id",
    type: "varchar",
    length: 36,
  })
  usuarioId!: string;

  @ManyToOne(() => Usuario, {
    nullable: false,
    onDelete: "NO ACTION",
  })
  @JoinColumn({
    name: "usuario_id",
  })
  usuario!: Usuario;

  /**
   * Condomínio do morador no momento da criação.
   *
   * Pode ser NULL, por exemplo, caso futuramente o
   * GranConecta permita classificados para usuários
   * externos.
   */
  @Column({
    name: "condominio_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  condominioId!: string | null;

  @ManyToOne(() => Condominio, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "condominio_id",
  })
  condominio!: Condominio | null;

  @Column({
    type: "varchar",
    length: 160,
  })
  titulo!: string;

  @Column({
    type: "text",
  })
  descricao!: string;

  @Column({
    type: "enum",
    enum: ClassificadoCategoria,
  })
  categoria!: ClassificadoCategoria;

  @Column({
    type: "enum",
    enum: ClassificadoCondicao,
  })
  condicao!: ClassificadoCondicao;

  /**
   * DECIMAL normalmente é retornado como string
   * pelo driver MySQL.
   */
  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
  })
  preco!: string;

  @Column({
    type: "enum",
    enum: ClassificadoStatus,
    default: ClassificadoStatus.RASCUNHO,
  })
  status!: ClassificadoStatus;

  @Column({
    name: "plano_anuncio",
    type: "enum",
    enum: ClassificadoPlanoAnuncio,
    nullable: true,
  })
  planoAnuncio!: ClassificadoPlanoAnuncio | null;

  @Column({
    name: "valor_anuncio",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  valorAnuncio!: string | null;

  @Column({
    name: "duracao_dias",
    type: "int",
    nullable: true,
  })
  duracaoDias!: number | null;

  /**
 * ============================================================
 * CRÉDITO DO CLASSIFICADO
 * ============================================================
 *
 * Crédito atualmente utilizado por este anúncio.
 *
 * O crédito pertence ao usuário e pode ter saldo reaproveitado
 * quando o anúncio for encerrado antes do fim do período.
 *
 * Exemplo:
 *
 * crédito = 30 dias
 * anúncio vendido após 3 dias
 *
 * resultado:
 * 3 dias consumidos
 * 27 dias restantes no crédito
 */
  @Column({
    name: "credito_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  creditoId!: string | null;

  /**
   * Relação com a carteira/crédito utilizado pelo anúncio.
   *
   * SET NULL:
   * caso o crédito deixe de existir, preservamos o histórico
   * do classificado.
   */
  @ManyToOne(
    () => ClassificadoCredito,
    {
      nullable: true,
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    }
  )
  @JoinColumn({
    name: "credito_id",
  })
  credito!: ClassificadoCredito | null;

  /**
   * ============================================================
   * PAGAMENTO
   * ============================================================
   */

  @Column({
    name: "payment_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  paymentId!: string | null;

  @Column({
    name: "payment_status",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  paymentStatus!: string | null;

  @Column({
    name: "checkout_session_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  checkoutSessionId!: string | null;

  @Column({
    name: "checkout_url",
    type: "text",
    nullable: true,
  })
  checkoutUrl!: string | null;

  /**
   * ============================================================
   * DATAS DO CICLO DE VIDA
   * ============================================================
   */

  @Column({
    name: "pago_em",
    type: "datetime",
    nullable: true,
  })
  pagoEm!: Date | null;

  @Column({
    name: "publicado_em",
    type: "datetime",
    nullable: true,
  })
  publicadoEm!: Date | null;

  @Column({
    name: "expira_em",
    type: "datetime",
    nullable: true,
  })
  expiraEm!: Date | null;

  @Column({
    name: "reservado_em",
    type: "datetime",
    nullable: true,
  })
  reservadoEm!: Date | null;

  @Column({
    name: "vendido_em",
    type: "datetime",
    nullable: true,
  })
  vendidoEm!: Date | null;

  @Column({
    type: "int",
    default: 0,
  })
  visualizacoes!: number;

  /**
   * ============================================================
   * LOCALIZAÇÃO
   * ============================================================
   *
   * Essas coordenadas serão usadas para busca por proximidade.
   *
   * Não devemos retornar coordenadas exatas ao público.
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
    name: "localizacao_precision",
    type: "enum",
    enum: ClassificadoLocalizacaoPrecision,
    default: ClassificadoLocalizacaoPrecision.NENHUMA,
  })
  localizacaoPrecision!: ClassificadoLocalizacaoPrecision;

  /**
   * ============================================================
   * AUDITORIA
   * ============================================================
   */

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 6,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
    precision: 6,
  })
  updatedAt!: Date;
}

export default Classificado;