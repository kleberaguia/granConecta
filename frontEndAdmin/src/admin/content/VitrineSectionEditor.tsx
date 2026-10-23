import { Box, TextField, FormControlLabel, Switch, Typography, Divider } from '@mui/material';

// Essa interface deve bater com o PageLayoutConfig do componente acima
export interface VitrineSectionData {
    slugTarget: string;
    titulo_pagina: string;
    exibir_hero: boolean;
    exibir_premium: boolean;
    exibir_basicos: boolean;
    cor_fundo: string;
}

interface Props {
    data: VitrineSectionData;
    onChange: (data: VitrineSectionData) => void;
}

export default function VitrineSectionEditor({ data, onChange }: Props) {
    // Valores padrão para não quebrar
    const safeData: VitrineSectionData = {
        slugTarget: data.slugTarget || '',
        titulo_pagina: data.titulo_pagina || 'Nossos Profissionais',
        exibir_hero: data.exibir_hero ?? true,       // Se for null/undefined, usa true. Se for false, mantém false.
        exibir_premium: data.exibir_premium ?? true,
        exibir_basicos: data.exibir_basicos ?? true,
        cor_fundo: data.cor_fundo || '#121212',
    };

    const handleChange = (field: keyof VitrineSectionData, value: any) => {
        onChange({ ...safeData, [field]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                CONFIGURAÇÃO DO BLOCO VITRINE
            </Typography>

            <TextField
                label="Slug da Categoria (Obrigatório)"
                fullWidth
                value={safeData.slugTarget}
                onChange={(e) => handleChange('slugTarget', e.target.value)}
                helperText="Ex: 'pedreiro', 'encanador'. O sistema buscará usuários com essa profissão."
                variant="filled"
                color="warning"
            />

            <Divider />

            <TextField
                label="Título Visível na Página"
                fullWidth
                size="small"
                value={safeData.titulo_pagina}
                onChange={(e) => handleChange('titulo_pagina', e.target.value)}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControlLabel
                    control={<Switch checked={safeData.exibir_hero} onChange={(e) => handleChange('exibir_hero', e.target.checked)} />}
                    label="Banner Destaque"
                />
                <FormControlLabel
                    control={<Switch checked={safeData.exibir_premium} onChange={(e) => handleChange('exibir_premium', e.target.checked)} />}
                    label="Carrossel Premium"
                />
                <FormControlLabel
                    control={<Switch checked={safeData.exibir_basicos} onChange={(e) => handleChange('exibir_basicos', e.target.checked)} />}
                    label="Lista Geral"
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                <Typography variant="body2">Cor de Fundo:</Typography>
                <input
                    type="color"
                    value={safeData.cor_fundo}
                    onChange={(e) => handleChange('cor_fundo', e.target.value)}
                    style={{ width: 40, height: 30, border: 'none', cursor: 'pointer' }}
                />
                <Typography variant="caption">{safeData.cor_fundo}</Typography>
            </Box>
        </Box>
    );
}