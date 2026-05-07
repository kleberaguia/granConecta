import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Container, Typography, Paper, Tab, Tabs,
    Stack, Button, CircularProgress, Chip,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Verified, LocationOn, Person,
    Handshake, Assignment,
    TrendingUp, Paid,
    AddCircleOutline
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../api/api';
import MetricCard from './MetricCard';
import ModalCandidatar from '../ModalCandidatar/ModalCandidatar';
import ModalGerenciarProposta from '../ModalGerenciarProposta/ModalGerenciarProposta';
import ModalCadastroProduto from '../ModalCadastroProduto/ModalNovoProduto';
import toast from 'react-hot-toast';
import Gerador from '../LandingPages/Gerador';
import CriarBanner from '../Layouts/CriarBanner';
import ListaMeusBanners from '../Layouts/ListaMeusBanners';
import { useAuth } from '../../context/AuthContext';
import { ListaLeads } from '../ListaLeads/ListaLeads';

const formatarMoeda = (valor: any) => {
    const num = parseFloat(String(valor).replace(',', '.'));
    return isNaN(num) ? "0,00" : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function PrestadorDashboard() {
    // 1. ESTADOS (HOOKS)
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [oportunidades, setOportunidades] = useState([]);
    const [meusTrabalhos, setMeusTrabalhos] = useState([]);
    const [ofertasAll, setOfertasAll] = useState<any[]>([]);
    const [faturas, setFaturas] = useState<any[]>([]);
    const [stats, setStats] = useState({ ganhos: 0, ativos: 0, recebido: 0, pendente: 0, taxaConversao: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedServico, setSelectedServico] = useState<any>(null);
    const [gerenciarOpen, setGerenciarOpen] = useState(false);
    const [candidaturaSelecionada, setCandidaturaSelecionada] = useState<any>(null);
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [meusBanners, setMeusBanners] = useState<any[]>([]);
    const [loadingBanners, setLoadingBanners] = useState(false);
    const [meusProdutos, setMeusProdutos] = useState<any[]>([]);
    const { user } = useAuth();
    const [leadsInteracoes, setLeadsInteracoes] = useState([]);

    const u = user as any;

    // 2. LOGICA DE VENDEDOR (HOOKS)
    const ehVendedor = useMemo(() => {

        console.log("DEBUG PERFIL:", userProfile);
        // Pegamos o objeto inteiro para checar no console
        console.log("Monitorando Categoria:", {
            categoriaTipo: userProfile?.categoriaTipo,
            categoria: userProfile?.categoria,
            tipo: userProfile?.tipo,
            perfilInteiro: userProfile
        });

        const valor = userProfile?.categoriaTipo ||
            userProfile?.categoria ||
            userProfile?.tipo ||
            userProfile?.business_type || "";

        // Normalizamos: tiramos espaços e passamos para MAIÚSCULO
        const cat = String(valor).trim().toUpperCase();

        const listaVendedores = ['AUTOMOTIVO', 'PRODUTO', 'FOOD', 'BEBIDA', 'SOBREMESA', 'LOJA'];
        const resultado = listaVendedores.includes(cat);

        console.log("Resultado ehVendedor:", resultado, "para a string:", cat);
        return resultado;
    }, [userProfile]);

    // 3. FUNÇÕES DE CARGA (HOOKS)
    const carregarBanners = useCallback(async () => {
        if (!userProfile?.id) return;
        setLoadingBanners(true);
        try {
            const res = await api.get(`/marketplace/banners/meus/${userProfile.id}`);
            setMeusBanners(res.data);
        } catch (err) {
            console.error("Erro ao carregar banners", err);
        } finally {
            setLoadingBanners(false);
        }
    }, [userProfile?.id]);

    const normalizar = (str: any) =>
        String(str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

    const carregarTudo = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Busca os dados do Dashboard PRIMEIRO (essencial para o ID da loja)
            const resDash = await api.get('/servicos/solicitacoes/prestador/dashboard');
            const dashPerfil = resDash.data.perfil;

            console.log('resDash ', resDash)
            console.log('u.id ', u.id)


            if (!u.id || !dashPerfil?.store_id) {
                console.error("ID do perfil ou da loja não encontrado");
                // Se não tiver ID de loja, não adianta tentar carregar produtos
                setLoading(false);
                return;
            }
            // 2. Agora que temos dashPerfil.id, buscamos o resto em paralelo
            // Note que separamos o Financeiro para um try/catch próprio para não travar o dashboard
            const [resUser, resOfertas, resOfertaAll, resProdutos, resLeads] = await Promise.all([
                api.get(`/users/${u.id}`),
                api.get('/servicos/ofertas/meus'),
                api.get('/servicos/ofertas/listarOferta/meus'),
                api.get(`/produtos/lojas/meus-produtos/${dashPerfil.id}`).catch(() => ({ data: [] })),
                api.get(`/lojas/leads/meus`).catch(() => ({ data: [] }))
            ]);

            // 3. Extração e Atualização de Estados
            const perfilDados = resUser.data?.perfil || resUser.data;
            const categoriaPrestador =
                perfilDados?.categoriaSlug ||
                perfilDados?.categoria ||
                perfilDados?.tipo;

            const categoriaNormalizada = normalizar(categoriaPrestador);

            console.log("Categoria Prestador RAW:", categoriaPrestador);
            console.log("Categoria Prestador NORMALIZADA:", categoriaNormalizada);

            (resDash.data.oportunidades || []).forEach((op: any) => {
                console.log("OP:", {
                    original: op,
                    categoriaExtraida:
                        op?.categoriaSlug ||
                        op?.categoria ||
                        op?.categoria_nome ||
                        op?.tipo,
                    normalizada: normalizar(
                        op?.categoriaSlug ||
                        op?.categoria ||
                        op?.categoria_nome ||
                        op?.tipo
                    )
                });
            });

            const oportunidadesFiltradas = (resDash.data.oportunidades || []).filter((op: any) => {
                const categoriaOp =
                    op?.categoriaSlug ||
                    op?.categoria ||
                    op?.categoria_nome ||
                    op?.tipo;

                return normalizar(categoriaOp) === categoriaNormalizada;
            });

            // Salvamos o perfil completo (que agora contém o ID da loja vindo da sua nova query SQL)
            setUserProfile(perfilDados);

            setLeadsInteracoes(resLeads.data || []);
            setMeusProdutos(resProdutos.data || []);
            setOportunidades(oportunidadesFiltradas);
            setMeusTrabalhos(resDash.data.propostas || []);
            setOfertasAll(resOfertaAll.data || []);

            // 4. Financeiro isolado (para evitar erro 500 travar tudo)
            try {
                const resFin = await api.get('/pagamentos/meus');
                const faturasData = resFin.data || [];
                setFaturas(faturasData);

                const ganhosPrevistos = resOfertas.data?.reduce((acc: number, curr: any) => acc + (parseFloat(curr.valor) || 0), 0);
                const jaRecebido = faturasData.filter((f: any) => f.status === 'PAGO').reduce((acc: number, f: any) => acc + parseFloat(f.valor), 0);

                setStats({
                    ganhos: ganhosPrevistos || 0,
                    ativos: resOfertas.data?.filter((o: any) => o.status !== 'CONCLUIDA').length || 0,
                    recebido: jaRecebido,
                    pendente: (ganhosPrevistos || 0) - jaRecebido,
                    taxaConversao: resDash.data.propostas?.length > 0 ? (resOfertas.data?.length / resDash.data.propostas.length) * 100 : 0
                });
            } catch (e) {
                console.warn("Erro ao carregar dados financeiros, mas o restante do dashboard está ok.");
            }

        } catch (err) {
            console.error("Erro geral ao carregar dashboard:", err);
            toast.error("Erro ao sincronizar dados");
        } finally {
            setLoading(false);
        }
    }, [u.id]);

    // 4. EFFECTS (HOOKS)
    useEffect(() => { carregarTudo(); }, [carregarTudo]);
    useEffect(() => { if (userProfile?.id) carregarBanners(); }, [userProfile?.id, carregarBanners]);

    // HANDLERS
    const handleUpdateStatus = async (ofertaId: string, action: 'aceitar' | 'iniciar' | 'concluir') => {
        try {
            await api.post(`/servicos/ofertas/${ofertaId}/${action}`);
            toast.success(`Status atualizado!`);
            carregarTudo();
        } catch (err: any) { toast.error("Erro ao atualizar status"); }
    };

    const handleEnviarAlerta = async (faturaId: string) => {
        try {
            await api.post(`/faturas/${faturaId}/alertar`);
            toast.success("Alerta enviado!");
            carregarTudo();
        } catch (error) { toast.error("Erro ao enviar alerta."); }
    };

    // 5. RETORNOS CONDICIONAIS (APÓS TODOS OS HOOKS)
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const faturasCompletas = faturas.map((f: any) => {
        const ofertaRelacionada = ofertasAll.find((o: any) => o.id === f.oferta_id || o.solicitacao_id === f.solicitacao_id);
        return {
            ...f,
            exibir_nome: ofertaRelacionada?.cliente_nome || f.cliente_nome || "Cliente",
            exibir_titulo: f.solicitacao_titulo || ofertaRelacionada?.solicitacao_titulo || f.descricao || "Serviço"
        };
    });

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* HEADER */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900">Painel do Profissional</Typography>
                    <Typography color="text.secondary">Bem-vindo, <b>{userProfile?.nome || userProfile?.name}</b></Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                    {ehVendedor && (
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<AddCircleOutline />}
                            onClick={() => setProductModalOpen(true)}
                            sx={{ fontWeight: 'bold', borderRadius: '10px' }}
                        >
                            Novo Produto
                        </Button>
                    )}
                    <Chip icon={<Verified />} label="Verificado" color="primary" sx={{ fontWeight: 'bold' }} />
                </Stack>
            </Stack>

            {/* METRICS CARDS */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Total em Contratos" value={`R$ ${formatarMoeda(stats.ganhos)}`} icon={<Handshake />} color="#3b82f6" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Total Recebido" value={`R$ ${formatarMoeda(stats.recebido)}`} icon={<Paid />} color="#10b981" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Serviços Ativos" value={stats.ativos} icon={<Assignment />} color="#f59e0b" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Taxa de Conversão" value={`${stats.taxaConversao.toFixed(0)}%`} icon={<TrendingUp />} color="#8b5cf6" />
                </Grid>
            </Grid>

            {/* NAVEGAÇÃO POR ABAS */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab label="Oportunidades" />
                <Tab label="Minhas Propostas" />
                <Tab label="Execução" />
                <Tab label="Financeiro" />
                <Tab label="Minha Página" />
                <Tab label="Marketplace" />
                {ehVendedor && <Tab label="Meu Catálogo" />}
                <Tab label="Leads / Contatos" />
            </Tabs>

            {/* CONTEÚDO DAS ABAS */}
            {tab === 0 && (
                <Grid container spacing={3}>
                    {oportunidades.length > 0 ? oportunidades.map((op: any) => (
                        <Grid size={{ xs: 12, md: 6 }} key={op.id}>
                            <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Typography variant="h6" fontWeight="bold">{op.titulo}</Typography>
                                <Typography color="primary" variant="h5" fontWeight="900" sx={{ my: 1 }}>R$ {formatarMoeda(op.valor_sugerido)}</Typography>
                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    <Typography variant="body2" display="flex" alignItems="center" gap={1}><Person sx={{ fontSize: 18 }} /> {op.morador_nome}</Typography>
                                    <Typography variant="body2" display="flex" alignItems="center" gap={1}><LocationOn sx={{ fontSize: 18 }} /> {op.bairro}</Typography>
                                </Stack>
                                <Button variant="contained" fullWidth onClick={() => { setSelectedServico(op); setModalOpen(true); }}>
                                    Enviar Proposta
                                </Button>
                            </Paper>
                        </Grid>
                    )) : (
                        <Typography sx={{ width: '100%', textAlign: 'center', py: 5 }}>Sem oportunidades no momento.</Typography>
                    )}
                </Grid>
            )}

            {tab === 1 && (
                <Stack spacing={2}>
                    {meusTrabalhos.map((trab: any) => (
                        <Paper key={trab.id} sx={{ p: 2 }}>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography fontWeight="bold">{trab.solicitacao_titulo}</Typography>
                                    <Chip label={trab.status} size="small" sx={{ mt: 1 }} color="info" variant="outlined" />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Typography variant="body2">Proposta: <b>R$ {formatarMoeda(trab.valor_proposto)}</b></Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Button variant="outlined" fullWidth onClick={() => { setCandidaturaSelecionada(trab); setGerenciarOpen(true); }}>
                                        Gerenciar
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Stack>
            )}

            {tab === 2 && (
                <Stack spacing={2}>
                    {ofertasAll.map((oferta: any) => (
                        <Paper key={oferta.id} sx={{ p: 3, borderLeft: '6px solid #1976d2' }}>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Typography variant="h6" fontWeight="bold">{oferta.solicitacao_titulo}</Typography>
                                    <Typography variant="body2">Cliente: {oferta.cliente_nome}</Typography>
                                    <Typography variant="body2" color="primary" fontWeight="bold">R$ {formatarMoeda(oferta.valor)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: 'right' }}>
                                    {oferta.status === 'PENDENTE' && <Button variant="contained" color="info" onClick={() => handleUpdateStatus(oferta.id, 'aceitar')}>Aceitar</Button>}
                                    {oferta.status === 'ACEITA' && <Button variant="contained" color="warning" onClick={() => handleUpdateStatus(oferta.id, 'iniciar')}>Iniciar</Button>}
                                    {oferta.status === 'EM_ANDAMENTO' && <Button variant="contained" color="success" onClick={() => handleUpdateStatus(oferta.id, 'concluir')}>Finalizar</Button>}
                                    {oferta.status === 'CONCLUIDA' && <Typography color="success.main" fontWeight="bold">SERVIÇO CONCLUÍDO</Typography>}
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Stack>
            )}

            {tab === 3 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" mb={2}>Resumo Financeiro</Typography>
                            <Box sx={{ width: '100%', height: 250, minHeight: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Recebido', value: stats.recebido || 0 },
                                                { name: 'Pendente', value: stats.pendente || 0 }
                                            ]}
                                            innerRadius={60}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" />
                                            <Cell fill="#f59e0b" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell>Cliente</TableCell>
                                        <TableCell>Valor</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {faturasCompletas.map((f: any) => (
                                        <TableRow key={f.id}>
                                            <TableCell>{f.exibir_nome}</TableCell>
                                            <TableCell>R$ {formatarMoeda(f.valor)}</TableCell>
                                            <TableCell><Chip label={f.status} color={f.status === 'PAGO' ? "success" : "warning"} size="small" /></TableCell>
                                            <TableCell align="right">
                                                {f.status !== 'PAGO' && (
                                                    <Button size="small" variant="outlined" onClick={() => handleEnviarAlerta(f.id)}>Alertar</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
            )}

            {tab === 4 && <Box sx={{ mt: 2 }}><Gerador tipo="PRESTADOR" /></Box>}

            {tab === 5 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ mb: 1 }}>Publicidade</Typography>
                    {loadingBanners ? <CircularProgress size={20} /> : <ListaMeusBanners banners={meusBanners} />}
                    <Divider sx={{ my: 4 }} />
                    <CriarBanner onSuccess={carregarBanners} />
                </Box>
            )}

            {tab === 6 && ehVendedor && (
                <Box sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h5" fontWeight="900">
                            {(userProfile?.categoriaTipo || userProfile?.categoria)?.toUpperCase() === 'AUTOMOTIVO' ? 'Meu Estoque de Veículos' : 'Meus Produtos'}
                        </Typography>
                        <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => setProductModalOpen(true)}>
                            Cadastrar Novo
                        </Button>
                    </Stack>
                    <Grid container spacing={3}>
                        {meusProdutos.length > 0 ? meusProdutos.map((prod: any) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={prod.id}>
                                <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <Box
                                        component="img"
                                        src={prod.imagem_url || 'https://via.placeholder.com/300'}
                                        sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                                    />
                                    <Box sx={{ p: 2 }}>
                                        <Typography fontWeight="bold" variant="subtitle1">{prod.nome}</Typography>
                                        <Typography color="primary" fontWeight="900">R$ {formatarMoeda(prod.preco)}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                            <Button size="small" variant="outlined" fullWidth>Editar</Button>
                                            <Button size="small" variant="outlined" color="error">Excluir</Button>
                                        </Stack>
                                    </Box>
                                </Paper>
                            </Grid>
                        )) : (
                            <Typography sx={{ width: '100%', textAlign: 'center', py: 5 }}>Você não possui itens cadastrados no catálogo.</Typography>
                        )}
                    </Grid>
                </Box>
            )}

            {tab === 7 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ mb: 2 }}>Contatos via Site Profissional</Typography>
                    <ListaLeads leads={leadsInteracoes} />
                </Box>
            )}

            {/* MODAIS */}
            <ModalCadastroProduto
                open={productModalOpen}
                onClose={() => setProductModalOpen(false)}
                storeId={userProfile?.id}
                onSuccess={carregarTudo}
                plan={userProfile?.plano || 'BASICO'}
                currentProductCount={meusProdutos.length}
            />

            {selectedServico && (
                <ModalCandidatar
                    open={modalOpen}
                    handleClose={() => setModalOpen(false)}
                    servico={{
                        ...selectedServico,
                        // Mapeando os campos que o Modal espera (conforme o código anterior)
                        usuario: {
                            nome: selectedServico.morador_nome,
                            foto_perfil_url: selectedServico.foto_perfil_url, // Verifique se o backend envia morador_foto
                            endereco_resumido: selectedServico.bairro || selectedServico.endereco
                        }
                    }}
                    onSuccess={() => {
                        toast.success("Você assumiu este serviço!");
                        carregarTudo();
                    }}
                />
            )}

            {candidaturaSelecionada && (
                <ModalGerenciarProposta open={gerenciarOpen} handleClose={() => setGerenciarOpen(false)} proposta={candidaturaSelecionada} onSuccess={carregarTudo} />
            )}
        </Container>
    );
}