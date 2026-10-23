// src/components/MoradorDashboard/MoradorDashboard.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent,
  TextField,
  Divider,
  useTheme,
  useMediaQuery,
  MenuItem,
  Avatar,
  Alert,
  Checkbox,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add as AddIcon,
  Autorenew,
  Home,
  Inbox,
  ShoppingBag,
  CalendarMonth,
  Schedule,
  CheckCircle,
  Close as CloseIcon,
  Info,
  ChatBubbleOutline,
  Image as ImageIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import toast from "react-hot-toast";
import { emitNaoVistosChanged } from "../../utils/naoVistosBus";
import BannerPropaganda from "../pages/home/BannerPropaganda";
import { PedidosList } from "../PedidosList/PedidosList";
import { ModalNovaSolicitacao } from "../ModalNovaSolicitacao/ModalNovaSolicitacao";
import { socket } from "../Checkout/socket";
import MuralPostDialog from "../Mural/MuralPostDialog";
import ClassificadoNovoDialog from "../Classificados/ClassificadoNovoDialog";

type PostCategoria =
  | "VAGA_GARAGEM"
  | "DESAPEGA"
  | "ANIMAIS"
  | "SERVICOS"
  | "OUTROS";

type PostVisibilidade = "CONDOMINIO" | "REDE" | "ALVO";

type CondominioOpcao = {
  id: string;
  nome: string;
  cidade?: string | null;
  uf?: string | null;
};

type MuralPost = {
  id: string;
  titulo?: string;
  descricao?: string;
  categoria?: PostCategoria | string;
  createdAt?: string;
  preco?: number | string;
  visualizado?: boolean;
  destaque?: boolean;
  midias?: any[];
};

function humanCategoria(c?: string) {
  const x = String(c || "").toUpperCase();

  if (x === "VAGA_GARAGEM") return "Vaga de Garagem";
  if (x === "DESAPEGA") return "Desapega";
  if (x === "ANIMAIS") return "Animais";
  if (x === "SERVICOS") return "Serviços";
  if (x === "OUTROS") return "Outros";

  return c || "Post";
}

export default function MoradorDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { user } = useAuth();
  const u = user as any;
  const ehVisitante = u?.tipo === "VISITANTE";

  const [tab, setTab] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [openNovaSolicitacao, setOpenNovaSolicitacao] = useState(false);

  const [openNovoPost, setOpenNovoPost] = useState(false);
  const [salvandoPost, setSalvandoPost] = useState(false);
  const [arquivosPost, setArquivosPost] = useState<File[]>([]);
  const [visibilidadePost, setVisibilidadePost] =
    useState<PostVisibilidade>("CONDOMINIO");
  const [condominiosPost, setCondominiosPost] = useState<CondominioOpcao[]>([]);
  const [condominiosSelecionadosPost, setCondominiosSelecionadosPost] =
    useState<string[]>([]);
  const [carregandoCondominiosPost, setCarregandoCondominiosPost] =
    useState(false);
  const [openNovoClassificado, setOpenNovoClassificado] = useState(false);

  const [novoPost, setNovoPost] = useState<{
    titulo: string;
    descricao: string;
    categoria: PostCategoria;
  }>({
    titulo: "",
    descricao: "",
    categoria: "OUTROS",
  });


  const [animalPost, setAnimalPost] = useState({
    tipo: "DOACAO",
    especie: "GATO",
    sexo: "NAO_INFORMADO",
    porte: "NAO_INFORMADO",
    vacinado: "",
    castrado: "",
  });

  const [desapegaPost, setDesapegaPost] = useState({
    condicao: "USADO",
    preco: "",
    e_doacao: true,
    categoria_item: "",
  });

  const [garagemPost, setGaragemPost] = useState({
    operacao: "OFERECO",
    tipo_vaga: "ALUGUEL",
    valor_mensal: "",
    bloco: "",
    vaga_codigo: "",
    observacoes: "",
  });

  const [solicitacaoSelecionada, setSolicitacaoSelecionada] =
    useState<any | null>(null);

  const [openDetalheProposta, setOpenDetalheProposta] = useState(false);
  const [busca, setBusca] = useState("");

  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [minhaAgenda, setMinhaAgenda] = useState<any[]>([]);

  const condominio_id = useMemo(() => {
    const v = u?.condominio_id ?? u?.condominio?.id ?? u?.condominio;
    return v && v !== "null" ? String(v) : "";
  }, [u]);

  const role = String(u?.role || u?.tipo || "MORADOR").toUpperCase();
  const ehPortaria = role === "PORTARIA";

  const podeVerMoradorTabs =
    !ehPortaria && (role !== "PRESTADOR" || !!condominio_id || ehVisitante);

  const solicitacoesAbertas = useMemo(() => {
    return solicitacoes.filter((s) => {
      const statusPai = String(s.statusReal || s.status || "").toUpperCase();

      const pagamentoPendente = s.candidaturas?.some((c: any) => {
        const candStatus = String(c.status || "").toUpperCase();

        const pagStatus = String(
          c.pagamento?.status || c.pagamento_status || ""
        ).toUpperCase();

        return (
          candStatus === "ACORDO_FECHADO" &&
          !["PAGO", "APPROVED", "PARCIALMENTE_PAGO"].includes(pagStatus)
        );
      });

      const temStatusAberto = [
        "BUSCANDO_PRESTADOR",
        "CANDIDATOS",
        "DIRECIONADO",
      ].includes(statusPai);

      const temPropostaAceitaPrestador = s.candidaturas?.some((c: any) =>
        ["ACEITO_PRESTADOR", "ACEITA"].includes(
          String(c.status || "").toUpperCase()
        )
      );

      return temStatusAberto || temPropostaAceitaPrestador || pagamentoPendente;
    });
  }, [solicitacoes]);

  const solicitacoesEmAndamento = useMemo(() => {
    return solicitacoes.filter((s) => {
      return s.candidaturas?.some((c: any) => {
        const candStatus = String(c.status || "").toUpperCase();

        const pagStatus = String(
          c.pagamento?.status || c.pagamento_status || ""
        ).toUpperCase();

        const pagamentoIniciado = [
          "PARCIALMENTE_PAGO",
          "PAGO",
          "APPROVED",
        ].includes(pagStatus);

        const candidaturaContratada = [
          "ACORDO_FECHADO",
          "CONTRATADO",
          "EM_ANDAMENTO",
          "EM_EXECUCAO",
          "PAGO",
        ].includes(candStatus);

        return pagamentoIniciado && candidaturaContratada;
      });
    });
  }, [solicitacoes]);

  const postsFiltrados = useMemo(() => {
    return posts.filter((p) => {
      const titulo = (p.titulo || "").toLowerCase();
      const descricao = (p.descricao || "").toLowerCase();
      const termoBusca = busca.toLowerCase();

      return titulo.includes(termoBusca) || descricao.includes(termoBusca);
    });
  }, [posts, busca]);

  const postsParaBanner = useMemo(
    () => posts.filter((p) => p.destaque),
    [posts]
  );

  const tabs = useMemo(() => {
    const t = [];

    if (podeVerMoradorTabs) {
      t.push({
        key: "MORADOR_ABERTOS",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Inbox fontSize="small" />
            <span>Abertos</span>
            <Chip size="small" label={solicitacoesAbertas.length} />
          </Stack>
        ),
      });

      t.push({
        key: "MORADOR_ANDAMENTO",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Autorenew fontSize="small" />
            <span>Em Andamento</span>
            <Chip size="small" label={solicitacoesEmAndamento.length} />
          </Stack>
        ),
      });

      t.push({
        key: "MORADOR_COMPRAS",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingBag fontSize="small" />
            <span>Compras</span>
          </Stack>
        ),
      });

      if (!ehVisitante) {
        t.push({
          key: "MURAL",
          label: (
            <Stack direction="row" spacing={1} alignItems="center">
              <Home fontSize="small" />
              <span>Mural</span>
            </Stack>
          ),
        });

        t.push({
          key: "CLASSIFICADOS",
          label: (
            <Stack direction="row" spacing={1} alignItems="center">
              <ShoppingBag fontSize="small" />
              <span>Classificados</span>
            </Stack>
          ),
        });
      }
    }

    return t;
  }, [
    podeVerMoradorTabs,
    ehVisitante,
    solicitacoesAbertas.length,
    solicitacoesEmAndamento.length,
  ]);

  const currentTabKey = useMemo(() => {
    if (!tabs || tabs.length === 0) return "MORADOR_ABERTOS";
    return tabs[tab]?.key || "MORADOR_ABERTOS";
  }, [tabs, tab]);

  const carregarServicos = useCallback(async () => {
    if (!podeVerMoradorTabs) return;

    try {
      const { data } = await api.get(
        "/servicos/solicitacoes/minhas-solicitacoes"
      );

      if (data && Array.isArray(data.items)) {
        setSolicitacoes(data.items);
      } else if (Array.isArray(data)) {
        setSolicitacoes(data);
      } else {
        setSolicitacoes([]);
      }
    } catch (err: any) {
      console.error(
        "Erro isolado ao carregar Serviços do morador:",
        err.response?.data || err.message
      );

      setSolicitacoes([]);
    }
  }, [podeVerMoradorTabs]);

  const carregarMinhaAgenda = useCallback(async () => {
    if (!podeVerMoradorTabs) return;

    try {
      const { data } = await api.get("/servicos/agenda/meus");

      if (data && Array.isArray(data.items)) {
        setMinhaAgenda(data.items);
      } else if (Array.isArray(data)) {
        setMinhaAgenda(data);
      } else {
        setMinhaAgenda([]);
      }
    } catch (err: any) {
      console.error(
        "Erro isolado ao carregar Agenda do morador:",
        err.response?.data || err.message
      );

      setMinhaAgenda([]);
    }
  }, [podeVerMoradorTabs]);

  const carregarMural = useCallback(async () => {
    if (!condominio_id || ehVisitante) return;

    try {
      const { data } = await api.get(`/condominios/${condominio_id}/posts`);

      if (data && Array.isArray(data.items)) {
        setPosts(data.items);
      } else if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]);
      }
    } catch (err: any) {
      console.error(
        "Erro isolado ao carregar Mural do condomínio:",
        err.response?.data || err.message
      );

      setPosts([]);
    }
  }, [condominio_id, ehVisitante]);

  const handleSelecionarImagensPost = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    const imagensValidas = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imagensValidas.length !== files.length) {
      toast.error("Selecione apenas arquivos de imagem.");
    }

    setArquivosPost(imagensValidas);
  };

  const handleRemoverImagemPost = (index: number) => {
    setArquivosPost((prev) => prev.filter((_, i) => i !== index));
  };

  const carregarCondominiosPost = async () => {
    if (condominiosPost.length > 0) return;

    try {
      setCarregandoCondominiosPost(true);

      const response = await api.get("/condominio");
      const lista = Array.isArray(response.data) ? response.data : [];

      const normalizados: CondominioOpcao[] = lista
        .map((item: any) => ({
          id: String(item?.id || "").trim(),
          nome: String(item?.nome || "").trim(),
          cidade: item?.cidade ? String(item.cidade) : null,
          uf: item?.uf ? String(item.uf) : null,
        }))
        .filter(
          (item: CondominioOpcao) => Boolean(item.id) && Boolean(item.nome)
        );

      setCondominiosPost(normalizados);
    } catch (error) {
      console.error("[MURAL] Erro ao carregar condomínios:", error);
      toast.error("Não foi possível carregar os condomínios.");
    } finally {
      setCarregandoCondominiosPost(false);
    }
  };

  const handleCriarPost = async () => {
    const titulo = novoPost.titulo.trim();
    const descricao = novoPost.descricao.trim();

    if (!titulo) {
      toast.error("Digite um título para o recado.");
      return;
    }

    if (!descricao) {
      toast.error("Digite a descrição do recado.");
      return;
    }

    if (!condominio_id) {
      toast.error("Condomínio não identificado.");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não identificado.");
      return;
    }

    if (
      visibilidadePost === "ALVO" &&
      condominiosSelecionadosPost.length === 0
    ) {
      toast.error("Selecione pelo menos um condomínio.");
      return;
    }

    setSalvandoPost(true);

    try {
      const formData = new FormData();

      formData.append("titulo", titulo);
      formData.append("descricao", descricao);
      formData.append("categoria", novoPost.categoria);
      formData.append("condominio_id", condominio_id);
      formData.append("status", "ATIVO");
      formData.append("destaque", "false");
      formData.append("visibilidade", visibilidadePost);

      if (visibilidadePost === "ALVO") {
        formData.append(
          "targetCondominioIds",
          JSON.stringify(condominiosSelecionadosPost)
        );
      }

      if (novoPost.categoria === "ANIMAIS") {
        formData.append("animal_tipo", animalPost.tipo);
        formData.append("animal_especie", animalPost.especie);
        formData.append("animal_sexo", animalPost.sexo);
        formData.append("animal_porte", animalPost.porte);

        if (animalPost.vacinado !== "") {
          formData.append("animal_vacinado", animalPost.vacinado);
        }

        if (animalPost.castrado !== "") {
          formData.append("animal_castrado", animalPost.castrado);
        }
      }

      if (novoPost.categoria === "DESAPEGA") {
        formData.append("desapega_condicao", desapegaPost.condicao);
        formData.append("desapega_e_doacao", String(desapegaPost.e_doacao));

        if (desapegaPost.categoria_item.trim()) {
          formData.append("desapega_categoria_item", desapegaPost.categoria_item.trim());
        }

        if (!desapegaPost.e_doacao && desapegaPost.preco) {
          formData.append("desapega_preco", desapegaPost.preco);
        }
      }

      if (novoPost.categoria === "VAGA_GARAGEM") {
        formData.append("garagem_operacao", garagemPost.operacao);
        formData.append("garagem_tipo_vaga", garagemPost.tipo_vaga);

        if (garagemPost.valor_mensal) {
          formData.append("garagem_valor_mensal", garagemPost.valor_mensal);
        }

        if (garagemPost.bloco.trim()) {
          formData.append("garagem_bloco", garagemPost.bloco.trim());
        }

        if (garagemPost.vaga_codigo.trim()) {
          formData.append("garagem_vaga_codigo", garagemPost.vaga_codigo.trim());
        }

        if (garagemPost.observacoes.trim()) {
          formData.append("garagem_observacoes", garagemPost.observacoes.trim());
        }
      }

      arquivosPost.forEach((file) => {
        formData.append("files", file);
      });

      await api.post("/posts", formData);

      toast.success("Recado publicado no mural!");

      setNovoPost({
        titulo: "",
        descricao: "",
        categoria: "OUTROS",
      });

      setAnimalPost({
        tipo: "DOACAO",
        especie: "GATO",
        sexo: "NAO_INFORMADO",
        porte: "NAO_INFORMADO",
        vacinado: "",
        castrado: "",
      });

      setDesapegaPost({
        condicao: "USADO",
        preco: "",
        e_doacao: true,
        categoria_item: "",
      });

      setGaragemPost({
        operacao: "OFERECO",
        tipo_vaga: "ALUGUEL",
        valor_mensal: "",
        bloco: "",
        vaga_codigo: "",
        observacoes: "",
      });

      setVisibilidadePost("CONDOMINIO");
      setCondominiosSelecionadosPost([]);
      setArquivosPost([]);
      setOpenNovoPost(false);
      await carregarMural();
      emitNaoVistosChanged();
    } catch (err: any) {
      console.error("Erro ao criar post no mural:", err.response?.data || err);

      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erro ao publicar recado.";

      toast.error(msg);
    } finally {
      setSalvandoPost(false);
    }
  };

  useEffect(() => {
    const inicializarDashboard = async () => {
      try {
        await carregarServicos();
      } catch (e) {
        console.error("Erro controlado ao carregar serviços:", e);
      }

      try {
        await carregarMinhaAgenda();
      } catch (e) {
        console.error("Erro controlado ao carregar agenda:", e);
      }

      try {
        if (condominio_id && !ehVisitante) {
          await carregarMural();
        }
      } catch (e) {
        console.error("Erro controlado ao carregar mural:", e);
      }
    };

    if (user) {
      inicializarDashboard();
    }
  }, [
    user,
    carregarServicos,
    carregarMinhaAgenda,
    carregarMural,
    condominio_id,
    ehVisitante,
  ]);

  useEffect(() => {
    if (openDetalheProposta) {
      carregarMinhaAgenda();
    }
  }, [openDetalheProposta, carregarMinhaAgenda]);

  const abrirDetalhePost = (p: MuralPost) => {
    setSelectedPostId(p.id);

    if (!p.visualizado) {
      setPosts((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, visualizado: true } : item
        )
      );

      emitNaoVistosChanged();
    }
  };

  const handleEnviarContraproposta = async (
    candidaturaId: string,
    valor: number,
    message: string
  ) => {
    try {
      await api.post(
        `/servicos/candidato/candidaturas/${candidaturaId}/responder`,
        {
          novoValor: valor,
          mensagem: message,
        }
      );

      toast.success("Contraproposta enviada!");
      setOpenDetalheProposta(false);
      carregarServicos();
      emitNaoVistosChanged();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar proposta.");
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    socket.emit("join_user_room", user.id);

    socket.on("status_changed", (data) => {
      toast.success(data.message, {
        icon: "🛵",
        duration: 6000,
      });

      carregarServicos();
      carregarMinhaAgenda();
    });

    return () => {
      socket.off("status_changed");
    };
  }, [user?.id, carregarServicos, carregarMinhaAgenda]);

  useEffect(() => {
    if (!solicitacoes?.length) return;

    let encontrouPagamentoPendente = false;

    for (const sol of solicitacoes) {
      const candidaturaPendente = sol.candidaturas?.find((cand: any) => {
        const candStatus = String(cand.status || "").toUpperCase();

        const pagamentoStatus = String(
          cand.pagamento?.status || cand.pagamento_status || ""
        ).toUpperCase();

        return (
          candStatus === "ACORDO_FECHADO" &&
          ![
            "PAGO",
            "APPROVED",
            "PARCIALMENTE_PAGO",
          ].includes(pagamentoStatus)
        );
      });

      if (candidaturaPendente) {
        encontrouPagamentoPendente = true;

        const redirectKey = `redirect_pagamento_${candidaturaPendente.id}`;
        const jaRedirecionou = localStorage.getItem(redirectKey);

        if (jaRedirecionou === "true") {
          continue;
        }

        localStorage.setItem(redirectKey, "true");

        const paymentLink =
          candidaturaPendente.pagamento?.link_pagamento ||
          candidaturaPendente.link_pagamento;

        toast.loading("Você possui um pagamento pendente...", {
          id: "redirect-payment",
        });

        if (paymentLink) {
          setTimeout(() => {
            window.location.href = paymentLink;
          }, 1500);

          return;
        }

        const ofertaIdPagamento =
          candidaturaPendente.ofertaId ||
          candidaturaPendente.oferta?.id ||
          candidaturaPendente.pagamento?.ofertaId;

        if (ofertaIdPagamento) {
          handleRecuperarPagamento(String(ofertaIdPagamento));
        } else {
          console.error("[PAGAMENTO MORADOR] Oferta não encontrada na candidatura", {
            candidaturaId: candidaturaPendente.id,
            candidatura: candidaturaPendente,
          });
          toast.dismiss("redirect-payment");
          toast.error("Não foi possível identificar a oferta para o pagamento.");
        }

        return;
      }
    }

    if (!encontrouPagamentoPendente) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("redirect_pagamento_")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [solicitacoes]);

  const handleEnviarApenasMensagem = async (
    candidaturaId: string,
    msgLocal: string
  ) => {
    if (!msgLocal) return;

    try {
      const valorFixo = solicitacaoSelecionada.candidaturas.find(
        (c: any) => c.id === candidaturaId
      ).valor_proposto;

      await api.post(
        `/servicos/candidato/candidaturas/${candidaturaId}/responder`,
        {
          novoValor: Number(valorFixo),
          mensagem: msgLocal,
        }
      );

      toast.success("Mensagem enviada!");
      carregarServicos();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar mensagem.");
    }
  };

  const handleRecuperarPagamento = async (ofertaId: string) => {
    const idToast = toast.loading("Recuperando link de pagamento...");

    try {
      const { data } = await api.post("/pagamentos", {
        ofertaId,
      });

      const paymentLink =
        data?.link_pagamento ||
        data?.payment?.link_pagamento ||
        data?.checkoutUrl ||
        data?.payment?.checkoutUrl ||
        (typeof data === "string" ? data : null);

      if (paymentLink) {
        toast.dismiss(idToast);
        window.location.href = paymentLink;
        return;
      }

      toast.error("Link de pagamento não encontrado na resposta.");
    } catch (err) {
      toast.dismiss(idToast);
      console.error(err);
      toast.error("Erro ao recuperar pagamento.");
    }
  };

  const handleAceitarProposta = async (candidaturaId: string) => {
    const idToast = toast.loading("Fechando acordo e iniciando checkout...");

    try {
      const responseAceite = await api.post(
        "/servicos/candidato/candidaturas/aceitar",
        {
          candidaturaId,
        }
      );

      const ofertaId = responseAceite.data?.ofertaId;

      if (!ofertaId) {
        throw new Error("Oferta não retornada pelo servidor.");
      }

      const responsePagamento = await api.post("/pagamentos", {
        ofertaId,
      });

      toast.dismiss(idToast);

      const paymentLink =
        responsePagamento.data?.payment?.link_pagamento ||
        responsePagamento.data?.link_pagamento ||
        responsePagamento.data?.checkoutUrl;

      if (paymentLink) {
        localStorage.setItem(`redirect_pagamento_${ofertaId}`, "true");

        toast.success("Redirecionando para pagamento...");

        setTimeout(() => {
          window.location.href = paymentLink;
        }, 1000);

        return;
      }

      console.error("Resposta sem link:", responsePagamento.data);

      toast.error("Link de pagamento não gerado.");

      carregarServicos();
    } catch (err: any) {
      toast.dismiss(idToast);

      console.error(err);

      const erroMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;

      toast.error(`Falha: ${erroMsg}`);

      carregarServicos();
    }
  };

  const handleCheckinPresenca = async (agendaId: string) => {
    try {
      await api.post(`/agenda/${agendaId}/checkin-cliente`);

      toast.success(
        "Presença confirmada! O profissional foi autorizado a iniciar."
      );

      carregarMinhaAgenda();
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível realizar o check-in.");
    }
  };

  const handleConfirmarHorario = async (agendaId: string) => {
    const idToast = toast.loading("Confirmando horário...");

    try {
      await api.post(`/agenda/${agendaId}/confirmar-horario`);

      toast.dismiss(idToast);
      toast.success("Horário confirmado com o profissional!");

      await carregarMinhaAgenda();
    } catch (err: any) {
      toast.dismiss(idToast);

      console.error(
        "[AGENDA] Erro ao confirmar horário:",
        err.response?.data || err
      );

      const mensagem =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Não foi possível confirmar o horário.";

      toast.error(mensagem);
    }
  };

  const handleProporNovoHorario = async (
    agendaId: string,
    data: string,
    hora: string
  ) => {
    const idToast = toast.loading("Enviando nova sugestão...");

    try {
      await api.post(`/agenda/${agendaId}/propor-horario`, {
        data,
        hora,
      });

      toast.dismiss(idToast);

      toast.success(
        "Novo horário enviado ao profissional para confirmação."
      );

      await carregarMinhaAgenda();
    } catch (err: any) {
      toast.dismiss(idToast);

      console.error(
        "[AGENDA] Erro ao propor horário:",
        err.response?.data || err
      );

      const resposta = err.response?.data;

      if (
        err.response?.status === 409 &&
        resposta?.alternativas?.length
      ) {
        toast.error(
          "Esse horário não está disponível. Escolha outro horário."
        );

        return;
      }

      const mensagem =
        resposta?.error ||
        resposta?.message ||
        "Não foi possível propor o novo horário.";

      toast.error(mensagem);
    }
  };

  const handleRecusarHorario = async (agendaId: string) => {
    const confirmar = window.confirm(
      "Deseja recusar este horário? O profissional precisará sugerir uma nova visita."
    );

    if (!confirmar) return;

    const idToast = toast.loading("Recusando horário...");

    try {
      await api.post(`/agenda/${agendaId}/recusar-horario`);

      toast.dismiss(idToast);

      toast.success(
        "Horário recusado. O profissional poderá sugerir uma nova data."
      );

      await carregarMinhaAgenda();
    } catch (err: any) {
      toast.dismiss(idToast);

      console.error(
        "[AGENDA] Erro ao recusar horário:",
        err.response?.data || err
      );

      const mensagem =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Não foi possível recusar o horário.";

      toast.error(mensagem);
    }
  };

  const handleSolicitarDistrato = async (ofertaId: string) => {
    if (
      !window.confirm(
        "Deseja mesmo interromper o pacote? As sessões restantes serão reembolsadas proporcionalmente."
      )
    ) {
      return;
    }

    try {
      await api.post(`/agenda/contrato/${ofertaId}/distrato`);

      toast.success(
        "Contrato rescindido. Verifique o reembolso na sua carteira."
      );

      setOpenDetalheProposta(false);
      carregarServicos();
      carregarMinhaAgenda();
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar o distrato.");
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: isMobile ? 1.5 : 3,
        px: isMobile ? 1 : 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #eaeaea",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 2,
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="800">
            Dashboard do Morador
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Olá, {user?.name}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth={isMobile}
          onClick={() => setOpenNovaSolicitacao(true)}
        >
          Novo Pedido
        </Button>
      </Paper>

      {!ehVisitante && postsParaBanner.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <BannerPropaganda
            posts={postsParaBanner}
            onOpenPost={(id) => setSelectedPostId(id)}
          />
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid #eaeaea",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((t, i) => (
            <Tab key={i} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={2}>
        {currentTabKey === "CLASSIFICADOS" && (
          <Grid size={12}>
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? 2 : 3,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                background:
                  "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              }}
            >
              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={2}
                alignItems={isMobile ? "stretch" : "center"}
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    fontWeight={900}
                  >
                    Classificados
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      maxWidth: 650,
                    }}
                  >
                    Venda produtos que você não utiliza mais para outros
                    moradores da comunidade GranConecta.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenNovoClassificado(true)}
                  fullWidth={isMobile}
                  sx={{
                    whiteSpace: "nowrap",
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  Novo anúncio
                </Button>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: isMobile ? 3 : 5,
                textAlign: "center",
                borderRadius: 3,
                border: "1px dashed #cbd5e1",
                bgcolor: "#f8fafc",
              }}
            >
              <ShoppingBag
                sx={{
                  fontSize: 52,
                  color: "text.secondary",
                  opacity: 0.45,
                  mb: 1,
                }}
              />

              <Typography
                variant="h6"
                fontWeight={900}
              >
                Seus anúncios aparecerão aqui
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  mb: 2,
                }}
              >
                Crie seu primeiro classificado para testar o novo fluxo.
              </Typography>

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setOpenNovoClassificado(true)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 800,
                  textTransform: "none",
                }}
              >
                Criar anúncio
              </Button>
            </Paper>
          </Grid>
        )}
        {currentTabKey === "MURAL" && (
          <Grid size={12}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
              }}
            >
              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={2}
                alignItems={isMobile ? "stretch" : "center"}
              >
                <TextField
                  fullWidth
                  placeholder="Buscar no mural..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenNovoPost(true)}
                  fullWidth={isMobile}
                  sx={{
                    whiteSpace: "nowrap",
                    borderRadius: 2,
                    fontWeight: 800,
                  }}
                >
                  Novo Recado
                </Button>
              </Stack>
            </Paper>

            <Grid container spacing={2}>
              {postsFiltrados.length > 0 ? (
                postsFiltrados.map((p) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                    <Card
                      onClick={() => abrirDetalhePost(p)}
                      sx={{
                        borderRadius: 3,
                        cursor: "pointer",
                        border: p.visualizado
                          ? "1px solid #e2e8f0"
                          : "2px solid #1976d2",
                        transition: "0.2s",
                        "&:hover": {
                          boxShadow: 3,
                          transform: "translateY(-2px)",
                        },
                      }}
                      elevation={0}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Chip
                            size="small"
                            label={humanCategoria(p.categoria)}
                            color="primary"
                          />

                          {!p.visualizado && (
                            <Chip
                              size="small"
                              label="Novo"
                              color="warning"
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                        </Stack>

                        <Typography fontWeight={800}>
                          {p.titulo || "Sem título"}
                        </Typography>

                        <Typography
                          variant="body2"
                          noWrap
                          color="text.secondary"
                        >
                          {p.descricao}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid size={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: "center",
                      borderRadius: 3,
                      border: "1px dashed #cbd5e1",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <Typography fontWeight={800}>
                      Nenhum recado encontrado.
                    </Typography>

                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{ mt: 2, borderRadius: 2 }}
                      onClick={() => setOpenNovoPost(true)}
                    >
                      Criar Recado
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>
        )}

        {currentTabKey === "MORADOR_ABERTOS" &&
          (solicitacoesAbertas.length > 0 ? (
            solicitacoesAbertas.map((sol) => {
              const candidaturaPendente = sol.candidaturas?.find((c: any) => {
                const status = String(c.status || "").toUpperCase();

                const pagStatus = String(
                  c.pagamento?.status || c.pagamento_status || ""
                ).toUpperCase();

                return (
                  status === "ACORDO_FECHADO" &&
                  ![
                    "PAGO",
                    "APPROVED",
                    "PARCIALMENTE_PAGO",
                  ].includes(pagStatus)
                );
              });

              const handleCardClick = () => {
                if (candidaturaPendente) {
                  const paymentLink =
                    candidaturaPendente.pagamento?.link_pagamento ||
                    candidaturaPendente.link_pagamento;

                  if (paymentLink) {
                    window.location.href = paymentLink;
                  } else {
                    const ofertaIdPagamento =
                      candidaturaPendente.ofertaId ||
                      candidaturaPendente.oferta?.id ||
                      candidaturaPendente.pagamento?.ofertaId;

                    if (ofertaIdPagamento) {
                      handleRecuperarPagamento(String(ofertaIdPagamento));
                    } else {
                      console.error("[PAGAMENTO MORADOR] Oferta não encontrada no card", {
                        candidaturaId: candidaturaPendente.id,
                        candidatura: candidaturaPendente,
                      });
                      toast.error("Não foi possível identificar a oferta para o pagamento.");
                    }
                  }
                } else {
                  setSolicitacaoSelecionada(sol);
                  setOpenDetalheProposta(true);
                }
              };

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sol.id}>
                  <Card
                    onClick={handleCardClick}
                    sx={{
                      borderRadius: 3,
                      cursor: "pointer",
                      border: candidaturaPendente
                        ? "2px solid #ed6c02"
                        : sol.candidaturas?.length > 0
                          ? "2px solid #1976d2"
                          : "1px solid #e2e8f0",
                      transition: "0.3s",
                      "&:hover": {
                        boxShadow: 3,
                      },
                    }}
                    elevation={0}
                  >
                    <CardContent>
                      {candidaturaPendente && (
                        <Chip
                          label="PENDENTE DE PAGAMENTO"
                          color="warning"
                          size="small"
                          sx={{
                            mb: 1,
                            fontWeight: "bold",
                          }}
                        />
                      )}

                      <Typography fontWeight={800} variant="subtitle1">
                        {sol.titulo}
                      </Typography>

                      {!candidaturaPendente &&
                        sol.candidaturas?.length > 0 && (
                          <Chip
                            size="small"
                            label={`${sol.candidaturas.length} proposta(s) recebida(s)`}
                            color="primary"
                            sx={{
                              mt: 1,
                              fontWeight: "bold",
                            }}
                          />
                        )}

                      <Button
                        fullWidth
                        sx={{
                          mt: 2,
                          py: 1,
                          borderRadius: 2,
                        }}
                        variant="contained"
                        color={candidaturaPendente ? "warning" : "primary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick();
                        }}
                      >
                        {candidaturaPendente
                          ? "Realizar Pagamento"
                          : "Analisar Propostas"}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Typography
              sx={{
                width: "100%",
                textAlign: "center",
                py: 5,
                color: "text.secondary",
              }}
            >
              Nenhum pedido aberto.
            </Typography>
          ))}

        {currentTabKey === "MORADOR_ANDAMENTO" &&
          (solicitacoesEmAndamento.length > 0 ? (
            solicitacoesEmAndamento.map((sol) => {
              const candidaturaPaga = sol.candidaturas?.find((c: any) =>
                ["PARCIALMENTE_PAGO", "PAGO", "APPROVED"].includes(
                  String(
                    c.pagamento?.status || c.pagamento_status || ""
                  ).toUpperCase()
                )
              );

              const pagamento = candidaturaPaga?.pagamento;

              const transacoes = Array.isArray(pagamento?.transacoes)
                ? pagamento.transacoes
                : [];

              const entrada = transacoes.find(
                (t: any) =>
                  String(t.tipo || "").toUpperCase() === "ENTRADA"
              );

              const saldo = transacoes.find(
                (t: any) =>
                  String(t.tipo || "").toUpperCase() === "SALDO"
              );

              const entradaPaga =
                entrada &&
                ["PAGO", "PAGO_EXTERNAMENTE"].includes(
                  String(entrada.status || "").toUpperCase()
                );

              const pagamentoParcial =
                String(pagamento?.status || "").toUpperCase() ===
                "PARCIALMENTE_PAGO";
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sol.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: "1px solid #4caf50",
                      bgcolor: "#f0fdf4",
                    }}
                    elevation={0}
                  >
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography fontWeight={800} variant="subtitle1">
                          {sol.titulo}
                        </Typography>

                        <Chip
                          label="EM ANDAMENTO"
                          size="small"
                          color="success"
                          sx={{
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        />
                      </Stack>

                      {pagamentoParcial && entradaPaga ? (
                        <Box sx={{ mt: 1, mb: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <CheckCircle sx={{ fontSize: 18, color: "success.main" }} />
                            <Typography variant="body2" fontWeight={800} color="success.main">
                              Entrada paga: R${" "}
                              {Number(entrada?.valor || 0).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Stack>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", ml: 3.25, mb: 1.5 }}
                          >
                            Pagamento inicial confirmado
                          </Typography>

                          {saldo && (
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: "#ffffff",
                                border: "1px solid #dbeafe",
                              }}
                            >
                              <Typography variant="body2" fontWeight={800}>
                                Saldo restante: R${" "}
                                {Number(saldo.valor || 0).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5, lineHeight: 1.4 }}
                              >
                                O restante será pago somente após a conclusão do serviço.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2, mt: 0.5 }}
                        >
                          Valor pago: R${" "}
                          {Number(
                            pagamento?.valor ||
                            candidaturaPaga?.valor_proposto ||
                            sol.valor_final ||
                            0
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      )}

                      <Button
                        fullWidth
                        variant="outlined"
                        color="success"
                        sx={{
                          py: 1,
                          borderRadius: 2,
                        }}
                        onClick={() => {
                          setSolicitacaoSelecionada(sol);
                          setOpenDetalheProposta(true);
                        }}
                      >
                        Ver Cronograma / Atas
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Typography
              sx={{
                width: "100%",
                textAlign: "center",
                py: 5,
                color: "text.secondary",
              }}
            >
              Nenhum serviço em andamento.
            </Typography>
          ))}

        {currentTabKey === "MORADOR_COMPRAS" && (
          <Grid size={12}>
            <PedidosList />
          </Grid>
        )}
      </Grid>

      <Dialog
        open={openDetalheProposta}
        onClose={() => setOpenDetalheProposta(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f8fafc",
            p: 2,
          }}
        >
          <Box sx={{ maxWidth: "80%" }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              fontWeight="900"
              sx={{ lineHeight: 1.2 }}
            >
              {solicitacaoSelecionada?.candidaturas?.length > 0
                ? `Você recebeu ${solicitacaoSelecionada.candidaturas.length} proposta${solicitacaoSelecionada.candidaturas.length > 1 ? "s" : ""}`
                : "Acompanhamento & Negociação"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              {solicitacaoSelecionada?.titulo}
              {solicitacaoSelecionada?.candidaturas?.length > 0
                ? " • Compare valores e condições antes de escolher."
                : ""}
            </Typography>
          </Box>

          <IconButton onClick={() => setOpenDetalheProposta(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            bgcolor: "#f1f5f9",
            p: isMobile ? 1.5 : 3,
          }}
        >
          <Box sx={{ mt: 1 }}>
            {solicitacaoSelecionada?.candidaturas &&
              solicitacaoSelecionada.candidaturas.length > 0 ? (
              solicitacaoSelecionada.candidaturas.map((cand: any) => {
                const candStatusStr = String(cand.status || "").toUpperCase();

                const isAcordoFechado = [
                  "ACORDO_FECHADO",
                  "PAGO",
                  "EM_EXECUCAO",
                  "CONTRATADO",
                  "EM_ANDAMENTO",
                ].includes(candStatusStr);

                const idOffer =
                  cand.ofertaId ||
                  cand.oferta?.id ||
                  cand.pagamento?.ofertaId ||
                  null;

                const sessoesFiltradas = minhaAgenda.filter((item) => {
                  const idAgendaOferta = String(
                    item.ofertaId || item.oferta_id || ""
                  );

                  const idContratoOferta = String(idOffer || "");

                  return (
                    !!idContratoOferta &&
                    idAgendaOferta === idContratoOferta
                  );
                });

                return (
                  <Box key={cand.id} sx={{ mb: 2 }}>
                    <ItemNegociacao
                      cand={cand}
                      agenda={sessoesFiltradas}
                      isMobile={isMobile}
                      onAceitar={handleAceitarProposta}
                      onResponder={handleEnviarContraproposta}
                      onEnviarMensagem={handleEnviarApenasMensagem}
                      onRecuperarPagamento={() => {
                        if (idOffer) {
                          handleRecuperarPagamento(String(idOffer));
                        } else {
                          toast.error("Oferta de pagamento não identificada.");
                        }
                      }}
                    />

                    {isAcordoFechado && (
                      <Paper
                        sx={{
                          p: isMobile ? 1.5 : 2.5,
                          mt: -1,
                          mb: 1,
                          borderRadius: "0px 0px 12px 12px",
                          border: "1px solid #e2e8f0",
                          bgcolor: "#ffffff",
                        }}
                        elevation={0}
                      >
                        <AgendaServico
                          agenda={sessoesFiltradas}
                          onConfirmarCheckin={handleCheckinPresenca}
                          onConfirmarHorario={handleConfirmarHorario}
                          onProporNovoHorario={handleProporNovoHorario}
                          onRecusarHorario={handleRecusarHorario}
                        />

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" justifyContent="flex-end">
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => {
                              if (idOffer) {
                                handleSolicitarDistrato(String(idOffer));
                              } else {
                                toast.error("Oferta do contrato não identificada.");
                              }
                            }}
                            sx={{
                              fontWeight: "bold",
                              fontSize: "11px",
                            }}
                          >
                            Interromper Pacote (Desistir do Restante)
                          </Button>
                        </Stack>
                      </Paper>
                    )}
                  </Box>
                );
              })
            ) : (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 3,
                }}
              >
                <Typography color="text.secondary">
                  Aguardando propostas de profissionais...
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openNovaSolicitacao}
        onClose={() => setOpenNovaSolicitacao(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Nova Solicitação

          <IconButton onClick={() => setOpenNovaSolicitacao(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: isMobile ? 1.5 : 3 }}>
          <ModalNovaSolicitacao
            open={openNovaSolicitacao}
            onClose={() => setOpenNovaSolicitacao(false)}
            usuarioId={user?.id}
            condominio_id={condominio_id}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openNovoPost}
        onClose={() => {
          if (!salvandoPost) setOpenNovoPost(false);
        }}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 800,
          }}
        >
          Novo Recado no Mural

          <IconButton
            onClick={() => setOpenNovoPost(false)}
            disabled={salvandoPost}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              fullWidth
              value={novoPost.titulo}
              onChange={(e) =>
                setNovoPost((prev) => ({
                  ...prev,
                  titulo: e.target.value,
                }))
              }
            />

            <TextField
              label="Categoria"
              select
              fullWidth
              value={novoPost.categoria}
              onChange={(e) =>
                setNovoPost((prev) => ({
                  ...prev,
                  categoria: e.target.value as PostCategoria,
                }))
              }
            >
              <MenuItem value="OUTROS">Outros</MenuItem>
              <MenuItem value="VAGA_GARAGEM">Vaga de Garagem</MenuItem>
              <MenuItem value="DESAPEGA">Desapega</MenuItem>
              <MenuItem value="ANIMAIS">Animais</MenuItem>
              <MenuItem value="SERVICOS">Serviços</MenuItem>
            </TextField>

            <TextField
              label="Descrição"
              multiline
              rows={5}
              fullWidth
              value={novoPost.descricao}
              onChange={(e) =>
                setNovoPost((prev) => ({
                  ...prev,
                  descricao: e.target.value,
                }))
              }
            />

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                Quem poderá ver este recado?
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                Escolha onde o recado será distribuído.
              </Typography>

              <TextField
                select
                fullWidth
                label="Distribuição"
                value={visibilidadePost}
                onChange={(e) => {
                  const valor = e.target.value as PostVisibilidade;
                  setVisibilidadePost(valor);

                  if (valor === "ALVO") {
                    void carregarCondominiosPost();
                  } else {
                    setCondominiosSelecionadosPost([]);
                  }
                }}
              >
                <MenuItem value="CONDOMINIO">Meu condomínio</MenuItem>
                <MenuItem value="ALVO">Condomínios selecionados</MenuItem>
                <MenuItem value="REDE">Toda a rede GranConecta</MenuItem>
              </TextField>

              {visibilidadePost === "CONDOMINIO" && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Somente moradores do seu condomínio poderão visualizar este
                  recado.
                </Typography>
              )}

              {visibilidadePost === "ALVO" && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    select
                    fullWidth
                    label="Selecione os condomínios"
                    value={condominiosSelecionadosPost}
                    disabled={carregandoCondominiosPost}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) => {
                        const ids = selected as string[];

                        if (ids.length === 0) return "Selecione...";

                        return condominiosPost
                          .filter((condominio) => ids.includes(condominio.id))
                          .map((condominio) => condominio.nome)
                          .join(", ");
                      },
                    }}
                    onChange={(e) => {
                      const value = e.target.value;

                      setCondominiosSelecionadosPost(
                        typeof value === "string"
                          ? value.split(",")
                          : (value as string[])
                      );
                    }}
                  >
                    {condominiosPost.map((condominio) => {
                      const selecionado =
                        condominiosSelecionadosPost.includes(condominio.id);

                      return (
                        <MenuItem key={condominio.id} value={condominio.id}>
                          <Checkbox checked={selecionado} size="small" />
                          <ListItemText
                            primary={condominio.nome}
                            secondary={
                              condominio.cidade
                                ? `${condominio.cidade}${
                                    condominio.uf ? ` - ${condominio.uf}` : ""
                                  }`
                                : undefined
                            }
                          />
                        </MenuItem>
                      );
                    })}
                  </TextField>

                  {carregandoCondominiosPost && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      Carregando condomínios...
                    </Typography>
                  )}

                  {!carregandoCondominiosPost &&
                    condominiosPost.length === 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Nenhum condomínio disponível.
                      </Alert>
                    )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    O recado será exibido somente para moradores dos condomínios
                    selecionados.
                  </Typography>
                </Box>
              )}

              {visibilidadePost === "REDE" && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  Este recado poderá ser visto por moradores de todos os
                  condomínios cadastrados no GranConecta.
                </Alert>
              )}
            </Paper>

            {novoPost.categoria === "ANIMAIS" && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  Dados do animal
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Tipo"
                    select
                    fullWidth
                    value={animalPost.tipo}
                    onChange={(e) =>
                      setAnimalPost((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="DOACAO">Doação</MenuItem>
                    <MenuItem value="ACHADO">Achado</MenuItem>
                    <MenuItem value="PERDIDO">Perdido</MenuItem>
                  </TextField>

                  <TextField
                    label="Espécie"
                    select
                    fullWidth
                    value={animalPost.especie}
                    onChange={(e) =>
                      setAnimalPost((prev) => ({
                        ...prev,
                        especie: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="CAO">Cão</MenuItem>
                    <MenuItem value="GATO">Gato</MenuItem>
                    <MenuItem value="OUTRO">Outro</MenuItem>
                  </TextField>

                  <TextField
                    label="Sexo"
                    select
                    fullWidth
                    value={animalPost.sexo}
                    onChange={(e) =>
                      setAnimalPost((prev) => ({
                        ...prev,
                        sexo: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="M">Macho</MenuItem>
                    <MenuItem value="F">Fêmea</MenuItem>
                    <MenuItem value="NAO_INFORMADO">Não informado</MenuItem>
                  </TextField>

                  <TextField
                    label="Porte"
                    select
                    fullWidth
                    value={animalPost.porte}
                    onChange={(e) =>
                      setAnimalPost((prev) => ({
                        ...prev,
                        porte: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="PEQUENO">Pequeno</MenuItem>
                    <MenuItem value="MEDIO">Médio</MenuItem>
                    <MenuItem value="GRANDE">Grande</MenuItem>
                    <MenuItem value="NAO_INFORMADO">Não informado</MenuItem>
                  </TextField>

                  <TextField
                    label="Vacinado?"
                    select
                    fullWidth
                    value={animalPost.vacinado}
                    onChange={(e) =>
                      setAnimalPost((prev) => ({
                        ...prev,
                        vacinado: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">Não informado</MenuItem>
                    <MenuItem value="true">Sim</MenuItem>
                    <MenuItem value="false">Não</MenuItem>
                  </TextField>

                  <TextField
                    label="Castrado?"
                    select
                    fullWidth
                    value={animalPost.castrado}
                    onChange={(e) =>
                      setAnimalPost((prev) => ({
                        ...prev,
                        castrado: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">Não informado</MenuItem>
                    <MenuItem value="true">Sim</MenuItem>
                    <MenuItem value="false">Não</MenuItem>
                  </TextField>
                </Stack>
              </Paper>
            )}

            {novoPost.categoria === "DESAPEGA" && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  Dados do desapega
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Condição"
                    select
                    fullWidth
                    value={desapegaPost.condicao}
                    onChange={(e) =>
                      setDesapegaPost((prev) => ({
                        ...prev,
                        condicao: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="NOVO">Novo</MenuItem>
                    <MenuItem value="SEMINOVO">Seminovo</MenuItem>
                    <MenuItem value="USADO">Usado</MenuItem>
                    <MenuItem value="PARA_REPARO">Para reparo</MenuItem>
                  </TextField>

                  <TextField
                    label="Categoria do item"
                    fullWidth
                    value={desapegaPost.categoria_item}
                    onChange={(e) =>
                      setDesapegaPost((prev) => ({
                        ...prev,
                        categoria_item: e.target.value,
                      }))
                    }
                  />

                  <TextField
                    label="É doação?"
                    select
                    fullWidth
                    value={String(desapegaPost.e_doacao)}
                    onChange={(e) =>
                      setDesapegaPost((prev) => ({
                        ...prev,
                        e_doacao: e.target.value === "true",
                      }))
                    }
                  >
                    <MenuItem value="true">Sim</MenuItem>
                    <MenuItem value="false">Não, é venda</MenuItem>
                  </TextField>

                  {!desapegaPost.e_doacao && (
                    <TextField
                      label="Preço"
                      type="number"
                      fullWidth
                      value={desapegaPost.preco}
                      onChange={(e) =>
                        setDesapegaPost((prev) => ({
                          ...prev,
                          preco: e.target.value,
                        }))
                      }
                    />
                  )}
                </Stack>
              </Paper>
            )}

            {novoPost.categoria === "VAGA_GARAGEM" && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  Dados da vaga
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Operação"
                    select
                    fullWidth
                    value={garagemPost.operacao}
                    onChange={(e) =>
                      setGaragemPost((prev) => ({
                        ...prev,
                        operacao: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="OFERECO">Ofereço vaga</MenuItem>
                    <MenuItem value="PRECISO">Preciso de vaga</MenuItem>
                  </TextField>

                  <TextField
                    label="Tipo de vaga"
                    select
                    fullWidth
                    value={garagemPost.tipo_vaga}
                    onChange={(e) =>
                      setGaragemPost((prev) => ({
                        ...prev,
                        tipo_vaga: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                    <MenuItem value="EMPRESTIMO">Empréstimo</MenuItem>
                  </TextField>

                  <TextField
                    label="Valor mensal"
                    type="number"
                    fullWidth
                    value={garagemPost.valor_mensal}
                    onChange={(e) =>
                      setGaragemPost((prev) => ({
                        ...prev,
                        valor_mensal: e.target.value,
                      }))
                    }
                  />

                  <TextField
                    label="Bloco"
                    fullWidth
                    value={garagemPost.bloco}
                    onChange={(e) =>
                      setGaragemPost((prev) => ({
                        ...prev,
                        bloco: e.target.value,
                      }))
                    }
                  />

                  <TextField
                    label="Código da vaga"
                    fullWidth
                    value={garagemPost.vaga_codigo}
                    onChange={(e) =>
                      setGaragemPost((prev) => ({
                        ...prev,
                        vaga_codigo: e.target.value,
                      }))
                    }
                  />

                  <TextField
                    label="Observações"
                    multiline
                    rows={3}
                    fullWidth
                    value={garagemPost.observacoes}
                    onChange={(e) =>
                      setGaragemPost((prev) => ({
                        ...prev,
                        observacoes: e.target.value,
                      }))
                    }
                  />
                </Stack>
              </Paper>
            )}

            <Button
              variant="outlined"
              component="label"
              startIcon={<ImageIcon />}
              disabled={salvandoPost}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              Adicionar imagens
              <input
                hidden
                type="file"
                multiple
                accept="image/*"
                onChange={handleSelecionarImagensPost}
              />
            </Button>

            {arquivosPost.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {arquivosPost.length} imagem(ns) selecionada(s)
                </Typography>

                <Stack spacing={1} sx={{ mt: 1 }}>
                  {arquivosPost.map((file, index) => (
                    <Stack
                      key={`${file.name}-${index}`}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: "80%" }}
                      >
                        {file.name}
                      </Typography>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoverImagemPost(index)}
                        disabled={salvandoPost}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}

            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1.5}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => setOpenNovoPost(false)}
                disabled={salvandoPost}
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                onClick={handleCriarPost}
                disabled={salvandoPost}
                startIcon={<AddIcon />}
              >
                {salvandoPost ? "Publicando..." : "Publicar Recado"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <MuralPostDialog
        postId={selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />

      <ClassificadoNovoDialog
        open={openNovoClassificado}
        onClose={() => {
          setOpenNovoClassificado(false);
        }}
        onAnalisado={(resultado) => {
          console.log(
            "[CLASSIFICADOS] Resultado da análise:",
            resultado
          );

          console.log(
            "[CLASSIFICADOS] Status:",
            resultado.classificado?.status
          );

          /**
           * Por enquanto mantemos o ClassificadoNovoDialog aberto.
           *
           * No próximo passo este callback abrirá
           * o fluxo de crédito/publicação.
           */
        }}
      />

    </Container>
  );
}

interface CandidaturaProps {
  id: string;
  status: string;
  valor_proposto: number;
  mensagem: string;
  totalSessoes?: number;
  total_sessoes?: number;
  prestador?: {
    id?: string;
    name: string;
    email?: string;
    tipo?: string;
    telefone?: string;
    foto_perfil_url?: string | null;
    foto_hero_url?: string | null;
    logo_url?: string | null;
    capa_url?: string | null;
  };
  pagamento?: {
    codigo_verificacao: string;
    status: string;
    link_pagamento?: string | null;

    transacoes?: Array<{
      id?: string;
      status?: string;
      tipo?: string;
      tipo_pagamento?: string;
      payment_type?: string;
      valor?: number | string;
      amount?: number | string;
      valor_pago?: number | string;
      createdAt?: string;
      updatedAt?: string;
    }>;
  };
  negociacoes?: any[];
}

interface ItemNegociacaoProps {
  cand: CandidaturaProps;
  agenda?: any[];
  isMobile: boolean;
  onAceitar: (id: string) => void;
  onResponder: (id: string, valor: number, msg: string) => void;
  onEnviarMensagem: (id: string, msg: string) => void;
  onRecuperarPagamento: () => void;
}

function ItemNegociacao({
  cand,
  agenda = [],
  isMobile,
  onAceitar,
  onResponder,
  onEnviarMensagem,
  onRecuperarPagamento,
}: ItemNegociacaoProps) {
  const [valor, setValor] = useState<number | string>(cand.valor_proposto);
  const [msg, setMsg] = useState("");

  const valorOriginal = Number(cand.valor_proposto || 0);
  const valorDigitado = Number(valor);
  const valorValido =
    String(valor).trim() !== "" &&
    Number.isFinite(valorDigitado) &&
    valorDigitado > 0;
  const valorFoiAlterado =
    valorValido && Math.abs(valorDigitado - valorOriginal) >= 0.005;

  const candStatusUpper = String(cand.status || "").toUpperCase();

  const pagStatusUpper = String(
    (cand as any).pagamento_status || cand.pagamento?.status || ""
  ).toUpperCase();

  const pagamento = cand.pagamento;
  const transacoes = Array.isArray(pagamento?.transacoes)
    ? pagamento.transacoes
    : [];

  const entrada = transacoes.find(
    (t: any) => String(t.tipo || "").toUpperCase() === "ENTRADA"
  );

  const saldo = transacoes.find(
    (t: any) => String(t.tipo || "").toUpperCase() === "SALDO"
  );

  const entradaPaga =
    !!entrada &&
    ["PAGO", "PAGO_EXTERNAMENTE", "APPROVED"].includes(
      String(entrada.status || "").toUpperCase()
    );

  const saldoPago =
    !!saldo &&
    ["PAGO", "PAGO_EXTERNAMENTE", "APPROVED"].includes(
      String(saldo.status || "").toUpperCase()
    );

  const pagamentoParcial =
    pagStatusUpper === "PARCIALMENTE_PAGO" ||
    (entradaPaga && !saldoPago);

  const pagamentoCompleto =
    pagStatusUpper === "PAGO" ||
    pagStatusUpper === "APPROVED" ||
    (entradaPaga && saldoPago);

  const isFechado = [
    "ACORDO_FECHADO",
    "PAGO",
    "EM_EXECUCAO",
    "CONTRATADO",
    "EM_ANDAMENTO",
  ].includes(candStatusUpper);

  const isPagamentoPendente =
    candStatusUpper === "ACORDO_FECHADO" &&
    !pagamentoCompleto &&
    !pagamentoParcial;

  const isPago = pagamentoCompleto;

  const sessoesValidas = Array.isArray(agenda)
    ? agenda.filter(
      (item: any) =>
        String(item.status || "").toUpperCase() !== "CANCELADO"
    )
    : [];

  const todasSessoesConcluidas =
    sessoesValidas.length > 0 &&
    sessoesValidas.every(
      (item: any) =>
        String(item.status || "").toUpperCase() === "CONCLUIDO"
    );

  const saldoPendente = pagamentoParcial && entradaPaga && !saldoPago;
  const podePagarSaldo = saldoPendente && todasSessoesConcluidas;

  const isAceitoPeloPrestador =
    candStatusUpper === "ACEITO_PRESTADOR" || candStatusUpper === "ACEITA";

  // Quando o próprio morador enviou uma contraproposta, ele deve aguardar
  // o prestador aceitá-la antes de poder confirmar o acordo.
  const aguardandoRespostaPrestador =
    candStatusUpper === "PROPOSTA_MORADOR";

  // O morador pode aceitar diretamente uma proposta do prestador ou
  // confirmar o acordo depois que o prestador aceitou a contraproposta.
  const podeMoradorAceitar = [
    "PENDENTE",
    "PROPOSTA_PRESTADOR",
    "ACEITO_PRESTADOR",
    "ACEITA",
  ].includes(candStatusUpper);

  const nomePrestador = cand.prestador?.name || "Profissional";
  const inicial = nomePrestador.trim().charAt(0).toUpperCase() || "P";

  const filesBaseUrl = String(api.defaults.baseURL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  const fotoPrestadorBruta =
    cand.prestador?.foto_perfil_url ||
    cand.prestador?.logo_url ||
    cand.prestador?.capa_url ||
    cand.prestador?.foto_hero_url ||
    "";

  const fotoPrestador = fotoPrestadorBruta
    ? /^(https?:|data:|blob:)/i.test(String(fotoPrestadorBruta))
      ? String(fotoPrestadorBruta)
      : `${filesBaseUrl}${String(fotoPrestadorBruta).startsWith("/") ? "" : "/"
      }${fotoPrestadorBruta}`
    : "";
  const totalVisitas = Number(
    (cand as any).totalSessoes ?? (cand as any).total_sessoes ?? 0
  );

  const valorFormatado = Number(cand.valor_proposto || 0).toLocaleString(
    "pt-BR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        bgcolor: "#ffffff",
        border: isPago
          ? "1px solid #bbf7d0"
          : isAceitoPeloPrestador
            ? "2px solid #3b82f6"
            : isPagamentoPendente
              ? "1px solid #fcd34d"
              : "1px solid #e2e8f0",
        borderRadius: isFechado ? "16px 16px 0 0" : "16px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Box sx={{ p: isMobile ? 2 : 2.5 }}>
        <Stack
          direction={isMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isMobile ? "stretch" : "flex-start"}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              src={fotoPrestador || undefined}
              alt={nomePrestador}
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                bgcolor: "#e8f1fb",
                color: "#0f4c81",
                fontWeight: 900,
                fontSize: "1.15rem",
                border: "1px solid #d5e5f5",
              }}
            >
              {inicial}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={900} noWrap={!isMobile}>
                  {nomePrestador}
                </Typography>

                {isAceitoPeloPrestador && (
                  <Chip
                    label="ACORDO ACEITO"
                    color="primary"
                    size="small"
                    sx={{ fontSize: "9px", fontWeight: 800 }}
                  />
                )}

                {isPago && (
                  <Chip
                    label="PAGO"
                    color="success"
                    size="small"
                    sx={{ fontSize: "9px", fontWeight: 800 }}
                  />
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Proposta enviada para o seu pedido
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ textAlign: isMobile ? "left" : "right", flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              VALOR DA PROPOSTA
            </Typography>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              fontWeight={900}
              sx={{ color: isPago ? "success.main" : "#f57c00", lineHeight: 1.05 }}
            >
              R$ {valorFormatado}
            </Typography>
            {totalVisitas > 0 && (
              <Typography variant="caption" color="text.secondary">
                {totalVisitas} {totalVisitas === 1 ? "visita/sessão" : "visitas/sessões"}
              </Typography>
            )}
          </Box>
        </Stack>

        {cand.mensagem && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={800}
              sx={{ display: "block", mb: 0.5 }}
            >
              MENSAGEM / ESCOPO
            </Typography>
            <Typography variant="body2" sx={{ color: "#334155", whiteSpace: "pre-wrap" }}>
              {cand.mensagem}
            </Typography>
          </Box>
        )}

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={1}
          sx={{ mt: 2 }}
          justifyContent="flex-end"
        >
          {isFechado ? (
            pagamentoCompleto ? (
              <Box sx={{ width: isMobile ? "100%" : "auto", textAlign: isMobile ? "left" : "right" }}>
                <Chip
                  label="PAGAMENTO COMPLETO"
                  color="success"
                  size="small"
                  icon={<CheckCircle fontSize="small" />}
                  sx={{ fontWeight: 800 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  Entrada e saldo pagos.
                </Typography>
              </Box>
            ) : saldoPendente ? (
              podePagarSaldo ? (
                <Box sx={{ width: isMobile ? "100%" : "auto", textAlign: isMobile ? "left" : "right" }}>
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth={isMobile}
                    onClick={onRecuperarPagamento}
                    sx={{ borderRadius: 2.5, px: 3, py: 1.1, fontWeight: 900 }}
                  >
                    Pagar saldo
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Serviço concluído. O saldo já pode ser pago.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: isMobile ? "100%" : "auto",
                    minWidth: isMobile ? "100%" : 300,
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle sx={{ fontSize: 18, color: "success.main" }} />
                    <Typography variant="body2" fontWeight={900} color="success.main">
                      Entrada paga
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    O saldo será liberado para pagamento após a conclusão da última sessão ou visita.
                  </Typography>
                </Box>
              )
            ) : (
              <Button
                variant="contained"
                color="warning"
                fullWidth={isMobile}
                onClick={() => {
                  const paymentLink =
                    cand.pagamento?.link_pagamento ||
                    (cand as any).link_pagamento ||
                    (cand as any).checkoutUrl;

                  if (paymentLink) window.location.href = paymentLink;
                  else onRecuperarPagamento();
                }}
                sx={{ borderRadius: 2.5, px: 3, py: 1.1, fontWeight: 900 }}
              >
                Pagar entrada
              </Button>
            )
          ) : aguardandoRespostaPrestador ? (
            <Box
              sx={{
                width: isMobile ? "100%" : "auto",
                minWidth: isMobile ? "100%" : 320,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: "#fff7ed",
                border: "1px solid #fed7aa",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={900}
                sx={{ color: "#9a3412" }}
              >
                Contraproposta enviada
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#9a3412", display: "block", mt: 0.25 }}
              >
                Aguardando o profissional aceitar ou responder sua contraproposta.
              </Typography>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="success"
              fullWidth={isMobile}
              disabled={!podeMoradorAceitar || valorFoiAlterado}
              onClick={() => onAceitar(cand.id)}
              sx={{ borderRadius: 2.5, px: 3, py: 1.1, fontWeight: 900 }}
            >
              {isAceitoPeloPrestador
                ? "Confirmar acordo e ir para pagamento"
                : "Aceitar e ir para pagamento"}
            </Button>
          )}
        </Stack>
      </Box>

      {cand.negociacoes && cand.negociacoes.length > 0 && (
        <Box sx={{ px: isMobile ? 2 : 2.5, pb: 0.5 }}>
          <Divider />
          <Box sx={{ pt: 2, maxHeight: 220, overflowY: "auto", pr: 0.5 }}>
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}
            >
              <ChatBubbleOutline sx={{ fontSize: 14 }} /> Histórico da negociação
            </Typography>

            {cand.negociacoes.map((n: any) => {
              const isCliente = n.enviadoPorCliente === true || n.tipo === "Morador";
              return (
                <Box
                  key={n.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isCliente ? "flex-end" : "flex-start",
                    mb: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2.5,
                      bgcolor: isCliente ? "#e0f2fe" : "#f8fafc",
                      border: "1px solid",
                      borderColor: isCliente ? "#bae6fd" : "#e2e8f0",
                      maxWidth: isMobile ? "94%" : "82%",
                    }}
                  >
                    <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={800}>
                        {isCliente ? "Morador" : "Prestador"}
                      </Typography>
                      <Typography variant="caption" fontWeight={900} color="success.main">
                        R$ {Number(n.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#334155" }}>
                      {n.mensagem}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          p: isMobile ? 2 : 2.5,
          pt: cand.negociacoes?.length ? 1.5 : 0.5,
          bgcolor: "#fbfdff",
          borderTop: cand.negociacoes?.length ? "none" : "1px solid #eef2f7",
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          {isFechado ? "CONVERSA COM O PROFISSIONAL" : "NEGOCIAR ESTA PROPOSTA"}
        </Typography>

        <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ mt: 1 }}>
          {!isFechado && !aguardandoRespostaPrestador && (
            <TextField
              label="Sua contraproposta (R$)"
              type="number"
              size="small"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              fullWidth={isMobile}
              sx={{ width: isMobile ? "100%" : 170 }}
            />
          )}

          {!isFechado && !aguardandoRespostaPrestador && valorFoiAlterado && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{
                alignSelf: isMobile ? "stretch" : "center",
                fontWeight: 700,
                maxWidth: isMobile ? "100%" : 230,
              }}
            >
              Valor alterado. Envie a contraproposta para continuar a negociação.
            </Typography>
          )}

          <TextField
            fullWidth
            label={
              isFechado
                ? "Enviar mensagem..."
                : aguardandoRespostaPrestador
                  ? "Mensagem para o profissional..."
                  : "Mensagem / condições..."
            }
            size="small"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />

          <Button
            variant="contained"
            disabled={
              isFechado || aguardandoRespostaPrestador
                ? !msg.trim()
                : !valorFoiAlterado || !valorValido
            }
            fullWidth={isMobile}
            startIcon={<ChatBubbleOutline />}
            sx={{ borderRadius: 2, px: 2.5, whiteSpace: "nowrap" }}
            onClick={() => {
              if (isFechado || aguardandoRespostaPrestador) {
                onEnviarMensagem(cand.id, msg);
              } else {
                onResponder(cand.id, Number(valor), msg);
              }
              setMsg("");
            }}
          >
            Enviar
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
function AgendaServico({
  agenda,
  onConfirmarCheckin,
  onConfirmarHorario,
  onProporNovoHorario,
  onRecusarHorario,
}: {
  agenda: any[];
  onConfirmarCheckin: (id: string) => void;
  onConfirmarHorario: (id: string) => Promise<void>;
  onProporNovoHorario: (
    id: string,
    data: string,
    hora: string
  ) => Promise<void>;
  onRecusarHorario: (id: string) => Promise<void>;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [agendaEditandoId, setAgendaEditandoId] =
    useState<string | null>(null);

  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");

  const formatarDataLocal = (dataString: string) => {
    if (!dataString) return "";

    const dataLimpa = dataString.split("T")[0];
    const partes = dataLimpa.split("-");

    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia}/${mes}/${ano}`;
    }

    return dataString;
  };

  const abrirContraproposta = (item: any) => {
    setAgendaEditandoId(item.id);

    setNovaData(
      String(item.data || "").split("T")[0]
    );

    setNovaHora(
      String(item.hora || "")
        .slice(0, 5)
    );
  };

  const fecharContraproposta = () => {
    setAgendaEditandoId(null);
    setNovaData("");
    setNovaHora("");
  };

  const enviarContraproposta = async (agendaId: string) => {
    if (!novaData || !novaHora) {
      toast.error("Informe a nova data e o novo horário.");
      return;
    }

    await onProporNovoHorario(
      agendaId,
      novaData,
      novaHora
    );

    fecharContraproposta();
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="subtitle2"
        fontWeight="900"
        display="flex"
        alignItems="center"
        gap={1}
        sx={{
          mb: 1.5,
          color: "text.primary",
        }}
      >
        <CalendarMonth sx={{ fontSize: 18 }} />

        Cronograma de Sessões / Visitas Técnicas
      </Typography>

      <Box
        sx={{
          maxHeight: "420px",
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        <Stack spacing={1.5}>
          {agenda && agenda.length > 0 ? (
            agenda.map((item) => {
              const status = String(
                item.status || ""
              ).toUpperCase();

              const isSugerido =
                status === "SUGERIDO";

              const isAguardandoPrestador =
                status === "CONFIRMADO";

              const isAgendado =
                status === "AGENDADO";

              const isConcluido =
                status === "CONCLUIDO";

              const isCancelado =
                status === "CANCELADO";

              const isLiberado =
                status === "LIBERADO_CLIENTE" ||
                status === "FILA_ASSINATURA";

              const agora = new Date();

              const dataLimpa = String(
                item.data || ""
              ).split("T")[0];

              const horaLimpa =
                String(item.hora || "00:00:00");

              const dataSessao = new Date(
                `${dataLimpa}T${horaLimpa}`
              );

              const diffMinutos =
                (dataSessao.getTime() -
                  agora.getTime()) /
                (1000 * 60);

              const checkinLiberado =
                diffMinutos <= 10 &&
                diffMinutos >= -60;

              const editando =
                agendaEditandoId === item.id;

              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: isMobile ? 1.5 : 2,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",

                    borderLeft: `5px solid ${isConcluido
                      ? "#4caf50"
                      : isCancelado
                        ? "#9e9e9e"
                        : isSugerido
                          ? "#ed6c02"
                          : isAguardandoPrestador
                            ? "#9c27b0"
                            : isLiberado
                              ? "#1976d2"
                              : "#2e7d32"
                      }`,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction={
                        isMobile
                          ? "column"
                          : "row"
                      }
                      justifyContent="space-between"
                      alignItems={
                        isMobile
                          ? "flex-start"
                          : "center"
                      }
                      spacing={1}
                    >
                      <Box>
                        <Typography
                          fontWeight="bold"
                          variant="body2"
                        >
                          {item.descricao}
                        </Typography>

                        <Stack
                          direction="row"
                          gap={2}
                          flexWrap="wrap"
                          sx={{
                            mt: 0.5,
                            color:
                              "text.secondary",
                          }}
                        >
                          <Typography
                            variant="caption"
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                          >
                            <CalendarMonth
                              sx={{
                                fontSize: 12,
                              }}
                            />

                            {formatarDataLocal(
                              item.data
                            )}
                          </Typography>

                          <Typography
                            variant="caption"
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                          >
                            <Schedule
                              sx={{
                                fontSize: 12,
                              }}
                            />

                            {String(
                              item.hora || ""
                            ).slice(0, 5)}
                          </Typography>
                        </Stack>
                      </Box>

                      {isSugerido && (
                        <Chip
                          label="AGUARDANDO SUA CONFIRMAÇÃO"
                          color="warning"
                          size="small"
                          sx={{
                            fontWeight: 800,
                          }}
                        />
                      )}

                      {isAguardandoPrestador && (
                        <Chip
                          label="AGUARDANDO PROFISSIONAL"
                          color="secondary"
                          size="small"
                          sx={{
                            fontWeight: 800,
                          }}
                        />
                      )}

                      {isAgendado && (
                        <Chip
                          label="HORÁRIO CONFIRMADO"
                          color="success"
                          size="small"
                          sx={{
                            fontWeight: 800,
                          }}
                        />
                      )}

                      {isLiberado && (
                        <Chip
                          label="EM ATENDIMENTO"
                          color="primary"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: "bold",
                          }}
                        />
                      )}

                      {isConcluido && (
                        <Chip
                          label="SESSÃO CONCLUÍDA"
                          color="success"
                          size="small"
                          sx={{
                            fontWeight: "bold",
                          }}
                        />
                      )}

                      {isCancelado && (
                        <Chip
                          label="HORÁRIO RECUSADO"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    {/* =====================================
                        HORÁRIO PROPOSTO PELO PRESTADOR
                       ===================================== */}
                    {isSugerido && (
                      <>
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: "#fff7ed",
                            borderRadius: 2,
                            border:
                              "1px solid #fed7aa",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color="warning.dark"
                          >
                            O profissional propôs este
                            horário para a visita.
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Confirme se estiver de acordo ou
                            proponha outra data e horário.
                          </Typography>
                        </Box>

                        {!editando ? (
                          <Stack
                            direction={
                              isMobile
                                ? "column"
                                : "row"
                            }
                            spacing={1}
                          >
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={
                                <CheckCircle />
                              }
                              fullWidth={isMobile}
                              onClick={() =>
                                onConfirmarHorario(
                                  item.id
                                )
                              }
                            >
                              Confirmar horário
                            </Button>

                            <Button
                              variant="outlined"
                              startIcon={
                                <Schedule />
                              }
                              fullWidth={isMobile}
                              onClick={() =>
                                abrirContraproposta(
                                  item
                                )
                              }
                            >
                              Propor outra data
                            </Button>

                            <Button
                              variant="text"
                              color="error"
                              fullWidth={isMobile}
                              onClick={() =>
                                onRecusarHorario(
                                  item.id
                                )
                              }
                            >
                              Recusar
                            </Button>
                          </Stack>
                        ) : (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: "#ffffff",
                              border:
                                "1px solid #cbd5e1",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              sx={{ mb: 1.5 }}
                            >
                              Proponha um novo horário
                            </Typography>

                            <Stack
                              direction={
                                isMobile
                                  ? "column"
                                  : "row"
                              }
                              spacing={1.5}
                            >
                              <TextField
                                label="Nova data"
                                type="date"
                                size="small"
                                fullWidth
                                value={novaData}
                                onChange={(e) =>
                                  setNovaData(
                                    e.target.value
                                  )
                                }
                                slotProps={{
                                  inputLabel: {
                                    shrink: true,
                                  },
                                }}
                              />

                              <TextField
                                label="Novo horário"
                                type="time"
                                size="small"
                                fullWidth
                                value={novaHora}
                                onChange={(e) =>
                                  setNovaHora(
                                    e.target.value
                                  )
                                }
                                slotProps={{
                                  inputLabel: {
                                    shrink: true,
                                  },
                                }}
                              />
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                              sx={{ mt: 1.5 }}
                            >
                              <Button
                                size="small"
                                onClick={
                                  fecharContraproposta
                                }
                              >
                                Cancelar
                              </Button>

                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  enviarContraproposta(
                                    item.id
                                  )
                                }
                              >
                                Enviar proposta
                              </Button>
                            </Stack>
                          </Paper>
                        )}
                      </>
                    )}

                    {/* =====================================
                        CONTRAPROPOSTA DO MORADOR
                       ===================================== */}
                    {isAguardandoPrestador && (
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: "#faf5ff",
                          borderRadius: 2,
                          border:
                            "1px solid #e9d5ff",
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={800}
                        >
                          Sua nova sugestão foi enviada ao
                          profissional.
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Estamos aguardando a confirmação
                          dele. O horário ainda não está
                          confirmado.
                        </Typography>
                      </Box>
                    )}

                    {/* =====================================
                        HORÁRIO CONFIRMADO
                       ===================================== */}
                    {isAgendado && (
                      <Box>
                        <Button
                          size="small"
                          variant={
                            checkinLiberado
                              ? "contained"
                              : "outlined"
                          }
                          color="warning"
                          disabled={
                            !checkinLiberado
                          }
                          startIcon={
                            <CheckCircle />
                          }
                          fullWidth={isMobile}
                          sx={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            py: isMobile
                              ? 1
                              : 0.5,
                            borderRadius: "6px",
                          }}
                          onClick={() =>
                            onConfirmarCheckin(
                              item.id
                            )
                          }
                        >
                          {checkinLiberado
                            ? "Liberar Entrada / Check-in"
                            : "Aguardando Janela (10 min)"}
                        </Button>

                        {!checkinLiberado &&
                          diffMinutos > 10 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{
                                fontSize: "9px",
                                mt: 0.5,
                              }}
                            >
                              O check-in será liberado 10
                              minutos antes da visita
                              técnica.
                            </Typography>
                          )}
                      </Box>
                    )}

                    {isConcluido && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        fontWeight="bold"
                      >
                        Fração de R${" "}
                        {Number(
                          item.valor_parcela ||
                          (item as any)
                            .valorParcela ||
                          0
                        ).toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}{" "}
                        liberada.
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              );
            })
          ) : (
            <Box
              sx={{
                p: 2,
                bgcolor: "#f1f5f9",
                borderRadius: 2,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: "center",
              }}
            >
              <Info
                sx={{
                  fontSize: 16,
                  color: "text.secondary",
                }}
              />

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Aguardando o profissional sugerir o
                horário da visita.
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}