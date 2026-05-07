
import { 
  Box, TextField, Typography, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
// Mantendo a importação solicitada
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaletteIcon from '@mui/icons-material/Palette';

interface StyleEditorProps {
  styles?: Record<string, string>;
  onStyleChange: (key: string, value: string) => void;
}

export default function StyleEditor({ styles, onStyleChange }: StyleEditorProps) {
  if (!styles || Object.keys(styles).length === 0) {
    return null;
  }

  return (
    <Accordion disableGutters elevation={0} sx={{ border: '1px dashed #ccc', bgcolor: '#fcfcfc' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
         <Box display="flex" alignItems="center" gap={1}>
            <PaletteIcon color="action" fontSize="small" />
            <Typography variant="subtitle2">Personalização de Cores (CSS)</Typography>
         </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {Object.entries(styles).map(([key, value]) => (
            // ADAPTADO: xs={12} sm={6} md={4} -> size={{ xs: 12, sm: 6, md: 4 }}
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label={key.replace('--', '').replace(/-/g, ' ')}
                value={value}
                onChange={(e) => onStyleChange(key, e.target.value)}
                fullWidth
                size="small"
                helperText={key}
                InputProps={{ 
                    startAdornment: (value.startsWith('#') || value.startsWith('rgb')) ? (
                        <Box 
                            sx={{ 
                                width: 16, height: 16, borderRadius: '50%', 
                                bgcolor: value, mr: 1, border: '1px solid #ddd' 
                            }} 
                        />
                    ) : null
                }}
              />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}