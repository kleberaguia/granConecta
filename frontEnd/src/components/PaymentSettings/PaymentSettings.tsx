import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Switch,
  TextField,
  Button,
  Stack,
  Divider,
  CircularProgress
} from "@mui/material";

import api from "../../api/api";
import { toast } from "react-hot-toast";

interface PaymentConfig {
  pix_enabled: boolean;
  pix_key?: string;
  cash_enabled: boolean;
  card_terminal_enabled: boolean;
  mercado_pago_enabled: boolean; // Note que este já existe no seu SQL
  mercadoPagoAccessToken?: string; // Nome exato do SQL
  mercadoPagoEnabled?: boolean;    // Nome exato do SQL
  stripe_enabled: boolean;
  stripe_secret_key?: string;     // Este ainda não está no seu SQL!
  accepted_methods?: string[];
}

interface Props {
  storeId: string;
}

export const PaymentSettings = ({ storeId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  console.log("DEBUG: PaymentSettings recebeu o ID:", storeId);

  const [config, setConfig] = useState<PaymentConfig>({
    pix_enabled: false,
    pix_key: "",
    cash_enabled: true,
    card_terminal_enabled: false,
    mercado_pago_enabled: false,
    stripe_enabled: false,
    accepted_methods: [],
    mercadoPagoAccessToken: "",
    stripe_secret_key: "",
  });

  // =========================
  // LOAD CONFIG
  // =========================
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/stores/${storeId}/payment-config`);

        setConfig(res.data);
      } catch (err: any) {
        // se não existir ainda, não é erro crítico
        console.warn("Config ainda não existe:", err?.response?.data);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) fetchConfig();
  }, [storeId]);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (field: keyof PaymentConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // =========================
  // SAVE CONFIG
  // =========================
  const handleSave = async () => {
    try {
      setSaving(true);

      await api.put(`/stores/${storeId}/payment-config`, config);

      toast.success("Configuração de pagamento salva com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // UI
  // =========================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Configuração de Pagamentos
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2}>

        {/* PIX */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography>PIX</Typography>
          <Switch
            checked={config.pix_enabled}
            onChange={(e) => handleChange("pix_enabled", e.target.checked)}
          />
        </Box>

        {config.pix_enabled && (
          <TextField
            label="Chave PIX"
            value={config.pix_key || ""}
            onChange={(e) => handleChange("pix_key", e.target.value)}
            fullWidth
          />
        )}

        {/* DINHEIRO */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography>Dinheiro na entrega</Typography>
          <Switch
            checked={config.cash_enabled}
            onChange={(e) => handleChange("cash_enabled", e.target.checked)}
          />
        </Box>

        {/* MAQUININHA */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography>Maquininha (cartão na entrega)</Typography>
          <Switch
            checked={config.card_terminal_enabled}
            onChange={(e) =>
              handleChange("card_terminal_enabled", e.target.checked)
            }
          />
        </Box>

        {/* MERCADO PAGO */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography>Mercado Pago</Typography>
          <Switch
            checked={config.mercado_pago_enabled}
            onChange={(e) => handleChange("mercado_pago_enabled", e.target.checked)}
          />
        </Box>

        {config.mercado_pago_enabled && (
          <Stack spacing={2} sx={{ pl: 2, borderLeft: '2px solid #e0e0e0', mb: 2 }}>
            <TextField
              label="Mercado Pago Access Token"
              type="password" // Senha para esconder o token
              placeholder="APP_USR-..."
              value={config.mercadoPagoAccessToken || ""}
              onChange={(e) => handleChange("mercadoPagoAccessToken", e.target.value)}
              fullWidth
              helperText="Encontre seu token no painel de desenvolvedor do Mercado Pago"
            />
          </Stack>
        )}

        {/* STRIPE */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography>Stripe</Typography>
          <Switch
            checked={config.stripe_enabled}
            onChange={(e) => handleChange("stripe_enabled", e.target.checked)}
          />
        </Box>

        {config.stripe_enabled && (
          <Stack spacing={2} sx={{ pl: 2, borderLeft: '2px solid #e0e0e0', mb: 2 }}>
            <TextField
              label="Stripe Secret Key"
              type="password"
              placeholder="sk_test_..."
              value={config.stripe_secret_key || ""}
              onChange={(e) => handleChange("stripe_secret_key", e.target.value)}
              fullWidth
            />
          </Stack>
        )}

      </Stack>

      <Divider sx={{ my: 3 }} />

      <Button
        variant="contained"
        fullWidth
        size="large"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </Paper>
  );
};