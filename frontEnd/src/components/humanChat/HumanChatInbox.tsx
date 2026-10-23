import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import api from "../../api/api";
import toast from "react-hot-toast";

type InboxScope = "AGUARDANDO" | "MINHAS" | "TODAS";

type Conversation = {
  id: string;
  userName?: string | null;
  userType?: string | null;
  chatbot_tipo?: string;
  chatbot_owner_id?: string | null;
  origem?: string;
  status: string;
  ultimaMensagem?: string;
  updatedAt?: string;
  atendente_id?: string | null;
  atendente_nome?: string | null;
  nao_lidas?: number;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
};

type Props = {
  chatbotTipo?: "GRANCONECTA" | "LOJA" | "PRESTADOR";
  chatbotOwnerId?: string;
  title?: string;
};

export function HumanChatInbox({
  chatbotTipo,
  chatbotOwnerId,
  title = "Atendimento humano",
}: Props) {
  const [scope, setScope] = useState<InboxScope>("AGUARDANDO");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [selectedOwnedByMe, setSelectedOwnedByMe] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [taking, setTaking] = useState(false);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);

  async function loadInbox(nextScope: InboxScope = scope) {
    try {
      setLoadingInbox(true);

      const params: Record<string, string> = {
        scope: nextScope,
      };

      if (chatbotTipo) params.chatbotTipo = chatbotTipo;
      if (chatbotOwnerId) params.chatbotOwnerId = chatbotOwnerId;

      const response = await api.get("/chat/human/inbox", { params });
      const data: Conversation[] = Array.isArray(response.data)
        ? response.data
        : [];

      setConversations(data);

      // Mantém os dados visuais da conversa selecionada atualizados
      // sem assumir atendimento automaticamente.
      setSelected((current) => {
        if (!current) return current;
        const refreshed = data.find((item) => item.id === current.id);
        return refreshed || current;
      });
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao carregar atendimentos.",
      );
    } finally {
      setLoadingInbox(false);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      setLoadingMessages(true);

      const response = await api.get(
        `/chat/human/${conversationId}/messages`,
      );

      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao carregar conversa.",
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  async function selectConversation(conversation: Conversation) {
    setSelected(conversation);
    setReply("");
    setMessages([]);

    // Na fila, selecionar NÃO assume e NÃO lê as mensagens.
    // Isso evita que um atendente pegue uma conversa só por clicar.
    if (
      conversation.status === "AGUARDANDO_ATENDENTE" &&
      !conversation.atendente_id
    ) {
      setSelectedOwnedByMe(false);
      return;
    }

    // Em "Minhas", o backend já filtrou pelo atendente autenticado.
    if (scope === "MINHAS") {
      setSelectedOwnedByMe(true);
      await fetchMessages(conversation.id);
      return;
    }

    // Em "Todos", uma conversa já atribuída pode ser consultada em
    // modo leitura. O backend impede resposta se pertencer a outro atendente.
    setSelectedOwnedByMe(false);
    await fetchMessages(conversation.id);
  }

  async function takeConversation() {
    if (!selected) return;

    try {
      setTaking(true);

      await api.post(`/chat/human/${selected.id}/take`);

      toast.success("Atendimento assumido por você.");

      setSelectedOwnedByMe(true);

      // Atualiza o objeto local para refletir imediatamente o estado.
      setSelected((current) =>
        current
          ? {
              ...current,
              status: "EM_ATENDIMENTO_HUMANO",
            }
          : current,
      );

      await fetchMessages(selected.id);

      // Após assumir, leva o atendente para a área de trabalho dele.
      setScope("MINHAS");
      await loadInbox("MINHAS");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Este atendimento pode já ter sido assumido por outro atendente.",
      );

      // Se houve disputa entre dois atendentes, atualiza a fila
      // para mostrar quem ficou com a conversa.
      setSelectedOwnedByMe(false);
      await loadInbox(scope);
    } finally {
      setTaking(false);
    }
  }

  async function sendReply() {
    if (!selected || !selectedOwnedByMe) return;

    if (!reply.trim()) {
      toast.error("Digite uma mensagem.");
      return;
    }

    try {
      setSending(true);

      await api.post(`/chat/human/${selected.id}/reply`, {
        message: reply.trim(),
      });

      setReply("");
      await fetchMessages(selected.id);
      await loadInbox("MINHAS");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao enviar resposta.",
      );
    } finally {
      setSending(false);
    }
  }

  async function finishConversation() {
    if (!selected || !selectedOwnedByMe) return;

    try {
      setFinishing(true);

      await api.post(`/chat/human/${selected.id}/finish`);

      toast.success("Atendimento finalizado.");
      setSelected(null);
      setSelectedOwnedByMe(false);
      setMessages([]);
      setReply("");
      await loadInbox(scope);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao finalizar atendimento.",
      );
    } finally {
      setFinishing(false);
    }
  }

  function changeScope(nextScope: InboxScope) {
    setScope(nextScope);
    setSelected(null);
    setSelectedOwnedByMe(false);
    setMessages([]);
    setReply("");
  }

  useEffect(() => {
    loadInbox(scope);

    const interval = window.setInterval(() => {
      loadInbox(scope);
    }, 10000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotTipo, chatbotOwnerId, scope]);

  const isWaiting =
    selected?.status === "AGUARDANDO_ATENDENTE" &&
    !selected?.atendente_id;

  const assignedToAnother =
    !!selected?.atendente_id &&
    !selectedOwnedByMe &&
    scope !== "MINHAS";

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        p: { xs: 1.5, md: 2 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={900}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fila compartilhada com controle por atendente.
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => loadInbox(scope)}>
          Atualizar
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: 2,
          flexWrap: "wrap",
          rowGap: 1,
        }}
      >
        <Button
          size="small"
          variant={scope === "AGUARDANDO" ? "contained" : "outlined"}
          onClick={() => changeScope("AGUARDANDO")}
        >
          Fila
        </Button>

        <Button
          size="small"
          variant={scope === "MINHAS" ? "contained" : "outlined"}
          onClick={() => changeScope("MINHAS")}
        >
          Meus atendimentos
        </Button>

        <Button
          size="small"
          variant={scope === "TODAS" ? "contained" : "outlined"}
          onClick={() => changeScope("TODAS")}
        >
          Todos
        </Button>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
          gap: 2,
          overflow: "hidden",
        }}
      >
        <Card
          sx={{
            borderRadius: 3,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <CardContent>
            <Typography fontWeight={900} sx={{ mb: 2 }}>
              {scope === "AGUARDANDO"
                ? "Fila"
                : scope === "MINHAS"
                  ? "Meus atendimentos"
                  : "Todos os atendimentos"}
            </Typography>

            {loadingInbox ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : conversations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {scope === "AGUARDANDO"
                  ? "Nenhum atendimento aguardando."
                  : scope === "MINHAS"
                    ? "Você não possui atendimentos em andamento."
                    : "Nenhum atendimento encontrado."}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {conversations.map((conversation) => (
                  <Box
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor:
                        selected?.id === conversation.id
                          ? "primary.main"
                          : "divider",
                      cursor: "pointer",
                      bgcolor:
                        selected?.id === conversation.id
                          ? "action.selected"
                          : "background.paper",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        mb: 0.75,
                        flexWrap: "wrap",
                        rowGap: 0.5,
                      }}
                    >
                      <Chip
                        label={conversation.chatbot_tipo || "CHAT"}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />

                      <Chip
                        label={
                          conversation.status === "AGUARDANDO_ATENDENTE"
                            ? "AGUARDANDO"
                            : conversation.status
                        }
                        size="small"
                        color={
                          conversation.status === "AGUARDANDO_ATENDENTE"
                            ? "warning"
                            : "success"
                        }
                      />

                      {conversation.atendente_nome ? (
                        <Chip
                          label={`Com ${conversation.atendente_nome}`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}

                      {Number(conversation.nao_lidas || 0) > 0 ? (
                        <Chip
                          label={`${conversation.nao_lidas} nova(s)`}
                          size="small"
                          color="error"
                        />
                      ) : null}
                    </Stack>

                    <Typography fontWeight={800} noWrap>
                      {conversation.userName || "Visitante"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {conversation.ultimaMensagem || "Sem mensagem."}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              p: 2,
            }}
          >
            {!selected ? (
              <Box
                sx={{
                  minHeight: 450,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  textAlign: "center",
                  px: 2,
                }}
              >
                Selecione uma conversa.
              </Box>
            ) : (
              <>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography fontWeight={900}>
                      {selected.userName || "Visitante"}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {selected.origem} · {selected.chatbot_tipo}
                    </Typography>

                    {selected.atendente_nome ? (
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        Atendente: {selected.atendente_nome}
                      </Typography>
                    ) : null}
                  </Box>

                  {selectedOwnedByMe ? (
                    <Button
                      color="success"
                      variant="outlined"
                      onClick={finishConversation}
                      disabled={finishing}
                    >
                      {finishing ? "Finalizando..." : "Finalizar"}
                    </Button>
                  ) : null}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {isWaiting ? (
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 300,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      px: 3,
                    }}
                  >
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      Cliente aguardando atendimento
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3, maxWidth: 460 }}
                    >
                      Esta conversa ainda não pertence a nenhum atendente.
                      Clique em assumir para iniciar o atendimento.
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={takeConversation}
                      disabled={taking}
                    >
                      {taking ? "Assumindo..." : "Assumir atendimento"}
                    </Button>
                  </Box>
                ) : (
                  <>
                    {assignedToAnother ? (
                      <Box
                        sx={{
                          mb: 2,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "warning.50",
                          border: "1px solid",
                          borderColor: "warning.light",
                        }}
                      >
                        <Typography variant="body2" fontWeight={800}>
                          Atendimento em andamento
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selected.atendente_nome
                            ? `Esta conversa está com ${selected.atendente_nome}.`
                            : "Esta conversa já foi assumida por outro atendente."}{" "}
                          Você pode acompanhar o histórico, mas não responder.
                        </Typography>
                      </Box>
                    ) : null}

                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        minHeight: 0,
                        p: 2,
                        bgcolor: "#f8fafc",
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      {loadingMessages ? (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : messages.length === 0 ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          textAlign="center"
                          sx={{ py: 4 }}
                        >
                          Nenhuma mensagem carregada.
                        </Typography>
                      ) : (
                        <Stack spacing={1.5}>
                          {messages.map((message) => {
                            const isUser = message.role === "user";

                            return (
                              <Box
                                key={message.id}
                                sx={{
                                  alignSelf: isUser
                                    ? "flex-start"
                                    : "flex-end",
                                  maxWidth: "80%",
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: isUser ? "#fff" : "#0f172a",
                                  color: isUser ? "#0f172a" : "#fff",
                                  border: isUser
                                    ? "1px solid #e2e8f0"
                                    : "none",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ whiteSpace: "pre-wrap" }}
                                >
                                  {message.content}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                    </Box>

                    {selectedOwnedByMe ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          flexShrink: 0,
                          pt: 2,
                          borderTop: "1px solid #e2e8f0",
                          bgcolor: "white",
                        }}
                      >
                        <TextField
                          value={reply}
                          onChange={(event) => setReply(event.target.value)}
                          placeholder="Digite sua resposta..."
                          fullWidth
                          multiline
                          maxRows={4}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              !event.shiftKey
                            ) {
                              event.preventDefault();
                              sendReply();
                            }
                          }}
                        />

                        <Button
                          variant="contained"
                          onClick={sendReply}
                          disabled={sending}
                        >
                          {sending ? "Enviando..." : "Enviar"}
                        </Button>
                      </Stack>
                    ) : null}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
