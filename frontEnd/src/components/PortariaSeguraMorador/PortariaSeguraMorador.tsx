import { useEffect, useState } from 'react';
import { 
  Box, Typography, Stack, Chip, Divider, 
  Tooltip, Skeleton, Alert, Dialog, DialogContent, DialogTitle, IconButton 
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import CloseIcon from '@mui/icons-material/Close';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

interface PortariaSeguraMoradorProps {
  open: boolean;
  onClose: () => void;
  listagemExterna?: any[]; // Propriedade opcional para dados vindos do Dashboard
}

export default function PortariaSeguraMorador({ 
  open, 
  onClose, 
  listagemExterna 
}: PortariaSeguraMoradorProps) {
  const { user } = useAuth();
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      // 1. Se os dados já vieram via Props (Dashboard), usamos eles
      if (listagemExterna) {
        setEncomendas(listagemExterna);
        setLoading(false);
        return;
      }

      // 2. Caso contrário, busca na API se o modal estiver aberto
      if (!open) return;

      try {
        setLoading(true);
        setError(false);

        if (user?.condominio_id) {
          const response = await api.get('/encomendas/meus-pacotes', {
            params: {
              condominio_id: user.condominio_id,
              status: 'PENDENTE'
            }
          });
          
          const lista = response.data.encomendas || response.data;
          setEncomendas(Array.isArray(lista) ? lista : []);
        }
      } catch (err) {
        console.error("Erro ao buscar encomendas:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [user, listagemExterna, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <InventoryIcon color="warning" />
          <Typography variant="h6" fontWeight="bold">Portaria Digital</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#f8f9fa' }}>
        <Box sx={{ width: '100%', py: 1 }}>
          <Stack direction="row" justifyContent="space-between" mb={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Pacotes aguardando retirada
            </Typography>
            {!loading && (
              <Chip 
                label={`${encomendas.length} pacote(s)`} 
                size="small" 
                color={encomendas.length > 0 ? "warning" : "default"} 
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Stack>

          <Stack spacing={2}>
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />)
            ) : error ? (
              <Alert severity="error" variant="outlined">Erro ao carregar dados da portaria.</Alert>
            ) : encomendas.length > 0 ? (
              encomendas.map((item) => (
                <Box 
                  key={item.id}
                  sx={{ 
                    p: 2, 
                    bgcolor: '#fff', 
                    borderRadius: 3, 
                    border: '1px solid #e0e0e0',
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <LocalShippingIcon sx={{ fontSize: 16, color: '#f57c00' }} />
                      <Typography variant="caption" fontWeight="900" color="warning.dark" sx={{ textTransform: 'uppercase' }}>
                        {item.transportadora}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {item.codigoRastreio}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" fontWeight="700" mb={1}>
                    {item.descricao || "Volumes diversos"}
                  </Typography>

                  <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Tooltip title={`Porteiro: ${item.porteiro?.nome || 'Sistema'}`}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Recebido por: **{item.porteiro?.nome?.split(' ')[0] || 'Portaria'}**
                        </Typography>
                      </Stack>
                    </Tooltip>

                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <QueryBuilderIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.dataRecebimento).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <InventoryIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Nenhuma encomenda pendente.
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}