import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";

type InvitationResponse = {
  invitation: {
    id: string;
    storeId: string;
    name: string;
    email: string;
    role: string;
    permissions: {
      chat: boolean;
      centralComercial: boolean;
      agenda: boolean;
      orders: boolean;
      catalog: boolean;
      finance: boolean;
      settings: boolean;
    };
    status: "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | string;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  business: {
    id: string;
    name: string;
    slug?: string | null;
  };
  alreadyAccepted: boolean;
};

type AcceptResponse = {
  invitation: InvitationResponse["invitation"];
  member?: {
    id: string;
    storeId: string;
    userId: string;
    role: string;
    canChat: boolean;
    canCentralComercial: boolean;
    canAgenda: boolean;
    canOrders: boolean;
    canCatalog: boolean;
    canFinance: boolean;
    canSettings: boolean;
    active: boolean;
  };
  alreadyAccepted: boolean;
};

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export default function BusinessTeamInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, isAuthenticated } = useAuth();

  const invitationToken = String(searchParams.get("token") || "").trim();

  const [data, setData] = useState<InvitationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  const returnPath = useMemo(() => {
    if (!invitationToken) return "/convite-equipe";
    return `/convite-equipe?token=${encodeURIComponent(invitationToken)}`;
  }, [invitationToken]);

  const loggedUserEmail = normalizeEmail((user as any)?.email);
  const invitedEmail = normalizeEmail(data?.invitation?.email);

  const emailMatches =
    !!loggedUserEmail &&
    !!invitedEmail &&
    loggedUserEmail === invitedEmail;

  useEffect(() => {
    let active = true;

    const loadInvitation = async () => {
      if (!invitationToken) {
        setError("Token do convite não informado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get<InvitationResponse>(
          `/business-team/invitations/public/${encodeURIComponent(invitationToken)}`,
        );

        if (!active) return;

        setData(response.data);
        setAccepted(
          response.data.alreadyAccepted === true ||
            String(response.data.invitation?.status || "").toUpperCase() ===
              "ACCEPTED",
        );
      } catch (err: any) {
        if (!active) return;

        setError(
          err?.response?.data?.message ||
            "Não foi possível carregar este convite.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInvitation();

    return () => {
      active = false;
    };
  }, [invitationToken]);

  const handleAccept = async () => {
    if (!invitationToken || !data) return;

    if (!token || !isAuthenticated || !user) {
      navigate(
        `/login/morador?email=${encodeURIComponent(
          data.invitation.email,
        )}&redirect=${encodeURIComponent(returnPath)}`,
      );
      return;
    }

    if (!emailMatches) {
      setError(
        `Este convite foi enviado para ${data.invitation.email}. Entre com essa conta para aceitar.`,
      );
      return;
    }

    try {
      setAccepting(true);
      setError("");

      const response = await api.post<AcceptResponse>(
        "/business-team/invitations/accept",
        {
          token: invitationToken,
        },
      );

      setAccepted(true);

      setData((current) =>
        current
          ? {
              ...current,
              invitation: {
                ...current.invitation,
                ...response.data.invitation,
              },
              alreadyAccepted: true,
            }
          : current,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Não foi possível aceitar o convite.",
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    if (!data) return;

    navigate(
      `/login/morador?email=${encodeURIComponent(
        data.invitation.email,
      )}&redirect=${encodeURIComponent(returnPath)}`,
    );
  };

  const handleRegister = () => {
    if (!data) return;

    navigate(
      `/cadastro?email=${encodeURIComponent(
        data.invitation.email,
      )}&redirect=${encodeURIComponent(returnPath)}`,
    );
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box
          sx={{
            minHeight: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error || "Convite não encontrado."}</Alert>
      </Container>
    );
  }

  const status = String(data.invitation.status || "").toUpperCase();

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              GranConecta
            </Typography>

            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
              Convite para equipe
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Você foi convidado para participar da equipe de atendimento do
              negócio abaixo.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700}>
              {data.business.name}
            </Typography>

            <Typography color="text.secondary">
              Convite para: {data.invitation.name}
            </Typography>

            <Typography color="text.secondary">
              E-mail: {data.invitation.email}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {data.invitation.permissions.chat && (
              <Chip label="Atendimento" />
            )}

            {data.invitation.permissions.centralComercial && (
              <Chip label="Central Comercial" />
            )}
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {accepted || status === "ACCEPTED" ? (
            <>
              <Alert severity="success">
                Convite aceito. Você já faz parte da equipe de{" "}
                {data.business.name}.
              </Alert>

              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(`/central-atendimento?storeId=${encodeURIComponent(data.business.id)}`)}
              >
                Ir para Central de Atendimento
              </Button>
            </>
          ) : status !== "PENDING" ? (
            <Alert severity="warning">
              Este convite não está mais disponível. Status: {status}.
            </Alert>
          ) : !token || !isAuthenticated || !user ? (
            <>
              <Alert severity="info">
                Entre com o e-mail convidado ou crie uma conta para continuar.
              </Alert>

              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleLogin}
                >
                  Já tenho conta
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleRegister}
                >
                  Criar conta
                </Button>
              </Stack>
            </>
          ) : !emailMatches ? (
            <>
              <Alert severity="warning">
                Você está conectado como {(user as any)?.email || "outra conta"}.
                Este convite pertence a {data.invitation.email}.
              </Alert>

              <Button
                variant="outlined"
                size="large"
                onClick={handleLogin}
              >
                Entrar com o e-mail convidado
              </Button>
            </>
          ) : (
            <>
              <Alert severity="info">
                Sua conta foi reconhecida. Confirme abaixo para entrar na equipe
                de {data.business.name}.
              </Alert>

              <Button
                variant="contained"
                size="large"
                disabled={accepting}
                onClick={handleAccept}
              >
                {accepting ? "Aceitando convite..." : "Aceitar convite"}
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}