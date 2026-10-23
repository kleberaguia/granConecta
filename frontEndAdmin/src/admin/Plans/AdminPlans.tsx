import { useCallback, useEffect, useState } from "react";
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
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import api from "../../api/api";
import toast from "react-hot-toast";

type Plan = {
  id: "PREMIUM";
  titulo: string;
  preco_mensal: number;
  preco_trimestral: number;
  preco_anual: number;
  vantagens: string[];
  destaque: boolean;
  ativo: boolean;
  stripe_product_id: string | null;
  stripe_price_mensal_id: string | null;
  stripe_price_trimestral_id: string | null;
  stripe_price_anual_id: string | null;
  mercado_pago_plan_mensal_id: string | null;
  mercado_pago_plan_trimestral_id: string | null;
  mercado_pago_plan_anual_id: string | null;
};

type PlanForm = Omit<
  Plan,
  "preco_mensal" | "preco_trimestral" | "preco_anual"
> & {
  preco_mensal: string;
  preco_trimestral: string;
  preco_anual: string;
};

const BRAND = "#120a8f";

const emptyForm = (): PlanForm => ({
  id: "PREMIUM",
  titulo: "GranConecta Premium",
  preco_mensal: "",
  preco_trimestral: "",
  preco_anual: "",
  vantagens: [""],
  destaque: true,
  ativo: true,
  stripe_product_id: "",
  stripe_price_mensal_id: "",
  stripe_price_trimestral_id: "",
  stripe_price_anual_id: "",
  mercado_pago_plan_mensal_id: "",
  mercado_pago_plan_trimestral_id: "",
  mercado_pago_plan_anual_id: "",
});

const asBoolean = (value: unknown) =>
  value === true || value === 1 || value === "1";

const asAdvantages = (value: unknown): string[] => {
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

  return list.map((plan: any) => ({
    ...plan,
    preco_mensal: Number(plan.preco_mensal || 0),
    preco_trimestral: Number(plan.preco_trimestral || 0),
    preco_anual: Number(plan.preco_anual || 0),
    vantagens: asAdvantages(plan.vantagens),
    destaque: asBoolean(plan.destaque),
    ativo: asBoolean(plan.ativo),
  }));
};

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const nullable = (value: string | null) => value?.trim() || null;
const numberFromInput = (value: string) =>
  Number(String(value).trim().replace(",", "."));

export default function AdminPlans() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/plans");
      const plans = normalizePlans(response.data);
      setPlan(plans.find((item) => item.id === "PREMIUM") || plans[0] || null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Não foi possível carregar o plano."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const openCreate = () => {
    setSaveError(null);
    setEditing(false);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setSaveError(null);
    setEditing(true);

    setForm({
      ...plan,

      preco_mensal:
        String(plan.preco_mensal ?? ""),

      preco_trimestral:
        String(
          plan.preco_trimestral ?? ""
        ),

      preco_anual:
        String(plan.preco_anual ?? ""),

      vantagens:
        plan.vantagens.length > 0
          ? [...plan.vantagens]
          : [""],
    });

    setDialogOpen(true);
  };

  const changeAdvantage = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      vantagens: current.vantagens.map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  };

  const addAdvantage = () =>
    setForm((current) => ({
      ...current,
      vantagens: [...current.vantagens, ""],
    }));

  const removeAdvantage = (index: number) =>
    setForm((current) => ({
      ...current,
      vantagens:
        current.vantagens.length === 1
          ? [""]
          : current.vantagens.filter((_, itemIndex) => itemIndex !== index),
    }));

  const savePlan = async () => {
    setSaveError(null);

    const monthly = numberFromInput(form.preco_mensal);
    const quarterly = numberFromInput(form.preco_trimestral);
    const annual = numberFromInput(form.preco_anual);
    const cleanAdvantages = form.vantagens
      .map((item) => item.trim())
      .filter(Boolean);

    const validationError =
      !form.titulo.trim()
        ? "Informe o título do plano."
        : !Number.isFinite(monthly) || monthly <= 0
          ? "Informe um preço mensal válido."
          : !Number.isFinite(quarterly) || quarterly <= 0
            ? "Informe um preço trimestral válido."
            : !Number.isFinite(annual) || annual <= 0
              ? "Informe um preço anual válido."
              : !cleanAdvantages.length
                ? "Cadastre pelo menos uma vantagem."
                : null;

    if (validationError) {
      setSaveError(validationError);
      toast.error(validationError);
      return;
    }

    const payload = {
      id: "PREMIUM",
      titulo: form.titulo.trim(),
      preco_mensal: monthly,
      preco_trimestral: quarterly,
      preco_anual: annual,
      vantagens: cleanAdvantages,
      destaque: form.destaque,
      ativo: form.ativo,
      stripe_product_id: nullable(form.stripe_product_id),
      stripe_price_mensal_id: nullable(form.stripe_price_mensal_id),
      stripe_price_trimestral_id: nullable(form.stripe_price_trimestral_id),
      stripe_price_anual_id: nullable(form.stripe_price_anual_id),
      mercado_pago_plan_mensal_id: nullable(
        form.mercado_pago_plan_mensal_id
      ),
      mercado_pago_plan_trimestral_id: nullable(
        form.mercado_pago_plan_trimestral_id
      ),
      mercado_pago_plan_anual_id: nullable(form.mercado_pago_plan_anual_id),
    };

    setSaving(true);
    try {
      if (editing) await api.put(`/plans/${form.id}`, payload);
      else await api.post("/plans", payload);

      toast.success(
        editing ? "Plano Premium atualizado." : "Plano Premium criado."
      );
      setDialogOpen(false);
      await loadPlan();
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Não foi possível salvar o plano.";

      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!plan) return;
    try {
      await api.put(`/plans/${plan.id}`, { ativo: !plan.ativo });
      toast.success(plan.ativo ? "Plano desativado." : "Plano ativado.");
      if (plan.ativo) setPlan({ ...plan, ativo: false });
      else await loadPlan();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Não foi possível alterar o plano."
      );
    }
  };

  const periods = plan
    ? [
      {
        title: "Mensal",
        subtitle: "Mais flexibilidade",
        total: plan.preco_mensal,
        monthlyEquivalent: plan.preco_mensal,
        color: "#475569",
        saving: 0,
      },
      {
        title: "Trimestral",
        subtitle: "Melhor equilíbrio",
        total: plan.preco_trimestral,
        monthlyEquivalent: plan.preco_trimestral / 3,
        color: "#2563eb",
        saving:
          plan.preco_mensal > 0
            ? Math.max(
              0,
              Math.round(
                (1 - plan.preco_trimestral / (plan.preco_mensal * 3)) * 100
              )
            )
            : 0,
      },
      {
        title: "Anual",
        subtitle: "Maior economia",
        total: plan.preco_anual,
        monthlyEquivalent: plan.preco_anual / 12,
        color: "#7c3aed",
        saving:
          plan.preco_mensal > 0
            ? Math.max(
              0,
              Math.round(
                (1 - plan.preco_anual / (plan.preco_mensal * 12)) * 100
              )
            )
            : 0,
      },
    ]
    : [];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        <Card
          sx={{
            mb: 4,
            borderRadius: 5,
            color: "white",
            background: `linear-gradient(135deg, ${BRAND}, #392fc7)`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              gap={3}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.3} mb={1}>
                  <PaymentsRoundedIcon />
                  <Typography variant="overline" fontWeight={800} letterSpacing={1.5}>
                    ADMINISTRATIVO
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900}>
                  Assinatura GranConecta Premium
                </Typography>
                <Typography sx={{ mt: 1, color: "rgba(255,255,255,.78)" }}>
                  Um único plano completo, com opções mensal, trimestral e anual.
                </Typography>
              </Box>
              {!plan && !loading && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={openCreate}
                  sx={{
                    bgcolor: "white",
                    color: BRAND,
                    px: 3,
                    py: 1.35,
                    borderRadius: 3,
                    fontWeight: 900,
                    "&:hover": { bgcolor: "#eef2ff" },
                  }}
                >
                  Criar plano Premium
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Box display="grid" sx={{ placeItems: "center", minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : !plan ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            O plano Premium ainda não foi cadastrado. Clique em “Criar plano
            Premium” para começar.
          </Alert>
        ) : (
          <>
            <Card
              sx={{
                mb: 3,
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 25px rgba(15,23,42,.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  gap={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h5" fontWeight={900}>
                        {plan.titulo}
                      </Typography>
                      <Chip
                        size="small"
                        icon={<AutoAwesomeRoundedIcon />}
                        label="Plano completo"
                        sx={{ bgcolor: "#ede9fe", color: "#6d28d9" }}
                      />
                      <Chip
                        size="small"
                        label={plan.ativo ? "Ativo" : "Inativo"}
                        color={plan.ativo ? "success" : "default"}
                      />
                    </Stack>
                    <Typography color="text.secondary" mt={0.8}>
                      {plan.vantagens.length} vantagens disponíveis em todas as
                      periodicidades.
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch checked={plan.ativo} onChange={toggleActive} />
                      }
                      label={plan.ativo ? "Disponível" : "Indisponível"}
                    />
                    <Button
                      variant="contained"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => {
                        if (plan) {
                          openEdit(plan);
                        }
                      }}
                    >
                      Editar
                    </Button>
                    <Tooltip title="Atualizar">
                      <IconButton onClick={loadPlan}>
                        <RefreshRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={3} mb={3}>
              {periods.map((period) => (
                <Grid size={{ xs: 12, md: 4 }} key={period.title}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 4,
                      border:
                        period.title === "Anual"
                          ? `2px solid ${period.color}`
                          : "1px solid #e5e7eb",
                      boxShadow:
                        period.title === "Anual"
                          ? "0 16px 40px rgba(124,58,237,.16)"
                          : "0 8px 25px rgba(15,23,42,.06)",
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ height: 7, bgcolor: period.color }} />
                    <CardContent sx={{ p: 3 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box>
                          <Typography variant="h5" fontWeight={900}>
                            Premium {period.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {period.subtitle}
                          </Typography>
                        </Box>
                        {period.saving > 0 && (
                          <Chip
                            size="small"
                            color="success"
                            label={`-${period.saving}%`}
                          />
                        )}
                      </Stack>
                      <Typography
                        variant="h4"
                        fontWeight={900}
                        color={period.color}
                        mt={3}
                      >
                        {brl(period.monthlyEquivalent)}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {" "}/mês
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Cobrança de {brl(period.total)} por período
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card sx={{ borderRadius: 4, border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={900} mb={2}>
                  Vantagens incluídas em todas as opções
                </Typography>
                <Grid container spacing={1.5}>
                  {plan.vantagens.map((advantage) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={advantage}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircleRoundedIcon
                          sx={{ color: "#22c55e", fontSize: 20, mt: 0.15 }}
                        />
                        <Typography variant="body2">{advantage}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </>
        )}
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ p: 3, pb: 1 }}>
          <Typography variant="h5" fontWeight={900}>
            {editing ? "Editar GranConecta Premium" : "Criar GranConecta Premium"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          <Grid container spacing={2.5} sx={{ mt: 0.1 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="ID" value="PREMIUM" disabled />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label="Título exibido"
                value={form.titulo}
                onChange={(event) =>
                  setForm({ ...form, titulo: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Preço mensal"
                value={form.preco_mensal}
                onChange={(event) =>
                  setForm({ ...form, preco_mensal: event.target.value })
                }
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Preço trimestral total"
                value={form.preco_trimestral}
                onChange={(event) =>
                  setForm({ ...form, preco_trimestral: event.target.value })
                }
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Preço anual total"
                value={form.preco_anual}
                onChange={(event) =>
                  setForm({ ...form, preco_anual: event.target.value })
                }
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography fontWeight={900} mb={1.3}>
                Vantagens incluídas nas três opções
              </Typography>
              <Stack spacing={1.3}>
                {form.vantagens.map((advantage, index) => (
                  <Stack direction="row" spacing={1} key={index}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Vantagem ${index + 1}`}
                      value={advantage}
                      onChange={(event) =>
                        changeAdvantage(index, event.target.value)
                      }
                    />
                    <IconButton color="error" onClick={() => removeAdvantage(index)}>
                      <CloseRoundedIcon />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button
                startIcon={<AddRoundedIcon />}
                onClick={addAdvantage}
                sx={{ mt: 1 }}
              >
                Adicionar vantagem
              </Button>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider>
                <Chip label="Stripe (opcional)" />
              </Divider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Stripe Product ID"
                value={form.stripe_product_id || ""}
                onChange={(event) =>
                  setForm({ ...form, stripe_product_id: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Stripe Price mensal"
                value={form.stripe_price_mensal_id || ""}
                onChange={(event) =>
                  setForm({ ...form, stripe_price_mensal_id: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Stripe Price trimestral"
                value={form.stripe_price_trimestral_id || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    stripe_price_trimestral_id: event.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Stripe Price anual"
                value={form.stripe_price_anual_id || ""}
                onChange={(event) =>
                  setForm({ ...form, stripe_price_anual_id: event.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider>
                <Chip label="Mercado Pago (opcional)" />
              </Divider>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Plano mensal"
                value={form.mercado_pago_plan_mensal_id || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    mercado_pago_plan_mensal_id: event.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Plano trimestral"
                value={form.mercado_pago_plan_trimestral_id || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    mercado_pago_plan_trimestral_id: event.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Plano anual"
                value={form.mercado_pago_plan_anual_id || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    mercado_pago_plan_anual_id: event.target.value,
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.ativo}
                      onChange={(event) =>
                        setForm({ ...form, ativo: event.target.checked })
                      }
                    />
                  }
                  label="Disponível para contratação"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.destaque}
                      onChange={(event) =>
                        setForm({ ...form, destaque: event.target.checked })
                      }
                    />
                  }
                  label="Destacar comercialmente"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={() => void savePlan()}
            disabled={saving}
            sx={{ bgcolor: BRAND, minWidth: 150 }}
          >
            {saving ? (
              <CircularProgress size={23} color="inherit" />
            ) : (
              "Salvar plano"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}