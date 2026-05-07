import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Stack,
  Chip, Avatar, Divider, InputAdornment
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Ícone de confirmação
import api from '../../api/api';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  trabalho: any;
  onUpdate: () => void;
}

export default function ModalNegociarTrabalho({ open, onClose, trabalho, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [novoValor, setNovoValor] = useState('');

  // ESSENCIAL: Sincroniza o valor do campo sempre que o trabalho mudar ou o modal abrir
  useEffect(() => {
    if (open && trabalho) {
      setNovoValor(trabalho.valor_proposto || '');

      // DEBUG: Isso vai mostrar no console do seu navegador (F12) 
      // exatamente o que o banco enviou para o frontend
      console.log("Status vindo do Banco:", trabalho.status);
      console.log("Valor vindo do Banco:", trabalho.valor_proposto);
    }
  }, [open, trabalho]);

  if (!trabalho) return null;

  const isAceito = trabalho.status === 'ACEITA' || trabalho.status === 'ACORDO_FECHADO';
  const isConcluido = trabalho.status === 'CONCLUIDO';

  // Garante que ignore letras maiúsculas/minúsculas
  const isPropostaMorador = trabalho.status?.toUpperCase() === 'PROPOSTA_MORADOR';
  // 1. FUNÇÃO PARA ACEITAR A PROPOSTA DO MORADOR
  const handleAceitarAcordo = async () => {
    if (!window.confirm("Deseja aceitar este valor e fechar o acordo agora?")) return;
    try {
      setLoading(true);
      // Chamada para o endpoint que altera o status para 'ACEITA' ou 'ACORDO_FECHADO'
      await api.post(`/servicos/candidaturas/${trabalho.id}/aceitar`);
      toast.success("Acordo fechado! O serviço já pode começar.");
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao aceitar acordo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclinar = async () => {
    if (!window.confirm("Deseja realmente retirar sua candidatura?")) return;
    try {
      setLoading(true);
      await api.delete(`/servicos/candidaturas/${trabalho.id}`);
      toast.success("Candidatura removida.");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Erro ao retirar candidatura.");
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarProposta = async () => {
    try {
      setLoading(true);
      await api.post('/servicos/candidaturas/proposta', {
        candidaturaId: trabalho.id,
        valor: Number(novoValor),
        mensagem: "Nova contraproposta enviada pelo prestador"
      });
      toast.success("Nova proposta enviada ao morador!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao atualizar negociação.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarServico = async () => {
    if (!window.confirm("Confirmar que o serviço foi entregue e solicitar pagamento?")) return;
    try {
      setLoading(true);
      await api.post(`/servicos/candidaturas/${trabalho.id}/concluir`);
      toast.success("Serviço finalizado!");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Erro ao finalizar serviço.");
    } finally {
      setLoading(false);
    }
  };

  if (!trabalho) return null;

  const morador = trabalho?.solicitacao?.morador;


console.log("Status vindo do Banco:", trabalho.status); 
console.log("Valor vindo do Banco:", trabalho.valor_proposto);

  return (<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle
      component="div"
      sx={{
        bgcolor: isAceito ? 'success.main' : isPropostaMorador ? 'info.main' : 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <BusinessCenterIcon />
      <Typography variant="h6" fontWeight="bold" component="span">
        {isAceito ? "Serviço em Andamento" : "Negociação de Proposta"}
      </Typography>
    </DialogTitle>

    <DialogContent dividers>
      <Stack spacing={3}>
        <Box>
          <Chip
            label={trabalho.status.replace('_', ' ')}
            color={isAceito ? "success" : isPropostaMorador ? "info" : "warning"}
            sx={{ fontWeight: 'bold', mb: 1 }}
          />
          <Typography variant="h5" fontWeight="bold">{trabalho.solicitacao?.titulo}</Typography>
          <Typography variant="body2" color="text.secondary">{trabalho.solicitacao?.descricao}</Typography>
        </Box>

        <Divider />

        {/* Dados do Cliente */}
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3 }}>
          <Typography variant="overline" color="text.secondary" fontWeight="bold">Cliente</Typography>
          <Stack direction="row" spacing={2} alignItems="center" mt={1}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>{morador?.nome?.charAt(0)}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">{morador?.nome || 'Morador'}</Typography>
              <Typography variant="body2">Bl: {morador?.bloco} - Un: {morador?.unidade}</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Área de Valor */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {isAceito ? "Valor Combinado" : "Valor Proposto"}
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            disabled={isAceito || loading}
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
        </Box>
      </Stack>
    </DialogContent>

    <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: '#f8f9fa' }}>
      <Button onClick={onClose} color="inherit" disabled={loading}>Fechar</Button>

      <Stack direction="row" spacing={1}>

        {isPropostaMorador && (
          <>
            <Button color="error" onClick={handleDeclinar} disabled={loading}>
              Declinar
            </Button>

            {/* Usando uma lógica mais tolerante para comparação de números/strings */}
            {String(novoValor) === String(trabalho.valor_proposto) ? (
              <Button
                variant="contained"
                color="success"
                onClick={handleAceitarAcordo}
                disabled={loading}
                startIcon={<CheckCircleIcon />}
              >
                Aceitar Proposta
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleAtualizarProposta}
                disabled={loading}
              >
                Enviar Contraproposta
              </Button>
            )}
          </>
        )}

        {trabalho.status === 'PENDENTE' && (
          <Button variant="contained" onClick={handleAtualizarProposta} disabled={loading}>
            Atualizar Valor
          </Button>
        )}

        {isAceito && !isConcluido && (
          <Button variant="contained" color="success" onClick={handleFinalizarServico}>
            Finalizar Trabalho
          </Button>
        )}
      </Stack>
    </DialogActions>
  </Dialog>
  );

}