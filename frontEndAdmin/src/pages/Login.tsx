import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Paper, Typography } from "@mui/material";

// 1. Importe o useAuth em vez da API
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. Pegue a função 'login' do Cérebro

  const [email, setEmail] = useState("");
  const [password, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      // 3. Chame a função login do Cérebro
      await login(email, password);
      
      // 4. Navegue (o AuthContext tratará de o manter logado)
      navigate("/admin/dashboard");

    } catch (err: any) {
      console.error("LOGIN FALHOU:", err);
      const errorMsg = err.response?.data?.message || "Email ou senha inválidos.";
      setError(errorMsg);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Login (Final)
      </Typography>
      
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Senha" type="password" fullWidth margin="normal" value={password} onChange={(e) => setSenha(e.target.value)} />
      
      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
        Entrar
      </Button>
    </Paper>
  );
}