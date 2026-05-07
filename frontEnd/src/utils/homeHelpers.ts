import { slugify } from "./slugify";

// 1. DICIONÁRIO DE IMAGENS
// const CATEGORIA_IMAGENS: Record<string, string> = {
//   "hamburguer": "/uploads/cat/hamburguer.webp",
//   "pizza": "/uploads/cat/pizza.webp",
//   "lanches": "/uploads/cat/lanches.webp",
//   "porcoes": "/uploads/cat/porcoes.webp",
//   "pratos-executivos": "/uploads/cat/pratos.webp",
//   "marmitas": "/uploads/cat/marmitas.webp",
//   "comida-japonesa": "/uploads/cat/japonesa.webp",
//   "comida-italiana": "/uploads/cat/italiana.webp",
//   "churrasco": "/uploads/cat/churrasco.webp",
//   "pastelaria": "/uploads/cat/pastel.webp",
//   "refrigerantes": "/uploads/cat/refri.webp",
//   "sucos-naturais": "/uploads/cat/sucos.webp",
//   "vitaminas": "/uploads/cat/vitaminas.webp",
//   "cafes": "/uploads/cat/cafes.webp",
//   "chas": "/uploads/cat/chas.webp",
//   "bebidas-alcoolicas": "/uploads/cat/bebidas.webp",
//   "drinks": "/uploads/cat/drinks.webp",
//   "doces": "/uploads/cat/doces.webp",
//   "bolos": "/uploads/cat/bolos.webp",
//   "tortas": "/uploads/cat/tortas.webp",
//   "acai": "/uploads/cat/acai.webp",
//   "sorvetes": "/uploads/cat/sorvetes.webp",
//   "confeitaria": "/uploads/cat/confeitaria.webp",
//   "cabelo": "/uploads/cat/cabelo.webp",
//   "barbearia": "/uploads/cat/barbearia.webp",
//   "manicure-e-pedicure": "/uploads/cat/manicure.webp",
//   "estetica-facial": "/uploads/cat/estetica.webp",
//   "maquiagem": "/uploads/cat/maquiagem.webp",
//   "cosmeticos": "/uploads/cat/cosmeticos.webp",
//   "eletricista": "/uploads/cat/eletricista.webp",
//   "encanador": "/uploads/cat/encanador.webp",
//   "diarista": "/uploads/cat/diarista.webp",
//   "limpeza-residencial": "/uploads/cat/limpeza.webp",
//   "manutencao-de-ar-condicionado": "/uploads/cat/ar.webp",
//   "fretes-e-mudancas": "/uploads/cat/frete.webp",
//   "pedreiro": "/uploads/cat/pedreiro.webp",
//   "padaria": "/uploads/cat/padaria.webp",
//   "pet-shop": "/uploads/cat/petshop.webp",
//   "passeador-de-pets": "/uploads/cat/dogwalker.webp",
//   "banho-e-tosa": "/uploads/cat/banho-tosa.webp",
//   "psicologia": "/uploads/cat/psicologia.webp",
//   "artesanato": "/uploads/cat/artesanato.webp",
//   "pecas-automotivas": "/uploads/cat/pecasAutomotivas.webp",
//   "oficina-mecanica": "/uploads/cat/oficinamecanica.webp",
//   "gastronomia": "/uploads/cat/gastronomia.webp",
//   "automotivo": "/uploads/cat/automotivo.webp",
//   "lojas-e-variedades": "/uploads/cat/lojas.webp",
//   "pedagogia": "/uploads/cat/pedagogia.webp",

  
// };

const IMAGEM_DEFAULT = "/uploads/cat/default_placeholder.webp";
const normalizarCard = (item: any) => {
  const nome =
    item.categoria_nome ||
    item.profissao ||
    item.categoria?.name ||
    item.nome ||
    item.name ||
    "Item";

  const slug = item.slug || slugify(nome);
  const imagem = 
    item.urlCategoria || 
    item.imagem_url || 
    item.foto_url || 
    IMAGEM_DEFAULT;

 return {
    id: item.id ?? `gen-${slug}`,
    slug,
    titulo: nome,
    descricao_curta:
      item.descricao_curta ||
      item.descricao ||
      "Profissionais disponíveis.",
    imagem_url: imagem,
    link_botao: item.link_botao || "",
    cor_card: item.cor_card || "#3b82f6",
    iniciais:
      item.iniciais ||
      nome.substring(0, 2).toUpperCase(),
    href: item.href || `/servicos/${slug}`,
    badge: item.badge || "",
    icone: item.icone || null,
    style_overrides: item.style_overrides || {},
    texto_botao: item.texto_botao || "Ver prestadores",
    tipo_conteudo: item.tipo_conteudo || "categoria_servico",
  };
};

export const unificarHome = (
  secoesManuais: any[],
  gruposDoBanco: any[],
  todasCategorias: any[]
) => {
  const homeFinal = Array.isArray(secoesManuais) ? [...secoesManuais] : [];
  const categoriasSeguras = Array.isArray(todasCategorias) ? todasCategorias : [];
  const gruposOrdenados = Array.isArray(gruposDoBanco) ? [...gruposDoBanco] : [];

  const slugsProcessados = new Set();
  const gruposSeguros: any[] = [];

  // 1. Filtrar grupos que possuem itens
  gruposOrdenados.forEach((grupo) => {
    if (slugsProcessados.has(grupo.slug)) return;
    const temItens = categoriasSeguras.some(cat => {
      const catGrupoId = cat.grupo_id || cat.categoriaid || cat.grupoId;
      return Number(catGrupoId) === Number(grupo.id);
    });
    if (temItens) {
      gruposSeguros.push(grupo);
      slugsProcessados.add(grupo.slug);
    }
  });

  // 2. Processar cada grupo para gerar carrosséis
  gruposSeguros.forEach((grupo, index) => {
    const itensDesteGrupo = categoriasSeguras.filter(cat => {
      const catGrupoId = cat.grupo_id || cat.categoriaid || cat.grupoId;
      const pertenceAoGrupo = Number(catGrupoId) === Number(grupo.id);
      
      // Filtro para garantir que mostramos categorias ativas e do tipo correto
      const tipoBruto = String(cat.tipo || "").toLowerCase();
      const isServico = tipoBruto.includes("servi") || cat.is_servico === true;
     // const isLoja = tipoBruto.includes("loja");

      return pertenceAoGrupo && isServico ;
    });

    if (itensDesteGrupo.length > 0) {
      const uniqueMap = new Map();
      
      itensDesteGrupo.forEach((item: any) => {
        const nomeParaSlug = item.name || item.nome || "item";
        const key = slugify(nomeParaSlug);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, normalizarCard(item));
        }
      });

      const cardsDoBanco = Array.from(uniqueMap.values());

      const novaSecaoDinamica = {
        id: `db-group-${grupo.id}`,
        ordem: 10 + index,
        titulo: grupo.nome,
        subtitulo: grupo.descricao || `Opções em ${grupo.nome}`,
        grupo: grupo.slug,
        // Fallback para a imagem do grupo também (se o grupo tiver imagem no banco)
        imagem_url: grupo.imagem_url || IMAGEM_DEFAULT, 
        tipo_secao: "services_carousel",
        heading_style: "styleAsH2",
        cards: cardsDoBanco,
        view_all: {
          href: `/explorar/${grupo.slug}`,
          label: "Mostrar todos",
          enabled: true
        }
      };

      // 3. INJEÇÃO DOS CARDS
      const indexManual = homeFinal.findIndex(s => s.grupo === grupo.slug);

      if (indexManual !== -1) {
        // Unir cards manuais com os novos do banco (Cabelo, etc)
        const cardsManuais = homeFinal[indexManual].cards || [];
        const mergedCardsMap = new Map();
        
        cardsManuais.forEach((c: any) => mergedCardsMap.set(slugify(c.titulo || ""), c));
        
        cardsDoBanco.forEach((c: any) => {
          const key = slugify(c.titulo || "");
          if (!mergedCardsMap.has(key)) {
            mergedCardsMap.set(key, c);
          }
        });

        homeFinal[indexManual].cards = Array.from(mergedCardsMap.values());
      } else {
        // Se a seção não existe no manual, insere antes do primeiro CTA ou no fim
        const ctaIndex = homeFinal.findIndex(s => s.tipo_secao === 'cta');
        if (ctaIndex !== -1) {
          homeFinal.splice(ctaIndex, 0, novaSecaoDinamica);
        } else {
          homeFinal.push(novaSecaoDinamica);
        }
      }
    }
  });

  return homeFinal;
};