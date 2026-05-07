import { useMemo } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";

export type VitrineCardData = {
  id: string | number;
  slug: string;
  icone?: string;
  titulo: string;
  descricao_curta?: string;

  // padrão novo
  imagem_url?: string;
  href?: string;

  // compat opcional (se vier legado)
  link_botao?: string; // não recomendo usar, mas se existir a gente lê
  texto_botao?: string;
  badge?: string;

  tipo_conteudo?: "categoria_servico" | "morador_prestador";
  style_overrides?: Record<string, string>;
};

export type VitrineSectionData = {
  // novo (recomendado)
  grupo?: string;
  titulo?: string;
  subtitulo?: string;

  view_all?: {
    enabled?: boolean;
    label?: string;
    href?: string;
  };

  // cards do carrossel
  cards?: VitrineCardData[];

  // legado (se você ainda usa em outros pontos)
  slugTarget?: string;
  titulo_pagina?: string;
  exibir_hero?: boolean;
  exibir_premium?: boolean;
  exibir_basicos?: boolean;
  cor_fundo?: string;

  // estilo seção
  style_overrides?: Record<string, string>;
  heading_style?: string;
  classe_css?: string | null;
};

type Props = {
  data: VitrineSectionData;
  onChange: (data: VitrineSectionData) => void;
};

const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

function normalizeHrefByTipo(tipo?: string, slug?: string) {
  if (!slug) return "";
  if (tipo === "morador_prestador") return `/moradores/${slug}`;
  return `/servicos/${slug}`;
}

export default function VitrineSectionEditor({ data, onChange }: Props) {
  const cards = useMemo(() => (Array.isArray(data.cards) ? data.cards : []), [data.cards]);

  const patch = (p: Partial<VitrineSectionData>) => onChange({ ...data, ...p });

  const patchViewAll = (p: Partial<NonNullable<VitrineSectionData["view_all"]>>) => {
    const current = data.view_all || {};
    patch({ view_all: { ...current, ...p } });
  };

  const updateCard = (index: number, p: Partial<VitrineCardData>) => {
    const next = [...cards];
    next[index] = { ...next[index], ...p };
    patch({ cards: next });
  };

  const addCard = () => {
    const next: VitrineCardData = {
      id: makeId(),
      slug: "",
      titulo: "Novo card",
      descricao_curta: "",
      tipo_conteudo: "categoria_servico",
      texto_botao: "Ver prestadores",
      badge: "",
      imagem_url: "",
      href: "",
    };
    patch({ cards: [...cards, next] });
  };

  const removeCard = (index: number) => {
    const next = [...cards];
    next.splice(index, 1);
    patch({ cards: next });
  };

  const moveCard = (index: number, dir: -1 | 1) => {
    const next = [...cards];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    const item = next[index];
    next.splice(index, 1);
    next.splice(to, 0, item);
    patch({ cards: next });
  };

  // Defaults seguros
  const grupo = data.grupo ?? data.slugTarget ?? "";
  const titulo = data.titulo ?? data.titulo_pagina ?? "Serviços";
  const subtitulo = data.subtitulo ?? "";
  const viewAllEnabled = data.view_all?.enabled ?? true;
  const viewAllLabel = data.view_all?.label ?? "Mostrar todos";
  const viewAllHref = data.view_all?.href ?? (grupo ? `/explorar/${grupo}` : "");

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        Configurações da vitrine (carrossel)
      </Typography>

      <Stack spacing={2} mt={1}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Grupo (slug do carrossel)"
            value={grupo}
            onChange={(e) => patch({ grupo: e.target.value, slugTarget: e.target.value })}
            helperText="Ex: dia-a-dia, pet, saude-bem-estar, moradores"
            fullWidth
          />
          <TextField
            label="Título"
            value={titulo}
            onChange={(e) => patch({ titulo: e.target.value, titulo_pagina: e.target.value })}
            fullWidth
          />
        </Stack>

        <TextField
          label="Subtítulo"
          value={subtitulo}
          onChange={(e) => patch({ subtitulo: e.target.value })}
          fullWidth
        />

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
          <Stack spacing={2}>
            {/* Cabeçalho do Botão "Mostrar todos" */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>Configuração do Botão Externo</Typography>

              {/* O Botão visualizado como ficará na página */}
              {viewAllEnabled && (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 20,
                    textTransform: 'none',
                    fontWeight: 700,
                    pointerEvents: 'none' // Apenas para visualização no editor
                  }}
                >
                  {viewAllLabel}
                </Button>
              )}
            </Stack>

            <Divider />

            <Stack direction="row" spacing={3} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Switch
                  checked={Boolean(viewAllEnabled)}
                  onChange={(e) => patchViewAll({ enabled: e.target.checked })}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {viewAllEnabled ? "Botão Visível" : "Botão Oculto"}
                </Typography>
              </Stack>

              <TextField
                label="Texto do Botão (Label)"
                size="small"
                value={viewAllLabel}
                onChange={(e) => patchViewAll({ label: e.target.value })}
                disabled={!viewAllEnabled}
                sx={{ flex: 1 }}
              />
            </Stack>

            <TextField
              label="Link de destino (href)"
              size="small"
              value={viewAllHref}
              onChange={(e) => patchViewAll({ href: e.target.value })}
              helperText="Ex: /explorar/dia-a-dia"
              fullWidth
              disabled={!viewAllEnabled}
              InputProps={{
                startAdornment: (
                  <LinkIcon fontSize="small" sx={{ mr: 1, opacity: 0.5 }} />
                ),
              }}
            />
          </Stack>
        </Paper>

        <Divider />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={800}>
            Cards do carrossel
          </Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={addCard}>
            Adicionar card
          </Button>
        </Stack>

        {cards.length === 0 && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ opacity: 0.8 }}>
              Nenhum card ainda. Clique em <b>Adicionar card</b>.
            </Typography>
          </Paper>
        )}

        {cards.map((c, idx) => {
          const tipo = c.tipo_conteudo || "categoria_servico";
          const href = c.href || c.link_botao || normalizeHrefByTipo(tipo, c.slug);
          const imagem = c.imagem_url || (c.link_botao?.match(/\.(png|jpg|jpeg|webp)$/i) ? c.link_botao : "");

          return (
            <Paper key={String(c.id)} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={`#${idx + 1}`} />
                    <Typography fontWeight={800}>{c.titulo || "Card"}</Typography>
                    {c.badge ? <Chip size="small" label={c.badge} /> : null}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => moveCard(idx, -1)} disabled={idx === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => moveCard(idx, 1)}
                      disabled={idx === cards.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removeCard(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Título do card"
                    value={c.titulo || ""}
                    onChange={(e) => updateCard(idx, { titulo: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Slug"
                    value={c.slug || ""}
                    onChange={(e) => {
                      const newSlug = e.target.value;
                      const newHref = c.href ? c.href : normalizeHrefByTipo(tipo, newSlug);
                      updateCard(idx, { slug: newSlug, href: newHref });
                    }}
                    helperText="Ex: encanador, limpeza, pet-sitter"
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="Descrição curta"
                  value={c.descricao_curta || ""}
                  onChange={(e) => updateCard(idx, { descricao_curta: e.target.value })}
                  fullWidth
                />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id={`tipo-${c.id}`}>Tipo de conteúdo</InputLabel>
                    <Select
                      labelId={`tipo-${c.id}`}
                      label="Tipo de conteúdo"
                      value={tipo}
                      onChange={(e) => {
                        const newTipo = e.target.value as any;
                        const newHref = normalizeHrefByTipo(newTipo, c.slug);
                        const texto = newTipo === "morador_prestador" ? "Ver perfil" : "Ver prestadores";
                        updateCard(idx, { tipo_conteudo: newTipo, href: newHref, texto_botao: texto });
                      }}
                    >
                      <MenuItem value="categoria_servico">Categoria de serviço</MenuItem>
                      <MenuItem value="morador_prestador">Morador prestador</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Badge (opcional)"
                    value={c.badge || ""}
                    onChange={(e) => updateCard(idx, { badge: e.target.value })}
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Imagem (imagem_url)"
                    value={imagem || ""}
                    onChange={(e) => updateCard(idx, { imagem_url: e.target.value })}
                    helperText="Ex: /uploads/images/capa.png"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ display: "flex", alignItems: "center", mr: 1, opacity: 0.7 }}>
                          <ImageIcon fontSize="small" />
                        </Box>
                      ),
                    }}
                  />

                  <TextField
                    label="Link de destino (href)"
                    value={href || ""}
                    onChange={(e) => updateCard(idx, { href: e.target.value })}
                    helperText="Ex: /servicos/encanador ou /moradores/..."
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ display: "flex", alignItems: "center", mr: 1, opacity: 0.7 }}>
                          <LinkIcon fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Ícone (opcional)"
                    value={c.icone || ""}
                    onChange={(e) => updateCard(idx, { icone: e.target.value })}
                    helperText="Ex: Pipe, Zap, Dog..."
                    fullWidth
                  />
                  <TextField
                    label="Texto do botão"
                    value={c.texto_botao || (tipo === "morador_prestador" ? "Ver perfil" : "Ver prestadores")}
                    onChange={(e) => updateCard(idx, { texto_botao: e.target.value })}
                    fullWidth
                  />
                </Stack>

                {/* Compat: se seu renderer antigo ainda usa link_botao, dá pra manter sincronizado */}
                <Box sx={{ opacity: 0.85 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      // sincroniza legados: link_botao = href (NÃO usar pra imagem)
                      updateCard(idx, { link_botao: (c.href || href || "").toString() });
                    }}
                  >
                    Sincronizar legado (link_botao = href)
                  </Button>
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
