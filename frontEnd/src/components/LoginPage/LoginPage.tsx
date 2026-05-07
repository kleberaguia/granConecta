import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Box,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface LoginPageProps {
  tipo?: 'MORADOR' | 'PRESTADOR';
}

export default function LoginPage({ tipo = 'MORADOR' }: LoginPageProps) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClickShowPassword = () => setShowSenha(!showSenha);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const emailLimpo = email.trim();

    try {
      const response = await api.post('/auth/login', {
        email: emailLimpo,
        password: senha
      });

      const { token, user } = response.data;

      // Verifica se o e-mail já foi verificado (2FA ou confirmação de conta)
      if (user.emailVerificado === true || user.emailVerificado === 1) {

        // Efetua o login no contexto global (salva token e user no localStorage)
        login(token, user);

        const queryParams = new URLSearchParams(window.location.search);
        const redirectPath = queryParams.get('redirect');

        // Pequeno delay para garantir que o Context foi atualizado antes do navigate
        setTimeout(() => {
          if (redirectPath) {
            navigate(redirectPath);
            return;
          }

          const tipoUser = user.tipo ? user.tipo.toUpperCase() : '';

          // 1. Rota para Administradores
          if (tipoUser === 'ADMIN') {
            navigate('/admin/dashboard');
          }
          // 2. Lógica para Prestadores e Empreendedores
          else if (user.is_empreendedor || tipoUser === 'PRESTADOR') {

            // Pega os perfis de dentro do objeto user (conforme definido no AuthService)
            const perfis = user.perfis || [];

            // Verifica aprovação no array de perfis
            const temPerfilAprovado = perfis.some(
              (p: any) =>
                (p.status || "").toUpperCase() === 'APROVADO' ||
                (p.status_aprovacao || "").toUpperCase() === 'APROVADO'
            );

            // Verifica se está pendente de pagamento ou análise
            const temPerfilPendente = perfis.some(
              (p: any) =>
                (p.status || "").toUpperCase() === 'PENDENTE' ||
                (p.status_aprovacao || "").toUpperCase() === 'PENDENTE'
            );

            // Condição de Liberação Total
            if (temPerfilAprovado || (user.status_conta || "").toUpperCase() === 'APROVADO' || user.ativo === true || user.ativo === 1) {
              toast.success("Login autorizado!");
              navigate('/');
            }
            // Condição de Restrição por Pagamento
            else if (temPerfilPendente) {
              toast.error("Assinatura pendente. Seu acesso está restrito.");
              navigate('/pagamento-orientacoes');
            }
            // Condição de Perfil Novo ou sob Análise
            else {
              toast("Seu perfil está em análise.", {
                icon: '⚠️',
              });
              navigate('/');
            }
          }
          // 3. Rota para Moradores
          else {
            navigate('/');
          }
        }, 100);

      } else {
        // Se o e-mail não estiver verificado, envia para a tela de código
        localStorage.setItem('temp_email_2fa', emailLimpo);
        navigate('/verificar-codigo', { state: { email: emailLimpo } });
      }
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || "E-mail ou senha incorretos.";
      setError(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const isPrestador = tipo === 'PRESTADOR';
  const titulo = isPrestador ? 'Área do Profissional' : 'Área do Morador';
  const corDestaque = isPrestador ? '#00d4ff' : '#FFD700';

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: '100%',
          bgcolor: '#1e1e1e',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h5" align="center" fontWeight="bold" sx={{ mb: 3, color: 'white' }}>
          {titulo}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            sx={{
              input: { color: 'white' },
              label: { color: '#aaa' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#555' },
                '&:hover fieldset': { borderColor: corDestaque },
                '&.Mui-focused fieldset': { borderColor: corDestaque }
              },
              '& .MuiInputLabel-root.Mui-focused': { color: corDestaque }
            }}
          />

          <TextField
            fullWidth
            label="Senha"
            type={showSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                    sx={{ color: '#aaa' }}
                  >
                    {showSenha ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              input: { color: 'white' },
              label: { color: '#aaa' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#555' },
                '&:hover fieldset': { borderColor: corDestaque },
                '&.Mui-focused fieldset': { borderColor: corDestaque }
              },
              '& .MuiInputLabel-root.Mui-focused': { color: corDestaque }
            }}
          />

          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Link
              component={RouterLink}
              to="/esqueci-senha"
              underline="hover"
              sx={{ color: '#aaa', fontSize: '0.85rem' }}
            >
              Esqueceu a senha?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: corDestaque,
              color: 'black',
              fontWeight: 'bold',
              '&:hover': { filter: 'brightness(0.9)', bgcolor: corDestaque }
            }}
          >
            {loading ? 'Verificando...' : 'Continuar'}
          </Button>

          <Box textAlign="center" mt={2}>
            <Link
              component={RouterLink}
              to="/cadastro"
              underline="hover"
              sx={{ color: '#aaa', fontSize: '0.9rem' }}
            >
              Não tem conta? <span style={{ color: corDestaque }}>Cadastre-se</span>
            </Link>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}