import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { NotificationsActive, Storefront } from "@mui/icons-material";

import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { HumanChatInbox } from "../humanChat/HumanChatInbox";

const formatarMoeda = (valor: any) => {
  const num = parseFloat(String(valor ?? 0).replace(",", "."));
  return isNaN(num)
    ? "0,00"
    : num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

const normalizar = (str: any) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function CentralAtendimentoPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const storeIdFromUrl = String(searchParams.get("storeId") || "").trim();
  const u = user as any;

  const [tab, setTab] = useState(0);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  const access = selectedBusiness?.access || null;
  const store = selectedBusiness?.store || null;
  const storeId = String(store?.id || "").trim();

  const [centralLoading, setCentralLoading] = useState(false);
  const [centralError, setCentralError] = useState("");
  const [centralPesquisa, setCentralPesquisa] = useState("");
  const [centralComercial, setCentralComercial] = useState<any>({
    summary: {
      total: 0,
      emNegociacao: 0,
      aguardandoPagamento: 0,
      pagamentoAprovado: 0,
      valorEmNegociacao: 0,
      valorConvertido: 0,
    },
    items: [],
  });

  const permissions = access?.permissions || {};

  const carregarAcesso = useCallback(async () => {
    try {
      setLoadingAccess(true);
      setAccessError("");

      const response = await api.get("/business-team/my-businesses");

      const lista = Array.isArray(response.data?.businesses)
        ? response.data.businesses
        : [];

      setBusinesses(lista);

      if (lista.length === 0) {
        setSelectedBusiness(null);
        setAccessError(
          "Sua conta não possui nenhum negócio disponível na Central de Atendimento.",
        );
        return;
      }

      const pelaUrl = storeIdFromUrl
        ? lista.find(
            (item: any) =>
              String(item?.store?.id || "").trim() === storeIdFromUrl,
          )
        : null;

      const escolhido = pelaUrl || lista[0];

      setSelectedBusiness(escolhido);

      // Mantemos a URL limpa quando há apenas um negócio.
      // Se houver vários, o storeId ajuda a preservar a seleção.
      if (lista.length === 1) {
        if (storeIdFromUrl) {
          setSearchParams({}, { replace: true });
        }
      } else if (
        String(escolhido?.store?.id || "").trim() &&
        storeIdFromUrl !== String(escolhido?.store?.id || "").trim()
      ) {
        setSearchParams(
          { storeId: String(escolhido.store.id) },
          { replace: true },
        );
      }

      console.log("[CENTRAL ATENDIMENTO NEGÓCIOS]", response.data);
    } catch (error: any) {
      setSelectedBusiness(null);
      setBusinesses([]);
      setAccessError(
        error?.response?.data?.message ||
          "Não foi possível identificar os negócios disponíveis para sua conta.",
      );
    } finally {
      setLoadingAccess(false);
    }
  }, [setSearchParams, storeIdFromUrl]);

  const carregarCentralComercial = useCallback(async () => {
    if (!permissions?.centralComercial) return;

    try {
      setCentralLoading(true);
      setCentralError("");

      const response = await api.get("/central-comercial", {
        params: {
          page: 1,
          limit: 50,
        },
      });

      const allItems = Array.isArray(response.data?.items)
        ? response.data.items
        : [];

      const itemsDoNegocio = allItems.filter(
        (item: any) =>
          String(item?.business?.storeId || "").trim() === storeId,
      );

      setCentralComercial({
        summary: response.data?.summary || {},
        items: itemsDoNegocio,
      });
    } catch (error: any) {
      setCentralError(
        error?.response?.data?.message ||
          "Não foi possível carregar a Central Comercial.",
      );
    } finally {
      setCentralLoading(false);
    }
  }, [permissions?.centralComercial, storeId]);

  useEffect(() => {
    carregarAcesso();
  }, [carregarAcesso]);

  useEffect(() => {
    if (access && permissions?.centralComercial) {
      carregarCentralComercial();
    }
  }, [access, permissions?.centralComercial, carregarCentralComercial]);

  const centralItemsFiltrados = useMemo(() => {
    const termo = normalizar(centralPesquisa);

    if (!termo) {
      return centralComercial?.items || [];
    }

    return (centralComercial?.items || []).filter((item: any) => {
      const customer = item?.customer || {};
      const interest = item?.interest || {};
      const origin = item?.origin || {};
      const campaign = item?.campaign || {};

      const haystack = [
        customer?.name,
        customer?.email,
        customer?.phone,
        interest?.catalogItemName,
        interest?.qualificationSummary,
        item?.stage,
        item?.status,
        origin?.channel,
        campaign?.name,
      ]
        .filter(Boolean)
        .join(" ");

      return normalizar(haystack).includes(termo);
    });
  }, [centralComercial?.items, centralPesquisa]);

  if (loadingAccess) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (accessError) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{accessError}</Alert>
      </Container>
    );
  }

  const businessName =
    store?.name ||
    access?.store?.name ||
    access?.business?.name ||
    access?.storeName ||
    "Negócio";

  const canChat = permissions?.chat === true;
  const canCentral = permissions?.centralComercial === true;

  const selecionarNegocio = (novoStoreId: string) => {
    const escolhido = businesses.find(
      (item: any) =>
        String(item?.store?.id || "").trim() === String(novoStoreId).trim(),
    );

    if (!escolhido) return;

    setSelectedBusiness(escolhido);
    setCentralPesquisa("");
    setCentralComercial({
      summary: {
        total: 0,
        emNegociacao: 0,
        aguardandoPagamento: 0,
        pagamentoAprovado: 0,
        valorEmNegociacao: 0,
        valorConvertido: 0,
      },
      items: [],
    });

    setSearchParams(
      businesses.length > 1 ? { storeId: String(escolhido.store.id) } : {},
      { replace: true },
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900}>
            Central de Atendimento
          </Typography>

          {businesses.length > 1 ? (
            <TextField
              select
              size="small"
              label="Negócio"
              value={storeId}
              onChange={(event) => selecionarNegocio(event.target.value)}
              sx={{ mt: 1, minWidth: isMobile ? "100%" : 280 }}
            >
              {businesses.map((item: any) => (
                <MenuItem
                  key={item?.store?.id}
                  value={String(item?.store?.id || "")}
                >
                  {item?.store?.name || "Negócio"}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography color="text.secondary" variant="body2">
              {businessName}
            </Typography>
          )}

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip
              icon={<Storefront />}
              size="small"
              label={access?.role || "ATTENDANT"}
            />
            {canChat && <Chip size="small" label="Atendimento" />}
            {canCentral && <Chip size="small" label="Central Comercial" />}
          </Stack>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {u?.name || u?.nome || u?.email}
        </Typography>
      </Stack>

      {!canChat && !canCentral ? (
        <Alert severity="warning">
          Sua associação está ativa, mas você não possui permissões para os
          módulos desta Central.
        </Alert>
      ) : (
        <>
          <Tabs
            value={canChat ? tab : 1}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            {canChat && <Tab value={0} label="Atendimentos" />}
            {canCentral && <Tab value={1} label="Central Comercial" />}
          </Tabs>

          {canChat && tab === 0 && (
            <Paper
              sx={{
                p: isMobile ? 1 : 2,
                borderRadius: 3,
                minHeight: 560,
                overflow: "hidden",
              }}
            >
              <HumanChatInbox
                chatbotOwnerId={storeId}
                chatbotTipo={undefined}
                title={`Atendimentos - ${businessName}`}
              />
            </Paper>
          )}

          {canCentral && tab === 1 && (
            <Box>
              <Stack
                direction={isMobile ? "column" : "row"}
                justifyContent="space-between"
                alignItems={isMobile ? "stretch" : "center"}
                gap={2}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h5" fontWeight={900}>
                    Central Comercial
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Oportunidades deste negócio em uma única visão.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={carregarCentralComercial}
                  disabled={centralLoading}
                  startIcon={
                    centralLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <NotificationsActive />
                    )
                  }
                >
                  Atualizar
                </Button>
              </Stack>

              {centralError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {centralError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      OPORTUNIDADES
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                      {centralItemsFiltrados.length}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      EM NEGOCIAÇÃO
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                      {
                        centralItemsFiltrados.filter(
                          (item: any) =>
                            String(item?.stage || "").toUpperCase() ===
                            "EM_NEGOCIACAO",
                        ).length
                      }
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      AGUARDANDO PAGAMENTO
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                      {
                        centralItemsFiltrados.filter(
                          (item: any) =>
                            String(item?.stage || "").toUpperCase() ===
                            "AGUARDANDO_PAGAMENTO",
                        ).length
                      }
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      VALOR EM ABERTO
                    </Typography>
                    <Typography variant="h5" fontWeight={900}>
                      R${" "}
                      {formatarMoeda(
                        centralItemsFiltrados.reduce(
                          (acc: number, item: any) =>
                            acc + Number(item?.flow?.amount || 0),
                          0,
                        ),
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={centralPesquisa}
                  onChange={(event) => setCentralPesquisa(event.target.value)}
                  placeholder="Buscar por cliente, serviço, canal ou etapa..."
                />
              </Paper>

              {centralLoading ? (
                <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
                  <CircularProgress size={28} />
                </Paper>
              ) : centralItemsFiltrados.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
                  <Typography fontWeight={700}>
                    Nenhuma oportunidade encontrada.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {centralItemsFiltrados.map((op: any) => (
                    <Paper
                      key={op.id}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="h6" fontWeight={900}>
                            {op?.customer?.name || "Cliente"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {op?.interest?.catalogItemName ||
                              op?.interest?.qualificationSummary ||
                              "Interesse em atendimento"}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <Typography variant="caption" color="text.secondary">
                            Etapa
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {op?.stage || "—"}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Valor
                          </Typography>
                          <Typography variant="body2" fontWeight={900}>
                            {Number(op?.flow?.amount || 0) > 0
                              ? `R$ ${formatarMoeda(op.flow.amount)}`
                              : "—"}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <Typography variant="caption" color="text.secondary">
                            Canal
                          </Typography>
                          <Typography variant="body2">
                            {op?.origin?.channel || "—"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </>
      )}
    </Container>
  );
}