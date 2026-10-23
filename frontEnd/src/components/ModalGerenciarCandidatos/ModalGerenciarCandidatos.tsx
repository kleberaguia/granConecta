import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Stack, Paper, Typography,
  Avatar, Button, Box, IconButton, Chip, TextField, InputAdornment, alpha
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import CloseIcon from '@mui/icons-material/Close';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { API_URL } from '../../utils/config';

// --- INTERFACES ---
interface Prestador {
  id: string;
  nome: string;
  foto_perfil_url?: string | null;
  descricao_bio?: string | null;
  nota_media?: number;
  whatsapp_comercial?: string | null;
  telefone?: string | null;
}

interface Candidatura {
  id: string;
  valor_proposto: number;
  mensagem: string;
  prestador: Prestador;
  status: string;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  solicitacao: any;
  onSuccess: () => void | Promise<void>; 
  onAceitar?: (id: string) => void;      
  onContraproposta?: (id: string, valor: number, mensagem: string) => void; 
}

export default function ModalGerenciarCandidatos({
  open, 
  onClose, 
  solicitacao, 
  onAceitar, 
  onContraproposta, 
  
}: ModalProps) {
  const [candidatoSelecionado, setCandidatoSelecionado] = useState<Candidatura | null>(null);
  const [novoValor, setNovoValor] = useState<string>('');
  const [mensagemContraproposta, setMensagemContraproposta] = useState('');

  const statusSolicitacaoBloqueado = solicitacao?.status === 'EM_EXECUCAO' || solicitacao?.status === 'CONCLUIDO';
  const temAlgumAcordoFechado = solicitacao?.candidaturas?.some((c: any) => c.status === 'ACORDO_FECHADO');
  const isBloqueadoParaInteracao = statusSolicitacaoBloqueado || temAlgumAcordoFechado;
  const esteCandidatoVenceu = candidatoSelecionado?.status === 'ACORDO_FECHADO';

  // Resetar estados
  useEffect(() => {
    if (!open) {
      setCandidatoSelecionado(null);
      setNovoValor('');
      setMensagemContraproposta('');
    }
  }, [open]);

  useEffect(() => {
    if (candidatoSelecionado) {
      setNovoValor(candidatoSelecionado.valor_proposto.toString());
      setMensagemContraproposta('');
    }
  }, [candidatoSelecionado]);

  // Funções de disparo seguro
  const handleAceitarClick = () => {
    if (candidatoSelecionado && onAceitar) {
      onAceitar(candidatoSelecionado.id);
    }
  };

  const handleContrapropostaClick = () => {
    if (candidatoSelecionado && onContraproposta) {
      onContraproposta(
        candidatoSelecionado.id, 
        Number(novoValor), 
      
        mensagemContraproposta
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Propostas para: {solicitacao?.titulo || "Serviço"}
          </Typography>
          <Chip 
            label={isBloqueadoParaInteracao ? "CONTRATAÇÃO FINALIZADA" : "EM NEGOCIAÇÃO"} 
            color={isBloqueadoParaInteracao ? "success" : "warning"}
            size="small"
            sx={{ fontWeight: 'bold', mt: 0.5 }}
          />
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Grid container sx={{ minHeight: 500 }}>

          {/* COLUNA ESQUERDA */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ borderRight: '1px solid #eee', p: 2, bgcolor: '#fafafa' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mb: 2 }}>
              {solicitacao?.candidaturas?.length || 0} Candidatos interessados
            </Typography>

            <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: 'auto', pr: 1, mb: 2 }}>
              {solicitacao?.candidaturas?.map((cand: Candidatura) => (
                <Paper
                  key={cand.id}
                  elevation={candidatoSelecionado?.id === cand.id ? 3 : 0}
                  onClick={() => setCandidatoSelecionado(cand)}
                  sx={{
                    p: 2, cursor: 'pointer', borderRadius: 2,
                    border: '1px solid',
                    borderColor: cand.status === 'ACORDO_FECHADO' ? 'success.main' : (candidatoSelecionado?.id === cand.id ? 'primary.main' : '#eee'),
                    bgcolor: cand.status === 'ACORDO_FECHADO' ? alpha('#10b981', 0.05) : '#fff'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={`${API_URL}${cand.prestador?.foto_perfil_url}`} sx={{ width: 45, height: 45 }}>
                      {cand.prestador?.nome[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {cand.prestador?.nome} {cand.status === 'ACORDO_FECHADO' && " ✅"}
                      </Typography>
                      <Typography variant="subtitle2" color="primary.main" fontWeight="900">
                        R$ {Number(cand.valor_proposto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>

            {candidatoSelecionado && !isBloqueadoParaInteracao && (
              <Stack spacing={2} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee', mt: 'auto' }}>
                <Typography variant="subtitle2" fontWeight="bold">Negociar com este profissional:</Typography>
                
                <TextField
                  label="Valor da Contraproposta"
                  fullWidth size="small" type="number"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                />

                <TextField
                  label="Mensagem para o profissional"
                  fullWidth size="small" multiline rows={2}
                  placeholder="Ex: Consegue fazer por este valor?"
                  value={mensagemContraproposta}
                  onChange={(e) => setMensagemContraproposta(e.target.value)}
                />

                <Button
                  variant="contained" 
                  fullWidth
                  disabled={!novoValor || !mensagemContraproposta || !onContraproposta}
                  onClick={handleContrapropostaClick}
                >
                  Enviar Contraproposta
                </Button>
              </Stack>
            )}
            
            {isBloqueadoParaInteracao && (
              <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9', borderRadius: 2 }}>
                <Typography variant="caption" color="success.main" fontWeight="bold">
                  NEGOCIAÇÕES ENCERRADAS
                </Typography>
              </Box>
            )}
          </Grid>

          {/* COLUNA DIREITA */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, overflowY: 'auto', maxHeight: 600 }}>
            {candidatoSelecionado ? (
              <Stack spacing={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={`${API_URL}${candidatoSelecionado.prestador?.foto_perfil_url}`}
                    sx={{ width: 90, height: 90, mx: 'auto', mb: 1.5, boxShadow: 3, border: '3px solid white' }}
                  />
                  <Typography variant="h6" fontWeight="bold">{candidatoSelecionado.prestador?.nome}</Typography>
                </Box>

                <Box sx={{ bgcolor: esteCandidatoVenceu ? '#e8f5e9' : '#f0f7ff', p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color={esteCandidatoVenceu ? "success.main" : "primary"} fontWeight="bold">
                    {esteCandidatoVenceu ? "VALOR DO ACORDO FECHADO" : "VALOR ATUAL DA PROPOSTA"}
                  </Typography>
                  <Typography variant="h5" fontWeight="900" color={esteCandidatoVenceu ? "success.main" : "primary"}>
                    R$ {Number(candidatoSelecionado.valor_proposto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                  {!isBloqueadoParaInteracao ? (
                    <Button
                      variant="contained" fullWidth color="success"
                      startIcon={<CheckCircleIcon />} size="large"
                      disabled={!onAceitar}
                      onClick={handleAceitarClick}
                      sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
                    >
                      Aceitar Proposta
                    </Button>
                  ) : (
                    <Button
                      variant="contained" fullWidth disabled size="large"
                      sx={{ 
                        py: 1.5, borderRadius: 2,
                        "&.Mui-disabled": {
                          bgcolor: esteCandidatoVenceu ? 'success.main' : '#e0e0e0',
                          color: esteCandidatoVenceu ? 'white' : 'rgba(0,0,0,0.3)'
                        }
                      }}
                    >
                      {esteCandidatoVenceu ? "Profissional Contratado" : "Serviço em Execução"}
                    </Button>
                  )}

                  <Button
                    variant="outlined" color="success"
                    onClick={() => {
                      const fone = candidatoSelecionado.prestador?.whatsapp_comercial || candidatoSelecionado.prestador?.telefone;
                      window.open(`https://wa.me/55${fone?.replace(/\D/g, '')}`, '_blank');
                    }}
                    sx={{ borderRadius: 2, minWidth: 60 }}
                  >
                    <WhatsAppIcon />
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <EngineeringIcon sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h6">Selecione um candidato</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}