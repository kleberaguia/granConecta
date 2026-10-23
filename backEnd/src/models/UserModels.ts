import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';

// ... mantenha seus imports ...
import { ServicoSolicitacao } from "./servicoSolicitacaoModels";
import { ServicoOferta } from "./servicoOfertaModels";
import { ServicoCandidatura } from "./servicoCandidatura";
import { Avaliacao } from './AvaliacaoModel';
import { Notificacao } from "./NotificationModel";
import { Agenda } from './AgendaModels';
import { ServicoTipo } from './ServicoTipoModels';
import { Condominio } from './condominiosModels';
import { Order } from './OrderModels';
import { PerfilPrestador } from './PerfilPrestadorModel';
import { Store } from './StoreModels';
import { Endereco } from './EnderecoModel';
import { Subscription } from './SubscriptionModel';
import { UsuarioAuth } from './UsuarioAuthModels';
import { UserStatus } from './enums';
import { Charge } from './ChargeModel';
import { CreditTransactions } from './creditTransactionsModels';
import { UserCredits } from './usercreditsModels';
import { Category } from './CategoryModels';


export type TipoUsuario = 'MORADOR' | 'PRESTADOR' | 'ADMIN' | 'EMPREENDEDOR' | 'PORTARIA' | 'VISITANTE';


export enum PlanoPrestador {
  BASICO = 'BASICO',
  INTERMEDIARIO = 'INTERMEDIARIO',
  PREMIUM = 'PREMIUM'
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string | null;

  @Column({ type: 'enum', enum: ['MORADOR', 'PRESTADOR', 'ADMIN', 'EMPREENDEDOR', 'PORTARIA', 'VISITANTE'] })
  tipo!: TipoUsuario;

  @Column({ type: "boolean", default: false })
  is_empreendedor!: boolean;


  @Column({ type: "boolean", default: false })
  is_prestador!: boolean;

  @Column({ type: 'boolean', default: true })
  is_interno!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone?: string | null;

  @Column({ type: "varchar", length: 25, nullable: true })
  documento?: string | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDENTE // ✅ Use o valor do Enum diretamente
  })
  status_conta!: UserStatus;

  @Column({ nullable: true })
  condominio_id!: string;

  @ManyToOne(() => Condominio)
  @JoinColumn({ name: 'condominio_id' })
  condominio!: Condominio;

  // RELAÇÕES
  @OneToOne(() => UsuarioAuth, (auth) => auth.usuario)
  @JoinColumn({ name: "authId" }) // O TypeORM procurará essa coluna aqui
  auth!: UsuarioAuth;

  @Column({ nullable: true })
  authId!: string;

  @OneToOne(() => Endereco, (end) => end.usuario)
  endereco?: Endereco;

  @OneToOne(() => PerfilPrestador, (perfil) => perfil.usuario)
  perfil?: PerfilPrestador;

  @OneToOne(() => Store, (store) => store.owner)
  store?: Store;

  @OneToMany(() => Subscription, (sub) => sub.usuario)
  subscriptions!: Subscription[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ServicoSolicitacao, (solicitacao) => solicitacao.morador)
  solicitacoesAbertas!: ServicoSolicitacao[];

  // Serviços que ele aceitou fazer como prestador
  @OneToMany(() => ServicoSolicitacao, (solicitacao) => solicitacao.prestador)
  servicosComoPrestador!: ServicoSolicitacao[];

  @OneToMany(() => ServicoSolicitacao, (solicitacao) => solicitacao.morador)
  servicosSolicitados!: ServicoSolicitacao[];

  @OneToMany(() => Avaliacao, (avaliacao) => avaliacao.morador)
  avaliacoesFeitas!: Avaliacao[];

  // Avaliações que o usuário recebeu (ele como prestador avaliado)
  @OneToMany(() => Avaliacao, (avaliacao) => avaliacao.prestador)
  avaliacoesRecebidas!: Avaliacao[];

  @OneToMany(() => Notificacao, (notificacao) => notificacao.usuario)
  notificacoes!: Promise<Notificacao[]>;

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Promise<Order[]>;

  @OneToMany(() => Charge, (charge) => charge.usuario)
  charges?: Charge[];

  @OneToOne(() => UserCredits, (credits) => credits.usuario)
  credits!: UserCredits;

  @OneToMany(() => CreditTransactions, (transaction) => transaction.user)
  transactions!: CreditTransactions[];

  @Column({ name: 'categoriaid', type: 'int', nullable: true })
  categoriaid?: number | null;

  // 2. Mapeamento do relacionamento para o TypeORM entender a FK
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoriaid' }) // Nome exato da coluna no banco
  categoria?: Category;
  @Column({ nullable: true })
  foto_perfil_url?: string;

  @Column({
    type: 'varchar',
    nullable: true, // 👈 ISSO AQUI permite que o campo nasça vazio (NULL)
    name: 'gateway_conta_id'
  })
  gateway_conta_id?: string | null;

  @Column({
    type: 'varchar',
    nullable: true, // 👈 ISSO AQUI permite que o campo nasça vazio (NULL)
    name: 'mercadoPagoAccessToken'
  })
  mercadoPagoAccessToken?: string | null

}