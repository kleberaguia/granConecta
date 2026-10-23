import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Typography, Box, Tabs, Tab, Paper, Button,
  Stack, CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalance from '@mui/icons-material/AccountBalance';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SmartToyIcon from "@mui/icons-material/SmartToy";

import api from '../../../api/api';
import ModalCadastroProduto from '../../ModalCadastroProduto/ModalNovoProduto';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { API_URL } from '../../../utils/config';
import Gerador from '../../LandingPages/Gerador';
import { ListaLeads } from '../../ListaLeads/ListaLeads';
import { PaymentSettings } from "../../PaymentSettings/PaymentSettings";
import { StoreOrdersPanel } from '../../StoreOrdersPanel/StoreOrdersPanel';
import { DeliverySettings } from '../../DeliverySettings/DeliverySettings';
import { useContextoLoja } from '../../ControleContextoLoja/ControleContextoLoja';
import StoreChatbotKnowledgeManager from "../../LandingPages/StoreChatbotKnowledgeManager/StoreChatbotKnowledgeManager";
import { HumanChatInbox } from '../../humanChat/HumanChatInbox';
import { NotificationsActive } from '@mui/icons-material';

export const getContrastColor = (hexColor: string) => {
  if (!hexColor || hexColor === 'transparent') return '#000000';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#000000';

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

export default function EmpreendedorDashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tabValue, setTabValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [perfil, setPerfil] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [_openModalEdit, setOpenModalEdit] = useState(false);

  const [_storeSlug, setStoreSlug] = useState('');
  const [_pixKey, setPixKey] = useState('');
  const [leads, setLeads] = useState([]);
  const [_layout, setLayout] = useState({
    primaryColor: '#1976d2',
    heroColor: '#f5f5f5',
    fraseHero: '',
    posicaoFrase: 'center',
    tipoHero: 'color',
    showPopup: false,
    popupInterval: 30,
    qrCodePixUrl: '',
    logoUrl: ''
  });

  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const lojaId =
    perfil?.storeId ||
    perfil?.lojaId ||
    perfil?.store?.id ||
    user?.storeId ||
    user?.lojaId ||
    "";


  const contexto = useContextoLoja({
    categoriaTipo: perfil?.categoriaTipo,
    categoria: perfil?.categoria,
    businessType: perfil?.business_type
  });

  const handleSucessoProduto = () => {
    setOpenModal(false);
    setOpenModalEdit(false);
    setProdutoEditando(null);
    carregarDados();
  };

  const carregarDados = async () => {
    try {
      setLoading(true);

      const resPerfil = await api.get('/users/me');
      const dados = resPerfil.data;

      if (dados) {
        setPerfil(dados.perfil);
        setStoreSlug(dados.slug || '');
        setPixKey(dados.chavePix || '');

        const config = dados.layoutConfig || {};

        setLayout({
          primaryColor: config.primaryColor || '#1976d2',
          heroColor: config.heroColor || '#f5f5f5',
          fraseHero: config.descricao || dados.nome_comercial || '',
          posicaoFrase: config.posicaoFrase || 'center',
          tipoHero: config.tipoHero || 'color',
          showPopup: !!config.showPopup,
          popupInterval: config.popupInterval || 30,
          qrCodePixUrl: dados.qrCodePixUrl || '',
          logoUrl: config.logoUrl || ''
        });
      }

      const resLeads = await api.get(`/lojas/leads/meus`);
      setLeads(resLeads.data);

      const [resProdutos] = await Promise.all([
        api.get('/produtos/lojas/meus-produtos'),
        api.get('/credits/my-balance')
      ]);

      setProdutos(resProdutos.data);
    } catch (err) {
      console.error("Erro ao carregar:", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
        toast.error("Sessão expirada. Faça login novamente.");
      } else {
        toast.error("Erro ao carregar dados do painel");
      }
    } finally {
      setLoading(false);
    }
  };

  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);


  useEffect(() => {
    const requestedTab = Number(searchParams.get('tab'));

    if (Number.isInteger(requestedTab) && requestedTab >= 0 && requestedTab <= 7) {
      setTabValue(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) carregarDados();
  }, [user]);

  useEffect(() => {
    // Função para buscar mensagens não lidas
    const checarNovasMensagens = async () => {
      try {
        const res = await api.get('/chat/nao-lidas');
        const count = res.data.count || 0;

        // Se o contador subiu, avisa o empreendedor
        if (count > unreadCount) {
          toast.success("Você tem novas mensagens!");
        }
        setUnreadCount(count);
      } catch (e) {
        console.error("Erro ao verificar mensagens");
      }
    };

    // Executa imediatamente na montagem
    checarNovasMensagens();

    // Configura o intervalo (30.000ms = 30 segundos)
    const interval = setInterval(checarNovasMensagens, 30000);

    // Limpa o intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verifique se a mensagem vem do seu iFrame (opcional: validar a origem)
      if (event.data?.type === "OPEN_SOLICITACAO_MODAL" || event.data?.type === "SERVICE_REQUEST") {
        try {
          const payload = event.data.payload;

          // Envia para o seu backend salvar como um novo lead/atendimento
          await api.post('/lojas/leads', {
            nome: payload.name || payload.titulo,
            telefone: payload.phone,
            mensagem: payload.message || payload.descricao,
            lojaId: lojaId,
            origem: 'Landing Page'
          });

          toast.success("Nova solicitação recebida e salva no sistema!");

          // Opcional: Atualiza a lista de leads ou chat se necessÃ¡rio
          carregarDados();
        } catch (error) {
          console.error("Erro ao salvar solicitaÃ§Ã£o:", error);
          toast.error("Erro ao processar solicitaÃ§Ã£o automÃ¡tica.");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [lojaId]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        bgcolor: '#f8fafc',
        minHeight: '100vh'
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1.5, sm: 2, md: 3 },
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
      >
        {/* HEADER */}

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            {/* O tÃ­tulo muda de tamanho dependendo do dispositivo */}
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900">
              Painel de Negocios
            </Typography>
            <Typography color="text.secondary" variant={isMobile ? "caption" : "body2"}>
              Olá, <b>{perfil?.nome_comercial || 'Empreendedor'}</b>
            </Typography>
          </Box>

          {/* O texto do botÃ£o tambÃ©m se adapta */}
          <Button
            variant="contained"
            color={unreadCount > 0 ? "secondary" : "primary"}
            onClick={() => setChatOpen(true)}
            startIcon={
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsActive />
              </Badge>
            }
          >
            {!isMobile && (unreadCount > 0 ? "Novas Mensagens" : "Chat")}
          </Button>
        </Stack>
        {/* <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={{ xs: 2, sm: 2 }}
          sx={{ mb: { xs: 2.5, md: 4 } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight="900"
              color="primary"
              sx={{
                fontSize: { xs: '1.65rem', sm: '2rem', md: '2.125rem' },
                lineHeight: 1.15,
                wordBreak: 'break-word'
              }}
            >
              Painel de NegÃ³cios
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                wordBreak: 'break-word'
              }}
            >
              OlÃ¡, {perfil?.nome_comercial || 'Empreendedor'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setProdutoEditando(null);
              setOpenModal(true);
            }}
            sx={{
              borderRadius: '12px',
              px: 2.5,
              py: 1.1,
              width: { xs: '100%', sm: 'auto' },
              whiteSpace: 'nowrap'
            }}
          >
            Novo Produto
          </Button>
        </Stack> */}

        {/* TABS */}
        <Paper
          elevation={0}
          sx={{
            mb: { xs: 2.5, md: 4 },
            borderRadius: { xs: '14px', md: '16px' },
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            maxWidth: '100%'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: { xs: 52, sm: 64 },
              maxWidth: '100%',
              '& .MuiTabs-scroller': {
                overflowX: 'auto !important'
              },
              '& .MuiTab-root': {
                minHeight: { xs: 52, sm: 64 },
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 1.25, sm: 2 },
                fontSize: { xs: '0.72rem', sm: '0.82rem', md: '0.875rem' },
                textTransform: 'none',
                whiteSpace: 'nowrap'
              },
              '& .MuiTab-iconWrapper': {
                fontSize: { xs: 19, sm: 22 },
                mr: { xs: 0.6, sm: 1 }
              }
            }}
          >
            <Tab icon={<StorefrontIcon />} label="Produtos" iconPosition="start" />
            <Tab icon={<ShoppingCartIcon />} label={contexto.abaPedidosLabel} iconPosition="start" />
            <Tab icon={<AccountBalanceWalletIcon />} label="Carteira" iconPosition="start" />
            <Tab icon={<SettingsIcon />} label="Ajustes Vitrine" iconPosition="start" />
            <Tab icon={<AssessmentIcon />} label="Meus Leads" iconPosition="start" />
            <Tab icon={<AccountBalance />} label="Dados Pagamento" iconPosition="start" />
            <Tab icon={<LocalShippingIcon />} label="Entrega" iconPosition="start" />
            <Tab icon={<SmartToyIcon />} label="Atendente IA" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* TAB PRODUTOS */}
        {tabValue === 0 && (
          <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            {produtos.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  borderRadius: '18px',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center'
                }}
              >
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Nenhum produto cadastrado ainda
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Cadastre seu primeiro produto para comeÃ§ar a vender.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setProdutoEditando(null);
                    setOpenModal(true);
                  }}
                  sx={{
                    borderRadius: '12px',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Novo Produto
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {produtos.map((prod) => (
                  <Grid key={prod.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: '16px',
                        height: '100%',
                        border: '1px solid #e5e7eb',
                        transition: '0.25s ease',
                        bgcolor: '#fff',
                        '&:hover': {
                          boxShadow: { xs: 'none', md: 4 },
                          transform: { xs: 'none', md: 'translateY(-3px)' }
                        }
                      }}
                    >
                      <Box
                        sx={{
                          height: { xs: 190, sm: 170, md: 160 },
                          bgcolor: '#f1f5f9',
                          mb: 2,
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={
                            prod.imageUrl?.startsWith('http')
                              ? prod.imageUrl
                              : `${API_URL}${prod.imageUrl}`
                          }
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          alt={prod.name}
                        />
                      </Box>

                      <Typography
                        fontWeight="bold"
                        sx={{
                          fontSize: { xs: '1rem', sm: '1rem' },
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {prod.name}
                      </Typography>

                      <Typography
                        color="primary"
                        fontWeight="900"
                        sx={{
                          mt: 0.8,
                          fontSize: { xs: '1.1rem', sm: '1rem' }
                        }}
                      >
                        R$ {Number(prod.price).toFixed(2)}
                      </Typography>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        mt={2}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          onClick={() => {
                            setProdutoEditando(prod);
                            setOpenModal(true);
                          }}
                          sx={{
                            borderRadius: '10px',
                            py: { xs: 1, sm: 0.65 }
                          }}
                        >
                          Editar
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <StoreOrdersPanel />
          </Box>
        )}

        {tabValue === 3 && (
          <Box
            sx={{
              maxWidth: '100%',
              overflowX: 'hidden',
              '& iframe': {
                maxWidth: '100%'
              }
            }}
          >
            <Gerador tipo="EMPREENDEDOR" />
          </Box>
        )}

        {tabValue === 4 && (
          <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{
                mb: 3,
                fontSize: { xs: '1.35rem', sm: '1.5rem' }
              }}
            >
              Interessados nos Produtos
            </Typography>
            <ListaLeads leads={leads} />
          </Box>
        )}

        {tabValue === 5 && (
          <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{
                mb: 3,
                fontSize: { xs: '1.35rem', sm: '1.5rem' }
              }}
            >
              Dados Pagamentos
            </Typography>
            <PaymentSettings storeId={lojaId} />
          </Box>
        )}

        {tabValue === 6 && (
          <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <DeliverySettings storeId={perfil?.lojaId || user?.lojaId || ""} />
          </Box>
        )}

        {tabValue === 7 && (
          <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <StoreChatbotKnowledgeManager
              storeId={perfil?.lojaId || user?.lojaId || perfil?.id || ""}
            />
          </Box>
        )}

        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >


          <Dialog
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            fullWidth
            maxWidth="lg"
            PaperProps={{
              sx: {
                width: { xs: "100%", sm: "95%", md: "1100px" },
                height: { xs: "100dvh", sm: "86vh" },
                maxHeight: { xs: "100dvh", sm: "86vh" },
                m: { xs: 0, sm: 2 },
                borderRadius: { xs: 0, sm: 4 },
                overflow: "hidden",
                bgcolor: "#f8fafc",
              },
            }}
          >
            <DialogTitle
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2,
                bgcolor: "#0f172a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={900} fontSize={{ xs: 18, sm: 22 }}>
                  Atendimento {perfil?.nome_comercial || perfil?.name || "da Loja"}
                </Typography>

                <Typography fontSize={13} sx={{ opacity: 0.82 }}>
                  Converse com os clientes que vieram pela sua landing page.
                </Typography>
              </Box>

              <Button
                onClick={() => setChatOpen(false)}
                sx={{
                  minWidth: 0,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.12)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.22)",
                  },
                }}
              >
                Ã—
              </Button>
            </DialogTitle>

            <DialogContent
              sx={{
                p: 0,
                height: "100%",
                overflow: "hidden",
                bgcolor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                "& .MuiBox-root": {
                  minHeight: 0,
                },
              }}
            >
              {lojaId ? (
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    p: { xs: 1, sm: 2 },
                  }}
                >
                  <HumanChatInbox
                    chatbotTipo="LOJA"
                    chatbotOwnerId={lojaId}
                    title="Atendimentos da Loja"
                  />
                </Box>
              ) : (
                <Box sx={{ p: 3 }}>
                  <Typography color="error">
                    Loja não identificada. Não foi possível carregar os atendimentos.
                  </Typography>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </Box>

        <ModalCadastroProduto
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setProdutoEditando(null);
          }}
          produtoId={produtoEditando?.id}
          dadosProduto={produtoEditando}
          onSuccess={handleSucessoProduto}
          plan={perfil?.plano || 'BASICO'}
        />


      </Container>
    </Box>
  );
}
