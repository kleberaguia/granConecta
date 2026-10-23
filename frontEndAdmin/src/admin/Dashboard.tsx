import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWallet,
  Block,
  Campaign,
  Radar as RadarIcon,
  CheckCircle,
  DoneAll,
  Logout,
  Payments,
  People,
  Store,
  SupportAgent,
  WarningAmber,
  WhatsApp,
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import toast from "react-hot-toast";

import AdminChatInbox from "../components/AdminChatInbox/AdminChatInbox";

/* =========================================================
 * INTERFACES
 * =========================================================
 */

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
  usuarioId: string;
  nome_profissional: string;

  plano: string;

  tipo_assinatura:
  | "MENSAL"
  | "ANUAL";

  status_aprovacao: string;
  status_pagamento: string;

  ativo: number | boolean;
  disponivel: number | boolean;

  valor_cobrado: string;

  usuario?: {
    email: string;
    nome: string;
    foto_perfil_url?: string;
  };
}

interface RadarOpportunity {
  categoriaId: number;
  categoria: string;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  chaveRegiao: string;
  pesquisas: number;
  semResultado: number;
  interessados: number;
  alertaId?: string | null;
  statusGestao?: "NOVO" | "EM_CAPTACAO" | "RESOLVIDO" | "DESCARTADO";
}

type RadarProfessionalStatus = "PROSPECTADO" | "CONTATADO" | "INTERESSADO" | "CADASTRADO" | "DESCARTADO";

interface RadarProfessional {
  id: string;
  alertaId?: string;
  prestadorId?: string | null;
  nome?: string | null;
  origem?: "EXTERNO" | "CADASTRADO";
  nomeExterno?: string | null;
  nomeProfissional?: string | null;
  nome_profissional?: string | null;
  status: RadarProfessionalStatus;
  observacao?: string | null;
  statusPrestador?: string | null;
  statusAssinatura?: string | null;
  acompanhamento?: {
    cadastroAssociado: boolean;
    perfilStatus: string | null;
    statusAprovacao: string | null;
    perfilAtivo: boolean;
    usuarioStatus: string | null;
    statusAssinatura: string | null;
    assinaturaVenceEm: string | null;
    assinaturaBloqueada: boolean;
    assinaturaVencida: boolean;
    pendencias: string[];
    elegibilidadeDot: string;
  } | null;
}

const RADAR_PROFESSIONAL_STATUSES: RadarProfessionalStatus[] = [
  "PROSPECTADO", "CONTATADO", "INTERESSADO", "CADASTRADO", "DESCARTADO"
];

const radarProfessionalLabel: Record<RadarProfessionalStatus, string> = {
  PROSPECTADO: "Prospectado", CONTATADO: "Contatado", INTERESSADO: "Interessado",
  CADASTRADO: "Cadastrado", DESCARTADO: "Descartado"
};

interface RadarOverview {
  resumo: {
    pesquisas: number;
    semResultado: number;
    interessados: number;
    regioes: number;
  };
  oportunidades: RadarOpportunity[];
}

const EMPTY_RADAR: RadarOverview = {
  resumo: { pesquisas: 0, semResultado: 0, interessados: 0, regioes: 0 },
  oportunidades: [],
};

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

/* =========================================================
 * DASHBOARD
 * =========================================================
 */

export default function Dashboard() {
  const navigate = useNavigate();

  const { logout } = useAuth();

  const [loading, setLoading] =
    useState(true);

  const [tabValue, setTabValue] =
    useState(0);

  const [stats, setStats] =
    useState<Stats>({
      ativos: 0,
      pendentes: 0,
      receita: 0,
      creditos_totais: 0,

      receita_mensal: 0,
      receita_anual: 0,

      qtd_mensal: 0,
      qtd_anual: 0,
    });

  const [
    empreendedores,
    setEmpreendedores,
  ] = useState<Empreendedor[]>([]);

  const [
    prestadores,
    setPrestadores,
  ] = useState<PrestadorPerfil[]>([]);

  const [radar, setRadar] = useState<RadarOverview>(EMPTY_RADAR);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [radarCategoria, setRadarCategoria] = useState("TODAS");
  const [radarRegiao, setRadarRegiao] = useState("TODAS");
  const [radarSituacao, setRadarSituacao] = useState("TODAS");
  const [radarStatus, setRadarStatus] = useState("TODOS");
  const [radarEditando, setRadarEditando] = useState<RadarOpportunity | null>(null);
  const [radarNovoStatus, setRadarNovoStatus] = useState("EM_CAPTACAO");
  const [radarObservacao, setRadarObservacao] = useState("");
  const [radarSalvando, setRadarSalvando] = useState(false);

  const [radarProfissionais, setRadarProfissionais] = useState<RadarProfessional[]>([]);
  const [radarProfLoading, setRadarProfLoading] = useState(false);
  const [radarProfSaving, setRadarProfSaving] = useState(false);
  const [radarProfErro, setRadarProfErro] = useState("");
  const [radarProfOrigem, setRadarProfOrigem] = useState<"EXTERNO" | "CADASTRADO">("EXTERNO");
  const [radarProfNome, setRadarProfNome] = useState("");
  const [radarProfPrestadorId, setRadarProfPrestadorId] = useState("");
  const [radarProfObs, setRadarProfObs] = useState("");
  const [radarProfStatus, setRadarProfStatus] = useState<RadarProfessionalStatus>("PROSPECTADO");
  const [radarProfEditId, setRadarProfEditId] = useState<string | null>(null);
  const [radarProfEditStatus, setRadarProfEditStatus] = useState<RadarProfessionalStatus>("CONTATADO");
  const [radarProfEditObs, setRadarProfEditObs] = useState("");

  const [radarAssociandoId, setRadarAssociandoId] =
    useState<string | null>(null);

  const [radarAssociarPrestadorId, setRadarAssociarPrestadorId] =
    useState("");

  const carregarProfissionaisRadar = async (alertaId: string) => {
    setRadarProfLoading(true);
    setRadarProfErro("");
    try {
      const response = await api.get<RadarProfessional[] | { profissionais?: RadarProfessional[]; items?: RadarProfessional[] }>(
        `/admin/radar-demanda/oportunidades/${encodeURIComponent(alertaId)}/profissionais`
      );
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.profissionais || data.items || []);
      setRadarProfissionais(list);
    } catch (error: any) {
      setRadarProfErro(error?.response?.data?.error || "Não foi possível consultar os profissionais.");
      setRadarProfissionais([]);
    } finally {
      setRadarProfLoading(false);
    }
  };

  const abrirGestaoRadar = (item: RadarOpportunity) => {
    setRadarEditando(item);
    setRadarNovoStatus(item.statusGestao || "EM_CAPTACAO");
    setRadarObservacao("");
    setRadarProfissionais([]);
    setRadarProfErro("");
    setRadarProfNome("");
    setRadarProfPrestadorId("");
    setRadarProfObs("");
    setRadarProfEditId(null);
    if (item.alertaId) void carregarProfissionaisRadar(item.alertaId);
  };

  const adicionarProfissionalRadar = async () => {
    if (!radarEditando?.alertaId) {
      toast.error("Salve primeiro a oportunidade para criar seu acompanhamento.");
      return;
    }
    if (radarProfOrigem === "EXTERNO" && !radarProfNome.trim()) {
      toast.error("Informe o nome do profissional externo.");
      return;
    }
    if (radarProfOrigem === "CADASTRADO" && !radarProfPrestadorId) {
      toast.error("Selecione um prestador cadastrado.");
      return;
    }
    setRadarProfSaving(true);
    try {
      await api.post(`/admin/radar-demanda/oportunidades/${encodeURIComponent(radarEditando.alertaId)}/profissionais`, {
        ...(radarProfOrigem === "EXTERNO" ? { nomeExterno: radarProfNome.trim() } : { prestadorId: radarProfPrestadorId }),
        status: radarProfStatus,
        observacao: radarProfObs.trim(),
      });
      toast.success("Profissional vinculado à oportunidade.");
      setRadarProfNome("");
      setRadarProfPrestadorId("");
      setRadarProfObs("");
      await carregarProfissionaisRadar(radarEditando.alertaId);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Não foi possível vincular o profissional.");
    } finally {
      setRadarProfSaving(false);
    }
  };

  const atualizarProfissionalRadar = async () => {
    if (!radarProfEditId || !radarEditando?.alertaId) return;
    setRadarProfSaving(true);
    try {
      await api.patch(`/admin/radar-demanda/profissionais/${encodeURIComponent(radarProfEditId)}`, {
        status: radarProfEditStatus, observacao: radarProfEditObs.trim()
      });
      toast.success("Acompanhamento do profissional atualizado.");
      setRadarProfEditId(null);
      await carregarProfissionaisRadar(radarEditando.alertaId);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Não foi possível atualizar o profissional.");
    } finally {
      setRadarProfSaving(false);
    }
  };

  const associarCadastroRadar = async () => {
    if (
      !radarAssociandoId ||
      !radarEditando?.alertaId ||
      !radarAssociarPrestadorId.trim()
    ) {
      toast.error("Informe o ID do prestador cadastrado.");
      return;
    }

    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuid.test(radarAssociarPrestadorId.trim())) {
      toast.error("O ID do prestador não é um UUID válido.");
      return;
    }

    setRadarProfSaving(true);

    try {
      await api.patch(
        `/admin/radar-demanda/profissionais/${encodeURIComponent(
          radarAssociandoId
        )}/associar-cadastro`,
        {
          prestadorId: radarAssociarPrestadorId.trim(),
        }
      );

      toast.success("Cadastro associado ao Radar com sucesso!");

      setRadarAssociandoId(null);
      setRadarAssociarPrestadorId("");

      await carregarProfissionaisRadar(radarEditando.alertaId);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        "Não foi possível associar o cadastro."
      );
    } finally {
      setRadarProfSaving(false);
    }
  };

  const salvarGestaoRadar = async () => {
    if (!radarEditando) return;
    setRadarSalvando(true);
    try {
      await api.patch("/admin/radar-demanda/oportunidade", {
        categoriaId: radarEditando.categoriaId,
        chaveRegiao: radarEditando.chaveRegiao,
        status: radarNovoStatus,
        observacao: radarObservacao,
      });
      const response = await api.get<RadarOverview>("/admin/radar-demanda");
      setRadar(response.data);
      const atualizada = response.data.oportunidades.find((item) =>
        item.categoriaId === radarEditando.categoriaId && item.chaveRegiao === radarEditando.chaveRegiao
      );
      if (atualizada) {
        setRadarEditando(atualizada);
        if (atualizada.alertaId) await carregarProfissionaisRadar(atualizada.alertaId);
      }
      setRadarObservacao("");
      toast.success("Oportunidade atualizada.");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Não foi possível atualizar a oportunidade.");
    } finally {
      setRadarSalvando(false);
    }
  };

  // Os filtros atuam sobre as oportunidades recebidas da API.
  // Totais do topo continuam representando todo o banco.
  const categoriasRadar = Array.from(new Set(radar.oportunidades.map((item) => item.categoria))).sort();
  const regioesRadar = Array.from(new Set(radar.oportunidades.map((item) => item.chaveRegiao))).sort();
  const oportunidadesFiltradas = radar.oportunidades.filter((item) =>
    (radarCategoria === "TODAS" || item.categoria === radarCategoria) &&
    (radarRegiao === "TODAS" || item.chaveRegiao === radarRegiao) &&
    (radarSituacao === "TODAS" ||
      (radarSituacao === "SEM_RESULTADO" ? item.semResultado > 0 : item.semResultado === 0)) &&
    (radarStatus === "TODOS" || (item.statusGestao || "NOVO") === radarStatus)
  );

  const isFetching =
    useRef(false);

  /* =======================================================
   * CARREGAMENTO DOS DADOS ADMINISTRATIVOS
   * =======================================================
   */

  const carregarDadosAdmin =
    async () => {
      if (isFetching.current) {
        return;
      }

      isFetching.current = true;

      try {
        const [
          resStats,
          resUsers,
          resPrestadores,
          resRadar,
        ] = await Promise.all([
          api.get(
            "/admin/stats",
          ),

          api.get(
            "/admin/assinaturas",
          ),

          api
            .get(
              "/admin/prestadores/aprovacao",
            )
            .catch(() => ({
              data: [],
            })),

          api.get<RadarOverview>("/admin/radar-demanda")
            .then((response) => {
              setRadarError(null);
              return response;
            })
            .catch((error) => {
              console.error("[ADMIN RADAR] Falha ao carregar:", error);
              setRadarError("Não foi possível carregar os dados do Radar.");
              return null;
            }),
        ]);

        setStats({
          ativos:
            resStats.data?.ativos ||
            0,

          pendentes:
            resStats.data
              ?.pendentes || 0,

          receita:
            resStats.data?.receita ||
            0,

          creditos_totais:
            resStats.data
              ?.creditos_totais ||
            0,

          receita_mensal:
            resStats.data
              ?.receita_mensal ||
            0,

          receita_anual:
            resStats.data
              ?.receita_anual ||
            0,

          qtd_mensal:
            resStats.data
              ?.qtd_mensal || 0,

          qtd_anual:
            resStats.data
              ?.qtd_anual || 0,
        });

        setEmpreendedores(
          Array.isArray(
            resUsers.data,
          )
            ? resUsers.data
            : [],
        );

        if (resRadar?.data) {
          setRadar(resRadar.data);
        }

        setPrestadores(
          Array.isArray(
            resPrestadores.data,
          )
            ? resPrestadores.data
            : [],
        );
      } catch (error) {
        console.error(
          "[ADMIN] Erro ao carregar dados:",
          error,
        );

        toast.error(
          "Erro ao sincronizar dados.",
        );
      } finally {
        setLoading(false);

        isFetching.current =
          false;
      }
    };

  /* =======================================================
   * REFRESH ADMIN
   * =======================================================
   */

  useEffect(() => {
    carregarDadosAdmin();

    const interval =
      window.setInterval(
        () => {
          carregarDadosAdmin();
        },
        30000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  /*
   * ==========================================================
   * RETORNO DO OAUTH / EMBEDDED SIGNUP DO WHATSAPP
   * ==========================================================
   *
   * O backend redireciona de volta para o Dashboard usando:
   *
   * ?whatsapp=connected
   * ?whatsapp=error&reason=...
   *
   * Aqui mostramos o feedback ao usuário e removemos os
   * parâmetros da URL para o toast não reaparecer no refresh.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const whatsappStatus =
      params.get("whatsapp");

    if (!whatsappStatus) {
      return;
    }

    if (
      whatsappStatus ===
      "connected"
    ) {
      const phoneNumberId =
        params.get(
          "phone_number_id",
        );

      toast.success(
        phoneNumberId
          ? `WhatsApp conectado com sucesso. Phone Number ID: ${phoneNumberId}`
          : "WhatsApp conectado com sucesso.",
        {
          duration: 6000,
        },
      );
    } else if (
      whatsappStatus === "error"
    ) {
      const reason =
        params.get("reason");

      const messages:
        Record<string, string> = {
        authorization_denied:
          "A autorização do WhatsApp foi cancelada ou recusada.",
        missing_code:
          "A Meta retornou sem o código de autorização.",
        integration_failed:
          "Não foi possível concluir a integração do WhatsApp.",
      };

      toast.error(
        messages[
        String(
          reason || "",
        )
        ] ||
        "Falha ao conectar o WhatsApp Business.",
        {
          duration: 7000,
        },
      );
    }

    /*
     * Remove apenas os parâmetros usados pelo fluxo WhatsApp,
     * preservando outros parâmetros existentes na URL.
     */
    params.delete("whatsapp");
    params.delete("reason");
    params.delete("waba_id");
    params.delete(
      "phone_number_id",
    );

    const query =
      params.toString();

    const cleanUrl =
      `${window.location.pathname}` +
      `${query ? `?${query}` : ""}` +
      `${window.location.hash || ""}`;

    window.history.replaceState(
      {},
      document.title,
      cleanUrl,
    );
  }, []);

  /* =======================================================
   * AÇÕES
   * =======================================================
   */

  const handleAtivarStatusUsuario =
    async (
      usuarioId: string,
    ) => {
      if (!usuarioId) {
        toast.error(
          "Usuário não identificado.",
        );

        return;
      }

      try {
        await api.patch(
          `/admin/usuarios/${usuarioId}/status_conta`,
          {
            status_conta:
              "APROVADO",
          },
        );

        toast.success(
          "Acesso liberado!",
        );

        await carregarDadosAdmin();
      } catch (error) {
        console.error(
          error,
        );

        toast.error(
          "Erro ao liberar acesso.",
        );
      }
    };

  const handleAprovarPrestador =
    async (
      id: string,
    ) => {
      try {
        await api.patch(
          `/admin/perfil-prestador/prestadores/${id}/aprovar`,
        );

        toast.success(
          "Perfil aprovado!",
        );

        await carregarDadosAdmin();
      } catch (error) {
        console.error(
          error,
        );

        toast.error(
          "Erro ao aprovar.",
        );
      }
    };

  /* =======================================================
   * HELPERS
   * =======================================================
   */

  const brl = (
    value: number,
  ) =>
    Number(value || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        },
      );

  const handleConectarWhatsApp = () => {
    const extras = encodeURIComponent(
      JSON.stringify({
        version: "v4",
        sessionInfoVersion: "3",
        featureType:
          "whatsapp_business_app_onboarding",
      }),
    );

    const redirectUri =
      encodeURIComponent(
        WHATSAPP_REDIRECT_URI,
      );

    const url =
      "https://business.facebook.com/messaging/whatsapp/onboard/" +
      `?app_id=${WHATSAPP_APP_ID}` +
      `&config_id=${WHATSAPP_CONFIG_ID}` +
      `&extras=${extras}` +
      `&redirect_uri=${redirectUri}`;

    /*
     * Abre primeiro uma janela vazia.
     * Assim conseguimos saber de verdade
     * se o navegador bloqueou o popup.
     */
    const popup = window.open(
      "",
      "_blank",
    );

    if (!popup) {
      toast.error(
        "O navegador bloqueou a janela da Meta. Libere os pop-ups para o GranConecta e tente novamente.",
        {
          duration: 7000,
        },
      );

      return;
    }

    /*
     * Segurança equivalente ao noopener.
     */
    popup.opener = null;

    /*
     * Agora direcionamos a janela
     * para o Embedded Signup da Meta.
     */
    popup.location.href = url;

    toast.success(
      "Integração do WhatsApp aberta na Meta.",
      {
        duration: 4000,
      },
    );
  };

  /* =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          justifyContent:
            "center",

          minHeight:
            "100vh",

          bgcolor:
            "#f1f5f9",
        }}
      >
        <CircularProgress
          size={60}
          sx={{
            mb: 2,
          }}
        />

        <Typography>
          Carregando ecossistema
          GranConecta...
        </Typography>
      </Box>
    );
  }

  /* =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <Box
      sx={{
        bgcolor: "#f1f5f9",
        minHeight: "100vh",
        pb: 10,
      }}
    >
      {/* ===================================================
       * BARRA SUPERIOR
       * ===================================================
       */}

      <Paper
        elevation={0}
        sx={{
          p: 2,

          mb: 4,

          borderRadius: 0,

          borderBottom:
            "1px solid #e2e8f0",
        }}



      >
        <Container
          maxWidth="xl"
          sx={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: 2,

            flexWrap: "wrap",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Avatar
              sx={{
                bgcolor: BLUE,
                width: 40,
                height: 40,
              }}
            >
              GC
            </Avatar>

            <Box>
              <Typography
                variant="h5"
                fontWeight={900}
                color="#1e293b"
              >
                Admin Console
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Gestão GranConecta
              </Typography>
            </Box>
          </Box>

          <Box
            display="flex"
            gap={1}
            flexWrap="wrap"
          >
            <Button
              variant="contained"
              startIcon={
                <Campaign />
              }
              onClick={() =>
                navigate(
                  "/admin/marketing",
                )
              }
              sx={{
                bgcolor: BLUE,

                "&:hover": {
                  bgcolor:
                    "#0d076b",
                },
              }}
            >
              Marketing
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={
                <WhatsApp />
              }
              onClick={
                handleConectarWhatsApp
              }
              sx={{
                fontWeight: 800,
                textTransform:
                  "none",
              }}
            >
              Conectar WhatsApp Business
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={
                <Logout />
              }
              onClick={() => {
                logout();

                navigate(
                  "/login",
                );
              }}
            >
              Sair
            </Button>
          </Box>
        </Container>
      </Paper>

      {/* ===================================================
       * CONTEÚDO
       * ===================================================
       */}

      <Container
        maxWidth="xl"
      >
        {/* =================================================
         * CARDS
         * =================================================
         */}

        <Grid
          container
          spacing={3}
          sx={{
            mb: 4,
          }}
        >
          <StatCard
            title="Ativos"
            value={
              stats.ativos
            }
            icon={
              <CheckCircle color="success" />
            }
            color="#22c55e"
          />

          <StatCard
            title="Pendentes"
            value={
              stats.pendentes
            }
            icon={
              <WarningAmber color="warning" />
            }
            color="#f59e0b"
          />

          <StatCard
            title="Receita Total"
            value={brl(
              stats.receita,
            )}
            icon={
              <Payments color="primary" />
            }
            color="#3b82f6"
          />

          <StatCard
            title="Carteira Global"
            value={brl(
              stats.creditos_totais,
            )}
            icon={
              <AccountBalanceWallet color="secondary" />
            }
            color="#8b5cf6"
          />
        </Grid>

        {/* =================================================
         * PAINEL PRINCIPAL
         * =================================================
         */}

        <Paper
          sx={{
            borderRadius: 4,
            overflow:
              "hidden",

            boxShadow:
              "0 8px 30px rgba(15,23,42,0.08)",
          }}
        >
          {/* ===============================================
           * TABS
           * ===============================================
           */}

          <Tabs
            value={tabValue}
            onChange={(
              _event,
              value,
            ) =>
              setTabValue(
                value,
              )
            }
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              borderBottom: 1,

              borderColor:
                "divider",

              bgcolor: "#fff",

              px: {
                xs: 0,
                md: 1,
              },

              "& .MuiTab-root":
              {
                minHeight:
                  64,

                fontWeight:
                  700,
              },
            }}
          >
            <Tab
              icon={<Store />}
              label="Empreendedores"
              iconPosition="start"
            />

            <Tab
              icon={<People />}
              label="Prestadores de Serviço"
              iconPosition="start"
            />

            <Tab
              icon={
                <SupportAgent />
              }
              label="Atendimentos"
              iconPosition="start"
            />

            <Tab
              icon={<RadarIcon />}
              label="Radar de Demanda"
              iconPosition="start"
            />
          </Tabs>

          {/* ===============================================
           * CONTEÚDO DAS TABS
           * ===============================================
           */}

          <Box
            sx={{
              p:
                tabValue === 2
                  ? 0
                  : {
                    xs: 1,
                    sm: 2,
                    md: 3,
                  },
            }}
          >
            {/* =============================================
             * TAB 0 - EMPREENDEDORES
             * =============================================
             */}

            {tabValue ===
              0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          Usuário
                        </TableCell>

                        <TableCell>
                          Plano
                        </TableCell>

                        <TableCell>
                          Status Pag.
                        </TableCell>

                        <TableCell>
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {empreendedores.map(
                        (
                          emp,
                        ) => (
                          <TableRow
                            key={
                              emp.id
                            }
                            hover
                          >
                            <TableCell>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={2}
                              >
                                <Avatar
                                  src={
                                    emp.foto_perfil_url
                                  }
                                >
                                  {emp
                                    .nome?.[0] ||
                                    "U"}
                                </Avatar>

                                <Box>
                                  <Typography
                                    fontWeight="bold"
                                  >
                                    {
                                      emp.nome
                                    }
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {
                                      emp.email
                                    }
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={
                                  emp.plano ||
                                  "Sem plano"
                                }
                                size="small"
                              />
                            </TableCell>

                            <TableCell>
                              <StatusChip
                                status={
                                  emp.status_pagamento
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <Box
                                display="flex"
                                gap={1}
                                flexWrap="wrap"
                              >
                                {emp.telefone && (
                                  <Tooltip title="Abrir WhatsApp">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => {
                                        const phone =
                                          emp.telefone?.replace(
                                            /\D/g,
                                            "",
                                          );

                                        if (
                                          phone
                                        ) {
                                          window.open(
                                            `https://wa.me/${phone}`,
                                            "_blank",
                                            "noopener,noreferrer",
                                          );
                                        }
                                      }}
                                    >
                                      <WhatsApp />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {emp.status_conta ===
                                  "PENDENTE" && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() =>
                                        handleAtivarStatusUsuario(
                                          emp.usuarioId ||
                                          "",
                                        )
                                      }
                                    >
                                      Liberar
                                    </Button>
                                  )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ),
                      )}

                      {empreendedores.length ===
                        0 && (
                          <TableRow>
                            <TableCell
                              colSpan={
                                4
                              }
                              align="center"
                              sx={{
                                py: 6,
                              }}
                            >
                              <Typography
                                color="text.secondary"
                              >
                                Nenhum
                                empreendedor
                                encontrado.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

            {/* =============================================
             * TAB 1 - PRESTADORES
             * =============================================
             */}

            {tabValue ===
              1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          Prestador
                        </TableCell>

                        <TableCell>
                          Plano /
                          Valor
                        </TableCell>

                        <TableCell>
                          Situação do
                          Perfil
                        </TableCell>

                        <TableCell>
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {prestadores.map(
                        (pr) => (
                          <TableRow
                            key={
                              pr.id
                            }
                            hover
                          >
                            <TableCell>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={2}
                              >
                                <Avatar
                                  src={
                                    pr
                                      .usuario
                                      ?.foto_perfil_url
                                  }
                                >
                                  {pr
                                    .nome_profissional?.[0] ||
                                    "P"}
                                </Avatar>

                                <Box>
                                  <Typography
                                    fontWeight="bold"
                                  >
                                    {
                                      pr.nome_profissional
                                    }
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {pr
                                      .usuario
                                      ?.email ||
                                      ""}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                              >
                                {pr.plano ||
                                  "Sem plano"}
                              </Typography>

                              <Typography
                                variant="caption"
                                display="block"
                              >
                                {brl(
                                  Number(
                                    pr.valor_cobrado ||
                                    0,
                                  ),
                                )}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Box
                                display="flex"
                                flexDirection="column"
                                gap={
                                  0.75
                                }
                              >
                                {/* PAGAMENTO */}

                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      minWidth:
                                        75,
                                    }}
                                  >
                                    Pagamento:
                                  </Typography>

                                  <StatusChip
                                    status={
                                      pr.status_pagamento
                                    }
                                  />
                                </Box>

                                {/* APROVAÇÃO */}

                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      minWidth:
                                        75,
                                    }}
                                  >
                                    Aprovação:
                                  </Typography>

                                  <Chip
                                    label={String(
                                      pr.status_aprovacao ||
                                      "PENDENTE",
                                    ).toUpperCase()}
                                    size="small"
                                    color={
                                      String(
                                        pr.status_aprovacao,
                                      ).toUpperCase() ===
                                        "APROVADO"
                                        ? "success"
                                        : "warning"
                                    }
                                    variant="outlined"
                                    sx={{
                                      fontSize:
                                        "9px",

                                      height:
                                        "20px",
                                    }}
                                  />
                                </Box>

                                {/* VISIBILIDADE */}

                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      minWidth:
                                        75,
                                    }}
                                  >
                                    Visível:
                                  </Typography>

                                  <Chip
                                    label={
                                      Number(
                                        pr.ativo,
                                      ) ===
                                        1
                                        ? "ATIVO"
                                        : "INATIVO"
                                    }
                                    size="small"
                                    color={
                                      Number(
                                        pr.ativo,
                                      ) ===
                                        1
                                        ? "info"
                                        : "default"
                                    }
                                    sx={{
                                      fontSize:
                                        "9px",

                                      height:
                                        "20px",
                                    }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Box
                                display="flex"
                                gap={1}
                                flexWrap="wrap"
                              >
                                {String(
                                  pr.status_aprovacao ||
                                  "",
                                ).toUpperCase() ===
                                  "PENDENTE" && (
                                    <Button
                                      startIcon={
                                        <DoneAll />
                                      }
                                      variant="contained"
                                      color="success"
                                      size="small"
                                      onClick={() =>
                                        handleAprovarPrestador(
                                          pr.usuarioId,
                                        )
                                      }
                                    >
                                      Aprovar
                                    </Button>
                                  )}

                                <Tooltip title="Bloquear Perfil">
                                  <IconButton
                                    size="small"
                                    color="error"
                                  >
                                    <Block />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ),
                      )}

                      {prestadores.length ===
                        0 && (
                          <TableRow>
                            <TableCell
                              colSpan={
                                4
                              }
                              align="center"
                              sx={{
                                py: 6,
                              }}
                            >
                              <Typography
                                color="text.secondary"
                              >
                                Nenhum
                                prestador
                                encontrado.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

            {/* =============================================
             * TAB 2 - CENTRAL DE ATENDIMENTO
             * =============================================
             */}

            {tabValue ===
              2 && (
                <AdminChatInbox
                  title="Central de Atendimento"
                />
              )}

            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  Radar de Demanda
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Pesquisas dos clientes e oportunidades para captar novos profissionais.
                </Typography>
                {radarError && (
                  <Typography color="error" sx={{ mb: 2 }}>
                    {radarError}
                  </Typography>
                )}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <StatCard title="Pesquisas" value={radar.resumo.pesquisas}
                    icon={<RadarIcon />} color="#2563eb" />
                  <StatCard title="Sem resultado" value={radar.resumo.semResultado}
                    icon={<WarningAmber />} color="#f59e0b" />
                  <StatCard title="Interessados" value={radar.resumo.interessados}
                    icon={<People />} color="#16a34a" />
                  <StatCard title="Regiões" value={radar.resumo.regioes}
                    icon={<Store />} color="#8b5cf6" />
                </Grid>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="radar-categoria-label">Categoria</InputLabel>
                    <Select labelId="radar-categoria-label" value={radarCategoria}
                      label="Categoria" onChange={(event) => setRadarCategoria(event.target.value)}>
                      <MenuItem value="TODAS">Todas as categorias</MenuItem>
                      {categoriasRadar.map((categoria) => (
                        <MenuItem key={categoria} value={categoria}>{categoria}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="radar-regiao-label">Região</InputLabel>
                    <Select labelId="radar-regiao-label" value={radarRegiao}
                      label="Região" onChange={(event) => setRadarRegiao(event.target.value)}>
                      <MenuItem value="TODAS">Todas as regiões</MenuItem>
                      {regioesRadar.map((regiao) => {
                        const exemplo = radar.oportunidades.find((item) => item.chaveRegiao === regiao);
                        const descricao = exemplo
                          ? [exemplo.bairro, exemplo.cidade, exemplo.uf].filter(Boolean).join(" / ")
                          : "";
                        return <MenuItem key={regiao} value={regiao}>
                          {descricao || (regiao === "NAO_INFORMADA" ? "Não informada" : regiao)}
                        </MenuItem>;
                      })}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="radar-situacao-label">Resultado</InputLabel>
                    <Select labelId="radar-situacao-label" value={radarSituacao}
                      label="Resultado" onChange={(event) => setRadarSituacao(event.target.value)}>
                      <MenuItem value="TODAS">Todos</MenuItem>
                      <MenuItem value="SEM_RESULTADO">Com demanda não atendida</MenuItem>
                      <MenuItem value="ENCONTRADO">Sem demanda pendente</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="radar-status-label">Gestão</InputLabel>
                    <Select labelId="radar-status-label" value={radarStatus}
                      label="Gestão" onChange={(event) => setRadarStatus(event.target.value)}>
                      <MenuItem value="TODOS">Todos os estados</MenuItem>
                      <MenuItem value="NOVO">Nova</MenuItem>
                      <MenuItem value="EM_CAPTACAO">Em captação</MenuItem>
                      <MenuItem value="RESOLVIDO">Resolvida</MenuItem>
                      <MenuItem value="DESCARTADO">Descartada</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="outlined" sx={{ minWidth: 130 }} onClick={() => {
                    setRadarStatus("TODOS");
                    setRadarCategoria("TODAS");
                    setRadarRegiao("TODAS");
                    setRadarSituacao("TODAS");
                  }}>Limpar filtros</Button>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Exibindo {oportunidadesFiltradas.length} de {radar.oportunidades.length} oportunidades.
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Serviço / Categoria</TableCell>
                        <TableCell>Região</TableCell>
                        <TableCell align="right">Pesquisas</TableCell>
                        <TableCell align="right">Sem resultado</TableCell>
                        <TableCell align="right">Interessados</TableCell>
                        <TableCell>Situação</TableCell>
                        <TableCell>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {oportunidadesFiltradas.map((item, index) => (
                        <TableRow key={`${item.categoriaId}-${item.chaveRegiao}-${index}`} hover>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell>
                            {[item.bairro, item.cidade, item.uf].filter(Boolean).join(" / ") ||
                              (item.chaveRegiao === "NAO_INFORMADA" ? "Não informada" : item.chaveRegiao)}
                          </TableCell>
                          <TableCell align="right">{item.pesquisas}</TableCell>
                          <TableCell align="right">{item.semResultado}</TableCell>
                          <TableCell align="right">{item.interessados}</TableCell>
                          <TableCell>
                            <Chip size="small"
                              color={item.statusGestao === "RESOLVIDO" ? "success" : item.statusGestao === "EM_CAPTACAO" ? "info" : "warning"}
                              label={({ NOVO: "Nova", EM_CAPTACAO: "Em captação", RESOLVIDO: "Resolvida", DESCARTADO: "Descartada" } as Record<string, string>)[item.statusGestao || "NOVO"] || "Nova"} />
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined" onClick={() => abrirGestaoRadar(item)}>Gerenciar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {oportunidadesFiltradas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                            Nenhuma oportunidade encontrada com os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Dialog open={Boolean(radarEditando)} onClose={() => !radarSalvando && setRadarEditando(null)} fullWidth maxWidth="md">
                  <DialogTitle>Gerenciar oportunidade</DialogTitle>
                  <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
                    <Typography>{radarEditando?.categoria} — {radarEditando?.bairro || "Região não informada"}</Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel id="radar-editar-status">Situação</InputLabel>
                      <Select labelId="radar-editar-status" label="Situação" value={radarNovoStatus}
                        onChange={(event) => setRadarNovoStatus(event.target.value)}>
                        <MenuItem value="NOVO">Nova</MenuItem>
                        <MenuItem value="EM_CAPTACAO">Em captação</MenuItem>
                        <MenuItem value="RESOLVIDO">Resolvida (somente após confirmação)</MenuItem>
                        <MenuItem value="DESCARTADO">Descartada</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField label="Observação administrativa" multiline minRows={3} fullWidth
                      value={radarObservacao} onChange={(event) => setRadarObservacao(event.target.value)}
                      inputProps={{ maxLength: 1000 }} />
                    <Typography variant="caption" color="text.secondary">
                      Alterações são registradas no histórico. Nenhuma mensagem é enviada aos interessados.
                    </Typography>
                    <Box sx={{ borderTop: "1px solid #e2e8f0", pt: 2, mt: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Profissionais vinculados</Typography>
                      {!radarEditando?.alertaId ? (
                        <Typography variant="body2" color="text.secondary">
                          Salve a situação da oportunidade primeiro. Depois será possível vincular profissionais.
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {radarProfLoading && <CircularProgress size={22} />}
                          {radarProfErro && <Typography color="error" variant="body2">{radarProfErro}</Typography>}
                          {!radarProfLoading && radarProfissionais.length === 0 && !radarProfErro && (
                            <Typography color="text.secondary" variant="body2">Nenhum profissional vinculado.</Typography>
                          )}
                          {radarProfissionais.map((prof) => (
                            <Paper key={prof.id} variant="outlined" sx={{ p: 1.5 }}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                <Box>
                                  <Typography fontWeight={700} variant="body2">
                                    {prof.nome || prof.nomeExterno || prof.nomeProfissional || prof.nome_profissional ||
                                      prestadores.find((pr) => pr.id === prof.prestadorId)?.nome_profissional ||
                                      "Prestador cadastrado"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {prof.prestadorId ? "Cadastrado no GranConecta — vínculo administrativo" : "Profissional externo"}
                                  </Typography>
                                </Box>
                                <Chip size="small" label={radarProfessionalLabel[prof.status] || prof.status} />
                              </Stack>
                              {prof.observacao && <Typography variant="body2" sx={{ mt: 1 }}>{prof.observacao}</Typography>}
                              {prof.acompanhamento && (
                                <Paper
                                  variant="outlined"
                                  sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}
                                >
                                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                                    Acompanhamento da ativação
                                  </Typography>
                                  <Stack direction="row" flexWrap="wrap" gap={1}>
                                    <Chip size="small" variant="outlined"
                                      color={prof.acompanhamento.cadastroAssociado ? "success" : "warning"}
                                      label={prof.acompanhamento.cadastroAssociado ? "Cadastro associado" : "Cadastro pendente"} />
                                    <Chip size="small" variant="outlined"
                                      color={prof.acompanhamento.statusAprovacao?.toUpperCase() === "APROVADO" ? "success" : "warning"}
                                      label={`Aprovação: ${prof.acompanhamento.statusAprovacao || "Pendente"}`} />
                                    <Chip size="small" variant="outlined"
                                      color={prof.acompanhamento.perfilAtivo ? "success" : "default"}
                                      label={prof.acompanhamento.perfilAtivo ? "Perfil ativo" : "Perfil inativo"} />
                                    <Chip size="small" variant="outlined"
                                      color={prof.acompanhamento.usuarioStatus?.toUpperCase() === "APROVADO" ? "success" : "warning"}
                                      label={`Conta: ${prof.acompanhamento.usuarioStatus || "Pendente"}`} />
                                    <Chip size="small" variant="outlined"
                                      color={prof.acompanhamento.statusAssinatura?.toUpperCase() === "ATIVA" &&
                                        !prof.acompanhamento.assinaturaBloqueada && !prof.acompanhamento.assinaturaVencida
                                        ? "success" : "warning"}
                                      label={`Assinatura: ${prof.acompanhamento.statusAssinatura || "Pendente"}`} />
                                    {prof.acompanhamento.assinaturaBloqueada && (
                                      <Chip size="small" color="error" label="Assinatura bloqueada" />
                                    )}
                                    {prof.acompanhamento.assinaturaVencida && (
                                      <Chip size="small" color="error" label="Assinatura vencida" />
                                    )}
                                  </Stack>
                                  {prof.acompanhamento.assinaturaVenceEm && (
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                                      Vencimento da assinatura: {new Date(prof.acompanhamento.assinaturaVenceEm).toLocaleDateString("pt-BR")}
                                    </Typography>
                                  )}
                                  {prof.acompanhamento.pendencias.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                                        Pendências para ativação
                                      </Typography>
                                      {prof.acompanhamento.pendencias.map((pendencia, index) => (
                                        <Typography key={`${prof.id}-pendencia-${index}`}
                                          variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                          • {pendencia}
                                        </Typography>
                                      ))}
                                    </Box>
                                  )}
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                                    Elegibilidade DOT: {prof.acompanhamento.elegibilidadeDot === "NAO_VERIFICADA"
                                      ? "não verificada" : prof.acompanhamento.elegibilidadeDot}.
                                    A associação administrativa não autoriza atendimento automaticamente.
                                  </Typography>
                                </Paper>
                              )}

                              {radarProfEditId === prof.id ? (
                                <Stack spacing={1.5} sx={{ mt: 2 }}>
                                  <TextField select size="small" label="Andamento" value={radarProfEditStatus}
                                    onChange={(event) => setRadarProfEditStatus(event.target.value as RadarProfessionalStatus)}>
                                    {RADAR_PROFESSIONAL_STATUSES.map((status) =>
                                      <MenuItem key={status} value={status}>{radarProfessionalLabel[status]}</MenuItem>)}
                                  </TextField>
                                  <TextField size="small" multiline minRows={2} label="Observação" value={radarProfEditObs}
                                    onChange={(event) => setRadarProfEditObs(event.target.value)} inputProps={{ maxLength: 1000 }} />
                                  <Stack direction="row" spacing={1}>
                                    <Button size="small" variant="contained" disabled={radarProfSaving} onClick={atualizarProfissionalRadar}>Salvar andamento</Button>
                                    <Button size="small" disabled={radarProfSaving} onClick={() => setRadarProfEditId(null)}>Cancelar</Button>
                                  </Stack>
                                </Stack>
                              ) : (
                                <Button size="small" sx={{ mt: 1 }} onClick={() => {
                                  setRadarProfEditId(prof.id);
                                  setRadarProfEditStatus(prof.status);
                                  setRadarProfEditObs(prof.observacao || "");
                                }}>Atualizar andamento</Button>
                              )}
                              {!prof.prestadorId && (
                                <Box sx={{ mt: 1.5 }}>
                                  {radarAssociandoId === prof.id ? (
                                    <Stack spacing={1.5}>
                                      <TextField
                                        size="small"
                                        fullWidth
                                        label="ID do prestador cadastrado"
                                        placeholder="Cole o UUID do perfil do prestador"
                                        value={radarAssociarPrestadorId}
                                        onChange={(event) =>
                                          setRadarAssociarPrestadorId(event.target.value)
                                        }
                                        helperText="Informe o ID de perfil_prestador, não o ID do usuário."
                                      />

                                      <Stack direction="row" spacing={1}>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          disabled={
                                            radarProfSaving ||
                                            !radarAssociarPrestadorId.trim()
                                          }
                                          onClick={associarCadastroRadar}
                                        >
                                          Confirmar associação
                                        </Button>

                                        <Button
                                          size="small"
                                          disabled={radarProfSaving}
                                          onClick={() => {
                                            setRadarAssociandoId(null);
                                            setRadarAssociarPrestadorId("");
                                          }}
                                        >
                                          Cancelar
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      disabled={radarProfSaving}
                                      onClick={() => {
                                        setRadarProfEditId(null);
                                        setRadarAssociandoId(prof.id);
                                        setRadarAssociarPrestadorId("");
                                      }}
                                    >
                                      Associar cadastro
                                    </Button>
                                  )}
                                </Box>
                              )}

                              {prof.prestadorId && (
                                <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                                  <Chip
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    label="Cadastro associado"
                                    sx={{ alignSelf: "flex-start" }}
                                  />

                                  <Typography variant="caption" color="text.secondary">
                                    ID do prestador: {prof.prestadorId}
                                  </Typography>

                                  <Typography variant="caption" color="text.secondary">
                                    Associação administrativa. Aprovação e assinatura
                                    continuam sendo verificadas separadamente.
                                  </Typography>
                                </Stack>
                              )}
                            </Paper>
                          ))}
                          <Typography variant="subtitle2" fontWeight={700}>Vincular profissional</Typography>
                          <TextField select size="small" label="Origem" value={radarProfOrigem}
                            onChange={(event) => setRadarProfOrigem(event.target.value as "EXTERNO" | "CADASTRADO")}>
                            <MenuItem value="EXTERNO">Profissional externo</MenuItem>
                            <MenuItem value="CADASTRADO">Prestador já cadastrado</MenuItem>
                          </TextField>
                          {radarProfOrigem === "EXTERNO" ? (
                            <TextField size="small" label="Nome do profissional" value={radarProfNome}
                              onChange={(event) => setRadarProfNome(event.target.value)} inputProps={{ maxLength: 150 }} />
                          ) : (
                            <TextField select size="small" label="Selecionar prestador" value={radarProfPrestadorId}
                              onChange={(event) => setRadarProfPrestadorId(event.target.value)}
                              helperText="Lista de prestadores carregados pelo painel; o backend valida o vínculo e a categoria.">
                              {prestadores.map((pr) => <MenuItem key={pr.id} value={pr.id}>{pr.nome_profissional}</MenuItem>)}
                            </TextField>
                          )}
                          <TextField select size="small" label="Andamento inicial" value={radarProfStatus}
                            onChange={(event) => setRadarProfStatus(event.target.value as RadarProfessionalStatus)}>
                            {RADAR_PROFESSIONAL_STATUSES.map((status) =>
                              <MenuItem key={status} value={status}>{radarProfessionalLabel[status]}</MenuItem>)}
                          </TextField>
                          <TextField size="small" label="Observação comercial" multiline minRows={2}
                            value={radarProfObs} onChange={(event) => setRadarProfObs(event.target.value)}
                            inputProps={{ maxLength: 1000 }} />
                          <Button variant="outlined" disabled={radarProfSaving || radarProfLoading}
                            onClick={adicionarProfissionalRadar}>Vincular profissional</Button>
                          <Typography variant="caption" color="text.secondary">
                            O vínculo é apenas administrativo: não aprova o prestador nem autoriza encaminhamento pelo DOT.
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button disabled={radarSalvando} onClick={() => setRadarEditando(null)}>Cancelar</Button>
                    <Button disabled={radarSalvando || ((radarNovoStatus === "RESOLVIDO" || radarNovoStatus === "DESCARTADO") && !radarObservacao.trim())}
                      variant="contained" onClick={salvarGestaoRadar}>Salvar</Button>
                  </DialogActions>
                </Dialog>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                  Dados agregados, sem exposição de contatos pessoais. Indicadores superiores representam o total geral. Filtros aplicados à tabela. Atualização automática a cada 30 segundos.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

/* =========================================================
 * CONSTANTES
 * =========================================================
 */

const BLUE =
  "#120a8f";

const WHATSAPP_APP_ID =
  "355196603804853";

const WHATSAPP_CONFIG_ID =
  "1767113767644331";

const WHATSAPP_REDIRECT_URI =
  `${import.meta.env.VITE_API_URL || "https://api.granconecta.net.br"}/api/meta/whatsapp/oauth/callback`;

/* =========================================================
 * CARD DE ESTATÍSTICA
 * =========================================================
 */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value:
  | string
  | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Grid
      size={{
        xs: 12,
        sm: 6,
        md: 3,
      }}
    >
      <Card
        sx={{
          height: "100%",

          borderRadius: 4,

          borderLeft:
            `6px solid ${color}`,

          boxShadow:
            "0 5px 20px rgba(15,23,42,0.06)",
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography
              color="text.secondary"
              variant="overline"
              fontWeight="bold"
            >
              {title}
            </Typography>

            {icon}
          </Box>

          <Typography
            variant="h5"
            fontWeight={900}
          >
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

/* =========================================================
 * STATUS CHIP
 * =========================================================
 */

function StatusChip({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(
      status || "",
    )
      .toLowerCase()
      .trim();

  const config: Record<
    string,
    {
      label: string;

      color:
      | "success"
      | "warning"
      | "error"
      | "info"
      | "default";
    }
  > = {
    paid: {
      label: "Pago",
      color: "success",
    },

    pago: {
      label: "Pago",
      color: "success",
    },

    active: {
      label: "Ativo",
      color: "success",
    },

    ativo: {
      label: "Ativo",
      color: "success",
    },

    approved: {
      label: "Aprovado",
      color: "success",
    },

    aprovado: {
      label: "Aprovado",
      color: "success",
    },

    pending: {
      label: "Pendente",
      color: "warning",
    },

    pendente: {
      label: "Pendente",
      color: "warning",
    },

    failed: {
      label: "Falhou",
      color: "error",
    },

    falhou: {
      label: "Falhou",
      color: "error",
    },

    rejected: {
      label: "Rejeitado",
      color: "error",
    },

    rejeitado: {
      label: "Rejeitado",
      color: "error",
    },
  };

  const current =
    config[
    normalized
    ] || {
      label:
        status ||
        "Pendente",

      color:
        "default" as const,
    };

  return (
    <Chip
      label={current.label.toUpperCase()}
      color={
        current.color
      }
      size="small"
      sx={{
        fontWeight:
          "bold",

        fontSize:
          "10px",

        height: 22,
      }}
    />
  );
}