// Tipos auxiliares
export type TipoUsuario = 'MORADOR' | 'PRESTADOR';

export type StatusServico =
  | 'BUSCANDO_PRESTADOR'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'ACEITO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type FormaPagamento = 'PIX' | 'CARTAO' | 'DINHEIRO' | 'BOLETO';

export type StatusParcela = 'PENDENTE' | 'PAGA' | 'ATRASADA';

export interface IBaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Morador – usuário que contrata serviços
 */
export interface IMorador extends IBaseEntity {
  tipo: 'MORADOR';
  nome: string;
  email: string;
  telefone?: string;
  bloco?: string;
  apartamento?: string;
}

/**
 * Prestador – pode ser morador ou externo
 */
export interface IPrestador extends IBaseEntity {
  tipo: 'PRESTADOR';
  nome: string;
  email: string;
  telefone?: string;
  documento?: string; // CPF/CNPJ
  descricao_bio?: string;
  ehMorador?: boolean;
  bloco?: string | null;
  apartamento?: string | null;

  // Disponibilidade para receber chamadas tipo Uber
  disponivel: boolean;
  servicos_oferecidos: string[]; // ['encanador','eletricista'] - slugs/categorias
  foto_perfil_url?: string | null;
  portfolio_imagens?: string[]; // URLs de trabalhos
}

/**
 * Serviço (tipo Uber job)
 */
export interface IServico extends IBaseEntity {
  usuarioId: string;
  prestadorId?: string | null;

  categoria_slug: string; // ex: 'encanador'
  titulo: string;
  descricao: string;

  status: StatusServico;

  valor_sugerido?: number | null;
  valor_negociado?: number | null;

  // Endereço/local dentro do condomínio
  bloco?: string;
  apartamento?: string;
  observacoes?: string;

  // Controle de tempo
  data_solicitacao: string;
  start_date?: string | null;
  data_conclusao?: string | null;

  // Para exibir no app
  morador?: IMorador;
  prestador?: IPrestador;
  parcelas?: IParcela[];
  avaliacao?: IAvaliacao;
}

/**
 * Parcela ligada a um serviço
 */
export interface IParcela extends IBaseEntity {
  servicoId: string;
  numeroParcela: number;   // 1,2,3...
  valor: number;
  vencimento: string;
  status: StatusParcela;
}

/**
 * Avaliação do serviço
 */
export interface IAvaliacao extends IBaseEntity {
  servicoId: string;
  usuarioId: string;
  prestadorId: string;
  nota: number; // 1–5
  comentario?: string;
}

export interface IDashboardStats {
  ativos: number;
  pendentes: number;
  receita: number;
  creditos_totais: number;
  receita_mensal: number;
  qtd_mensal: number;
  receita_anual: Number;
  qtd_anual: Number;

}

export interface IAdminAssinatura {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  foto_perfil_url?: string;
  plano: 'BASICO' | 'INTERMEDIARIO' | 'PREMIUM';
  status_pagamento: 'active' | 'pending' | 'past_due' | 'canceled';
  data_vencimento: Date;
}
