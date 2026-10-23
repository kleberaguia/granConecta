import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, Paper, Typography, TextField, Button, 
  Alert, Link, Box, IconButton, InputAdornment 
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import api from '../../api/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  // Estados de controle
  const [step, setStep] = useState(1); // 1: Email, 2: Código + Nova Senha
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Enviar e-mail de recuperação
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess('Código de recuperação enviado para o seu e-mail.');
      setStep(2); // Muda para o passo do código
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar e-mail.');
    } finally {
      setLoading(false);
    }
  };

  // Resetar a senha com o código recebido
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', { 
        email: email.trim(), 
        token: codigo, // O código 2FA enviado
        newPassword: novaSenha 
      });
      
      setSuccess('Senha alterada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, width: '100%', bgcolor: '#1e1e1e', color: 'white', borderRadius: 2 }}>
        
        <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={() => step === 1 ? navigate('/login') : setStep(1)} sx={{ color: 'white', mr: 1 }}>
                <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
                Recuperar Senha
            </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {step === 1 ? (
          /* PASSO 1: Solicitar Código */
          <form onSubmit={handleRequestCode}>
            <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
              Digite seu e-mail e enviaremos um código de verificação para você criar uma nova senha.
            </Typography>
            <TextField
              fullWidth
              label="E-mail cadastrado"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={inputStyle}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={buttonStyle}
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </Button>
          </form>
        ) : (
          /* PASSO 2: Validar Código e Nova Senha */
          <form onSubmit={handleResetPassword}>
            <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
              Insira o código enviado para <b>{email}</b> e escolha sua nova senha.
            </Typography>
            
            <TextField
              fullWidth
              label="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              margin="normal"
              required
              sx={inputStyle}
            />

            <TextField
              fullWidth
              label="Nova Senha"
              type={showSenha ? 'text' : 'password'}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowSenha(!showSenha)} sx={{ color: '#aaa' }}>
                      {showSenha ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={buttonStyle}
            >
              {loading ? 'Redefinindo...' : 'Alterar Senha'}
            </Button>
          </form>
        )}

        <Box textAlign="center" mt={3}>
          <Link component={RouterLink} to="/login" underline="hover" sx={{ color: '#aaa', fontSize: '0.9rem' }}>
            Voltar para o Login
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}

// Estilos reutilizáveis para manter o padrão Dark
const inputStyle = {
  mb: 2,
  input: { color: 'white' },
  label: { color: '#aaa' },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#555' },
    '&:hover fieldset': { borderColor: '#FFD700' },
    '&.Mui-focused fieldset': { borderColor: '#FFD700' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' }
};

const buttonStyle = {
  mt: 2,
  bgcolor: '#FFD700',
  color: 'black',
  fontWeight: 'bold',
  '&:hover': { bgcolor: '#e6c200' }
};