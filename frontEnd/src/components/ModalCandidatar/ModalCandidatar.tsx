import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  InputAdornment,
  Stack,
  Avatar // 👈 Adicionado
} from '@mui/material';
import api from '../../api/api';
import LocationOnIcon from '@mui/icons-material/LocationOn'; // 👈 Adicionado para o endereço
import { API_URL } from '../../utils/config';

interface ModalProps {
  open: boolean;
  handleClose: () => void;
  onSuccess: () => void | Promise<void>;
  servico?: any;
}

export default function ModalCandidatar({
  open,
  handleClose,
  servico,
  onSuccess
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [valor, setValor] = useState(servico?.valor_sugerido || '');
  const [mensagem, setMensagem] = useState('');

  // Extraímos os dados do cliente (ajuste os nomes dos campos conforme sua API)
  const clienteNome = servico?.usuario?.nome || "Cliente";
  const clienteFoto = servico?.usuario?.foto_perfil_url || "";
  const clienteCondominio = servico.condominio
  const clienteBairro = servico.bairro
  const clienteCidade = servico.cidade
  const clienteUf = servico.uf
  const clienteBlocoTorre = servico.bloco_torre
  const clienteUnidade_apto = servico.unidade_apto

  const handleEnviarProposta = async () => {
    if (!valor || Number(valor) <= 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/servicos/candidato/candidaturas', {
        solicitacaoId: servico?.id,
        proposta_valor: Number(valor),
        mensagem: mensagem
      });

      alert("Candidatura enviada!");
      onSuccess();
      handleClose();
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao se candidatar.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejeitar = async () => {
    setLoading(true);
    try {
      await api.post('/servicos/solicitacoes/ignorar', {
        solicitacaoId: servico?.id
      });

      alert("Entendido! Não mostraremos mais esta oportunidade.");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Erro ao ocultar serviço", error);
    } finally {
      setLoading(false);
    }
  };

  if (!servico) return null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle
        component="div"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Typography variant="h6" fontWeight="bold" component="span">
          Análise de Oportunidade
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>

          {/* --- NOVO BLOCO: INFORMAÇÕES DO SOLICITANTE --- */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            bgcolor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid #e2e8f0'
          }}>
            <Avatar
              src={`${API_URL}${clienteFoto}`}
              sx={{ width: 56, height: 56, boxShadow: 1 }}
            >
              {clienteNome.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Solicitado por:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                {clienteNome}
              </Typography>
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Condominio: {clienteCondominio}  ;
                  Torre/Bloco: {clienteBlocoTorre} ;
                  Apto: {clienteUnidade_apto}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {clienteBairro}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {clienteCidade}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {clienteUf}
                </Typography>
              </Stack>
            </Box>
          </Box>
          {/* --------------------------------------------- */}

          <Box sx={{ p: 2, bgcolor: '#fff4e5', borderRadius: 2, border: '1px solid #ffe2b7' }}>
            <Typography variant="subtitle2" color="#663c00" fontWeight="bold" component="div">
              Atenção Prestador:
            </Typography>
            <Typography variant="body2" color="#663c00">
              O valor abaixo é uma sugestão inicial. Você pode enviar sua proposta e ajustar os detalhes depois.
            </Typography>
          </Box>

          <TextField
            label="Sua Proposta Base (R$)"
            fullWidth
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />

          <TextField
            label="Dúvidas ou Observações"
            fullWidth
            multiline
            rows={3}
            placeholder="Ex: 'O valor pode variar...'"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleRejeitar}
          color="error"
          sx={{ mr: 'auto' }}
          disabled={loading}
        >
          Não tenho interesse
        </Button>

        <Button onClick={handleClose} color="inherit">Voltar</Button>

        <Button
          onClick={handleEnviarProposta}
          variant="contained"
          disabled={loading || !valor}
          sx={{ fontWeight: 'bold' }}
        >
          {loading ? 'Enviando...' : 'Iniciar Negociação'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}