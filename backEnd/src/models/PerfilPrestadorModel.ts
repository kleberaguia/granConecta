import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    Unique,
    ManyToOne,
} from "typeorm";

import { UserStatus } from "./enums";
import { Usuario } from "./UserModels";
import { Store } from "./StoreModels";
import { Category } from "./CategoryModels";

export type CicloAssinatura =
    | "MENSAL"
    | "TRIMESTRAL"
    | "ANUAL";

export type StatusAssinatura =
    | "PENDENTE"
    | "ATIVA"
    | "A_VENCER"
    | "VENCIDA"
    | "CANCELADA";

export type PaymentStatus =
    | "PENDENTE"
    | "PROCESSANDO"
    | "PAGO"
    | "EXPIRADO"
    | "CANCELADO"
    | "ATIVO";

@Entity("perfil_prestador")
@Unique(["usuarioId", "tipo"])
export class PerfilPrestador {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        type: "varchar",
        length: 36,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
    })
    usuarioId!: string;

    @OneToOne(() => Usuario, (usuario) => usuario.perfil)
    @JoinColumn({ name: "usuarioId" })
    usuario!: Usuario;

    @Column({
        type: "varchar",
        length: 150,
    })
    nome_profissional!: string;

    @Column({
        type: "varchar",
        length: 50,
        nullable: true,
    })
    tipo?: string | null;

    @Column({
        type: "text",
        nullable: true,
    })
    descricao_bio?: string | null;

    @Column({
        type: "varchar",
        length: 550,
        nullable: true,
    })
    foto_perfil_url?: string | null;

    @Column({
        type: "varchar",
        length: 550,
        nullable: true,
    })
    foto_hero_url?: string | null;

    /*
     * Campo antigo mantido para compatibilidade.
     * Agora sempre representa o plano PREMIUM.
     */
    @Column({
        type: "varchar",
        length: 50,
        default: "PREMIUM",
        comment: "Plano contratado pelo prestador",
    })
    tipo_assinatura!: "PREMIUM";

    @Column({
        type: "boolean",
        default: false,
    })
    ativo!: boolean;

    @Column({
        type: "json",
        nullable: true,
    })
    servicos_json?: string[] | null;

    @Column({
        type: "varchar",
        length: 20,
        nullable: true,
    })
    whatsapp_comercial?: string | null;

    @Column({
        type: "int",
        default: 0,
    })
    visualizacoes!: number;

    @Column({
        type: "enum",
        enum: UserStatus,
        default: UserStatus.PENDENTE,
    })
    status!: UserStatus;

    @Column({
        type: "boolean",
        default: false,
    })
    disponivel!: boolean;

    @Column({
        type: "boolean",
        default: false,
    })
    is_destaque_hero!: boolean;

    @Column({
        type: "simple-json",
        nullable: true,
    })
    portfolio_imagens?: string[] | null;

    @Column({
        type: "simple-array",
        nullable: true,
    })
    servicos_oferecidos?: string[] | null;

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    chavePix?: string | null;

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    qrCodePixUrl?: string | null;

    /*
     * Único plano comercial disponível.
     */
    @Column({
        type: "varchar",
        length: 50,
        default: "PREMIUM",
        comment: "Plano atual do prestador",
    })
    plano!: "PREMIUM";

    /*
     * Periodicidade escolhida pelo prestador.
     */
    @Column({
        type: "enum",
        enum: ["MENSAL", "TRIMESTRAL", "ANUAL"],
        nullable: true,
        default: null,
        comment:
            "Periodicidade da assinatura: mensal, trimestral ou anual",
    })
    ciclo_assinatura?: CicloAssinatura | null;

    /*
     * Situação financeira atual da assinatura.
     */
    @Column({
        type: "enum",
        enum: [
            "PENDENTE",
            "ATIVA",
            "A_VENCER",
            "VENCIDA",
            "CANCELADA",
        ],
        default: "PENDENTE",
        comment: "Situação atual da assinatura",
    })
    status_assinatura!: StatusAssinatura;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
        comment: "Data em que começou o período atual",
    })
    assinatura_iniciada_em?: Date | null;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
        comment: "Data limite de acesso no GranConecta",
    })
    assinatura_vence_em?: Date | null;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
        comment: "Data do primeiro aviso de vencimento",
    })
    aviso_10_dias_enviado_em?: Date | null;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
        comment: "Data do segundo aviso de vencimento",
    })
    aviso_5_dias_enviado_em?: Date | null;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
        comment: "Data do aviso de assinatura vencida",
    })
    aviso_vencimento_enviado_em?: Date | null;

    @Column({
        type: "boolean",
        default: false,
        comment: "Indica bloqueio automático por vencimento",
    })
    bloqueado_por_assinatura!: boolean;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
        comment: "Última atualização do controle da assinatura",
    })
    assinatura_atualizada_em?: Date | null;

    @Column({
        type: "varchar",
        length: 20,
        default: "PENDENTE",
        name: "status_aprovacao",
    })
    status_aprovacao!: string;

    @Column({
        type: "int",
        nullable: true,
        name: "categoriaid",
    })
    categoriaid?: number | null;

    @ManyToOne(() => Category, {
        nullable: true,
    })
    @JoinColumn({ name: "categoriaid" })
    categoriaidoPrincipal?: Category | null;

    @OneToOne(() => Store, (store) => store.owner)
    store?: Store;

    @Column({
        type: "text",
        nullable: true,
    })
    mini_bio?: string | null;

    @Column({
        type: "varchar",
        length: 30,
        default: "PENDENTE",
    })
    payment_status!: PaymentStatus;

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    checkout_session_id?: string | null;

    @Column({
        type: "text",
        nullable: true,
    })
    checkout_url?: string | null;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
    })
    checkout_expira_em?: Date | null;

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
        unique: true,
    })
    subscription_id?: string | null;

    @Column({
        type: "varchar",
        length: 50,
        nullable: true,
        default: "MERCADO_PAGO",
    })
    payment_gateway?: string | null;

    /*
     * Próxima renovação informada pelo Mercado Pago.
     */
    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
    })
    subscription_renews_at?: Date | null;

    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
    })
    subscription_cancelled_at?: Date | null;
}