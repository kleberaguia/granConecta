import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Paper, Typography, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Avatar, CircularProgress, Container,
  Tabs, Tab, Card, CardContent, Tooltip
} from "@mui/material";
import {
  Logout, WhatsApp, People, Payments,
  WarningAmber, AccountBalanceWallet, CheckCircle, Store,
  Block, DoneAll
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import toast from "react-hot-toast";

// --- INTERFACES ---
interface Empreendedor {
  id: number;
  usuarioId?: string;
  nome: string;
  email: string;
  foto_perfil_url?: string;
  plano: string;
  saldo_carteira: number;
  status_conta: string;
  status_pagamento: string;
  telefone: string | null;
}

interface PrestadorPerfil {
  id: string;
  nome_profissional: string;
  plano: string;
  tipo_assinatura: 'MENSAL' | 'ANUAL';
  status_aprovacao: string;
  status_pagamento: string;
  ativo: number | boolean;
  disponivel: number | boolean;
  valor_cobrado: string;
  usuario?: { email: string; nome: string; foto_perfil_url?: string };
}

interface Stats {
  ativos: number;
  pendentes: number;
  receita: number;
  creditos_totais: number;
  receita_mensal: number;
  receita_anual: number;
  qtd_mensal: number;
  qtd_anual: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<Stats>({
    ativos: 0,
    pendentes: 0,
    receita: 0,
    creditos_totais: 0,
    receita_mensal: 0,
    receita_anual: 0,
    qtd_mensal: 0,
    qtd_anual: 0
  });

  const [empreendedores, setEmpreendedores] = useState<Empreendedor[]>([]);
  const [prestadores, setPrestadores] = useState<PrestadorPerfil[]>([]);

  const isFetching = useRef(false);

  const carregarDadosAdmin = async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      // setLoading(true); // Remova o loading global no refresh para não "piscar" a tela
      const [resStats, resUsers, resPrestadores] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/assinaturas"),
        api.get("/admin/prestadores/aprovacao").catch(() => ({ data: [] }))
      ]);

      console.log("📊 Stats recebidos:", resPrestadores.data); // Verifique se aqui vem 0

      // ✅ Garantia: Se a API falhar ou vier vazio, mantém o zero em vez de quebrar
      setStats({
        ativos: resStats.data?.ativos || 0,
        pendentes: resStats.data?.pendentes || 0,
        receita: resStats.data?.receita || 0,
        creditos_totais: resStats.data?.creditos_totais || 0,
        receita_mensal: resStats.data?.receita_mensal || 0,
        receita_anual: resStats.data?.receita_anual || 0,
        qtd_mensal: resStats.data?.qtd_mensal || 0,
        qtd_anual: resStats.data?.qtd_anual || 0
      });

      setEmpreendedores(resUsers.data || []);
      setPrestadores(resPrestadores.data || []);
    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao sincronizar dados");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    carregarDadosAdmin();
    const interval = setInterval(() => carregarDadosAdmin(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAtivarStatusUsuario = async (usuarioId: string) => {
    try {
      await api.patch(`/admin/usuarios/${usuarioId}/status_conta`, { status_conta: 'APROVADO' });
      toast.success("Acesso liberado!");
      carregarDadosAdmin();
    } catch (err: any) {
      toast.error("Erro ao liberar acesso");
    }
  };

  const handleAprovarPrestador = async (id: string) => {
    try {
      await api.patch(`/admin/perfil-prestador/prestadores/${id}/aprovar`);
      toast.success("Perfil Aprovado!");
      carregarDadosAdmin();
    } catch {
      toast.error("Erro ao aprovar");
    }
  };

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography>Carregando ecossistema GranConecta...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f1f5f9", minHeight: "100vh", pb: 10 }}>
      {/* BARRA SUPERIOR */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 0, borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: BLUE, width: 40, height: 40 }}>GC</Avatar>
            <Typography variant="h5" fontWeight="900" color="#1e293b">Admin Console</Typography>
          </Box>
          <Button variant="outlined" color="error" startIcon={<Logout />} onClick={() => { logout(); navigate("/login"); }}>
            Sair
          </Button>
        </Container>
      </Paper>

      <Container maxWidth="lg">
        {/* CARDS DE ESTATÍSTICAS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <StatCard title="Ativos" value={stats.ativos} icon={<CheckCircle color="success" />} color="#22c55e" />
          <StatCard title="Pendentes" value={stats.pendentes} icon={<WarningAmber color="warning" />} color="#f59e0b" />
          <StatCard title="Receita Total" value={brl(stats.receita)} icon={<Payments color="primary" />} color="#3b82f6" />
          <StatCard title="Carteira Global" value={brl(stats.creditos_totais)} icon={<AccountBalanceWallet color="secondary" />} color="#8b5cf6" />
        </Grid>

        {/* TABS DE GERENCIAMENTO */}
        <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}>
            <Tab icon={<Store />} label="Empreendedores" iconPosition="start" />
            <Tab icon={<People />} label="Prestadores de Serviço" iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Plano</TableCell>
                      <TableCell>Status Pag.</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {empreendedores.map((emp) => (
                      <TableRow key={emp.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar src={emp.foto_perfil_url}>{emp.nome[0]}</Avatar>
                            <Box>
                              <Typography fontWeight="bold">{emp.nome}</Typography>
                              <Typography variant="caption" color="textSecondary">{emp.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={emp.plano} size="small" /></TableCell>
                        <TableCell><StatusChip status={emp.status_pagamento} /></TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="WhatsApp">
                              <IconButton size="small" color="success" onClick={() => window.open(`https://wa.me/${emp.telefone?.replace(/\D/g, '')}`)}>
                                <WhatsApp />
                              </IconButton>
                            </Tooltip>
                            {emp.status_conta === 'PENDENTE' && (
                              <Button size="small" variant="contained" onClick={() => handleAtivarStatusUsuario(emp.usuarioId || '')}>
                                Liberar
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tabValue === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Prestador</TableCell>
                      <TableCell>Plano / Valor</TableCell>
                      <TableCell>Situação do Perfil</TableCell> {/* Nova Coluna Agrupada */}
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prestadores.map((pr) => (
                      <TableRow key={pr.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar src={pr.usuario?.foto_perfil_url}>{pr.nome_profissional[0]}</Avatar>
                            <Box>
                              <Typography fontWeight="bold">{pr.nome_profissional}</Typography>
                              <Typography variant="caption" color="textSecondary">{pr.usuario?.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{pr.plano}</Typography>
                          <Typography variant="caption" display="block">{brl(Number(pr.valor_cobrado))}</Typography>
                        </TableCell>

                        <TableCell>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {/* STATUS PAGAMENTO */}
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="caption" sx={{ minWidth: 70 }}>Pagamento:</Typography>
                              <StatusChip status={pr.status_pagamento} />
                            </Box>

                            {/* STATUS APROVAÇÃO */}
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="caption" sx={{ minWidth: 70 }}>Aprovação:</Typography>
                              <Chip
                                label={pr.status_aprovacao?.toUpperCase()}
                                size="small"
                                color={pr.status_aprovacao === 'APROVADO' ? 'success' : 'warning'}
                                variant="outlined"
                                sx={{ fontSize: '9px', height: '18px' }}
                              />
                            </Box>

                            {/* STATUS ATIVO (SISTEMA) */}
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="caption" sx={{ minWidth: 70 }}>Visível:</Typography>
                              <Chip
                                label={Number(pr.ativo) === 1 ? 'ATIVO' : 'INATIVO'}
                                size="small"
                                color={Number(pr.ativo) === 1 ? 'info' : 'default'}
                                sx={{ fontSize: '9px', height: '18px' }}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box display="flex" gap={1}>
                            {pr.status_aprovacao === 'PENDENTE' && (
                              <Button
                                startIcon={<DoneAll />}
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleAprovarPrestador(pr.id)}
                              >
                                Aprovar
                              </Button>
                            )}
                            <Tooltip title="Bloquear Perfil">
                              <IconButton size="small" color="error">
                                <Block />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

// COMPONENTES AUXILIARES
const BLUE = "#120a8f";

function StatCard({ title, value, icon, color }: any) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Card sx={{ borderRadius: 4, borderLeft: `6px solid ${color}` }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography color="textSecondary" variant="overline" fontWeight="bold">{title}</Typography>
            {icon}
          </Box>
          <Typography variant="h5" fontWeight="900">{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

function StatusChip({ status }: { status: string }) {
  // Forçamos para minúsculo e removemos espaços para garantir a comparação
  const s = String(status || '').toLowerCase().trim();

  console.log('ssssssssssssssssssss ', s)

  const config: any = {
    'paid': { label: 'Pago', color: 'success' },
    'pago': { label: 'Pago', color: 'success' },
    'active': { label: 'Ativo', color: 'success' },
    'approved': { label: 'Aprovado', color: 'success' }, // Adicionado para garantir
    'pending': { label: 'Pendente', color: 'warning' },
    'pendente': { label: 'Pendente', color: 'warning' },
    'failed': { label: 'Falhou', color: 'error' },
    'rejected': { label: 'Rejeitado', color: 'error' }
  };

  const c = config[s] || { label: status || 'Pendente', color: 'default' };

  return (
    <Chip
      label={c.label.toUpperCase()}
      color={c.color}
      size="small"
      sx={{ fontWeight: 'bold', fontSize: '10px' }}
    />
  );
}