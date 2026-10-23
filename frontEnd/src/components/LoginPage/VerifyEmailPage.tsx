import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import api from "../../api/api";

const GRANCONECTA_OPPORTUNITY_REDIRECT_KEY =
  "granconecta_opportunity_redirect_after_verification";

const TEMP_EMAIL_2FA_KEY = "temp_email_2fa";

type VerifyEmailLocationState = {
  email?: string | null;
  redirect?: string | null;
};

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState =
    (location.state as VerifyEmailLocationState | null) || null;

  const initialEmail = useMemo(() => {
    const emailFromState =
      typeof locationState?.email === "string"
        ? locationState.email.trim()
        : "";

    if (emailFromState) {
      return emailFromState;
    }

    return (
      localStorage.getItem(TEMP_EMAIL_2FA_KEY)?.trim() || ""
    );
  }, [locationState?.email]);

  const redirectPath = useMemo(() => {
    const redirectFromState =
      typeof locationState?.redirect === "string"
        ? locationState.redirect.trim()
        : "";

    if (redirectFromState) {
      return redirectFromState;
    }

    return (
      localStorage
        .getItem(GRANCONECTA_OPPORTUNITY_REDIRECT_KEY)
        ?.trim() || ""
    );
  }, [locationState?.redirect]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      localStorage.setItem(TEMP_EMAIL_2FA_KEY, initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (redirectPath) {
      localStorage.setItem(
        GRANCONECTA_OPPORTUNITY_REDIRECT_KEY,
        redirectPath,
      );
    }

    console.log("[2FA] Contexto carregado", {
      email: initialEmail || null,
      redirectPath: redirectPath || null,
      locationState: locationState || null,
    });
  }, [initialEmail, redirectPath, locationState]);

  const handleValidate = async () => {
    const emailLimpo = email.trim().toLowerCase();
    const codigoLimpo = code.trim();

    if (!emailLimpo || !codigoLimpo) {
      setErrorMsg("E-mail e código são obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.post("/auth/verificar-email", {
        email: emailLimpo,
        codigo: codigoLimpo,
      });

      setSuccessMsg(
        redirectPath
          ? "Conta verificada com sucesso! Voltando para continuar sua contratação..."
          : "Conta verificada com sucesso! Redirecionando para o login...",
      );

      localStorage.setItem(TEMP_EMAIL_2FA_KEY, emailLimpo);

      if (redirectPath) {
        localStorage.setItem(
          GRANCONECTA_OPPORTUNITY_REDIRECT_KEY,
          redirectPath,
        );
      }

      const loginParams = new URLSearchParams();
      loginParams.set("email", emailLimpo);

      if (redirectPath) {
        loginParams.set("redirect", redirectPath);
      }

      const loginUrl = `/login/morador?${loginParams.toString()}`;

      console.log("[2FA] E-mail verificado com sucesso", {
        email: emailLimpo,
        redirectPath: redirectPath || null,
        loginUrl,
      });

      console.log(
        redirectPath
          ? "[2FA] Preservando retorno para fluxo comercial"
          : "[2FA] Retornando para login comum",
        {
          redirectPath: redirectPath || null,
        },
      );

      /*
       * Importante:
       * o endpoint /auth/verificar-email apenas confirma o e-mail.
       * Ele não deve nos obrigar a supor que já existe token/sessão.
       *
       * Portanto voltamos ao LoginPage preservando:
       *   - e-mail
       *   - redirect comercial
       *
       * O LoginPage já está preparado para, após autenticar,
       * dar prioridade absoluta ao redirectPath.
       */
      window.setTimeout(() => {
        navigate(loginUrl, {
          replace: true,
        });
      }, 700);
    } catch (err: any) {
      console.error("[2FA] Erro ao validar código", err);

      const msg =
        err.response?.data?.message ||
        "Código inválido ou expirado.";

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      setErrorMsg("Digite seu e-mail para reenviar o código.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.post("/auth/reenviar-codigo", {
        email: emailLimpo,
      });

      localStorage.setItem(TEMP_EMAIL_2FA_KEY, emailLimpo);

      setSuccessMsg("Novo código enviado para seu e-mail.");
    } catch (err) {
      console.error("[2FA] Erro ao reenviar código", err);

      setErrorMsg(
        "Erro ao reenviar o código. Tente novamente mais tarde.",
      );
    } finally {
      setLoading(false);
    }
  };

  const hasEmailFromNavigation = Boolean(
    typeof locationState?.email === "string" &&
      locationState.email.trim(),
  );

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        px: 2,
        bgcolor: "#121212",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 450,
          bgcolor: "#1e1e1e",
          color: "white",
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          fontWeight="bold"
          align="center"
        >
          Verificar E-mail
        </Typography>

        <Typography
          sx={{
            mb: 3,
            color: "#aaa",
            textAlign: "center",
          }}
        >
          Digite o código de 6 dígitos enviado para:
          <br />
          <strong style={{ color: "#fff" }}>
            {email || "seu e-mail"}
          </strong>
        </Typography>

        {redirectPath && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
          >
            Após verificar o e-mail, você voltará ao login e
            continuará sua contratação.
          </Alert>
        )}

        {!hasEmailFromNavigation && (
          <TextField
            fullWidth
            label="Seu E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            disabled={loading}
            sx={{
              input: { color: "white" },
              label: { color: "#aaa" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#555",
                },
                "&:hover fieldset": {
                  borderColor: "#FFD700",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#FFD700",
                },
              },
            }}
          />
        )}

        <TextField
          fullWidth
          label="Código"
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 6),
            )
          }
          placeholder="000000"
          autoComplete="one-time-code"
          inputMode="numeric"
          disabled={loading}
          inputProps={{
            maxLength: 6,
            style: {
              textAlign: "center",
              letterSpacing: 5,
              fontSize: "1.5rem",
              color: "white",
            },
          }}
          sx={{
            mb: 2,
            label: { color: "#aaa" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#555",
              },
              "&:hover fieldset": {
                borderColor: "#FFD700",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#FFD700",
              },
            },
          }}
        />

        {errorMsg && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
          >
            {successMsg}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            bgcolor: "#FFD700",
            color: "black",
            fontWeight: "bold",
            "&:hover": {
              bgcolor: "#FFC400",
            },
          }}
          disabled={loading || code.length < 6}
          onClick={handleValidate}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            "Validar Código"
          )}
        </Button>

        <Button
          fullWidth
          variant="text"
          sx={{
            mt: 2,
            color: "#aaa",
          }}
          disabled={loading}
          onClick={handleResend}
        >
          Reenviar Código
        </Button>
      </Paper>
    </Box>
  );
}
