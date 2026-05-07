import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Paper, TextField, Typography, Alert, CircularProgress } from "@mui/material";
import { ShieldCheck } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

export default function TwoFactorPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth(); // Importamos o login do contexto

    // Recupera o e-mail (do Login ou do LocalStorage se deu F5)
    const [email] = useState(() => {
        return location.state?.email || localStorage.getItem('temp_email_2fa') || "";
    });

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handleValidate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setMsg({ type: '', text: '' });
        setLoading(true);

        try {
            // 1. Prepara os dados (garantindo que não há espaços)
            const payload = {
                email: email.trim(),
                codigo: code.trim()
            };

            console.log("Enviando:", payload); // Debug para você ver no console

            // 2. Chama a API
            const response = await api.post("/auth/verificar-email", payload);
            const { token, user } = response.data;

            // 3. Se deu certo...
            if (token && user) {
                console.log("Login validado! Redirecionando...", user);

                // Limpa o email temporário
                localStorage.removeItem('temp_email_2fa');

                // AQUI É O PULO DO GATO:
                // Primeiro salvamos o login no contexto global
                login(token, user);

                setMsg({ type: 'success', text: "Código aceito! Entrando..." });

                // Damos um pequeno delay para o React processar o Contexto e depois forçamos a ida
                setTimeout(() => {
                    const tipo = user.tipo ? user.tipo.toUpperCase() : '';
                    const temCondominio = !!user.condominio_id; // Transforma em booleano real
                    const isProfissional = user.is_empreendedor || tipo === 'PRESTADOR';

                    // 1. Prioridade: Se ele for Profissional mas NÃO mora no condomínio
                    if (isProfissional && !temCondominio) {
                        if (user.status !== 'APROVADO') {
                            navigate('/empreendedor/setup', { replace: true });
                        } else {
                            navigate('/prestador/admin', { replace: true });
                        }
                        return; // Para aqui
                    }

                    // 2. Se ele for APENAS Morador (não profissional)
                    if (temCondominio && !isProfissional) {
                        navigate('/dashboard', { replace: true });
                        return; // Para aqui
                    }

                    // 3. SE ELE FOR OS DOIS (Prestador E Morador)
                    if (isProfissional && temCondominio) {
                        // Aqui você decide a "Página Inicial" padrão para quem é híbrido
                        // Sugestão: Levar para o Dashboard de Morador, mas o menu já terá os dois links
                        navigate('/dashboard', { replace: true });
                    }
                }, 500); // 500ms é suficiente
            }
        } catch (err: any) {
            console.error("Erro no 2FA:", err);
            const motivo = err.response?.data?.message || err.response?.data?.error || "Código incorreto.";
            setMsg({ type: 'error', text: motivo });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setLoading(true);
        try {
            await api.post("/auth/reenviar-codigo", { email });
            setMsg({ type: 'success', text: "Novo código enviado!" });
        } catch (err) {
            setMsg({ type: 'error', text: "Erro ao reenviar." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "85vh", px: 2, bgcolor: "#121212" }}>
            <Paper elevation={6} sx={{ p: 5, width: "100%", maxWidth: 450, bgcolor: "#1e1e1e", color: "white", borderRadius: 3, textAlign: 'center' }}>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255, 215, 0, 0.1)', borderRadius: '50%' }}>
                        <ShieldCheck size={48} color="#FFD700" />
                    </Box>
                </Box>

                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: '#fff' }}>
                    Verificação
                </Typography>

                <Typography sx={{ mb: 3, color: "#aaa" }}>
                    Enviado para: <strong style={{ color: "#FFD700" }}>{email}</strong>
                </Typography>

                {msg.text && (
                    <Alert severity={msg.type as 'success' | 'error'} variant="filled" sx={{ mb: 3 }}>
                        {msg.text}
                    </Alert>
                )}

                <form onSubmit={handleValidate}>
                    <TextField
                        fullWidth
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        slotProps={{
                            htmlInput: {
                                maxLength: 6,
                                style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.5rem', color: 'white', fontFamily: 'monospace' }
                            },
                            inputLabel: { style: { color: '#aaa' } }
                        }}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root fieldset': { borderColor: '#444' },
                            '& input': { color: 'white' }
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ bgcolor: '#FFD700', color: 'black', fontWeight: 'bold', '&:hover': { bgcolor: '#FFC400' } }}
                        disabled={loading || code.length < 6}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Validar"}
                    </Button>
                </form>

                <Button onClick={handleResend} sx={{ mt: 2, color: '#aaa', textTransform: 'none' }}>
                    Reenviar código
                </Button>
            </Paper>
        </Box>
    );
}