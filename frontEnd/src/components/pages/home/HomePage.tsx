import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Container } from '@mui/material';
import './Home.css';
import LoadingSpinner from '../../LoadingSpinner/LoadingSpinner';
import api from '../../../api/api';
import BannerPropaganda from './BannerPropaganda';
import MuralPostDialog from '../../Mural/MuralPostDialog';
import { useAuth } from '../../../context/AuthContext';
import { unificarHome } from "../../../utils/homeHelpers";
import { type SectionData } from '../../../interfaces/types';
import LegacySectionRenderer from '../../sectionRenderer/LegacySectionRenderer';


export default function HomePageSimple(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [propagandas, setPropagandas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [sections, setSections] = useState<SectionData[]>([]);

  const u = user as any;

  // 🔐 STATUS DO USUÁRIO
  const perfis = Array.isArray(u?.perfis) ? u.perfis : [];

  const temPerfilAprovado = perfis.some((p: any) =>
    ["APROVADO"].includes(
      (p?.status || p?.status_aprovacao || "").toUpperCase()
    )
  );

  const isContaAprovada =
    ["APROVADO"].includes(
      (u?.status_conta || u?.status || "").toUpperCase()
    ) ||
    u?.ativo === true ||
    u?.ativo === 1;

  const isAprovadoGeral = temPerfilAprovado || isContaAprovada;

  const isPrestadorPendente =
    (u?.tipo === 'PRESTADOR' || u?.is_empreendedor) && !isAprovadoGeral;

  useEffect(() => {
    let isMounted = true; // 🔥 evita memory leak

    const fetchHomeData = async () => {
      setIsLoading(true);

      try {
        const [resConfig, resGrupos, resCategorias] = await Promise.all([
          api.get('/home-config').catch(() => ({ data: [] })),
          api.get('/grupos-home').catch(() => ({ data: [] })),
          api.get('/tipos-combo').catch(() => ({ data: [] }))
        ]);

        if (!isMounted) return;

        // 🔧 Normalização defensiva
        const secoes = Array.isArray(resConfig.data) ? resConfig.data : [];
        const grupos = Array.isArray(resGrupos.data) ? resGrupos.data : [];
        const categorias = Array.isArray(resCategorias.data) ? resCategorias.data : [];
        const layoutFinal = unificarHome(secoes, grupos, categorias);
        setSections(layoutFinal);
        const token =
          localStorage.getItem('@App:token') ||
          localStorage.getItem('token');



        if (token) {
          try {
            const naoVistosRes = await api.get('/home/nao-vistos', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!isMounted) return;

            const items = Array.isArray(naoVistosRes.data?.items)
              ? naoVistosRes.data.items
              : [];

            const props = items.filter((i: any) =>
              i.kind?.toUpperCase() === 'POST' &&
              Number(i.priorityScore) === 2
            );

            setPropagandas(props);
          } catch (err) {
            console.error("Erro ao buscar propagandas:", err);
            if (isMounted) setPropagandas([]);
          }
        }

      } catch (error) {
        console.error("Erro geral na Home:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // 🔥 dependência correta

  const handleOpenPropaganda = (id: string) => {
    setSelectedPostId(id);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <main className="home-page" style={{ position: 'relative' }}>

      {isPrestadorPendente && (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 1 }}>
          <Alert
            severity="warning"
            variant="filled"
            sx={{
              cursor: 'pointer',
              fontWeight: 'bold',
              bgcolor: '#ff9800'
            }}
            onClick={() => navigate('/pagamento-orientacoes')}
          >
            Sua assinatura está pendente! Clique aqui para ativar seu perfil.
          </Alert>
        </Container>
      )}

      {propagandas.length > 0 && (
        <BannerPropaganda
          posts={propagandas}
          onOpenPost={handleOpenPropaganda}
        />
      )}

      {/* 2. Camada de Conteúdo: Seções dinâmicas do Banco */}
      {sections.map((section) => (
        <LegacySectionRenderer key={section.id} section={section} />
      ))}


      <MuralPostDialog
        postId={selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    </main>
  );
}