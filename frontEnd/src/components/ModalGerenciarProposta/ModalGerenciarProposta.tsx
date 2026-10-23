// src/components/ModalGerenciarProposta/ModalGerenciarProposta.tsx
import { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Button, TextField, Stack, Typography, Divider, Box,
    InputAdornment, IconButton, Paper, alpha, Avatar, CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Close, Send, CheckCircle, AccountBalanceWallet,
    Person, LocationCity, HomeWork,
    MailOutline,
    PhoneAndroid,
    BadgeOutlined,
    LocationOn,
    CalendarMonth,
    ChatBubbleOutline
} from '@mui/icons-material';
import api from '../../api/api';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/config';

interface MensagemHistorico {
    id: number;
    mensagem: string;
    createdAt: string;
    autor?: string;
}

interface ModalProps {
    open: boolean;
    handleClose: () => void;
    proposta: any;
    servico?: any;
    onSuccess: () => void;
    onContraproposta?: (candidaturaId: string, novoValor: number, mensagem: string) => void | Promise<void>;
}

export default function ModalGerenciarProposta({
    open,
    handleClose,
    proposta,
    servico,
    onSuccess,
}: ModalProps) {
    // 🛡️ Trava de Segurança Crítica
    if (!open || !proposta) return null;

    const [loading, setLoading] = useState(false);
    const [loadingMorador, setLoadingMorador] = useState(false);
    const [dadosMorador, setDadosMorador] = useState<any>(null);
    const [_dadosCondominio, setDadosCondominio] = useState<any>(null);
    const [novoValor, setNovoValor] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [historico, setHistorico] = useState<MensagemHistorico[]>([]);
    const [totalSessoes, setTotalSessoes] = useState('1');
    const [loadingHistorico, setLoadingHistorico] = useState(false);

    // Identificadores baseados na estrutura do payload
    const candidaturaIdReal = proposta.candidaturas?.[0]?.id || proposta.candidaturaId || proposta.id;
    const statusAtual = String(
        proposta.candidaturas?.[0]?.status || proposta.status || ''
    ).toUpperCase();

    const isPropostaMorador = statusAtual === 'PROPOSTA_MORADOR';
    const isAceitoPeloPrestador = statusAtual === 'ACEITO_PRESTADOR';
    const isAcordoFechado = statusAtual === 'ACORDO_FECHADO';

    const mensagemHistorico = historico.length > 0
        ? historico[historico.length - 1].mensagem
        : (proposta?.mensagem || proposta?.observacao || proposta?.mensagem_proposta || proposta?.descricao);

    const carregarHistoricoNegociacao = useCallback(async () => {
        if (!candidaturaIdReal) return;

        setLoadingHistorico(true);
        try {
            const res = await api.get(`/servicos/candidato/negociacao/historico/${candidaturaIdReal}`);
            const dadosChat = Array.isArray(res.data) ? res.data : res.data?.historico || [];
            setHistorico(dadosChat);
        } catch (error) {
            console.error("Erro ao buscar histórico de negociação:", error);
        } finally {
            setLoadingHistorico(false);
        }
    }, [candidaturaIdReal]);

    const buscarDadosCompletos = useCallback(async () => {
        const sId = proposta?.solicitacao_id || proposta?.solicitacaoId || proposta?.id || servico?.id;
        if (!sId) return;

        setLoadingMorador(true);
        try {
            const response = await api.get(`/servicos/solicitacoes/${sId}`);
            const data = response.data;
            console.log("DADOS DO MORADOR RECEBIDOS:", data);
            const moradorEncontrado = data?.morador || data?.usuario || data?.customer || proposta?.morador;

            console.log('moradorEncontrado ', moradorEncontrado)

            if (moradorEncontrado) {
                setDadosMorador(moradorEncontrado);
                setDadosCondominio(moradorEncontrado.condominio || data.condominio);
            }
        } catch (error) {
            console.error("Erro detalhes morador/solicitação:", error);
        } finally {
            setLoadingMorador(false);
        }
    }, [proposta, servico]);


    const carregarTotalSessoes = useCallback(async () => {
        if (!candidaturaIdReal) return;

        try {
            const res = await api.get(`/servicos/candidato/candidaturas/${candidaturaIdReal}/sessoes`);

            setTotalSessoes(String(res.data?.total_sessoes || 1));
        } catch (error) {
            console.error("Erro ao buscar total de sessões:", error);
            setTotalSessoes("1");
        }
    }, [candidaturaIdReal]);


    const getTotalSessoes = (proposta: any) => {
        return (
            proposta?.candidaturas?.[0]?.total_sessoes ??
            proposta?.total_sessoes ??
            1
        );
    };

    useEffect(() => {
        if (open && proposta) {
            const valorPropostoBase = proposta.candidaturas?.[0]?.valor_proposto || proposta.valor_proposto || proposta.valor_sugerido;
            setNovoValor(valorPropostoBase?.toString() || '');
            setTotalSessoes(String(getTotalSessoes(proposta)));
            carregarTotalSessoes();
            setMensagem('');
            buscarDadosCompletos();
            carregarHistoricoNegociacao();
        }
    }, [proposta, open, buscarDadosCompletos, carregarHistoricoNegociacao, carregarTotalSessoes]);

    const handleAction = async (action: 'aceitar' | 'cancelar') => {
        if (!candidaturaIdReal) {
            toast.error("ID da negociação/candidatura inválido.");
            return;
        }

        setLoading(true);
        try {
            if (action === 'aceitar') {
                // O prestador aceita os termos correntes da proposta recebida
                await api.post('/servicos/candidato/candidaturas/aceitar', {
                    candidaturaId: candidaturaIdReal
                });
                toast.success("Contraproposta aceita! Agora o morador pode confirmar o acordo.");
            } else if (action === 'cancelar') {
                // O prestador declina/recusa explicitamente a proposta atual
                await api.post(`/servicos/candidato/candidaturas/${candidaturaIdReal}/recusar`);
                toast.success("Proposta recusada com sucesso.");
            }
            onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro na operação.");
        } finally { setLoading(false); }
    };

    const handleEnviarContraproposta = async () => {
        if (!candidaturaIdReal) {
            toast.error("Erro: ID da candidatura não encontrado.");
            return;
        }

        if (!novoValor || !mensagem) {
            toast.error("Preencha o valor e a mensagem descritiva do escopo.");
            return;
        }

        if (!totalSessoes || Number(totalSessoes) <= 0) {
            toast.error("A quantidade de sessões do cronograma deve ser maior que zero.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                autor: 'PRESTADOR',
                valor: Number(novoValor),
                mensagem: mensagem,
                totalSessoes: Number(totalSessoes)
            };


            console.log('payloaddddddddddddddddd ', payload)

            await api.post(`/servicos/candidato/candidaturas/${candidaturaIdReal}/responder`, payload);

            toast.success("Contraproposta enviada ao morador!");
            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error("Erro detalhado:", error.response?.data || error.message);
            toast.error("Erro ao enviar contraproposta.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle
                component="div"
                sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Typography variant="h6" fontWeight="800" component="span">
                    Negociação
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha('#3b82f6', 0.05), borderRadius: 3, border: '1px solid', borderColor: alpha('#3b82f6', 0.1) }}>
                            {loadingMorador ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}><CircularProgress size={20} /></Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar
                                            src={dadosMorador?.foto_perfil_url ? `${API_URL}${dadosMorador.foto_perfil_url}` : undefined}
                                            sx={{ width: 50, height: 50, border: '2px solid #fff' }}
                                        >
                                            {/* Forçamos a conversão para string e verificamos se é uma string válida */}
                                            {typeof dadosMorador?.name === 'string' && dadosMorador.name.length > 0
                                                ? dadosMorador.name.charAt(0).toUpperCase()
                                                : <Person />
                                            }
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                fontWeight="800"
                                                color="primary"
                                                sx={{ letterSpacing: 1.2, mb: 0.5, display: 'block', opacity: 0.8 }}
                                            >
                                                SOLICITANTE
                                            </Typography>

                                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', mb: 1.2, lineHeight: 1.2 }}>
                                                {dadosMorador?.name || proposta?.morador_nome || 'Cliente'}
                                            </Typography>

                                            <Stack spacing={0.5}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <MailOutline sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                                                        {dadosMorador?.email || 'E-mail não informado'}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <PhoneAndroid sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" fontWeight="500">
                                                        {dadosMorador?.telefone || 'Telefone não informado'}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <BadgeOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 0.5 }}>
                                                        Tipo:
                                                        <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                            {dadosMorador?.tipo || 'Não informado'}
                                                        </Box>
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ borderStyle: 'dashed' }} />

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            <LocationOn sx={{ fontSize: 14 }} /> {dadosMorador?.endereco?.logradouro || 'Endereço não informado'}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            <LocationCity sx={{ fontSize: 14 }} />
                                            {/* ACESSO CORRETO: .condominio.nome */}
                                            {dadosMorador?.endereco?.condominio?.nome || 'Condomínio não informado'}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <HomeWork sx={{ fontSize: 14 }} />
                                            Bloco: {dadosMorador?.endereco?.bloco_torre || '-'} | Unidade: {dadosMorador?.endereco?.unidade_apto || '-'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            )}
                        </Paper>
                    </Grid>

                    {loadingHistorico ? (
                        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Grid>
                    ) : mensagemHistorico && (
                        <Grid size={{ xs: 12 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    bgcolor: alpha('#f59e0b', 0.04),
                                    borderRadius: 3,
                                    border: '1px dashed',
                                    borderColor: alpha('#f59e0b', 0.25)
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <ChatBubbleOutline sx={{ fontSize: 16, color: '#d97706' }} />
                                    <Typography variant="caption" fontWeight="800" sx={{ color: '#d97706', letterSpacing: 0.5 }}>
                                        {historico.length > 0 ? "ÚLTIMA MENSAGEM DA NEGOCIAÇÃO" : "DESCRIÇÃO INICIAL DA SOLICITAÇÃO"}
                                    </Typography>
                                </Stack>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#475569',
                                        fontStyle: 'italic',
                                        whiteSpace: 'pre-line',
                                        lineHeight: 1.4
                                    }}
                                >
                                    "{mensagemHistorico}"
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                        {isAcordoFechado ? (
                            <Box sx={{ textAlign: 'center', p: 3, bgcolor: alpha('#10b981', 0.1), borderRadius: 3 }}>
                                <CheckCircle sx={{ color: '#10b981', fontSize: 40, mb: 1 }} />
                                <Typography variant="h6" fontWeight="bold" color="success.main">Acordo Fechado pelo Cliente!</Typography>
                                <Typography variant="caption" color="text.secondary">O serviço já foi contratado e está seguro.</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {isPropostaMorador && (
                                    <Stack spacing={1}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2.5,
                                                bgcolor: alpha('#10b981', 0.08),
                                                border: '1px solid',
                                                borderColor: alpha('#10b981', 0.22)
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight="800" color="success.main">
                                                O morador enviou uma contraproposta.
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Ao aceitar, o morador será liberado para confirmar o acordo e seguir para o pagamento.
                                            </Typography>
                                        </Box>

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={<CheckCircle />}
                                            onClick={() => handleAction('aceitar')}
                                            disabled={loading}
                                            sx={{
                                                py: 1.5,
                                                borderRadius: 3,
                                                fontWeight: 'bold',
                                                background: 'linear-gradient(45deg, #10b981 30%, #34d399 90%)'
                                            }}
                                        >
                                            {loading
                                                ? <CircularProgress size={24} color="inherit" />
                                                : `Aceitar Contraproposta${novoValor ? ` — R$ ${Number(novoValor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}`}
                                        </Button>
                                    </Stack>
                                )}

                                {isAceitoPeloPrestador && (
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha('#3b82f6', 0.1), borderRadius: 3 }}>
                                        <Typography variant="body2" color="primary" fontWeight="bold">
                                            Você aceitou esta proposta. Aguardando o morador realizar o pagamento para iniciar.
                                        </Typography>
                                    </Box>
                                )}

                                {!isAceitoPeloPrestador && (
                                    <Divider sx={{ my: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                            {isPropostaMorador ? 'OU FAZER NOVA CONTRAPROPOSTA' : 'ENVIAR NOVA PROPOSTA'}
                                        </Typography>
                                    </Divider>
                                )}

                                {!isAceitoPeloPrestador && (
                                    <>
                                <TextField
                                    fullWidth
                                    label="Seu Valor (R$)"
                                    type="number"
                                    value={novoValor}
                                    onChange={(e) => setNovoValor(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><AccountBalanceWallet color="primary" /></InputAdornment>,
                                        sx: { borderRadius: 3 }
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Quantidade de Sessões / Visitas"
                                    type="number"
                                    value={totalSessoes}
                                    onChange={(e) => setTotalSessoes(e.target.value)}
                                    inputProps={{ min: 1, max: 100 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><CalendarMonth color="primary" /></InputAdornment>,
                                        sx: { borderRadius: 3 }
                                    }}
                                    helperText="Sessões fracionadas inclusas neste valor"
                                />

                                <TextField
                                    fullWidth
                                    label="Mensagem"
                                    inputProps={{ 'navigator-ignore': 'true' }}
                                    multiline
                                    rows={2}
                                    value={mensagem}
                                    onChange={(e) => setMensagem(e.target.value)}
                                    InputProps={{ sx: { borderRadius: 3 } }}
                                />

                                <Button
                                    variant="contained"
                                    fullWidth
                                    endIcon={<Send />}
                                    onClick={handleEnviarContraproposta}
                                    disabled={loading || !novoValor}
                                    sx={{ py: 1.5, borderRadius: 3, fontWeight: 'bold', bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' } }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Enviar Contraproposta"}
                                </Button>
                                    </>
                                )}

                                <Stack direction="row" spacing={1}>
                                    <Button color="error" fullWidth onClick={() => handleAction('cancelar')} size="small" disabled={loading}>
                                        Declinar Proposta
                                    </Button>
                                    <Button color="inherit" fullWidth onClick={handleClose} size="small">
                                        Voltar
                                    </Button>
                                </Stack>
                            </Stack>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}