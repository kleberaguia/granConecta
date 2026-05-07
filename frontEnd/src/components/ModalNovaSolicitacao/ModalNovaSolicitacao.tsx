import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal, Box, Typography, TextField, Button,
  Stack, IconButton, Fade, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/api';
import DynamicServiceForm from '../DynamicServiceForm';
import { SERVICE_FORM_CONFIG } from '../../utils/serviceFormConfig';

const style = {
  position: 'absolute' as const,
  top: '12%',
  transform: 'translateX(-50%)',
  left: '50%',
  width: { xs: '95%', sm: 550 },
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 0,
  overflow: 'hidden',
  outline: 'none',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
};

const gerarSlug = (texto?: string) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  usuarioId?: string | number;
  condominio_id: string | number;
  todasCategorias?: any[];
  tipoFiltro?: string;
  prestadorNome?: string;
  tituloInicial?: string;
  descricaoInicial?: string;
  prestadorId?: string | number; // 👈 ADICIONE
  lojaId?: string | number;      // 👈 OPCIONAL (recomendado)
  prestadorFoto?: string; // 👈 NOVO
  modo?: 'contextual' | 'generico'; // 👈 NOVO
  categoriaIdInicial?: string | number;

}

export const ModalNovaSolicitacao = ({
  open,
  onClose,
  onSuccess,
  usuarioId,
  condominio_id,
  todasCategorias = [],
  tipoFiltro,
  prestadorNome,
  tituloInicial,
  descricaoInicial,
  prestadorId,
  lojaId,
  prestadorFoto,
  modo = "generico",
  categoriaIdInicial

}: Props) => {

  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoriaId: categoriaIdInicial || ""
  });

  const [extraFields, setExtraFields] = useState<Record<string, any>>({});
  const hasFetched = useRef(false);

  // 🔥 PRE-PREENCHIMENTO INTELIGENTE
  useEffect(() => {
    if (!open) return;

    console.log('condominio_idddddddddddddddd  ', condominio_id)

    // só aplica quando já temos categorias carregadas
    if (categoriaIdInicial && categorias.length > 0) {
      const existe = categorias.some(
        (c) => String(c.id) === String(categoriaIdInicial)
      );

      if (existe) {
        setFormData((prev) => ({
          ...prev,
          titulo: tituloInicial || "",
          descricao: descricaoInicial || "",
          categoriaId: String(categoriaIdInicial),
        }));
      }
    }
  }, [open, categoriaIdInicial, categorias, tituloInicial, descricaoInicial]);

  // 🔥 FETCH CATEGORIAS
  useEffect(() => {
    if (!open) return;

    const carregar = async () => {
      if (hasFetched.current) return;

      try {
        let dados = todasCategorias;

        if (!dados || dados.length === 0) {
          const res = await api.get('/tipos-combo');
          dados = res.data || [];
        }

        const filtrados = dados.filter((cat: any) => {
          if (!tipoFiltro) {
            const tipo = String(cat.tipo || '').toLowerCase();
            return tipo.includes('servico') || cat.is_servico === true;
          }

          return String(cat.tipo || '').toLowerCase() === tipoFiltro.toLowerCase();
        });

        setCategorias(filtrados);
        hasFetched.current = true;

      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      }
    };

    carregar();
  }, [open, todasCategorias, tipoFiltro]);

  // 🔥 RESET
  useEffect(() => {
    if (!open) {
      setFormData({ titulo: '', descricao: '', categoriaId: '' });
      setExtraFields({});
      hasFetched.current = false;
    }
  }, [open]);

  const categoriaSelecionada = useMemo(() => {
    return categorias.find(c => String(c.id) === String(formData.categoriaId));
  }, [formData.categoriaId, categorias]);

  const slug = useMemo(() => {
    if (!categoriaSelecionada) return '';
    return categoriaSelecionada.slug || gerarSlug(categoriaSelecionada.nome || categoriaSelecionada.name);
  }, [categoriaSelecionada]);

  const handleExtraChange = (name: string, value: any) => {
    setExtraFields(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.categoriaId || !formData.titulo.trim()) {
      return;
    }

    if (!usuarioId) {
      console.warn("Usuário não identificado");
      return;
    }

    setLoading(true);

    try {
      let infoAdicional = "";
      const camposConfig = SERVICE_FORM_CONFIG[slug] || [];

      camposConfig.forEach((campo: any) => {
        if (extraFields[campo.name]) {
          infoAdicional += `\n${campo.label}: ${extraFields[campo.name]}`;
        }
      });

      // const payload = {
      //   titulo: formData.titulo.trim(),
      //   descricao: formData.descricao || "",
      //   categoriaId: String(formData.categoriaId),
      //   usuarioId: String(usuarioId),
      //   prestadorId: prestadorId || null,
      //   lojaId: lojaId || null,
      //   condominio_id: condominio_id || null,
      //   metadata: extraFields || {}
      // };

      const payload = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao || "",
        categoriaId: Number(formData.categoriaId), // Força ser número
        usuarioId: String(usuarioId),
        prestadorId: prestadorId || null,
        lojaId: lojaId || null,
        condominio_id: condominio_id || null, // Força null se estiver vazio
        metadata: extraFields || {}
      };

      console.log('payloadddddddddddddddddddddd ', payload)


      await api.post('/servicos/solicitacoes', payload);

      onSuccess?.();
      onClose();

    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Modal open={open} disableScrollLock onClose={(_event, reason) => {
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
      onClose();
    }}>
      <Fade in={open}>
        <Box sx={style}>

          {/* HEADER PRINCIPAL */}
          <Box sx={{
            p: 2,
            bgcolor: '#1e293b',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" fontWeight="bold">
              {categoriaSelecionada
                ? `Solicitar ${categoriaSelecionada.nome || categoriaSelecionada.name}`
                : 'O que você precisa?'}
            </Typography>

            <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* 🔥 HEADER CONTEXTUAL (SÓ QUANDO VEM DA LANDING) */}
          {modo === "contextual" && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderBottom: '1px solid #e2e8f0',
              bgcolor: '#f8fafc'
            }}>
              <Box
                component="img"
                src={prestadorFoto || "https://via.placeholder.com/60"}
                alt="Prestador"
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Você está solicitando para:
                </Typography>

                <Typography variant="subtitle1" fontWeight="bold">
                  {prestadorNome || "Prestador"}
                </Typography>
              </Box>
            </Box>
          )}

          {/* BODY */}
          <Box sx={{ p: 3, maxHeight: '80vh', overflowY: 'auto' }}>
            <Stack spacing={3}>

              <FormControl fullWidth>
                <InputLabel>Selecione o Serviço</InputLabel>
                <Select
                  value={formData.categoriaId || ""}
                  label="Selecione o Serviço"
                  disabled={!!categoriaIdInicial} // trava só quando veio da landing
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      categoriaId: e.target.value as string
                    }));
                    setExtraFields({});
                  }}
                >
                  {categorias.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.nome || cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {slug && (
                <DynamicServiceForm
                  slug={slug}
                  values={extraFields}
                  onChange={handleExtraChange}
                />
              )}

              <TextField
                label="Resumo"
                fullWidth
                value={formData.titulo}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, titulo: e.target.value }))
                }
              />

              <TextField
                label="Mais detalhes"
                multiline
                rows={3}
                fullWidth
                value={formData.descricao}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, descricao: e.target.value }))
                }
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !formData.categoriaId || !formData.titulo}
                onClick={handleSubmit}
              >
                {loading ? "Enviando..." : "Confirmar Solicitação"}
              </Button>

            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};