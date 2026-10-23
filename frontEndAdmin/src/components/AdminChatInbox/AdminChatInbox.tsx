import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  ChatBubbleOutline,
  CheckCircleOutline,
  Instagram,
  PersonOutline,
  Refresh,
  Send,
  SmartToyOutlined,
  WhatsApp,
} from "@mui/icons-material";

import toast from "react-hot-toast";

import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
 * TIPOS
 * =========================================================
 */

type InboxScope =
  | "AGUARDANDO"
  | "MINHAS"
  | "TODAS";

type CanalFilter =
  | "TODOS"
  | "INSTAGRAM"
  | "WHATSAPP";

type ContextoFilter =
  | "TODOS"
  | "LOJA"
  | "PRESTADOR";

type Conversation = {
  id: string;

  userId?: string | null;
  userName?: string | null;
  userType?: string | null;

  condominioId?: string | null;

  chatbot_tipo?: string | null;
  chatbot_owner_id?: string | null;

  origem?: string | null;
  status?: string | null;

  atendente_id?: string | null;
  atendente_nome?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  ultimaMensagem?: string | null;
  ultimaMensagemEm?: string | null;

  naoLidas?: number | string | null;
};

type Message = {
  id: string;

  conversationId: string;

  role:
    | "user"
    | "assistant";

  content: string;

  createdAt: string;
};

type Props = {
  chatbotTipo?: string;
  chatbotOwnerId?: string;
  title?: string;
};

type InboxCounts = {
  aguardando: number;
  minhas: number;
  total: number;
};

/* =========================================================
 * HELPERS
 * =========================================================
 */

function isWhatsApp(origem?: string | null) {
  const val = String(origem || "").toUpperCase();
  return val.includes("WHATSAPP") || val === "WA";
}

function isInstagram(origem?: string | null) {
  const val = String(origem || "").toUpperCase();
  return val.includes("INSTAGRAM") || val === "IG";
}

function origemLabel(
  origem?: string | null,
) {
  if (isInstagram(origem)) {
    return "Instagram";
  }

  if (isWhatsApp(origem)) {
    return "WhatsApp";
  }

  const value = String(origem || "").toUpperCase();

  if (
    value ===
    "LANDING_PAGE"
  ) {
    return "Landing Page";
  }

  if (
    value ===
    "CHAT_LOJA"
  ) {
    return "Chat da Loja";
  }

  if (
    value ===
    "CHAT_PRESTADOR"
  ) {
    return "Chat Prestador";
  }

  if (
    value ===
    "CHAT_HOME"
  ) {
    return "Chat GranConecta";
  }

  return origem || "Chat";
}

function statusLabel(
  status?: string | null,
) {
  if (
    status ===
    "AGUARDANDO_ATENDENTE"
  ) {
    return "Aguardando";
  }

  if (
    status ===
    "EM_ATENDIMENTO_HUMANO"
  ) {
    return "Em atendimento";
  }

  if (
    status ===
    "FINALIZADA"
  ) {
    return "Finalizada";
  }

  return status || "";
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",

      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

/* =========================================================
 * COMPONENTE
 * =========================================================
 */

export default function AdminChatInbox({
  chatbotTipo,
  chatbotOwnerId,
  title = "Central de Atendimento",
}: Props) {
  const theme =
    useTheme();

  const isMobile =
    useMediaQuery(
      theme.breakpoints.down(
        "md",
      ),
    );

  const { user } =
    useAuth();

  const loggedUserId =
    String(
      (user as any)?.id ||
      (user as any)?.usuarioId ||
      "",
    ).trim();

  /* =======================================================
   * ESTADOS
   * =======================================================
   */

  const [
    scope,
    setScope,
  ] =
    useState<InboxScope>(
      "AGUARDANDO",
    );

  const [
    canal,
    setCanal,
  ] =
    useState<CanalFilter>(
      "TODOS",
    );

  const [
    contexto,
    setContexto,
  ] =
    useState<ContextoFilter>(
      "TODOS",
    );

  const [
    conversations,
    setConversations,
  ] =
    useState<
      Conversation[]
    >([]);

  const [
    selected,
    setSelected,
  ] =
    useState<
      Conversation | null
    >(null);

  const [
    messages,
    setMessages,
  ] =
    useState<
      Message[]
    >([]);

  const [
    reply,
    setReply,
  ] =
    useState("");

  const [
    loadingInbox,
    setLoadingInbox,
  ] =
    useState(false);

  const [
    loadingMessages,
    setLoadingMessages,
  ] =
    useState(false);

  const [
    loadingCounts,
    setLoadingCounts,
  ] =
    useState(false);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    taking,
    setTaking,
  ] =
    useState(false);

  const [
    finishing,
    setFinishing,
  ] =
    useState(false);

  const [
    counts,
    setCounts,
  ] =
    useState<InboxCounts>({
      aguardando: 0,
      minhas: 0,
      total: 0,
    });

  /* =======================================================
   * PARAMS
   * =======================================================
   */

  const buildParams =
    useCallback(
      (
        targetScope:
          InboxScope,
      ) => {
        const params: Record<
          string,
          string
        > = {
          scope:
            targetScope,
        };

        if (
          chatbotTipo
        ) {
          params.chatbotTipo =
            chatbotTipo;
        }

        if (
          chatbotOwnerId
        ) {
          params.chatbotOwnerId =
            chatbotOwnerId;
        }

        if (
          canal !== "TODOS"
        ) {
          params.canal = canal;
        }

        if (
          contexto !== "TODOS"
        ) {
          params.contexto =
            contexto;
        }

        return params;
      },
      [
        chatbotTipo,
        chatbotOwnerId,
        canal,
        contexto,
      ],
    );

  /* =======================================================
   * CONTADORES
   * =======================================================
   */

  const loadCounts =
    useCallback(
      async () => {
        try {
          setLoadingCounts(
            true,
          );

          const response = await api.get("/chat/human/inbox",
              {
                params:
                  buildParams(
                    "TODAS",
                  ),
              },
            );

          const rows: Conversation[] =
            Array.isArray(
              response.data,
            )
              ? response.data
              : [];

          const aguardando =
            rows.filter(
              (
                conversation,
              ) =>
                conversation.status ===
                "AGUARDANDO_ATENDENTE" &&
                !conversation.atendente_id,
            ).length;

          const minhas =
            rows.filter(
              (
                conversation,
              ) =>
                conversation.status ===
                  "EM_ATENDIMENTO_HUMANO" &&
                String(
                  conversation.atendente_id ||
                    "",
                ) ===
                  loggedUserId,
            ).length;

          setCounts({
            aguardando,
            minhas,
            total:
              rows.length,
          });
        } catch (
          error
        ) {
          console.error(
            "[AdminChatInbox] Erro ao carregar contadores:",
            error,
          );
        } finally {
          setLoadingCounts(
            false,
          );
        }
      },
      [
        buildParams,
        loggedUserId,
      ],
    );

  /* =======================================================
   * INBOX
   * =======================================================
   */

  const loadInbox =
    useCallback(
      async (
        targetScope:
          InboxScope =
          scope,
      ) => {
        try {
          setLoadingInbox(
            true,
          );

          const response =
            await api.get(
              "/chat/human/inbox",
              {
                params:
                  buildParams(
                    targetScope,
                  ),
              },
            );

          const rows: Conversation[] =
            Array.isArray(
              response.data,
            )
              ? response.data
              : [];

          setConversations(
            rows,
          );

          setSelected(
            (
              current,
            ) => {
              if (
                !current
              ) {
                return null;
              }

              return (
                rows.find(
                  (
                    item,
                  ) =>
                    item.id ===
                    current.id,
                ) ||
                null
              );
            },
          );
        } catch (
          error: any
        ) {
          console.error(
            "[AdminChatInbox] Erro inbox:",
            error,
          );

          toast.error(
            error?.response
              ?.data
              ?.message ||
              "Erro ao carregar atendimentos.",
          );
        } finally {
          setLoadingInbox(
            false,
          );
        }
      },
      [
        scope,
        buildParams,
      ],
    );

  /* =======================================================
   * MENSAGENS
   * =======================================================
   */

  const loadMessages =
    useCallback(
      async (
        conversation:
          Conversation,
      ) => {
        try {
          setLoadingMessages(
            true,
          );

          setSelected(
            conversation,
          );

          const response =
            await api.get(
              `/chat/human/${conversation.id}/messages`,
            );

          setMessages(
            Array.isArray(
              response.data,
            )
              ? response.data
              : [],
          );

          setConversations(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  conversation.id
                    ? {
                        ...item,
                        naoLidas: 0,
                      }
                    : item,
              ),
          );

          setSelected(
            (current) =>
              current?.id ===
              conversation.id
                ? {
                    ...current,
                    naoLidas: 0,
                  }
                : current,
          );
        } catch (
          error: any
        ) {
          console.error(
            "[AdminChatInbox] Erro mensagens:",
            error,
          );

          toast.error(
            error?.response
              ?.data
              ?.message ||
              "Erro ao carregar conversa.",
          );
        } finally {
          setLoadingMessages(
            false,
          );
        }
      },
      [],
    );

  /* =======================================================
   * ASSUMIR
   * =======================================================
   */

  const takeConversation =
    useCallback(
      async (
        conversation:
          Conversation,
      ) => {
        try {
          setTaking(true);

          await api.post(
            `/chat/human/${conversation.id}/take`,
          );

          toast.success(
            "Atendimento assumido.",
          );

          setScope(
            "MINHAS",
          );

          setSelected(
            null,
          );

          setMessages(
            [],
          );

          await Promise.all([
            loadInbox(
              "MINHAS",
            ),

            loadCounts(),
          ]);
        } catch (
          error: any
        ) {
          console.error(
            "[AdminChatInbox] Erro ao assumir:",
            error,
          );

          const message =
            error?.response
              ?.data
              ?.message ||
            "Erro ao assumir atendimento.";

          toast.error(
            message,
          );

          await Promise.all([
            loadInbox(),
            loadCounts(),
          ]);
        } finally {
          setTaking(
            false,
          );
        }
      },
      [
        loadInbox,
        loadCounts,
      ],
    );

  /* =======================================================
   * RESPONDER
   * =======================================================
   */

  const sendReply =
    useCallback(
      async () => {
        if (
          !selected
        ) {
          return;
        }

        const text =
          reply.trim();

        if (!text) {
          toast.error(
            "Digite uma mensagem.",
          );

          return;
        }

        try {
          setSending(
            true,
          );

          await api.post(
            `/chat/human/${selected.id}/reply`,
            {
              message:
                text,
            },
          );

          setReply("");

          const response =
            await api.get(
              `/chat/human/${selected.id}/messages`,
            );

          setMessages(
            Array.isArray(
              response.data,
            )
              ? response.data
              : [],
          );

          await Promise.all([
            loadInbox(),
            loadCounts(),
          ]);
        } catch (
          error: any
        ) {
          console.error(
            "[AdminChatInbox] Erro ao responder:",
            error,
          );

          toast.error(
            error?.response
              ?.data
              ?.message ||
              "Erro ao enviar resposta.",
          );
        } finally {
          setSending(
            false,
          );
        }
      },
      [
        selected,
        reply,
        loadInbox,
        loadCounts,
      ],
    );

  /* =======================================================
   * FINALIZAR
   * =======================================================
   */

  const finishConversation =
    useCallback(
      async () => {
        if (
          !selected
        ) {
          return;
        }

        try {
          setFinishing(
            true,
          );

          await api.post(
            `/chat/human/${selected.id}/finish`,
          );

          toast.success(
            "Atendimento finalizado.",
          );

          setSelected(
            null,
          );

          setMessages(
            [],
          );

          setReply("");

          await Promise.all([
            loadInbox(),
            loadCounts(),
          ]);
        } catch (
          error: any
        ) {
          console.error(
            "[AdminChatInbox] Erro ao finalizar:",
            error,
          );

          toast.error(
            error?.response
              ?.data
              ?.message ||
              "Erro ao finalizar atendimento.",
          );
        } finally {
          setFinishing(
            false,
          );
        }
      },
      [
        selected,
        loadInbox,
        loadCounts,
      ],
    );

  /* =======================================================
   * REFRESH MANUAL
   * =======================================================
   */

  const refreshAll =
    useCallback(
      async () => {
        await Promise.all([
          loadInbox(),
          loadCounts(),
        ]);
      },
      [
        loadInbox,
        loadCounts,
      ],
    );

  /* =======================================================
   * POLLING
   * =======================================================
   */

  useEffect(() => {
    refreshAll();

    const interval =
      window.setInterval(
        () => {
          refreshAll();
        },
        10000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [refreshAll]);

  /* =======================================================
   * SELEÇÃO
   * =======================================================
   */

  const selectedMine =
    Boolean(
      selected &&
      selected.atendente_id &&
      String(
        selected.atendente_id,
      ) ===
        loggedUserId,
    );

  const selectedWaiting =
    selected?.status ===
    "AGUARDANDO_ATENDENTE";

  const selectedOtherAttendant =
    Boolean(
      selected &&
      selected.atendente_id &&
      String(
        selected.atendente_id,
      ) !==
        loggedUserId,
    );

  /* =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <Box
      sx={{
        p: {
          xs: 1,
          sm: 2,
          md: 3,
        },
      }}
    >
      {/* CABEÇALHO */}
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        spacing={2}
        sx={{
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={900}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Atendimento humano
            dos canais do
            GranConecta.
          </Typography>
        </Box>

        <Tooltip title="Atualizar atendimentos">
          <span>
            <IconButton
              onClick={
                refreshAll
              }
              disabled={
                loadingInbox ||
                loadingCounts
              }
            >
              {loadingInbox ||
              loadingCounts ? (
                <CircularProgress
                  size={22}
                />
              ) : (
                <Refresh />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* ABAS / CONTADORES */}
      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          overflow:
            "hidden",
        }}
      >
        <Tabs
          value={scope}
          onChange={(
            _event,
            value:
              InboxScope,
          ) => {
            setScope(
              value,
            );

            setSelected(
              null,
            );

            setMessages(
              [],
            );

            setReply("");
          }}
          variant={
            isMobile
              ? "fullWidth"
              : "standard"
          }
          sx={{
            "& .MuiTab-root":
              {
                fontWeight:
                  700,

                minHeight:
                  56,
              },
          }}
        >
          <Tab
            value="AGUARDANDO"
            label={`Aguardando (${counts.aguardando})`}
          />

          <Tab
            value="MINHAS"
            label={`Minhas (${counts.minhas})`}
          />

          <Tab
            value="TODAS"
            label={`Todas (${counts.total})`}
          />
        </Tabs>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          p: 1.5,
        }}
      >
        <Stack spacing={1.25}>
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ mr: 0.5 }}
            >
              Canal
            </Typography>

            {(
              [
                ["TODOS", "Todos"],
                ["INSTAGRAM", "Instagram"],
                ["WHATSAPP", "WhatsApp"],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                clickable
                label={label}
                color={
                  canal === value
                    ? "primary"
                    : "default"
                }
                variant={
                  canal === value
                    ? "filled"
                    : "outlined"
                }
                onClick={() => {
                  setCanal(value);
                  setSelected(null);
                  setMessages([]);
                  setReply("");
                }}
              />
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ mr: 0.5 }}
            >
              Contexto
            </Typography>

            {(
              [
                ["TODOS", "Todos"],
                ["LOJA", "Loja"],
                ["PRESTADOR", "Prestador"],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                clickable
                label={label}
                color={
                  contexto === value
                    ? "primary"
                    : "default"
                }
                variant={
                  contexto === value
                    ? "filled"
                    : "outlined"
                }
                onClick={() => {
                  setContexto(value);
                  setSelected(null);
                  setMessages([]);
                  setReply("");
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* ÁREA PRINCIPAL */}
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={2}
        sx={{
          minHeight: {
            xs: "auto",
            md: 620,
          },
        }}
      >
        {/* LISTA DE CONVERSAS */}
        <Paper
          variant="outlined"
          sx={{
            width: {
              xs: "100%",
              md: 380,
            },

            minWidth: {
              md: 320,
            },

            maxHeight: {
              xs: 350,
              md: 620,
            },

            overflowY:
              "auto",
          }}
        >
          <Box
            sx={{
              p: 2,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
            >
              <Typography
                fontWeight={800}
              >
                Conversas
              </Typography>

              <Chip
                size="small"
                label={
                  conversations.length
                }
                variant="outlined"
              />
            </Stack>
          </Box>

          <Divider />

          {loadingInbox &&
            conversations.length ===
              0 && (
              <Box
                sx={{
                  py: 8,
                  textAlign:
                    "center",
                }}
              >
                <CircularProgress />
              </Box>
            )}

          {!loadingInbox &&
            conversations.length ===
              0 && (
              <Box
                sx={{
                  py: 8,
                  px: 2,

                  textAlign:
                    "center",
                }}
              >
                <ChatBubbleOutline
                  sx={{
                    fontSize: 42,
                    opacity: 0.35,
                  }}
                />

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 1,
                  }}
                >
                  Nenhuma conversa
                  neste filtro.
                </Typography>
              </Box>
            )}

          {conversations.map(
            (
              conversation,
            ) => {
              const active =
                selected?.id ===
                conversation.id;

              const isInsta = isInstagram(conversation.origem);
              const isWa = isWhatsApp(conversation.origem);

              const mine =
                String(
                  conversation.atendente_id ||
                    "",
                ) ===
                loggedUserId;

              const unreadCount =
                Math.max(
                  0,
                  Number(
                    conversation.naoLidas ||
                      0,
                  ) || 0,
                );

              return (
                <Box
                  key={
                    conversation.id
                  }
                  onClick={() =>
                    loadMessages(
                      conversation,
                    )
                  }
                  sx={{
                    p: 2,

                    cursor:
                      "pointer",

                    borderBottom:
                      "1px solid",

                    borderColor:
                      "divider",

                    bgcolor:
                      active
                        ? "action.selected"
                        : "transparent",

                    "&:hover": {
                      bgcolor:
                        "action.hover",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                  >
                    <Badge
                      badgeContent={
                        unreadCount
                      }
                      color="error"
                      max={99}
                      invisible={
                        unreadCount <= 0
                      }
                      overlap="circular"
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                    >
                      <Avatar>
                        {isInsta ? (
                          <Instagram />
                        ) : isWa ? (
                          <WhatsApp />
                        ) : (
                          <PersonOutline />
                        )}
                      </Avatar>
                    </Badge>

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography
                          fontWeight={800}
                          noWrap
                        >
                          {conversation.userName ||
                            conversation.userId ||
                            "Cliente"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {formatDate(
                            conversation.ultimaMensagemEm ||
                              conversation.updatedAt,
                          )}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{
                          mt: 0.5,
                          mb: 0.75,
                        }}
                      >
                        <Chip
                          size="small"
                          label={origemLabel(
                            conversation.origem,
                          )}
                        />

                        <Chip
                          size="small"
                          variant="outlined"
                          label={statusLabel(
                            conversation.status,
                          )}
                        />

                        {mine && (
                          <Chip
                            size="small"
                            color="primary"
                            label="Minha"
                          />
                        )}
                      </Stack>

                      {conversation.atendente_id && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{
                            display: "block",
                            mb: 0.5,
                            fontWeight: 600,
                          }}
                        >
                          Responsável: {conversation.atendente_nome || "Atendente"}
                          {mine ? " (você)" : ""}
                        </Typography>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                      >
                        {conversation.ultimaMensagem ||
                          "Sem mensagens"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            },
          )}
        </Paper>

        {/* CONVERSA DETALHADA */}
        <Paper
          variant="outlined"
          sx={{
            flex: 1,

            minWidth: 0,

            minHeight: {
              xs: 520,
              md: 620,
            },

            display:
              "flex",

            flexDirection:
              "column",

            overflow:
              "hidden",
          }}
        >
          {!selected ? (
            <Box
              sx={{
                flex: 1,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                textAlign:
                  "center",

                p: 4,
              }}
            >
              <Box>
                <SmartToyOutlined
                  sx={{
                    fontSize: 54,
                    opacity: 0.3,
                  }}
                />

                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    mt: 1,
                  }}
                >
                  Selecione uma
                  conversa
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  As mensagens
                  aparecerão aqui.
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* CABEÇALHO DA CONVERSA */}
              <Box
                sx={{
                  px: 2,
                  py: 1.5,

                  borderBottom:
                    "1px solid",

                  borderColor:
                    "divider",
                }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  justifyContent="space-between"
                  alignItems={{
                    xs: "stretch",
                    sm: "center",
                  }}
                  spacing={1.5}
                >
                  <Box>
                    <Typography
                      fontWeight={900}
                    >
                      {selected.userName ||
                        selected.userId ||
                        "Cliente"}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      <Chip
                        size="small"
                        label={origemLabel(
                          selected.origem,
                        )}
                      />

                      <Chip
                        size="small"
                        variant="outlined"
                        label={statusLabel(
                          selected.status,
                        )}
                      />

                      {selectedMine && (
                        <Chip
                          size="small"
                          color="primary"
                          label="Você está atendendo"
                        />
                      )}

                      {selectedOtherAttendant && (
                        <Chip
                          size="small"
                          color="warning"
                          label="Outro atendente"
                        />
                      )}
                    </Stack>

                    {selected.atendente_id && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.75 }}
                      >
                        Responsável: {selected.atendente_nome || "Atendente"}
                        {selectedMine ? " (você)" : ""}
                      </Typography>
                    )}
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    {selectedWaiting && (
                      <Button
                        variant="contained"
                        disabled={
                          taking
                        }
                        onClick={() =>
                          takeConversation(
                            selected,
                          )
                        }
                      >
                        {taking
                          ? "Assumindo..."
                          : "Assumir"}
                      </Button>
                    )}

                    {selectedMine && (
                      <Button
                        variant="outlined"
                        color="success"
                        disabled={
                          finishing
                        }
                        startIcon={
                          finishing
                            ? (
                              <CircularProgress
                                size={16}
                              />
                            )
                            : (
                              <CheckCircleOutline />
                            )
                        }
                        onClick={
                          finishConversation
                        }
                      >
                        {finishing
                          ? "Finalizando..."
                          : "Finalizar"}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>

              {/* HISTÓRICO */}
              <Box
                sx={{
                  flex: 1,

                  overflowY:
                    "auto",

                  p: 2,

                  bgcolor:
                    "background.default",
                }}
              >
                {loadingMessages ? (
                  <Box
                    sx={{
                      py: 8,

                      textAlign:
                        "center",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : messages.length ===
                  0 ? (
                  <Box
                    sx={{
                      py: 8,

                      textAlign:
                        "center",
                    }}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      Nenhuma mensagem
                      nesta conversa.
                    </Typography>
                  </Box>
                ) : (
                  <Stack
                    spacing={1.5}
                  >
                    {messages.map(
                      (
                        message,
                      ) => {
                        const fromUser =
                          message.role ===
                          "user";

                        return (
                          <Box
                            key={
                              message.id
                            }
                            sx={{
                              display:
                                "flex",

                              justifyContent:
                                fromUser
                                  ? "flex-start"
                                  : "flex-end",
                            }}
                          >
                            <Box
                              sx={{
                                maxWidth: {
                                  xs: "90%",
                                  sm: "78%",
                                },

                                px: 1.5,
                                py: 1,

                                borderRadius:
                                  2,

                                bgcolor:
                                  fromUser
                                    ? "background.paper"
                                    : "primary.main",

                                color:
                                  fromUser
                                    ? "text.primary"
                                    : "primary.contrastText",

                                border:
                                  fromUser
                                    ? "1px solid"
                                    : "none",

                                borderColor:
                                  "divider",

                                boxShadow:
                                  1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  display:
                                    "block",

                                  mb: 0.4,

                                  fontWeight:
                                    800,

                                  opacity:
                                    0.75,
                                }}
                              >
                                {fromUser
                                  ? "Cliente"
                                  : "Atendimento"}
                              </Typography>

                              <Typography
                                variant="body2"
                                sx={{
                                  whiteSpace:
                                    "pre-wrap",

                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                {
                                  message.content
                                }
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  display:
                                    "block",

                                  mt: 0.5,

                                  opacity:
                                    0.7,

                                  textAlign:
                                    "right",
                                }}
                              >
                                {formatDate(
                                  message.createdAt,
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      },
                    )}
                  </Stack>
                )}
              </Box>

              {/* INPUT DE MENSAGEM */}
              <Box
                sx={{
                  p: 1.5,

                  borderTop:
                    "1px solid",

                  borderColor:
                    "divider",

                  bgcolor:
                    "background.paper",
                }}
              >
                {selectedMine ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-end"
                  >
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      maxRows={4}
                      value={reply}
                      placeholder="Digite sua resposta..."
                      onChange={(
                        event,
                      ) =>
                        setReply(
                          event
                            .target
                            .value,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();

                          void sendReply();
                        }
                      }}
                    />

                    <Tooltip title="Enviar">
                      <span>
                        <IconButton
                          color="primary"
                          disabled={
                            sending ||
                            !reply.trim()
                          }
                          onClick={() =>
                            void sendReply()
                          }
                          sx={{
                            width: 48,
                            height: 48,
                          }}
                        >
                          {sending ? (
                            <CircularProgress
                              size={22}
                            />
                          ) : (
                            <Send />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                ) : selectedWaiting ? (
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    alignItems={{
                      xs: "stretch",
                      sm: "center",
                    }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Assuma esta conversa
                      para poder responder.
                    </Typography>

                    <Button
                      variant="contained"
                      disabled={
                        taking
                      }
                      onClick={() =>
                        takeConversation(
                          selected,
                        )
                      }
                    >
                      {taking
                        ? "Assumindo..."
                        : "Assumir atendimento"}
                    </Button>
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Esta conversa pertence
                    a outro atendente.
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}