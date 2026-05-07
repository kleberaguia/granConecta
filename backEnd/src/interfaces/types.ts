export interface ISecao {
    id: string;
    component: string;
    tipo_secao: string;
    ordem: string;
    titulo: string;
    subtitulo: string;
    imagem_fundo: string;
    layout: string;
    conteudo_principal: string;
    imagem_principal: string;
    link_botao1: string;
    texto_botao1: string;
    link_botao2: string;
    texto_botao2: string;
    classe_css: string;

}

export interface ICards {
    id:number;
    secao_id:number;
    ordem:number;
    icone:string;
    titulo:string;
    conteudo:string;
    link_botao:string;
    texto_botao:string;
}

export interface AtualizarPerfilPrestadorDTO {
  descricao_bio: string;
  servicos_oferecidos: string[];
}