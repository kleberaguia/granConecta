import { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import StorefrontIcon from '@mui/icons-material/Storefront'; // Ícone da loja
import ArticleIcon from '@mui/icons-material/Article';

// Imports dos Editores
import TextSectionEditor, { type TextSectionData } from '../sections/TextSectionEditor';
import VitrineSectionEditor, { type VitrineSectionData } from '../sections/VitrineSectionEditor';
// ... importe os outros editores (Gallery, Video) conforme seu projeto ...

// --- TIPAGEM GERAL ---
export type Section =
  | { id: string; type: 'text'; data: TextSectionData }
  | { id: string; type: 'system-vitrine'; data: VitrineSectionData } // <--- O NOVO TIPO
  // ... adicione os outros tipos (gallery, video) ...
  | { id: string; type: 'any'; data: any }; // Fallback

interface PageBuilderProps {
  initialData?: Section[];
  onChange: (sections: Section[]) => void;
}

export default function PageBuilder({ initialData = [], onChange }: PageBuilderProps) {
  const [sections, setSections] = useState<Section[]>(initialData || []);

  useEffect(() => {
    if (initialData) setSections(initialData);
  }, [initialData]);

  const updateSections = (newSections: Section[]) => {
      setSections(newSections);
      onChange(newSections);
  };

  const addSection = (type: string) => {
    let data: any = {};
    if (type === 'text') data = { html: '' };
    
    // Dados iniciais da Vitrine
    if (type === 'system-vitrine') {
        data = { 
            slugTarget: '', 
            titulo_pagina: 'Profissionais em Destaque',
            exibir_hero: true,
            exibir_premium: true,
            exibir_basicos: true,
            cor_fundo: '#121212'
        };
    }

    const newSection: Section = {
      id: Date.now().toString(),
      type: type as any,
      data,
    };

    updateSections([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    updateSections(newSections);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newSections = [...sections];
    if (index + direction < 0 || index + direction >= newSections.length) return;
    const item = newSections[index];
    newSections.splice(index, 1);
    newSections.splice(index + direction, 0, item);
    updateSections(newSections);
  };

  const updateSectionData = (index: number, newData: any) => {
    const newSections = sections.map((section, i) => {
        if (i === index) return { ...section, data: newData };
        return section;
    });
    updateSections(newSections);
  };

  return (
    <Box>
      {sections.map((section, index) => (
        <Paper
          key={section.id}
          sx={{
            p: 2, mb: 2,
            borderLeft: section.type === 'system-vitrine' ? '6px solid #ed6c02' : '4px solid #1976d2',
            bgcolor: '#fafafa',
          }}
        >
          {/* CABEÇALHO DA SEÇÃO */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: 1 }}>
              {section.type === 'system-vitrine' && <StorefrontIcon sx={{fontSize: 18, color: '#ed6c02'}} />}
              {index + 1}: {section.type}
            </Typography>
            <Box>
              <IconButton size="small" onClick={() => moveSection(index, -1)} disabled={index === 0}><ArrowUpwardIcon /></IconButton>
              <IconButton size="small" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1}><ArrowDownwardIcon /></IconButton>
              <IconButton size="small" color="error" onClick={() => removeSection(index)}><DeleteIcon /></IconButton>
            </Box>
          </Box>

          {/* RENDERIZAÇÃO CONDICIONAL DOS EDITORES */}
          {section.type === 'text' && (
            <TextSectionEditor data={section.data} onChange={(d) => updateSectionData(index, d)} />
          )}
          
          {section.type === 'system-vitrine' && (
            <VitrineSectionEditor data={section.data} onChange={(d) => updateSectionData(index, d)} />
          )}

          {/* Adicione os outros editores (Video, Gallery) aqui... */}

        </Paper>
      ))}

      {/* BARRA DE FERRAMENTAS */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, p: 3, border: '2px dashed #ccc', borderRadius: 2, flexWrap: 'wrap', bgcolor: 'rgba(0,0,0,0.02)' }}>
        <Typography sx={{ width: '100%', textAlign: 'center', mb: 1, fontWeight: 'bold', color: '#666' }}>
          Adicionar Novo Bloco:
        </Typography>
        
        <Button variant="outlined" startIcon={<ArticleIcon />} onClick={() => addSection('text')}>
          Texto
        </Button>

        {/* BOTÃO DA VITRINE */}
        <Button 
            variant="contained" 
            color="warning" 
            startIcon={<StorefrontIcon />} 
            onClick={() => addSection('system-vitrine')}
            sx={{ fontWeight: 'bold' }}
        >
          Vitrine / Lista
        </Button>
        
        {/* Adicione os outros botões aqui */}
      </Box>
    </Box>
  );
}