// src/components/tabs/VitrineConfigTab.tsx
import { useState, useEffect } from 'react';
import { TextField, Button, Grid, Paper, Typography, Divider, Stack } from '@mui/material';
import api from '../../api/api';
import toast from 'react-hot-toast';
import SaveIcon from '@mui/icons-material/Save';

export default function VitrineConfigTab({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    heroTitle: '',
    heroSubtitle: '',
    aboutText: '',
    primaryColor: '#2E86AB',
    secondaryColor: '#F2D7EE',
    chavePix: '' // Adicionado para sua tabela
  });

  useEffect(() => {
    const fetchStore = async () => {
      try {
        // Busca usando a rota que definimos no backend
        const { data } = await api.get('/stores/me');
        if (data) {
          setFormData({
            name: data.name || '',
            heroTitle: data.layoutConfig?.heroTitle || '',
            heroSubtitle: data.layoutConfig?.heroSubtitle || '',
            aboutText: data.layoutConfig?.aboutText || '',
            primaryColor: data.layoutConfig?.primaryColor || '#2E86AB',
            secondaryColor: data.layoutConfig?.secondaryColor || '#F2D7EE',
            chavePix: data.chavePix || ''
          });
        }
      } catch (error) {
        console.error("Loja ainda não criada.");
      }
    };
    fetchStore();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return toast.error("O nome da loja é obrigatório!");
    
    setLoading(true);
    try {
      // 1. Gera o SLUG automaticamente
      const slugGenerated = formData.name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      // 2. Monta o payload conforme sua tabela SQL
      const payload = {
        name: formData.name,
        slug: slugGenerated,
        userId: user.usuarioId, // Padrão solicitado
        chavePix: formData.chavePix,
        layoutConfig: {
          heroTitle: formData.heroTitle,
          heroSubtitle: formData.heroSubtitle,
          aboutText: formData.aboutText,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor
        }
      };

      // Chamada para o endpoint UPSERT (Cria ou Atualiza)
      await api.post('/stores', payload);
      toast.success("Vitrine publicada com sucesso!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao salvar vitrine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>Personalizar Minha Vitrine</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Essas cores e textos serão aplicados à sua página pública.
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid size={{xs:12}}>
          <TextField 
            fullWidth label="Nome da Loja" 
            placeholder="Ex: Doce Sabor Artesanal"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </Grid>

        <Grid size={{xs:12, md:6}} >
          <TextField 
            fullWidth label="Título Principal (Hero)" 
            value={formData.heroTitle}
            onChange={(e) => setFormData({...formData, heroTitle: e.target.value})}
          />
        </Grid>

        <Grid size={{xs:12,md:6}}>
          <TextField 
            fullWidth label="Chave PIX" 
            value={formData.chavePix}
            onChange={(e) => setFormData({...formData, chavePix: e.target.value})}
          />
        </Grid>

        <Grid size={{xs:12, md:4}}>
          <Stack direction="row" spacing={2} alignItems="center">
             <TextField 
                label="Cor da Identidade" type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                sx={{ width: 100 }}
              />
              <Typography variant="caption">Botões e Destaques</Typography>
          </Stack>
        </Grid>

        <Grid size={{xs:12}}>
          <TextField 
            fullWidth multiline rows={3} label="Descrição para os Clientes" 
            value={formData.aboutText}
            onChange={(e) => setFormData({...formData, aboutText: e.target.value})}
          />
        </Grid>

        <Grid size={{xs:12}}>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSave} 
            disabled={loading}
            fullWidth
          >
            {loading ? 'Publicando...' : 'Publicar Alterações'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}