import React, { useEffect, useState } from 'react';
import {
    Box, Typography, TextField, Button, Paper, Grid as Grid,
    Avatar, Switch, FormControlLabel, Divider, Alert, Container,
    MenuItem, Select, FormControl, InputLabel, type SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import api, { API_URL } from '../../../api/api';
import { useAuth } from '../../../context/AuthContext';



export default function EditarPerfilPrestador() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });


    // Estados para os arquivos (File)
    const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);
    const [fotoHeroFile, setFotoHeroFile] = useState<File | null>(null);

    // Estados para as previews visuais
    const [previews, setPreviews] = useState({ perfil: '', hero: '' });

    const [formData, setFormData] = useState({
        nome: '',
        descricao_bio: '',
        servicos_oferecidos: '',
        whatsapp_comercial: '',
        disponivel: false,
        plano: 'FREE',
    });

    useEffect(() => {
        const loadUser = async () => {
            if (!user?.id) return;
            try {
                const response = await api.get(`/users/${user.id}`);
                const u = response.data;
                setFormData({
                    nome: u.name || '',
                    descricao_bio: u.descricao_bio || '',
                    servicos_oferecidos: u.servicos_oferecidos || '',
                    whatsapp_comercial: u.whatsapp_comercial || '',
                    disponivel: !!u.disponivel,
                    plano: u.plano || 'FREE',
                });
                setPreviews({
                    perfil: u.foto_perfil_url || '',
                    hero: u.foto_hero_url || ''
                });
            } catch (err) {
                console.error("Erro ao carregar dados", err);
            }
        };
        loadUser();
    }, [user?.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        setFormData(prev => ({ ...prev, plano: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'perfil' | 'hero') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (tipo === 'perfil') setFotoPerfilFile(file);
            else setFotoHeroFile(file);

            setPreviews(prev => ({ ...prev, [tipo]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMensagem({ tipo: '', texto: '' });

        // ✅ Limpeza definitiva do token
        const tokenRaw = localStorage.getItem('@App:token');
        const token = tokenRaw ? tokenRaw.replace(/"/g, '') : null;

        if (!token) {
            setMensagem({ tipo: 'error', texto: 'Sessão inválida. Faça login novamente.' });
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('nome', formData.nome);
        data.append('descricao_bio', formData.descricao_bio);
        data.append('servicos_oferecidos', formData.servicos_oferecidos);
        data.append('whatsapp_comercial', formData.whatsapp_comercial);
        data.append('disponivel', String(formData.disponivel));
        data.append('plano', formData.plano); // Enviará 'BASICO', 'INTERMEDIARIO' ou 'PREMIUM'

        if (fotoPerfilFile) data.append('foto_perfil', fotoPerfilFile);
        if (fotoHeroFile) data.append('foto_hero', fotoHeroFile);

        console.log("data ", data)

        try {
            await api.put('/users/me/perfil-profissional', data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMensagem({ tipo: 'success', texto: 'Perfil atualizado com sucesso!' });
        } catch (err: any) {
            console.error("Erro no servidor:", err.response?.data);
            const status = err.response?.status;

            if (status === 401) {
                setMensagem({ tipo: 'error', texto: 'Sessão expirada. Por favor, faça login novamente.' });
            } else {
                setMensagem({ tipo: 'error', texto: 'Erro ao salvar. Verifique os dados ou as imagens.' });
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 6 }}>
            <Container maxWidth="md">
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#1a2027' }}>
                        Configurações do Perfil
                    </Typography>
                    <Typography sx={{ color: '#5f6c7b' }}>
                        Atualize suas informações e gerencie seu plano de visibilidade.
                    </Typography>
                </Box>

                {mensagem.texto && <Alert severity={mensagem.tipo as any} sx={{ mb: 3, borderRadius: 2 }}>{mensagem.texto}</Alert>}

                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #e0e4e8' }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={4}>

                            {/* Seleção de Plano */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="label-plano">Seu Plano Atual</InputLabel>
                                    <Select
                                        labelId="label-plano"
                                        value={formData.plano}
                                        label="Seu Plano Atual"
                                        onChange={handleSelectChange}
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        <MenuItem value="BASICO">Plano Básico</MenuItem>
                                        <MenuItem value="INTERMEDIARIO">Plano Intermediário</MenuItem>
                                        <MenuItem value="PREMIUM">Plano Premium</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={<Switch checked={formData.disponivel} onChange={handleChange} name="disponivel" color="success" />}
                                    label={formData.disponivel ? "Disponível para novos serviços" : "Ocupado no momento"}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }}>Identidade Visual</Divider>
                            </Grid>

                            {/* Foto de Perfil */}
                            <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
                                <Avatar src= {API_URL + previews.perfil} sx={{ width: 110, height: 110, border: '3px solid #FFD700', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                                <Button variant="outlined" component="label" startIcon={<PhotoCamera />} sx={{ borderRadius: 2 }}>
                                    Alterar Foto de Perfil
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'perfil')} />
                                </Button>
                            </Grid>

                            {/* Dados Profissionais */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth label="Nome Profissional" name="nome" value={formData.nome} onChange={handleChange} required />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth label="WhatsApp Comercial" name="whatsapp_comercial" value={formData.whatsapp_comercial} onChange={handleChange} />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Serviços Oferecidos"
                                    name="servicos_oferecidos"
                                    value={formData.servicos_oferecidos}
                                    onChange={handleChange}
                                    placeholder="Ex: Pintura, Elétrica, Limpeza"
                                    helperText="Separe os termos por vírgula."
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Biografia Profissional"
                                    name="descricao_bio"
                                    value={formData.descricao_bio}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }}>Banner de Destaque (Premium/Gold)</Divider>
                            </Grid>

                            {/* Foto Hero (Banner) */}
                            <Grid size={{ xs: 12 }}>
                                {previews.hero && (
                                    <Box sx={{ width: '100%', height: 160, borderRadius: 3, mb: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                                        <img src={previews.hero} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </Box>
                                )}
                                <Button variant="outlined" component="label" fullWidth startIcon={<PhotoCamera />} sx={{ py: 1.5, borderRadius: 2, borderStyle: 'dashed' }}>
                                    Upload de Banner (Capa)
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'hero')} />
                                </Button>
                            </Grid>

                            {/* Botão Salvar */}
                            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={loading}
                                    startIcon={!loading && <SaveIcon />}
                                    sx={{
                                        bgcolor: '#1a2027',
                                        color: '#FFD700',
                                        py: 2,
                                        fontWeight: 'bold',
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: '#2d3748' }
                                    }}
                                >
                                    {loading ? 'Salvando...' : 'Salvar Alterações Profissionais'}
                                </Button>
                            </Grid>

                        </Grid>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}