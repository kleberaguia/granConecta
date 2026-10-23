import { useState } from "react";

import {
  useNavigate,
  Link as RouterLink,
  useSearchParams,
} from "react-router-dom";

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
  InputAdornment,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";

import toast from "react-hot-toast";

const GRANCONECTA_OPPORTUNITY_REDIRECT_KEY = "granconecta_opportunity_redirect_after_verification";

interface LoginPageProps {
  tipo?: "MORADOR" | "PRESTADOR";
}

export default function LoginPage({
  tipo = "MORADOR",
}: LoginPageProps) {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [searchParams] =
    useSearchParams();

  /**
   * ============================================================
   * CONTEXTO DE RETORNO
   * ============================================================
   *
   * Exemplo:
   *
   * /login/morador
   * ?email=cliente@email.com
   * &redirect=/pagina/almarse?o=TOKEN&continue=opportunity
   */
  const redirectPath =
    searchParams.get("redirect") || "";

  const initialEmail =
    searchParams.get("email") || "";

  const [email, setEmail] =
    useState(initialEmail);

  const [senha, setSenha] =
    useState("");

  const [
    showSenha,
    setShowSenha,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleClickShowPassword =
    () =>
      setShowSenha(
        (current) => !current,
      );

  const handleLogin = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setError("");

    setLoading(true);

    const emailLimpo =
      email
        .trim()
        .toLowerCase();

    if (redirectPath) {
      localStorage.setItem(
        GRANCONECTA_OPPORTUNITY_REDIRECT_KEY,
        redirectPath,
      );
    }

    try {
      const response =
        await api.post(
          "/auth/login",
          {
            email:
              emailLimpo,

            password:
              senha,
          },
        );

      const {
        token,
        user,
      } = response.data;

      if (
        user.emailVerificado ===
          true ||
        user.emailVerificado === 1
      ) {
        /**
         * Salva autenticação primeiro.
         */
        login(
          token,
          user,
        );

        /**
         * Damos um pequeno intervalo apenas
         * para o AuthContext persistir a sessão.
         */
        setTimeout(() => {
          /**
           * ====================================================
           * RETORNO PARA OPORTUNIDADE / CHECKOUT
           * ====================================================
           *
           * Tem prioridade absoluta sobre dashboard.
           */
          if (redirectPath) {
            navigate(
              redirectPath,
              {
                replace: true,
              },
            );

            return;
          }

          const tipoUser =
            user.tipo
              ? String(
                  user.tipo,
                ).toUpperCase()
              : "";

          /**
           * ====================================================
           * ADMIN
           * ====================================================
           */
          if (
            tipoUser ===
            "ADMIN"
          ) {
            navigate(
              "/admin/dashboard",
              {
                replace: true,
              },
            );

            return;
          }

          /**
           * ====================================================
           * PRESTADOR / EMPREENDEDOR
           * ====================================================
           */
          if (
            user.is_empreendedor ||
            tipoUser ===
              "PRESTADOR"
          ) {
            const perfis =
              user.perfis || [];

            const temPerfilAprovado =
              perfis.some(
                (p: any) =>
                  String(
                    p.status ||
                      "",
                  ).toUpperCase() ===
                    "APROVADO" ||
                  String(
                    p.status_aprovacao ||
                      "",
                  ).toUpperCase() ===
                    "APROVADO",
              );

            const perfilPagamentoPendente =
              perfis.find(
                (p: any) =>
                  String(
                    p.payment_status ||
                      "",
                  ).toUpperCase() ===
                  "PENDENTE",
              );

            if (
              temPerfilAprovado ||
              String(
                user.status_conta ||
                  "",
              ).toUpperCase() ===
                "APROVADO" ||
              user.ativo ===
                true ||
              user.ativo === 1
            ) {
              toast.success(
                "Login autorizado!",
              );

              navigate(
                "/",
                {
                  replace: true,
                },
              );

              return;
            }

            if (
              perfilPagamentoPendente
            ) {
              toast(
                "Você possui um pagamento pendente.",
                {
                  icon: "💳",
                },
              );

              if (
                perfilPagamentoPendente.checkout_url
              ) {
                const expiracao =
                  perfilPagamentoPendente.checkout_expira_em;

                if (
                  expiracao &&
                  new Date(
                    expiracao,
                  ) > new Date()
                ) {
                  toast.success(
                    "Retomando pagamento...",
                  );

                  window.location.href =
                    perfilPagamentoPendente.checkout_url;

                  return;
                }
              }

              toast.error(
                "Seu pagamento expirou.",
              );

              navigate(
                "/pagamento-orientacoes",
              );

              return;
            }

            toast(
              "Seu perfil está em análise.",
              {
                icon: "⚠️",
              },
            );

            navigate(
              "/",
              {
                replace: true,
              },
            );

            return;
          }

          /**
           * MORADOR / VISITANTE
           */
          navigate(
            "/",
            {
              replace: true,
            },
          );
        }, 100);
      } else {
        /**
         * ======================================================
         * E-MAIL NÃO VERIFICADO
         * ======================================================
         *
         * Preservamos redirect para que, após a verificação,
         * o cliente possa retornar à oportunidade.
         */
        localStorage.setItem(
          "temp_email_2fa",
          emailLimpo,
        );

        if (redirectPath) {
          localStorage.setItem(
            GRANCONECTA_OPPORTUNITY_REDIRECT_KEY,
            redirectPath,
          );
        }

        navigate(
          "/verificar-codigo",
          {
            state: {
              email:
                emailLimpo,

              redirect:
                redirectPath ||
                null,
            },
          },
        );
      }
    } catch (err: any) {
      const mensagemErro =
        err.response?.data
          ?.message ||
        "E-mail ou senha incorretos.";

      setError(
        mensagemErro,
      );

      toast.error(
        mensagemErro,
      );
    } finally {
      setLoading(
        false,
      );
    }
  };

  const isPrestador =
    tipo === "PRESTADOR";

  const titulo =
    isPrestador
      ? "Área do Profissional"
      : "Área do Morador";

  const corDestaque =
    isPrestador
      ? "#00d4ff"
      : "#FFD700";

  return (
    <Container
      maxWidth="xs"
      sx={{
        height: "100vh",
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          bgcolor:
            "#1e1e1e",
          color:
            "white",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          sx={{
            mb: 3,
            color:
              "white",
          }}
        >
          {titulo}
        </Typography>

        {redirectPath && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
            }}
          >
            Faça login para
            continuar sua
            contratação.
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
            }}
          >
            {error}
          </Alert>
        )}

        <form
          onSubmit={
            handleLogin
          }
        >
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value,
              )
            }
            margin="normal"
            required
            disabled={
              loading
            }
            sx={{
              input: {
                color:
                  "white",
              },

              label: {
                color:
                  "#aaa",
              },

              "& .MuiOutlinedInput-root":
                {
                  "& fieldset":
                    {
                      borderColor:
                        "#555",
                    },

                  "&:hover fieldset":
                    {
                      borderColor:
                        corDestaque,
                    },

                  "&.Mui-focused fieldset":
                    {
                      borderColor:
                        corDestaque,
                    },
                },

              "& .MuiInputLabel-root.Mui-focused":
                {
                  color:
                    corDestaque,
                },
            }}
          />

          <TextField
            fullWidth
            label="Senha"
            type={
              showSenha
                ? "text"
                : "password"
            }
            value={senha}
            onChange={(e) =>
              setSenha(
                e.target.value,
              )
            }
            margin="normal"
            required
            disabled={
              loading
            }
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                >
                  <IconButton
                    onClick={
                      handleClickShowPassword
                    }
                    edge="end"
                    sx={{
                      color:
                        "#aaa",
                    }}
                  >
                    {showSenha ? (
                      <VisibilityOff />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              input: {
                color:
                  "white",
              },

              label: {
                color:
                  "#aaa",
              },

              "& .MuiOutlinedInput-root":
                {
                  "& fieldset":
                    {
                      borderColor:
                        "#555",
                    },

                  "&:hover fieldset":
                    {
                      borderColor:
                        corDestaque,
                    },

                  "&.Mui-focused fieldset":
                    {
                      borderColor:
                        corDestaque,
                    },
                },

              "& .MuiInputLabel-root.Mui-focused":
                {
                  color:
                    corDestaque,
                },
            }}
          />

          <Box
            sx={{
              textAlign:
                "right",
              mt: 1,
            }}
          >
            <Link
              component={
                RouterLink
              }
              to="/esqueci-senha"
              underline="hover"
              sx={{
                color:
                  "#aaa",
                fontSize:
                  "0.85rem",
              }}
            >
              Esqueceu a senha?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={
              loading
            }
            sx={{
              mt: 3,
              mb: 2,
              bgcolor:
                corDestaque,
              color:
                "black",
              fontWeight:
                "bold",

              "&:hover": {
                filter:
                  "brightness(0.9)",
                bgcolor:
                  corDestaque,
              },
            }}
          >
            {loading
              ? "Verificando..."
              : redirectPath
                ? "Entrar e continuar"
                : "Continuar"}
          </Button>

          <Box
            textAlign="center"
            mt={2}
          >
            <Link
              component={
                RouterLink
              }
              to={
                redirectPath
                  ? `/cadastro?redirect=${encodeURIComponent(
                      redirectPath,
                    )}`
                  : "/cadastro"
              }
              underline="hover"
              sx={{
                color:
                  "#aaa",
                fontSize:
                  "0.9rem",
              }}
            >
              Não tem conta?{" "}
              <span
                style={{
                  color:
                    corDestaque,
                }}
              >
                Cadastre-se
              </span>
            </Link>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}