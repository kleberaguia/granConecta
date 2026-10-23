import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/api'
import style from './StoryPage.module.css'; 
import { API_URL } from '../../../utils/config';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface PageData {
  title: string;
  subtitle?: string;
  content: string;
  author?: string;
  updatedAt: string;
  category?: string;
  coverImage?: string;
}

export default function StoryViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    document.body.style.backgroundColor = '#000';
    const fetchStory = async () => {
      setLoading(true);
      try {
        const safeSlug = slug?.startsWith('/') ? slug : `/${slug}`;
        const response = await api.get('/pages/details', { params: { slug: safeSlug } });
        if (response.data) setPage(response.data);
      } catch (error) {
        console.error("Erro ao buscar história", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchStory();
  }, [slug]);

  if (loading) return (
    <div className={style.fullscreenLoader}>
      <div className={style.spinner}></div>
      <p>Abrindo capítulo...</p>
    </div>
  );

  if (!page) return <div className={style.errorScreen}>História não encontrada.</div>;

  return (
    <div className={style.pageOverlay}>
      {/* Botão de Fechar fixo no canto superior */}
      <div className={style.closeHeader}>
        <IconButton onClick={() => navigate(-1)} className={style.closeBtn}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </div>

      <article className={style.storyWrapper}>
        
        {/* Cabeçalho Editorial */}
        <header className={style.header}>
          {page.category && <span className={style.category}>{page.category}</span>}
          <h1 className={style.title}>{page.title}</h1>
          
          <div className={style.meta}>
            {page.author && <span>Por <strong>{page.author}</strong></span>}
            <span className={style.divider}>•</span>
            <time>{new Date(page.updatedAt).toLocaleDateString('pt-BR', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            })}</time>
          </div>
        </header>

        {/* Imagem de Capa Imersiva */}
        {page.coverImage && (
          <div className={style.imageContainer}>
            <img 
              src={`${API_URL}${page.coverImage}`} 
              alt={`Capa de ${page.title}`}
              className={style.coverImage}
            />
          </div>
        )}

        {/* O Corpo do Texto - Foco em Leitura */}
        <div 
          className={style.content}
          dangerouslySetInnerHTML={{ __html: page.content }} 
        />

        <footer className={style.footer}>
          <div className={style.footerLine}></div>
          <p>Fim do capítulo</p>
        </footer>

      </article>
    </div>
  );
}