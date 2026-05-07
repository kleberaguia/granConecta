import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Paper,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
} from "@mui/material";

import Grid from "@mui/material/Grid";

import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LinkIcon from "@mui/icons-material/Link";

import api from "../../api/api";
import { API_URL } from "../../utils/config";

interface SectionFieldsProps {
  section: any;
  onChange: (field: string, value: any) => void;
}

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeHrefByTipo = (tipo?: string, slug?: string) => {
  if (!slug) return "";
  if (tipo === "morador_prestador") return `/moradores/${slug}`;
  return `/servicos/${slug}`;
};

const isImagePath = (v?: string) => {
  if (!v) return false;
  if (v.startsWith("/uploads/images/")) return true;
  if (v.startsWith("/img_")) return true;
  return /\.(png|jpg|jpeg|webp)$/i.test(v);
};

export default function SectionFields({ section, onChange }: SectionFieldsProps) {
  const [uploading, setUploading] = useState(false);



  // --- UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, cardIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      const isVideo = file.type.startsWith("video/");
      const fieldName = isVideo ? "video_perfil" : "files";
      const endpoint = isVideo ? "/uploads/videos" : "/uploads/images";
      //const endpoint = isVideo ? "/home-config/upload-video" : "/home-config/upload-image";

      formData.append(fieldName, file);


      console.log('aquiii endpoint  ', Object.fromEntries(formData));

      console.log('endpointtttttttttt ', endpoint)

      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let urlRetornada = "";
      if (response.data.files && response.data.files.length > 0) {
        urlRetornada = response.data.files[0].path;
      } else if (response.data.path) {
        urlRetornada = response.data.path;
      }

      if (urlRetornada) {
        if (cardIndex !== undefined) {
          handleCardChange(cardIndex, "imagem_url", urlRetornada);
          // handleCardChange(cardIndex, "link_botao", urlRetornada);
        } else {
          if (section.fundo_tipo === "video") onChange("fundo_video_url", urlRetornada);
          else onChange("fundo_imagem_url", urlRetornada);
        }
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload da mídia.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // --- CARDS ---
  const handleCardChange = (cardIndex: number, field: string, val: any) => {
    const newCards = [...(section.cards || [])];
    newCards[cardIndex] = { ...newCards[cardIndex], [field]: val };

    if (field === "slug") {
      const tipo = newCards[cardIndex].tipo_conteudo || "categoria_servico";
      if (!newCards[cardIndex].href) newCards[cardIndex].href = normalizeHrefByTipo(tipo, val);
    }

    if (field === "tipo_conteudo") {
      const slug = newCards[cardIndex].slug;
      const defaultHref = normalizeHrefByTipo(val, slug);
      const defaultTexto = val === "morador_prestador" ? "Ver perfil" : "Ver prestadores";
      if (!newCards[cardIndex].texto_botao) newCards[cardIndex].texto_botao = defaultTexto;
      if (!newCards[cardIndex].href) newCards[cardIndex].href = defaultHref;
    }

    onChange("cards", newCards);
  };

  const handleAddCard = () => {
    const current = section.cards || [];
    const newId = Math.max(...current.map((c: any) => Number(c.id) || 0), 0) + 1;

    const newCard = {
      id: newId,
      titulo: "Novo Card",
      slug: "novo-slug",
      icone: "Star",
      tipo_conteudo: "categoria_servico",
      descricao_curta: "Descrição breve aqui...",
      badge: "",
      texto_botao: "Ver prestadores",
      imagem_url: "",
      href: "/servicos/novo-slug",
      link_botao: "",
    };

    onChange("cards", [...current, newCard]);
  };

  const handleRemoveCard = (index: number) => {
    const newCards = [...(section.cards || [])];
    newCards.splice(index, 1);
    onChange("cards", newCards);
  };

  // --- HERO ---
  if (section.tipo_secao === "hero") {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            label="Tipo de Fundo"
            fullWidth
            value={section.fundo_tipo || "imagem"}
            onChange={(e) => onChange("fundo_tipo", e.target.value)}
          >
            <MenuItem value="video">Vídeo</MenuItem>
            <MenuItem value="imagem">Imagem</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <input
            accept={section.fundo_tipo === "video" ? "video/*" : "image/*"}
            style={{ display: "none" }}
            id={`hero-upload-${section.id}`}
            type="file"
            onChange={(e) => handleFileUpload(e)}
          />
          <TextField
            label={section.fundo_tipo === "video" ? "URL do Vídeo" : "URL da Imagem"}
            fullWidth
            value={section.fundo_tipo === "video" ? section.fundo_video_url || "" : section.fundo_imagem_url || ""}
            onChange={(e) =>
              onChange(section.fundo_tipo === "video" ? "fundo_video_url" : "fundo_imagem_url", e.target.value)
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <label htmlFor={`hero-upload-${section.id}`}>
                    <IconButton color="primary" component="span" disabled={uploading}>
                      {uploading ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                    </IconButton>
                  </label>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    );
  }

  // --- SERVICES CAROUSEL ---
  if (section.tipo_secao === "services_carousel") {
    const grupoValue = section.grupo || (section.titulo ? slugify(section.titulo) : "");
    const viewAll = section.view_all || {
      enabled: true,
      label: "Mostrar todos",
      href: grupoValue ? `/explorar/${grupoValue}` : "/explorar",
    };

    return (
      <Box>
        {/* Config do carrossel */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: "#f8f9fa" }}>

          {/* Header das Configurações */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography fontWeight={800} color="primary" variant="subtitle1">
              Configurações da Vitrine
            </Typography>

            {viewAll.enabled && (
              <Button
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 20,
                  textTransform: 'none',
                  fontWeight: 700,
                  pointerEvents: 'none',
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                {viewAll.label || "Mostrar todos"}
              </Button>
            )}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Grupo (slug)"
                fullWidth
                size="small"
                value={grupoValue}
                onChange={(e) => onChange("grupo", e.target.value)}
                helperText="Ex: dia-a-dia, moradores"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                sx={{ mt: 0.5, ml: 1 }}
                control={
                  <Switch
                    checked={viewAll.enabled ?? true}
                    onChange={(e) => onChange("view_all", { ...viewAll, enabled: e.target.checked })}
                  />
                }
                label={<Typography variant="body2" fontWeight={600}>Exibir botão "Ver Mais"</Typography>}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Texto do botão"
                fullWidth
                size="small"
                disabled={!viewAll.enabled}
                value={viewAll.label || "Mostrar todos"}
                onChange={(e) => onChange("view_all", { ...viewAll, label: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Link de destino (href)"
                fullWidth
                size="small"
                disabled={!viewAll.enabled}
                value={viewAll.href || ""}
                onChange={(e) => onChange("view_all", { ...viewAll, href: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Cards Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
            <AddIcon fontSize="small" /> Cards do Carrossel ({section.cards?.length || 0})
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleAddCard} sx={{ borderRadius: 2 }}>
            Adicionar Card
          </Button>
        </Box>

        {/* Cards Scrollable Area */}
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2 }}>
          {section.cards?.map((card: any, idx: number) => {
            //   const imagemUrlValue = card.imagem_url || (isImagePath(card.link_botao) ? card.link_botao : "");
            const imagemUrlValue = card.imagem_url || "";

            if (imagemUrlValue) {
              console.log(`CARD ${idx} - URL FINAL:`, `${API_URL}/${imagemUrlValue.replace(/^\//, '')}`);
              console.log(`CARD ${idx} - ORIGINAL:`, imagemUrlValue);
            }
            const hrefValue =
              card.href ||
              (!isImagePath(card.link_botao) ? card.link_botao : "") ||
              normalizeHrefByTipo(card.tipo_conteudo || "categoria_servico", card.slug);

            return (
              <Card key={idx} variant="outlined" sx={{ minWidth: 360, bgcolor: "#ffffff", borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="caption" sx={{ bgcolor: "#eee", px: 1, borderRadius: 1 }}>
                      ID: {card.id}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => handleRemoveCard(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <TextField
                        label="Título"
                        size="small"
                        fullWidth
                        value={card.titulo || ""}
                        onChange={(e) => handleCardChange(idx, "titulo", e.target.value)}
                      />
                    </Grid>

                    <Grid size={6}>
                      <TextField
                        label="Slug"
                        size="small"
                        fullWidth
                        value={card.slug || ""}
                        onChange={(e) => handleCardChange(idx, "slug", e.target.value)}
                      />
                    </Grid>

                    <Grid size={6}>
                      <TextField
                        label="Tipo"
                        select
                        size="small"
                        fullWidth
                        value={card.tipo_conteudo || "categoria_servico"}
                        onChange={(e) => handleCardChange(idx, "tipo_conteudo", e.target.value)}
                      >
                        <MenuItem value="categoria_servico">Categoria</MenuItem>
                        <MenuItem value="morador_prestador">Morador prestador</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={6}>
                      <TextField
                        label="Ícone (MUI)"
                        size="small"
                        fullWidth
                        value={card.icone || ""}
                        onChange={(e) => handleCardChange(idx, "icone", e.target.value)}
                      />
                    </Grid>

                    <Grid size={6}>
                      <TextField
                        label="Badge (opcional)"
                        size="small"
                        fullWidth
                        value={card.badge || ""}
                        onChange={(e) => handleCardChange(idx, "badge", e.target.value)}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        label="Descrição Curta"
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        value={card.descricao_curta || ""}
                        onChange={(e) => handleCardChange(idx, "descricao_curta", e.target.value)}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        label="Texto do Botão"
                        size="small"
                        fullWidth
                        value={card.texto_botao || ""}
                        onChange={(e) => handleCardChange(idx, "texto_botao", e.target.value)}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        label="Imagem do Card (imagem_url)"
                        size="small"
                        fullWidth
                        helperText="Caminho do arquivo no servidor"
                        value={imagemUrlValue || ""}
                        onChange={(e) => handleCardChange(idx, "imagem_url", e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <input
                                accept="image/*"
                                style={{ display: "none" }}
                                id={`file-card-${section.id}-${idx}`}
                                type="file"
                                onChange={(e) => handleFileUpload(e, idx)}
                              />
                              <label htmlFor={`file-card-${section.id}-${idx}`}>
                                <IconButton component="span" disabled={uploading} size="small">
                                  {uploading ? (
                                    <CircularProgress size={20} />
                                  ) : imagemUrlValue ? (
                                    <CheckCircleIcon color="success" />
                                  ) : (
                                    <CloudUploadIcon color="primary" />
                                  )}
                                </IconButton>
                              </label>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        label="Destino do Card (href)"
                        size="small"
                        fullWidth
                        helperText="Ex: /servicos/encanador"
                        value={hrefValue || ""}
                        onChange={(e) => handleCardChange(idx, "href", e.target.value)}
                      />
                    </Grid>

                    {imagemUrlValue && (
                      <Grid size={12}>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                            Preview:
                          </Typography>
                          <Box
                            component="img"
                            src={imagemUrlValue.startsWith("http")
                              ? imagemUrlValue
                              : `${API_URL}/${imagemUrlValue.replace(/^\//, '')}`}
                            onError={(e: any) => {
                              e.target.src = "https://placehold.co/600x400?text=Erro+na+URL";
                            }}
                            sx={{
                              width: "100%",
                              height: 110,
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid #ddd",
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Typography color="textSecondary" variant="caption">
      Tipo de seção sem campos configurados.
    </Typography>
  );
}