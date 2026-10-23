import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column } from "typeorm";
import { Usuario } from "./UserModels";
import { ServicoSolicitacao } from "./servicoSolicitacaoModels";

@Entity("servico_ignorado")
export class ServicoIgnorado {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    prestadorId!: string;

    @Column()
    solicitacaoId!: number;

    @ManyToOne(() => Usuario)
    prestador!: Usuario;

    @ManyToOne(() => ServicoSolicitacao)
    solicitacao!: ServicoSolicitacao;

    @CreateDateColumn()
    data_rejeicao!: Date;
}