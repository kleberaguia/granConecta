// DynamicServiceForm.tsx

import { TextField, Select, MenuItem, FormControl, InputLabel, Button, Grid, Box } from "@mui/material";
import { SERVICE_FORM_CONFIG } from "../utils/serviceFormConfig";


export default function DynamicServiceForm({
    slug,
    values,
    onChange
}: any) {

    const config = SERVICE_FORM_CONFIG[slug] || SERVICE_FORM_CONFIG.default;

    console.log("SLUG GERADO:", slug);
    console.log("CONFIG EXISTE?", SERVICE_FORM_CONFIG[slug]);
    console.log('configggggggggggggggggggg ', config)

    return (
        <Grid container spacing={2}>
            {config.map((field: any) => {

                const isFull = field.fullWidth;

                const gridSize = isFull ? 12 : 6;

                // TEXT
                if (field.type === 'text') {
                    return (
                        <Grid size={{ xs: 12, sm: gridSize }} key={field.name}>
                            <TextField
                                label={field.label}
                                fullWidth
                                size="small"
                                value={values[field.name] || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                            />
                        </Grid>
                    );
                }

                // SELECT
                if (field.type === 'select') {
                    return (
                        <Grid size={{ xs: 12, sm: gridSize }} key={field.name}>
                            <FormControl fullWidth size="small">
                                <InputLabel>{field.label}</InputLabel>
                                <Select
                                    value={values[field.name] || ''}
                                    label={field.label}
                                    onChange={(e) => onChange(field.name, e.target.value)}
                                >
                                    {field.options.map((opt: string) => (
                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    );
                }

                // DATE
                if (field.type === 'datetime') {
                    return (
                        <Grid size={{ xs: 12, sm: gridSize }} key={field.name}>
                            <TextField
                                type="datetime-local"
                                label={field.label}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                size="small"
                                value={values[field.name] || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                            />
                        </Grid>
                    );
                }

                // FILE
                if (field.type === 'file') {
                    return (
                        <Grid size={12} key={field.name}>
                            <Box>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    sx={{ py: 1.5 }}
                                >
                                    {field.label}
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        onChange={(e) => onChange(field.name, e.target.files)}
                                    />
                                </Button>
                            </Box>
                        </Grid>
                    );
                }

                return null;
            })}
        </Grid>
    )
};