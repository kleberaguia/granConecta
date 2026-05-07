import { useState } from "react";
import {
  Box, Paper, Typography, TextField, Button, Switch,
  Divider, Grid, MenuItem, Alert, CircularProgress, Avatar
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import api, { API_URL } from "../../api/api";
import { TrendingUp, CameraAlt, Storefront, HourglassEmpty, CheckCircle } from "@mui/icons-material";
import { PerfilProfissionalHeader } from "../PerfilProfissionalHeader/PerfilProfissionalHeader";

export default function MoradorPerfil() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    telefone: user?.telefone || "",
    descricao_bio: user?.descricao_bio || "",
    is_empreendedor: user?.is_empreendedor || false,
    plano: user?.plano || "BASICO",
  });

  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoHero, setFotoHero] = useState<File | null>(null);

  // Estados para Preview
  const [previewPerfil, setPreviewPerfil] = useState<string>(user?.foto_perfil_url ? `${API_URL}${user.foto_perfil_url}` : "");

 const dadosParaHeader = {
    nome_negocio: user?.nome || "Sem nome",
    categoria: user?.is_empreendedor ? (user?.tipo || "Empreendedor") : "Morador",
    foto_perfil: user?.foto_perfil_url ? `${API_URL}${user.foto_perfil_url}` : "",
    // O 'as' garante ao TypeScript que o valor é um dos dois permitidos
    tipo_usuario: (user?.tipo === 'EXTERNO' ? 'EXTERNO' : 'MORADOR') as "MORADOR" | "EXTERNO",
    bloco_apartamento: user?.bloco ? `${user.bloco} - ${user.apartamento}` : "Residente",
    avaliacao: 4.8,
    total_vendas: 12
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFotoPerfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPerfil(file);
      setPreviewPerfil(URL.createObjectURL(file)); // Gera preview temporário
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const data = new FormData();
      data.append("nome", formData.nome);
      data.append("telefone", formData.telefone);
      data.append("descricao_bio", formData.descricao_bio);
      data.append("is_empreendedor", String(formData.is_empreendedor));
      data.append("plano", formData.plano);
      data.append("status", "PENDENTE"); // Envia para o crivo

      if (fotoPerfil) data.append("foto_perfil", fotoPerfil);
      if (fotoHero) data.append("foto_hero", fotoHero);

      console.log('data ', data)

      const response = await api.put("/usuarios/perfil-profissional", data);
     

      setUser(response.data.user);
      setMsg({ type: "success", text: "Alterações enviadas para análise do administrador!" });
    } catch (error) {
      setMsg({ type: "error", text: "Erro ao atualizar perfil." });
    } finally {
      setLoading(false);
    }
  };

  return (

    <Box sx={{ p: 3, maxWidth: 800, margin: "0 auto" }}>
      <PerfilProfissionalHeader dados={dadosParaHeader} />
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>

        {/* CABEÇALHO COM STATUS */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">Meu Perfil</Typography>
          {user?.status === 'PENDENTE' ? (
            <Alert icon={<HourglassEmpty fontSize="inherit" />} severity="warning" sx={{ py: 0 }}>
              Em análise
            </Alert>
          ) : (
            <Alert icon={<CheckCircle fontSize="inherit" />} severity="success" sx={{ py: 0 }}>
              Perfil Ativo
            </Alert>
          )}
        </Box>

        {msg.text && <Alert severity={msg.type as any} sx={{ mb: 3 }}>{msg.text}</Alert>}

        {/* MÉTRICAS */}
        {user?.is_empreendedor && (
          <Box sx={{ mb: 4, p: 2, bgcolor: "#f0f7ff", borderRadius: 2, border: "1px solid #cce3ff" }}>
            <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp fontSize="small" /> Desempenho do seu anúncio
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={4}>
                <Typography variant="caption" display="block">Cliques Whats</Typography>
                <Typography variant="h6">{user.telefone || 0}</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="caption" display="block">Vistas Perfil</Typography>
                <Typography variant="h6">{user.tipo || 0}</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="caption" display="block">Plano</Typography>
                <Typography variant="h6" color="secondary">{user.plano}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

          {/* FOTO DE PERFIL COM PREVIEW */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar src={previewPerfil} sx={{ width: 80, height: 80, border: '2px solid #primary' }} />
            <Button variant="outlined" component="label" startIcon={<CameraAlt />}>
              Alterar Foto
              <input type="file" hidden accept="image/*" onChange={handleFotoPerfilChange} />
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Nome" name="nome" value={formData.nome} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="E-mail" disabled value={formData.email} helperText="O e-mail não pode ser alterado." />
            </Grid>
          </Grid>

          <Divider />

          {/* ÁREA EMPREENDEDOR */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fafafa', p: 2, borderRadius: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storefront color="primary" /> Perfil Empreendedor
              </Typography>
              <Typography variant="caption">Divulgue seus serviços para o condomínio</Typography>
            </Box>
            <Switch name="is_empreendedor" checked={!!formData.is_empreendedor} onChange={handleChange} color="primary" />
          </Box>

          {formData.is_empreendedor && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                select
                label="Seu Plano"
                name="plano"
                value={formData.plano}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="BASICO">Básico (Grátis)</MenuItem>
                <MenuItem value="INTERMEDIARIO">Intermediário</MenuItem>
                <MenuItem value="PREMIUM">Premium</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="WhatsApp Comercial (Link automático)"
                name="whatsapp_comercial"
                placeholder="Ex: 11999999999"
                value={formData.telefone}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descrição / Bio Profissional"
                name="descricao_bio"
                value={formData.descricao_bio}
                onChange={handleChange}
              />

              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CameraAlt />}
                disabled={formData.plano !== 'PREMIUM'}
              >
                {fotoHero ? `Capa Selecionada: ${fotoHero.name}` : "Foto de Capa (Apenas Premium)"}
                <input type="file" hidden onChange={(e) => setFotoHero(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={loading || user?.status === 'PENDENTE'}
            sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
          >
            {loading ? <CircularProgress size={24} /> : user?.status === 'PENDENTE' ? "Aguardando Moderação..." : "Salvar Alterações"}
          </Button>

          {user?.status === 'PENDENTE' && (
            <Typography variant="caption" color="error" textAlign="center">
              * Você já possui uma solicitação em análise. Aguarde a aprovação do Admin para editar novamente.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}