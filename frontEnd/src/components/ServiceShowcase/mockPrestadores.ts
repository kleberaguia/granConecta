/* ======================================================
   ARQUIVO: src/components/ServiceShowcase/mockPrestadores.ts
====================================================== */

/* ======================================================
   TIPOS
====================================================== */
export type PlanoPrestador = 'PREMIUM' | 'INTERMEDIARIO' | 'BASICO';

export interface PrestadorMock {
  id: number;
  nome_profissional: string;
  plano: PlanoPrestador;
  is_destaque_hero: boolean;
  foto_perfil_url: string;
  foto_hero_url: string; // Será preenchida se for Premium
  descricao_bio: string;
  servicos_oferecidos: string[];
}

/* ======================================================
   BASES DE DADOS PARA GERAÇÃO
====================================================== */
const PROFISSOES = [
  { nome: 'Pedreiro', servicos: ['Construção', 'Reformas', 'Alvenaria'] },
  { nome: 'Eletricista', servicos: ['Instalações Elétricas', 'Manutenção'] },
  { nome: 'Encanador', servicos: ['Hidráulica', 'Manutenção'] },
  { nome: 'Massagista', servicos: ['Relaxante', 'Terapêutica'] },
  { nome: 'Banho e Tosa', servicos: ['Higiene Animal', 'Pet Care'] },
  { nome: 'Empregada Doméstica', servicos: ['Limpeza', 'Organização'] },
  { nome: 'Lavadeira', servicos: ['Lavagem', 'Passadoria'] },
  { nome: 'Passeador de Pets', servicos: ['Dog Walker'] },
  { nome: 'Cabeleireiro', servicos: ['Corte', 'Escova', 'Coloração'] },
  { nome: 'Manicure', servicos: ['Manicure', 'Pedicure'] }
];

const NOMES = [
  'João', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Juliana',
  'Marcos', 'Fernanda', 'Lucas', 'Patrícia', 'Ricardo',
  'Camila', 'Bruno', 'Renata', 'Paulo', 'Sueli'
];

// === NOVO ARRAY DE IMAGENS HERO ===
// 5 Imagens variadas de alta qualidade (arquitetura, escritório, workshop, casa moderna, natureza)
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=2000', // Construção (a original)
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000', // Corporativo Moderno
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=2000', // Workshop/Técnico
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000', // Casa Moderna Iluminada
  'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?auto=format&fit=crop&q=80&w=2000', // Ambiente Externo/Jardim
];

/* ======================================================
   FUNÇÕES AUXILIARES
====================================================== */
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function planoPorIndex(index: number): PlanoPrestador {
  if (index < 50) return 'PREMIUM';          // Primeiros 50 são Premium
  if (index < 300) return 'INTERMEDIARIO';   // Próximos 250 são Intermediários
  return 'BASICO';                           // O resto é Básico
}

/* ======================================================
   GERADOR PRINCIPAL (1000 PRESTADORES)
====================================================== */
export const MOCK_PRESTADORES: PrestadorMock[] = Array.from(
  { length: 1000 },
  (_, index) => {
    const profissao = randomItem(PROFISSOES);
    const nome = randomItem(NOMES);
    const plano = planoPorIndex(index);

    return {
      id: 1000 + index,
      nome_profissional: `${nome} ${profissao.nome}`,
      plano,
      is_destaque_hero: plano === 'PREMIUM', // Simplificado: se é premium, pode ser destaque
      foto_perfil_url: `https://i.pravatar.cc/150?u=${100 + index}`,
      
      // === AQUI ESTÁ A MUDANÇA PRINCIPAL ===
      // Se for PREMIUM, escolhe uma imagem aleatória do array HERO_IMAGES.
      // Se não for, deixa vazio.
      foto_hero_url: plano === 'PREMIUM' ? randomItem(HERO_IMAGES) : '',
      
      descricao_bio: `Profissional especializado em ${profissao.nome.toLowerCase()}, com experiência e excelente atendimento. Comprometido com a qualidade e satisfação do cliente.`,
      servicos_oferecidos: [
        profissao.nome,
        ...profissao.servicos
      ]
    };
  }
);