import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

interface HeroSelectorProps {
    currentLayout: string;
    availableLayouts: any[];
    userPlan: string; // ou 'basico' | 'intermediario' | 'premium'
    onSelect: (id: string) => void;
}

export const HeroSelector: React.FC<HeroSelectorProps> = ({
    currentLayout,
    availableLayouts,
    onSelect,
    userPlan
}) => {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#555' }}>
                Estilo do Banner Principal
            </Typography>

            <Grid container spacing={2}>
                {availableLayouts.map((layout) => {
                    const isSelected = currentLayout === layout.id;
                    const isLocked = layout.plan === 'premium' && userPlan !== 'premium';

                    return (
                        <Grid size={6} key={layout.id}>
                            <Paper
                                elevation={isSelected ? 8 : 1}
                                onClick={() => !isLocked && onSelect(layout.id)}
                                sx={{
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    position: 'relative',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: isSelected ? '3px solid #6366f1' : '2px solid transparent',
                                    transition: 'all 0.3s ease',
                                    opacity: isLocked ? 0.6 : 1,
                                    '&:hover': {
                                        transform: isLocked ? 'none' : 'translateY(-4px)',
                                        boxShadow: isLocked ? 'none' : '0px 10px 20px rgba(0,0,0,0.1)'
                                    }
                                }}
                            >
                                {/* Thumbnail */}
                                <Box sx={{ height: 80, bgcolor: '#f0f0f0', position: 'relative' }}>
                                    <img
                                        src={layout.thumb}
                                        alt={layout.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />

                                    {/* Overlay de Selecionado */}
                                    {isSelected && (
                                        <Box sx={{
                                            position: 'absolute', top: 5, right: 5,
                                            bgcolor: '#6366f1', borderRadius: '50%',
                                            display: 'flex', p: 0.2
                                        }}>
                                            <CheckCircleIcon sx={{ color: 'white', fontSize: 18 }} />
                                        </Box>
                                    )}

                                    {/* Overlay de Bloqueado */}
                                    {isLocked && (
                                        <Box sx={{
                                            position: 'absolute', inset: 0,
                                            bgcolor: 'rgba(0,0,0,0.4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <LockIcon sx={{ color: 'white' }} />
                                        </Box>
                                    )}
                                </Box>

                                {/* Legenda */}
                                <Box sx={{ p: 1, textAlign: 'center', bgcolor: isSelected ? '#f8f9ff' : 'white' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                        {layout.name}
                                    </Typography>
                                    {isLocked && (
                                        <Typography variant="caption" color="error" sx={{ fontSize: '9px' }}>
                                            Plano Premium
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};