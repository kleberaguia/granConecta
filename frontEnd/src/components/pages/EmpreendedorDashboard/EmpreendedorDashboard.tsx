import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Paper, Button,
  Stack, CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Usando Grid2 para compatibilidade 2026

import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import api from '../../../api/api';
import ModalCadastroProduto from '../../ModalCadastroProduto/ModalNovoProduto';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { API_URL } from '../../../utils/config';
import Gerador from '../../LandingPages/Gerador';
import { ListaLeads } from '../../ListaLeads/ListaLeads';
import { PaymentSettings } from "../../PaymentSettings/PaymentSettings";
import { AccountBalance } from '@mui/icons-material';
import { StoreOrdersPanel } from '../../StoreOrdersPanel/StoreOrdersPanel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { DeliverySettings } from '../../DeliverySettings/DeliverySettings';



// --- CONFIGURAÇÃO DE TEMPLATES ---

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
  const { user } = useAuth();


  const [tabValue, setTabValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [perfil, setPerfil] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [_openModalEdit, setOpenModalEdit] = useState(false);

  const [_storeSlug, setStoreSlug] = useState('');
  const [_pixKey, setPixKey] = useState('');
  const [leads, setLeads] = useState([]);
  const [_ayout, setLayout] = useState({
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

 
  const handleSucessoProduto = () => {
    setOpenModal(false);
    setOpenModalEdit(false);
    setProdutoEditando(null);
    carregarDados(); // Garante que o novo produto apareça na lista
  };


  const carregarDados = async () => {
    try {
      setLoading(true);
      const resPerfil = await api.get('/users/me');
      const dados = resPerfil.data;

      if (dados) {
        setPerfil(dados.perfil);
        setStoreSlug(dados.slug || '');
        setPixKey(dados.chavePix || ''); // Nome conforme seu log do banco

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
        })
      }

      const resLeads = await api.get(`/lojas/leads/meus`);
      setLeads(resLeads.data);

      const [resProdutos, _resPedidos] = await Promise.all([
        api.get('/produtos/lojas/meus-produtos'),
        api.get('/credits/my-balance')
      ]);


      setProdutos(resProdutos.data);
    } catch (err) {
      console.error("Erro ao carregar:", err);
      toast.error("Erro ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    if (user) carregarDados();
  }, [user]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="primary">Painel de Negócios</Typography>
          <Typography color="text.secondary">Olá, {perfil?.nome_comercial || 'Empreendedor'}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setProdutoEditando(null); setOpenModal(true); }} sx={{ borderRadius: '12px' }}>
          Novo Produto
        </Button>
      </Stack>

      <Paper sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<StorefrontIcon />} label="Produtos" iconPosition="start" />
          <Tab icon={<ShoppingCartIcon />} label="Pedidos" iconPosition="start" />
          <Tab icon={<AccountBalanceWalletIcon />} label="Carteira" iconPosition="start" />
          <Tab icon={<SettingsIcon />} label="Ajustes Vitrine" iconPosition="start" />
          <Tab icon={<AssessmentIcon />} label="Meus Leads" iconPosition="start" />
          <Tab icon={<AccountBalance />} label="Dados Pagamento" iconPosition="start" />
          <Tab icon={<LocalShippingIcon />} label="Entrega" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* TAB PRODUTOS */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {produtos.map((prod) => (
            <Grid key={prod.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper sx={{ p: 2, borderRadius: '16px', height: '100%', transition: '0.3s', '&:hover': { boxShadow: 4 } }}>
                <Box sx={{ height: 160, bgcolor: '#f5f5f5', mb: 2, borderRadius: '12px', overflow: 'hidden' }}>
                  <img
                    src={prod.imageUrl?.startsWith('http') ? prod.imageUrl : `${API_URL}${prod.imageUrl}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={prod.name}
                  />
                </Box>
                <Typography fontWeight="bold" noWrap>{prod.name}</Typography>
                <Typography color="primary" fontWeight="900">R$ {Number(prod.price).toFixed(2)}</Typography>
                <Stack direction="row" spacing={1} mt={2}>
                  <Button size="small" variant="outlined" fullWidth onClick={() => { setProdutoEditando(prod); setOpenModal(true); }}>Editar</Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 1 && <StoreOrdersPanel />}

     
      {/* TAB AJUSTES VITRINE */}
      {tabValue === 3 && (
        <Box>
          {/* <Paper sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Identidade Visual</Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={3} alignItems="center">
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '12px',
                  bgcolor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px dashed #ccc'
                }}
              >
                {layout.logoUrl ? (
                  <img
                    src={layout.logoUrl.startsWith('data:') ? layout.logoUrl : `${API_URL}${layout.logoUrl}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : <StorefrontIcon sx={{ fontSize: 40, color: '#ccc' }} />}
              </Box>

              <Box>
                <Button variant="outlined" component="label" startIcon={<ColorLensIcon />}>
                  Upload da Logo
                  <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Recomendado: Quadrado (512x512px)
                </Typography>
              </Box>
            </Stack>
          </Paper> */}

          <Gerador tipo="EMPREENDEDOR" />
        </Box>
      )}

      {tabValue === 4 && (
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ mb: 3 }}>Interessados nos Produtos</Typography>
          <ListaLeads leads={leads} />
        </Box>
      )}


      {tabValue === 5 && (
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ mb: 3 }}>Dados Pagamentos</Typography>
          <PaymentSettings storeId={user?.lojaId || ""} />
        </Box>
      )}

       {tabValue === 6 && ( // Assumindo que Entrega é a posição 2
        <Box>
          <DeliverySettings storeId={perfil?.lojaId || user?.lojaId || ""} />
        </Box>
      )}


      <ModalCadastroProduto
        open={openModal} // Usamos apenas o openModal para ambos
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

  );
}