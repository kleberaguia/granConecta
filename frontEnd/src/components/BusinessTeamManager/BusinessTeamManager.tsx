import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ContentCopy,
  DeleteOutline,
  EmailOutlined,
  GroupOutlined,
  PersonAddAlt1Outlined,
  Refresh,
  Search,
  SecurityOutlined,
  SendOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import api from "../../api/api";

type PermissionSet = {
  chat: boolean;
  centralComercial: boolean;
  agenda: boolean;
  orders: boolean;
  catalog: boolean;
  finance: boolean;
  settings: boolean;
};

type BusinessAccessItem = {
  store?: {
    id?: string;
    name?: string;
    slug?: string;
    tipo?: string;
    ativa?: boolean;
  };
  access?: {
    isOwner?: boolean;
    role?: string;
    permissions?: Partial<PermissionSet>;
  };
};

type TeamMember = {
  id: string;
  storeId: string;
  userId: string;
  name?: string | null;
  email?: string | null;
  userType?: string | null;
  role?: string;
  permissions?: Partial<PermissionSet>;
  active?: boolean;
  acceptedAt?: string | null;
  createdAt?: string | null;
};

type EligibleAttendant = {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  tipo?: string;
  userType?: string;
};

type TeamInvitation = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  canChat?: boolean;
  canCentralComercial?: boolean;
  expiresAt?: string | null;
  createdAt?: string | null;
};

const emptyPermissions: PermissionSet = {
  chat: true,
  centralComercial: true,
  agenda: false,
  orders: false,
  catalog: false,
  finance: false,
  settings: false,
};

const permissionLabels: Array<{
  key: keyof PermissionSet;
  label: string;
  description: string;
}> = [
  {
    key: "chat",
    label: "Atendimento",
    description: "Responder clientes e assumir conversas.",
  },
  {
    key: "centralComercial",
    label: "Central Comercial",
    description: "Visualizar oportunidades e negociações.",
  },
  {
    key: "agenda",
    label: "Agenda",
    description: "Visualizar e administrar agenda.",
  },
  {
    key: "orders",
    label: "Pedidos",
    description: "Acompanhar pedidos e operações.",
  },
  {
    key: "catalog",
    label: "Catálogo",
    description: "Administrar produtos e serviços.",
  },
  {
    key: "finance",
    label: "Financeiro",
    description: "Acessar informações financeiras.",
  },
  {
    key: "settings",
    label: "Configurações",
    description: "Administrar equipe e configurações do negócio.",
  },
];

const normalizePermissions = (
  permissions?: Partial<PermissionSet>,
): PermissionSet => ({
  chat: permissions?.chat === true,
  centralComercial: permissions?.centralComercial === true,
  agenda: permissions?.agenda === true,
  orders: permissions?.orders === true,
  catalog: permissions?.catalog === true,
  finance: permissions?.finance === true,
  settings: permissions?.settings === true,
});

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getInitials = (name?: string | null) => {
  const safe = String(name || "").trim();
  if (!safe) return "?";

  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");
};

const invitationStatusLabel = (status?: string) => {
  const value = String(status || "").toUpperCase();

  const labels: Record<string, string> = {
    PENDING: "Pendente",
    ACCEPTED: "Aceito",
    CANCELLED: "Cancelado",
    EXPIRED: "Expirado",
  };

  return labels[value] || value || "—";
};

const invitationStatusColor = (
  status?: string,
): "default" | "success" | "warning" | "error" => {
  const value = String(status || "").toUpperCase();

  if (value === "ACCEPTED") return "success";
  if (value === "PENDING") return "warning";
  if (value === "CANCELLED" || value === "EXPIRED") return "error";

  return "default";
};

export default function BusinessTeamManager() {
  const [businesses, setBusinesses] = useState<BusinessAccessItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const [tab, setTab] = useState(0);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [error, setError] = useState("");

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);

  const [existingDialogOpen, setExistingDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  const [eligibleSearch, setEligibleSearch] = useState("");
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [eligible, setEligible] = useState<EligibleAttendant[]>([]);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermissions, setInvitePermissions] =
    useState<PermissionSet>(emptyPermissions);
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const [generatedInviteLink, setGeneratedInviteLink] = useState("");

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingRole, setEditingRole] = useState("ATTENDANT");
  const [editingPermissions, setEditingPermissions] =
    useState<PermissionSet>(emptyPermissions);
  const [savingMember, setSavingMember] = useState(false);

  const selectedBusiness = useMemo(
    () =>
      businesses.find(
        (item) => String(item?.store?.id || "") === selectedStoreId,
      ) || null,
    [businesses, selectedStoreId],
  );

  const selectedBusinessName =
    selectedBusiness?.store?.name || "Meu negócio";

  const activeMembers = useMemo(
    () => members.filter((member) => member.active !== false),
    [members],
  );

  const inactiveMembers = useMemo(
    () => members.filter((member) => member.active === false),
    [members],
  );

  const pendingInvitations = useMemo(
    () =>
      invitations.filter(
        (invitation) =>
          String(invitation.status || "").toUpperCase() === "PENDING",
      ),
    [invitations],
  );

  const loadBusinesses = useCallback(async () => {
    try {
      setLoadingBase(true);
      setError("");

      const response = await api.get("/business-team/my-businesses");

      const list: BusinessAccessItem[] = Array.isArray(
        response.data?.businesses,
      )
        ? response.data.businesses
        : [];

      // A tela Equipe só deve mostrar negócios que o usuário pode administrar.
      const manageable = list.filter((item) => {
        const access = item?.access;
        return (
          access?.isOwner === true ||
          access?.permissions?.settings === true ||
          String(access?.role || "").toUpperCase() === "MANAGER"
        );
      });

      setBusinesses(manageable);

      if (manageable.length === 0) {
        setSelectedStoreId("");
        setError(
          "Sua conta não possui nenhum negócio com permissão para administrar equipe.",
        );
        return;
      }

      setSelectedStoreId((current) => {
        if (
          current &&
          manageable.some(
            (item) => String(item?.store?.id || "") === current,
          )
        ) {
          return current;
        }

        return String(manageable[0]?.store?.id || "");
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Não foi possível carregar os negócios disponíveis.",
      );
    } finally {
      setLoadingBase(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    if (!selectedStoreId) return;

    try {
      setLoadingMembers(true);

      const response = await api.get(
        `/business-team/${selectedStoreId}/members`,
      );

      setMembers(
        Array.isArray(response.data?.members)
          ? response.data.members
          : [],
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível carregar a equipe.",
      );
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedStoreId]);

  const loadInvitations = useCallback(async () => {
    if (!selectedStoreId) return;

    try {
      setLoadingInvitations(true);

      const response = await api.get(
        `/business-team/${selectedStoreId}/invitations`,
      );

      setInvitations(
        Array.isArray(response.data?.invitations)
          ? response.data.invitations
          : [],
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível carregar os convites.",
      );
    } finally {
      setLoadingInvitations(false);
    }
  }, [selectedStoreId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMembers(), loadInvitations()]);
  }, [loadInvitations, loadMembers]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  useEffect(() => {
    if (!selectedStoreId) return;
    refreshAll();
  }, [refreshAll, selectedStoreId]);

  const searchEligible = useCallback(async () => {
    if (!selectedStoreId) return;

    try {
      setEligibleLoading(true);

      const response = await api.get(
        `/business-team/${selectedStoreId}/eligible-attendants`,
        {
          params: {
            search: eligibleSearch.trim() || undefined,
          },
        },
      );

      setEligible(
        Array.isArray(response.data?.attendants)
          ? response.data.attendants
          : [],
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível buscar usuários disponíveis.",
      );
    } finally {
      setEligibleLoading(false);
    }
  }, [eligibleSearch, selectedStoreId]);

  useEffect(() => {
    if (!existingDialogOpen) return;

    const timer = window.setTimeout(() => {
      searchEligible();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [existingDialogOpen, searchEligible]);

  const addExistingUser = async (person: EligibleAttendant) => {
    const email = String(person?.email || "").trim();

    if (!email) {
      toast.error("Este usuário não possui e-mail disponível.");
      return;
    }

    try {
      await api.post(`/business-team/${selectedStoreId}/members`, {
        email,
        role: "ATTENDANT",
        canChat: true,
        canCentralComercial: true,
        canAgenda: false,
        canOrders: false,
        canCatalog: false,
        canFinance: false,
        canSettings: false,
      });

      toast.success("Atendente adicionado à equipe.");
      setExistingDialogOpen(false);
      setEligibleSearch("");
      setEligible([]);
      await refreshAll();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível adicionar o atendente.",
      );
    }
  };

  const createExternalInvite = async () => {
    const name = inviteName.trim();
    const email = inviteEmail.trim().toLowerCase();

    if (!name || !email) {
      toast.error("Informe nome e e-mail.");
      return;
    }

    try {
      setSubmittingInvite(true);
      setGeneratedInviteLink("");

      const response = await api.post(
        `/business-team/${selectedStoreId}/invitations`,
        {
          name,
          email,
          canChat: invitePermissions.chat,
          canCentralComercial:
            invitePermissions.centralComercial,
        },
      );

      const token = String(response.data?.token || "").trim();

      if (token) {
        setGeneratedInviteLink(
          `${window.location.origin}/convite-equipe?token=${encodeURIComponent(
            token,
          )}`,
        );
      }

      toast.success("Convite criado.");
      setInviteName("");
      setInviteEmail("");
      setInvitePermissions(emptyPermissions);
      await loadInvitations();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível criar o convite.",
      );
    } finally {
      setSubmittingInvite(false);
    }
  };

  const copyInviteLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link do convite copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const resendInvitation = async (invitation: TeamInvitation) => {
    try {
      const response = await api.post(
        `/business-team/${selectedStoreId}/invitations/${invitation.id}/resend`,
      );

      const token = String(response.data?.token || "").trim();

      if (token) {
        const link = `${
          window.location.origin
        }/convite-equipe?token=${encodeURIComponent(token)}`;

        setGeneratedInviteLink(link);
        await copyInviteLink(link);
      }

      toast.success("Convite renovado.");
      await loadInvitations();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível reenviar o convite.",
      );
    }
  };

  const cancelInvitation = async (invitation: TeamInvitation) => {
    const confirmed = window.confirm(
      `Cancelar o convite de ${invitation.name || invitation.email}?`,
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/business-team/${selectedStoreId}/invitations/${invitation.id}/cancel`,
      );

      toast.success("Convite cancelado.");
      await loadInvitations();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível cancelar o convite.",
      );
    }
  };

  const openMemberPermissions = (member: TeamMember) => {
    setEditingMember(member);
    setEditingRole(String(member.role || "ATTENDANT").toUpperCase());
    setEditingPermissions(normalizePermissions(member.permissions));
    setPermissionDialogOpen(true);
  };

  const saveMember = async () => {
    if (!editingMember) return;

    try {
      setSavingMember(true);

      await api.patch(
        `/business-team/${selectedStoreId}/members/${editingMember.id}`,
        {
          role: editingRole,
          canChat: editingPermissions.chat,
          canCentralComercial:
            editingPermissions.centralComercial,
          canAgenda: editingPermissions.agenda,
          canOrders: editingPermissions.orders,
          canCatalog: editingPermissions.catalog,
          canFinance: editingPermissions.finance,
          canSettings: editingPermissions.settings,
        },
      );

      toast.success("Permissões atualizadas.");
      setPermissionDialogOpen(false);
      setEditingMember(null);
      await loadMembers();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível atualizar o membro.",
      );
    } finally {
      setSavingMember(false);
    }
  };

  const deactivateMember = async (member: TeamMember) => {
    const confirmed = window.confirm(
      `Desativar ${member.name || member.email || "este membro"} da equipe?`,
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/business-team/${selectedStoreId}/members/${member.id}`,
      );

      toast.success("Membro desativado.");
      await loadMembers();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível desativar o membro.",
      );
    }
  };

  const reactivateMember = async (member: TeamMember) => {
    try {
      await api.patch(
        `/business-team/${selectedStoreId}/members/${member.id}`,
        {
          active: true,
        },
      );

      toast.success("Membro reativado.");
      await loadMembers();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Não foi possível reativar o membro.",
      );
    }
  };

  if (loadingBase) {
    return (
      <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
        <CircularProgress size={30} />
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Carregando equipe...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <GroupOutlined color="primary" />
            <Typography variant="h5" fontWeight={900}>
              Equipe
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie quem pode atender clientes e acessar módulos do seu negócio.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
        >
          {businesses.length > 1 && (
            <TextField
              select
              size="small"
              label="Negócio"
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              {businesses.map((item) => (
                <MenuItem
                  key={item?.store?.id}
                  value={String(item?.store?.id || "")}
                >
                  {item?.store?.name || "Negócio"}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshAll}
            disabled={loadingMembers || loadingInvitations}
          >
            Atualizar
          </Button>
        </Stack>
      </Stack>

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              NEGÓCIO
            </Typography>
            <Typography variant="h6" fontWeight={900}>
              {selectedBusinessName}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1.5 }}
            >
              <Chip
                size="small"
                label={`${activeMembers.length} membros ativos`}
                color="primary"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${pendingInvitations.length} convites pendentes`}
                color={pendingInvitations.length ? "warning" : "default"}
                variant="outlined"
              />
            </Stack>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignSelf={{ md: "center" }}
          >
            <Button
              variant="outlined"
              startIcon={<PersonAddAlt1Outlined />}
              onClick={() => setExistingDialogOpen(true)}
            >
              Usuário existente
            </Button>

            <Button
              variant="contained"
              startIcon={<EmailOutlined />}
              onClick={() => {
                setGeneratedInviteLink("");
                setInviteDialogOpen(true);
              }}
            >
              Convidar pessoa
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`Membros (${activeMembers.length})`} />
          <Tab label={`Convites (${invitations.length})`} />
          {inactiveMembers.length > 0 && (
            <Tab label={`Inativos (${inactiveMembers.length})`} />
          )}
        </Tabs>

        <Divider />

        {tab === 0 && (
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            {loadingMembers ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : activeMembers.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <GroupOutlined sx={{ fontSize: 48, color: "text.disabled" }} />
                <Typography fontWeight={800} sx={{ mt: 1 }}>
                  Nenhum membro ativo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adicione alguém já cadastrado ou envie um convite.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {activeMembers.map((member) => (
                  <Paper
                    key={member.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2.5 }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      alignItems={{ xs: "stretch", md: "center" }}
                      justifyContent="space-between"
                      gap={2}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar>{getInitials(member.name)}</Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900}>
                            {member.name || "Usuário"}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {member.email || "Sem e-mail"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.7}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 1 }}
                          >
                            <Chip
                              size="small"
                              label={member.role || "ATTENDANT"}
                              variant="outlined"
                            />

                            {member.permissions?.chat && (
                              <Chip size="small" label="Atendimento" />
                            )}

                            {member.permissions?.centralComercial && (
                              <Chip size="small" label="Central Comercial" />
                            )}

                            {member.permissions?.agenda && (
                              <Chip size="small" label="Agenda" />
                            )}

                            {member.permissions?.orders && (
                              <Chip size="small" label="Pedidos" />
                            )}

                            {member.permissions?.catalog && (
                              <Chip size="small" label="Catálogo" />
                            )}

                            {member.permissions?.finance && (
                              <Chip size="small" label="Financeiro" />
                            )}

                            {member.permissions?.settings && (
                              <Chip size="small" label="Configurações" />
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent={{ xs: "flex-end", md: "initial" }}
                      >
                        <Tooltip title="Permissões">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SettingsOutlined />}
                            onClick={() => openMemberPermissions(member)}
                          >
                            Permissões
                          </Button>
                        </Tooltip>

                        <Tooltip title="Desativar membro">
                          <IconButton
                            color="error"
                            onClick={() => deactivateMember(member)}
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            {generatedInviteLink && (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => copyInviteLink(generatedInviteLink)}
                  >
                    Copiar
                  </Button>
                }
              >
                Convite pronto. Enquanto o envio por e-mail não estiver ligado,
                copie o link e envie ao convidado.
              </Alert>
            )}

            {loadingInvitations ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : invitations.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <EmailOutlined sx={{ fontSize: 48, color: "text.disabled" }} />
                <Typography fontWeight={800} sx={{ mt: 1 }}>
                  Nenhum convite enviado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Convide uma pessoa externa para fazer parte da equipe.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {invitations.map((invitation) => {
                  const status = String(
                    invitation.status || "",
                  ).toUpperCase();

                  return (
                    <Paper
                      key={invitation.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2.5 }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", md: "center" }}
                        gap={2}
                      >
                        <Box>
                          <Typography fontWeight={900}>
                            {invitation.name || "Convidado"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.email || "—"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.8}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 1 }}
                          >
                            <Chip
                              size="small"
                              label={invitationStatusLabel(status)}
                              color={invitationStatusColor(status)}
                            />

                            {invitation.canChat !== false && (
                              <Chip
                                size="small"
                                label="Atendimento"
                                variant="outlined"
                              />
                            )}

                            {invitation.canCentralComercial !== false && (
                              <Chip
                                size="small"
                                label="Central Comercial"
                                variant="outlined"
                              />
                            )}
                          </Stack>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            Criado em {formatDate(invitation.createdAt)}
                            {invitation.expiresAt
                              ? ` • validade ${formatDate(
                                  invitation.expiresAt,
                                )}`
                              : ""}
                          </Typography>
                        </Box>

                        {status !== "ACCEPTED" && (
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SendOutlined />}
                              onClick={() => resendInvitation(invitation)}
                            >
                              Reenviar
                            </Button>

                            {status === "PENDING" && (
                              <Button
                                size="small"
                                color="error"
                                variant="text"
                                onClick={() => cancelInvitation(invitation)}
                              >
                                Cancelar
                              </Button>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {tab === 2 && inactiveMembers.length > 0 && (
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack spacing={1.5}>
              {inactiveMembers.map((member) => (
                <Paper
                  key={member.id}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2.5, opacity: 0.78 }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "stretch", md: "center" }}
                    justifyContent="space-between"
                    gap={2}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar>{getInitials(member.name)}</Avatar>
                      <Box>
                        <Typography fontWeight={900}>
                          {member.name || "Usuário"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.email || "—"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => reactivateMember(member)}
                    >
                      Reativar
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Usuário já cadastrado */}
      <Dialog
        open={existingDialogOpen}
        onClose={() => setExistingDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Adicionar usuário existente</DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A busca mostra somente usuários elegíveis para atuar como
            atendente deste negócio.
          </Typography>

          <TextField
            fullWidth
            autoFocus
            label="Buscar por nome ou e-mail"
            value={eligibleSearch}
            onChange={(event) => setEligibleSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: eligibleLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : undefined,
            }}
          />

          <Stack spacing={1.2} sx={{ mt: 2 }}>
            {!eligibleLoading && eligible.length === 0 && (
              <Alert severity="info">
                Nenhum usuário elegível encontrado.
              </Alert>
            )}

            {eligible.map((person) => (
              <Paper
                key={person.id || person.userId || person.email}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2 }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={{ width: 38, height: 38 }}>
                      {getInitials(person.name)}
                    </Avatar>

                    <Box>
                      <Typography fontWeight={800}>
                        {person.name || "Usuário"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {person.email}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => addExistingUser(person)}
                  >
                    Adicionar
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setExistingDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convite externo */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => {
          if (!submittingInvite) setInviteDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Convidar pessoa externa</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              A pessoa criará ou entrará em sua conta GranConecta e depois
              aceitará o convite para fazer parte da equipe.
            </Alert>

            <TextField
              fullWidth
              label="Nome"
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
            />

            <TextField
              fullWidth
              type="email"
              label="E-mail"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1 }}>
                Permissões iniciais
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={invitePermissions.chat}
                    onChange={(event) =>
                      setInvitePermissions((current) => ({
                        ...current,
                        chat: event.target.checked,
                      }))
                    }
                  />
                }
                label="Atendimento"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={invitePermissions.centralComercial}
                    onChange={(event) =>
                      setInvitePermissions((current) => ({
                        ...current,
                        centralComercial: event.target.checked,
                      }))
                    }
                  />
                }
                label="Central Comercial"
              />
            </Box>

            {generatedInviteLink && (
              <TextField
                fullWidth
                label="Link do convite"
                value={generatedInviteLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          copyInviteLink(generatedInviteLink)
                        }
                      >
                        <ContentCopy />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setInviteDialogOpen(false)}
            disabled={submittingInvite}
          >
            Fechar
          </Button>

          <Button
            variant="contained"
            startIcon={
              submittingInvite ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendOutlined />
              )
            }
            onClick={createExternalInvite}
            disabled={submittingInvite}
          >
            Criar convite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissões do membro */}
      <Dialog
        open={permissionDialogOpen}
        onClose={() => {
          if (!savingMember) setPermissionDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <SecurityOutlined color="primary" />
            <Box>
              <Typography fontWeight={900}>
                Permissões da equipe
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingMember?.name || editingMember?.email}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Função"
              value={editingRole}
              onChange={(event) => setEditingRole(event.target.value)}
            >
              <MenuItem value="ATTENDANT">Atendente</MenuItem>
              <MenuItem value="MANAGER">Gerente</MenuItem>
            </TextField>

            <Divider />

            {permissionLabels.map((permission) => (
              <Stack
                key={permission.key}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={2}
              >
                <Box>
                  <Typography fontWeight={800}>
                    {permission.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {permission.description}
                  </Typography>
                </Box>

                <Switch
                  checked={editingPermissions[permission.key]}
                  onChange={(event) =>
                    setEditingPermissions((current) => ({
                      ...current,
                      [permission.key]: event.target.checked,
                    }))
                  }
                />
              </Stack>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setPermissionDialogOpen(false)}
            disabled={savingMember}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={saveMember}
            disabled={savingMember}
          >
            {savingMember ? "Salvando..." : "Salvar permissões"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}