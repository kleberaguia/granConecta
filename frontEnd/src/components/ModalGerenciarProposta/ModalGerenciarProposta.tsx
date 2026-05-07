import { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Button, TextField, Stack, Typography, Divider, Box,
    InputAdornment, IconButton, Paper, alpha, Avatar, CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Close, Send, CheckCircle, AccountBalanceWallet,
    Person, LocationCity, HomeWork
} from '@mui/icons-material';
import api from '../../api/api';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/config';

// Interface ajustada para o que o Dashboard envia
interface ModalProps {
    open: boolean;
    handleClose: () => void;
    proposta: any;      // Recebe a candidatura selecionada
    servico?: any;     // Opcional: dados extras do serviço
    onSuccess: () => void;
    onContraproposta?: (candidaturaId: string, novoValor: number, mensagem: string) => void | Promise<void>;
}

export default function ModalGerenciarProposta({
    open,
    handleClose,
    proposta,
    servico,
    onSuccess,
    onContraproposta
}: ModalProps) {
    const [loading, setLoading] = useState(false);
    const [loadingMorador, setLoadingMorador] = useState(false);
    const [dadosMorador, setDadosMorador] = useState<any>(null);
    const [dadosCondominio, setDadosCondominio] = useState<any>(null);
    const [novoValor, setNovoValor] = useState('');
    const [mensagem, setMensagem] = useState('');

    // Status da negociação
    const statusAtual = proposta?.status?.toUpperCase();
    const isPropostaMorador = statusAtual === 'PROPOSTA_MORADOR';
    const isAceitoPeloPrestador = statusAtual === 'ACEITO_PRESTADOR';
    const isAcordoFechado = statusAtual === 'ACORDO_FECHADO';

    const buscarDadosCompletos = useCallback(async () => {
        const sId = proposta?.solicitacao_id || proposta?.solicitacaoId || servico?.id;

        if (!sId) return;

        setLoadingMorador(true);
        try {
            const response = await api.get(`/servicos/solicitacoes/${sId}`);
            // Ajuste conforme a estrutura do seu retorno de API
            const data = response.data;
            if (data?.morador) {
                setDadosMorador(data.morador);
                setDadosCondominio(data.morador?.condominio);
            }
        } catch (error) {
            console.error("Erro ao buscar detalhes do morador:", error);
        } finally {
            setLoadingMorador(false);
        }
    }, [proposta, servico]);

    useEffect(() => {
        if (open && proposta) {
            setNovoValor(proposta.valor_proposto?.toString() || '');
            setMensagem('');
            buscarDadosCompletos();
        }
    }, [proposta, open, buscarDadosCompletos]);

    const handleAction = async (action: 'aceitar' | 'cancelar') => {
        setLoading(true);
        try {
            if (action === 'aceitar') {
                await api.post('/servicos/candidaturas/aceitar', { candidaturaId: proposta.id });
                toast.success("Proposta aceita!");
            } else {
                await api.delete(`/servicos/candidaturas/${proposta.id}`);
                toast.success("Negociação encerrada.");
            }
            onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.response?.data?.msg || "Erro na operação.");
        } finally { setLoading(false); }
    };

    const handleEnviarContraproposta = async () => {
        if (!novoValor || !mensagem) {
            toast.error("Preencha o valor e a mensagem.");
            return;
        }

        setLoading(true);
        try {
            if (onContraproposta) {
                await onContraproposta(proposta.id, Number(novoValor), mensagem);
            } else {
                await api.post('/servicos/candidaturas/proposta', {
                    candidaturaId: proposta.id,
                    valor: Number(novoValor),
                    mensagem: mensagem
                });
            }
            toast.success("Contraproposta enviada!");
            onSuccess();
            handleClose();
        } catch (error) {
            toast.error("Erro ao enviar contraproposta.");
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="800">Negociação</Typography>
                <IconButton onClick={handleClose}><Close /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                    {/* CARD DO SOLICITANTE */}
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
                                            {dadosMorador?.nome?.charAt(0) || <Person />}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" fontWeight="bold" color="primary">SOLICITANTE</Typography>
                                            <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                                                {dadosMorador?.nome || proposta?.morador_nome || 'Cliente'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ borderStyle: 'dashed' }} />

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            <LocationCity sx={{ fontSize: 14 }} /> {dadosCondominio?.nome || 'Condomínio não informado'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <HomeWork sx={{ fontSize: 14 }} />
                                            Bloco: {dadosMorador?.bloco || '-'} | Unidade: {dadosMorador?.unidade || dadosMorador?.apartamento || '-'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            )}
                        </Paper>
                    </Grid>

                    {/* AÇÕES DE NEGOCIAÇÃO */}
                    <Grid size={{ xs: 12 }}>
                        {isAcordoFechado ? (
                            <Box sx={{ textAlign: 'center', p: 3, bgcolor: alpha('#10b981', 0.1), borderRadius: 3 }}>
                                <CheckCircle sx={{ color: '#10b981', fontSize: 40, mb: 1 }} />
                                <Typography variant="h6" fontWeight="bold" color="success.main">Acordo Fechado!</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {isPropostaMorador && (
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<CheckCircle />}
                                        onClick={() => handleAction('aceitar')}
                                        disabled={loading}
                                        sx={{ py: 1.5, borderRadius: 3, fontWeight: 'bold', background: 'linear-gradient(45deg, #10b981 30%, #34d399 90%)' }}
                                    >
                                        Aceitar R$ {Number(proposta?.valor_proposto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </Button>
                                )}

                                {isAceitoPeloPrestador && (
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha('#3b82f6', 0.1), borderRadius: 3 }}>
                                        <Typography variant="body2" color="primary" fontWeight="bold">
                                            Aguardando o morador confirmar a contratação final.
                                        </Typography>
                                    </Box>
                                )}

                                <Divider><Typography variant="caption" color="text.secondary" fontWeight="bold">OU ENVIAR NOVA PROPOSTA</Typography></Divider>

                                <TextField
                                    fullWidth label="Seu Valor (R$)" type="number"
                                    value={novoValor}
                                    onChange={(e) => setNovoValor(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><AccountBalanceWallet color="primary" /></InputAdornment>,
                                        sx: { borderRadius: 3 }
                                    }}
                                />

                                <TextField
                                    fullWidth label="Mensagem" multiline rows={2}
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
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Atualizar Valor"}
                                </Button>

                                <Stack direction="row" spacing={1}>
                                    <Button color="error" fullWidth onClick={() => handleAction('cancelar')} size="small" disabled={loading}>
                                        Recusar
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