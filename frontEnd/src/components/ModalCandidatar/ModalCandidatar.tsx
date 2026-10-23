// src/components/ModalCandidatar/ModalCandidatar.tsx
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography, Box, IconButton } from '@mui/material';
import { Close as CloseIcon, Paid, CalendarMonth } from '@mui/icons-material';
import api from '../../api/api';
import toast from 'react-hot-toast';

interface ModalCandidatarProps {
  open: boolean;
  handleClose: () => void;
  servico: any;
  onSuccess: () => void;
}

export default function ModalCandidatar({ open, handleClose, servico, onSuccess }: ModalCandidatarProps) {
  const [valorProposto, setValorProposto] = useState('');
  const [mensagem, setMensagem] = useState('');

  // 🚀 O CAMPO QUE FALTAVA: Estado para controlar a quantidade de sessões/visitas inclusas no pacote
  const [totalSessoes, setTotalSessoes] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!valorProposto || Number(valorProposto) <= 0) {
      toast.error('Informe um valor válido para a proposta comercial.');
      return;
    }

    if (!totalSessoes || Number(totalSessoes) <= 0) {
      toast.error('A quantidade de sessões deve ser no mínimo 1.');
      return;
    }

    setSubmitting(true);
    try {
      // Rota oficial e genérica de candidaturas.
      // O mesmo contrato atende todas as categorias de serviço.
      await api.post('/servicos/candidato/candidaturas', {
        solicitacaoId: servico.id,
        proposta_valor: Number(valorProposto),
        mensagem: mensagem || `Olá! Tenho interesse no seu pedido de ${servico.titulo}.`,
        totalSessoes: Number(totalSessoes)
      });

      toast.success('Sua proposta e cronograma estruturado foram enviados!');
      setValorProposto('');
      setMensagem('');
      setTotalSessoes('1');
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('[CANDIDATURA] Erro ao enviar proposta:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message
      });

      const msgErro =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao enviar candidatura.';

      toast.error(msgErro);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ backdrop: { style: { backdropFilter: 'blur(4px)' } } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
        <Box>
          <Typography variant="h6" fontWeight="900">Enviar Orçamento Comercial</Typography>
          <Typography variant="caption" color="text.secondary">Pedido: {servico?.titulo}</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>

          <Stack direction="row" spacing={2}>
            {/* Campo de Preço */}
            <TextField
              fullWidth
              label="Valor Total da Proposta"
              placeholder="0,00"
              type="number"
              slotProps={{ input: { startAdornment: <Paid color="action" sx={{ mr: 1, fontSize: 20 }} /> } }}
              value={valorProposto}
              onChange={(e) => setValorProposto(e.target.value)}
            />

            {/* 🚀 O INPUT VISUAL: Campo numérico para o prestador definir a quantidade de sessões */}
            <TextField
              fullWidth
              label="Quantidade de Sessões / Visitas"
              type="number"
              slotProps={{
                input: {
                  startAdornment: <CalendarMonth color="action" sx={{ mr: 1, fontSize: 20 }} />
                }
              }}
              // 👈 Os atributos HTML nativos ficam aqui na raiz usando o inputProps
              inputProps={{ min: 1, max: 100 }}
              value={totalSessoes}
              onChange={(e) => setTotalSessoes(e.target.value)}
              helperText="Em quantas visitas você dividirá este trabalho?"
            />
          </Stack>

          {/* Campo de Mensagem */}
          <TextField
            fullWidth
            label="Detalhes ou Escopo do Serviço"
            placeholder="Descreva o que está incluso no seu atendimento, cronograma e garantias..."
            multiline
            rows={4}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />

        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar Proposta Firme'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}