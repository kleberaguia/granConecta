import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Unique, ManyToOne } from 'typeorm';
import { UserStatus } from "./enums";
import { Usuario } from './UserModels';
import { ServicoTipo } from './ServicoTipoModels';
import { Store } from './StoreModels';
import { Category } from './CategoryModels';

@Entity('perfil_prestador')
@Unique(['usuarioId', 'tipo'])
export class PerfilPrestador {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    usuarioId!: string;

    @OneToOne(() => Usuario, (u) => u.perfil)
    @JoinColumn({ name: 'usuarioId' })
    usuario!: Usuario;

    @Column({ length: 150 })
    nome_profissional!: string;

    @Column({ length: 50 })
    tipo!: string;


    @Column({ type: 'text', nullable: true })
    descricao_bio?: string;

    @Column({ length: 550, nullable: true })
    foto_perfil_url?: string;

    @Column({ length: 550, nullable: true })
    foto_hero_url?: string;

    // --- NOVOS CAMPOS DE ASSINATURA E CONTROLE ---


    @Column({ type: 'boolean', default: false })
    ativo!: boolean; // ✅ Adicionado para o prestador ligar/desligar o perfil na vitrine

    // --------------------------------------------

    @Column({ type: 'json', nullable: true })
    servicos_json?: string[];

    @Column({ length: 20, nullable: true })
    whatsapp_comercial?: string;

    @Column({ type: 'int', default: 0 })
    visualizacoes!: number;

    @Column({
        type: "enum",
        enum: UserStatus,
        default: UserStatus.PENDENTE
    })
    status!: UserStatus;

    @Column({ type: "boolean", default: false })
    disponivel!: boolean; // Indica se o Admin liberou o perfil

    @Column({ type: 'boolean', default: false })
    is_destaque_hero!: boolean;

    @Column({ type: 'simple-json', nullable: true })
    portfolio_imagens!: string[];

    @Column({ type: 'simple-array', nullable: true })
    servicos_oferecidos!: string[];

    @Column({ nullable: true })
    chavePix?: string;

    @Column({ nullable: true })
    qrCodePixUrl?: string;

    //olha isso
    @Column({
        type: 'enum',
        enum: ['BASICO', 'INTERMEDIARIO', 'PREMIUM'],
        default: 'BASICO'
    })
    plano!: 'BASICO' | 'INTERMEDIARIO' | 'PREMIUM';

    @Column({
        type: 'enum',
        enum: ['MENSAL', 'ANUAL'],
        default: 'MENSAL'
    })
    tipo_assinatura!: 'MENSAL' | 'ANUAL';

    @Column({
        type: 'varchar',
        length: 20,
        default: 'PENDENTE',
        name: 'status_aprovacao' // ✅ Nome exato que você usou no SQL do confirmarPagamento
    })
    status_aprovacao!: string;

    @Column({
        type: 'varchar',
        length: 30,
        default: 'PENDENTE'
    })
    payment_status!: 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'EXPIRADO' | 'CANCELADO' | 'ATIVO';


    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    checkout_session_id?: string;


    @Column({
        type: 'text',
        nullable: true
    })
    checkout_url?: string;


    @Column({
        type: 'timestamp',
        nullable: true
    })
    checkout_expira_em?: Date;


    @Column({ name: "categoriaid", nullable: true })
    categoriaid!: number;

    // 2. A propriedade que representa a Relação (Objeto)
    @ManyToOne(() => Category)
    @JoinColumn({ name: "categoriaid" }) // Aponta para a coluna acima
    categoriaidoPrincipal!: Category;

    @OneToOne(() => Store, (store) => store.owner)
    store?: Store;

    @Column({ type: "text", nullable: true })
    mini_bio?: string;

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
        unique: true
    })
    subscription_id?: string;

    @Column({
        type: "varchar",
        length: 50,
        nullable: true,
        default: "MERCADO_PAGO"
    })
    payment_gateway?: string;

    @Column({
        type: "timestamp",
        nullable: true
    })
    subscription_renews_at?: Date;

    @Column({
        type: "timestamp",
        nullable: true
    })
    subscription_cancelled_at?: Date;



}