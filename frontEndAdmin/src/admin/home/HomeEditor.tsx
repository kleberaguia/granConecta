import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Divider,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";

import Grid from "@mui/material/Grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";

import api from "../../api/api";
import SectionFields from "./SectionFields";
import StyleEditor from "./StyleEditor";
import initialDataMock from "./mockHomeData.json";

// -----------------------------
// Helpers (normalização)
// -----------------------------
const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const isImagePath = (v?: string) => {
  if (!v) return false;
  if (v.startsWith("/uploads/images/")) return true;
  if (v.startsWith("/img_")) return true;
  return /\.(png|jpg|jpeg|webp)$/i.test(v);
};

const normalizeHrefByTipo = (tipo?: string, slug?: string) => {
  if (!slug) return "";
  if (tipo === "morador_prestador") return `/moradores/${slug}`;
  return `/servicos/${slug}`;
};

const normalizeHomeConfig = (sections: any[]) => {
  return (sections || []).map((sec: any) => {
    if (!sec || sec.tipo_secao !== "services_carousel") return sec;

    const grupo =
      (sec.grupo && String(sec.grupo).trim()) ||
      (sec.titulo ? slugify(sec.titulo) : "");

    const view_all = sec.view_all || {
      enabled: true,
      label: "Mostrar todos",
      href: grupo ? `/explorar/${grupo}` : "/explorar",
    };

    const cards = (sec.cards || []).map((c: any) => {
      const tipo = c.tipo_conteudo || "categoria_servico";
      const slug = c.slug || "";

      // legado: link_botao pode ser imagem ou link
      const link = c.href || c.link || c.link_botao || "";
      const linkIsImage = isImagePath(link);

      const imagem_url =
        c.imagem_url ||
        c.imagem_capa ||
        (linkIsImage ? link : undefined);

      const href =
        c.href ||
        c.link ||
        (!linkIsImage ? link : undefined) ||
        normalizeHrefByTipo(tipo, slug);

      return { ...c, tipo_conteudo: tipo, imagem_url, href };
    });

    return { ...sec, grupo, view_all, cards };
  });
};

export default function HomeEditor() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get("/home-config");
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setSections(normalizeHomeConfig(res.data));
        } else {
          setSections(normalizeHomeConfig(initialDataMock as any));
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
        setSections(normalizeHomeConfig(initialDataMock as any));
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, []);

  const handleUpdateSection = (index: number, field: string, value: any) => {
    console.log(`Atualizando ${field} com valor:`, value);
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleUpdateStyle = (index: number, styleKey: string, value: string) => {
    const updated = [...sections];
    const styles = updated[index].style_overrides || {};
    updated[index].style_overrides = { ...styles, [styleKey]: value };
    setSections(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    setMsg(null);

    try {
      const payload = normalizeHomeConfig(sections).map((s: any, i: number) => ({
        ...s,
        ordem: s.ordem ?? i + 1,
      }));

      await api.post("/home-config/home", payload);
      setSections(payload);

      setMsg({ type: "success", text: "Configurações salvas com sucesso!" });
    } catch (error) {
      console.error(error);
      setMsg({ type: "error", text: "Erro ao salvar configurações." });
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, margin: "auto", bgcolor: "#f8f9fa" }}>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center">
        <Typography variant="h4" fontWeight="bold">
          Editor da Home
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      {sections.map((section, index) => (
        <Accordion
          key={section.id || index}
          sx={{ mb: 2, border: "1px solid #e0e0e0", boxShadow: "none" }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Chip label={`#${section.ordem ?? index + 1}`} size="small" />
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
                {section.titulo || "Seção Sem Título"}
              </Typography>
              <Chip
                label={String(section.tipo_secao || "")
                  .replace("_", " ")
                  .toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ bgcolor: "#fafafa", p: 3 }}>
            <Typography variant="overline" color="textSecondary">
              Configurações Gerais
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
              <Grid size={{xs:12,md:6}}>
                <TextField
                  label="Título Principal"
                  fullWidth
                  value={section.titulo || ""}
                  onChange={(e) => handleUpdateSection(index, "titulo", e.target.value)}
                />
              </Grid>

              <Grid size={{xs:12,md:6}}>
                <TextField
                  label="Subtítulo"
                  fullWidth
                  value={section.subtitulo || ""}
                  onChange={(e) => handleUpdateSection(index, "subtitulo", e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="overline" color="textSecondary" sx={{ mb: 2, display: "block" }}>
              Conteúdo: {section.tipo_secao}
            </Typography>

            <SectionFields
              section={section}
              onChange={(field, value) => handleUpdateSection(index, field, value)}
            />

            <Divider sx={{ my: 3 }} />

            <StyleEditor
              styles={section.style_overrides}
              onStyleChange={(key, val) => handleUpdateStyle(index, key, val)}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
}
