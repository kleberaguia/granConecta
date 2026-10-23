import React from 'react';


type SectionLayout = 'texto_esquerda' | 'texto_direita' | 'texto_abaixo';


interface IGenericSectionData {
  // id: number; // Descomente se você precisar do ID aqui
  titulo: string | null;
  subtitulo: string | null;
  conteudo_principal: string | null;
  imagem_principal: string | null;
  layout: SectionLayout | null; // Usa o tipo que definimos acima
  link_botao1: string | null;
  texto_botao1: string | null;
  classe_css: string | null; // Para estilos personalizados
}

// 3. Definir a interface para as Props do componente
interface GenericContentSectionProps {
  data: IGenericSectionData;
}

// 4. Tipar o componente como um React.FC (Functional Component)
const GenericContentSection: React.FC<GenericContentSectionProps> = ({ data }) => {
  
  // A desestruturação permanece a mesma
  const { 
    titulo, 
    subtitulo, 
    conteudo_principal, 
    imagem_principal, 
    layout, 
    link_botao1, 
    texto_botao1 
  } = data;

  /**
   * Define a classe CSS com base no layout do BD.
   * O TypeScript garante que 'layout' só pode ser um dos valores
   * de SectionLayout ou null.
   */
  const getLayoutClass = (): string => {
    switch (layout) {
      case 'texto_esquerda':
        return 'layout-texto-esquerda';
      case 'texto_direita':
        return 'layout-texto-direita';
      case 'texto_abaixo':
        return 'layout-texto-abaixo';
      default:
        return 'layout-texto-direita'; // Um fallback seguro
    }
  };

  return (
    // Usamos a classe_css opcional vinda do banco
    <section className={`generic-content-section ${data.classe_css || ''}`}>
      
      {/* O Header da Seção */}
      <div className="section-header">
        {titulo && <h2>{titulo}</h2>}
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      
      {/* O Wrapper de Conteúdo com layout dinâmico */}
      <div className={`content-wrapper ${getLayoutClass()}`}>
        
        {/* Coluna de Texto */}
        <div className="text-content">
          {/* O TS nos força a ser cuidadosos. 
            Verificamos se 'conteudo_principal' existe antes de usá-lo.
          */}
          {conteudo_principal && (
            <div dangerouslySetInnerHTML={{ __html: conteudo_principal }} />
          )}

          {/* Botão (só aparece se ambos link e texto existirem) */}
          {texto_botao1 && link_botao1 && (
            <a href={link_botao1} className="simple-button primary-button">
              {texto_botao1}
            </a>
          )}
        </div>

        {/* Coluna de Imagem */}
        <div className="image-content">
          {imagem_principal && (
            <img src={imagem_principal} alt={titulo || 'Imagem da seção'} />
          )}
        </div>
      </div>
    </section>
  );
};

export default GenericContentSection;