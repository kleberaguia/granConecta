export const TODOS_RECURSOS = [
    { key: 'visibilidade', texto: 'Visibilidade no Condomínio' },
    { key: 'categoria', texto: 'Destaque na Categoria' },
    { key: 'perfil', texto: 'Perfil Profissional Completo' },
    { key: 'fotos', texto: 'Galeria de Fotos Ilimitada' },
    { key: 'suporte', texto: 'Suporte Prioritário 24h' },
    { key: 'landing', texto: 'Landing Page Customizada' },
    { key: 'topo', texto: 'Topo dos Resultados' },
    { key: 'selo', texto: 'Selo de Verificado' },
    { key: 'stats', texto: 'Estatísticas de Acesso' },
];

export const PLANOS_LOJA = [
    {
        id: 'BASICO',
        titulo: 'Básico',
        precoMensal: 29.90,
        precoAnual: 238.80,
        desc: 'O essencial para ser visto no condomínio.',
        vantagens: ['visibilidade', 'categoria', 'perfil'],
        destaque: false
    },
    {
        id: 'INTERMEDIARIO',
        titulo: 'Intermediário',
        precoMensal: 55.90,
        precoAnual: 478.80,
        desc: 'Destaque visual e ferramentas de conversão.',
        vantagens: ['visibilidade', 'categoria', 'perfil', 'fotos', 'selo'],
        destaque: true
    },
    {
        id: 'PREMIUM',
        titulo: 'Premium',
        precoMensal: 98.90,
        precoAnual: 946.80,
        desc: 'Domine sua categoria com prioridade total.',
        vantagens: ['visibilidade', 'categoria', 'perfil', 'fotos', 'landing', 'topo', 'selo', 'suporte', 'stats'],
        destaque: false
    }
];

export const PLANOS_PRESTADOR = [
    {
        id: 'BASICO',
        titulo: 'Bronze',
        precoMensal: 19.90,
        precoAnual: 191.00,
        desc: 'Para quem está começando.',
        vantagens: ['visibilidade', 'perfil'],
        destaque: false
    },
    {
        id: 'INTERMEDIARIO',
        titulo: 'Prata',
        precoMensal: 39.90,
        precoAnual: 383.00,
        desc: 'Melhor custo-benefício.',
        vantagens: ['visibilidade', 'perfil', 'fotos', 'selo'],
        destaque: true
    },
    {
        id: 'PREMIUM',
        titulo: 'Ouro',
        precoMensal: 75.00,
        precoAnual: 720.00,
        desc: 'Destaque máximo e suporte.',
        vantagens: ['visibilidade', 'perfil', 'fotos', 'selo', 'suporte', 'topo'],
        destaque: false
    }
];