import { useMemo } from 'react';

export type PerfilLojaTipo = 'DELIVERY' | 'PRODUTO' | 'SERVICO';

interface ContextoResultado {
  abaPedidosLabel: string;
  buscarPlaceholder: string;
  etapaInicialLabel: string;
  etapaAndamentoLabel: string;
  etapaLogisticaLabel: string;
  botaoAcaoPrincipal: string;
}

interface ControleContextoProps {
  categoriaTipo?: string;
  categoria?: string;
  businessType?: string;
}

export function useContextoLoja(perfil: ControleContextoProps): ContextoResultado {
  return useMemo(() => {
    const valor = perfil?.categoriaTipo || perfil?.categoria || perfil?.businessType || "";
    const cat = String(valor).trim().toUpperCase();

    // Listas de Categorias Semânticas
    const listaDelivery = ['FOOD', 'BEBIDA', 'SOBREMESA', 'HAMBURGUERIA', 'PIZZARIA', 'LANCHONETE'];
    const listaProdutos = ['PRODUTO', 'LOJA', 'AUTOMOTIVO', 'ARTESANATO', 'VESTUARIO'];

    let tipo: PerfilLojaTipo = 'SERVICO';

    if (listaDelivery.includes(cat)) {
      tipo = 'DELIVERY';
    } else if (listaProdutos.includes(cat)) {
      tipo = 'PRODUTO';
    }

    // Dicionário de Vocabulário Dinâmico
    const dicionario: Record<PerfilLojaTipo, ContextoResultado> = {
      DELIVERY: {
        abaPedidosLabel: "Gerenciar Lanches",
        buscarPlaceholder: "🔎 Buscar por lanche ou número do pedido...",
        etapaInicialLabel: "1. NOVOS PEDIDOS",
        etapaAndamentoLabel: "2. NA COZINHA",
        etapaLogisticaLabel: "3. EXPEDIÇÃO MOTOBOY",
        botaoAcaoPrincipal: "Aceitar e Preparar"
      },
      PRODUTO: {
        abaPedidosLabel: "Controle de Vendas",
        buscarPlaceholder: "🔎 Buscar por código, produto ou comprador...",
        etapaInicialLabel: "1. NOVAS VENDAS",
        etapaAndamentoLabel: "2. SEPARAÇÃO DE ESTOQUE",
        etapaLogisticaLabel: "3. LOGÍSTICA DE RETIRADA",
        botaoAcaoPrincipal: "Separar Mercadoria"
      },
      SERVICO: {
        abaPedidosLabel: "Ordens de Serviço",
        buscarPlaceholder: "🔎 Buscar por cliente ou agendamento...",
        etapaInicialLabel: "1. NOVOS CONTRATOS",
        etapaAndamentoLabel: "2. ATENDIMENTO ATIVO",
        etapaLogisticaLabel: "3. CRONOGRAMA FINALIZADO",
        botaoAcaoPrincipal: "Ativar Agenda Técnica"
      }
    };

    return dicionario[tipo];
  }, [perfil]);
}