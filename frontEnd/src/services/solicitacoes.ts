import api from '../api/api';

// Tipos
export interface Solicitacao {
  id: string;
  titulo: string;
  estado: string;
  valorAcordado?: number;
  dataAgendada?: string;
}

export interface Proposta {
  id: string;
  valor: number;
  mensagem?: string;
  autor: 'MORADOR' | 'PRESTADOR';
  createdAt: string;
}

// Endpoints
export const getSolicitacoes = async (): Promise<Solicitacao[]> => {
  const { data } = await api.get('/solicitacoes');
  return data;
};

export const getSolicitacaoById = async (id: string): Promise<Solicitacao> => {
  const { data } = await api.get(`/solicitacoes/${id}`);
  return data;
};

export const criarSolicitacao = async (payload: Partial<Solicitacao>) => {
  const { data } = await api.post('/solicitacoes', payload);
  return data;
};

export const enviarProposta = async (solicitacaoId: string, payload: Partial<Proposta>) => {
  const { data } = await api.post(`/solicitacoes/${solicitacaoId}/propostas`, payload);
  return data;
};

export const agendarServico = async (solicitacaoId: string, dataAgendada: string) => {
  const { data } = await api.post(`/solicitacoes/${solicitacaoId}/agendamento`, { dataAgendada });
  return data;
};

export const finalizarServico = async (solicitacaoId: string) => {
  const { data } = await api.post(`/solicitacoes/${solicitacaoId}/finalizar`);
  return data;
};

export const efetuarPagamento = async (solicitacaoId: string) => {
  const { data } = await api.post(`/solicitacoes/${solicitacaoId}/pagamento`);
  return data;
};

export const avaliarServico = async (solicitacaoId: string, nota: number, comentario?: string) => {
  const { data } = await api.post(`/solicitacoes/${solicitacaoId}/avaliacao`, { nota, comentario });
  return data;
};
