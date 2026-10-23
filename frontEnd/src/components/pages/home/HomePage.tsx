import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Container } from '@mui/material';
import './home.css';
import LoadingSpinner from '../../LoadingSpinner/LoadingSpinner';
import api, { API_URL } from '../../../api/api';
import MuralPostDialog from '../../Mural/MuralPostDialog';
import { useAuth } from '../../../context/AuthContext';
import { unificarHome } from '../../../utils/homeHelpers';
import { type SectionData } from '../../../interfaces/types';
import LegacySectionRenderer from '../../sectionRenderer/LegacySectionRenderer';
import ChatWidget from '../../ChatWidget/ChatWidget';
import { ModalNovaSolicitacao } from '../../ModalNovaSolicitacao/ModalNovaSolicitacao';
import GranFooter from '../../footer/Granfooter';

type DotSolicitacao = {
  storeId?: string;
  lojaId?: string;
  prestadorId?: string;
  storeName?: string;
  categoriaId?: number | string;
  categoriaNome?: string;
  titulo?: string;
  descricao?: string;
  opportunityId?: string;
  opportunityToken?: string;
  origem?: string;
};

const DOT_PENDING_KEY = 'granconecta_dot_solicitacao_pendente';

type HeroSlide = {
  id: string;
  type: 'video' | 'image';
  src: string;
  poster?: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href?: string;
  postId?: string;
};

const defaultHeroSlides: HeroSlide[] = [
  {
    id: 'hero-condominio',
    type: 'video',
    src: `${API_URL}/uploads/videos/propaganda1.mp4`,
    poster: '/uploads/images/home-hero-poster.jpg',
    eyebrow: 'Tudo do condominio em um so lugar',
    title: 'Tudo o que a sua comunidade precisa, em um so lugar.',
    text: 'Encontre lojas, produtos e profissionais para o seu dia a dia. Tem um negocio ou presta servicos? Conecte-se a novos clientes com o GranConecta.',
    cta: 'Encontrar produtos e servicos',
    href: '#home-sections'
  },
  {
    id: 'hero-lojas',
    type: 'video',
    src: `${API_URL}/uploads/videos/propaganda2.mp4`,
    poster: '/uploads/images/home-lojas-poster.jpg',
    eyebrow: 'Vitrine para lojistas',
    title: 'Sua loja no caminho de quem ja mora perto.',
    text: 'Mostre produtos, ofertas e canais de atendimento para moradores que buscam solucoes no proprio condominio.',
    cta: 'Ver lojas',
    href: '/marketplace'
  },
  {
    id: 'hero-prestadores',
    type: 'image',
    src: `${API_URL}/uploads/images/home-prestadores.jpg`,
    eyebrow: 'Agenda para prestadores',
    title: 'Servicos confiaveis para o dia a dia da comunidade.',
    text: 'Encanador, eletricista, limpeza, saude, bem-estar e servicos prestados por moradores em trilhas faceis de navegar.',
    cta: 'Ver prestadores',
    href: '/?tipo=prestadores'
  }
];

const normalize = (value = '') =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const withApiUrl = (value?: string | null) => {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return `${API_URL}${value}`;
  return `${API_URL}/${value}`;
};

const getPropagandaMedia = (item: any) => {
  const video =
    item?.video_url ||
    item?.videoUrl ||
    item?.video ||
    item?.media_video_url ||
    item?.arquivo_video_url ||
    item?.post?.video_url ||
    item?.post?.videoUrl ||
    item?.post?.video;

  if (video) {
    return {
      type: 'video' as const,
      src: withApiUrl(video)
    };
  }

  const image =
    item?.imagem_url ||
    item?.image_url ||
    item?.imageUrl ||
    item?.foto_url ||
    item?.thumbnail_url ||
    item?.media_url ||
    item?.url ||
    item?.post?.imagem_url ||
    item?.post?.image_url ||
    item?.post?.thumbnail_url ||
    item?.post?.media_url ||
    item?.post?.url;

  if (image) {
    return {
      type: 'image' as const,
      src: withApiUrl(image)
    };
  }

  return null;
};

const propagandaToHeroSlide = (item: any, index: number): HeroSlide | null => {
  const media = getPropagandaMedia(item);
  if (!media?.src) return null;

  const title =
    item?.titulo ||
    item?.title ||
    item?.nome ||
    item?.post?.titulo ||
    item?.post?.title ||
    'Destaque GranConecta';

  const text =
    item?.descricao ||
    item?.description ||
    item?.resumo ||
    item?.post?.descricao ||
    item?.post?.description ||
    'Uma oportunidade em destaque para moradores, lojistas e prestadores da comunidade.';

  return {
    id: String(item?.id || item?.postId || item?.post_id || `propaganda-${index}`),
    type: media.type,
    src: media.src,
    poster: withApiUrl(item?.poster_url || item?.poster || item?.thumbnail_url || item?.post?.poster_url),
    eyebrow: 'Destaque da comunidade',
    title,
    text,
    cta: 'Ver destaque',
    postId: String(item?.id || item?.postId || item?.post_id || '')
  };
};

const sectionMatchesFilter = (section: SectionData, filter: string | null) => {
  if (!filter || filter === 'todos') return true;

  const text = normalize([
    (section as any).title,
    (section as any).titulo,
    (section as any).name,
    (section as any).nome,
    (section as any).tipo,
    (section as any).slug
  ].filter(Boolean).join(' '));

  if (filter === 'lojas') {
    return text.includes('loja') ||
      text.includes('gastronomia') ||
      text.includes('automotivo') ||
      text.includes('pet') ||
      text.includes('marketplace');
  }

  if (filter === 'prestadores') {
    return text.includes('servico') ||
      text.includes('prestador') ||
      text.includes('saude') ||
      text.includes('bem-estar') ||
      text.includes('morador');
  }

  return true;
};

export default function HomePageSimple(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [propagandas, setPropagandas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const ultimoFechamentoPopupRef = useRef<number | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [solicitacaoDot, setSolicitacaoDot] = useState<DotSolicitacao | null>(null);
  const [businessChat, setBusinessChat] = useState<{
    storeId: string;
    storeName: string;
    storeSlug?: string;
    chatbotTipo: "LOJA" | "PRESTADOR";
    opportunityId: string;
    opportunityToken: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBusinesses, setSearchBusinesses] = useState<any[]>([]);

  // Recebe os pedidos de abertura dos botões flutuante e mobile do Layout.
  // O Layout não monta outro DOT na HomePage: esta é a instância principal.
  useEffect(() => {
    const abrirDotPeloLayout = () => {
      console.log("[DOT HOME] Evento recebido. Abrindo chatbot.");
      setBusinessChat(null);
      setChatOpen(true);
    };

    window.addEventListener("granconecta:open-dot", abrirDotPeloLayout);
    return () => {
      window.removeEventListener("granconecta:open-dot", abrirDotPeloLayout);
    };
  }, []);

  const abrirChatEspecializado = (payload: Record<string, any>) => {
    const storeId = String(payload.storeId || "").trim();
    const opportunityId = String(payload.opportunityId || "").trim();
    const opportunityToken = String(payload.opportunityToken || "").trim();
    if (!storeId || !opportunityId || !opportunityToken) {
      window.alert("Não foi possível validar o atendimento especializado. Selecione novamente.");
      return;
    }
    setBusinessChat({
      storeId,
      storeName: String(payload.storeName || "Atendimento GranConecta"),
      storeSlug: payload.storeSlug ? String(payload.storeSlug) : undefined,
      chatbotTipo: payload.chatbotTipo === "LOJA" ? "LOJA" : "PRESTADOR",
      opportunityId,
      opportunityToken,
    });
    setChatOpen(false);
  };

  const abrirSolicitacaoDot = (payload: Record<string, any>) => {
    const dados: DotSolicitacao = {
      storeId: payload.storeId ? String(payload.storeId) : undefined,
      lojaId: payload.lojaId ? String(payload.lojaId) : (payload.storeId ? String(payload.storeId) : undefined),
      prestadorId: payload.prestadorId ? String(payload.prestadorId) : undefined,
      storeName: payload.storeName ? String(payload.storeName) : undefined,
      categoriaId: payload.categoriaId,
      categoriaNome: payload.categoriaNome,
      titulo: payload.titulo,
      descricao: payload.descricao,
      opportunityId: payload.opportunityId,
      opportunityToken: payload.opportunityToken,
      origem: payload.origem || 'DOT_HOME',
    };
    // A solicitação direcionada precisa do ID real do perfil, nunca do storeId.
    if (!dados.prestadorId) {
      window.alert('Não foi possível identificar o cadastro do prestador. Tente outra opção no DOT.');
      return;
    }
    if (!user?.id) {
      sessionStorage.setItem(DOT_PENDING_KEY, JSON.stringify(dados));
      setChatOpen(false);
      const redirect = encodeURIComponent('/?dotSolicitacao=1');
      navigate(`/login/morador?redirect=${redirect}`);
      return;
    }
    sessionStorage.removeItem(DOT_PENDING_KEY);
    setChatOpen(false);
    setSolicitacaoDot(dados);
  };

  useEffect(() => {
    if (!user?.id || searchParams.get('dotSolicitacao') !== '1') return;
    const pending = sessionStorage.getItem(DOT_PENDING_KEY);
    if (pending) {
      try {
        const dados = JSON.parse(pending) as DotSolicitacao;
        if (dados.prestadorId) setSolicitacaoDot(dados);
      } catch (error) {
        console.warn('Contexto DOT inválido após autenticação:', error);
      }
      sessionStorage.removeItem(DOT_PENDING_KEY);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('dotSolicitacao');
    setSearchParams(next, { replace: true });
  }, [user?.id, searchParams, setSearchParams]);

  const filtroAtual = searchParams.get('tipo') || 'todos';
  const u = user as any;

  const perfis = Array.isArray(u?.perfis) ? u.perfis : [];

  const temPerfilAprovado = perfis.some((p: any) =>
    ['APROVADO'].includes((p?.status || p?.status_aprovacao || '').toUpperCase())
  );

  const isContaAprovada =
    ['APROVADO'].includes((u?.status_conta || u?.status || '').toUpperCase()) ||
    u?.ativo === true ||
    u?.ativo === 1;

  const isAprovadoGeral = temPerfilAprovado || isContaAprovada;

  const isPrestadorPendente =
    (u?.tipo === 'PRESTADOR' || u?.is_empreendedor) && !isAprovadoGeral;

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      setIsLoading(true);

      try {
        const [resConfig, resGrupos, resCategorias, resBusinesses] = await Promise.all([
          api.get('/home-config').catch(() => ({ data: [] })),
          api.get('/grupos-home').catch(() => ({ data: [] })),
          api.get('/tipos-combo').catch(() => ({ data: [] })),
          api.get('/lojas/publica/todas').catch(() => ({ data: [] }))
        ]);

        if (!isMounted) return;

        const secoes = Array.isArray(resConfig.data) ? resConfig.data : [];
        const grupos = Array.isArray(resGrupos.data) ? resGrupos.data : [];
        const categorias = Array.isArray(resCategorias.data) ? resCategorias.data : [];
        const businesses = Array.isArray(resBusinesses.data) ? resBusinesses.data : [];
        const layoutFinal = unificarHome(secoes, grupos, categorias);
        setSections(layoutFinal);
        setSearchBusinesses(
          businesses.filter((business: any) =>
            business?.ativa !== 0 &&
            business?.ativa !== false &&
            business?.acesso_comercial_liberado !== false &&
            business?.bloqueado_assinatura !== true
          )
        );

        const token =
          localStorage.getItem('@App:token') ||
          localStorage.getItem('token');

        if (token) {
          try {
            const naoVistosRes = await api.get('/home/nao-vistos', {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!isMounted) return;

            const items = Array.isArray(naoVistosRes.data?.items)
              ? naoVistosRes.data.items
              : [];

            const postsNaoVistos = items.filter(
              (i: any) =>
                i.kind?.toUpperCase() === 'POST'
            );

            setPropagandas(postsNaoVistos);
          } catch (err) {
            console.error('Erro ao buscar propagandas:', err);
            if (isMounted) setPropagandas([]);
          }
        }
      } catch (error) {
        console.error('Erro geral na Home:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (
      isLoading ||
      selectedPostId ||
      propagandas.length === 0
    ) {
      return;
    }

    const primeiroPostNaoVisto = propagandas[0];

    if (!primeiroPostNaoVisto?.id) {
      return;
    }

    const INTERVALO_REAPARECER = 15 * 60 * 1000; // 15 minutos
    const AGUARDAR_PRIMEIRA_ABERTURA = 3000; // 3 segundos

    const agora = Date.now();
    const ultimoFechamento = ultimoFechamentoPopupRef.current;

    let tempoParaAbrir = AGUARDAR_PRIMEIRA_ABERTURA;

    if (ultimoFechamento) {
      const tempoDecorrido = agora - ultimoFechamento;

      if (tempoDecorrido < INTERVALO_REAPARECER) {
        tempoParaAbrir =
          INTERVALO_REAPARECER - tempoDecorrido;
      }
    }

    const timer = window.setTimeout(() => {
      setSelectedPostId(
        String(primeiroPostNaoVisto.id)
      );
    }, tempoParaAbrir);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    propagandas,
    isLoading,
    selectedPostId
  ]);

  const discoverySlides = useMemo(
    () => propagandas
      .map((item, index) => propagandaToHeroSlide(item, index))
      .filter((slide): slide is HeroSlide => Boolean(slide)),
    [propagandas]
  );

  // O hero principal fica comercial/institucional. Conteúdo comunitário não visto
  // aparece em uma área própria de Descobertas, sem competir com o Marketplace.
  const heroSlides = defaultHeroSlides;

  useEffect(() => {
    if (activeSlide > heroSlides.length - 1) {
      setActiveSlide(0);
    }
  }, [activeSlide, heroSlides.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const filteredSections = useMemo(
    () => sections.filter((section) => sectionMatchesFilter(section, filtroAtual)),
    [sections, filtroAtual]
  );

  const currentSlide = heroSlides[activeSlide] || defaultHeroSlides[0];

  const handleOpenPropaganda = (id: string) => {
    setSelectedPostId(id);
  };

  const handleFilter = (tipo: string) => {
    if (tipo === 'todos') setSearchParams({});
    else setSearchParams({ tipo });

    window.setTimeout(() => {
      document.getElementById('home-sections')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 50);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      document.getElementById('home-sections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const normalizedQuery = normalize(query);

    // Primeiro tenta encontrar uma loja/prestador especifico pelo nome ou slug real.
    const exactBusiness = searchBusinesses.find((business: any) => {
      const normalizedName = normalize(String(business?.name || business?.nome || ''));
      const normalizedSlug = normalize(String(business?.slug || '')).replace(/-/g, ' ');
      return normalizedName === normalizedQuery || normalizedSlug === normalizedQuery;
    });

    const partialBusiness = searchBusinesses.find((business: any) => {
      const normalizedName = normalize(String(business?.name || business?.nome || ''));
      const normalizedSlug = normalize(String(business?.slug || '')).replace(/-/g, ' ');
      return normalizedName.includes(normalizedQuery) || normalizedSlug.includes(normalizedQuery);
    });

    const matchedBusiness = exactBusiness || partialBusiness;
    if (matchedBusiness?.slug) {
      navigate(`/pagina/${matchedBusiness.slug}`);
      return;
    }

    // Depois reconhece categorias de servico.
    const serviceRoutes: Array<{ slug: string; aliases: string[] }> = [
      { slug: 'eletricista', aliases: ['eletricista', 'eletrecista', 'eletrica', 'eletrico'] },
      { slug: 'encanador', aliases: ['encanador', 'encanamento', 'hidraulica', 'hidraulico'] },
      { slug: 'diarista', aliases: ['diarista', 'faxina', 'faxineira'] },
      { slug: 'limpeza-residencial', aliases: ['limpeza', 'limpeza residencial'] },
      { slug: 'manutencao-geral', aliases: ['manutencao', 'manutencao geral', 'marido de aluguel'] },
      { slug: 'passeador-de-caes', aliases: ['passeador de caes', 'passeador de cachorro', 'dog walker'] },
      { slug: 'banho-e-tosa', aliases: ['banho e tosa', 'banho tosa'] },
      { slug: 'psicopedagogia', aliases: ['psicopedagogia', 'psicopedagoga', 'psicopedagogo'] }
    ];

    const matchedService = serviceRoutes.find(({ aliases }) =>
      aliases.some((alias) => {
        const normalizedAlias = normalize(alias);
        return normalizedQuery === normalizedAlias ||
          normalizedQuery.startsWith(`${normalizedAlias} `) ||
          normalizedQuery.endsWith(` ${normalizedAlias}`) ||
          normalizedQuery.includes(` ${normalizedAlias} `);
      })
    );

    if (matchedService) {
      navigate(`/servicos/${matchedService.slug}`);
      return;
    }

    // Fallback para produtos e termos genericos.
    navigate(`/marketplace?busca=${encodeURIComponent(query)}`);
  };

  const handleHeroAction = () => {
    if (currentSlide.postId) {
      handleOpenPropaganda(currentSlide.postId);
      return;
    }

    if (!currentSlide.href) return;

    if (currentSlide.href.startsWith('#')) {
      document.querySelector(currentSlide.href)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      return;
    }

    navigate(currentSlide.href);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <main className="gc-home-page">
      {isPrestadorPendente && (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 1 }}>
          <Alert
            severity="warning"
            variant="filled"
            sx={{ cursor: 'pointer', fontWeight: 'bold', bgcolor: '#ff9800' }}
            onClick={() => navigate('/pagamento-orientacoes')}
          >
            Sua assinatura esta pendente! Clique aqui para ativar seu perfil.
          </Alert>
        </Container>
      )}

      <section className="gc-home-intro" aria-label="Explorar GranConecta">
        <div className="gc-community-context">
          <span className="gc-community-kicker">Sua comunidade</span>
          <strong>{u?.condominio?.nome || u?.condominio_nome || 'Comunidade GranConecta'}</strong>
          <span className="gc-community-note">Explore aqui ou encontre negócios de toda a rede.</span>
        </div>

        <div className="gc-home-intro-copy">
          <span className="gc-eyebrow">GranConecta perto de você</span>
          <h1>O que você precisa hoje?</h1>
          <p>Encontre produtos, lojas e profissionais da sua comunidade e de outras regiões.</p>
        </div>

        <form className="gc-main-search" onSubmit={handleSearchSubmit}>
          <span aria-hidden="true">⌕</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar produto, serviço ou profissional"
            aria-label="Buscar no GranConecta"
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="gc-quick-actions" aria-label="Atalhos">
          <button type="button" onClick={() => handleFilter('prestadores')}><span>🛠️</span>Serviços</button>
          <button type="button" onClick={() => navigate('/marketplace')}><span>🛍️</span>Lojas</button>
          <button type="button" onClick={() => setChatOpen(true)}><span>✨</span>Pedir à IA</button>
          <button type="button" onClick={() => navigate("/comunidade")}><span>🤝</span>Comunidade</button>
        </div>
      </section>

      <section className="gc-hero-carousel gc-hero-single" aria-label="Destaques GranConecta">
        <div className="gc-hero-media gc-hero-media-full">
          {currentSlide.type === 'video' ? (
            <video
              key={currentSlide.src}
              autoPlay
              muted
              loop
              playsInline
              poster={currentSlide.poster}
            >
              <source src={currentSlide.src} type="video/mp4" />
            </video>
          ) : (
            <img
              key={currentSlide.src}
              src={currentSlide.src}
              alt={currentSlide.title}
              loading="eager"
              decoding="async"
              onError={(event) => {
                const image = event.currentTarget;

                if (image.dataset.fallbackApplied === 'true') {
                  image.style.display = 'none';
                  return;
                }

                image.dataset.fallbackApplied = 'true';
                image.src = `${API_URL}/uploads/images/home-hero-poster.jpg`;
              }}
            />
          )}
          <div className="gc-hero-overlay" />
        </div>

        <div className="gc-hero-content">
          <span className="gc-eyebrow">{currentSlide.eyebrow}</span>
          <h1>{currentSlide.title}</h1>
          <p>{currentSlide.text}</p>

          <div className="gc-hero-actions">
            <button
              type="button"
              className="gc-btn gc-btn-primary"
              onClick={handleHeroAction}
            >
              {currentSlide.cta}
            </button>

            <button
              type="button"
              className="gc-btn gc-btn-secondary"
              onClick={() => navigate('/cadastro')}
            >
              Quero anunciar meu negocio
            </button>
          </div>

          <div className="gc-filter-tabs" aria-label="Filtrar vitrine">
            <button
              type="button"
              className={filtroAtual === 'todos' ? 'is-active' : ''}
              onClick={() => handleFilter('todos')}
            >
              Tudo
            </button>
            <button
              type="button"
              className={filtroAtual === 'lojas' ? 'is-active' : ''}
              onClick={() => handleFilter('lojas')}
            >
              Lojas
            </button>
            <button
              type="button"
              className={filtroAtual === 'prestadores' ? 'is-active' : ''}
              onClick={() => handleFilter('prestadores')}
            >
              Prestadores
            </button>
          </div>
        </div>

        <div className="gc-carousel-dots" aria-label="Selecionar destaque">
          {heroSlides.map((slide, index) => (
            <button
              key={`${slide.id}-${index}`}
              type="button"
              className={index === activeSlide ? 'is-active' : ''}
              aria-label={`Ir para destaque ${index + 1}`}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="gc-ai-callout" aria-label="Assistente GranConecta">
        <div>
          <span className="gc-eyebrow">Assistente GranConecta</span>
          <h2>Não sabe quem chamar?</h2>
          <p>Conte o que você precisa. A IA ajuda a encontrar a melhor opção disponível na rede.</p>
        </div>
        <button type="button" className="gc-btn gc-btn-primary" onClick={() => setChatOpen(true)}>
          Conversar com a IA
        </button>
      </section>

      {discoverySlides.length > 0 && (
        <section id="gc-community-discoveries" className="gc-community-discoveries" aria-labelledby="gc-discoveries-title">
          <div className="gc-section-heading">
            <div>
              <span className="gc-eyebrow">Da comunidade</span>
              <h2 id="gc-discoveries-title">Descobertas para você</h2>
              <p>Doações, achados e perdidos, empréstimos e outros avisos comunitários.</p>
            </div>
          </div>
          <div className="gc-discovery-track">
            {discoverySlides.map((slide) => (
              <button key={slide.id} type="button" className="gc-discovery-card" onClick={() => slide.postId && handleOpenPropaganda(slide.postId)}>
                <div className="gc-discovery-media">
                  {slide.type === 'video' ? <video src={slide.src} muted playsInline /> : <img src={slide.src} alt="" />}
                </div>
                <div className="gc-discovery-copy">
                  <span>Comunidade</span>
                  <strong>{slide.title}</strong>
                  <p>{slide.text}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section id="home-sections" className="gc-dynamic-sections gc-card-skin">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <LegacySectionRenderer key={section.id} section={section} />
          ))
        ) : (
          <div className="gc-empty-state">
            <h2>Nenhuma secao encontrada para este filtro.</h2>
            <p>Revise os nomes das secoes no painel da home ou volte para a visao completa.</p>
            <button
              type="button"
              className="gc-btn gc-btn-primary"
              onClick={() => handleFilter('todos')}
            >
              Ver tudo
            </button>
          </div>
        )}
      </section>

      <section className="gc-business-cta" aria-labelledby="gc-business-cta-title">
        <div className="gc-business-cta-heading">
          <span className="gc-eyebrow">Cresca com a comunidade</span>
          <h2 id="gc-business-cta-title">Seu negocio tambem pode estar aqui.</h2>
          <p>
            Apresente seus produtos ou servicos, tenha uma pagina profissional,
            receba novos clientes e conte com as ferramentas do GranConecta para
            transformar oportunidades em vendas.
          </p>
        </div>

        <div className="gc-business-cta-grid">
          <article className="gc-business-profile-card">
            <span className="gc-business-profile-label">Para profissionais</span>
            <h3>Sou Prestador de Servicos</h3>
            <p>
              Divulgue seus servicos, organize seu catalogo, receba oportunidades,
              atenda clientes com apoio da IA e gerencie agenda e recebimentos.
            </p>
            <button type="button" className="gc-btn gc-btn-primary" onClick={() => navigate('/cadastro')}>
              Quero divulgar meus servicos
            </button>
          </article>

          <article className="gc-business-profile-card">
            <span className="gc-business-profile-label">Para lojas e negocios</span>
            <h3>Sou Empreendedor</h3>
            <p>
              Crie sua vitrine digital, apresente seus produtos, receba pedidos,
              converse com clientes e use o GranConecta para gerar novas vendas.
            </p>
            <button type="button" className="gc-btn gc-btn-secondary" onClick={() => navigate('/cadastro')}>
              Quero divulgar meu negocio
            </button>
          </article>
        </div>
      </section>

      <div>
        <GranFooter />
      </div>

      <MuralPostDialog
        postId={selectedPostId}
        onClose={() => {
          ultimoFechamentoPopupRef.current = Date.now();
          setSelectedPostId(null);
        }}
      />

      <ChatWidget
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        storeId=""
        storeName="GranConecta"
        userId={user?.id}
        userName={user?.name}
        userType={(user as any)?.tipo}
        condominioId={(user as any)?.condominio_id}
        onSolicitacaoDireta={abrirSolicitacaoDot}
        onOpenBusinessChat={abrirChatEspecializado}
      />

      {businessChat && (
        <ChatWidget
          key={`${businessChat.storeId}_${businessChat.opportunityId}`}
          open={true}
          onClose={() => setBusinessChat(null)}
          storeId={businessChat.storeId}
          storeName={businessChat.storeName}
          storeSlug={businessChat.storeSlug}
          chatbotTipo={businessChat.chatbotTipo}
          opportunityId={businessChat.opportunityId}
          opportunityToken={businessChat.opportunityToken}
          userId={user?.id}
          userName={user?.name}
          userType={(user as any)?.tipo}
          condominioId={(user as any)?.condominio_id}
          onSolicitacaoDireta={abrirSolicitacaoDot}
        />
      )}

      {solicitacaoDot && user?.id && (
        <ModalNovaSolicitacao
          open={true}
          onClose={() => setSolicitacaoDot(null)}
          onSuccess={() => setSolicitacaoDot(null)}
          usuarioId={user.id}
          condominio_id={u?.condominio_id || u?.condominioId || ''}
          modo="contextual"
          prestadorNome={solicitacaoDot.storeName}
          prestadorId={solicitacaoDot.prestadorId}
          lojaId={solicitacaoDot.lojaId || solicitacaoDot.storeId}
          categoriaIdInicial={solicitacaoDot.categoriaId}
          tituloInicial={solicitacaoDot.titulo || (solicitacaoDot.storeName ? `Solicitação para ${solicitacaoDot.storeName}` : 'Solicitação de serviço')}
          descricaoInicial={solicitacaoDot.descricao}
          dadosIniciais={{
            ...solicitacaoDot,
            origem: solicitacaoDot.origem || 'DOT_HOME',
            chatbotTipo: 'PRESTADOR',
          }}
        />
      )}
    </main>
  );
}
