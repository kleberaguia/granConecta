import { useEffect, useState, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Paper, Avatar, 
    FormControlLabel, Alert, Container, MenuItem, Select,
    FormControl, InputLabel, CircularProgress, Dialog, DialogContent,
    DialogActions, Checkbox, Snackbar,   DialogTitle
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    PhotoCamera, Pix, ContentCopy, Home} from '@mui/icons-material';

import api, { API_URL } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

// Importação dos seus componentes de Card
// import CardPlano_Prestador from '../cardPlano_Prestador/cardPlano_Prestador';
// import CardPlano_Loja from '../CardPlano_Loja/CardPlano_Loja';

// --- SEUS MOCKS (Que depois virão do banco) ---
export const PLANOS_LOJA = [
    {
        id: 'BASICO',
        titulo: 'Bronze',
        precoMensal: 73.60,
        precoAnual: 768.00,
        desc: 'O essencial para ser visto no condomínio.',
        vantagens: ['visibilidade', 'categoria', 'perfil'],
        destaque: false


    },
    {
        id: 'INTERMEDIARIO',
        titulo: 'Prata',
        precoMensal: 195,
        precoAnual: 1800.80,
        desc: 'Destaque visual e ferramentas de conversão.',
        vantagens: ['visibilidade', 'categoria', 'perfil', 'fotos', 'selo'],
        destaque: true
    },
    {
        id: 'PREMIUM',
        titulo: 'Ouro',
        precoMensal: 430.92,
        precoAnual: 3888.00,
        desc: 'Domine sua categoria com prioridade total.',
        vantagens: ['visibilidade', 'categoria', 'perfil', 'fotos', 'landing', 'topo', 'selo', 'suporte', 'stats'],
        destaque: false
    }
];

export const PLANOS_PRESTADOR = [
    {
        id: 'BASICO',
        titulo: 'Bronze',
        precoMensal: 73.60,
        precoAnual: 768.00,
        desc: 'Para quem está começando.',
        vantagens: ['visibilidade', 'perfil'],
        destaque: false
    },
    {
        id: 'INTERMEDIARIO',
        titulo: 'Prata',
        precoMensal: 195,
        precoAnual: 1800.80,
        desc: 'Melhor custo-benefício.',
        vantagens: ['visibilidade', 'perfil', 'fotos', 'selo'],
        destaque: true
    },
    {
        id: 'PREMIUM',
        titulo: 'Ouro',
        precoMensal: 430.92,
        precoAnual: 3888.00,
        desc: 'Destaque máximo e suporte.',
        vantagens: ['visibilidade', 'perfil', 'fotos', 'selo', 'suporte', 'topo'],
        destaque: false
    }
];

export default function EditarPerfil() {
    const { login } = useAuth();
   
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, texto: '', tipo: 'success' as 'success' | 'error' });

    const [planosIniciais, setPlanosIniciais] = useState({ loja: '', prestador: '', frequencia: '' });
    const [openContrato, setOpenContrato] = useState(false);
    const [openPix, setOpenPix] = useState(false);
    const [aceitouContrato, setAceitouContrato] = useState(false);
    const [pixDados, setPixDados] = useState({ qrCode: '', copiaCola: '', valor: '' });

    const [frequencia, setFrequencia] = useState<'mensal' | 'anual'>('mensal');
    const [querSerEmpreendedor, setQuerSerEmpreendedor] = useState(false);
    const [querSerPrestador, setQuerSerPrestador] = useState(false);

    const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);
    const [previewPerfil, setPreviewPerfil] = useState('');
    const [listaCondominios, setListaCondominios] = useState<any[]>([]);
    const [pagamentoPendente, setPagamentoPendente] = useState('');
    const pollIntervalRef = useRef<number | null>(null);


    const [formData, setFormData] = useState({
        nome: '', telefone: '', condominio_id: '', bloco: '', unidade: '',
        descricao_bio: '', servicos_oferecidos: '',
        plano_loja: '',
        plano_prestador: ''

    });



    useEffect(() => {
        if (openPix) {
            // Começa a checar quando o modal abre
            pollIntervalRef.current = window.setInterval(() => {
                checarStatusPagamento();
            }, 5000);
        } else {
            // Para de checar quando o modal fecha
            pararCheckPagamento();
        }

        // Cleanup: limpa se o usuário sair da página
        return () => pararCheckPagamento();
    }, [openPix])

    const pararCheckPagamento = () => {
        if (pollIntervalRef.current) {
            window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    useEffect(() => {
        if (!fetching) return;

        const carregarDados = async () => {

            const userDataRaw = localStorage.getItem('@App:user');

            let usuarioId = '';
            if (userDataRaw) {
                const parsed = JSON.parse(userDataRaw);
                usuarioId = parsed.usuarioId || parsed.id;
            }
            try {
                const [resCondos, resUser, resStatus] = await Promise.all([
                    api.get('/condominio'),
                    api.get('/users/me'),
                    api.get(`/pix-status/${usuarioId}`)
                ]);

                const statusData = resStatus.data?.status || ''

                setPagamentoPendente(statusData);

                const dados = resUser.data.user || resUser.data;


                if (dados) {
                    // CORREÇÃO TS(6133): Declarar e usar corretamente
                    const freqBanco = dados.perfil?.tipo_assinatura?.toLowerCase() || 'mensal';
                    const freqValida = (freqBanco === 'anual' || freqBanco === 'mensal') ? freqBanco : 'mensal';

                    setListaCondominios(resCondos.data);
                    setFrequencia(freqValida as 'mensal' | 'anual');
                    setQuerSerEmpreendedor(dados.is_empreendedor);
                    setQuerSerPrestador(dados.is_prestador);

                    // IMPORTANTE: Definir os planos iniciais para a comparação de mudança
                    setPlanosIniciais({
                        loja: dados.perfil?.plano || dados.perfil?.plano || '',
                        prestador: dados.perfil?.plano || dados.perfil?.plano || '',
                        frequencia: freqValida
                    });

                    // Preencher o formulário
                    setFormData({
                        nome: dados.name || '',
                        telefone: dados.telefone || '',
                        condominio_id: dados.condominio_id || dados.condominio_id || '',
                        bloco: dados.endereco?.bloco_torre || '',
                        unidade: dados.endereco?.unidade_apto || '',
                        descricao_bio: dados.perfil?.descricao_bio || '',
                        servicos_oferecidos: dados.perfil?.servicos_oferecidos || '',
                        // Aqui garante que o Select/Card mostre o plano atual
                        plano_loja: dados.perfil?.plano || dados.perfil?.plano || 'BASICO',
                        plano_prestador: dados.perfil?.plano || dados.perfil?.plano || 'BASICO',
                    });

                    // Foto de Perfil
                    const fotoUrl =
                        dados.foto_perfil_url || // 👈 NOVO (morador)
                        dados.perfil?.foto_perfil_url; // 👈 fallback (profissional)

                    if (fotoUrl) {
                        const urlCompleta = fotoUrl.startsWith('http')
                            ? fotoUrl
                            : `${API_URL}${fotoUrl}`;

                        setPreviewPerfil(urlCompleta);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar:", err);
            } finally {
                setFetching(false);
            }


        };
        carregarDados();
    }, []);

    const checarStatusPagamento = async () => {
        try {
            const userDataRaw = localStorage.getItem('@App:user');
            if (!userDataRaw) return;

            const parsed = JSON.parse(userDataRaw);
            // Seguindo o padrão usuarioId solicitado
            const usuarioId = parsed.usuarioId || parsed.id;

            const response = await api.get(`/pix-status/${usuarioId}`);

            console.log('pix-status?usuarioId=', response.data.status)

            if (response.data.status === 'PENDING') {
                setPagamentoPendente('PENDING');
                return;
            }

            // Se status for pago ou PAID
            if (response.data.pago === true || response.data.status === 'PAID') {
                pararCheckPagamento(); // Importante: Parar antes de agir
                setOpenPix(false);

                setSnackbar({ open: true, texto: 'Pagamento confirmado! Plano atualizado.', tipo: 'success' });

                // Busca dados atualizados para sincronizar interface e contexto
                const resUser = await api.get('/users/me');
                const dadosNovos = resUser.data.user || resUser.data;

                login(localStorage.getItem('@App:token') || '', dadosNovos);

                // Atualiza os estados locais com o que agora é "inicial"
                const freqFinal = dadosNovos.perfil?.tipo_assinatura?.toLowerCase() || 'mensal';
                setPlanosIniciais({
                    loja: dadosNovos.is_empreendedor ? (dadosNovos.perfil?.plano_loja || dadosNovos.perfil?.plano) : '',
                    prestador: dadosNovos.is_prestador ? (dadosNovos.perfil?.plano_prestador || dadosNovos.perfil?.plano) : '',
                    frequencia: freqFinal
                });
            } else {
                if (pagamentoPendente === 'PENDING') return;
            }
        } catch (err) {
            console.error("Erro ao checar status:", err);
        }
    };

    const handleSalvarProcessoCompleto = async (apenasPerfil: boolean = false) => {
        setLoading(true);

        if (pagamentoPendente === 'PENDING') return;
        try {
            const userDataRaw = localStorage.getItem('@App:user') || '';
            const userData = JSON.parse(userDataRaw);
            const usuarioId = userData.id || userData.usuarioId;



            const data = new FormData();
            data.append('usuarioId', usuarioId);
            data.append('nome', formData.nome);
            data.append('telefone', formData.telefone);
            data.append('bloco', formData.bloco);
            data.append('unidade', formData.unidade);

            if (formData.condominio_id) data.append('condominio_id', formData.condominio_id);

            // --- AJUSTE AQUI: Conversão explícita para o Back-end ---
            data.append('is_empreendedor', querSerEmpreendedor ? 'true' : 'false');
            data.append('is_prestador', querSerPrestador ? 'true' : 'false');

            data.append('frequencia', frequencia.toUpperCase()); // Geralmente back-end espera MAIÚSCULO
            data.append('descricao_bio', formData.descricao_bio || '');
            data.append('servicos_oferecidos', formData.servicos_oferecidos || '');

            // Só envia o plano se o switch estiver ativo, evitando lixo no banco
            if (querSerEmpreendedor) {

                data.append('plano', formData.plano_loja || 'BASICO');
            }
            if (querSerPrestador) {

                data.append('plano', formData.plano_prestador || 'BASICO');
            }

            if (fotoPerfilFile) {
                data.append('foto_perfil_url', fotoPerfilFile);
            }



            console.log("Conteúdo do FormData:", Object.fromEntries(data));
            let response: any


            if (querSerEmpreendedor || querSerPrestador) {
                console.log("Fluxo Profissional/Loja");
                response = await api.put('/users/me/perfil-profissional', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            // Se ele NÃO é profissional (é apenas morador comum)
            else {
                console.log("Fluxo Apenas Morador");
                response = await api.put('/users/me/perfil-geral', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }




            // Se o back retornar a nova URL, atualizamos o preview
            if (response.data.perfil?.foto_perfil_url) {
                const url = response.data.perfil.foto_perfil_url;
                const urlCompleta = url.startsWith('http') ? url : `${API_URL}${url}`;
                setPreviewPerfil(urlCompleta);

                const userAtualizado = { ...userData, perfil: { ...userData.perfil, foto_perfil_url: url } };
                localStorage.setItem('@App:user', JSON.stringify(userAtualizado));
            }


            if (!apenasPerfil) {
                let valorTotalGeral = 0;
                const itensParaAssinar = [];

                // Verificação para Loja (Empreendedor)
                if (querSerEmpreendedor) {
                    const planoLoja = PLANOS_LOJA.find(x => x.id === formData.plano_loja);
                    if (planoLoja) {
                        // Verifica se é um novo perfil ou mudança de plano
                        const jaPossuiEssePlano = planosIniciais.loja === planoLoja.id && frequencia === planosIniciais.frequencia;

                        if (!jaPossuiEssePlano) {
                            const preco = frequencia === 'mensal' ? planoLoja.precoMensal : planoLoja.precoAnual;
                            valorTotalGeral += preco;
                            itensParaAssinar.push({
                                tipo: 'em', // Mapeado como EMPREENDEDOR no banco
                                plano: planoLoja.id,
                                valor: preco
                            });
                        }
                    }
                }

                // Verificação para Prestador
                if (querSerPrestador) {
                    const planoPresta = PLANOS_PRESTADOR.find(x => x.id === formData.plano_prestador);
                    if (planoPresta) {
                        const jaPossuiEssePlano = planosIniciais.prestador === planoPresta.id && frequencia === planosIniciais.frequencia;

                        if (!jaPossuiEssePlano) {
                            const preco = frequencia === 'mensal' ? planoPresta.precoMensal : planoPresta.precoAnual;
                            valorTotalGeral += preco;
                            itensParaAssinar.push({
                                tipo: 'PRESTADOR',
                                plano: planoPresta.id,
                                valor: preco
                            });
                        }
                    }
                }

                // Se houver algo novo para cobrar
                if (itensParaAssinar.length > 0 && valorTotalGeral > 0) {
                    const resPix = await api.post('/pix-assinatura', {
                        usuarioId,
                        itens: itensParaAssinar,
                        frequencia: frequencia.toUpperCase(),
                        amount: parseFloat(valorTotalGeral.toFixed(2)) // Garante que é número e não string
                    });

                    // AGORA USAMOS O resPix (Isso remove o erro do TS)
                    if (resPix.data && (resPix.data.qrCode || resPix.data.qrcode)) {
                        const qrCodeCerto = resPix.data.qrCode || resPix.data.qrcode;
                        const copiaColaCerto = resPix.data.copiaCola || resPix.data.pixCopiaCola;

                        setPixDados({
                            qrCode: qrCodeCerto,
                            copiaCola: copiaColaCerto,
                            valor: `R$ ${valorTotalGeral.toFixed(2)}`
                        });

                        setOpenContrato(false); // Fecha o contrato
                        setOpenPix(true);      // Abre o modal do PIX

                        // 2. INICIA O MONITORAMENTO DO PAGAMENTO (Polling)
                        // Limpa se houver algum rodando
                        pollIntervalRef.current = window.setInterval(() => {
                            checarStatusPagamento();
                        }, 5000); // Checa a cada 5 segundos

                    } else {
                        throw new Error("Erro ao gerar dados do PIX. Verifique o servidor.");
                    }
                } else {
                    await api.put('/users/me/perfil-profissional', data);
                    setSnackbar({ open: true, texto: 'Perfil atualizado com sucesso!', tipo: 'success' });
                    setLoading(false);
                    return;
                }
            } else {
                setSnackbar({ open: true, texto: 'Perfil atualizado com sucesso!', tipo: 'success' });
            }
        } catch (err: any) {
            const mensagemErro = err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar perfil.';
            console.error("Erro detalhado:", err.response?.data);
            setSnackbar({ open: true, texto: mensagemErro, tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarClick = async (apenasPerfilParam: boolean = false) => {
        if (loading) return;
        console.log("meu Deus")



        // 1. Identifica mudanças específicas
        const mudouLoja = querSerEmpreendedor && (formData.plano_loja !== planosIniciais.loja);
        const mudouPresta = querSerPrestador && (formData.plano_prestador !== planosIniciais.prestador);
        const mudouFreq = (querSerEmpreendedor || querSerPrestador) && (frequencia !== planosIniciais.frequencia);

        const houveMudancaPlano = mudouLoja || mudouPresta || mudouFreq;

        console.log('houveMudancaPlano ', houveMudancaPlano)

        // 2. BLOQUEIO CRÍTICO: Se tentou mudar plano e tem pendência
        if (houveMudancaPlano && pagamentoPendente === "PENDING") {
            setSnackbar({
                open: true,
                texto: 'Existe um PIX aguardando pagamento. Você não pode alterar o plano até que ele expire ou seja pago.',
                tipo: 'error'
            });

            // Opcional: Você pode forçar a abertura do modal do PIX pendente aqui
            // setOpenPix(true); 
            return;
        }

        // 3. Decide o fluxo
        if (apenasPerfilParam || !houveMudancaPlano) {
            // Salva apenas dados básicos (Nome, Foto, Bio)
            // Note: handleSalvarProcessoCompleto deve usar o 'usuarioId' padronizado
            handleSalvarProcessoCompleto(true);
        } else {
            // Abre o contrato para gerar o novo PIX
            setOpenContrato(true);
        }
    };
    if (fetching) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5 }}>
            <Container maxWidth="md">
                <Grid container spacing={3}>
                    {/* --- DADOS BÁSICOS --- */}
                    <Grid size={12}>
                        <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                            <Typography variant="h6" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Home color="primary" /> Dados do Morador
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
                                    <Avatar src={previewPerfil} sx={{ width: 120, height: 120, mx: 'auto', border: '4px solid #FFD700', mb: 2 }} />
                                    <Button variant="outlined" component="label" startIcon={<PhotoCamera />} size="small">
                                        Mudar Foto
                                        <input type="file" hidden accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) { setFotoPerfilFile(file); setPreviewPerfil(URL.createObjectURL(file)); }
                                        }} />
                                    </Button>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Grid container spacing={2}>
                                        <Grid size={12}><TextField fullWidth label="Nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} /></Grid>
                                        <Grid size={12}><TextField fullWidth label="WhatsApp" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} /></Grid>
                                        <Grid size={12}>
                                            <FormControl fullWidth>
                                                <InputLabel>Condomínio</InputLabel>
                                                <Select value={formData.condominio_id} label="Condomínio" onChange={(e) => setFormData({ ...formData, condominio_id: e.target.value })}>
                                                    {listaCondominios.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={6}><TextField fullWidth label="Bloco" value={formData.bloco} onChange={(e) => setFormData({ ...formData, bloco: e.target.value })} /></Grid>
                                        <Grid size={6}><TextField fullWidth label="Unidade" value={formData.unidade} onChange={(e) => setFormData({ ...formData, unidade: e.target.value })} /></Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* --- SELEÇÃO DE TIPO DE PERFIL 
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper
                            sx={{
                                p: 3, borderRadius: 4, textAlign: 'center', cursor: 'pointer',
                                transition: '0.3s',
                                border: querSerEmpreendedor ? '2px solid #059669' : '1px solid #e2e8f0',
                                bgcolor: querSerEmpreendedor ? '#f0fdf4' : 'white'
                            }}
                            onClick={() =>
                                setQuerSerEmpreendedor(!querSerEmpreendedor)
                            }
                        >
                            <Storefront sx={{ fontSize: 40, color: querSerEmpreendedor ? '#059669' : '#94a3b8', mb: 1 }} />
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={querSerEmpreendedor}
                                            color="primary"
                                            // Opcional: e.stopPropagation() evita que o clique no switch 'suba' para o Paper
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setQuerSerEmpreendedor(e.target.checked);
                                            }}
                                        />
                                    }
                                    label={<Typography fontWeight="bold">Quero ter uma Loja</Typography>}
                                    labelPlacement="bottom"
                                />
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper
                            sx={{
                                p: 3, borderRadius: 4, textAlign: 'center', cursor: 'pointer',
                                transition: '0.3s',
                                border: querSerPrestador ? '2px solid #4338ca' : '1px solid #e2e8f0',
                                bgcolor: querSerPrestador ? '#eef2ff' : 'white'
                            }}
                            onClick={() => setQuerSerPrestador(!querSerPrestador)}
                        >
                            <Engineering sx={{ fontSize: 40, color: querSerPrestador ? '#4338ca' : '#94a3b8', mb: 1 }} />
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={querSerPrestador}
                                            color="primary"
                                            // Opcional: e.stopPropagation() evita que o clique no switch 'suba' para o Paper
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setQuerSerPrestador(e.target.checked);
                                            }}
                                        />
                                    }
                                    label={<Typography fontWeight="bold">Quero ser Prestador</Typography>}
                                    labelPlacement="bottom"
                                />
                            </Box>
                        </Paper>
                    </Grid>--- */}

                    {/* --- TOGGLE FREQUÊNCIA --- 
                    {(querSerEmpreendedor || querSerPrestador) && (
                        <Grid size={12} sx={{ textAlign: 'center', mt: 2 }}>
                            <ToggleButtonGroup
                                value={frequencia} // Este estado deve ser 'anual' ou 'mensal'
                                exclusive
                                onChange={(_, v) => v && setFrequencia(v)}
                                color="primary"
                            >
                                <ToggleButton value="mensal">Mensal</ToggleButton>
                                <ToggleButton value="anual">Anual (Desconto)</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>
                    )}*/}

                    {/* --- CARDS DA LOJA --- 
                    {querSerEmpreendedor && (
                        <Grid container spacing={3} size={12}>
                            {PLANOS_LOJA.map(plano => {
                                // Verifica se este é exatamente o plano que está no banco de dados
                                const ehOPlanoAssinado = planosIniciais.loja === plano.id;
                                return (
                                    <Grid size={{ xs: 12, md: 4 }} key={plano.id}>
                                        {querSerEmpreendedor && (
                                            <Box sx={{ position: 'relative' }}>
                                                {ehOPlanoAssinado && (
                                                    <Box sx={{
                                                        position: 'absolute', top: -12, left: '50%',
                                                        transform: 'translateX(-50%)', bgcolor: '#059669',
                                                        color: 'white', px: 2, py: 0.5, borderRadius: 5,
                                                        zIndex: 10, fontWeight: 'bold', fontSize: '0.7rem',
                                                        border: '2px solid #fff', boxShadow: 2
                                                    }}>
                                                        SEU PLANO ATUAL
                                                    </Box>
                                                )}
                                                <CardPlano_Loja
                                                    plano={plano}
                                                    frequencia={frequencia}
                                                    selecionado={formData.plano_loja === plano.id}
                                                    onSelect={() => {
                                                        // Use a função de callback para garantir o estado mais recente
                                                        setFormData(prev => ({ ...prev, plano_loja: plano.id }));
                                                    }}
                                                // Dica: Você pode passar 'ehOPlanoAssinado' para dentro do componente para mudar a cor da borda
                                                />
                                            </Box>
                                        )}

                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}*/}

                    {/* --- CARDS DO PRESTADOR --- 
                    {querSerPrestador && (
                        <Grid container spacing={3} size={12} sx={{ mt: 4 }}>
                            <Grid size={12}><Typography variant="h6" fontWeight="bold" textAlign="center">Planos para Prestador</Typography></Grid>
                            {PLANOS_PRESTADOR.map(plano => {
                                const ehOPlanoAssinado = planosIniciais.prestador === plano.id;
                                return (
                                    <Grid size={{ xs: 12, md: 4 }} key={plano.id}>
                                        {querSerPrestador && (
                                            <Box sx={{ position: 'relative' }}>
                                                {querSerPrestador && ehOPlanoAssinado && (
                                                    <Box sx={{
                                                        position: 'absolute', top: -12, left: '50%',
                                                        transform: 'translateX(-50%)', bgcolor: '#059669',
                                                        color: 'white', px: 2, py: 0.5, borderRadius: 5,
                                                        zIndex: 10, fontWeight: 'bold', fontSize: '0.7rem',
                                                        border: '2px solid #fff', boxShadow: 2
                                                    }}>
                                                        SEU PLANO ATUAL
                                                    </Box>
                                                )}
                                                <CardPlano_Prestador
                                                    plano={plano}
                                                    frequencia={frequencia}
                                                    selecionado={formData.plano_prestador === plano.id}
                                                    onSelect={() => {
                                                        // Use a função de callback para garantir o estado mais recente
                                                        setFormData(prev => ({ ...prev, plano_prestador: plano.id }));
                                                    }}
                                                // Dica: Você pode passar 'ehOPlanoAssinado' para dentro do componente para mudar a cor da borda
                                                />
                                            </Box>
                                        )}

                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}*/}

                    {/* --- BOTÃO SALVAR --- */}
                    <Grid size={12} sx={{ mt: 4 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => handleSalvarClick(false)}// <--- SEM PARÊNTESES AQUI
                            disabled={loading}
                            sx={{
                                py: 2,
                                bgcolor: pagamentoPendente === 'PENDING' ? '#94a3b8' : '#1e293b',
                                // ... 
                            }}
                        >
                            {pagamentoPendente === 'PENDING' ? 'Aguardando Pagamento do PIX...' : 'Salvar Alterações'}
                        </Button>
                    </Grid>
                </Grid>
            </Container>

            {/* --- DIALOGS --- */}
            <Dialog open={openPix} onClose={() => { setOpenPix(false); pararCheckPagamento(); }}>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Pix sx={{ color: '#32bcad', fontSize: 60, mb: 1 }} />
                    <Typography variant="h5" fontWeight="900">{pixDados.valor}</Typography>
                    {pixDados.qrCode && (
                        <img
                            src={pixDados.qrCode.startsWith('data:') ? pixDados.qrCode : `data:image/png;base64,${pixDados.qrCode}`}
                            alt="QR Code PIX"
                            style={{ width: 220, marginTop: 15, borderRadius: '8px' }}
                        />
                    )}
                    <Button startIcon={<ContentCopy />} fullWidth variant="outlined" sx={{ mt: 2 }}
                        onClick={() => { navigator.clipboard.writeText(pixDados.copiaCola); setSnackbar({ open: true, texto: 'Copiado!', tipo: 'success' }); }}>
                        Copiar Código PIX
                    </Button>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenPix(false)} fullWidth variant="contained">CONCLUÍDO</Button></DialogActions>
            </Dialog>

            <Dialog open={openContrato} onClose={() => setOpenContrato(false)}>
                <DialogTitle>Confirmar Alteração de Plano</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Resumo das alterações:
                    </Typography>

                    {/* Exemplo de feedback dinâmico */}
                    {querSerEmpreendedor && formData.plano_loja !== planosIniciais.loja && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Loja: Alterando de <strong>{planosIniciais.loja || 'Nenhum'}</strong> para <strong>{formData.plano_loja}</strong>
                        </Alert>
                    )}

                    {querSerPrestador && formData.plano_prestador !== planosIniciais.prestador && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Prestador: Alterando de <strong>{planosIniciais.prestador || 'Nenhum'}</strong> para <strong>{formData.plano_prestador}</strong>
                        </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Ao confirmar, um novo QR Code Pix será gerado para o pagamento da diferença ou renovação do ciclo {frequencia}.
                    </Typography>

                    <FormControlLabel
                        control={<Checkbox checked={aceitouContrato} onChange={(e) => setAceitouContrato(e.target.checked)} />}
                        label="Eu aceito os novos termos e desejo prosseguir para o pagamento."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenContrato(false)}>Cancelar</Button>
                    <Button
                        disabled={!aceitouContrato || loading}
                        variant="contained"
                        onClick={() => handleSalvarProcessoCompleto(false)}
                    >
                        {loading ? <CircularProgress size={24} /> : 'CONFIRMAR E GERAR PIX'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.tipo} variant="filled">{snackbar.texto}</Alert>
            </Snackbar>
        </Box>
    );
}