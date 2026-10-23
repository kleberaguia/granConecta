import React from 'react';

// 1. IMPORTE OS COMPONENTES EXISTENTES
//import HeroSection from '../sections/HeroSection';
// 2. IMPORTE TODOS OS TIPOS NECESSÁRIOS
import { 
  type SectionData, 
  //type IHeroSectionData, 
  type IPropagandaCarouselSectionData
} from '../../interfaces/types';
import ServicesCarouselSection from '../sections/ServicesCarouselSection/ServicesCarouselSection';

// 👇 3. COMPONENTE DE PROPAGANDA
// Tipado corretamente com a interface de itens que você definiu
const BannerPropaganda = ({ posts }: { posts: any[] }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="propaganda-section" style={{ padding: '20px', background: '#fff' }}>
      <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Destaques para você</h3>
      <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
        {posts.map((post) => (
          <div 
            key={post.id} 
            style={{ 
              minWidth: '280px', 
              padding: '15px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #1976d2, #1565c0)',
              color: '#fff' 
            }}
          >
            <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8 }}>Destaque</span>
            <h4 style={{ margin: '5px 0' }}>{post.titulo}</h4>
            <p style={{ fontSize: '12px', opacity: 0.9 }}>{post.resumo}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Evita repetir o mesmo aviso em cada renderização ou atualização periódica.
const tiposDesconhecidosAvisados = new Set<string>();

interface SectionRendererProps {
  section: SectionData;
}

const LegacySectionRenderer: React.FC<SectionRendererProps> = ({ section }) => {
  // Como todas as interfaces agora estendem ISectionBase, tipo_secao é garantido
  const tipo = section.tipo_secao;

  switch (tipo) {
    // case 'hero':
    //   return <HeroSection section={section as IHeroSectionData} />;
    case 'services_carousel':
      return <ServicesCarouselSection section={section as any} />;
    case 'PROPAGANDA_CAROUSEL':
      // Aqui o TypeScript agora reconhece a propriedade .dados
      const propagandaSection = section as IPropagandaCarouselSectionData;
      return <BannerPropaganda posts={propagandaSection.dados || []} />;
    default:
      if (!tiposDesconhecidosAvisados.has(String(tipo))) {
        tiposDesconhecidosAvisados.add(String(tipo));
        console.warn(`Tipo de seção desconhecido:`, section);
      }
      return null;
  }
}

export default LegacySectionRenderer;