import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditCalendarRoundedIcon from "@mui/icons-material/EditCalendarRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import MarkChatReadRoundedIcon from "@mui/icons-material/MarkChatReadRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleSendRoundedIcon from "@mui/icons-material/ScheduleSendRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ViewCarouselRoundedIcon from "@mui/icons-material/ViewCarouselRounded";
import toast from "react-hot-toast";

import MarketingAdminService from "./MarketingAdminService";
import api, { uploadImageFile } from "../../api/api";
import type {
  BannerLocalExibicao,
  CriarCampanhaInput,
  MarketingCampanhaCanal,
  MarketingCampanhaTipo,
  MarketingCampanhaDestinoTipo,
  MarketingCanal,
  MarketingCampanha,
  MarketingCampanhaStatus,
  MarketingLead,
  MarketingLeadOrigem,
} from "./MarketingAdminTypes";

const BRAND = "#120a8f";
const CONDOMINIOS_ENDPOINT = "/admin/marketing/condominios";
const PRESTADORES_ENDPOINT = "/admin/marketing/prestadores";
const LOJAS_ENDPOINT = "/admin/marketing/lojas";

const STATUS: MarketingCampanhaStatus[] = [
  "RASCUNHO",
  "AGUARDANDO_PAGAMENTO",
  "AGUARDANDO_APROVACAO",
  "AGENDADA",
  "PROCESSANDO",
  "CONCLUIDA",
  "CANCELADA",
  "FALHOU",
];

const ORIGENS: MarketingLeadOrigem[] = [
  "CADASTRO",
  "LANDING_PAGE",
  "BANNER",
  "QR_CODE",
  "CHECKOUT",
  "FORMULARIO",
];

type ResponsavelCampanhaTipo = "PRESTADOR" | "LOJA" | "";

type CampanhaForm = {
  nome: string;
  descricao: string;
  tipoCampanha: MarketingCampanhaTipo;
  tipoDestino: MarketingCampanhaDestinoTipo;
  categoriaId: string;
  responsavelTipo: ResponsavelCampanhaTipo;
  templateNome: string;
  templateIdioma: string;
  dataAgendamento: string;
  lojaId: string;
  prestadorId: string;
  bannerId: string;
  condominioIds: string[];
  usuarioTipos: string;
  parametros: string;
  somenteUsuariosAtivos: boolean;
};

type CondominioOpcao = {
  id: string;
  nome: string;
};

type PrestadorOpcao = {
  id: string;
  nome: string;
  usuarioId?: string | null;
  perfilId?: string | null;
  nomeUsuario?: string | null;
  email?: string | null;
  tipo?: string | null;
  categoriaId?: string | number | null;
  categoriaNome?: string | null;
  grupoId?: string | number | null;
  grupoNome?: string | null;
  grupoSlug?: string | null;
  status?: string | null;
};

type LojaOpcao = {
  id: string;
  nome: string;
  usuarioId?: string | null;
  nomeProprietario?: string | null;
  emailProprietario?: string | null;
  usuarioTipo?: string | null;
  tipo?: string | null;
  categoria?: string | null;
  categoriaId?: string | number | null;
  categoriaNome?: string | null;
  grupoId?: string | number | null;
  grupoNome?: string | null;
  grupoSlug?: string | null;
};

type CategoriaOpcao = {
  id: string;
  nome: string;
  tipo?: string | null;
  grupoNome?: string | null;
};

type WhatsappDestinatario = {
  id: number;
  usuarioId?: string | null;
  leadId?: string | null;
  nome: string;
  telefone: string;
  status: string;
  tentativas: number;
  dataExecucao?: string | null;
  ultimoErro?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type LeadForm = {
  usuarioId: string;
  condominioId: string;
  nome: string;
  telefone: string;
  email: string;
  origem: MarketingLeadOrigem;
  origemReferencia: string;
  aceitaMarketing: boolean;
  aceitaUtilidade: boolean;
};

const campanhaVazia = (): CampanhaForm => ({
  nome: "",
  descricao: "",
  tipoCampanha: "INSTITUCIONAL",
  tipoDestino: "GRANCONECTA",
  categoriaId: "",
  responsavelTipo: "",
  templateNome: "",
  templateIdioma: "pt_BR",
  dataAgendamento: "",
  lojaId: "",
  prestadorId: "",
  bannerId: "",
  condominioIds: [],
  usuarioTipos: "MORADOR",
  parametros: "",
  somenteUsuariosAtivos: true,
});

const leadVazio = (): LeadForm => ({
  usuarioId: "",
  condominioId: "",
  nome: "",
  telefone: "",
  email: "",
  origem: "FORMULARIO",
  origemReferencia: "PAINEL_ADMIN",
  aceitaMarketing: false,
  aceitaUtilidade: true,
});

const lista = (value: string) =>
  value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parametros = (value: string): Array<string | number> =>
  lista(value).map((item) => {
    const numero = Number(item.replace(",", "."));
    return Number.isFinite(numero) && item.trim() !== "" ? numero : item;
  });

const erroApi = (error: any, fallback: string) =>
  error?.response?.data?.mensagem ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const dataLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatarData = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const formatarTelefone = (value?: string | null) => {
  const digits = String(value || "").replace(/\D/g, "");
  const numero = digits.startsWith("55") ? digits.slice(2) : digits;

  if (numero.length === 11) {
    return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
  }

  if (numero.length === 10) {
    return `(${numero.slice(0, 2)}) ${numero.slice(2, 6)}-${numero.slice(6)}`;
  }

  return value || "—";
};

const bool = (value: unknown) => value === true || value === 1 || value === "1";

function statusColor(status: MarketingCampanhaStatus) {
  if (status === "CONCLUIDA") return "success" as const;
  if (status === "CANCELADA" || status === "FALHOU") return "error" as const;
  if (status === "AGENDADA" || status === "PROCESSANDO") return "info" as const;
  if (status === "AGUARDANDO_PAGAMENTO" || status === "AGUARDANDO_APROVACAO") {
    return "warning" as const;
  }
  return "default" as const;
}

type StatusVisualCampanha = {
  label: string;
  color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
  detalhe?: string;
  motivo?: string;
};

function statusVisualCampanha(
  campanha: MarketingCampanha,
): StatusVisualCampanha {
  const agendamento =
    campanha.whatsapp_agendamento;

  const reagendada =
    campanha.situacao_whatsapp ===
      "REAGENDADA" &&
    agendamento?.status === "PENDENTE";

  if (reagendada) {
    const tentativa = Number(
      agendamento?.tentativas || 0,
    );

    return {
      label: "REAGENDADA",
      color: "warning",
      detalhe: agendamento?.data_execucao
        ? `Próxima tentativa: ${formatarData(
            agendamento.data_execucao,
          )} · Tentativa ${tentativa} de 3`
        : `Tentativa ${tentativa} de 3`,
      motivo: String(
        agendamento?.ultimo_erro || "",
      ).includes("131049")
        ? "Meta 131049 · limitação temporária de marketing"
        : undefined,
    };
  }

  return {
    label: campanha.status.replaceAll(
      "_",
      " ",
    ),
    color: statusColor(campanha.status),
  };
}

function canalStatusColor(status?: string) {
  if (status === "CONCLUIDO") return "success" as const;
  if (status === "FALHOU" || status === "CANCELADO") return "error" as const;
  if (status === "PROCESSANDO") return "info" as const;
  if (status === "RASCUNHO") return "warning" as const;
  return "default" as const;
}

function MetricMini(props: {
  label: string;
  value: number;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 2.5,
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
      >
        {props.label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={900}
        lineHeight={1.15}
      >
        {props.value}
      </Typography>
    </Paper>
  );
}

export default function AdminMarketing() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [campanhas, setCampanhas] = useState<MarketingCampanha[]>([]);
  const [condominios, setCondominios] = useState<CondominioOpcao[]>([]);
  const [condominiosLoading, setCondominiosLoading] = useState(false);
  const [condominiosErro, setCondominiosErro] = useState("");

  const [prestadores, setPrestadores] = useState<PrestadorOpcao[]>([]);
  const [lojas, setLojas] = useState<LojaOpcao[]>([]);
  const [responsaveisLoading, setResponsaveisLoading] = useState(false);
  const [responsaveisErro, setResponsaveisErro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<
    MarketingCampanhaStatus | ""
  >("");
  const [campanhaDialog, setCampanhaDialog] = useState(false);
  const [campanhaEditando, setCampanhaEditando] =
    useState<MarketingCampanha | null>(null);
  const [campanhaForm, setCampanhaForm] =
    useState<CampanhaForm>(campanhaVazia());
  const [agendar, setAgendar] = useState<MarketingCampanha | null>(null);
  const [dataAgendamento, setDataAgendamento] = useState("");

  const [canaisDialog, setCanaisDialog] = useState<MarketingCampanha | null>(
    null,
  );
  const campanhaCanaisIdRef = useRef<number | null>(null);
  const [canais, setCanais] = useState<MarketingCampanhaCanal[]>([]);
  const [canaisLoading, setCanaisLoading] = useState(false);
  const [notificacaoTitulo, setNotificacaoTitulo] = useState("");
  const [notificacaoMensagem, setNotificacaoMensagem] = useState("");
  const [canalBannerId, setCanalBannerId] = useState("");
  const [canalBannerDataFim, setCanalBannerDataFim] = useState("");
  const [canalBannerDestino, setCanalBannerDestino] = useState("");
  const [instagramLegenda, setInstagramLegenda] = useState("");
  const [instagramImagemUrl, setInstagramImagemUrl] = useState("");
  const [instagramArquivo, setInstagramArquivo] = useState<File | null>(null);
  const [facebookLegenda, setFacebookLegenda] = useState("");
  const [facebookImagemUrl, setFacebookImagemUrl] = useState("");
  const [facebookArquivo, setFacebookArquivo] = useState<File | null>(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [whatsappIdioma, setWhatsappIdioma] = useState("pt_BR");
  const [whatsappParametros, setWhatsappParametros] = useState("");
  const [novoBannerArquivo, setNovoBannerArquivo] = useState<File | null>(null);
  const [novoBannerTitulo, setNovoBannerTitulo] = useState("");
  const [novoBannerSubtitulo, setNovoBannerSubtitulo] = useState("");
  const [novoBannerCor, setNovoBannerCor] = useState("#3b82f6");
  const [novoBannerDestino, setNovoBannerDestino] = useState("");
  const [novoBannerCondominioId, setNovoBannerCondominioId] = useState("");
  const [novoBannerLocal, setNovoBannerLocal] =
    useState<BannerLocalExibicao>("AMBOS");
  const [novoBannerDataInicio, setNovoBannerDataInicio] = useState(
    dataLocal(new Date().toISOString()),
  );
  const [novoBannerDataFim, setNovoBannerDataFim] = useState("");

  const [condominioFiltro, setCondominioFiltro] = useState("");
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadDialog, setLeadDialog] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>(leadVazio());

  const [testeTelefone, setTesteTelefone] = useState("");
  const [testeUsuarioId, setTesteUsuarioId] = useState("");
  const [testeTemplate, setTesteTemplate] = useState("hello_world");
  const [testeIdioma, setTesteIdioma] = useState("en_US");
  const [testeParametros, setTesteParametros] = useState("");

  const carregarCampanhas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await MarketingAdminService.listarCampanhas({
        status: statusFiltro,
        pagina: 1,
        limite: 100,
      });
      setCampanhas(data.campanhas || []);
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível carregar as campanhas."));
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  const carregarCondominios = useCallback(async () => {
    setCondominiosLoading(true);
    setCondominiosErro("");

    try {
      const response = await api.get(CONDOMINIOS_ENDPOINT);
      const dados =
        response.data?.condominios || response.data?.dados || response.data;

      const opcoes: CondominioOpcao[] = (Array.isArray(dados) ? dados : [])
        .map((item: any) => ({
          id: String(item?.id || item?.condominio_id || "").trim(),
          nome: String(
            item?.nome ||
              item?.name ||
              item?.titulo ||
              item?.razao_social ||
              "Condomínio sem nome",
          ).trim(),
        }))
        .filter((item: CondominioOpcao) => Boolean(item.id))
        .sort((a: CondominioOpcao, b: CondominioOpcao) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        );

      setCondominios(opcoes);
    } catch (error) {
      setCondominios([]);
      setCondominiosErro(
        erroApi(error, "Não foi possível carregar os condomínios."),
      );
    } finally {
      setCondominiosLoading(false);
    }
  }, []);

  const carregarResponsaveis = useCallback(async () => {
    setResponsaveisLoading(true);
    setResponsaveisErro("");

    try {
      const [prestadoresResponse, lojasResponse] = await Promise.all([
        api.get(PRESTADORES_ENDPOINT),
        api.get(LOJAS_ENDPOINT),
      ]);

      const prestadoresDados =
        prestadoresResponse.data?.prestadores ||
        prestadoresResponse.data?.dados ||
        prestadoresResponse.data;

      const lojasDados =
        lojasResponse.data?.lojas ||
        lojasResponse.data?.dados ||
        lojasResponse.data;

      const prestadoresOpcoes: PrestadorOpcao[] = (
        Array.isArray(prestadoresDados) ? prestadoresDados : []
      )
        .map((item: any) => ({
          id: String(item?.id || "").trim(),
          nome: String(
            item?.nome ||
              item?.nome_profissional ||
              item?.name ||
              "Prestador sem nome",
          ).trim(),
          usuarioId: item?.usuarioId ? String(item.usuarioId) : null,
          perfilId: item?.perfilId ? String(item.perfilId) : null,
          nomeUsuario: item?.nomeUsuario ? String(item.nomeUsuario) : null,
          email: item?.email ? String(item.email) : null,
          tipo: item?.tipo ? String(item.tipo) : null,
          categoriaId: item?.categoriaId ?? item?.categoriaid ?? null,
          categoriaNome: item?.categoriaNome ? String(item.categoriaNome) : null,
          grupoId: item?.grupoId ?? null,
          grupoNome: item?.grupoNome ? String(item.grupoNome) : null,
          grupoSlug: item?.grupoSlug ? String(item.grupoSlug) : null,
          status: item?.status ? String(item.status) : null,
        }))
        .filter((item: PrestadorOpcao) => Boolean(item.id))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

      const lojasOpcoes: LojaOpcao[] = (
        Array.isArray(lojasDados) ? lojasDados : []
      )
        .map((item: any) => ({
          id: String(item?.id || "").trim(),
          nome: String(
            item?.nome ||
              item?.name ||
              item?.storeName ||
              "Loja sem nome",
          ).trim(),
          usuarioId: item?.usuarioId ? String(item.usuarioId) : null,
          nomeProprietario: item?.nomeProprietario
            ? String(item.nomeProprietario)
            : null,
          emailProprietario: item?.emailProprietario
            ? String(item.emailProprietario)
            : null,
          usuarioTipo: item?.usuarioTipo ? String(item.usuarioTipo) : null,
          tipo: item?.tipo ? String(item.tipo) : null,
          categoria: item?.categoria ? String(item.categoria) : null,
          categoriaId: item?.categoriaId ?? null,
          categoriaNome: item?.categoriaNome ? String(item.categoriaNome) : null,
          grupoId: item?.grupoId ?? null,
          grupoNome: item?.grupoNome ? String(item.grupoNome) : null,
          grupoSlug: item?.grupoSlug ? String(item.grupoSlug) : null,
        }))
        .filter((item: LojaOpcao) => Boolean(item.id))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

      setPrestadores(prestadoresOpcoes);
      setLojas(lojasOpcoes);
    } catch (error) {
      setPrestadores([]);
      setLojas([]);
      setResponsaveisErro(
        erroApi(
          error,
          "Não foi possível carregar prestadores e lojas.",
        ),
      );
    } finally {
      setResponsaveisLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarCampanhas();
  }, [carregarCampanhas]);

  useEffect(() => {
    void carregarCondominios();
  }, [carregarCondominios]);

  useEffect(() => {
    void carregarResponsaveis();
  }, [carregarResponsaveis]);

  const totais = useMemo(
    () =>
      campanhas.reduce(
        (acc, item) => ({
          destinatarios:
            acc.destinatarios + Number(item.total_destinatarios || 0),
          enviados: acc.enviados + Number(item.total_enviados || 0),
          entregues: acc.entregues + Number(item.total_entregues || 0),
          lidos: acc.lidos + Number(item.total_lidos || 0),
          falhas: acc.falhas + Number(item.total_falhas || 0),
        }),
        { destinatarios: 0, enviados: 0, entregues: 0, lidos: 0, falhas: 0 },
      ),
    [campanhas],
  );

  const condominiosSelecionados = useMemo(
    () =>
      campanhaForm.condominioIds.map(
        (id) =>
          condominios.find((item) => item.id === id) || {
            id,
            nome: `Condomínio (${id})`,
          },
      ),
    [campanhaForm.condominioIds, condominios],
  );

  const lojaSelecionada = useMemo(
    () =>
      lojas.find(
        (item) => item.id === campanhaForm.lojaId,
      ) || null,
    [campanhaForm.lojaId, lojas],
  );

  const prestadorSelecionado = useMemo(
    () =>
      prestadores.find(
        (item) => item.id === campanhaForm.prestadorId,
      ) || null,
    [campanhaForm.prestadorId, prestadores],
  );

  const categorias = useMemo<CategoriaOpcao[]>(() => {
    const mapa = new Map<string, CategoriaOpcao>();

    const adicionar = (item: {
      categoriaId?: string | number | null;
      categoriaNome?: string | null;
      tipo?: string | null;
      grupoNome?: string | null;
    }) => {
      const id = String(item.categoriaId ?? "").trim();
      const nome = String(item.categoriaNome || "").trim();

      if (!id || !nome) return;

      if (!mapa.has(id)) {
        mapa.set(id, {
          id,
          nome,
          tipo: item.tipo || null,
          grupoNome: item.grupoNome || null,
        });
      }
    };

    prestadores.forEach(adicionar);
    lojas.forEach(adicionar);

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [prestadores, lojas]);

  const categoriaSelecionada = useMemo(
    () =>
      categorias.find(
        (item) => item.id === campanhaForm.categoriaId,
      ) || null,
    [categorias, campanhaForm.categoriaId],
  );

  const lojaCanalSelecionada = useMemo(
    () =>
      lojas.find(
        (item) => item.id === canaisDialog?.loja_id,
      ) || null,
    [canaisDialog?.loja_id, lojas],
  );

  const prestadorCanalSelecionado = useMemo(
    () =>
      prestadores.find(
        (item) => item.id === canaisDialog?.prestador_id,
      ) || null,
    [canaisDialog?.prestador_id, prestadores],
  );

  const abrirCampanha = (campanha?: MarketingCampanha) => {
    setCampanhaEditando(campanha || null);
    setCampanhaForm(
      campanha
        ? {
            nome: campanha.nome,
            descricao: campanha.descricao || "",
            tipoCampanha: campanha.tipo_campanha || "CONTRATADA",
            tipoDestino:
              campanha.tipo_destino ||
              (campanha.loja_id
                ? "LOJA"
                : campanha.prestador_id
                  ? "PRESTADOR"
                  : campanha.categoria_id
                    ? "CATEGORIA"
                    : "GRANCONECTA"),
            categoriaId: campanha.categoria_id
              ? String(campanha.categoria_id)
              : "",
            responsavelTipo: campanha.prestador_id
              ? "PRESTADOR"
              : campanha.loja_id
                ? "LOJA"
                : "",
            templateNome: campanha.template_nome || "",
            templateIdioma: campanha.template_idioma,
            dataAgendamento: dataLocal(campanha.data_agendamento),
            lojaId: campanha.loja_id || "",
            prestadorId: campanha.prestador_id || "",
            bannerId: campanha.banner_id ? String(campanha.banner_id) : "",
            condominioIds: campanha.segmentacao?.condominioIds || [],
            usuarioTipos:
              campanha.segmentacao?.usuarioTipos?.join(", ") || "MORADOR",
            parametros: Array.isArray(campanha.parametros_template)
              ? campanha.parametros_template.join("\n")
              : "",
            somenteUsuariosAtivos:
              campanha.segmentacao?.somenteUsuariosAtivos !== false,
          }
        : campanhaVazia(),
    );
    setCampanhaDialog(true);
  };

  const salvarCampanha = async () => {
    if (!campanhaForm.nome.trim())
      return toast.error("Informe o nome da campanha.");
    if (campanhaForm.tipoCampanha === "CONTRATADA") {
      if (!campanhaForm.responsavelTipo) {
        return toast.error(
          "Escolha se a campanha é de um prestador ou de uma loja/empreendimento.",
        );
      }

      if (
        campanhaForm.responsavelTipo === "PRESTADOR" &&
        !campanhaForm.prestadorId.trim()
      ) {
        return toast.error("Selecione o prestador responsável pela campanha.");
      }

      if (
        campanhaForm.responsavelTipo === "LOJA" &&
        !campanhaForm.lojaId.trim()
      ) {
        return toast.error("Selecione a loja/empreendimento da campanha.");
      }
    }
    if (
      campanhaForm.tipoDestino === "CATEGORIA" &&
      !campanhaForm.categoriaId
    ) {
      return toast.error("Selecione a categoria promovida pela campanha.");
    }

    if (
      campanhaForm.tipoDestino === "LOJA" &&
      !campanhaForm.lojaId.trim()
    ) {
      return toast.error("Selecione a loja de destino da campanha.");
    }

    if (
      campanhaForm.tipoDestino === "PRESTADOR" &&
      !campanhaForm.prestadorId.trim()
    ) {
      return toast.error("Selecione o prestador de destino da campanha.");
    }

    if (!campanhaForm.dataAgendamento)
      return toast.error("Informe a data de agendamento.");

    const input: CriarCampanhaInput = {
      nome: campanhaForm.nome.trim(),
      descricao: campanhaForm.descricao.trim() || null,
      tipoCampanha: campanhaForm.tipoCampanha,
      tipoDestino: campanhaForm.tipoDestino,
      categoriaId:
        campanhaForm.tipoDestino === "CATEGORIA"
          ? Number(campanhaForm.categoriaId)
          : null,
      templateNome: campanhaForm.templateNome.trim().toLowerCase() || null,
      templateIdioma: campanhaForm.templateIdioma.trim() || "pt_BR",
      dataAgendamento: new Date(campanhaForm.dataAgendamento).toISOString(),
      lojaId:
        (campanhaForm.tipoCampanha === "CONTRATADA" &&
          campanhaForm.responsavelTipo === "LOJA") ||
        campanhaForm.tipoDestino === "LOJA"
          ? campanhaForm.lojaId.trim() || null
          : null,
      prestadorId:
        (campanhaForm.tipoCampanha === "CONTRATADA" &&
          campanhaForm.responsavelTipo === "PRESTADOR") ||
        campanhaForm.tipoDestino === "PRESTADOR"
          ? campanhaForm.prestadorId.trim() || null
          : null,
      bannerId: campanhaForm.bannerId ? Number(campanhaForm.bannerId) : null,
      parametrosTemplate: parametros(campanhaForm.parametros),
      segmentacao: {
        condominioIds: campanhaForm.condominioIds,
        usuarioTipos: lista(campanhaForm.usuarioTipos),
        somenteUsuariosAtivos: campanhaForm.somenteUsuariosAtivos,
      },
    };

    setBusy(true);
    try {
      if (campanhaEditando) {
        await MarketingAdminService.atualizarCampanha(
          campanhaEditando.id,
          input,
        );
        toast.success("Campanha atualizada.");
      } else {
        await MarketingAdminService.criarCampanha(input);
        toast.success("Campanha criada como rascunho.");
      }
      setCampanhaDialog(false);
      await carregarCampanhas();
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível salvar a campanha."));
    } finally {
      setBusy(false);
    }
  };

  const executarAcao = async (
    campanha: MarketingCampanha,
    acao:
      | "contratar"
      | "confirmar-pagamento"
      | "aprovar"
      | "cancelar"
      | "gerar-fila"
      | "recalcular",
    sucesso: string,
  ) => {
    setBusy(true);
    try {
      await MarketingAdminService.acaoCampanha(campanha.id, acao);
      toast.success(sucesso);
      await carregarCampanhas();
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível executar a ação."));
    } finally {
      setBusy(false);
    }
  };

  const confirmarAgendamento = async () => {
    if (!agendar || !dataAgendamento) return;
    setBusy(true);
    try {
      await MarketingAdminService.agendarCampanha(
        agendar.id,
        new Date(dataAgendamento).toISOString(),
      );
      toast.success("Campanha agendada.");
      setAgendar(null);
      await carregarCampanhas();
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível agendar a campanha."));
    } finally {
      setBusy(false);
    }
  };

  const carregarLeads = async () => {
    if (!condominioFiltro.trim())
      return toast.error("Informe o ID do condomínio.");
    setLeadsLoading(true);
    try {
      const data = await MarketingAdminService.listarLeads(
        condominioFiltro.trim(),
      );
      setLeads(data.leads || []);
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível carregar os leads."));
    } finally {
      setLeadsLoading(false);
    }
  };

  const salvarLead = async () => {
    if (!leadForm.telefone.trim()) return toast.error("Informe o telefone.");
    setBusy(true);
    try {
      await MarketingAdminService.capturarLead({
        usuarioId: leadForm.usuarioId.trim() || null,
        condominioId: leadForm.condominioId.trim() || null,
        nome: leadForm.nome.trim() || null,
        telefone: leadForm.telefone.trim(),
        email: leadForm.email.trim() || null,
        origem: leadForm.origem,
        origemReferencia: leadForm.origemReferencia.trim() || null,
        aceitaMarketing: leadForm.aceitaMarketing,
        aceitaUtilidade: leadForm.aceitaUtilidade,
        origemConsentimento: "PAINEL_ADMIN",
      });
      toast.success("Lead e consentimento registrados.");
      setLeadDialog(false);
      if (condominioFiltro.trim()) await carregarLeads();
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível salvar o lead."));
    } finally {
      setBusy(false);
    }
  };

  const testarEnvio = async () => {
    if (!testeTelefone.trim() || !testeTemplate.trim()) {
      return toast.error("Informe telefone e template.");
    }
    setBusy(true);
    try {
      await MarketingAdminService.testarEnvio({
        usuarioId: testeUsuarioId.trim() || null,
        telefone: testeTelefone.trim(),
        nomeTemplate: testeTemplate.trim(),
        idioma: testeIdioma.trim(),
        parametrosCorpo: parametros(testeParametros),
      });
      toast.success("Mensagem aceita pela Meta.");
    } catch (error) {
      toast.error(erroApi(error, "Falha no envio de teste."));
    } finally {
      setBusy(false);
    }
  };

  const executarCiclo = async () => {
    setBusy(true);
    try {
      await MarketingAdminService.executarCiclo();
      toast.success("Ciclo de marketing executado.");
      await carregarCampanhas();
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível executar o ciclo."));
    } finally {
      setBusy(false);
    }
  };

  const carregarCanais = async (campanha: MarketingCampanha) => {
    const campanhaId = Number(campanha.id);

    if (!Number.isInteger(campanhaId) || campanhaId <= 0) {
      toast.error("ID da campanha inválido.");
      return;
    }

    setCanaisLoading(true);
    try {
      const registros = await MarketingAdminService.listarCanais(campanhaId);

      /*
       * Impede que a resposta atrasada de outra campanha substitua
       * os canais da campanha que está aberta atualmente.
       */
      if (campanhaCanaisIdRef.current !== campanhaId) {
        return;
      }

      setCanais(registros);

      const notificacao = registros.find(
        (item) => item.canal === "NOTIFICACAO",
      );
      const banner = registros.find((item) => item.canal === "BANNER");
      const instagram = registros.find((item) =>
        ["INSTAGRAM", "INSTAGRAM_ORGANICO"].includes(String(item.canal)),
      );
      const facebook = registros.find((item) =>
        ["FACEBOOK", "FACEBOOK_ORGANICO"].includes(String(item.canal)),
      );
      const whatsapp = registros.find((item) => item.canal === "WHATSAPP");

      setNotificacaoTitulo(String(notificacao?.configuracao?.titulo || ""));
      setNotificacaoMensagem(String(notificacao?.configuracao?.mensagem || ""));
      setCanalBannerId(campanha.banner_id ? String(campanha.banner_id) : "");
      setCanalBannerDataFim(
        dataLocal(String(banner?.configuracao?.dataFim || "")),
      );
      setCanalBannerDestino(String(banner?.configuracao?.linkDestino || ""));
      setInstagramLegenda(
        String(
          instagram?.configuracao?.legenda ||
            instagram?.configuracao?.mensagem ||
            campanha.descricao ||
            campanha.nome ||
            "",
        ),
      );
      setInstagramImagemUrl(String(instagram?.configuracao?.imagemUrl || ""));
      setFacebookLegenda(
        String(
          facebook?.configuracao?.legenda ||
            facebook?.configuracao?.mensagem ||
            campanha.descricao ||
            campanha.nome ||
            "",
        ),
      );
      setFacebookImagemUrl(String(facebook?.configuracao?.imagemUrl || ""));
      setWhatsappTemplate(
        String(
          whatsapp?.configuracao?.templateNome ||
            campanha.template_nome ||
            "",
        ),
      );
      setWhatsappIdioma(
        String(
          whatsapp?.configuracao?.templateIdioma ||
            campanha.template_idioma ||
            "pt_BR",
        ),
      );
      const parametrosWhatsApp =
        whatsapp?.configuracao?.parametrosTemplate ||
        campanha.parametros_template ||
        [];
      setWhatsappParametros(
        Array.isArray(parametrosWhatsApp)
          ? parametrosWhatsApp.map(String).join("\n")
          : "",
      );
    } catch (error) {
      if (campanhaCanaisIdRef.current !== campanhaId) {
        return;
      }

      setCanais([]);
      toast.error(erroApi(error, "Não foi possível carregar os canais."));
    } finally {
      if (campanhaCanaisIdRef.current === campanhaId) {
        setCanaisLoading(false);
      }
    }
  };

  const abrirCanais = async (campanha: MarketingCampanha) => {
    const campanhaId = Number(campanha.id);

    if (!Number.isInteger(campanhaId) || campanhaId <= 0) {
      toast.error("ID da campanha inválido.");
      return;
    }

    campanhaCanaisIdRef.current = campanhaId;
    setCanais([]);
    setCanaisLoading(true);
    setCanaisDialog(campanha);

    console.log("[AdminMarketing] Campanha selecionada", {
      campanhaId,
      nome: campanha.nome,
      bannerId: campanha.banner_id,
    });

    await carregarCanais(campanha);
  };

  const obterCampanhaCanaisId = (): number | null => {
    const campanhaId = campanhaCanaisIdRef.current;

    if (!campanhaId || !Number.isInteger(campanhaId) || campanhaId <= 0) {
      toast.error("Nenhuma campanha válida foi selecionada.");
      return null;
    }

    return campanhaId;
  };

  const fecharCanais = () => {
    if (busy) return;

    campanhaCanaisIdRef.current = null;
    setCanaisDialog(null);
    setCanais([]);
    setCanaisLoading(false);
    setInstagramArquivo(null);
  };

  const salvarCanalNotificacao = async () => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;
    if (!notificacaoTitulo.trim() || !notificacaoMensagem.trim()) {
      return toast.error("Informe título e mensagem da notificação.");
    }

    setBusy(true);
    try {
      await MarketingAdminService.configurarCanais(campanhaId, [
        {
          canal: "NOTIFICACAO",
          configuracao: {
            titulo: notificacaoTitulo.trim(),
            mensagem: notificacaoMensagem.trim(),
          },
        },
      ]);
      toast.success("Canal de notificação configurado.");
      await carregarCanais(canaisDialog);
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível configurar a notificação."));
    } finally {
      setBusy(false);
    }
  };

  const salvarCanalBanner = async () => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;
    const bannerId = Number(canalBannerId);
    if (!Number.isInteger(bannerId) || bannerId <= 0) {
      return toast.error("Informe um ID de banner válido.");
    }

    setBusy(true);
    try {
      const campanhaAtualizada = await MarketingAdminService.atualizarCampanha(
        campanhaId,
        { bannerId },
      );
      await MarketingAdminService.configurarCanais(campanhaId, [
        {
          canal: "BANNER",
          configuracao: {
            ...(canalBannerDataFim
              ? { dataFim: new Date(canalBannerDataFim).toISOString() }
              : {}),
            ...(canalBannerDestino.trim()
              ? { linkDestino: canalBannerDestino.trim() }
              : {}),
          },
        },
      ]);
      setCanaisDialog(campanhaAtualizada);
      toast.success("Banner vinculado e canal configurado.");
      await carregarCampanhas();
      await carregarCanais(campanhaAtualizada);
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível configurar o banner."));
    } finally {
      setBusy(false);
    }
  };

  const salvarCanalInstagram = async () => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;

    if (!instagramLegenda.trim()) {
      return toast.error("Informe a legenda da publicação no Instagram.");
    }

    if (
      !instagramArquivo &&
      !instagramImagemUrl.trim() &&
      !canaisDialog.banner_id
    ) {
      return toast.error(
        "Informe a URL da imagem ou vincule um banner à campanha.",
      );
    }

    setBusy(true);

    try {
      const imagemUrl = instagramArquivo
        ? await uploadImageFile(instagramArquivo)
        : instagramImagemUrl.trim();

      await MarketingAdminService.configurarCanais(campanhaId, [
        {
          canal: "INSTAGRAM_ORGANICO",
          configuracao: {
            legenda: instagramLegenda.trim(),
            ...(imagemUrl ? { imagemUrl } : {}),
          },
        },
      ]);

      setInstagramImagemUrl(imagemUrl);
      setInstagramArquivo(null);
      toast.success("Canal do Instagram configurado.");
      await carregarCanais(canaisDialog);
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível configurar o Instagram."));
    } finally {
      setBusy(false);
    }
  };

  const salvarCanalWhatsApp = async () => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;

    const templateNome = whatsappTemplate.trim().toLowerCase();
    const templateIdioma = whatsappIdioma.trim() || "pt_BR";
    const parametrosTemplate = parametros(whatsappParametros);

    if (!templateNome) {
      return toast.error("Informe o template aprovado na Meta para o WhatsApp.");
    }

    setBusy(true);
    try {
      let campanhaAtualizada = canaisDialog;

      // O backend só permite editar os dados principais da campanha
      // enquanto ela está em RASCUNHO. Nessa fase, mantemos campanha e
      // configuração do canal sincronizadas.
      if (canaisDialog.status === "RASCUNHO") {
        campanhaAtualizada = await MarketingAdminService.atualizarCampanha(
          campanhaId,
          {
            templateNome,
            templateIdioma,
            parametrosTemplate,
          },
        );
      }

      await MarketingAdminService.configurarCanais(campanhaId, [
        {
          canal: "WHATSAPP",
          configuracao: {
            templateNome,
            templateIdioma,
            parametrosTemplate,
            prestadorId: campanhaAtualizada.prestador_id || null,
            lojaId: campanhaAtualizada.loja_id || null,
          },
        },
      ]);

      setCanaisDialog(campanhaAtualizada);
      toast.success("Canal do WhatsApp configurado.");
      await carregarCanais(campanhaAtualizada);
      await carregarCampanhas();
    } catch (error) {
      toast.error(
        erroApi(error, "Não foi possível configurar o canal WhatsApp."),
      );
    } finally {
      setBusy(false);
    }
  };

  const executarWhatsApp = async () => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;

    if (!canalConfigurado("WHATSAPP")) {
      return toast.error("Salve a configuração do WhatsApp antes do envio.");
    }

    if (!canaisDialog.template_nome) {
      return toast.error(
        "A campanha não possui template WhatsApp. Configure o template antes de contratar/agendar a campanha.",
      );
    }

    if (!bool(canaisDialog.pago) || !bool(canaisDialog.aprovado)) {
      return toast.error("A campanha precisa estar paga e aprovada para enviar.");
    }

    if (!["AGENDADA", "PROCESSANDO"].includes(canaisDialog.status)) {
      return toast.error(
        `A campanha está em ${canaisDialog.status.replaceAll("_", " ")} e ainda não pode gerar a fila do WhatsApp.`,
      );
    }

    const confirmado = window.confirm(
      "Esta ação vai gerar/processar a fila real do WhatsApp para os leads com consentimento da campanha. Deseja continuar?",
    );

    if (!confirmado) return;

    setBusy(true);
    try {
      if (canaisDialog.status === "AGENDADA") {
        await MarketingAdminService.acaoCampanha(
          campanhaId,
          "gerar-fila",
        );
      }

      const processamento = await MarketingAdminService.processarFila({
        campanhaId,
        limite: 100,
        maxTentativas: 3,
      });

      const campanhaAtualizada =
        await MarketingAdminService.buscarCampanha(campanhaId);

      setCanaisDialog(campanhaAtualizada);
      await carregarCanais(campanhaAtualizada);
      await carregarCampanhas();

      const resultado = (processamento as any)?.resultado || processamento;
      const enviados = Number(resultado?.enviados || 0);
      const avaliados = Number(resultado?.avaliados || 0);
      const falhas = Number(resultado?.falhasDefinitivas || 0);
      const semConsentimento = Number(
        resultado?.canceladosSemConsentimento || 0,
      );

      toast.success(
        `WhatsApp processado: ${avaliados} avaliado(s), ${enviados} enviado(s), ${falhas} falha(s), ${semConsentimento} sem consentimento.`,
      );
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível processar o WhatsApp."));
    } finally {
      setBusy(false);
    }
  };

  const salvarCanalFacebook = async () => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;

    if (!facebookLegenda.trim()) {
      return toast.error("Informe o texto da publicação no Facebook.");
    }

    if (
      !facebookArquivo &&
      !facebookImagemUrl.trim() &&
      !canaisDialog.banner_id
    ) {
      return toast.error(
        "Informe a URL da imagem ou vincule um banner à campanha.",
      );
    }

    setBusy(true);

    try {
      const imagemUrl = facebookArquivo
        ? await uploadImageFile(facebookArquivo)
        : facebookImagemUrl.trim();

      await MarketingAdminService.configurarCanais(campanhaId, [
        {
          canal: "FACEBOOK_ORGANICO",
          configuracao: {
            legenda: facebookLegenda.trim(),
            ...(imagemUrl ? { imagemUrl } : {}),
          },
        },
      ]);

      setFacebookImagemUrl(imagemUrl);
      setFacebookArquivo(null);
      toast.success("Canal do Facebook configurado.");
      await carregarCanais(canaisDialog);
    } catch (error) {
      toast.error(erroApi(error, "Não foi possível configurar o Facebook."));
    } finally {
      setBusy(false);
    }
  };

  const criarEVincularBanner = async () => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;
    if (!novoBannerArquivo) return toast.error("Selecione a imagem do banner.");
    if (!novoBannerTitulo.trim())
      return toast.error("Informe o título do banner.");
    if (!novoBannerDestino.trim())
      return toast.error("Informe o link de destino.");
    if (!novoBannerDataFim)
      return toast.error("Informe a data final do banner.");

    setBusy(true);
    try {
      const imagemUrl = await uploadImageFile(novoBannerArquivo);
      const banner = await MarketingAdminService.criarBannerInstitucional({
        titulo: novoBannerTitulo.trim(),
        subtitulo: novoBannerSubtitulo.trim() || null,
        imagemUrl,
        corDestaque: novoBannerCor,
        linkDestino: novoBannerDestino.trim(),
        condominioId: novoBannerCondominioId.trim() || null,
        localExibicao: novoBannerLocal,
        dataInicio: novoBannerDataInicio
          ? new Date(novoBannerDataInicio).toISOString()
          : undefined,
        dataFim: new Date(novoBannerDataFim).toISOString(),
      });

      const campanhaAtualizada = await MarketingAdminService.atualizarCampanha(
        campanhaId,
        { bannerId: banner.id },
      );

      await MarketingAdminService.configurarCanais(campanhaId, [
        {
          canal: "BANNER",
          configuracao: {
            dataFim: new Date(novoBannerDataFim).toISOString(),
            linkDestino: novoBannerDestino.trim(),
          },
        },
      ]);

      setCanaisDialog(campanhaAtualizada);
      setCanalBannerId(String(banner.id));
      setCanalBannerDataFim(novoBannerDataFim);
      setCanalBannerDestino(novoBannerDestino.trim());
      setNovoBannerArquivo(null);
      toast.success(`Banner ${banner.id} criado e vinculado à campanha.`);
      await carregarCampanhas();
      await carregarCanais(campanhaAtualizada);
    } catch (error) {
      toast.error(
        erroApi(error, "Não foi possível criar e vincular o banner."),
      );
    } finally {
      setBusy(false);
    }
  };

  const executarCanal = async (canal: MarketingCanal) => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;

    console.log("[AdminMarketing] Executando canal", {
      campanhaId,
      canal,
      campanhaNoDialog: canaisDialog.id,
      bannerId: canaisDialog.banner_id,
    });

    setBusy(true);

    try {
      const resultado = await MarketingAdminService.executarCanal(
        campanhaId,
        canal,
      );

      console.log("[AdminMarketing] Resultado do canal", resultado);

      if (resultado?.ignorado) {
        toast(resultado.motivo || "Canal já processado.");
      } else {
        toast.success(
          `${canal}: ${resultado?.enviados || 0} enviado(s), ${
            resultado?.falhas || 0
          } falha(s).`,
        );
      }

      /*
       * Busca a campanha novamente para não
       * continuar usando o objeto antigo.
       */
      const campanhaAtualizada =
        await MarketingAdminService.buscarCampanha(campanhaId);

      setCanaisDialog(campanhaAtualizada);

      await carregarCanais(campanhaAtualizada);

      await carregarCampanhas();
    } catch (error) {
      console.error("[AdminMarketing] Falha ao executar canal", {
        campanhaId,
        canal,
        error,
      });

      toast.error(erroApi(error, `Não foi possível executar ${canal}.`));
    } finally {
      setBusy(false);
    }
  };

  const cancelarCanal = async (canal: MarketingCanal) => {
    const campanhaId = obterCampanhaCanaisId();
    if (!campanhaId || !canaisDialog) return;
    setBusy(true);
    try {
      await MarketingAdminService.cancelarCanal(campanhaId, canal);
      toast.success(`Canal ${canal} cancelado.`);
      await carregarCanais(canaisDialog);
    } catch (error) {
      toast.error(erroApi(error, `Não foi possível cancelar ${canal}.`));
    } finally {
      setBusy(false);
    }
  };

  const publicarInstagram = async () => {
    const confirmado = window.confirm(
      "Esta ação criará uma publicação real no perfil oficial do Instagram. Deseja continuar?",
    );

    if (!confirmado) return;

    await executarCanal("INSTAGRAM_ORGANICO");
  };

  const publicarFacebook = async () => {
    const confirmado = window.confirm(
      "Esta ação criará uma publicação real na Página oficial do Facebook. Deseja continuar?",
    );

    if (!confirmado) return;

    await executarCanal("FACEBOOK_ORGANICO");
  };

  const canalConfigurado = (canal: MarketingCanal) =>
    canais.find((item) => item.canal === canal);

  const canalInstagramConfigurado = () =>
    canais.find((item) =>
      ["INSTAGRAM", "INSTAGRAM_ORGANICO"].includes(String(item.canal)),
    );

  const instagramConfigurado = canalInstagramConfigurado();
  const whatsappConfigurado = canalConfigurado("WHATSAPP");

  const metricasWhatsapp = useMemo(() => {
    const canal = whatsappConfigurado;

    const destinatarios = Number(
      canal?.total_destinatarios || 0,
    );
    const enviados = Number(
      canal?.total_enviados || 0,
    );
    const entregues = Number(
      canal?.total_entregues || 0,
    );
    const lidos = Number(
      canal?.total_abertos || 0,
    );
    const falhas = Number(
      canal?.total_falhas || 0,
    );
    const pendentes = Math.max(
      0,
      destinatarios - enviados - falhas,
    );

    return {
      destinatarios,
      pendentes,
      enviados,
      entregues,
      lidos,
      falhas,
    };
  }, [whatsappConfigurado]);

  const destinatariosWhatsapp = useMemo<WhatsappDestinatario[]>(() => {
    const dados = (whatsappConfigurado as any)?.destinatarios;
    return Array.isArray(dados) ? dados : [];
  }, [whatsappConfigurado]);

  const proximaTentativaWhatsapp =
    canaisDialog?.situacao_whatsapp ===
      "REAGENDADA" &&
    canaisDialog.whatsapp_agendamento
      ?.status === "PENDENTE"
      ? canaisDialog.whatsapp_agendamento
          .data_execucao || null
      : null;

  const canalFacebookConfigurado = () =>
    canais.find((item) =>
      ["FACEBOOK", "FACEBOOK_ORGANICO"].includes(String(item.canal)),
    );

  const facebookConfigurado = canalFacebookConfigurado();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Card
          sx={{
            mb: 3,
            borderRadius: 5,
            color: "white",
            background: `linear-gradient(135deg, ${BRAND}, #392fc7)`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CampaignRoundedIcon />
                  <Typography
                    variant="overline"
                    fontWeight={900}
                    letterSpacing={1.4}
                  >
                    MARKETING E WHATSAPP
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} mt={0.5}>
                  Central de campanhas GranConecta
                </Typography>
                <Typography sx={{ mt: 1, color: "rgba(255,255,255,.78)" }}>
                  Crie, aprove, agende e acompanhe campanhas com consentimento.
                </Typography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                alignSelf={{ md: "center" }}
              >
                <Button
                  variant="contained"
                  startIcon={<PlayArrowRoundedIcon />}
                  onClick={executarCiclo}
                  disabled={busy}
                  sx={{
                    bgcolor: "rgba(255,255,255,.16)",
                    "&:hover": { bgcolor: "rgba(255,255,255,.25)" },
                  }}
                >
                  Executar ciclo
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => abrirCampanha()}
                  sx={{
                    bgcolor: "white",
                    color: BRAND,
                    fontWeight: 900,
                    "&:hover": { bgcolor: "#eef2ff" },
                  }}
                >
                  Nova campanha
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2} mb={3}>
          <Metric
            title="Campanhas"
            value={campanhas.length}
            icon={<CampaignRoundedIcon />}
            color="#6366f1"
          />
          <Metric
            title="Destinatários"
            value={totais.destinatarios}
            icon={<GroupRoundedIcon />}
            color="#0ea5e9"
          />
          <Metric
            title="Enviados"
            value={totais.enviados}
            icon={<SendRoundedIcon />}
            color="#8b5cf6"
          />
          <Metric
            title="Entregues"
            value={totais.entregues}
            icon={<CheckCircleRoundedIcon />}
            color="#22c55e"
          />
          <Metric
            title="Lidos"
            value={totais.lidos}
            icon={<MarkChatReadRoundedIcon />}
            color="#14b8a6"
          />
          <Metric
            title="Falhas"
            value={totais.falhas}
            icon={<AutorenewRoundedIcon />}
            color="#ef4444"
          />
        </Grid>

        <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label="Campanhas"
              icon={<CampaignRoundedIcon />}
              iconPosition="start"
            />
            <Tab
              label="Leads"
              icon={<GroupRoundedIcon />}
              iconPosition="start"
            />
            <Tab
              label="Teste de envio"
              icon={<SendRoundedIcon />}
              iconPosition="start"
            />
          </Tabs>

          {tab === 0 && (
            <Box p={{ xs: 2, md: 3 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                mb={2}
              >
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={statusFiltro}
                  onChange={(event) =>
                    setStatusFiltro(
                      event.target.value as MarketingCampanhaStatus | "",
                    )
                  }
                  sx={{ minWidth: 230 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {STATUS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Atualizar">
                  <IconButton onClick={carregarCampanhas}>
                    <RefreshRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {loading ? (
                <Box
                  display="grid"
                  sx={{ placeItems: "center", minHeight: 280 }}
                >
                  <CircularProgress />
                </Box>
              ) : campanhas.length === 0 ? (
                <Alert severity="info">Nenhuma campanha encontrada.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Campanha</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Agendamento</TableCell>
                        <TableCell>Métricas</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {campanhas.map((campanha) => {
                        const statusVisual =
                          statusVisualCampanha(
                            campanha,
                          );

                        return (
                        <TableRow key={campanha.id} hover>
                          <TableCell>
                            <Typography
                              variant="caption"
                              color="primary"
                              fontWeight={900}
                              display="block"
                            >
                              CAMPANHA #{campanha.id}
                            </Typography>
                            <Typography fontWeight={900}>
                              {campanha.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {campanha.tipo_campanha || "CONTRATADA"} ·{" "}
                              {campanha.template_nome || "Sem WhatsApp"}
                            </Typography>
                            {campanha.descricao && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {campanha.descricao}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.6} alignItems="flex-start">
                              <Chip
                                size="small"
                                label={statusVisual.label}
                                color={statusVisual.color}
                              />

                              {statusVisual.detalhe && (
                                <Typography
                                  variant="caption"
                                  color="warning.main"
                                  fontWeight={800}
                                  display="block"
                                >
                                  {statusVisual.detalhe}
                                </Typography>
                              )}

                              {statusVisual.motivo && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{
                                    maxWidth: 280,
                                    lineHeight: 1.25,
                                  }}
                                >
                                  {statusVisual.motivo}
                                </Typography>
                              )}
                              <Stack direction="row" spacing={0.5}>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color={
                                    bool(campanha.pago) ? "success" : "default"
                                  }
                                  label={
                                    bool(campanha.pago) ? "Pago" : "Não pago"
                                  }
                                />
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color={
                                    bool(campanha.aprovado)
                                      ? "success"
                                      : "default"
                                  }
                                  label={
                                    bool(campanha.aprovado)
                                      ? "Aprovada"
                                      : "Não aprovada"
                                  }
                                />
                              </Stack>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {formatarData(campanha.data_agendamento)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">
                              Dest.: {campanha.total_destinatarios}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Env.: {campanha.total_enviados} · Entr.:{" "}
                              {campanha.total_entregues}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Lidos: {campanha.total_lidos} · Falhas:{" "}
                              {campanha.total_falhas}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent="flex-end"
                              flexWrap="wrap"
                            >
                              <Button
                                size="small"
                                startIcon={<CampaignRoundedIcon />}
                                onClick={() => void abrirCanais(campanha)}
                              >
                                Canais
                              </Button>
                              {campanha.status === "RASCUNHO" && (
                                <Button
                                  size="small"
                                  onClick={() => abrirCampanha(campanha)}
                                >
                                  Editar
                                </Button>
                              )}
                              {campanha.status === "RASCUNHO" &&
                                (campanha.tipo_campanha || "CONTRATADA") ===
                                  "CONTRATADA" && (
                                  <Button
                                    size="small"
                                    startIcon={<PaymentsRoundedIcon />}
                                    onClick={() =>
                                      executarAcao(
                                        campanha,
                                        "contratar",
                                        "Contratação solicitada.",
                                      )
                                    }
                                  >
                                    Contratar
                                  </Button>
                                )}
                              {campanha.status === "AGUARDANDO_PAGAMENTO" && (
                                <Button
                                  size="small"
                                  color="success"
                                  onClick={() =>
                                    executarAcao(
                                      campanha,
                                      "confirmar-pagamento",
                                      "Pagamento confirmado.",
                                    )
                                  }
                                >
                                  Baixa pago
                                </Button>
                              )}
                              {campanha.status === "AGUARDANDO_APROVACAO" && (
                                <Button
                                  size="small"
                                  color="success"
                                  onClick={() =>
                                    executarAcao(
                                      campanha,
                                      "aprovar",
                                      "Campanha aprovada.",
                                    )
                                  }
                                >
                                  Aprovar
                                </Button>
                              )}
                              {bool(campanha.pago) &&
                                bool(campanha.aprovado) &&
                                !["CONCLUIDA", "CANCELADA"].includes(
                                  campanha.status,
                                ) && (
                                  <Button
                                    size="small"
                                    startIcon={<EditCalendarRoundedIcon />}
                                    onClick={() => {
                                      setAgendar(campanha);
                                      setDataAgendamento(
                                        dataLocal(campanha.data_agendamento),
                                      );
                                    }}
                                  >
                                    Agendar
                                  </Button>
                                )}
                              {campanha.status === "AGENDADA" && (
                                <Button
                                  size="small"
                                  startIcon={<ScheduleSendRoundedIcon />}
                                  onClick={() =>
                                    executarAcao(
                                      campanha,
                                      "gerar-fila",
                                      "Fila gerada.",
                                    )
                                  }
                                >
                                  Gerar fila
                                </Button>
                              )}
                              <Tooltip title="Recalcular totais">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    executarAcao(
                                      campanha,
                                      "recalcular",
                                      "Totais recalculados.",
                                    )
                                  }
                                >
                                  <RefreshRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {!["CONCLUIDA", "CANCELADA"].includes(
                                campanha.status,
                              ) && (
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    executarAcao(
                                      campanha,
                                      "cancelar",
                                      "Campanha cancelada.",
                                    )
                                  }
                                >
                                  Cancelar
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box p={{ xs: 2, md: 3 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                mb={2}
              >
                <TextField
                  size="small"
                  fullWidth
                  label="ID do condomínio"
                  value={condominioFiltro}
                  onChange={(event) => setCondominioFiltro(event.target.value)}
                />
                <Button
                  variant="outlined"
                  onClick={carregarLeads}
                  disabled={leadsLoading}
                >
                  Buscar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => {
                    setLeadForm({
                      ...leadVazio(),
                      condominioId: condominioFiltro,
                    });
                    setLeadDialog(true);
                  }}
                >
                  Novo lead
                </Button>
              </Stack>
              {leadsLoading ? (
                <Box
                  display="grid"
                  sx={{ placeItems: "center", minHeight: 220 }}
                >
                  <CircularProgress />
                </Box>
              ) : leads.length === 0 ? (
                <Alert severity="info">
                  Informe um condomínio para listar os leads.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Lead</TableCell>
                        <TableCell>Telefone</TableCell>
                        <TableCell>Origem</TableCell>
                        <TableCell>Situação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id} hover>
                          <TableCell>
                            <Typography fontWeight={800}>
                              {lead.nome || "Sem nome"}
                            </Typography>
                            <Typography variant="caption">
                              {lead.email || lead.id}
                            </Typography>
                          </TableCell>
                          <TableCell>{lead.telefone}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={lead.origem.replaceAll("_", " ")}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={bool(lead.ativo) ? "success" : "default"}
                              label={bool(lead.ativo) ? "Ativo" : "Inativo"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box p={{ xs: 2, md: 3 }} maxWidth={760}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                O destinatário precisa possuir consentimento de marketing
                confirmado.
              </Alert>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Telefone com DDI"
                    value={testeTelefone}
                    onChange={(e) => setTesteTelefone(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="ID do usuário (quando cadastrado)"
                    value={testeUsuarioId}
                    onChange={(e) => setTesteUsuarioId(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Template"
                    value={testeTemplate}
                    onChange={(e) => setTesteTemplate(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Idioma"
                    value={testeIdioma}
                    onChange={(e) => setTesteIdioma(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Parâmetros, um por linha"
                    value={testeParametros}
                    onChange={(e) => setTesteParametros(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    startIcon={<SendRoundedIcon />}
                    onClick={testarEnvio}
                    disabled={busy}
                  >
                    Enviar teste
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>

      <Dialog
        open={campanhaDialog}
        onClose={() => !busy && setCampanhaDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle>
          {campanhaEditando ? "Editar campanha" : "Nova campanha"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nome da campanha"
                value={campanhaForm.nome}
                onChange={(e) =>
                  setCampanhaForm({ ...campanhaForm, nome: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Descrição"
                value={campanhaForm.descricao}
                onChange={(e) =>
                  setCampanhaForm({
                    ...campanhaForm,
                    descricao: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Tipo de campanha"
                value={campanhaForm.tipoCampanha}
                onChange={(e) => {
                  const tipoCampanha =
                    e.target.value as MarketingCampanhaTipo;

                  setCampanhaForm((atual) => ({
                    ...atual,
                    tipoCampanha,
                    responsavelTipo:
                      tipoCampanha === "CONTRATADA"
                        ? atual.responsavelTipo
                        : "",
                    lojaId:
                      tipoCampanha === "CONTRATADA"
                        ? atual.lojaId
                        : "",
                    prestadorId:
                      tipoCampanha === "CONTRATADA"
                        ? atual.prestadorId
                        : "",
                  }));
                }}
                disabled={Boolean(campanhaEditando)}
              >
                <MenuItem value="INSTITUCIONAL">Institucional</MenuItem>
                <MenuItem value="CONTRATADA">
                  Contratada por loja/prestador
                </MenuItem>
                <MenuItem value="AUTOMATICA">Automática</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Template aprovado na Meta (opcional)"
                value={campanhaForm.templateNome}
                onChange={(e) =>
                  setCampanhaForm({
                    ...campanhaForm,
                    templateNome: e.target.value,
                  })
                }
                helperText="Obrigatório somente quando a campanha utilizar o canal WhatsApp."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Idioma"
                value={campanhaForm.templateIdioma}
                onChange={(e) =>
                  setCampanhaForm({
                    ...campanhaForm,
                    templateIdioma: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Agendamento"
                value={campanhaForm.dataAgendamento}
                onChange={(e) =>
                  setCampanhaForm({
                    ...campanhaForm,
                    dataAgendamento: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                select
                fullWidth
                label="O que esta campanha promove?"
                value={campanhaForm.tipoDestino}
                onChange={(event) => {
                  const tipoDestino =
                    event.target.value as MarketingCampanhaDestinoTipo;

                  setCampanhaForm((atual) => ({
                    ...atual,
                    tipoDestino,
                    categoriaId:
                      tipoDestino === "CATEGORIA"
                        ? atual.categoriaId
                        : "",
                    lojaId:
                      tipoDestino === "LOJA" ||
                      (atual.tipoCampanha === "CONTRATADA" &&
                        atual.responsavelTipo === "LOJA")
                        ? atual.lojaId
                        : "",
                    prestadorId:
                      tipoDestino === "PRESTADOR" ||
                      (atual.tipoCampanha === "CONTRATADA" &&
                        atual.responsavelTipo === "PRESTADOR")
                        ? atual.prestadorId
                        : "",
                  }));
                }}
              >
                <MenuItem value="GRANCONECTA">
                  GranConecta / ecossistema
                </MenuItem>
                <MenuItem value="CATEGORIA">
                  Categoria / nicho
                </MenuItem>
                <MenuItem value="LOJA">
                  Loja específica
                </MenuItem>
                <MenuItem value="PRESTADOR">
                  Prestador específico
                </MenuItem>
              </TextField>
            </Grid>

            {campanhaForm.tipoDestino === "CATEGORIA" && (
              <Grid size={{ xs: 12, md: 7 }}>
                <Autocomplete
                  options={categorias}
                  value={categoriaSelecionada}
                  getOptionLabel={(option) =>
                    option.grupoNome
                      ? `${option.nome} · ${option.grupoNome}`
                      : option.nome
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(_, option) =>
                    setCampanhaForm((atual) => ({
                      ...atual,
                      categoriaId: option?.id || "",
                    }))
                  }
                  noOptionsText="Nenhuma categoria com prestador/loja ativa"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Categoria promovida"
                      placeholder="Ex.: Psicopedagogia"
                      helperText="A conversa usará o playbook deste nicho e apresentará opções reais da categoria."
                    />
                  )}
                />
              </Grid>
            )}

            {campanhaForm.tipoDestino === "GRANCONECTA" && (
              <Grid size={{ xs: 12, md: 7 }}>
                <Alert severity="info">
                  A campanha apresenta o ecossistema GranConecta e pode direcionar o usuário conforme a necessidade identificada.
                </Alert>
              </Grid>
            )}

            {campanhaForm.tipoCampanha === "CONTRATADA" && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info">
                    Escolha apenas quem é o anunciante desta campanha. Se for
                    uma loja, o proprietário já vem vinculado pela própria loja;
                    não é necessário escolher também um prestador.
                  </Alert>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    select
                    fullWidth
                    label="Responsável comercial da campanha"
                    value={campanhaForm.responsavelTipo}
                    onChange={(event) => {
                      const responsavelTipo =
                        event.target.value as ResponsavelCampanhaTipo;

                      setCampanhaForm((atual) => ({
                        ...atual,
                        responsavelTipo,
                        lojaId:
                          responsavelTipo === "LOJA"
                            ? atual.lojaId
                            : "",
                        prestadorId:
                          responsavelTipo === "PRESTADOR"
                            ? atual.prestadorId
                            : "",
                        tipoDestino:
                          atual.tipoDestino === "GRANCONECTA"
                            ? (responsavelTipo || "GRANCONECTA")
                            : atual.tipoDestino,
                      }));
                    }}
                  >
                    <MenuItem value="">
                      <em>Selecione</em>
                    </MenuItem>
                    <MenuItem value="PRESTADOR">
                      Prestador / serviço
                    </MenuItem>
                    <MenuItem value="LOJA">
                      Loja / empreendimento
                    </MenuItem>
                  </TextField>
                </Grid>

                {campanhaForm.responsavelTipo === "PRESTADOR" && (
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Autocomplete
                      options={prestadores}
                      loading={responsaveisLoading}
                      value={prestadorSelecionado}
                      getOptionLabel={(option) => {
                        const detalhes = [
                          option.categoriaNome,
                          option.grupoNome,
                        ].filter(Boolean);

                        return detalhes.length
                          ? `${option.nome} · ${detalhes.join(" · ")}`
                          : option.nome;
                      }}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      onChange={(_, option) =>
                        setCampanhaForm((atual) => ({
                          ...atual,
                          prestadorId: option?.id || "",
                          lojaId: "",
                        }))
                      }
                      noOptionsText="Nenhum prestador encontrado"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label="Prestador responsável"
                          placeholder="Pesquise pelo nome ou atividade"
                          helperText="Este será o anunciante da campanha."
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {responsaveisLoading ? (
                                  <CircularProgress size={18} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                )}

                {campanhaForm.responsavelTipo === "LOJA" && (
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Autocomplete
                      options={lojas}
                      loading={responsaveisLoading}
                      value={lojaSelecionada}
                      getOptionLabel={(option) => {
                        const detalhes = [
                          option.categoriaNome || option.categoria,
                          option.grupoNome,
                        ].filter(Boolean);

                        return detalhes.length
                          ? `${option.nome} · ${detalhes.join(" · ")}`
                          : option.nome;
                      }}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      onChange={(_, option) =>
                        setCampanhaForm((atual) => ({
                          ...atual,
                          lojaId: option?.id || "",
                          prestadorId: "",
                        }))
                      }
                      noOptionsText="Nenhuma loja encontrada"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label="Loja / empreendimento"
                          placeholder="Pesquise pelo nome da loja"
                          helperText={
                            lojaSelecionada?.nomeProprietario
                              ? `Responsável cadastrado: ${lojaSelecionada.nomeProprietario}`
                              : "O proprietário é obtido automaticamente pelo cadastro da loja."
                          }
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {responsaveisLoading ? (
                                  <CircularProgress size={18} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                )}
              </>
            )}

            {campanhaForm.tipoCampanha === "INSTITUCIONAL" && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="success">
                  Campanha institucional do GranConecta: não é necessário
                  selecionar prestador nem loja.
                </Alert>
              </Grid>
            )}

            {campanhaForm.tipoCampanha === "AUTOMATICA" && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">
                  Campanha automática: o responsável será definido pelo fluxo
                  de automação que originar a campanha.
                </Alert>
              </Grid>
            )}

            {responsaveisErro && (
              <Grid size={{ xs: 12 }}>
                <Alert
                  severity="warning"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => void carregarResponsaveis()}
                    >
                      Tentar novamente
                    </Button>
                  }
                >
                  {responsaveisErro}
                </Alert>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                loading={condominiosLoading}
                options={condominios}
                value={condominiosSelecionados}
                getOptionLabel={(option) => option.nome}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, selecionados) =>
                  setCampanhaForm({
                    ...campanhaForm,
                    condominioIds: selecionados.map((item) => item.id),
                  })
                }
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key} {...optionProps}>
                      <Checkbox checked={selected} sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {option.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.id}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Condomínios da campanha"
                    placeholder="Digite para buscar"
                    helperText={
                      campanhaForm.condominioIds.length === 0
                        ? "Nenhum selecionado: a campanha será enviada para todos os condomínios."
                        : `${campanhaForm.condominioIds.length} condomínio(s) selecionado(s).`
                    }
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {condominiosLoading ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              {condominiosErro && (
                <Alert
                  severity="warning"
                  action={
                    <Button
                      size="small"
                      onClick={() => void carregarCondominios()}
                    >
                      Tentar novamente
                    </Button>
                  }
                  sx={{ mt: 1 }}
                >
                  {condominiosErro}
                </Alert>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tipos de usuário"
                value={campanhaForm.usuarioTipos}
                onChange={(e) =>
                  setCampanhaForm({
                    ...campanhaForm,
                    usuarioTipos: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Parâmetros do template, um por linha"
                value={campanhaForm.parametros}
                onChange={(e) =>
                  setCampanhaForm({
                    ...campanhaForm,
                    parametros: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={campanhaForm.somenteUsuariosAtivos}
                    onChange={(e) =>
                      setCampanhaForm({
                        ...campanhaForm,
                        somenteUsuariosAtivos: e.target.checked,
                      })
                    }
                  />
                }
                label="Somente usuários ativos"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCampanhaDialog(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={salvarCampanha} disabled={busy}>
            {busy ? <CircularProgress size={22} /> : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(agendar)}
        onClose={() => !busy && setAgendar(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Agendar campanha</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="datetime-local"
            label="Data e hora"
            value={dataAgendamento}
            onChange={(e) => setDataAgendamento(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgendar(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={confirmarAgendamento}
            disabled={busy || !dataAgendamento}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={leadDialog}
        onClose={() => !busy && setLeadDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Novo lead e consentimento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nome"
                value={leadForm.nome}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, nome: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Telefone"
                value={leadForm.telefone}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, telefone: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="E-mail"
                value={leadForm.email}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, email: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ID do usuário (opcional)"
                value={leadForm.usuarioId}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, usuarioId: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ID do condomínio"
                value={leadForm.condominioId}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, condominioId: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Origem"
                value={leadForm.origem}
                onChange={(e) =>
                  setLeadForm({
                    ...leadForm,
                    origem: e.target.value as MarketingLeadOrigem,
                  })
                }
              >
                {ORIGENS.map((origem) => (
                  <MenuItem key={origem} value={origem}>
                    {origem.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Referência"
                value={leadForm.origemReferencia}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, origemReferencia: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: "column", sm: "row" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={leadForm.aceitaUtilidade}
                      onChange={(e) =>
                        setLeadForm({
                          ...leadForm,
                          aceitaUtilidade: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Aceita utilidade"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={leadForm.aceitaMarketing}
                      onChange={(e) =>
                        setLeadForm({
                          ...leadForm,
                          aceitaMarketing: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Consentiu com marketing"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setLeadDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarLead} disabled={busy}>
            Salvar lead
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(canaisDialog)}
        onClose={fecharCanais}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle>
          Canais da campanha #{campanhaCanaisIdRef.current}:{" "}
          {canaisDialog?.nome}
        </DialogTitle>
        <DialogContent>
          {canaisLoading ? (
            <Box display="grid" sx={{ placeItems: "center", minHeight: 260 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5} mt={1}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1}
                    mb={2}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <NotificationsActiveRoundedIcon color="primary" />
                      <Typography variant="h6" fontWeight={900}>
                        Notificação interna
                      </Typography>
                    </Stack>
                    {canalConfigurado("NOTIFICACAO") && (
                      <Chip
                        size="small"
                        label={canalConfigurado("NOTIFICACAO")!.status}
                        color={canalStatusColor(
                          canalConfigurado("NOTIFICACAO")!.status,
                        )}
                      />
                    )}
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Título"
                        value={notificacaoTitulo}
                        onChange={(e) => setNotificacaoTitulo(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Mensagem"
                        value={notificacaoMensagem}
                        onChange={(e) => setNotificacaoMensagem(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <Button
                          variant="outlined"
                          onClick={salvarCanalNotificacao}
                          disabled={busy}
                        >
                          Salvar configuração
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<PlayArrowRoundedIcon />}
                          onClick={() => executarCanal("NOTIFICACAO")}
                          disabled={busy || !canalConfigurado("NOTIFICACAO")}
                        >
                          Executar
                        </Button>
                        {canalConfigurado("NOTIFICACAO") && (
                          <Button
                            color="error"
                            onClick={() => cancelarCanal("NOTIFICACAO")}
                            disabled={busy}
                          >
                            Cancelar canal
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                  {canalConfigurado("NOTIFICACAO") && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mt={2}
                    >
                      Destinatários:{" "}
                      {canalConfigurado("NOTIFICACAO")!.total_destinatarios} ·
                      Enviados:{" "}
                      {canalConfigurado("NOTIFICACAO")!.total_enviados} ·
                      Falhas: {canalConfigurado("NOTIFICACAO")!.total_falhas}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1}
                    mb={2}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ViewCarouselRoundedIcon color="secondary" />
                      <Typography variant="h6" fontWeight={900}>
                        Banner das vitrines
                      </Typography>
                    </Stack>
                    {canalConfigurado("BANNER") && (
                      <Chip
                        size="small"
                        label={canalConfigurado("BANNER")!.status}
                        color={canalStatusColor(
                          canalConfigurado("BANNER")!.status,
                        )}
                      />
                    )}
                  </Stack>
                  <Typography fontWeight={900} mb={2}>
                    Criar novo banner institucional
                  </Typography>
                  <Grid container spacing={2} mb={3}>
                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ sm: "center" }}
                      >
                        <Button component="label" variant="outlined">
                          Selecionar imagem
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) =>
                              setNovoBannerArquivo(e.target.files?.[0] || null)
                            }
                          />
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                          {novoBannerArquivo?.name ||
                            "Nenhuma imagem selecionada"}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Título"
                        value={novoBannerTitulo}
                        onChange={(e) => setNovoBannerTitulo(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Subtítulo"
                        value={novoBannerSubtitulo}
                        onChange={(e) => setNovoBannerSubtitulo(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Local de exibição"
                        value={novoBannerLocal}
                        onChange={(e) =>
                          setNovoBannerLocal(
                            e.target.value as BannerLocalExibicao,
                          )
                        }
                      >
                        <MenuItem value="MARKETPLACE">
                          Marketplace de lojas
                        </MenuItem>
                        <MenuItem value="SERVICOS">
                          Vitrine de serviços
                        </MenuItem>
                        <MenuItem value="AMBOS">Ambos</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="ID do condomínio (vazio = global)"
                        value={novoBannerCondominioId}
                        onChange={(e) =>
                          setNovoBannerCondominioId(e.target.value)
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        type="color"
                        label="Cor de destaque"
                        value={novoBannerCor}
                        onChange={(e) => setNovoBannerCor(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Link de destino (slug, rota ou URL)"
                        value={novoBannerDestino}
                        onChange={(e) => setNovoBannerDestino(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Data inicial"
                        value={novoBannerDataInicio}
                        onChange={(e) =>
                          setNovoBannerDataInicio(e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Data final"
                        value={novoBannerDataFim}
                        onChange={(e) => setNovoBannerDataFim(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<ViewCarouselRoundedIcon />}
                        onClick={criarEVincularBanner}
                        disabled={busy}
                      >
                        Criar e vincular à campanha
                      </Button>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Para reutilizar um banner existente, informe o ID abaixo.
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="ID do banner"
                        value={canalBannerId}
                        onChange={(e) => setCanalBannerId(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Data final opcional"
                        value={canalBannerDataFim}
                        onChange={(e) => setCanalBannerDataFim(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Destino opcional (slug, rota ou URL)"
                        value={canalBannerDestino}
                        onChange={(e) => setCanalBannerDestino(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <Button
                          variant="outlined"
                          onClick={salvarCanalBanner}
                          disabled={busy}
                        >
                          Vincular e configurar
                        </Button>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<PlayArrowRoundedIcon />}
                          onClick={() => executarCanal("BANNER")}
                          disabled={busy || !canalConfigurado("BANNER")}
                        >
                          Ativar banner
                        </Button>
                        {canalConfigurado("BANNER") && (
                          <Button
                            color="error"
                            onClick={() => cancelarCanal("BANNER")}
                            disabled={busy}
                          >
                            Cancelar canal
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                  {canalConfigurado("BANNER")?.ultimo_erro && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {canalConfigurado("BANNER")!.ultimo_erro}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "#25D366",
                  background:
                    "linear-gradient(180deg, rgba(37,211,102,.06), rgba(255,255,255,1) 42%)",
                }}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1}
                    mb={2}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MarkChatReadRoundedIcon sx={{ color: "#128C7E" }} />
                      <Box>
                        <Typography variant="h6" fontWeight={900}>
                          WhatsApp oficial
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Disparo pela API oficial do WhatsApp Business do GranConecta
                        </Typography>
                      </Box>
                    </Stack>

                    {whatsappConfigurado && (
                      <Chip
                        size="small"
                        label={whatsappConfigurado.status}
                        color={canalStatusColor(whatsappConfigurado.status)}
                      />
                    )}
                  </Stack>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    O envio utiliza o template e a segmentação gravados na campanha.
                    As respostas recebidas pelo WhatsApp seguem para o bot/atendimento
                    do GranConecta e mantêm o contexto da campanha.
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <TextField
                        fullWidth
                        label="Template aprovado na Meta"
                        value={whatsappTemplate}
                        onChange={(event) =>
                          setWhatsappTemplate(event.target.value)
                        }
                        disabled={canaisDialog?.status !== "RASCUNHO"}
                        helperText={
                          canaisDialog?.status === "RASCUNHO"
                            ? "Use o nome exato do template aprovado pela Meta."
                            : "Campanha já contratada/agendada: o template principal não pode mais ser alterado aqui."
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                      <TextField
                        fullWidth
                        label="Idioma do template"
                        value={whatsappIdioma}
                        onChange={(event) => setWhatsappIdioma(event.target.value)}
                        disabled={canaisDialog?.status !== "RASCUNHO"}
                        helperText="Ex.: pt_BR"
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Parâmetros do template, um por linha"
                        value={whatsappParametros}
                        onChange={(event) =>
                          setWhatsappParametros(event.target.value)
                        }
                        disabled={canaisDialog?.status !== "RASCUNHO"}
                        helperText="A ordem precisa ser a mesma das variáveis {{1}}, {{2}}, ... do template da Meta."
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Alert severity="info">
                        {canaisDialog?.prestador_id
                          ? `Campanha de prestador: ${
                              prestadorCanalSelecionado?.nome ||
                              "prestador vinculado"
                            }${
                              prestadorCanalSelecionado?.categoriaNome
                                ? ` · ${prestadorCanalSelecionado.categoriaNome}`
                                : ""
                            }.`
                          : canaisDialog?.loja_id
                            ? `Campanha de loja: ${
                                lojaCanalSelecionada?.nome ||
                                "loja vinculada"
                              }${
                                lojaCanalSelecionada?.nomeProprietario
                                  ? ` · Responsável: ${lojaCanalSelecionada.nomeProprietario}`
                                  : ""
                              }.`
                            : "Campanha institucional/sem anunciante comercial vinculado."}
                      </Alert>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Button
                          variant="outlined"
                          onClick={salvarCanalWhatsApp}
                          disabled={busy || !whatsappTemplate.trim()}
                        >
                          Salvar configuração
                        </Button>

                        <Button
                          variant="contained"
                          startIcon={<SendRoundedIcon />}
                          onClick={executarWhatsApp}
                          disabled={
                            busy ||
                            !whatsappConfigurado ||
                            !["AGENDADA", "PROCESSANDO"].includes(
                              canaisDialog?.status || "",
                            )
                          }
                          sx={{
                            bgcolor: "#128C7E",
                            "&:hover": { bgcolor: "#0f766e" },
                          }}
                        >
                          Gerar fila e enviar agora
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>

                  {whatsappConfigurado && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={900}
                        mb={1}
                      >
                        Métricas do canal WhatsApp
                      </Typography>

                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                          <MetricMini
                            label="Destinatários"
                            value={metricasWhatsapp.destinatarios}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                          <MetricMini
                            label="Pendentes"
                            value={metricasWhatsapp.pendentes}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                          <MetricMini
                            label="Enviados"
                            value={metricasWhatsapp.enviados}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                          <MetricMini
                            label="Entregues"
                            value={metricasWhatsapp.entregues}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                          <MetricMini
                            label="Lidos"
                            value={metricasWhatsapp.lidos}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                          <MetricMini
                            label="Falhas"
                            value={metricasWhatsapp.falhas}
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2 }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          gap={1}
                          mb={1}
                        >
                          <Typography variant="subtitle2" fontWeight={900}>
                            Destinatários do WhatsApp
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {destinatariosWhatsapp.length} registro(s) na fila
                          </Typography>
                        </Stack>

                        {destinatariosWhatsapp.length === 0 ? (
                          <Alert severity="info">
                            Ainda não há destinatários registrados na fila desta campanha.
                          </Alert>
                        ) : (
                          <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ borderRadius: 2.5, maxHeight: 320 }}
                          >
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Nome</TableCell>
                                  <TableCell>Telefone</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell align="center">Tentativas</TableCell>
                                  <TableCell>Data / atualização</TableCell>
                                  <TableCell>Detalhe</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {destinatariosWhatsapp.map((item) => (
                                  <TableRow key={item.id} hover>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight={700}>
                                        {item.nome || "Destinatário"}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                                      {formatarTelefone(item.telefone)}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        size="small"
                                        label={item.status || "PENDENTE"}
                                        color={
                                          ["ENTREGUE", "DELIVERED", "LIDO", "READ"].includes(
                                            String(item.status || "").toUpperCase(),
                                          )
                                            ? "success"
                                            : ["FALHA", "FALHOU", "FAILED"].includes(
                                                  String(item.status || "").toUpperCase(),
                                                )
                                              ? "error"
                                              : ["ENVIADO", "SENT"].includes(
                                                    String(item.status || "").toUpperCase(),
                                                  )
                                                ? "info"
                                                : "default"
                                        }
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      {Number(item.tentativas || 0)}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                                      {formatarData(
                                        item.updatedAt || item.dataExecucao || item.createdAt || null,
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 180 }}>
                                      {item.ultimoErro ? (
                                        <Tooltip title={item.ultimoErro}>
                                          <Typography
                                            variant="caption"
                                            color="error.main"
                                            sx={{
                                              display: "block",
                                              maxWidth: 260,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {item.ultimoErro}
                                          </Typography>
                                        </Tooltip>
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">
                                          Sem erro registrado
                                        </Typography>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>

                      {proximaTentativaWhatsapp && (
                        <Alert
                          severity="warning"
                          sx={{ mt: 1.5 }}
                        >
                          <strong>Reagendada.</strong>{" "}
                          Próxima tentativa:{" "}
                          {formatarData(
                            proximaTentativaWhatsapp,
                          )}
                          {canaisDialog
                            ?.whatsapp_agendamento
                            ?.tentativas
                            ? ` · Tentativa ${canaisDialog.whatsapp_agendamento.tentativas} de 3`
                            : ""}
                        </Alert>
                      )}
                    </Box>
                  )}

                  {whatsappConfigurado?.ultimo_erro &&
                    !proximaTentativaWhatsapp && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {whatsappConfigurado.ultimo_erro}
                      </Alert>
                    )}
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "#1877f2",
                  background:
                    "linear-gradient(180deg, rgba(24,119,242,.06), rgba(255,255,255,1) 42%)",
                }}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1}
                    mb={2}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SendRoundedIcon sx={{ color: "#1877f2" }} />
                      <Box>
                        <Typography variant="h6" fontWeight={900}>
                          Facebook oficial
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Publicação orgânica na Página GranConecta
                        </Typography>
                      </Box>
                    </Stack>

                    {facebookConfigurado && (
                      <Chip
                        size="small"
                        label={facebookConfigurado.status}
                        color={canalStatusColor(facebookConfigurado.status)}
                      />
                    )}
                  </Stack>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    Deixe a URL da imagem vazia para reutilizar automaticamente
                    a imagem do banner vinculado à campanha
                    {canaisDialog?.banner_id
                      ? ` (banner #${canaisDialog.banner_id}).`
                      : "."}
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="Texto da publicação"
                        value={facebookLegenda}
                        onChange={(event) =>
                          setFacebookLegenda(event.target.value)
                        }
                        helperText={`${facebookLegenda.length}/63206 caracteres`}
                        inputProps={{ maxLength: 63206 }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ sm: "center" }}
                      >
                        <Button component="label" variant="outlined">
                          Selecionar imagem exclusiva
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) =>
                              setFacebookArquivo(
                                event.target.files?.[0] || null,
                              )
                            }
                          />
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                          {facebookArquivo?.name ||
                            "Nenhuma imagem exclusiva selecionada"}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="URL pública da imagem (opcional)"
                        value={facebookImagemUrl}
                        onChange={(event) =>
                          setFacebookImagemUrl(event.target.value)
                        }
                        placeholder="https://api.granconecta.net.br/uploads/images/imagem.jpg"
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <Button
                          variant="outlined"
                          onClick={salvarCanalFacebook}
                          disabled={busy}
                        >
                          Salvar configuração
                        </Button>

                        <Button
                          variant="contained"
                          startIcon={<SendRoundedIcon />}
                          onClick={publicarFacebook}
                          disabled={busy || !facebookConfigurado}
                          sx={{ bgcolor: "#1877f2" }}
                        >
                          Publicar no Facebook
                        </Button>

                        {facebookConfigurado && (
                          <Button
                            color="error"
                            onClick={() => cancelarCanal("FACEBOOK_ORGANICO")}
                            disabled={busy}
                          >
                            Cancelar canal
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>

                  {facebookConfigurado?.external_id && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Publicação criada com o ID {facebookConfigurado.external_id}.
                      {Boolean(
                        facebookConfigurado.configuracao?.facebookPermalink,
                      ) && (
                        <Button
                          component="a"
                          href={String(
                            facebookConfigurado.configuracao
                              ?.facebookPermalink,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          Abrir publicação
                        </Button>
                      )}
                    </Alert>
                  )}

                  {facebookConfigurado?.ultimo_erro && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {facebookConfigurado.ultimo_erro}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "#d946ef",
                  background:
                    "linear-gradient(180deg, rgba(217,70,239,.05), rgba(255,255,255,1) 42%)",
                }}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1}
                    mb={2}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SendRoundedIcon sx={{ color: "#c026d3" }} />
                      <Box>
                        <Typography variant="h6" fontWeight={900}>
                          Instagram oficial
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Publicação orgânica em @granconectaoficial
                        </Typography>
                      </Box>
                    </Stack>

                    {instagramConfigurado && (
                      <Chip
                        size="small"
                        label={instagramConfigurado.status}
                        color={canalStatusColor(instagramConfigurado.status)}
                      />
                    )}
                  </Stack>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    Deixe a URL da imagem vazia para reutilizar automaticamente
                    a imagem do banner vinculado à campanha
                    {canaisDialog?.banner_id
                      ? ` (banner #${canaisDialog.banner_id}).`
                      : "."}
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="Legenda da publicação"
                        value={instagramLegenda}
                        onChange={(event) =>
                          setInstagramLegenda(event.target.value)
                        }
                        helperText={`${instagramLegenda.length}/2200 caracteres`}
                        inputProps={{ maxLength: 2200 }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ sm: "center" }}
                      >
                        <Button component="label" variant="outlined">
                          Selecionar imagem exclusiva
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) =>
                              setInstagramArquivo(
                                event.target.files?.[0] || null,
                              )
                            }
                          />
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                          {instagramArquivo?.name ||
                            "Nenhuma imagem exclusiva selecionada"}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="URL pública da imagem (opcional)"
                        value={instagramImagemUrl}
                        onChange={(event) =>
                          setInstagramImagemUrl(event.target.value)
                        }
                        placeholder="https://dev.api.granconecta.net.br/uploads/images/imagem.jpg"
                        helperText="Se for um upload local PNG ou WebP, o backend criará automaticamente uma cópia JPEG."
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <Button
                          variant="outlined"
                          onClick={salvarCanalInstagram}
                          disabled={busy}
                        >
                          Salvar configuração
                        </Button>

                        <Button
                          variant="contained"
                          startIcon={<SendRoundedIcon />}
                          onClick={publicarInstagram}
                          disabled={busy || !instagramConfigurado}
                          sx={{
                            background:
                              "linear-gradient(135deg, #7c3aed, #db2777, #f97316)",
                          }}
                        >
                          Publicar no Instagram
                        </Button>

                        {instagramConfigurado && (
                          <Button
                            color="error"
                            onClick={() => cancelarCanal("INSTAGRAM_ORGANICO")}
                            disabled={busy}
                          >
                            Cancelar canal
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>

                  {instagramConfigurado?.external_id && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Publicação criada com o ID{" "}
                      {instagramConfigurado.external_id}.
                      {Boolean(
                        instagramConfigurado.configuracao?.instagramPermalink,
                      ) && (
                        <Button
                          component="a"
                          href={String(
                            instagramConfigurado.configuracao
                              ?.instagramPermalink,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          Abrir publicação
                        </Button>
                      )}
                    </Alert>
                  )}

                  {instagramConfigurado?.ultimo_erro && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {instagramConfigurado.ultimo_erro}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={fecharCanais} disabled={busy}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Metric({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
      <Card
        sx={{
          height: "100%",
          borderRadius: 4,
          borderLeft: `5px solid ${color}`,
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" color={color}>
            {icon}
            <Typography variant="overline" fontWeight={900}>
              {title}
            </Typography>
          </Stack>
          <Typography variant="h5" fontWeight={900} mt={1}>
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}