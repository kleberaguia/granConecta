import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { Box, Typography, Button, TextField, Paper, Alert, Snackbar } from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import PageBuilder, { type Section } from "../../components/PageBuilder/PageBuilder";
import api from "../../api/api";

export default function PageEditor() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [pageData, setPageData] = useState<Section[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, msg: '' });

  // 1. CARREGAR DADOS
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/pages/${id}`)
        .then(res => {
            setTitle(res.data.title);
            setSlug(res.data.slug);
            // Tenta fazer o parse do JSON do layout
            try {
                const layout = typeof res.data.content === 'string' ? JSON.parse(res.data.content) : res.data.layout;
                setPageData(Array.isArray(layout) ? layout : []);
            } catch (e) { setPageData([]); }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
  }, [id]);

  // 2. SALVAR DADOS
  const handleSave = async () => {
    if (!title) return setFeedback({ open: true, msg: 'Título obrigatório' });

    const payload = {
        title,
        slug: slug.toLowerCase().trim(),
        layout: pageData,
        content: JSON.stringify(pageData)
    };

    try {
        if (id) {
            await api.put(`/pages/${id}`, payload);
            setFeedback({ open: true, msg: 'Salvo com sucesso!' });
        } else {
            const res = await api.post("/pages", payload);
            setFeedback({ open: true, msg: 'Criado com sucesso!' });
            navigate(`/admin/pages/edit/${res.data.id}`);
        }
    } catch (e) {
        setFeedback({ open: true, msg: 'Erro ao salvar.' });
    }
  };

  if (loading) return <Box p={4}>Carregando...</Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* HEADER */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 10, zIndex: 100 }}>
        <Typography variant="h6">{id ? `Editando: ${title}` : "Nova Página"}</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Salvar</Button>
      </Paper>

      {/* METADADOS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Título" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
            <TextField label="Slug (URL)" value={slug} onChange={e => setSlug(e.target.value)} fullWidth />
        </Box>
      </Paper>

      {/* CONSTRUTOR */}
      <Box>
        <Typography variant="h6" gutterBottom>Layout da Página</Typography>
        <PageBuilder initialData={pageData} onChange={setPageData} />
      </Box>

      <Snackbar open={feedback.open} autoHideDuration={3000} onClose={() => setFeedback({...feedback, open: false})}>
        <Alert severity="success" variant="filled">{feedback.msg}</Alert>
      </Snackbar>
    </Box>
  );
}