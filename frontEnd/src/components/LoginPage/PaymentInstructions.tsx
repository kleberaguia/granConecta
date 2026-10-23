import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import api, { TOKEN_KEY } from "../../api/api";
import toast from "react-hot-toast";

type Frequency = "MENSAL" | "TRIMESTRAL" | "ANUAL";

type Plan = {
  id: string;
  titulo: string;
  descricao?: string;
  preco_mensal: number;
  preco_trimestral: number;
  preco_anual: number;
  vantagens: string[];
  destaque: boolean;
  ativo: boolean;
};

const BLUE = "#120a8f";

const bool = (value: unknown) =>
  value === true || value === 1 || value === "1";

const advantages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizePlans = (data: any): Plan[] => {
  const list = Array.isArray(data)
    ? data
    : data?.plans || data?.planos || data?.data || [];

  return list
    .map((plan: any) => ({
      ...plan,
      descricao: plan.descricao || plan.description || "",
      preco_mensal: Number(plan.preco_mensal || 0),
      preco_trimestral: Number(plan.preco_trimestral || 0),
      preco_anual: Number(plan.preco_anual || 0),
      vantagens: advantages(plan.vantagens),
      destaque: bool(plan.destaque),
      ativo: bool(plan.ativo),
    }))
    .filter((plan: Plan) => plan.ativo);
};

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const getFrequencyLabel = (frequency: Frequency) => {
  if (frequency === "MENSAL") return "Mensal";
  if (frequency === "TRIMESTRAL") return "Trimestral";
  return "Anual";
};

const getFrequencyDescription = (frequency: Frequency) => {
  if (frequency === "MENSAL") return "Pagamento mensal";
  if (frequency === "TRIMESTRAL") return "Pagamento a cada 3 meses";
  return "Pagamento anual";
};

const getFrequencyMonths = (frequency: Frequency) => {
  if (frequency === "MENSAL") return 1;
  if (frequency === "TRIMESTRAL") return 3;
  return 12;
};

const getPlanAmount = (plan: Plan, frequency: Frequency) => {
  if (frequency === "MENSAL") return plan.preco_mensal;
  if (frequency === "TRIMESTRAL") return plan.preco_trimestral;
  return plan.preco_anual;
};

const getSavingPercent = (plan: Plan, frequency: Frequency) => {
  if (!plan.preco_mensal || frequency === "MENSAL") return 0;
  const months = getFrequencyMonths(frequency);
  const fullMonthlyPrice = plan.preco_mensal * months;
  const selectedPrice = getPlanAmount(plan, frequency);
  if (!fullMonthlyPrice || !selectedPrice) return 0;

  return Math.max(
    0,
    Math.round((1 - selectedPrice / fullMonthlyPrice) * 100)
  );
};

const getFrequencyColor = (frequency: Frequency) => {
  if (frequency === "MENSAL") {
    return {
      bg: "#eef2ff",
      border: "#c7d2fe",
      text: "#3730a3",
      button: BLUE,
      buttonHover: "#0d0673",
    };
  }

  if (frequency === "TRIMESTRAL") {
    return {
      bg: "#ecfeff",
      border: "#67e8f9",
      text: "#0e7490",
      button: "#0891b2",
      buttonHover: "#0e7490",
    };
  }

  return {
    bg: "#ecfdf5",
    border: "#86efac",
    text: "#15803d",
    button: "#16a34a",
    buttonHover: "#15803d",
  };
};

export default function PaymentInstructions() {
  const location = useLocation();

  const navigate = useNavigate();

  const isRenewal =
    new URLSearchParams(
      location.search
    ).get("renovacao") === "1";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const isEmpreendedor = location.state?.isEmpreendedor || false;
  const stateUserId = location.state?.usuarioId || null;
  const stateToken =
    location.state?.token ||
    location.state?.accessToken ||
    null;

  const orderedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      if (a.destaque && !b.destaque) return -1;
      if (!a.destaque && b.destaque) return 1;
      return 0;
    });
  }, [plans]);


  useEffect(() => {
    if (!isRenewal) return;

    const token =
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem("token");

    if (!token) {
      toast.error(
        "Entre na sua conta para renovar a assinatura."
      );

      navigate(
        "/login/prestador",
        {
          replace: true,
          state: {
            returnTo:
              "/pagamento-orientacoes?renovacao=1",
          },
        }
      );
    }
  }, [isRenewal, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/plans");
        setPlans(normalizePlans(response.data));
      } catch (error: any) {
        toast.error(
          error.response?.data?.error ||
          "Não foi possível carregar os planos."
        );
      } finally {
        setLoadingPlans(false);
      }
    };

    load();
  }, []);

  const handleSubscribe = async (plan: Plan, frequency: Frequency) => {
    const amount = getPlanAmount(plan, frequency);

    if (!amount || amount <= 0) {
      toast.error("Este período de pagamento não está disponível para o plano.");
      return;
    }

    const key = `${plan.id}-${frequency}`;
    setProcessingKey(key);

    try {
      const pendingRegister = localStorage.getItem("pendingRegister");

      const existingToken =
        stateToken ||
        localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem("token") ||
        null;

      let userId: string | number | null = null;
      let userType = isEmpreendedor ? "EMPREENDEDOR" : "PRESTADOR";

      // REGRA PRINCIPAL:
      // - renovação => usa obrigatoriamente o usuário já autenticado;
      // - cadastro novo com pendingRegister => cria primeiro o NOVO usuário,
      //   mesmo que exista um token antigo no navegador;
      // - sem pendingRegister => pode usar a sessão existente.
      if (!isRenewal && pendingRegister) {
        const payload = JSON.parse(pendingRegister);

        userType =
          payload.tipo_usuario_documentos ||
          (payload.is_empreendedor
            ? "EMPREENDEDOR"
            : payload.tipo || "PRESTADOR");

        payload.plano = plan.id;
        payload.frequencia = frequency;

        // Não deixa a sessão anterior interferir no cadastro novo.
        delete api.defaults.headers.common.Authorization;

        const registerResponse = await api.post("/auth/register", payload);

        const createdUserId =
          registerResponse.data?.user?.id ||
          registerResponse.data?.usuario?.id ||
          registerResponse.data?.usuarioId;

        const token =
          registerResponse.data?.token ||
          registerResponse.data?.accessToken;

        if (!createdUserId) {
          throw new Error(
            "Cadastro criado, mas não foi possível identificar o novo usuário."
          );
        }

        if (!token) {
          throw new Error("Cadastro criado, mas não foi possível gerar a sessão.");
        }

        // Somente AGORA substituímos a sessão antiga pela sessão do novo cadastro.
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem("token");
        localStorage.removeItem("pendingRegister");
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        const acceptedDocuments = payload.documentosAceitos || [];

        if (acceptedDocuments.length) {
          await api.post("/documentos-legais/aceitar", {
            email: payload.email,
            usuarioId: createdUserId,
            tipo_usuario: userType,
            documentosIds: acceptedDocuments,
          });
        }

        userId = createdUserId;

        console.log("[PAYMENT] Novo cadastro identificado", {
          usuarioId: userId,
          email: payload.email,
          tipo: userType,
        });
      } else {
        // Renovação ou contratação feita por uma conta já autenticada.
        if (!existingToken) {
          toast.error(
            isRenewal
              ? "Entre na sua conta para renovar a assinatura."
              : stateUserId
                ? "A conta foi criada, mas a sessão não foi iniciada. Entre na conta para continuar o pagamento."
                : "Dados de cadastro não encontrados. Por favor, faça o cadastro novamente."
          );

          navigate("/login/prestador", {
            state: {
              returnTo: location.pathname + location.search,
            },
          });

          return;
        }

        localStorage.setItem(TOKEN_KEY, existingToken);
        localStorage.removeItem("token");
        api.defaults.headers.common.Authorization = `Bearer ${existingToken}`;

        try {
          const tokenPayload = JSON.parse(
            window.atob(existingToken.split(".")[1])
          );

          userId =
            tokenPayload.usuarioId ||
            tokenPayload.id ||
            stateUserId;

          userType =
            tokenPayload.tipo_usuario ||
            tokenPayload.tipo ||
            userType;
        } catch (e) {
          console.error("Erro ao decodificar token", e);
          userId = stateUserId;
        }
      }

      if (!userId) {
        toast.error("Usuário não identificado.");
        return;
      }

      const checkoutPayload = {
        usuarioId: userId,
        itens: [
          {
            plano: plan.id,
            tipo: userType,
            valor: amount,
            frequencia: frequency,
          },
        ],
      };

      console.log("[PAYMENT] Criando checkout", checkoutPayload);

      const checkoutResponse = await api.post(
        "/create-session",
        checkoutPayload
      );

      const checkoutUrl =
        checkoutResponse.data?.checkoutUrl ||
        checkoutResponse.data?.init_point ||
        checkoutResponse.data?.url;

      if (checkoutUrl) {
        toast.success(
          checkoutResponse.data?.reused
            ? "Retomando pagamento pendente..."
            : "Checkout criado com sucesso! Redirecionando..."
        );

        window.location.href = checkoutUrl;
        return;
      }

      toast.error("Não foi possível iniciar o pagamento.");
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao processar pagamento."
      );
    } finally {
      setProcessingKey(null);
    }
  };

  const renderPlanCard = (plan: Plan) => {
    const monthlyPrice = plan.preco_mensal;
    const fromPrice =
      monthlyPrice ||
      (plan.preco_trimestral ? plan.preco_trimestral / 3 : 0) ||
      (plan.preco_anual ? plan.preco_anual / 12 : 0);

    return (
      <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
        <Card
          sx={{
            height: "100%",
            position: "relative",
            borderRadius: 5,
            overflow: "hidden",
            border: plan.destaque
              ? "2px solid #00cdeb"
              : "1px solid #e5e7eb",
            bgcolor: plan.destaque ? "#17152a" : "white",
            color: plan.destaque ? "white" : "#172033",
            boxShadow: plan.destaque
              ? "0 22px 55px rgba(18,10,143,.18)"
              : "0 12px 35px rgba(15,23,42,.08)",
            transform: {
              md: plan.destaque ? "translateY(-10px)" : "none",
            },
            transition: "all .25s ease",
            "&:hover": {
              transform: {
                xs: "translateY(-5px)",
                md: plan.destaque
                  ? "translateY(-16px)"
                  : "translateY(-8px)",
              },
              boxShadow: "0 24px 60px rgba(15,23,42,.14)",
            },
          }}
        >
          {plan.destaque && (
            <Box
              sx={{
                position: "absolute",
                top: 18,
                right: 18,
                bgcolor: "#00cdeb",
                color: "#07151a",
                px: 1.5,
                py: 0.6,
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 11,
                zIndex: 2,
              }}
            >
              MAIS ESCOLHIDO
            </Box>
          )}

          <CardContent
            sx={{
              p: { xs: 3, md: 3.4 },
              display: "flex",
              flexDirection: "column",
              minHeight: 520,
            }}
          >
            <Typography variant="h4" fontWeight={900} textAlign="center">
              {plan.titulo}
            </Typography>

            <Typography
              textAlign="center"
              mt={1}
              color={plan.destaque ? "rgba(255,255,255,.72)" : "text.secondary"}
              minHeight={48}
            >
              {plan.descricao ||
                "Plano ideal para aumentar sua presença, organizar seus serviços e vender mais no GranConecta."}
            </Typography>

            <Box textAlign="center" my={2.6}>
              <Typography
                fontWeight={900}
                color={plan.destaque ? "#00d4ff" : BLUE}
                sx={{
                  fontSize: { xs: 34, md: 38 },
                  lineHeight: 1,
                }}
              >
                {brl(fromPrice)}
              </Typography>

              <Typography
                variant="body2"
                color={plan.destaque ? "rgba(255,255,255,.72)" : "text.secondary"}
                fontWeight={700}
                mt={0.7}
              >
                a partir de / mês
              </Typography>
            </Box>

            <Divider
              sx={{
                mb: 2.5,
                borderColor: plan.destaque
                  ? "rgba(255,255,255,.14)"
                  : undefined,
              }}
            />

            <Stack spacing={1.35} sx={{ flex: 1 }}>
              {plan.vantagens.map((item) => (
                <Stack
                  direction="row"
                  spacing={1.2}
                  alignItems="flex-start"
                  key={item}
                >
                  <CheckCircleOutlineIcon
                    sx={{
                      fontSize: 20,
                      mt: 0.15,
                      color: "#22c55e",
                    }}
                  />
                  <Typography
                    variant="body2"
                    color={plan.destaque ? "rgba(255,255,255,.88)" : "#334155"}
                  >
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Button
              fullWidth
              variant="contained"
              onClick={() => setSelectedPlan(plan)}
              sx={{
                mt: 3,
                py: 1.55,
                borderRadius: 3,
                fontWeight: 900,
                bgcolor: plan.destaque ? "#00d4ff" : BLUE,
                color: plan.destaque ? "#07151a" : "white",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: plan.destaque ? "#00bddf" : "#0d0673",
                  boxShadow: "0 10px 24px rgba(15,23,42,.18)",
                },
              }}
            >
              {isRenewal
                ? "ESCOLHER RENOVAÇÃO"
                : "ESCOLHER PLANO"}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderPaymentCard = (frequency: Frequency) => {
    if (!selectedPlan) return null;

    const amount = getPlanAmount(selectedPlan, frequency);
    if (!amount || amount <= 0) return null;

    const months = getFrequencyMonths(frequency);
    const monthlyEquivalent = amount / months;
    const saving = getSavingPercent(selectedPlan, frequency);
    const colors = getFrequencyColor(frequency);
    const key = `${selectedPlan.id}-${frequency}`;
    const isProcessing = processingKey === key;

    return (
      <Grid size={{ xs: 12, md: 4 }} key={frequency}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: 4,
            borderColor: colors.border,
            bgcolor: colors.bg,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Chip
                label={getFrequencyLabel(frequency)}
                sx={{
                  bgcolor: colors.text,
                  color: "white",
                  fontWeight: 900,
                }}
              />

              {saving > 0 && (
                <Chip
                  label={`Economize ${saving}%`}
                  sx={{
                    bgcolor: "#22c55e",
                    color: "white",
                    fontWeight: 900,
                  }}
                />
              )}
            </Stack>

            <Typography
              fontWeight={900}
              color={colors.text}
              sx={{ fontSize: 34, lineHeight: 1 }}
            >
              {brl(amount)}
            </Typography>

            <Typography color="text.secondary" fontWeight={700} mt={1}>
              {getFrequencyDescription(frequency)}
            </Typography>

            {frequency !== "MENSAL" && (
              <Typography color="text.secondary" variant="body2" mt={0.4}>
                Equivale a {brl(monthlyEquivalent)} por mês
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              disabled={Boolean(processingKey)}
              onClick={() => handleSubscribe(selectedPlan, frequency)}
              sx={{
                mt: 3,
                py: 1.45,
                borderRadius: 3,
                fontWeight: 900,
                bgcolor: colors.button,
                color: "white",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: colors.buttonHover,
                  boxShadow: "0 10px 24px rgba(15,23,42,.18)",
                },
              }}
            >
              {isProcessing
                ? "PROCESSANDO..."
                : isRenewal
                  ? `RENOVAR ${getFrequencyLabel(
                    frequency
                  ).toUpperCase()}`
                  : `ASSINAR ${getFrequencyLabel(
                    frequency
                  ).toUpperCase()}`}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f6f7fb",
        py: { xs: 5, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={5}>
          <Typography
            variant="h3"
            color={BLUE}
            fontWeight={900}
            gutterBottom
          >
            {isRenewal
              ? "Escolha o período da renovação. Após a confirmação do Mercado Pago, seu acesso será liberado automaticamente."
              : "Escolha o plano ideal para o seu negócio. Depois selecione se deseja pagar mensal, trimestral ou anual."}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              maxWidth: 760,
              mx: "auto",
              mb: 2,
              fontSize: 17,
            }}
          >
            Escolha o plano ideal para o seu negócio. Depois selecione se deseja
            pagar mensal, trimestral ou anual.
          </Typography>

          <Alert
            severity="info"
            sx={{
              maxWidth: 760,
              mx: "auto",
              textAlign: "left",
              borderRadius: 3,
            }}
          >
            O acesso só será liberado após o Mercado Pago confirmar a aprovação do pagamento.
          </Alert>
        </Box>

        {loadingPlans ? (
          <Box
            display="grid"
            sx={{
              placeItems: "center",
              minHeight: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : orderedPlans.length === 0 ? (
          <Alert severity="info">
            Nenhum plano está disponível para contratação neste momento.
          </Alert>
        ) : (
          <Grid container spacing={3} justifyContent="center" alignItems="stretch">
            {orderedPlans.map(renderPlanCard)}
          </Grid>
        )}
      </Container>

      <Dialog
        open={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 7 }}>
          <Typography variant="h5" fontWeight={900}>
            {selectedPlan ? `Escolha a forma de pagamento — ${selectedPlan.titulo}` : ""}
          </Typography>

          <IconButton
            onClick={() => setSelectedPlan(null)}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pb: 3 }}>
          <Typography color="text.secondary" mb={3}>
            Selecione uma opção abaixo para continuar para o Mercado Pago.
          </Typography>

          <Grid container spacing={2.5} alignItems="stretch">
            {renderPaymentCard("MENSAL")}
            {renderPaymentCard("TRIMESTRAL")}
            {renderPaymentCard("ANUAL")}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}