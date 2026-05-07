// LandingPageBuilder PRO (Arquitetura correta para NO-CODE real)
// React + MUI | focado em templates + personalização controlada

import { useState } from 'react';
import {
  Box, Button, Container, Typography, Paper, Stack, TextField,
  Select, MenuItem, Slider, Divider, Switch
} from '@mui/material';
import Grid from '@mui/material/Grid';

/* =====================================================
   CONCEITO-CHAVE (IMPORTANTE)
   - O usuário NÃO constrói do zero
   - Ele escolhe um TEMPLATE
   - Cada template define:
     • quais seções existem
     • o que pode ser editado
     • limites (ex: max 3 imagens)
===================================================== */

/* =====================================================
   TIPOS BASE
===================================================== */
type Plan = 'simple' | 'advanced' | 'pro';

type SectionType =
  | 'hero'
  | 'gallery'
  | 'cta'
  | 'works'
  | 'testimonials'
  | 'videos'
  | 'footer';

interface BaseSection {
  id: string;
  type: SectionType;
  editable: string[]; // campos que o usuário pode mexer
}

/* =====================================================
   SEÇÕES
===================================================== */
interface HeroSection extends BaseSection {
  type: 'hero';
  title: string;
  subtitle: string;
  backgroundType: 'color' | 'gradient' | 'image' | 'carousel';
  backgroundColor: string;
  gradient?: { from: string; to: string };
  backgroundImage?: string;
  overlayImage?: string;
  titleColor: string;
  subtitleColor: string;
  titleSize: number;
  fontFamily: string;
}

interface GallerySection extends BaseSection {
  type: 'gallery';
  images: string[];
  maxImages: number;
  carousel: boolean;
}

interface CTASection extends BaseSection {
  type: 'cta';
  text: string;
  buttonText: string;
  buttonColor: string;
  backgroundColor: string;
}

interface FooterSection extends BaseSection {
  type: 'footer';
  text: string;
  backgroundColor: string;
  textColor: string;
}

type Section = HeroSection | GallerySection | CTASection | FooterSection;

/* =====================================================
   HELPERS
===================================================== */
const uid = () => Math.random().toString(36).slice(2);

/* =====================================================
   TEMPLATES (ONDE TUDO COMEÇA)
===================================================== */
const templates: Record<Plan, Section[]> = {
  simple: [
    {
      id: uid(),
      type: 'hero',
      editable: ['title', 'subtitle', 'backgroundColor', 'titleColor', 'subtitleColor', 'titleSize'],
      title: 'Meu serviço profissional',
      subtitle: 'Atendimento rápido e de confiança',
      backgroundType: 'color',
      backgroundColor: '#1976d2',
      titleColor: '#ffffff',
      subtitleColor: '#e0e0e0',
      titleSize: 42,
      fontFamily: 'Roboto'
    },
    {
      id: uid(),
      type: 'gallery',
      editable: ['images'],
      images: ['https://placehold.co/400x300'],
      maxImages: 3,
      carousel: false
    },
    {
      id: uid(),
      type: 'cta',
      editable: ['text', 'buttonText', 'buttonColor', 'backgroundColor'],
      text: 'Entre em contato agora mesmo',
      buttonText: 'Falar no WhatsApp',
      buttonColor: '#ffffff',
      backgroundColor: '#0d47a1'
    },
    {
      id: uid(),
      type: 'footer',
      editable: ['text', 'backgroundColor', 'textColor'],
      text: '© 2026 - Todos os direitos reservados',
      backgroundColor: '#111',
      textColor: '#fff'
    }
  ],

  advanced: [
    {
      id: uid(),
      type: 'hero',
      editable: ['title', 'subtitle', 'backgroundType', 'backgroundImage', 'overlayImage', 'gradient', 'fontFamily'],
      title: 'Especialistas no que fazemos',
      subtitle: 'Qualidade, confiança e resultado',
      backgroundType: 'image',
      backgroundColor: '#000',
      backgroundImage: 'https://placehold.co/1200x600',
      overlayImage: 'https://placehold.co/400x400',
      titleColor: '#fff',
      subtitleColor: '#ddd',
      titleSize: 48,
      fontFamily: 'Poppins'
    },
    {
      id: uid(),
      type: 'gallery',
      editable: ['images', 'carousel'],
      images: Array.from({ length: 6 }).map(() => 'https://placehold.co/300x200'),
      maxImages: 10,
      carousel: true
    },
    {
      id: uid(),
      type: 'cta',
      editable: ['text', 'buttonText', 'buttonColor', 'backgroundColor'],
      text: 'Solicite um orçamento',
      buttonText: 'Quero orçamento',
      buttonColor: '#000',
      backgroundColor: '#ffeb3b'
    },
    {
      id: uid(),
      type: 'footer',
      editable: ['text', 'backgroundColor', 'textColor'],
      text: 'Empresa profissional • WhatsApp • Instagram',
      backgroundColor: '#000',
      textColor: '#fff'
    }
  ],

  pro: [] // expansível (vídeos, anúncios, depoimentos, etc)
};

/* =====================================================
   RENDERIZAÇÃO
===================================================== */
function RenderSection({ section }: { section: Section }) {
  if (section.type === 'hero') {
    return (
      <Box sx={{
        p: 8,
        color: section.titleColor,
        background:
          section.backgroundType === 'gradient'
            ? `linear-gradient(${section.gradient?.from}, ${section.gradient?.to})`
            : section.backgroundColor
      }}>
        <Typography sx={{ fontSize: section.titleSize, fontFamily: section.fontFamily }} fontWeight={900}>
          {section.title}
        </Typography>
        <Typography sx={{ color: section.subtitleColor }}>{section.subtitle}</Typography>
      </Box>
    );
  }

  if (section.type === 'gallery') {
    return (
      <Stack direction="row" spacing={2} sx={{ p: 4, overflowX: section.carousel ? 'auto' : 'visible' }}>
        {section.images.map((img, i) => (
          <Box key={i} component="img" src={img} sx={{ width: 250, borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  if (section.type === 'cta') {
    return (
      <Box sx={{ p: 6, textAlign: 'center', background: section.backgroundColor }}>
        <Typography>{section.text}</Typography>
        <Button sx={{ mt: 2, background: section.buttonColor }}>{section.buttonText}</Button>
      </Box>
    );
  }

  if (section.type === 'footer') {
    return (
      <Box sx={{ p: 3, textAlign: 'center', background: section.backgroundColor, color: section.textColor }}>
        {section.text}
      </Box>
    );
  }

  return null;
}

/* =====================================================
   EDITOR (SÓ O QUE É EDITÁVEL)
===================================================== */
function Editor({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  return (
    <Stack spacing={2}>
      {'title' in section && section.editable.includes('title') && (
        <TextField label="Título" value={section.title} onChange={e => onChange({ ...section, title: e.target.value })} />
      )}

      {'backgroundColor' in section && section.editable.includes('backgroundColor') && (
        <input type="color" value={section.backgroundColor} onChange={e => onChange({ ...section, backgroundColor: e.target.value })} />
      )}

      {'titleSize' in section && (
        <Slider min={24} max={72} value={section.titleSize} onChange={(_, v) => onChange({ ...section, titleSize: v as number })} />
      )}

      {'carousel' in section && (
        <Stack direction="row" alignItems="center">
          <Typography>Carrossel</Typography>
          <Switch checked={section.carousel} onChange={e => onChange({ ...section, carousel: e.target.checked })} />
        </Stack>
      )}
    </Stack>
  );
}

/* =====================================================
   APP
===================================================== */
export default function LandingPageBuilderPro() {
  const [plan, setPlan] = useState<Plan>('simple');
  const [sections, setSections] = useState<Section[]>(templates.simple);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Select fullWidth value={plan} onChange={e => {
              const p = e.target.value as Plan;
              setPlan(p);
              setSections(templates[p]);
            }}>
              <MenuItem value="simple">Layout Simples</MenuItem>
              <MenuItem value="advanced">Layout Avançado</MenuItem>
            </Select>

            <Divider sx={{ my: 2 }} />

            {sections.map(s => (
              <Button key={s.id} fullWidth variant={selected === s.id ? 'contained' : 'outlined'} onClick={() => setSelected(s.id)}>
                {s.type}
              </Button>
            ))}

            {selected && (
              <Editor
                section={sections.find(s => s.id === selected)!}
                onChange={sec => setSections(prev => prev.map(p => p.id === sec.id ? sec : p))}
              />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ height: '80vh', overflowY: 'auto' }}>
            {sections.map(s => <RenderSection key={s.id} section={s} />)}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
