import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("estilos")
export class Estilo {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    nome_estilo!: string;

    @Column("text", { nullable: true })
    descricao!: string;

    // Body
    @Column({ nullable: true })
    body_bg!: string;
    @Column({ nullable: true })
    body_font!: string;
    @Column({ nullable: true })
    body_text_color!: string;
    borderColor!: string;

    // Tipografia responsiva
    @Column({ nullable: true })
    heading_font!: string;
    @Column({ nullable: true })
    paragraph_font!: string;
    @Column({ nullable: true })
    heading_size!: string;
    @Column({ nullable: true })
    paragraph_size!: string;

    // Imagens
    @Column({ nullable: true })
    image_style!: string;

    // Formulários
    @Column({ nullable: true })
    form_bg!: string;
    @Column({ nullable: true })
    form_text_color!: string;
    @Column({ nullable: true })
    form_accent_color!: string;
    @Column({ nullable: true })
    form_radius!: string;

    // Grids e tabelas
    @Column({ nullable: true })
    grid_gap!: string;
    @Column({ nullable: true })
    grid_columns!: string;
    @Column({ nullable: true })
    table_style!: string;

    // CTAs
    @Column({ nullable: true })
    cta_bg!: string;
    @Column({ nullable: true })
    cta_text_color!: string;
    @Column({ nullable: true })
    cta_radius!: string;
    @Column({ nullable: true })
    cta_hover!: string;

    // Testemunhos
    @Column({ nullable: true })
    testimonial_bg!: string;
    @Column({ nullable: true })
    testimonial_text_color!: string;
    @Column({ nullable: true })
    testimonial_card_style!: string;

    // Galerias
    @Column({ nullable: true })
    gallery_layout!: string;
    @Column({ nullable: true })
    gallery_gap!: string;
    @Column({ nullable: true })
    gallery_border!: string;

    // Vitrines
    @Column({ nullable: true })
    showcase_bg!: string;
    @Column({ nullable: true })
    showcase_card_style!: string;
    @Column({ nullable: true })
    showcase_price_color!: string;

    // Espaços de respiro
    @Column({ nullable: true })
    spacing_small!: string;
    @Column({ nullable: true })
    spacing_medium!: string;
    @Column({ nullable: true })
    spacing_large!: string;

    // Paleta de cores
    @Column({ nullable: true })
    primary_color!: string;
    @Column({ nullable: true })
    secondary_color!: string;
    @Column({ nullable: true })
    accent_color!: string;

    // Bordas
    @Column({ nullable: true })
    border_style!: string;

    // Animações
    @Column({ nullable: true })
    animation_entry!: string;
    @Column({ nullable: true })
    animation_hover!: string;

    // 🔥 Novos campos para Header e Sidebar
    @Column({ nullable: true })
    header_bg!: string;
    @Column({ nullable: true })
    header_text_color!: string;
    @Column({ nullable: true })
    sidebar_bg!: string;
    @Column({ nullable: true })
    sidebar_text_color!: string;

    @CreateDateColumn()
    criado_em!: Date;

    @UpdateDateColumn()
    atualizado_em!: Date;
}
