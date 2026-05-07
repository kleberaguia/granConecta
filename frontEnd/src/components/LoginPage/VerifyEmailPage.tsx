import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Paper, TextField, Typography, Alert, CircularProgress } from "@mui/material";
import api from "../../api/api"; // Certifique-se que o caminho está correto

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Tenta pegar o email que veio da navegação (da tela de cadastro)
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleValidate = async () => {
    if (!email || !code) {
      setErrorMsg("E-mail e código são obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Endpoint correto conforme sua especificação:
      await api.post("/auth/verificar-email", { 
        email: email, 
        codigo: code 
      });

      setSuccessMsg("Conta verificada com sucesso! Redirecionando...");
      
      // Espera 2 segundos e manda para o login
      setTimeout(() => {
        navigate("/login/morador"); // Ou /login/prestador, ou uma tela de escolha
      }, 2000);

    } catch (err: any) {
      console.error(err);
      // Pega a mensagem de erro do backend se existir
      const msg = err.response?.data?.message || "Código inválido ou expirado.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMsg("Digite seu e-mail para reenviar o código.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    
    try {
      // Supondo que você tenha/crie uma rota para reenviar código
      // Se não tiver, você pode chamar a rota de registro novamente ou criar essa rota no backend
      await api.post("/auth/reenviar-codigo", { email });
      setSuccessMsg("Novo código enviado para seu e-mail.");
    } catch (err) {
      setErrorMsg("Erro ao reenviar o código. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // Centraliza verticalmente também
        minHeight: "80vh",    // Garante altura para centralizar
        px: 2,
        bgcolor: "#121212"    // Fundo escuro para combinar com o resto
      }}
    >
      <Paper 
        elevation={3}
        sx={{ 
            p: 4, 
            width: "100%", 
            maxWidth: 450, 
            bgcolor: "#1e1e1e", 
            color: "white" 
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          Verificar E-mail
        </Typography>

        <Typography sx={{ mb: 3, color: "#aaa", textAlign: "center" }}>
          Digite o código de 6 dígitos enviado para: <br/>
          <strong style={{ color: "#fff" }}>{email || "seu e-mail"}</strong>
        </Typography>

        {/* Se por acaso o usuário chegou aqui sem vir do cadastro (refresh da pagina), pede o email */}
        {!location.state?.email && (
             <TextField 
                fullWidth 
                label="Seu E-mail" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                margin="normal" 
                sx={{ 
                    input: { color: 'white' }, 
                    label: { color: '#aaa' }, 
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } } 
                }} 
             />
        )}

        <TextField
          fullWidth
          label="Código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          inputProps={{ 
              maxLength: 6, 
              style: { textAlign: 'center', letterSpacing: 5, fontSize: '1.5rem', color: 'white' } 
          }}
          sx={{ 
            mb: 2,
            label: { color: '#aaa' }, 
            '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' }, '&:hover fieldset': { borderColor: '#FFD700' } } 
          }}
        />

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2, bgcolor: '#FFD700', color: 'black', fontWeight: 'bold', '&:hover': { bgcolor: '#FFC400' } }}
          disabled={loading || code.length < 6}
          onClick={handleValidate}
        >
          {loading ? <CircularProgress size={24} /> : "Validar Código"}
        </Button>

        <Button
          fullWidth
          variant="text"
          sx={{ mt: 2, color: '#aaa' }}
          disabled={loading}
          onClick={handleResend}
        >
          Reenviar Código
        </Button>
      </Paper>
    </Box>
  );
}