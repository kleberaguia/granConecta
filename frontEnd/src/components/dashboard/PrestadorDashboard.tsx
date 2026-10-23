import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Container, Typography, Paper, Tab, Tabs,
    Stack, Button, CircularProgress, Chip,
    Divider, TextField, LinearProgress, useTheme, useMediaQuery,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    Avatar,
    Rating
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Verified, LocationOn, Person,
    Handshake, Assignment,
    Paid, AddCircleOutline, CloudUpload,
    CheckCircle, CalendarMonth, Schedule, PlayArrow,
    LocalShipping, NotificationsActive
} from '@mui/icons-material';

import api from '../../api/api';

const FILES_BASE_URL = String(api.defaults.baseURL || "")
    .replace(/\/api$/, "")
    .replace(/\/$/, "");

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
import SmartToyIcon from "@mui/icons-material/SmartToy";
import StoreChatbotKnowledgeManager from "../LandingPages/StoreChatbotKnowledgeManager/StoreChatbotKnowledgeManager";
import { HumanChatInbox } from '../humanChat/HumanChatInbox';
import BusinessTeamManager from '../BusinessTeamManager/BusinessTeamManager';

const formatarMoeda = (valor: any) => {
    const num = parseFloat(String(valor).replace(',', '.'));
    return isNaN(num) ? "0,00" : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const obterIniciais = (nome: any) => {
    const partes = String(nome || "Cliente")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (partes.length === 0) return "C";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
};

const rotuloStatusProposta = (status: any) => {
    const valor = String(status || "").toUpperCase();

    const labels: Record<string, string> = {
        PENDENTE: "Aguardando morador",
        PROPOSTA_PRESTADOR: "Proposta enviada",
        PROPOSTA_MORADOR: "Contraproposta recebida",
        ACEITO_PRESTADOR: "Contraproposta aceita",
        ACORDO_FECHADO: "Acordo fechado",
        ENCERRADA: "Encerrada",
        CANCELADA: "Cancelada",
        RECUSADA: "Recusada",
    };

    return labels[valor] || String(status || "Em negociação").replace(/_/g, " ");
};

export default function PrestadorDashboard() {
    // 📱 HOOKS DE RESPONSIVIDADE (MOBILE-FIRST)
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 1. ESTADOS (HOOKS)
    const [tab, setTab] = useState(10);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [oportunidades, setOportunidades] = useState([]);
    const [meusTrabalhos, setMeusTrabalhos] = useState([]);
    const [ofertasAll, setOfertasAll] = useState<any[]>([]);
    const [faturas, setFaturas] = useState<any[]>([]);

    // Estados de Agendamento/Calendário
    const [agenda, setAgenda] = useState<any[]>([]);
    const [novaData, setNovaData] = useState<{ [key: string]: string }>({});
    const [novaHora, setNovaHora] = useState<{ [key: string]: string }>({});
    const [descricaoAgenda, setDescricaoAgenda] = useState<{ [key: string]: string }>({});
    const [pesquisa, setPesquisa] = useState(''); // Estado de busca textual unificado

    const [stats, setStats] = useState({
        ganhos: 0,
        ativos: 0,
        received: 0,
        emCustodia: 0,
        taxaConversao: 0
    });

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
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

    const u = user as any;

    const [chatOpen, setChatOpen] = useState(false);

    // Contexto da fila humana aberta a partir da Central Comercial.
    // Quando vier de uma oportunidade, filtramos pelo storeId e NÃO pelo
    // chatbotTipo, pois a mesma página comercial pode ter conversas gravadas
    // como LOJA ou PRESTADOR dependendo da origem do atendimento.
    const [humanInboxOwnerId, setHumanInboxOwnerId] = useState<string>("");
    const [humanInboxChatbotTipo, setHumanInboxChatbotTipo] = useState<
        "GRANCONECTA" | "LOJA" | "PRESTADOR" | undefined
    >(undefined);
    const [humanInboxTitle, setHumanInboxTitle] = useState("Atendimentos");
    const [unreadCount, setUnreadCount] = useState(0);

    // Central Comercial unificada: WhatsApp, Instagram, Landing Page,
    // Chat GranConecta e campanhas convergem para a mesma oportunidade.
    const [centralLoading, setCentralLoading] = useState(false);
    const [centralError, setCentralError] = useState<string | null>(null);
    const [centralPesquisa, setCentralPesquisa] = useState("");
    const [centralOpportunityOpen, setCentralOpportunityOpen] = useState(false);
    const [centralOpportunityLoading, setCentralOpportunityLoading] = useState(false);
    const [centralOpportunityError, setCentralOpportunityError] = useState<string | null>(null);
    const [centralOpportunityDetail, setCentralOpportunityDetail] = useState<any>(null);

    // Atendimento humano vinculado à oportunidade.
    // Cada conversa continua com apenas 1 atendente responsável por vez,
    // mas o negócio pode ter vários atendentes trabalhando em conversas diferentes.
    const [centralHumanMessages, setCentralHumanMessages] = useState<any[]>([]);
    const [centralHumanReply, setCentralHumanReply] = useState("");
    const [centralHumanLoading, setCentralHumanLoading] = useState(false);
    const [centralHumanTaking, setCentralHumanTaking] = useState(false);
    const [centralHumanSending, setCentralHumanSending] = useState(false);
    const [centralHumanFinishing, setCentralHumanFinishing] = useState(false);

    const [centralComercial, setCentralComercial] = useState<any>({
        summary: {
            total: 0,
            novas: 0,
            qualificando: 0,
            qualificadas: 0,
            emNegociacao: 0,
            aguardandoPagamento: 0,
            pagamentoAprovado: 0,
            emExecucao: 0,
            convertidas: 0,
            perdidas: 0,
            valorEmNegociacao: 0,
            valorConvertido: 0,
        },
        items: [],
        pagination: {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
        },
    });

    // Dentro de carregarTudo ou um novo useEffect:


    const ehVendedor = useMemo(() => {
        const valor = userProfile?.categoriaTipo || userProfile?.categoria || userProfile?.tipo || userProfile?.business_type || "";
        const cat = String(valor).trim().toUpperCase();
        const listaVendedores = ['AUTOMOTIVO', 'PRODUTO', 'FOOD', 'BEBIDA', 'SOBREMESA', 'LOJA', 'ARTESANATO', 'VESTUARIO'];
        return listaVendedores.includes(cat);
    }, [userProfile]);

    const perfilOperacional = useMemo(() => {
        const tipoNegocio = String(userProfile?.business_type || userProfile?.categoriaTipo || userProfile?.tipo || "").trim().toUpperCase();
        const catSlug = String(userProfile?.categoriaSlug || userProfile?.categoria || "").trim().toUpperCase();

        const listaDelivery = ['FOOD', 'BEBIDA', 'SOBREMESA', 'HAMBURGUERIA', 'PIZZARIA', 'LANCHONETE'];
        if (listaDelivery.includes(tipoNegocio) || listaDelivery.includes(catSlug)) {
            return 'DELIVERY';
        }

        const listaProdutos = ['PRODUTO', 'LOJA', 'AUTOMOTIVO', 'ARTESANATO', 'VESTUARIO'];
        if (listaProdutos.includes(tipoNegocio) || listaProdutos.includes(catSlug)) {
            return 'PRODUTO';
        }

        return 'SERVICO';
    }, [userProfile]);

    const dashboardChatbotTipo = useMemo<"LOJA" | "PRESTADOR">(() => {
        return ehVendedor ? "LOJA" : "PRESTADOR";
    }, [ehVendedor]);

    const chatbotOwnerId = useMemo(() => {
        if (!userProfile) return "";

        if (dashboardChatbotTipo === "LOJA") {
            return String(
                userProfile?.store_id ||
                userProfile?.storeId ||
                userProfile?.lojaId ||
                userProfile?.loja_id ||
                userProfile?.id ||
                ""
            );
        }

        return String(
            userProfile?.id ||
            userProfile?.prestador_id ||
            userProfile?.usuarioId ||
            u?.id ||
            ""
        );
    }, [dashboardChatbotTipo, userProfile, u?.id]);

    const abrirFilaHumanaDaOportunidade = useCallback((op: any) => {
        const storeId = String(op?.business?.storeId || "").trim();

        // A Central Comercial já validou que a oportunidade pertence ao negócio.
        // Aqui usamos o storeId oficial da própria oportunidade.
        setHumanInboxOwnerId(storeId);

        // Importante: não forçar PRESTADOR/LOJA.
        // O backend aceita chatbotTipo opcional e assim retorna a fila do negócio
        // independentemente de a conversa ter sido persistida como LOJA ou PRESTADOR.
        setHumanInboxChatbotTipo(undefined);

        const storeName = String(op?.business?.storeName || "").trim();
        setHumanInboxTitle(
            storeName
                ? `Atendimentos - ${storeName}`
                : "Atendimentos do negócio"
        );

        setChatOpen(true);
    }, []);

    const abrirFilaHumanaPadrao = useCallback(() => {
        setHumanInboxOwnerId(chatbotOwnerId);
        setHumanInboxChatbotTipo(dashboardChatbotTipo);
        setHumanInboxTitle(
            dashboardChatbotTipo === "LOJA"
                ? "Atendimentos da Loja"
                : "Atendimentos do Prestador"
        );
        setChatOpen(true);
    }, [chatbotOwnerId, dashboardChatbotTipo]);

    const carregarCentralComercial = useCallback(async () => {
        if (!u?.id) return;

        setCentralLoading(true);
        setCentralError(null);

        try {
            const response = await api.get("/central-comercial", {
                params: {
                    page: 1,
                    limit: 50,
                },
            });

            setCentralComercial({
                summary: response.data?.summary || {
                    total: 0,
                    novas: 0,
                    qualificando: 0,
                    qualificadas: 0,
                    emNegociacao: 0,
                    aguardandoPagamento: 0,
                    pagamentoAprovado: 0,
                    emExecucao: 0,
                    convertidas: 0,
                    perdidas: 0,
                    valorEmNegociacao: 0,
                    valorConvertido: 0,
                },
                items: Array.isArray(response.data?.items) ? response.data.items : [],
                pagination: response.data?.pagination || {
                    page: 1,
                    limit: 50,
                    total: 0,
                    totalPages: 0,
                },
            });
        } catch (error: any) {
            console.error("[CENTRAL COMERCIAL] Erro ao carregar", error);

            const message =
                error?.response?.data?.message ||
                "Não foi possível carregar a Central Comercial.";

            setCentralError(message);
        } finally {
            setCentralLoading(false);
        }
    }, [u?.id]);

    const abrirOportunidadeCentral = useCallback(async (opportunityId: string) => {
        if (!opportunityId) return;

        setCentralOpportunityOpen(true);
        setCentralOpportunityLoading(true);
        setCentralOpportunityError(null);
        setCentralOpportunityDetail(null);

        try {
            const response = await api.get(`/central-comercial/oportunidades/${opportunityId}`);
            const opportunity = response.data?.opportunity || response.data;

            if (!opportunity?.id) {
                throw new Error("OPORTUNIDADE_NAO_ENCONTRADA");
            }

            setCentralOpportunityDetail(opportunity);
        } catch (error: any) {
            console.error("[CENTRAL COMERCIAL] Erro ao carregar oportunidade", error);
            setCentralOpportunityError(
                error?.response?.data?.message ||
                "Não foi possível carregar os detalhes desta oportunidade."
            );
        } finally {
            setCentralOpportunityLoading(false);
        }
    }, []);

    const fecharOportunidadeCentral = () => {
        setCentralOpportunityOpen(false);
        setCentralOpportunityLoading(false);
        setCentralOpportunityError(null);
        setCentralOpportunityDetail(null);
        setCentralHumanMessages([]);
        setCentralHumanReply("");
        setCentralHumanLoading(false);
    };

    const currentAtendenteId = String(
        u?.id ||
        (u as any)?.usuarioId ||
        ""
    ).trim();

    const carregarMensagensCentral = useCallback(async (conversationId: string) => {
        if (!conversationId) return;

        setCentralHumanLoading(true);

        try {
            const response = await api.get(
                `/chat/human/${conversationId}/messages`
            );

            setCentralHumanMessages(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (error: any) {
            console.error("[CENTRAL COMERCIAL] Erro ao carregar mensagens", error);

            toast.error(
                error?.response?.data?.message ||
                "Não foi possível carregar as mensagens deste atendimento."
            );
        } finally {
            setCentralHumanLoading(false);
        }
    }, []);

    const atualizarDetalheOportunidadeCentral = useCallback(async () => {
        const opportunityId = centralOpportunityDetail?.id;

        if (!opportunityId) return null;

        const response = await api.get(
            `/central-comercial/oportunidades/${opportunityId}`
        );

        const opportunity =
            response.data?.opportunity ||
            response.data;

        if (opportunity?.id) {
            setCentralOpportunityDetail(opportunity);
            return opportunity;
        }

        return null;
    }, [centralOpportunityDetail?.id]);

    const assumirAtendimentoCentral = async () => {
        const conversation =
            centralOpportunityDetail?.conversation || {};

        const conversationId =
            String(conversation?.conversationId || "").trim();

        if (!conversationId) {
            toast.error("Esta oportunidade não possui conversa vinculada.");
            return;
        }

        if (conversation?.atendenteId) {
            if (String(conversation.atendenteId) === currentAtendenteId) {
                toast.success("Este atendimento já está com você.");
                await carregarMensagensCentral(conversationId);
                return;
            }

            toast.error("Esta conversa já está com outro atendente.");
            return;
        }

        if (conversation?.status !== "AGUARDANDO_ATENDENTE") {
            toast.error("O cliente ainda não solicitou atendimento humano.");
            return;
        }

        try {
            setCentralHumanTaking(true);

            await api.post(
                `/chat/human/${conversationId}/take`
            );

            const updated =
                await atualizarDetalheOportunidadeCentral();

            toast.success("Atendimento assumido por você.");

            if (updated?.conversation?.conversationId) {
                await carregarMensagensCentral(
                    updated.conversation.conversationId
                );
            }
        } catch (error: any) {
            console.error("[CENTRAL COMERCIAL] Erro ao assumir atendimento", error);

            // O backend usa UPDATE protegido. Se dois atendentes clicarem
            // ao mesmo tempo, apenas um fica responsável pela conversa.
            toast.error(
                error?.response?.data?.message ||
                "Outro atendente pode ter assumido esta conversa."
            );

            try {
                await atualizarDetalheOportunidadeCentral();
            } catch {
                // Mantém o erro original para o usuário.
            }
        } finally {
            setCentralHumanTaking(false);
        }
    };

    const enviarRespostaCentral = async () => {
        const conversation =
            centralOpportunityDetail?.conversation || {};

        const conversationId =
            String(conversation?.conversationId || "").trim();

        const responsavelId =
            String(conversation?.atendenteId || "").trim();

        if (!conversationId) {
            toast.error("Conversa não identificada.");
            return;
        }

        if (!currentAtendenteId || responsavelId !== currentAtendenteId) {
            toast.error("Somente o atendente responsável pode responder.");
            return;
        }

        const message =
            centralHumanReply.trim();

        if (!message) {
            toast.error("Digite uma mensagem.");
            return;
        }

        try {
            setCentralHumanSending(true);

            await api.post(
                `/chat/human/${conversationId}/reply`,
                { message }
            );

            setCentralHumanReply("");

            await carregarMensagensCentral(conversationId);
            await atualizarDetalheOportunidadeCentral();
        } catch (error: any) {
            console.error("[CENTRAL COMERCIAL] Erro ao responder", error);

            toast.error(
                error?.response?.data?.message ||
                "Não foi possível enviar a resposta."
            );

            try {
                await atualizarDetalheOportunidadeCentral();
            } catch {
                // Ignora apenas a atualização secundária.
            }
        } finally {
            setCentralHumanSending(false);
        }
    };

    const finalizarAtendimentoCentral = async () => {
        const conversation =
            centralOpportunityDetail?.conversation || {};

        const conversationId =
            String(conversation?.conversationId || "").trim();

        const responsavelId =
            String(conversation?.atendenteId || "").trim();

        if (!conversationId) {
            toast.error("Conversa não identificada.");
            return;
        }

        if (!currentAtendenteId || responsavelId !== currentAtendenteId) {
            toast.error("Somente o atendente responsável pode finalizar.");
            return;
        }

        try {
            setCentralHumanFinishing(true);

            await api.post(
                `/chat/human/${conversationId}/finish`
            );

            toast.success("Atendimento humano finalizado.");

            setCentralHumanMessages([]);
            setCentralHumanReply("");

            await atualizarDetalheOportunidadeCentral();
        } catch (error: any) {
            console.error("[CENTRAL COMERCIAL] Erro ao finalizar atendimento", error);

            toast.error(
                error?.response?.data?.message ||
                "Não foi possível finalizar o atendimento."
            );
        } finally {
            setCentralHumanFinishing(false);
        }
    };

    const carregarBanners = useCallback(async () => {
        if (!userProfile?.id) return;
        setLoadingBanners(true);
        try {
            const res = await api.get(`/marketplace/banners/meus/${userProfile.id}`);
            setMeusBanners(res.data);
        } catch (err) { console.error(err); } finally { setLoadingBanners(false); }
    }, [userProfile?.id]);

    const normalizar = (str: any) =>
        String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const carregarTudo = useCallback(async () => {
        setLoading(true);
        try {
            const resDash = await api.get('/servicos/solicitacoes/prestador/dashboard');

            console.log('resDash.data.perfil ', resDash.data.perfil)

            console.log("💳 [DASH MP]", {
                gateway_conta_id: resDash.data?.perfil?.gateway_conta_id,
                mercadoPagoConectado: resDash.data?.perfil?.mercadoPagoConectado,
            });



            const dashPerfil = resDash.data.perfil;

            if (!u.id) {
                setLoading(false);
                return;
            }

            const [resUser, resOfertas, resOfertaAll, resProdutos, resLeads, resAgenda] = await Promise.all([
                api.get(`/users/${u.id}`),
                api.get('/servicos/ofertas/meus'),
                api.get('/servicos/ofertas/listarOferta/meus'),
                api.get(`/produtos/lojas/meus-produtos/${dashPerfil.id}`).catch(() => ({ data: [] })),
                api.get(`/lojas/leads/meus`).catch(() => ({ data: [] })),
                api.get('/servicos/agenda/meus').catch(() => ({ data: [] }))
            ]);

            console.log("💳 [MERCADO PAGO]", {
                gateway_conta_id: dashPerfil?.gateway_conta_id,
                mercadoPagoConectado: dashPerfil?.mercadoPagoConectado,
            });
            console.group("🔎 [PrestadorDashboard] Retornos da API");

            console.log("👤 /users/:id", resUser.data);
            console.log("💼 /servicos/ofertas/meus", resOfertas.data);
            console.log("📋 /servicos/ofertas/listarOferta/meus", resOfertaAll.data);
            console.log("📦 /produtos/lojas/meus-produtos", resProdutos.data);
            console.log("🎯 /lojas/leads/meus", resLeads.data);
            console.log("📅 /servicos/agenda/meus", resAgenda.data);

            console.groupEnd();

            const perfilUsuario = resUser.data?.perfil || resUser.data;

            // Unifica os dados do usuário com os dados oficiais retornados
            // pelo dashboard do prestador. O status do Mercado Pago deve vir
            // do backend e não ser inferido pelo access token no frontend.
            const perfilDados = {
                ...perfilUsuario,

                usuario_id:
                    dashPerfil?.usuario_id ||
                    perfilUsuario?.usuario_id ||
                    perfilUsuario?.usuarioId ||
                    perfilUsuario?.id,

                store_id:
                    dashPerfil?.store_id ||
                    perfilUsuario?.store_id ||
                    perfilUsuario?.storeId,

                slug:
                    dashPerfil?.slug ||
                    perfilUsuario?.slug,

                gateway_conta_id:
                    dashPerfil?.gateway_conta_id ||
                    perfilUsuario?.gateway_conta_id ||
                    null,

                mercadoPagoConectado:
                    dashPerfil?.mercadoPagoConectado === true,
            };

            // O backend já faz o matching seguro por categoria:
            // perfil_prestador.categoriaid === servico_solicitacao.categoriaId.
            // Não filtramos novamente no frontend por nome/slug, porque
            // a oportunidade retornada pode possuir somente categoriaId.
            const oportunidadesDisponiveis = Array.isArray(resDash.data?.oportunidades)
                ? resDash.data.oportunidades
                : [];

            setUserProfile(perfilDados);
            setLeadsInteracoes(resLeads.data || []);
            setMeusProdutos(resProdutos.data || []);
            setOportunidades(oportunidadesDisponiveis);
            setMeusTrabalhos(resDash.data.propostas || []);

            const agendaOrdenada = (resAgenda.data || []).sort((a: any, b: any) => {
                if (a.status === 'FILA_ASSINATURA' && b.status !== 'FILA_ASSINATURA') return -1;
                if (b.status === 'FILA_ASSINATURA' && a.status !== 'FILA_ASSINATURA') return 1;
                return 0;
            });
            setAgenda(agendaOrdenada);

            // Une as duas fontes de ofertas do prestador.
            // listarOferta/meus pode não devolver uma oferta recém-criada/PENDENTE,
            // enquanto /ofertas/meus pode já conhecê-la. O id evita duplicidade.
            const ofertasBrutas = [
                ...(Array.isArray(resOfertaAll.data) ? resOfertaAll.data : []),
                ...(Array.isArray(resOfertas.data) ? resOfertas.data : []),
            ];

            const ofertasUnicas = Array.from(
                new Map(
                    ofertasBrutas
                        .filter((o: any) => o?.id)
                        .map((o: any) => [String(o.id), o])
                ).values()
            ) as any[];

            const ofertasMapeadas = ofertasUnicas.map((o: any) => {
                const statusNormalizado = String(o.status || "").toUpperCase();

                const liberadoParaAgendar =
                    o.agenda_liberada === true ||
                    o.agenda_liberada === 1 ||
                    ['EM_ANDAMENTO', 'PAGO'].includes(statusNormalizado);

                return {
                    ...o,
                    status: statusNormalizado,
                    totalSessoes: o.totalSessoes || o.total_sessoes || 1,
                    sessoesConcluidas: o.sessoesConcluidas || o.sessoes_concluidas || 0,
                    agenda_liberada: liberadoParaAgendar
                };
            });

            console.log('[PRESTADOR] ofertas operacionais', ofertasMapeadas);
            setOfertasAll(ofertasMapeadas);

            try {
                const resFin = await api.get('/pagamentos/meus');
                const faturasData = Array.isArray(resFin.data) ? resFin.data : [];

                console.log(
                    "💰 /pagamentos/meus:",
                    resFin.data
                );
                setFaturas(faturasData);

                // O pagamento é a fonte de verdade para saber se o contrato pode ser iniciado.
                // Fazemos o vínculo por ofertaId/oferta_id sem alterar o status operacional da oferta.
                const ofertasComPagamento = ofertasMapeadas.map((oferta: any) => {
                    const fatura = faturasData.find((f: any) =>
                        String(f.ofertaId || f.oferta_id || f?.oferta?.id || "") === String(oferta.id)
                    );

                    // Enriquece a oferta com os dados completos que já vêm no retorno
                    // financeiro. Assim a esteira consegue identificar claramente:
                    // projeto/serviço, morador e unidade, sem depender de um único endpoint.
                    const solicitacao =
                        fatura?.oferta?.solicitacao ||
                        fatura?.solicitacao ||
                        oferta?.solicitacao ||
                        {};

                    const morador =
                        fatura?.morador ||
                        solicitacao?.morador ||
                        solicitacao?.usuario ||
                        {};

                    const metadata =
                        solicitacao?.metadata ||
                        fatura?.metadata ||
                        oferta?.metadata ||
                        {};

                    return {
                        ...oferta,

                        // Identificação do projeto / serviço
                        solicitacao_titulo:
                            oferta?.solicitacao_titulo ||
                            fatura?.solicitacao_titulo ||
                            solicitacao?.titulo ||
                            solicitacao?.title ||
                            metadata?.titulo ||
                            metadata?.servico ||
                            null,

                        descricao:
                            oferta?.descricao ||
                            fatura?.descricao ||
                            solicitacao?.descricao ||
                            metadata?.problema ||
                            null,

                        problema:
                            oferta?.problema ||
                            metadata?.problema ||
                            solicitacao?.problema ||
                            null,

                        categoria_nome:
                            oferta?.categoria_nome ||
                            metadata?.categoriaNome ||
                            metadata?.categoria_nome ||
                            solicitacao?.categoria?.nome ||
                            null,

                        // Identificação do cliente / morador
                        cliente_nome:
                            oferta?.cliente_nome ||
                            fatura?.cliente_nome ||
                            morador?.name ||
                            morador?.nome ||
                            solicitacao?.morador_nome ||
                            "Cliente GranConecta",

                        cliente_unidade:
                            oferta?.cliente_unidade ||
                            fatura?.cliente_unidade ||
                            morador?.unidade ||
                            morador?.apartamento ||
                            solicitacao?.unidade_apto ||
                            solicitacao?.unidade ||
                            metadata?.unidade ||
                            null,

                        cliente_foto:
                            oferta?.cliente_foto ||
                            fatura?.cliente_foto ||
                            morador?.foto ||
                            morador?.foto_url ||
                            null,

                        pagamento_status: String(
                            fatura?.pagamento_status ||
                            fatura?.status ||
                            oferta?.pagamento_status ||
                            ""
                        ).toUpperCase(),

                        status_liberacao:
                            fatura?.status_liberacao ||
                            oferta?.status_liberacao ||
                            null,
                    };
                });

                setOfertasAll(ofertasComPagamento);

                // Resumo financeiro: /pagamentos/meus é a fonte de verdade.
                // IMPORTANTE: pagamento parcial também representa um contrato fechado.
                const faturasContratadas = faturasData.filter((f: any) => {
                    const status = String(f?.pagamento_status || f?.status || "").toUpperCase();
                    return ["PAGO", "PARCIALMENTE_PAGO"].includes(status);
                });

                const totalContratosContratados = faturasContratadas.reduce(
                    (acc: number, f: any) =>
                        acc + Number(f?.valor_total ?? f?.valor ?? 0),
                    0
                );

                const jaLiberadoEfetivo = faturasData.reduce(
                    (acc: number, f: any) =>
                        acc + Number(
                            f?.valor_liberado ??
                            (String(f?.status_liberacao || "").toUpperCase() === "LIBERADO"
                                ? (f?.valor_pago ?? f?.valor ?? 0)
                                : 0)
                        ),
                    0
                );

                const retidoNaPlataforma = faturasData.reduce((acc: number, f: any) => {
                    const valorPago = Number(
                        f?.valor_pago ??
                        (String(f?.pagamento_status || f?.status || "").toUpperCase() === "PAGO"
                            ? (f?.valor_total ?? f?.valor ?? 0)
                            : 0)
                    );
                    const valorLiberado = Number(f?.valor_liberado ?? 0);
                    return acc + Math.max(0, valorPago - valorLiberado);
                }, 0);

                setStats({
                    ganhos: totalContratosContratados,
                    ativos: ofertasComPagamento.filter((o: any) =>
                        ["PAGO", "PARCIALMENTE_PAGO"].includes(
                            String(o.pagamento_status || "").toUpperCase()
                        ) &&
                        !["CONCLUIDA", "CANCELADA", "ESTORNADA"].includes(
                            String(o.status || "").toUpperCase()
                        )
                    ).length,
                    received: jaLiberadoEfetivo,
                    emCustodia: retidoNaPlataforma,
                    taxaConversao: resDash.data.propostas?.length > 0 ? (resOfertas.data?.length / resDash.data.propostas.length) * 100 : 0
                });
            } catch (e) { console.warn(e); }

        } catch (err) {
            console.error(err);
            toast.error("Erro ao sincronizar dados");
        } finally { setLoading(false); }
    }, [u.id]);

    useEffect(() => { carregarTudo(); }, [carregarTudo]);
    useEffect(() => { carregarCentralComercial(); }, [carregarCentralComercial]);
    useEffect(() => { if (userProfile?.id) carregarBanners(); }, [userProfile?.id, carregarBanners]);

    useEffect(() => {
        if (!chatbotOwnerId) return;

        const checarNovasMensagens = async () => {
            try {
                console.log("CHECK CHAT PRESTADOR", {
                    chatbotTipo: ehVendedor ? "LOJA" : "PRESTADOR",
                    chatbotOwnerId,
                });

                const res = await api.get("/chat/nao-lidas", {
                    params: {
                        chatbotTipo: dashboardChatbotTipo,
                        chatbotOwnerId,
                    },
                });

                setUnreadCount(
                    Number(
                        res.data?.total ||
                        res.data?.count ||
                        0
                    )
                );
            } catch (e) {
                console.error(
                    "Erro ao verificar mensagens pendentes",
                    e
                );
            }
        };

        checarNovasMensagens();

        const interval = setInterval(
            checarNovasMensagens,
            30000
        );

        return () => clearInterval(interval);
    }, [chatbotOwnerId, dashboardChatbotTipo]);

    const handleAbrirGerenciadorProposta = useCallback((trabalho: any) => {
        // 🟢 CORRIGIDO: Modificado de 'trabajo.id' para 'trabalho.id'
        const idCandidaturaValido = trabalho.candidaturas?.[0]?.id || trabalho.candidaturaId || trabalho.id;

        console.log('trabalhooooooooooooooooooooooooo ', trabalho)
        setCandidaturaSelecionada({
            ...trabalho,
            id: idCandidaturaValido,
            candidaturaId: idCandidaturaValido,
            solicitacaoId: trabalho.id
        });
        setGerenciarOpen(true);
    }, []);

    const handleUpdateStatus = async (ofertaId: string, action: 'aceitar' | 'iniciar' | 'concluir' | 'despachar') => {
        try {
            await api.post(`/servicos/ofertas/${ofertaId}/${action}`);
            if (action === 'iniciar') toast.success("Trabalho aceito e iniciado com sucesso!");
            else if (action === 'concluir') toast.success("Concluído! Pronto para despacho/retirada.");
            else if (action === 'despachar') toast.success("Despachado! O morador foi avisado via WhatsApp.");
            carregarTudo();
        } catch (err: any) { toast.error("Erro ao atualizar esteira operacional"); }
    };

    const handleCriarAgendamento = async (ofertaId: string) => {
        try {
            await api.post('/agenda/agendar', {
                ofertaId,
                descricao: descricaoAgenda[ofertaId],
                data: novaData[ofertaId],
                hora: novaHora[ofertaId]
            });
            toast.success("Sessão agendada! Folha atualizada e cliente avisado.");
            setDescricaoAgenda(prev => ({ ...prev, [ofertaId]: "" }));
            carregarTudo();
        } catch (err) { toast.error("Erro ao agendar sessão."); }
    };

    const handleLiberarSessaoCliente = async (agendaId: string) => {
        try {
            await api.post(`/agenda/${agendaId}/checkin-cliente`);
            toast.success("Presença confirmada!");
            carregarTudo();
        } catch (err) { toast.error("Não foi possível realizar o check-in."); }
    };

    const handleAssinarEEncerrarSessao = async (agendaId: string, _ofertaId: string) => {
        try {
            await api.post('/agenda/assinar-encerrar', { agendaId });
            toast.success("Sessão assinada! Fração do pagamento liberada na conta.");
            carregarTudo();
        } catch (err) { toast.error("Falha ao colher assinatura digital."); }
    };

    const handleUploadEtapaFoto = async (ofertaId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadingImage(ofertaId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/servicos/ofertas/${ofertaId}/etapa-imagem`, formData);
            toast.success("Foto do andamento anexada com sucesso!");
            carregarTudo();
        } catch (err) { toast.error("Falha ao subir imagem."); } finally { setUploadingImage(null); }
    };

    const handleEnviarAlerta = async (faturaId: string) => {
        try {
            await api.post(`/faturas/${faturaId}/alertar`);
            toast.success("Alerta enviado ao morador via WhatsApp!");
            carregarTudo();
        } catch (error) {
            toast.error("Erro ao enviar alerta.");
        }
    };

    const centralItemsFiltrados = useMemo(() => {
        const termo = normalizar(centralPesquisa);

        if (!termo) {
            return centralComercial?.items || [];
        }

        return (centralComercial?.items || []).filter((item: any) => {
            const customer = item?.customer || {};
            const interest = item?.interest || {};
            const origin = item?.origin || {};
            const campaign = item?.campaign || {};

            const haystack = [
                customer?.name,
                customer?.email,
                customer?.phone,
                interest?.catalogItemName,
                interest?.qualificationSummary,
                item?.stage,
                item?.status,
                origin?.channel,
                origin?.rawChannel,
                origin?.campaignName,
                campaign?.name,
            ]
                .filter(Boolean)
                .join(" ");

            return normalizar(haystack).includes(termo);
        });
    }, [centralComercial?.items, centralPesquisa]);

    const formatarDataHora = (valor: any) => {
        if (!valor) return "—";

        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "—";

        return data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const rotuloCanal = (canal: any) => {
        const valor = String(canal || "").toUpperCase();

        const labels: Record<string, string> = {
            WHATSAPP: "WhatsApp",
            INSTAGRAM: "Instagram",
            FACEBOOK: "Facebook",
            LANDING_PAGE: "Landing Page",
            CHAT_LOJA: "Chat da Loja",
            CHAT_PRESTADOR: "Chat do Prestador",
            GRANCONECTA: "GranConecta",
            CAMPANHA: "Campanha",
            DIRETO: "Direto",
            OUTRO: "Outro",
        };

        return labels[valor] || valor || "Não informado";
    };

    const rotuloEtapaCentral = (stage: any) => {
        const valor = String(stage || "").toUpperCase();

        const labels: Record<string, string> = {
            NOVA: "Nova",
            QUALIFICANDO: "Qualificando",
            QUALIFICADA: "Qualificada",
            OPCOES_APRESENTADAS: "Opções apresentadas",
            NEGOCIO_SELECIONADO: "Negócio selecionado",
            EM_NEGOCIACAO: "Em negociação",
            AGUARDANDO_CLIENTE: "Aguardando cliente",
            AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
            PAGAMENTO_APROVADO: "Pagamento aprovado",
            EM_EXECUCAO: "Em execução",
            CONVERTIDA: "Convertida",
            PERDIDA: "Perdida",
            EXPIRADA: "Expirada",
            CANCELADA: "Cancelada",
            ERRO: "Erro",
        };

        return labels[valor] || valor || "—";
    };

    const corEtapaCentral = (stage: any): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        const valor = String(stage || "").toUpperCase();

        if (["CONVERTIDA", "PAGAMENTO_APROVADO"].includes(valor)) return "success";
        if (["EM_NEGOCIACAO", "QUALIFICADA", "NEGOCIO_SELECIONADO"].includes(valor)) return "primary";
        if (["AGUARDANDO_PAGAMENTO", "AGUARDANDO_CLIENTE", "QUALIFICANDO"].includes(valor)) return "warning";
        if (["PERDIDA", "EXPIRADA", "CANCELADA", "ERRO"].includes(valor)) return "error";
        if (valor === "EM_EXECUCAO") return "info";
        return "default";
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const ofertaAguardandoInicio = (o: any) => {
        const status = String(o?.status || "").toUpperCase();
        const pagamentoStatus = String(o?.pagamento_status || "").toUpperCase();

        // Contratos com entrada confirmada também podem ser iniciados.
        // O saldo permanece pendente para a conclusão do serviço.
        return ["PAGO", "PARCIALMENTE_PAGO"].includes(pagamentoStatus) &&
            ["PENDENTE", "ACEITA", "NEGOCIACAO", "ACORDO_FECHADO", "PAGO"].includes(status);
    };

    const ofertaEmAndamento = (o: any) =>
        ["EM_ANDAMENTO", "EM_EXECUCAO"].includes(String(o?.status || "").toUpperCase());

    const ofertaCombinaPesquisa = (o: any) => {
        const termo = String(pesquisa || "").trim().toLowerCase();

        // Sem pesquisa, exibe todas as ofertas da etapa.
        if (!termo) return true;

        const campos = [
            o?.cliente_nome,
            o?.solicitacao_titulo,
            o?.titulo,
            o?.descricao,
            o?.id,
            o?.solicitacaoId,
            o?.solicitacao_id,
        ];

        return campos.some((valor) =>
            String(valor || "").toLowerCase().includes(termo)
        );
    };

    const handleAbrirAgendaContrato = (oferta: any) => {
        setSelectedServico(oferta);
        setTab(3);

        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }, 100);
    };

    const renderResumoAgendaContrato = (oferta: any) => {
        const agendasDoContrato = agenda
            .filter(
                (item: any) =>
                    String(item.ofertaId || item.oferta_id || "") ===
                    String(oferta.id)
            )
            .sort((a: any, b: any) => {
                const dataA = new Date(
                    `${String(a.data).split("T")[0]}T${a.hora || "00:00:00"}`
                ).getTime();
                const dataB = new Date(
                    `${String(b.data).split("T")[0]}T${b.hora || "00:00:00"}`
                ).getTime();
                return dataA - dataB;
            });

        const concluidas = agendasDoContrato.filter(
            (item: any) => String(item.status || "").toUpperCase() === "CONCLUIDO"
        ).length;

        const agora = new Date();
        const proximaSessao = agendasDoContrato.find((item: any) => {
            if (String(item.status || "").toUpperCase() === "CONCLUIDO") return false;

            const dataSessao = new Date(
                `${String(item.data).split("T")[0]}T${item.hora || "00:00:00"}`
            );
            return dataSessao >= agora;
        });

        const total = Number(oferta.totalSessoes || 0) || agendasDoContrato.length || 1;
        const progresso = Math.min(100, Math.round((concluidas / total) * 100));
        const atendimentoConcluido = concluidas >= total;

        return (
            <Box
                sx={{
                    mt: 1.5,
                    p: 1.5,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.7 }}>
                    <Typography variant="caption" fontWeight="900" color="primary.main">
                        Sessões / Visitas
                    </Typography>
                    <Typography variant="caption" fontWeight="900">
                        {concluidas} de {total}
                    </Typography>
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={progresso}
                    sx={{ height: 6, borderRadius: 999, mb: 1.2 }}
                />

                {proximaSessao ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                        Próxima: <b>{new Date(`${String(proximaSessao.data).split("T")[0]}T12:00:00`).toLocaleDateString('pt-BR')}</b> às{' '}
                        <b>{String(proximaSessao.hora || '').slice(0, 5)}</b>
                    </Typography>
                ) : atendimentoConcluido ? (
                    <Typography variant="caption" color="success.main" fontWeight="bold" display="block">
                        ✓ Atendimento concluído
                    </Typography>
                ) : agendasDoContrato.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                        Nenhum horário agendado.
                    </Typography>
                ) : null}

                <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<CalendarMonth />}
                    onClick={() => handleAbrirAgendaContrato(oferta)}
                    sx={{ mt: 1.3, fontWeight: 800, textTransform: 'none' }}
                >
                    {atendimentoConcluido ? 'Ver histórico' : 'Abrir agenda'}
                </Button>
            </Box>
        );
    };

    const faturasCompletas = faturas.map((f: any) => {
        const faturaOfertaId = String(f?.ofertaId || f?.oferta_id || f?.oferta?.id || "");
        const faturaSolicitacaoId = String(
            f?.solicitacaoId ||
            f?.solicitacao_id ||
            f?.oferta?.solicitacaoId ||
            f?.oferta?.solicitacao_id ||
            f?.oferta?.solicitacao?.id ||
            ""
        );

        const ofertaRelacionada = ofertasAll.find((o: any) => {
            const ofertaId = String(o?.id || "");
            const solicitacaoId = String(o?.solicitacaoId || o?.solicitacao_id || "");

            return (faturaOfertaId && ofertaId === faturaOfertaId) ||
                (faturaSolicitacaoId && solicitacaoId === faturaSolicitacaoId);
        });

        return {
            ...f,
            exibir_nome:
                ofertaRelacionada?.cliente_nome ||
                f?.cliente_nome ||
                f?.morador?.name ||
                f?.morador?.nome ||
                "Cliente",
            exibir_titulo:
                ofertaRelacionada?.solicitacao_titulo ||
                f?.solicitacao_titulo ||
                f?.oferta?.solicitacao?.titulo ||
                f?.descricao ||
                "Serviço"
        };
    });



    return (
        <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
            {/* HEADER RESPONSIVO */}

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900">Painel do Profissional</Typography>
                    <Typography color="text.secondary" variant="body2">Bem-vindo, <b>{userProfile?.nome}</b></Typography>
                </Box>

                {/* Botão de Notificação */}
                {unreadCount > 0 && (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={abrirFilaHumanaPadrao}
                        startIcon={
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsActive />
                            </Badge>
                        }
                    >
                        Ver Mensagens
                    </Button>
                )}
            </Stack>
            {/* <Stack direction={isMobile ? "column" : "row"} justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"} gap={2} sx={{ mb: 4 }}>
                <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900">Painel do Profissional</Typography>
                    <Typography color="text.secondary" variant="body2">Bem-vindo, <b>{userProfile?.nome || userProfile?.name}</b></Typography>
                </Box>
                <Chip icon={<Verified />} label={isMobile ? "Verificado" : "Profissional Verificado"} color="primary" sx={{ fontWeight: 'bold' }} />
            </Stack> */}

            {/* METRICS CARDS */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Total em Contratos" value={`R$ ${formatarMoeda(stats.ganhos)}`} icon={<Handshake />} color="#3b82f6" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Total Liberado" value={`R$ ${formatarMoeda(stats.received)}`} icon={<Paid />} color="#10b981" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Garantido em Custódia" value={`R$ ${formatarMoeda(stats.emCustodia)}`} icon={<Verified />} color="#f59e0b" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard title="Serviços Ativos" value={stats.ativos} icon={<Assignment />} color="#8b5cf6" />
                </Grid>
            </Grid>

            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
            >
                <Tab value={10} label="Central Comercial" />
                <Tab value={1} label="Minhas Propostas" />
                <Tab value={2} label="Execução e Etapas" />
                <Tab value={3} label="Agenda Compartilhada" />
                <Tab value={4} label="Financeiro" />
                <Tab value={5} label="Minha Página" />
                <Tab value={6} label="Marketplace" />
                {ehVendedor && <Tab value={7} label="Meu Catálogo" />}
                <Tab value={8} label="Leads / Contatos" />
                <Tab value={9} icon={<SmartToyIcon />} label="Atendente IA" iconPosition="start" />
                <Tab value={11} label="Equipe" />
            </Tabs>

            {/* CENTRAL COMERCIAL: visão unificada de oportunidades e canais */}
            {tab === 10 && (
                <Box sx={{ mt: 1 }}>
                    <Stack
                        direction={isMobile ? "column" : "row"}
                        justifyContent="space-between"
                        alignItems={isMobile ? "stretch" : "center"}
                        gap={2}
                        sx={{ mb: 3 }}
                    >
                        <Box>
                            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900">
                                Central Comercial
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                                Oportunidades vindas de campanhas, WhatsApp, Instagram, landing pages e chats em uma única visão.
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            onClick={carregarCentralComercial}
                            disabled={centralLoading}
                            startIcon={centralLoading ? <CircularProgress size={16} /> : <NotificationsActive />}
                        >
                            Atualizar
                        </Button>
                    </Stack>

                    {centralError && (
                        <Paper
                            sx={{
                                p: 2,
                                mb: 3,
                                borderRadius: "12px",
                                border: "1px solid",
                                borderColor: "error.light",
                                bgcolor: "error.50",
                            }}
                        >
                            <Typography color="error.main" fontWeight="bold">
                                {centralError}
                            </Typography>
                        </Paper>
                    )}

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">OPORTUNIDADES</Typography>
                                <Typography variant="h4" fontWeight="900" sx={{ mt: 0.5 }}>
                                    {Number(centralComercial?.summary?.total || 0) + oportunidades.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Todas as jornadas comerciais
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">EM NEGOCIAÇÃO</Typography>
                                <Typography variant="h4" fontWeight="900" color="primary.main" sx={{ mt: 0.5 }}>
                                    {centralComercial?.summary?.emNegociacao || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Clientes em processo de decisão
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">VALOR EM NEGOCIAÇÃO</Typography>
                                <Typography variant="h5" fontWeight="900" color="warning.main" sx={{ mt: 0.8 }}>
                                    R$ {formatarMoeda(centralComercial?.summary?.valorEmNegociacao || 0)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Potencial comercial em aberto
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">VALOR CONVERTIDO</Typography>
                                <Typography variant="h5" fontWeight="900" color="success.main" sx={{ mt: 0.8 }}>
                                    R$ {formatarMoeda(centralComercial?.summary?.valorConvertido || 0)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Oportunidades convertidas
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary">Novas</Typography>
                                <Typography variant="h6" fontWeight="900">{centralComercial?.summary?.novas || 0}</Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary">Qualificando</Typography>
                                <Typography variant="h6" fontWeight="900">{centralComercial?.summary?.qualificando || 0}</Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary">Aguardando pgto.</Typography>
                                <Typography variant="h6" fontWeight="900">{centralComercial?.summary?.aguardandoPagamento || 0}</Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary">Pago</Typography>
                                <Typography variant="h6" fontWeight="900">{centralComercial?.summary?.pagamentoAprovado || 0}</Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary">Em execução</Typography>
                                <Typography variant="h6" fontWeight="900">{centralComercial?.summary?.emExecucao || 0}</Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                <Typography variant="caption" color="text.secondary">Convertidas</Typography>
                                <Typography variant="h6" fontWeight="900">{centralComercial?.summary?.convertidas || 0}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Paper
                        sx={{
                            p: isMobile ? 2 : 2.5,
                            mb: 2,
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            value={centralPesquisa}
                            onChange={(event) => setCentralPesquisa(event.target.value)}
                            placeholder="Buscar por cliente, serviço, canal, campanha ou etapa..."
                        />
                    </Paper>

                    {/* OPORTUNIDADES DE SERVIÇO DO GRANCONECTA
                        O backend já entrega somente solicitações compatíveis com a
                        categoria do prestador. Elas entram na Central Comercial sem
                        alterar os fluxos de WhatsApp/Instagram/Landing Page existentes. */}
                    {oportunidades.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="subtitle2"
                                fontWeight="900"
                                sx={{ mb: 1.5 }}
                            >
                                PEDIDOS DE SERVIÇO
                            </Typography>

                            <Stack spacing={2}>
                                {oportunidades.map((op: any) => {
                                    const localizacao = [
                                        op.condominio,
                                        op.bloco_torre ? `Torre/Bloco ${op.bloco_torre}` : "",
                                        op.unidade_apto ? `Unidade ${op.unidade_apto}` : "",
                                    ].filter(Boolean).join(" • ");

                                    return (
                                        <Paper
                                            key={`servico-${op.id}`}
                                            sx={{
                                                p: isMobile ? 2 : 2.5,
                                                borderRadius: "16px",
                                                border: "1px solid #e2e8f0",
                                            }}
                                        >
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Typography variant="h6" fontWeight="900">
                                                        {op.morador_nome || "Morador"}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {op.titulo || "Solicitação de serviço"}
                                                    </Typography>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        flexWrap="wrap"
                                                        useFlexGap
                                                        sx={{ mt: 1.5 }}
                                                    >
                                                        <Chip
                                                            size="small"
                                                            label="Nova oportunidade"
                                                            color="primary"
                                                        />
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label="GranConecta"
                                                        />
                                                    </Stack>
                                                </Grid>

                                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                    >
                                                        Valor sugerido
                                                    </Typography>
                                                    <Typography fontWeight="900">
                                                        {Number(op.valor_sugerido || 0) > 0
                                                            ? `R$ ${formatarMoeda(op.valor_sugerido)}`
                                                            : "A combinar"}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                    >
                                                        Local
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {localizacao || op.bairro || op.cidade || "Local não informado"}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 2 }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        fullWidth
                                                        onClick={() => {
                                                            setSelectedServico(op);
                                                            setModalOpen(true);
                                                        }}
                                                    >
                                                        Enviar proposta
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}

                    {centralLoading && (centralComercial?.items || []).length === 0 ? (
                        <Paper sx={{ p: 5, textAlign: "center", borderRadius: "16px" }}>
                            <CircularProgress size={28} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Carregando oportunidades...
                            </Typography>
                        </Paper>
                    ) : centralItemsFiltrados.length === 0 ? (
                        <Paper
                            sx={{
                                p: 5,
                                textAlign: "center",
                                borderRadius: "16px",
                                border: "1px dashed #cbd5e1",
                            }}
                        >
                            <Typography fontWeight="bold">
                                Nenhuma oportunidade encontrada.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                As novas jornadas comerciais aparecerão aqui automaticamente.
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {centralItemsFiltrados.map((op: any) => {
                                const customer = op?.customer || {};
                                const interest = op?.interest || {};
                                const origin = op?.origin || {};
                                const flow = op?.flow || {};
                                const conversation = op?.conversation || {};
                                const campaign = op?.campaign || {};

                                const valor =
                                    flow?.amount ??
                                    interest?.catalogItemPromotionalPrice ??
                                    interest?.catalogItemPrice ??
                                    0;

                                return (
                                    <Paper
                                        key={op.id}
                                        sx={{
                                            p: isMobile ? 2 : 2.5,
                                            borderRadius: "16px",
                                            border: "1px solid #e2e8f0",
                                        }}
                                    >
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <Typography variant="h6" fontWeight="900">
                                                    {customer?.name || "Cliente"}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {interest?.catalogItemName ||
                                                        interest?.qualificationSummary ||
                                                        "Interesse em atendimento"}
                                                </Typography>

                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                                                    <Chip
                                                        size="small"
                                                        label={rotuloEtapaCentral(op?.stage)}
                                                        color={corEtapaCentral(op?.stage)}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        label={rotuloCanal(origin?.channel)}
                                                    />
                                                </Stack>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Valor
                                                </Typography>
                                                <Typography fontWeight="900">
                                                    {Number(valor || 0) > 0
                                                        ? `R$ ${formatarMoeda(valor)}`
                                                        : "—"}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Campanha
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {campaign?.name || origin?.campaignName || "Espontânea"}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Última atualização
                                                </Typography>
                                                <Typography variant="body2">
                                                    {formatarDataHora(op?.updatedAt)}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                                <Stack spacing={1}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => abrirOportunidadeCentral(op.id)}
                                                    >
                                                        Ver negociação
                                                    </Button>

                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => abrirFilaHumanaDaOportunidade(op)}
                                                        disabled={!conversation?.conversationId}
                                                    >
                                                        Atendimentos
                                                    </Button>

                                                    <Typography variant="caption" color="text.secondary" textAlign="center">
                                                        {conversation?.waitingHuman
                                                            ? "Aguardando humano"
                                                            : conversation?.status || "Sem conversa ativa"}
                                                    </Typography>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            )}

            {/* ABA 0: OPORTUNIDADES */}
            {tab === 0 && (
                <Grid container spacing={2}>
                    {oportunidades.length > 0 ? oportunidades.map((op: any) => (
                        <Grid size={{ xs: 12, md: 6 }} key={op.id}>
                            <Paper sx={{ p: isMobile ? 2 : 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <Typography variant="h6" fontWeight="bold">{op.titulo}</Typography>
                                <Typography color="primary" variant="h5" fontWeight="900" sx={{ my: 1 }}>R$ {formatarMoeda(op.valor_sugerido)}</Typography>
                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    <Typography variant="body2" display="flex" alignItems="center" gap={1}><Person sx={{ fontSize: 18 }} /> {op.morador_nome}</Typography>
                                    <Typography variant="body2" display="flex" alignItems="center" gap={1}><LocationOn sx={{ fontSize: 18 }} /> {op.bairro}</Typography>
                                </Stack>
                                <Button variant="contained" fullWidth onClick={() => { setSelectedServico(op); setModalOpen(true); }}>Enviar Proposta</Button>
                            </Paper>
                        </Grid>
                    )) : <Typography sx={{ width: '100%', textAlign: 'center', py: 5 }}>Sem oportunidades no momento.</Typography>}
                </Grid>
            )}

            {/* ABA 1: MINHAS PROPOSTAS */}
            {tab === 1 && (
                <Box>
                    <Stack
                        direction={isMobile ? "column" : "row"}
                        justifyContent="space-between"
                        alignItems={isMobile ? "flex-start" : "center"}
                        spacing={1}
                        sx={{ mb: 2.5 }}
                    >
                        <Box>
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="900">
                                Minhas Propostas
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Acompanhe propostas, contrapropostas e acordos com os solicitantes.
                            </Typography>
                        </Box>
                        <Chip
                            label={`${meusTrabalhos.length} ${meusTrabalhos.length === 1 ? "proposta" : "propostas"}`}
                            variant="outlined"
                            color="primary"
                        />
                    </Stack>

                    <Stack spacing={2}>
                        {meusTrabalhos.length > 0 ? meusTrabalhos.map((trab: any) => {
                            const nomeSolicitante =
                                trab.solicitacao?.morador?.nome ||
                                trab.morador_nome ||
                                trab.cliente_nome ||
                                trab.solicitante_nome ||
                                trab.usuario_nome ||
                                "Solicitante";

                            console.log("=== PROPOSTA COMPLETA ===", trab);
                            console.log("morador_nome:", trab.morador_nome);
                            console.log("morador_foto:", trab.morador_foto);
                            console.log(
                                "foto solicitacao:",
                                trab.solicitacao?.morador?.foto_perfil_url
                            );

                            const fotoSolicitanteBruta =
                                trab.solicitacao?.morador?.foto_perfil_url ||
                                trab.morador_foto ||
                                trab.cliente_foto ||
                                trab.solicitante_foto ||
                                trab.foto_perfil ||
                                trab.avatar_url ||
                                "";

                            const fotoSolicitante = fotoSolicitanteBruta
                                ? /^(https?:|data:|blob:)/i.test(String(fotoSolicitanteBruta))
                                    ? String(fotoSolicitanteBruta)
                                    : `${FILES_BASE_URL}${String(fotoSolicitanteBruta).startsWith("/") ? "" : "/"
                                    }${fotoSolicitanteBruta}`
                                : "";

                            console.log("fotoSolicitanteBruta:", fotoSolicitanteBruta);
                            console.log("fotoSolicitante final:", fotoSolicitante);


                            console.log('fotoSolicitante ', fotoSolicitante)

                            const avaliacaoBruta =
                                trab.morador_avaliacao ??
                                trab.cliente_avaliacao ??
                                trab.solicitante_avaliacao ??
                                trab.avaliacao_media ??
                                trab.rating;

                            const avaliacao = Number(avaliacaoBruta);
                            const possuiAvaliacao =
                                avaliacaoBruta !== null &&
                                avaliacaoBruta !== undefined &&
                                avaliacaoBruta !== "" &&
                                Number.isFinite(avaliacao) &&
                                avaliacao > 0;

                            const status = String(trab.status || "").toUpperCase();
                            const contrapropostaRecebida = status === "PROPOSTA_MORADOR";
                            const acordoFechado = status === "ACORDO_FECHADO";

                            return (
                                <Paper
                                    key={trab.id}
                                    elevation={0}
                                    sx={{
                                        p: isMobile ? 2 : 2.5,
                                        borderRadius: "18px",
                                        border: "1px solid",
                                        borderColor: contrapropostaRecebida
                                            ? "warning.light"
                                            : acordoFechado
                                                ? "success.light"
                                                : "#e2e8f0",
                                        bgcolor: contrapropostaRecebida
                                            ? "#fffdf7"
                                            : "#ffffff",
                                        transition: "box-shadow .2s ease, transform .2s ease",
                                        "&:hover": {
                                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                                            transform: isMobile ? "none" : "translateY(-1px)",
                                        },
                                    }}
                                >
                                    <Grid container spacing={2.5} alignItems="center">
                                        <Grid size={{ xs: 12, md: 5 }}>
                                            <Stack direction="row" spacing={1.75} alignItems="center">
                                                <Avatar
                                                    src={fotoSolicitante || undefined}
                                                    alt={nomeSolicitante}
                                                    sx={{
                                                        width: 52,
                                                        height: 52,
                                                        bgcolor: "primary.50",
                                                        color: "primary.main",
                                                        fontWeight: 900,
                                                        border: "1px solid",
                                                        borderColor: "primary.100",
                                                    }}
                                                >
                                                    {obterIniciais(nomeSolicitante)}
                                                </Avatar>

                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography fontWeight="900" noWrap>
                                                        {nomeSolicitante}
                                                    </Typography>

                                                    {possuiAvaliacao ? (
                                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                                            <Rating
                                                                value={Math.min(5, Math.max(0, avaliacao))}
                                                                precision={0.1}
                                                                size="small"
                                                                readOnly
                                                            />
                                                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                                                {avaliacao.toFixed(1).replace(".", ",")}
                                                            </Typography>
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Solicitante GranConecta
                                                        </Typography>
                                                    )}

                                                    <Typography
                                                        variant="body1"
                                                        fontWeight="800"
                                                        sx={{ mt: 0.6 }}
                                                    >
                                                        {trab.solicitacao_titulo || "Solicitação de serviço"}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight="bold"
                                                display="block"
                                            >
                                                VALOR ATUAL
                                            </Typography>
                                            <Typography
                                                variant="h5"
                                                fontWeight="900"
                                                color={contrapropostaRecebida ? "warning.main" : "text.primary"}
                                            >
                                                R$ {formatarMoeda(trab.valor_proposto)}
                                            </Typography>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight="bold"
                                                display="block"
                                                sx={{ mb: 0.7 }}
                                            >
                                                SITUAÇÃO
                                            </Typography>
                                            <Chip
                                                label={rotuloStatusProposta(trab.status)}
                                                size="small"
                                                color={
                                                    acordoFechado
                                                        ? "success"
                                                        : contrapropostaRecebida
                                                            ? "warning"
                                                            : status === "ENCERRADA" || status === "CANCELADA" || status === "RECUSADA"
                                                                ? "default"
                                                                : "info"
                                                }
                                                variant={acordoFechado || contrapropostaRecebida ? "filled" : "outlined"}
                                                sx={{ fontWeight: 800 }}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <Button
                                                variant={contrapropostaRecebida ? "contained" : "outlined"}
                                                color={contrapropostaRecebida ? "warning" : "primary"}
                                                fullWidth
                                                onClick={() => handleAbrirGerenciadorProposta(trab)}
                                                sx={{
                                                    borderRadius: "10px",
                                                    py: 1.1,
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {contrapropostaRecebida
                                                    ? "Responder contraproposta"
                                                    : "Ver negociação"}
                                            </Button>
                                        </Grid>
                                    </Grid>

                                    {contrapropostaRecebida && (
                                        <Box
                                            sx={{
                                                mt: 2,
                                                pt: 1.5,
                                                borderTop: "1px solid",
                                                borderColor: "warning.light",
                                            }}
                                        >
                                            <Typography variant="body2" color="warning.dark" fontWeight="700">
                                                O solicitante enviou uma nova condição. Abra a negociação para responder.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            );
                        }) : (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 5,
                                    textAlign: "center",
                                    borderRadius: "18px",
                                    border: "1px dashed #cbd5e1",
                                }}
                            >
                                <Typography fontWeight="900">
                                    Você ainda não enviou propostas.
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Quando você responder a um pedido de serviço, ele aparecerá aqui.
                                </Typography>
                            </Paper>
                        )}
                    </Stack>
                </Box>
            )}

            {/* ABA 2: CENTRAL DE OPERAÇÕES EM ESTEIRA (KANBAN) */}
            {tab === 2 && (
                <Box sx={{ mt: 2 }}>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder={perfilOperacional === 'DELIVERY' ? "🔎 Buscar por pedido ou lanche..." : perfilOperacional === 'PRODUTO' ? "🔎 Buscar por produto ou comprador..." : "🔎 Buscar por morador ou serviço..."}
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                        />
                    </Paper>

                    {isMobile ? (
                        <Stack spacing={1.5}>
                            {/* NOVOS PEDIDOS MOBILE */}
                            <Paper sx={{ bgcolor: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7', overflow: 'hidden' }}>
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography fontWeight="900" color="warning.main" variant="subtitle2">
                                        {perfilOperacional === 'DELIVERY' ? "1. NOVOS PEDIDOS" : perfilOperacional === 'PRODUTO' ? "1. NOVAS VENDAS" : "1. NOVOS CONTRATOS"}
                                    </Typography>
                                    <Chip label={ofertasAll.filter(ofertaAguardandoInicio).length} color="warning" size="small" />
                                </Box>
                                <Divider />
                                <Stack spacing={1.5} sx={{ p: 2, maxHeight: '350px', overflowY: 'auto' }}>
                                    {ofertasAll
                                        .filter((o: any) => ofertaAguardandoInicio(o) && ofertaCombinaPesquisa(o))
                                        .map((p: any) => {
                                            const statusPagamento = String(p.pagamento_status || "").toUpperCase();
                                            const estaPago = ['PAGO', 'PARCIALMENTE_PAGO'].includes(statusPagamento);
                                            const entradaConfirmada = statusPagamento === 'PARCIALMENTE_PAGO';
                                            return (
                                                <Paper key={p.id} sx={{ p: 2, borderLeft: '4px solid #f59e0b', borderRadius: '8px', boxShadow: 1, bgcolor: 'white' }}>
                                                    <Typography variant="subtitle2" fontWeight="900" sx={{ textTransform: 'uppercase' }}>{p.solicitacao_titulo || p.titulo || "Serviço contratado"}</Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">Morador: <b>{p.cliente_nome || "Cliente GranConecta"}</b></Typography>
                                                    {p.cliente_unidade && <Typography variant="caption" color="text.secondary" display="block">Unidade: <b>{p.cliente_unidade}</b></Typography>}
                                                    <Box sx={{ mt: 1.25, p: 1.25, bgcolor: '#fffaf0', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                                        <Stack direction="row" justifyContent="space-between"><Typography variant="caption">Valor do contrato</Typography><Typography variant="caption" fontWeight="900">R$ {Number(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></Stack>
                                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color={estaPago ? "success.main" : "warning.main"} fontWeight="bold">{entradaConfirmada ? "✓ Entrada confirmada • saldo na conclusão" : statusPagamento === 'PAGO' ? "✓ Pagamento confirmado" : "Aguardando pagamento da entrada"}</Typography>
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        color={estaPago ? "warning" : "inherit"}
                                                        size="medium"
                                                        fullWidth
                                                        disabled={!estaPago}
                                                        startIcon={<PlayArrow />}
                                                        sx={{ mt: 1.5, fontWeight: 'bold', borderRadius: '8px' }}
                                                        onClick={() => handleUpdateStatus(p.id, 'iniciar')}
                                                    >
                                                        {estaPago ? (perfilOperacional === 'DELIVERY' ? "Aceitar e Preparar" : "Aceitar e Iniciar") : "Aguardando Pagamento"}
                                                    </Button>
                                                </Paper>
                                            );
                                        })}
                                </Stack>
                            </Paper>

                            {/* EM ANDAMENTO MOBILE */}
                            <Paper sx={{ bgcolor: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', overflow: 'hidden' }}>
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography fontWeight="900" color="primary.main" variant="subtitle2">
                                        {perfilOperacional === 'DELIVERY' ? "2. NA COZINHA" : perfilOperacional === 'PRODUTO' ? "2. EM PRODUÇÃO" : "2. ATENDIMENTO ATIVO"}
                                    </Typography>
                                    <Chip label={ofertasAll.filter(ofertaEmAndamento).length} color="primary" size="small" />
                                </Box>
                                <Divider />
                                <Stack spacing={1.5} sx={{ p: 2, maxHeight: '350px', overflowY: 'auto' }}>
                                    {ofertasAll
                                        .filter((o: any) => ofertaEmAndamento(o) && ofertaCombinaPesquisa(o))
                                        .map((p: any) => (
                                            <Paper key={p.id} sx={{ p: 2, borderLeft: '4px solid #3b82f6', borderRadius: '8px', boxShadow: 1, bgcolor: 'white' }}>
                                                <Typography variant="subtitle2" fontWeight="900" sx={{ textTransform: 'uppercase' }}>{p.solicitacao_titulo || p.titulo || "Serviço contratado"}</Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">Morador: <b>{p.cliente_nome || "Cliente GranConecta"}</b></Typography>
                                                {p.cliente_unidade && <Typography variant="caption" color="text.secondary" display="block">Unidade: <b>{p.cliente_unidade}</b></Typography>}
                                                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}><Typography variant="caption">Contrato</Typography><Typography variant="caption" fontWeight="900">R$ {Number(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></Stack>
                                                {String(p.pagamento_status || "").toUpperCase() === 'PARCIALMENTE_PAGO' && <Typography variant="caption" color="success.main" fontWeight="bold" display="block">✓ Entrada paga • saldo após conclusão</Typography>}
                                                {perfilOperacional === 'SERVICO' && renderResumoAgendaContrato(p)}
                                                <Button component="label" variant="outlined" size="medium" fullWidth startIcon={uploadingImage === p.id ? <CircularProgress size={14} /> : <CloudUpload />} sx={{ mt: 1.5, borderRadius: '8px' }}>
                                                    {perfilOperacional === 'SERVICO' ? "Anexar Relatório" : "Foto do Andamento"}
                                                    <input type="file" accept="image/*" hidden onChange={(e) => handleUploadEtapaFoto(p.id, e)} />
                                                </Button>
                                                {perfilOperacional !== 'SERVICO' && (
                                                    <Button variant="contained" color="primary" size="medium" fullWidth startIcon={<CheckCircle />} sx={{ mt: 1, fontWeight: 'bold', borderRadius: '8px' }} onClick={() => handleUpdateStatus(p.id, 'concluir')}>Pronto para Envio</Button>
                                                )}
                                            </Paper>
                                        ))}
                                </Stack>
                            </Paper>
                        </Stack>
                    ) : (
                        /* 💻 VISÃO DESKTOP KANBAN */
                        <Box sx={{ overflowX: 'auto', width: '100%', pb: 2 }}>
                            <Grid container spacing={2} sx={{ minWidth: 1100, height: 'calc(100vh - 280px)' }}>
                                {/* COLUNA 1: NOVOS CONTRATOS */}
                                <Grid size={{ xs: 3 }} sx={{ height: '100%' }}>
                                    <Paper sx={{ p: 2, bgcolor: '#fffbeb', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography fontWeight="900" color="warning.main">
                                                {perfilOperacional === 'DELIVERY' && "1. NOVOS PEDIDOS"}
                                                {perfilOperacional === 'PRODUTO' && "1. NOVAS VENDAS"}
                                                {perfilOperacional === 'SERVICO' && "1. NOVOS CONTRATOS"}
                                            </Typography>
                                            <Chip label={ofertasAll.filter(ofertaAguardandoInicio).length} color="warning" size="small" />
                                        </Stack>
                                        <Stack spacing={1.5} sx={{ overflowY: 'auto', flexGrow: 1, pr: 0.5 }}>
                                            {ofertasAll
                                                .filter((o: any) => ofertaAguardandoInicio(o) && ofertaCombinaPesquisa(o))
                                                .map((p: any) => {
                                                    const statusPagamento = String(p.pagamento_status || "").toUpperCase();
                                                    const estaPago = ['PAGO', 'PARCIALMENTE_PAGO'].includes(statusPagamento);
                                                    const entradaConfirmada = statusPagamento === 'PARCIALMENTE_PAGO';
                                                    return (
                                                        <Paper key={p.id} sx={{ p: 1.5, borderLeft: '4px solid #f59e0b', borderRadius: '8px', boxShadow: 1 }}>
                                                            <Typography variant="subtitle2" fontWeight="900" sx={{ textTransform: 'uppercase' }}>{p.solicitacao_titulo || p.titulo || "Serviço contratado"}</Typography>
                                                            <Typography variant="caption" color="text.secondary" display="block">Morador: <b>{p.cliente_nome || "Cliente GranConecta"}</b></Typography>
                                                            {p.cliente_unidade && <Typography variant="caption" color="text.secondary" display="block">Unidade: <b>{p.cliente_unidade}</b></Typography>}
                                                            <Box sx={{ mt: 1.25, p: 1.1, bgcolor: '#fffaf0', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                                                <Stack direction="row" justifyContent="space-between"><Typography variant="caption">Contrato</Typography><Typography variant="caption" fontWeight="900">R$ {Number(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></Stack>
                                                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color={estaPago ? "success.main" : "warning.main"} fontWeight="bold">{entradaConfirmada ? "✓ Entrada confirmada • saldo na conclusão" : statusPagamento === 'PAGO' ? "✓ Pagamento confirmado" : "Aguardando pagamento da entrada"}</Typography>
                                                            </Box>
                                                            <Button
                                                                variant="contained"
                                                                color={estaPago ? "warning" : "inherit"}
                                                                size="small"
                                                                fullWidth
                                                                disabled={!estaPago}
                                                                startIcon={<PlayArrow />}
                                                                sx={{ mt: 1.5, fontSize: '11px', fontWeight: 'bold' }}
                                                                onClick={() => handleUpdateStatus(p.id, 'iniciar')}
                                                            >
                                                                {estaPago ? (perfilOperacional === 'DELIVERY' ? "Aceitar e Preparar" : "Aceitar e Iniciar") : "Aguardando Pagamento"}
                                                            </Button>
                                                        </Paper>
                                                    );
                                                })}
                                        </Stack>
                                    </Paper>
                                </Grid>
                                {/* COLUNA 2: EM ANDAMENTO */}
                                <Grid size={{ xs: 3 }} sx={{ height: '100%' }}>
                                    <Paper sx={{ p: 2, bgcolor: '#eff6ff', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography fontWeight="900" color="primary.main">
                                                {perfilOperacional === 'DELIVERY' && "2. NA COZINHA"}
                                                {perfilOperacional === 'PRODUTO' && "2. EM PRODUÇÃO"}
                                                {perfilOperacional === 'SERVICO' && "2. ATENDIMENTO ATIVO"}
                                            </Typography>
                                            <Chip label={ofertasAll.filter(ofertaEmAndamento).length} color="primary" size="small" />
                                        </Stack>
                                        <Stack spacing={1.5} sx={{ overflowY: 'auto', flexGrow: 1, pr: 0.5 }}>
                                            {ofertasAll
                                                .filter((o: any) => ofertaEmAndamento(o) && ofertaCombinaPesquisa(o))
                                                .map((p: any) => (
                                                    <Paper key={p.id} sx={{ p: 1.5, borderLeft: '4px solid #3b82f6', borderRadius: '8px', boxShadow: 1 }}>
                                                        <Typography variant="subtitle2" fontWeight="900" sx={{ textTransform: 'uppercase' }}>{p.solicitacao_titulo || p.titulo || "Serviço contratado"}</Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">Morador: <b>{p.cliente_nome || "Cliente GranConecta"}</b></Typography>
                                                        {p.cliente_unidade && <Typography variant="caption" color="text.secondary" display="block">Unidade: <b>{p.cliente_unidade}</b></Typography>}
                                                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}><Typography variant="caption">Contrato</Typography><Typography variant="caption" fontWeight="900">R$ {Number(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></Stack>
                                                        {String(p.pagamento_status || "").toUpperCase() === 'PARCIALMENTE_PAGO' && <Typography variant="caption" color="success.main" fontWeight="bold" display="block">✓ Entrada paga • saldo após conclusão</Typography>}
                                                        {perfilOperacional === 'SERVICO' && renderResumoAgendaContrato(p)}
                                                        <Button component="label" variant="outlined" size="small" fullWidth startIcon={uploadingImage === p.id ? <CircularProgress size={14} /> : <CloudUpload />} sx={{ mt: 1.5, fontSize: '11px' }}>
                                                            {perfilOperacional === 'SERVICO' ? "Anexar Relatório" : "Foto do Andamento"}
                                                            <input type="file" accept="image/*" hidden onChange={(e) => handleUploadEtapaFoto(p.id, e)} />
                                                        </Button>
                                                        {perfilOperacional !== 'SERVICO' && (
                                                            <Button variant="contained" color="primary" size="small" fullWidth startIcon={<CheckCircle />} sx={{ mt: 1, fontSize: '11px', fontWeight: 'bold' }} onClick={() => handleUpdateStatus(p.id, 'concluir')}>Pronto para Envio</Button>
                                                        )}
                                                    </Paper>
                                                ))}
                                        </Stack>
                                    </Paper>
                                </Grid>
                                {/* COLUNA 3: PRONTO */}
                                <Grid size={{ xs: 3 }} sx={{ height: '100%', display: perfilOperacional !== 'SERVICO' ? 'block' : 'none' }}>
                                    <Paper sx={{ p: 2, bgcolor: '#f0fdf4', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography fontWeight="900" color="success.main">
                                                {perfilOperacional === 'DELIVERY' ? "3. EXPEDIÇÃO MOTOBOY" : "3. RETIRADA DISPONÍVEL"}
                                            </Typography>
                                            <Chip label={ofertasAll.filter((o: any) => o.status === 'PRONTO').length} color="success" size="small" />
                                        </Stack>
                                        <Stack spacing={1.5} sx={{ overflowY: 'auto', flexGrow: 1, pr: 0.5 }}>
                                            {ofertasAll
                                                .filter((o: any) => o.status === 'PRONTO' && (o.cliente_nome?.toLowerCase().includes(pesquisa.toLowerCase()) || o.solicitacao_titulo?.toLowerCase().includes(pesquisa.toLowerCase())))
                                                .map((p: any) => (
                                                    <Paper key={p.id} sx={{ p: 1.5, borderLeft: '4px solid #10b981', borderRadius: '8px', boxShadow: 1 }}>
                                                        <Typography variant="subtitle2" fontWeight="bold">{p.solicitacao_titulo || p.titulo || "Serviço contratado"}</Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">Morador: {p.cliente_nome || "Cliente GranConecta"}</Typography>
                                                        <Button variant="contained" color="success" size="small" fullWidth startIcon={<LocalShipping />} sx={{ mt: 1.5, fontSize: '11px', fontWeight: 'bold' }} onClick={() => handleUpdateStatus(p.id, 'despachar')}>
                                                            {perfilOperacional === 'DELIVERY' ? "Despachar Motoboy" : "Registrar Retirada"}
                                                        </Button>
                                                    </Paper>
                                                ))}
                                        </Stack>
                                    </Paper>
                                </Grid>
                                {/* COLUNA 4: FINALIZADOS */}
                                <Grid size={{ xs: perfilOperacional === 'SERVICO' ? 6 : 3 }} sx={{ height: '100%' }}>
                                    <Paper sx={{ p: 2, bgcolor: '#f8fafc', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography fontWeight="900" color="text.secondary">
                                                {perfilOperacional === 'SERVICO' ? "3. CONTRATOS FINALIZADOS" : "4. ENTREGUES"}
                                            </Typography>
                                            <Chip label={ofertasAll.filter((o: any) => o.status === 'CONCLUIDA').length} color="default" size="small" />
                                        </Stack>
                                        <Stack spacing={1.5} sx={{ overflowY: 'auto', flexGrow: 1, pr: 0.5 }}>
                                            {ofertasAll
                                                .filter((o: any) => o.status === 'CONCLUIDA' && (o.cliente_nome?.toLowerCase().includes(pesquisa.toLowerCase()) || o.solicitacao_titulo?.toLowerCase().includes(pesquisa.toLowerCase())))
                                                .map((p: any) => (
                                                    <Paper key={p.id} sx={{ p: 1.5, borderLeft: '4px solid #64748b', borderRadius: '8px', opacity: 0.7 }}>
                                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ textDecoration: 'line-through' }}>{p.solicitacao_titulo}</Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">Morador: {p.cliente_nome || "Cliente GranConecta"}</Typography>
                                                        <Chip label={perfilOperacional === 'SERVICO' ? "Encerrado" : "Entregue"} size="small" sx={{ mt: 1, fontSize: '10px' }} color="success" variant="outlined" />
                                                    </Paper>
                                                ))}
                                        </Stack>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            )}

            {/* ABA 3: COMPONENTE DE AGENDA COMPARTILHADA DINÂMICA */}
            {tab === 3 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Pacientes / Contratos Ativos</Typography>
                        <Stack spacing={2}>
                            {ofertasAll
                                .filter(o => o.pagamento_status === 'PAGO' || ['EM_ANDAMENTO', 'EM_EXECUCAO', 'ACEITA'].includes(o.status))
                                .map((o: any) => {
                                    const agendaLiberada = o.agenda_liberada || ['EM_ANDAMENTO', 'EM_EXECUCAO'].includes(o.status);
                                    const isSelected = selectedServico?.id === o.id;
                                    const totalAgendadasDestePaciente = agenda.filter(item => String(item.ofertaId || item.oferta_id || "") === String(o.id)).length;

                                    return (
                                        <Paper
                                            key={o.id}
                                            sx={{
                                                p: 2,
                                                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease-in-out',
                                                bgcolor: isSelected ? '#f8fafc' : 'white',
                                                '&:hover': { borderColor: '#3b82f6', boxShadow: 2 }
                                            }}
                                            onClick={() => setSelectedServico(o)}
                                        >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography fontWeight="bold" variant="subtitle2" color={isSelected ? 'primary.main' : 'text.primary'}>
                                                        {o.solicitacao_titulo}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Paciente: <b>{o.cliente_nome}</b>
                                                    </Typography>
                                                </Box>
                                                <Chip size="small" label={`${totalAgendadasDestePaciente} agendada(s)`} color={totalAgendadasDestePaciente > 0 ? "primary" : "default"} variant={isSelected ? "filled" : "outlined"} />
                                            </Stack>

                                            {isSelected && (
                                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                                                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1.5 }}>
                                                        <Typography variant="caption" fontWeight="bold" color="success.main">
                                                            Progresso: {o.sessoesConcluidas || 0} de {o.totalSessoes} concluídas
                                                        </Typography>
                                                        <LinearProgress variant="determinate" value={((o.sessoesConcluidas || 0) / (o.totalSessoes || 1)) * 100} color="success" sx={{ mt: 0.5, height: 6, borderRadius: 2 }} />
                                                    </Box>

                                                    {!agendaLiberada ? (
                                                        <Box sx={{ p: 2, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 2, textAlign: 'center' }}>
                                                            <Typography variant="body2" color="warning.main" fontWeight="bold">Agenda Bloqueada</Typography>
                                                            <Typography variant="caption" color="text.secondary">Sinalize o início deste trabalho na esteira "Execução" para liberar.</Typography>
                                                        </Box>
                                                    ) : (
                                                        <Stack spacing={1.5}>
                                                            <Typography variant="caption" fontWeight="bold" color="text.secondary">Novo Agendamento:</Typography>
                                                            <TextField
                                                                label={`Nome da Sessão (Ex: Sessão ${(o.sessoesConcluidas || 0) + 1})`}
                                                                size="small"
                                                                fullWidth
                                                                value={descricaoAgenda[o.id] || ""}
                                                                onChange={(e) => setDescricaoAgenda({ ...descricaoAgenda, [o.id]: e.target.value })}
                                                            />
                                                            <Stack direction={isMobile ? "column" : "row"} spacing={1}>
                                                                <TextField type="date" size="small" fullWidth slotProps={{ htmlInput: { min: new Date().toISOString().split('T')[0] } }} value={novaData[o.id] || ""} onChange={(e) => setNovaData({ ...novaData, [o.id]: e.target.value })} />
                                                                <TextField type="time" size="small" fullWidth value={novaHora[o.id] || ""} onChange={(e) => setNovaHora({ ...novaHora, [o.id]: e.target.value })} />
                                                            </Stack>
                                                            <Button
                                                                variant="contained" size="small" startIcon={<CalendarMonth />}
                                                                disabled={(o.sessoesConcluidas || 0) + totalAgendadasDestePaciente >= o.totalSessoes}
                                                                onClick={() => handleCriarAgendamento(o.id)}
                                                            >
                                                                Agendar Horário
                                                            </Button>
                                                        </Stack>
                                                    )}
                                                </Box>
                                            )}
                                        </Paper>
                                    );
                                })}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                        {selectedServico ? (
                            <Box>
                                <Paper sx={{ p: 2, mb: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="primary.main">Agenda de {selectedServico.cliente_nome}</Typography>
                                    <Typography variant="caption" color="text.secondary">Cronograma de: <b>{selectedServico.solicitacao_titulo}</b> ({selectedServico.totalSessoes} sessões)</Typography>
                                </Paper>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Painel de Execução e Assinatura Digital</Typography>

                                <Stack spacing={2}>
                                    {agenda.filter(item => String(item.ofertaId || item.oferta_id || "") === String(selectedServico.id)).length > 0 ? (
                                        [...agenda]
                                            .filter(item => String(item.ofertaId || item.oferta_id || "") === String(selectedServico.id))
                                            .sort((a, b) => new Date(`${a.data.split('T')[0]}T${a.hora || '00:00:00'}`).getTime() - new Date(`${b.data.split('T')[0]}T${b.hora || '00:00:00'}`).getTime())
                                            .map((item: any) => {
                                                const agora = new Date();
                                                const dataLimpa = item.data.split('T')[0];
                                                const [ano, mes, dia] = dataLimpa.split('-');
                                                const dataSessao = new Date(`${dataLimpa}T${item.hora || '00:00:00'}`);

                                                const horarioPassou = dataSessao < agora;
                                                const isFuturo = dataSessao > agora;
                                                // const janelaJanelaCheckinAberta = (dataSessao.getTime() - agora.getTime()) <= (10 * 60 * 1000) && (dataSessao.getTime() - agora.getTime()) >= -(60 * 60 * 1000) && item.status === 'AGENDADO';
                                                const emFilaAssinatura = item.status === 'FILA_ASSINATURA' && item.status !== 'CONCLUIDO';

                                                return (
                                                    <Paper key={item.id} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: item.status === 'CONCLUIDO' ? '#f0fdf4' : 'white' }}>
                                                        <Grid container alignItems="center" spacing={2}>
                                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                                <Typography fontWeight="bold" variant="body2">{item.solicitacao_titulo}</Typography>
                                                                <Typography variant="caption" color="text.secondary" display="block">{item.descricao}</Typography>
                                                                <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                                                                    <Typography variant="caption" display="flex" alignItems="center" gap={0.5}><CalendarMonth sx={{ fontSize: 13 }} /> {`${dia}/${mes}/${ano}`}</Typography>
                                                                    <Typography variant="caption" display="flex" alignItems="center" gap={0.5}><Schedule sx={{ fontSize: 13 }} /> {item.hora}</Typography>
                                                                </Stack>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: 'right' } }}>
                                                                {/* LOGICA DE AÇÃO */}
                                                                {item.status === 'CONCLUIDO' && (
                                                                    <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                                                                        <Chip label="CONCLUÍDA & PAGA" color="success" size="small" icon={<Verified />} sx={{ fontWeight: 'bold' }} />
                                                                    </Stack>
                                                                )}

                                                                {item.status === 'AGENDADO' && isFuturo && (
                                                                    <Chip label="AGUARDANDO" color="default" size="small" variant="outlined" />
                                                                )}

                                                                {item.status === 'AGENDADO' && !isFuturo && (
                                                                    <Button
                                                                        variant="contained"
                                                                        color={horarioPassou ? "error" : "warning"}
                                                                        fullWidth
                                                                        onClick={() => horarioPassou
                                                                            ? handleAssinarEEncerrarSessao(item.id, item.ofertaId)
                                                                            : handleLiberarSessaoCliente(item.id)
                                                                        }
                                                                    >
                                                                        {horarioPassou ? "Encerrar Atrasado" : "Confirmar Presença"}
                                                                    </Button>
                                                                )}

                                                                {item.status === 'LIBERADO_CLIENTE' && (
                                                                    <Box sx={{ mt: 1 }}>
                                                                        <Chip label="EM ANDAMENTO" color="primary" size="small" icon={<PlayArrow />} sx={{ mb: 1 }} />
                                                                        <Button variant="contained" color="primary" fullWidth onClick={() => handleAssinarEEncerrarSessao(item.id, item.ofertaId)}>
                                                                            Coletar Assinatura e Encerrar
                                                                        </Button>
                                                                    </Box>
                                                                )}

                                                                {emFilaAssinatura && (
                                                                    <Button variant="contained" color="success" fullWidth onClick={() => handleAssinarEEncerrarSessao(item.id, item.ofertaId)}>
                                                                        Assinar Ata
                                                                    </Button>
                                                                )}
                                                            </Grid>
                                                        </Grid>
                                                    </Paper>
                                                );
                                            })
                                    ) : <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Nenhum horário agendado.</Paper>}
                                </Stack>
                            </Box>
                        ) : (
                            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px dashed #ccc', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '250px' }}>
                                <CalendarMonth sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="subtitle2" fontWeight="bold">Nenhum paciente selecionado</Typography>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            )}

            {/* ABA 4: FINANCEIRO */}
            {tab === 4 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        {(() => {
                            // A fonte de verdade é o backend.
                            // Não usamos o access token no frontend para decidir
                            // se a conta do Mercado Pago está conectada.
                            const mercadoPagoConectado =
                                userProfile?.mercadoPagoConectado === true;

                            return mercadoPagoConectado ? (
                                <Paper
                                    sx={{
                                        p: 2.5,
                                        bgcolor: '#f0fdf4',
                                        border: '1px solid #86efac',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                                        gap={2}
                                    >
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                color="success.main"
                                                fontWeight="bold"
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                            >
                                                <Verified sx={{ fontSize: 20 }} />
                                                Recebimento configurado
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 0.5 }}
                                            >
                                                Mercado Pago conectado. Os pagamentos integrados são
                                                acompanhados automaticamente pelo GranConecta.
                                            </Typography>
                                        </Box>

                                        <Chip
                                            label="MERCADO PAGO CONECTADO"
                                            color="success"
                                            size="small"
                                            icon={<Verified />}
                                            sx={{
                                                fontWeight: 800,
                                                flexShrink: 0
                                            }}
                                        />
                                    </Stack>
                                </Paper>
                            ) : (
                                <Paper
                                    sx={{
                                        p: 3,
                                        border: '1px solid #fca5a5',
                                        bgcolor: '#fef2f2',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <Stack direction="column" gap={2}>
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight="bold"
                                                color="error.main"
                                            >
                                                Configuração de Recebimento Pendente
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Para receber pagamentos integrados pelo GranConecta,
                                                vincule sua conta do Mercado Pago.
                                            </Typography>
                                        </Box>

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Paid />}
                                            onClick={async () => {
                                                try {
                                                    const res = await api.get(
                                                        '/pagamentos/link-conexao-bancaria'
                                                    );

                                                    window.location.href = res.data.url;
                                                } catch (error) {
                                                    console.error(
                                                        'Erro ao iniciar conexão com Mercado Pago:',
                                                        error
                                                    );

                                                    toast.error(
                                                        'Erro ao iniciar conexão segura.'
                                                    );
                                                }
                                            }}
                                        >
                                            Conectar Mercado Pago
                                        </Button>
                                    </Stack>
                                </Paper>
                            );
                        })()}
                    </Grid>

                    {/* CENTRAL FINANCEIRA: contrato, entrada, saldo, custódia e repasse */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="h6" fontWeight="900">
                                Histórico de Faturamento e Lançamentos
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Acompanhe quanto o cliente já pagou, o saldo pendente, as datas dos pagamentos e o valor efetivamente liberado para você.
                            </Typography>
                        </Box>

                        {faturasCompletas.length > 0 ? (
                            <TableContainer
                                component={Paper}
                                sx={{
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: 1,
                                    overflowX: 'auto'
                                }}
                            >
                                <Table sx={{ minWidth: 1450 }}>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 190 }}>Serviço / Cliente</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Contrato</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 190 }}>Pagamento</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 210 }}>Entrada</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 230 }}>Saldo</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 130 }}>Em Custódia</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', minWidth: 130 }}>Liberado</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 110 }}>Ações</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {faturasCompletas.map((fatura: any) => {
                                            const statusPg = String(
                                                fatura?.pagamento_status || fatura?.status || ""
                                            ).toUpperCase();

                                            const valorTotal = Number(fatura?.valor_total ?? fatura?.valor ?? 0);
                                            const valorPago = Number(
                                                fatura?.valor_pago ??
                                                (statusPg === 'PAGO' ? valorTotal : 0)
                                            );
                                            const valorPendente = Number(
                                                fatura?.valor_pendente ?? Math.max(0, valorTotal - valorPago)
                                            );
                                            const percentualPago = Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    Number(
                                                        fatura?.percentual_pago ??
                                                        (valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0)
                                                    )
                                                )
                                            );

                                            const valorLiberado = Number(fatura?.valor_liberado ?? 0);
                                            const valorEmCustodia = Math.max(0, valorPago - valorLiberado);

                                            const entrada = fatura?.entrada ||
                                                (Array.isArray(fatura?.transacoes)
                                                    ? fatura.transacoes.find((t: any) => String(t?.tipo || '').toUpperCase() === 'ENTRADA')
                                                    : null);

                                            const saldo = fatura?.saldo ||
                                                (Array.isArray(fatura?.transacoes)
                                                    ? fatura.transacoes.find((t: any) => String(t?.tipo || '').toUpperCase() === 'SALDO')
                                                    : null);

                                            const statusEntrada = String(entrada?.status || '').toUpperCase();
                                            const statusSaldo = String(saldo?.status || '').toUpperCase();

                                            const pagamentoConcluido = statusPg === 'PAGO' || percentualPago >= 100;
                                            const pagamentoParcial = statusPg === 'PARCIALMENTE_PAGO' || (valorPago > 0 && valorPendente > 0);

                                            const statusLabel = pagamentoConcluido
                                                ? 'PAGO'
                                                : pagamentoParcial
                                                    ? 'PARCIALMENTE PAGO'
                                                    : 'PENDENTE';

                                            const statusColor: 'success' | 'warning' | 'default' = pagamentoConcluido
                                                ? 'success'
                                                : pagamentoParcial
                                                    ? 'warning'
                                                    : 'default';

                                            const formatarDataFinanceira = (valor: any) => {
                                                if (!valor) return '—';
                                                const data = new Date(valor);
                                                if (Number.isNaN(data.getTime())) return '—';
                                                return data.toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });
                                            };

                                            return (
                                                <TableRow key={fatura.id} hover sx={{ verticalAlign: 'top' }}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="900">
                                                            {fatura.exibir_titulo}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.4 }}>
                                                            {fatura.exibir_nome}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled" display="block">
                                                            #{String(fatura?.ofertaId || fatura?.oferta_id || fatura?.oferta?.id || fatura?.id || '').slice(0, 8)}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="900">
                                                            R$ {formatarMoeda(valorTotal)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Valor contratado
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            label={statusLabel}
                                                            color={statusColor}
                                                            size="small"
                                                            variant={pagamentoConcluido ? 'filled' : 'outlined'}
                                                            sx={{ fontWeight: 900, mb: 1 }}
                                                        />

                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={percentualPago}
                                                            color={pagamentoConcluido ? 'success' : 'warning'}
                                                            sx={{ height: 7, borderRadius: 999, mb: 0.8 }}
                                                        />

                                                        <Typography variant="caption" fontWeight="800" display="block">
                                                            R$ {formatarMoeda(valorPago)} pago de R$ {formatarMoeda(valorTotal)}
                                                        </Typography>
                                                        <Typography variant="caption" color={valorPendente > 0 ? 'warning.main' : 'success.main'} display="block">
                                                            {valorPendente > 0
                                                                ? `R$ ${formatarMoeda(valorPendente)} restante`
                                                                : 'Pagamento integral concluído'}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        {entrada ? (
                                                            <Stack spacing={0.45}>
                                                                <Typography variant="body2" fontWeight="900">
                                                                    R$ {formatarMoeda(entrada?.valor)}
                                                                </Typography>
                                                                <Chip
                                                                    label={['PAGO', 'PAGO_EXTERNAMENTE'].includes(statusEntrada) ? 'PAGA' : (statusEntrada || 'PENDENTE')}
                                                                    color={['PAGO', 'PAGO_EXTERNAMENTE'].includes(statusEntrada) ? 'success' : 'warning'}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
                                                                />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {['PAGO', 'PAGO_EXTERNAMENTE'].includes(statusEntrada)
                                                                        ? `Pago em ${formatarDataFinanceira(entrada?.data_pagamento || entrada?.updated_at)}`
                                                                        : 'Aguardando pagamento'}
                                                                </Typography>
                                                                {entrada?.meio_pagamento && (
                                                                    <Typography variant="caption" color="text.disabled">
                                                                        {String(entrada.meio_pagamento).replace(/_/g, ' ')}
                                                                    </Typography>
                                                                )}
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="caption" color="text.disabled">Sem entrada separada</Typography>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {saldo ? (
                                                            <Stack spacing={0.45}>
                                                                <Typography variant="body2" fontWeight="900">
                                                                    R$ {formatarMoeda(saldo?.valor)}
                                                                </Typography>
                                                                <Chip
                                                                    label={['PAGO', 'PAGO_EXTERNAMENTE'].includes(statusSaldo) ? 'PAGO' : (statusSaldo || 'PENDENTE')}
                                                                    color={['PAGO', 'PAGO_EXTERNAMENTE'].includes(statusSaldo) ? 'success' : 'warning'}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
                                                                />

                                                                {['PAGO', 'PAGO_EXTERNAMENTE'].includes(statusSaldo) ? (
                                                                    <Typography variant="caption" color="success.main">
                                                                        Pago em {formatarDataFinanceira(saldo?.data_pagamento || saldo?.updated_at)}
                                                                    </Typography>
                                                                ) : (
                                                                    <>
                                                                        <Typography variant="caption" color="warning.main" fontWeight="700">
                                                                            Aguardando pagamento do saldo
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {String(saldo?.gatilho_tipo || '').toUpperCase() === 'CONCLUSAO'
                                                                                ? 'Cobrança vinculada à conclusão do serviço'
                                                                                : saldo?.descricao || 'Pagamento ainda não realizado'}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                            </Stack>
                                                        ) : valorPendente > 0 ? (
                                                            <Stack spacing={0.4}>
                                                                <Typography variant="body2" fontWeight="900">
                                                                    R$ {formatarMoeda(valorPendente)}
                                                                </Typography>
                                                                <Typography variant="caption" color="warning.main">
                                                                    Pendente
                                                                </Typography>
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="caption" color="success.main" fontWeight="bold">Quitado</Typography>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight="900"
                                                            color={valorEmCustodia > 0 ? 'warning.main' : 'text.disabled'}
                                                        >
                                                            {valorEmCustodia > 0 ? `R$ ${formatarMoeda(valorEmCustodia)}` : '—'}
                                                        </Typography>
                                                        {valorEmCustodia > 0 && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Pago pelo cliente e ainda retido
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight="900"
                                                            color={valorLiberado > 0 ? 'success.main' : 'text.disabled'}
                                                        >
                                                            {valorLiberado > 0 ? `R$ ${formatarMoeda(valorLiberado)}` : '—'}
                                                        </Typography>
                                                        {valorLiberado > 0 && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Disponibilizado ao prestador
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    <TableCell sx={{ textAlign: 'center' }}>
                                                        {!pagamentoConcluido && (
                                                            <Button
                                                                variant="outlined"
                                                                color="warning"
                                                                size="small"
                                                                startIcon={<NotificationsActive />}
                                                                onClick={() => handleEnviarAlerta(fatura.id)}
                                                                sx={{ fontSize: '10px', fontWeight: 800, textTransform: 'none' }}
                                                            >
                                                                Cobrar
                                                            </Button>
                                                        )}
                                                        {pagamentoConcluido && (
                                                            <Chip label="Quitado" color="success" size="small" variant="outlined" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px dashed #ccc' }}>
                                Nenhum lançamento financeiro registrado até o momento.
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            )}

            {tab === 5 && <Box sx={{ mt: 2 }}><Gerador tipo="PRESTADOR" /></Box>}
            {tab === 6 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ mb: 1 }}>Publicidade</Typography>
                    {loadingBanners ? <CircularProgress size={20} /> : <ListaMeusBanners banners={meusBanners} />}
                    <Divider sx={{ my: 4 }} />
                    <CriarBanner onSuccess={carregarBanners} />
                </Box>
            )}
            {tab === 7 && ehVendedor && (
                <Box sx={{ mt: 2 }}>
                    <Stack direction={isMobile ? "column" : "row"} justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"} gap={2} sx={{ mb: 3 }}>
                        <Typography variant="h5" fontWeight="900">{(userProfile?.categoriaTipo || userProfile?.categoria)?.toUpperCase() === 'AUTOMOTIVO' ? 'Meu Estoque de Veículos' : 'Meus Produtos'}</Typography>
                        <Button variant="contained" fullWidth={isMobile} startIcon={<AddCircleOutline />} onClick={() => setProductModalOpen(true)}>Cadastrar Novo</Button>
                    </Stack>
                    <Grid container spacing={2}>
                        {meusProdutos.map((prod: any) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={prod.id}>
                                <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <Box component="img" src={prod.imagem_url || 'https://via.placeholder.com/300'} sx={{ width: '100%', height: 180, objectFit: 'cover' }} />
                                    <Box sx={{ p: 2 }}>
                                        <Typography fontWeight="bold" variant="subtitle1">{prod.nome}</Typography>
                                        <Typography color="primary" fontWeight="900">R$ {formatarMoeda(prod.preco)}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
            {tab === 8 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ mb: 2 }}>
                        Contatos via Site Profissional
                    </Typography>
                    <ListaLeads leads={leadsInteracoes} />
                </Box>
            )}
            {tab === 9 && (
                <Box sx={{ mt: 2 }}>
                    <StoreChatbotKnowledgeManager
                        storeId={
                            userProfile?.store_id ||
                            userProfile?.lojaId ||
                            userProfile?.id ||
                            ""
                        }
                    />
                </Box>
            )}

            {/* ABA 11: EQUIPE DO NEGÓCIO */}
            {tab === 11 && (
                <Box sx={{ mt: 2 }}>
                    <BusinessTeamManager />
                </Box>
            )}
            {/* DETALHE DA OPORTUNIDADE / NEGOCIAÇÃO */}
            <Dialog
                open={centralOpportunityOpen}
                onClose={fecharOportunidadeCentral}
                fullWidth
                maxWidth="md"
                fullScreen={isMobile}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                        <Box>
                            <Typography variant="h6" fontWeight="900">Negociação</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Jornada comercial completa da oportunidade
                            </Typography>
                        </Box>
                        <Button onClick={fecharOportunidadeCentral}>Fechar</Button>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers>
                    {centralOpportunityLoading ? (
                        <Box sx={{ py: 7, textAlign: "center" }}>
                            <CircularProgress size={30} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Carregando negociação...
                            </Typography>
                        </Box>
                    ) : centralOpportunityError ? (
                        <Paper sx={{ p: 2.5, borderRadius: "14px", border: "1px solid", borderColor: "error.light" }}>
                            <Typography color="error.main" fontWeight="bold">
                                {centralOpportunityError}
                            </Typography>
                        </Paper>
                    ) : centralOpportunityDetail ? (
                        <Stack spacing={2.5}>
                            {(() => {
                                const op = centralOpportunityDetail;
                                const customer = op?.customer || {};
                                const business = op?.business || {};
                                const origin = op?.origin || {};
                                const interest = op?.interest || {};
                                const flow = op?.flow || {};
                                const conversation = op?.conversation || {};
                                const campaign = op?.campaign || {};

                                const valor =
                                    flow?.amount ??
                                    interest?.catalogItemPromotionalPrice ??
                                    interest?.catalogItemPrice ??
                                    0;

                                let dataPreferida = flow?.preferredDate || "—";
                                if (flow?.preferredDate) {
                                    const dt = new Date(flow.preferredDate);
                                    if (!Number.isNaN(dt.getTime())) {
                                        dataPreferida = dt.toLocaleDateString("pt-BR");
                                    }
                                }

                                return (
                                    <>
                                        <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                                            <Stack
                                                direction={isMobile ? "column" : "row"}
                                                justifyContent="space-between"
                                                alignItems={isMobile ? "flex-start" : "center"}
                                                gap={2}
                                            >
                                                <Box>
                                                    <Typography variant="h5" fontWeight="900">
                                                        {customer?.name || "Cliente"}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {customer?.email || "E-mail não informado"}
                                                        {customer?.phone ? ` • ${customer.phone}` : ""}
                                                    </Typography>


                                                </Box>

                                                <Box sx={{ textAlign: isMobile ? "left" : "right" }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Valor da negociação
                                                    </Typography>
                                                    <Typography variant="h5" fontWeight="900">
                                                        {Number(valor || 0) > 0 ? `R$ ${formatarMoeda(valor)}` : "—"}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
                                                    <Typography fontWeight="900" sx={{ mb: 1.5 }}>Interesse</Typography>
                                                    <Stack spacing={1}>
                                                        <Typography variant="body2">
                                                            <strong>Item:</strong> {interest?.catalogItemName || "Não selecionado"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Tipo:</strong> {interest?.catalogItemType || "—"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Categoria:</strong> {interest?.categoryId || "—"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Resumo:</strong> {interest?.qualificationSummary || "Sem resumo de qualificação"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Respostas de qualificação:</strong> {interest?.answersCount || 0}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
                                                    <Typography fontWeight="900" sx={{ mb: 1.5 }}>Origem</Typography>
                                                    <Stack spacing={1}>
                                                        <Typography variant="body2">
                                                            <strong>Canal:</strong> {rotuloCanal(origin?.channel)}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Campanha:</strong> {campaign?.name || origin?.campaignName || "Espontânea"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Negócio:</strong> {business?.storeName || "—"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Conversa:</strong> {conversation?.status || "Sem conversa ativa"}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            </Grid>
                                        </Grid>

                                        <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                                            <Typography fontWeight="900" sx={{ mb: 2 }}>Fluxo comercial</Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Estado atual</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{flow?.state || "—"}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Data pretendida</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{dataPreferida}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Horário</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{flow?.preferredTime || "—"}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Sessões</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{flow?.totalSessions || 1}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Solicitação</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{flow?.solicitacaoId ? "Criada" : "Pendente"}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Oferta</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{flow?.ofertaId ? "Criada" : "Pendente"}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Pagamento</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{flow?.paymentId ? "Registrado" : "Pendente"}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">Agenda</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{flow?.agendaId ? "Agendado" : "Pendente"}</Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>

                                        <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                                            <Stack
                                                direction={isMobile ? "column" : "row"}
                                                justifyContent="space-between"
                                                alignItems={isMobile ? "flex-start" : "center"}
                                                gap={2}
                                                sx={{ mb: 2 }}
                                            >
                                                <Box>
                                                    <Typography fontWeight="900">
                                                        Atendimento humano
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        A conversa fica vinculada a um atendente por vez, evitando respostas duplicadas.
                                                    </Typography>
                                                </Box>

                                                {conversation?.status === "AGUARDANDO_ATENDENTE" &&
                                                    !conversation?.atendenteId && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={assumirAtendimentoCentral}
                                                            disabled={centralHumanTaking}
                                                        >
                                                            {centralHumanTaking
                                                                ? "Assumindo..."
                                                                : "Assumir atendimento"}
                                                        </Button>
                                                    )}
                                            </Stack>

                                            {!conversation?.conversationId ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    Esta oportunidade ainda não possui uma conversa vinculada.
                                                </Typography>
                                            ) : conversation?.atendenteId &&
                                                String(conversation.atendenteId) !== currentAtendenteId ? (
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: "12px",
                                                        bgcolor: "#fff7ed",
                                                        border: "1px solid #fed7aa",
                                                    }}
                                                >
                                                    <Typography fontWeight="bold">
                                                        Atendimento em andamento por outro atendente
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        Você continua acompanhando a oportunidade pela Central Comercial,
                                                        mas somente o atendente responsável pode responder ou finalizar esta conversa.
                                                    </Typography>
                                                </Paper>
                                            ) : conversation?.atendenteId &&
                                                String(conversation.atendenteId) === currentAtendenteId ? (
                                                <Stack spacing={2}>
                                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                                        <Chip
                                                            size="small"
                                                            color="success"
                                                            label="Atendimento com você"
                                                        />
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label={conversation?.status || "EM_ATENDIMENTO_HUMANO"}
                                                        />
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() =>
                                                                carregarMensagensCentral(
                                                                    conversation.conversationId
                                                                )
                                                            }
                                                            disabled={centralHumanLoading}
                                                        >
                                                            Atualizar conversa
                                                        </Button>
                                                    </Stack>

                                                    <Box
                                                        sx={{
                                                            minHeight: 180,
                                                            maxHeight: 320,
                                                            overflowY: "auto",
                                                            bgcolor: "#f8fafc",
                                                            borderRadius: "12px",
                                                            p: 2,
                                                            border: "1px solid #e2e8f0",
                                                        }}
                                                    >
                                                        {centralHumanLoading ? (
                                                            <Box sx={{ py: 3, textAlign: "center" }}>
                                                                <CircularProgress size={24} />
                                                            </Box>
                                                        ) : centralHumanMessages.length === 0 ? (
                                                            <Stack alignItems="center" spacing={1} sx={{ py: 3 }}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Clique em “Atualizar conversa” para carregar o histórico.
                                                                </Typography>
                                                            </Stack>
                                                        ) : (
                                                            <Stack spacing={1.25}>
                                                                {centralHumanMessages.map((message: any) => {
                                                                    const isCustomer =
                                                                        message?.role === "user";

                                                                    return (
                                                                        <Box
                                                                            key={message?.id}
                                                                            sx={{
                                                                                alignSelf: isCustomer
                                                                                    ? "flex-start"
                                                                                    : "flex-end",
                                                                                maxWidth: "82%",
                                                                                p: 1.25,
                                                                                borderRadius: "12px",
                                                                                bgcolor: isCustomer
                                                                                    ? "#ffffff"
                                                                                    : "#0f172a",
                                                                                color: isCustomer
                                                                                    ? "#0f172a"
                                                                                    : "#ffffff",
                                                                                border: isCustomer
                                                                                    ? "1px solid #e2e8f0"
                                                                                    : "none",
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{ whiteSpace: "pre-wrap" }}
                                                                            >
                                                                                {message?.content}
                                                                            </Typography>

                                                                            {message?.createdAt && (
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        display: "block",
                                                                                        mt: 0.5,
                                                                                        opacity: 0.7,
                                                                                    }}
                                                                                >
                                                                                    {formatarDataHora(message.createdAt)}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        )}
                                                    </Box>

                                                    <Stack
                                                        direction={isMobile ? "column" : "row"}
                                                        spacing={1}
                                                        alignItems="stretch"
                                                    >
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            maxRows={4}
                                                            value={centralHumanReply}
                                                            onChange={(event) =>
                                                                setCentralHumanReply(
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="Digite sua resposta ao cliente..."
                                                            onKeyDown={(event) => {
                                                                if (
                                                                    event.key === "Enter" &&
                                                                    !event.shiftKey
                                                                ) {
                                                                    event.preventDefault();
                                                                    enviarRespostaCentral();
                                                                }
                                                            }}
                                                        />

                                                        <Button
                                                            variant="contained"
                                                            onClick={enviarRespostaCentral}
                                                            disabled={
                                                                centralHumanSending ||
                                                                !centralHumanReply.trim()
                                                            }
                                                            sx={{
                                                                minWidth: isMobile
                                                                    ? "100%"
                                                                    : 110,
                                                            }}
                                                        >
                                                            {centralHumanSending
                                                                ? "Enviando..."
                                                                : "Enviar"}
                                                        </Button>
                                                    </Stack>

                                                    <Stack
                                                        direction={isMobile ? "column" : "row"}
                                                        justifyContent="space-between"
                                                        gap={1}
                                                    >
                                                        <Typography variant="caption" color="text.secondary">
                                                            Outros atendentes podem continuar trabalhando nas demais conversas
                                                            do negócio ao mesmo tempo.
                                                        </Typography>

                                                        <Button
                                                            color="success"
                                                            variant="outlined"
                                                            onClick={finalizarAtendimentoCentral}
                                                            disabled={centralHumanFinishing}
                                                        >
                                                            {centralHumanFinishing
                                                                ? "Finalizando..."
                                                                : "Finalizar atendimento"}
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            ) : conversation?.status === "AGUARDANDO_ATENDENTE" ? (
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: "12px",
                                                        bgcolor: "#fffbeb",
                                                        border: "1px solid #fde68a",
                                                    }}
                                                >
                                                    <Typography fontWeight="bold">
                                                        Cliente aguardando um atendente
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        Qualquer atendente disponível pode assumir. Se dois tentarem ao mesmo tempo,
                                                        o backend mantém apenas o primeiro como responsável.
                                                    </Typography>
                                                </Paper>
                                            ) : (
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: "12px",
                                                        bgcolor: "#f8fafc",
                                                        border: "1px solid #e2e8f0",
                                                    }}
                                                >
                                                    <Typography fontWeight="bold">
                                                        Atendimento com o Conecta
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        O cliente ainda não está aguardando atendimento humano.
                                                        A Central Comercial continua acompanhando normalmente a negociação.
                                                    </Typography>
                                                </Paper>
                                            )}
                                        </Paper>

                                        <Paper sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                                            <Typography fontWeight="900" sx={{ mb: 2 }}>Linha do tempo</Typography>
                                            <Stack spacing={1.5}>
                                                {[
                                                    ["Oportunidade criada", op?.createdAt],
                                                    ["Negócio selecionado", op?.businessSelectedAt],
                                                    ["Negociação iniciada", op?.negotiationStartedAt],
                                                    ["Negócio acessado", op?.businessAccessedAt],
                                                    ["Qualificação iniciada", op?.qualificationStartedAt],
                                                    ["Qualificação concluída", op?.qualificationCompletedAt],
                                                    ["Opções apresentadas", op?.optionsPresentedAt],
                                                    ["Convertida", op?.convertedAt],
                                                ]
                                                    .filter(([, date]) => Boolean(date))
                                                    .map(([label, date]) => (
                                                        <Stack
                                                            key={String(label)}
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            gap={2}
                                                            sx={{ pb: 1.25, borderBottom: "1px solid #f1f5f9" }}
                                                        >
                                                            <Typography variant="body2" fontWeight="bold">{label}</Typography>
                                                            <Typography variant="body2" color="text.secondary" textAlign="right">
                                                                {formatarDataHora(date)}
                                                            </Typography>
                                                        </Stack>
                                                    ))}
                                            </Stack>
                                        </Paper>

                                        <Stack direction={isMobile ? "column" : "row"} justifyContent="flex-end" gap={1}>
                                            <Button
                                                variant="outlined"
                                                disabled={!conversation?.conversationId}
                                                onClick={() => {
                                                    const oportunidadeAtual = centralOpportunityDetail;
                                                    fecharOportunidadeCentral();

                                                    if (oportunidadeAtual) {
                                                        abrirFilaHumanaDaOportunidade(oportunidadeAtual);
                                                    }
                                                }}
                                            >
                                                Abrir atendimentos
                                            </Button>
                                            <Button variant="contained" onClick={fecharOportunidadeCentral}>
                                                Fechar
                                            </Button>
                                        </Stack>
                                    </>
                                );
                            })()}
                        </Stack>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* AREA DOS MODAIS */}
            <Dialog
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                fullWidth
                maxWidth="md"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 4,
                        overflow: "hidden",
                        height: isMobile ? "100%" : "78vh",
                        maxHeight: isMobile ? "100vh" : 720,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: "#0f172a",
                        color: "white",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 2,
                    }}
                >
                    {humanInboxTitle}

                    <Button
                        onClick={() => setChatOpen(false)}
                        sx={{ color: "white", minWidth: "auto", fontWeight: 900 }}
                    >
                        ✕
                    </Button>
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{
                        p: 0,
                        height: "calc(100vh - 80px)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            p: isMobile ? 1.5 : 2,
                            overflow: "hidden",
                        }}
                    >
                        <HumanChatInbox
                            chatbotTipo={humanInboxChatbotTipo}
                            chatbotOwnerId={humanInboxOwnerId || chatbotOwnerId}
                            title={humanInboxTitle}
                        />
                    </Box>
                </DialogContent>
            </Dialog>

            <ModalCadastroProduto open={productModalOpen} onClose={() => setProductModalOpen(false)} storeId={userProfile?.id} onSuccess={carregarTudo} plan={userProfile?.plano || 'BASICO'} currentProductCount={meusProdutos.length} />
            {selectedServico && (
                <ModalCandidatar
                    open={modalOpen}
                    handleClose={() => setModalOpen(false)}
                    // Passe apenas os dados que o modal realmente precisa
                    servico={{
                        id: selectedServico.id,
                        titulo: selectedServico.titulo,
                        // Passe apenas strings/números necessários
                        nomeMorador: selectedServico.morador_nome,
                        enderecoResumido: selectedServico.bairro || selectedServico.endereco || ""
                    }}
                    onSuccess={() => { toast.success("Você assumiu este serviço!"); carregarTudo(); }}
                />
            )}

            {gerenciarOpen && candidaturaSelecionada && (
                <ModalGerenciarProposta
                    open={gerenciarOpen}
                    handleClose={() => {
                        setGerenciarOpen(false);
                        setCandidaturaSelecionada(null);
                    }}
                    proposta={candidaturaSelecionada}
                    onSuccess={carregarTudo}
                />
            )}
        </Container>
    );
}