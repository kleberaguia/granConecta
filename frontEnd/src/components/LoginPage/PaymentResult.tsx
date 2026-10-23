import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

type ResultadoPagamento = "sucesso" | "pendente" | "falha";

const PAYMENT_RESUME_KEY = "granconecta_opportunity_resume_after_payment";

type OpportunityCustomerContext = {
  opportunityId?: string | null;
  returnPath?: string | null;
};

function normalizarResultado(
  resultado: string | null,
  statusMercadoPago: string | null,
): ResultadoPagamento {
  const status = String(
    statusMercadoPago || resultado || "",
  ).toLowerCase();

  if (
    status === "approved" ||
    status === "authorized" ||
    status === "sucesso"
  ) {
    return "sucesso";
  }

  if (
    status === "pending" ||
    status === "in_process" ||
    status === "pendente"
  ) {
    return "pendente";
  }

  return "falha";
}

function loadOpportunityReturnContext(): OpportunityCustomerContext | null {
  try {
    const raw = localStorage.getItem("granconecta_opportunity_customer_context");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [seconds, setSeconds] = useState(8);

  const tipo = String(
    searchParams.get("tipo") || "prestador",
  )
    .trim()
    .toLowerCase();

  const loginPath =
    tipo === "empreendedor"
      ? "/login/empreendedor"
      : "/login/prestador";

  const opportunityContext = useMemo(() => loadOpportunityReturnContext(), []);

  const opportunityReturnPath = String(
    searchParams.get("redirect") || opportunityContext?.returnPath || "",
  ).trim();

  const isOpportunityReturn = Boolean(
    opportunityContext?.opportunityId && opportunityReturnPath,
  );

  const returnToDestination = () => {
    if (
      resultado === "sucesso" &&
      isOpportunityReturn &&
      opportunityContext?.opportunityId
    ) {
      localStorage.setItem(
        PAYMENT_RESUME_KEY,
        JSON.stringify({
          opportunityId: opportunityContext.opportunityId,
          paymentResult: resultado,
          createdAt: new Date().toISOString(),
        }),
      );

      navigate(opportunityReturnPath, {
        replace: true,
        state: {
          paymentResult: resultado,
          resumeOpportunityAfterPayment: true,
        },
      });
      return;
    }

    navigate(loginPath, {
      replace: true,
      state: { paymentResult: resultado },
    });
  };

  const resultado = useMemo(
    () =>
      normalizarResultado(
        searchParams.get("resultado"),
        searchParams.get("collection_status") ||
          searchParams.get("status"),
      ),
    [searchParams],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1_000);

    const redirect = window.setTimeout(() => {
      returnToDestination();
    }, 8_000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(redirect);
    };
  }, [
    isOpportunityReturn,
    loginPath,
    navigate,
    opportunityContext,
    opportunityReturnPath,
    resultado,
  ]);

  const content = {
    sucesso: {
      icon: (
        <CheckCircleOutlineIcon
          color="success"
          sx={{ fontSize: 72 }}
        />
      ),
      title: "Pagamento recebido",
      message:
        isOpportunityReturn
          ? "Pagamento recebido. Vamos voltar ao atendimento para confirmar a conclusão da contratação e do agendamento."
          : "O Mercado Pago recebeu seu pagamento. A liberação da assinatura será concluída automaticamente após a confirmação do webhook.",
      severity: "success" as const,
    },
    pendente: {
      icon: (
        <HourglassEmptyIcon
          color="warning"
          sx={{ fontSize: 72 }}
        />
      ),
      title: "Pagamento em análise",
      message:
        "Seu pagamento está pendente ou em processamento. Assim que o Mercado Pago confirmar, o acesso será liberado automaticamente.",
      severity: "warning" as const,
    },
    falha: {
      icon: (
        <ErrorOutlineIcon
          color="error"
          sx={{ fontSize: 72 }}
        />
      ),
      title: "Pagamento não concluído",
      message:
        "O pagamento foi recusado, cancelado ou não pôde ser concluído. Entre novamente para tentar outra forma de pagamento.",
      severity: "error" as const,
    },
  }[resultado];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f5f7fb",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            border: "1px solid #e5e7eb",
            p: { xs: 3, sm: 5 },
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(15,23,42,.10)",
          }}
        >
          <Stack spacing={2.5} alignItems="center">
            {content.icon}

            <Typography variant="h4" fontWeight={900}>
              {content.title}
            </Typography>

            <Alert
              severity={content.severity}
              sx={{ textAlign: "left", width: "100%" }}
            >
              {content.message}
            </Alert>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <CircularProgress size={18} />
              <Typography color="text.secondary">
                {resultado === "sucesso" && isOpportunityReturn
                  ? `Voltando ao atendimento em ${seconds}s...`
                  : `Redirecionando para o login em ${seconds}s...`}
              </Typography>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              onClick={returnToDestination}
              sx={{
                py: 1.4,
                borderRadius: 3,
                fontWeight: 900,
                bgcolor: "#120a8f",
              }}
            >
              {resultado === "sucesso" && isOpportunityReturn
                ? "Voltar ao atendimento agora"
                : "Ir para o login agora"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}