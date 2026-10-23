import { useState, useEffect } from 'react';
import { 
  Typography, Paper, TextField, Switch, 
  FormControlLabel, Stack, Button, InputAdornment, Divider, 
  Grid
} from '@mui/material';
import { Timer, Save } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';


export const DeliverySettings = ({ storeId }: { storeId: string }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    acceptDelivery: true,
    acceptPickup: true,
    deliveryFee: 0,
    estimatedTime: '40-60 min',
    minOrderValue: 0,
    deliveryRadius: 0 // Em km, opcional para o GranConecta
  });

  useEffect(() => {
    loadDeliveryConfig();
  }, [storeId]);

  const loadDeliveryConfig = async () => {
    try {
      const res = await api.get(`/lojas/delivery-config/${storeId}`);
      if (res.data) setConfig(res.data);
    } catch (err) {
      console.error("Erro ao carregar config de entrega", err);
    }
  };

  const handleSave = async () => {

    console.log('storeIdddddddddddddddddd ', storeId)
    setLoading(true);
    try {
      await api.post(`/lojas/delivery-config`, { ...config, storeId });
      toast.success("Configurações de entrega salvas!");
    } catch (err) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: '16px' }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Configurações de Logística
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
        Defina como seus vizinhos receberão os produtos no condomínio.
      </Typography>

      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
          <FormControlLabel
            control={<Switch checked={config.acceptDelivery} onChange={(e) => setConfig({...config, acceptDelivery: e.target.checked})} />}
            label="Ofereço Entrega (Delivery)"
          />
          <FormControlLabel
            control={<Switch checked={config.acceptPickup} onChange={(e) => setConfig({...config, acceptPickup: e.target.checked})} />}
            label="Permito Retirada no Local"
          />
        </Stack>

        <Divider />

        <Grid container spacing={3}>
          <Grid size={{xs:12, md:4}}>
            <TextField
              fullWidth
              label="Taxa de Entrega"
              type="number"
              value={config.deliveryFee}
              onChange={(e) => setConfig({...config, deliveryFee: Number(e.target.value)})}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              helperText="Deixe 0.00 para entrega grátis"
            />
          </Grid>
          <Grid size={{xs:12, md:4}}>
            <TextField
              fullWidth
              label="Tempo Estimado"
              placeholder="Ex: 30 min ou 1 dia útil"
              value={config.estimatedTime}
              onChange={(e) => setConfig({...config, estimatedTime: e.target.value})}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Timer size={18} /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={{xs:12, md:4}}>
            <TextField
              fullWidth
              label="Pedido Mínimo"
              type="number"
              value={config.minOrderValue}
              onChange={(e) => setConfig({...config, minOrderValue: Number(e.target.value)})}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>

        <Button 
          variant="contained" 
          startIcon={<Save />} 
          onClick={handleSave}
          disabled={loading}
          sx={{ borderRadius: '12px', py: 1.5, mt: 2 }}
        >
          {loading ? "Salvando..." : "Salvar Configurações de Logística"}
        </Button>
      </Stack>
    </Paper>
  );
};