import { useState } from "react";
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
import { ShieldCheck } from "lucide-react";

import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const GRANCONECTA_OPPORTUNITY_REDIRECT_KEY = "granconecta_opportunity_redirect_after_verification";

export default function TwoFactorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  /**
   * O LoginPage envia:
   *
   * navigate("/verificar-codigo", {
   *   state: {
   *     email,
   *     redirect
   *   }
   * })
   *
   * Portanto precisamos preservar o redirect até o fim da verificação.
   */
  const [email] = useState(() => {
    return (
      location.state?.email ||
      localStorage.getItem("temp_email_2fa") ||
      ""
    );
  });

  const redirectPath =
    (typeof location.state?.redirect === "string"
      ? location.state.redirect
      : "") ||
    localStorage.getItem(
      GRANCONECTA_OPPORTUNITY_REDIRECT_KEY,
    ) ||
    "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "" | "success" | "error";
    text: string;
  }>({
    type: "",
    text: "",
  });

  const handleValidate = async (
    e?: React.FormEvent,
  ) => {
    if (e) e.preventDefault();

    setMsg({
      type: "",
      text: "",
    });

    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        codigo: code.trim(),
      };

      console.log(
        "[2FA] Enviando verificação",
        {
          email: payload.email,
          hasRedirect: Boolean(redirectPath),
          redirectPath: redirectPath || null,
        },
      );

      const response = await api.post(
        "/auth/verificar-email",
        payload,
      );

      const {
        token,
        user,
      } = response.data || {};

      if (!token || !user) {
        throw new Error(
          "Código validado, mas a sessão não foi retornada.",
        );
      }

      /**
       * Primeiro instalamos a sessão.
       *
       * Isso é obrigatório para que, ao voltar para /pagina/:slug,
       * o PageViewer encontre o usuário autenticado e consiga criar
       * granconecta_opportunity_resume_after_login.
       */
      login(token, user);

      localStorage.removeItem(
        "temp_email_2fa",
      );

      setMsg({
        type: "success",
        text: redirectPath
          ? "Código aceito! Retomando sua contratação..."
          : "Código aceito! Entrando...",
      });

      /**
       * ============================================================
       * PRIORIDADE ABSOLUTA: RETORNO PARA O FLUXO COMERCIAL
       * ============================================================
       *
       * Se o login/cadastro começou dentro de uma oportunidade,
       * não podemos mandar o usuário para dashboard/setup.
       *
       * Precisamos voltar exatamente para:
       *
       * /pagina/almarse?o=TOKEN&continue=opportunity
       *
       * O PageViewer então:
       * 1. valida a oportunidade;
       * 2. detecta o usuário autenticado;
       * 3. grava granconecta_opportunity_resume_after_login;
       * 4. abre o ChatWidget;
       * 5. o ChatWidget envia opportunityBootstrap=true;
       * 6. o CommercialFlow continua do ponto em que parou.
       */
      window.setTimeout(() => {
        if (redirectPath) {
          console.log(
            "[2FA] Retornando para fluxo comercial",
            {
              redirectPath,
              userId:
                user?.usuarioId ||
                user?.id ||
                null,
            },
          );

          /**
           * Navegação completa intencional.
           *
           * Depois da verificação queremos remontar a aplicação inteira
           * já com o token persistido pelo AuthContext. Isso elimina a
           * corrida entre React Router/AuthContext/PageViewer.
           */
          localStorage.removeItem(
            GRANCONECTA_OPPORTUNITY_REDIRECT_KEY,
          );

          window.location.replace(
            redirectPath,
          );

          return;
        }

        /**
         * ============================================================
         * FLUXO NORMAL, FORA DE OPORTUNIDADE
         * ============================================================
         */
        const tipo =
          user.tipo
            ? String(
                user.tipo,
              ).toUpperCase()
            : "";

        const temCondominio =
          Boolean(
            user.condominio_id,
          );

        const isProfissional =
          Boolean(
            user.is_empreendedor,
          ) ||
          tipo ===
            "PRESTADOR";

        if (
          isProfissional &&
          !temCondominio
        ) {
          const status =
            String(
              user.status_conta ||
                user.status ||
                "",
            ).toUpperCase();

          if (
            status !==
              "APROVADO" &&
            status !==
              "ATIVO"
          ) {
            navigate(
              "/empreendedor/setup",
              {
                replace: true,
              },
            );
          } else {
            navigate(
              "/prestador/admin",
              {
                replace: true,
              },
            );
          }

          return;
        }

        if (
          temCondominio &&
          !isProfissional
        ) {
          navigate(
            "/dashboard",
            {
              replace: true,
            },
          );

          return;
        }

        if (
          isProfissional &&
          temCondominio
        ) {
          navigate(
            "/dashboard",
            {
              replace: true,
            },
          );

          return;
        }

        /**
         * Cliente externo comum:
         * usuário sem condomínio e sem perfil profissional.
         *
         * Não o deixamos sem destino.
         */
        navigate(
          "/",
          {
            replace: true,
          },
        );
      }, 300);
    } catch (err: any) {
      console.error(
        "Erro no 2FA:",
        err,
      );

      const motivo =
        err.response?.data
          ?.message ||
        err.response?.data
          ?.error ||
        err.message ||
        "Código incorreto.";

      setMsg({
        type: "error",
        text: motivo,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend =
    async () => {
      if (!email) return;

      setLoading(true);

      try {
        await api.post(
          "/auth/reenviar-codigo",
          {
            email:
              email
                .trim()
                .toLowerCase(),
          },
        );

        setMsg({
          type: "success",
          text: "Novo código enviado!",
        });
      } catch {
        setMsg({
          type: "error",
          text: "Erro ao reenviar.",
        });
      } finally {
        setLoading(false);
      }
    };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        minHeight:
          "85vh",
        px: 2,
        bgcolor:
          "#121212",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 5,
          width: "100%",
          maxWidth: 450,
          bgcolor:
            "#1e1e1e",
          color:
            "white",
          borderRadius: 3,
          textAlign:
            "center",
        }}
      >
        <Box
          sx={{
            display:
              "flex",
            justifyContent:
              "center",
            mb: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor:
                "rgba(255, 215, 0, 0.1)",
              borderRadius:
                "50%",
            }}
          >
            <ShieldCheck
              size={48}
              color="#FFD700"
            />
          </Box>
        </Box>

        <Typography
          variant="h5"
          gutterBottom
          fontWeight="bold"
          sx={{
            color:
              "#fff",
          }}
        >
          Verificação
        </Typography>

        <Typography
          sx={{
            mb: 3,
            color:
              "#aaa",
          }}
        >
          Enviado para:{" "}
          <strong
            style={{
              color:
                "#FFD700",
            }}
          >
            {email}
          </strong>
        </Typography>

        {redirectPath && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              textAlign:
                "left",
            }}
          >
            Após confirmar o código,
            você voltará automaticamente
            para continuar sua contratação.
          </Alert>
        )}

        {msg.text && (
          <Alert
            severity={
              msg.type ===
              "success"
                ? "success"
                : "error"
            }
            variant="filled"
            sx={{
              mb: 3,
            }}
          >
            {msg.text}
          </Alert>
        )}

        <form
          onSubmit={
            handleValidate
          }
        >
          <TextField
            fullWidth
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .replace(
                    /\D/g,
                    "",
                  )
                  .slice(
                    0,
                    6,
                  ),
              )
            }
            placeholder="000000"
            slotProps={{
              htmlInput: {
                maxLength: 6,
                style: {
                  textAlign:
                    "center",
                  letterSpacing: 8,
                  fontSize:
                    "1.5rem",
                  color:
                    "white",
                  fontFamily:
                    "monospace",
                },
              },
              inputLabel: {
                style: {
                  color:
                    "#aaa",
                },
              },
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root fieldset":
                {
                  borderColor:
                    "#444",
                },
              "& input": {
                color:
                  "white",
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              bgcolor:
                "#FFD700",
              color:
                "black",
              fontWeight:
                "bold",
              "&:hover": {
                bgcolor:
                  "#FFC400",
              },
            }}
            disabled={
              loading ||
              code.length <
                6
            }
          >
            {loading ? (
              <CircularProgress
                size={24}
                color="inherit"
              />
            ) : (
              "Validar"
            )}
          </Button>
        </form>

        <Button
          onClick={
            handleResend
          }
          sx={{
            mt: 2,
            color:
              "#aaa",
            textTransform:
              "none",
          }}
        >
          Reenviar código
        </Button>
      </Paper>
    </Box>
  );
}