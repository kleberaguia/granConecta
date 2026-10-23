import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import chatApi from "../../api/chatApi";
import "./ChatWidget.css";
import "./ChatWidgetMenu.css";
import "./ChatWidget_DOT_cards_comerciais.css";
import "./ChatWidgetModern.css";

// 1. ATUALIZADO A INTERFACE PARA ACEITAR AS PROPS OBRIGATÓRIAS DO COMPONENTE PAI
type ChatWidgetProps = {
  open: boolean;
  onClose: () => void;
  onSolicitacaoDireta?: (payload: Record<string, any>) => void;
  onOpenBusinessChat?: (payload: Record<string, any>) => void;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  chatbotTipo?: "LOJA" | "PRESTADOR";
  userId?: string;
  userName?: string;
  userType?: string;
  condominioId?: string;
  opportunityId?: string;

  /**
   * Token público da oportunidade (?o=TOKEN).
   * Opcional porque também conseguimos recuperá-lo da URL atual.
   */
  opportunityToken?: string;

  /**
   * Incrementado pelo PageViewer somente depois que o marcador
   * granconecta_opportunity_resume_after_login foi gravado.
   * Serve para eliminar a corrida de effects na retomada pós-login.
   */
  opportunityResumeSignal?: number;
};

type BusinessCard = { id: string; name: string; tipo: "LOJA" | "PRESTADOR"; categoria?: string | null; descricao?: string | null; capaUrl?: string | null; logoUrl?: string | null; slug?: string | null; possuiLandingPublicada?: boolean; };

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  error?: boolean;
  cards?: BusinessCard[];
};

type ChatResponse = {
  success: boolean;
  message: string;
  conversationId?: string;
  conversationAccessToken?: string;
  responseId?: string;
  cards?: BusinessCard[];
  opportunityId?: string;
  opportunityToken?: string;
  action?: {
    type: string;
    payload?: any;
  };
  nextAction?: string;
  flowState?: string;
  commercialFlow?: {
    state?: string;
    nextAction?: string;
    message?: string;
  };
  lead?: {
    shouldCapture: boolean;
    interest?: string;
    status: "NOVO" | "QUALIFICANDO" | "INTERESSADO";
  };
};

type PublicMessagesResponse = {
  success: boolean;
  messages: Array<{
    id: string;
    role: "assistant" | "user" | "system";
    content: string;
    createdAt?: string;
  }>;
};

const BASE_CONVERSATION_KEY = "granconecta_chat_conversation_id";
const BASE_MESSAGES_KEY = "granconecta_chat_messages";
const OPPORTUNITY_RESUME_KEY = "granconecta_opportunity_resume_after_login";
const PAYMENT_RESUME_KEY = "granconecta_opportunity_resume_after_payment";
const VOICE_SETTINGS_KEY = "granconecta_dot_voice_preferences_v1";
type VoiceSettings = { input: boolean; output: boolean; configured: boolean };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};
function readVoiceSettings(): VoiceSettings {
  try {
    const value = JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY) || "null");
    if (value && typeof value.input === "boolean" && typeof value.output === "boolean")
      return { input: value.input, output: value.output, configured: true };
  } catch { /* configuração inválida */ }
  return { input: false, output: false, configured: false };
}


const suggestions = [
  "Como funciona o GranConecta?",
  "Encontrar um prestador",
  "Cadastrar meu negócio",
];

export default function ChatWidget({
  open,
  onClose,
  onSolicitacaoDireta,
  onOpenBusinessChat,
  storeId,
  storeName,
  storeSlug,
  chatbotTipo = "LOJA",
  userId,
  userName,
  userType,
  condominioId,
  opportunityId,
  opportunityToken,
  opportunityResumeSignal = 0,
}: ChatWidgetProps) {
  const navigate = useNavigate();

  // Informa ao Layout quando uma janela está aberta para ocultar o botão flutuante.
  // A HomePage monta o DOT antes do especialista; os effects seguem essa ordem.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("granconecta:chat-visibility", {
      detail: { open },
    }));
  }, [open]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const shouldFollowBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSessionRef = useRef(0);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(readVoiceSettings);
  const [voiceOptionsOpen, setVoiceOptionsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceSettingsRef = useRef(voiceSettings);
  voiceSettingsRef.current = voiceSettings;
  const spokenResponseRef = useRef("");
  const isVoiceSupported = typeof window !== "undefined" &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const isSpeechOutputSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  function saveVoiceSettings(input: boolean, output: boolean) {
    const next = { input, output, configured: true };
    setVoiceSettings(next);
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ input, output }));
    if (!input) stopListening();
    if (!output) stopSpeaking();
  }

  function stopListening() {
    speechSessionRef.current += 1;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.stop(); } catch { /* já finalizado */ }
    }
    setIsListening(false);
  }

  function stopSpeaking() {
    if (isSpeechOutputSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  function speakAnswer(text: string) {
    if (!voiceSettingsRef.current.output || !isSpeechOutputSupported || !text.trim()) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, "link disponível no chat"));
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    if (!voiceSettings.input || !isVoiceSupported || isSendingRef.current) return;
    stopSpeaking();
    stopListening();
    setVoiceError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition() as SpeechRecognitionLike;
    const session = ++speechSessionRef.current;
    recognitionRef.current = recognition;
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      if (session !== speechSessionRef.current) return;
      const transcript = Array.from(event.results).filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript || "").join(" ").trim();
      if (transcript) setMessage((current) => current.trim() ? `${current.trim()} ${transcript}` : transcript);
    };
    recognition.onerror = (event) => {
      if (session !== speechSessionRef.current) return;
      setVoiceError(event.error === "not-allowed" ? "Permissão do microfone negada. Autorize nas configurações do navegador." : "Não consegui reconhecer sua fala. Você pode digitar normalmente.");
    };
    recognition.onend = () => {
      if (session !== speechSessionRef.current) return;
      recognitionRef.current = null;
      setIsListening(false);
    };
    try { recognition.start(); setIsListening(true); }
    catch { recognitionRef.current = null; setIsListening(false); setVoiceError("Não foi possível iniciar o microfone."); }
  }

  useEffect(() => {
    if (!open) {
      stopListening();
      stopSpeaking();
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch { /* encerrado */ }
        recognitionRef.current = null;
      }
      if (isSpeechOutputSupported) window.speechSynthesis.cancel();
    };
  }, [open]);

  const renderedMessageIdsRef = useRef<Record<string, boolean>>({});
  const renderedMessageContentKeysRef = useRef<Record<string, boolean>>({});
  const isSendingRef = useRef(false);
  const bootstrappedOpportunityRef = useRef<string>("");
  const processingOpportunityActionRef = useRef(false);
  const currentOpportunityIdRef = useRef(opportunityId || "");

  const isGranConecta =
    !String(storeId || "").trim() ||
    String(storeName || "").trim().toUpperCase() === "GRANCONECTA";

  const baseContextKey = isGranConecta
    ? "GRANCONECTA"
    : String(storeId || storeName || "LOJA").trim();

  const effectiveOpportunityId = isGranConecta ? undefined : opportunityId;

  const contextKey =
    effectiveOpportunityId
      ? `${baseContextKey}_OPPORTUNITY_${effectiveOpportunityId}`
      : baseContextKey;

  // 2. TORNADO AS CHAVES DO STORAGE EXCLUSIVAS POR LOJA PARA EVITAR MISTURAR CONVERSAS
  /**
   * Para oportunidades, a conversa precisa permanecer a mesma antes e
   * depois do login. Se incluirmos userId na chave, o visitante troca de
   * storage ao autenticar e o chat pode parecer uma conversa nova.
   */
  const conversationStorageKey = effectiveOpportunityId
    ? `${BASE_CONVERSATION_KEY}_${contextKey}`
    : userId
      ? `${BASE_CONVERSATION_KEY}_${contextKey}_${userId}`
      : `${BASE_CONVERSATION_KEY}_${contextKey}_visitor`;

  const accessTokenStorageKey = `${conversationStorageKey}_access_token`;

  const messagesStorageKey = effectiveOpportunityId
    ? `${BASE_MESSAGES_KEY}_${contextKey}`
    : userId
      ? `${BASE_MESSAGES_KEY}_${contextKey}_${userId}`
      : `${BASE_MESSAGES_KEY}_${contextKey}_visitor`;

  const accessTokenRef = useRef(localStorage.getItem(accessTokenStorageKey) || "");

  const conversationIdRef = useRef(
    localStorage.getItem(conversationStorageKey) || "",
  );

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(
    () =>
      loadStoredMessages(
        messagesStorageKey,
        userName,
        storeName,
        Boolean(effectiveOpportunityId),
      ),
  );

  // A chave pertence ao snapshot de mensagens carregado. Quando userId,
  // loja ou oportunidade muda, não podemos persistir o estado antigo na
  // chave nova antes de restaurar seu histórico.
  const loadedMessagesKeyRef = useRef(messagesStorageKey);
  const skipNextMessagesPersistenceRef = useRef(false);
  const [loadedMessagesKey, setLoadedMessagesKey] = useState(messagesStorageKey);

  useEffect(() => {
    accessTokenRef.current = localStorage.getItem(accessTokenStorageKey) || "";
    conversationIdRef.current = localStorage.getItem(conversationStorageKey) || "";
    renderedMessageIdsRef.current = {};
    renderedMessageContentKeysRef.current = {};

    currentOpportunityIdRef.current = effectiveOpportunityId || "";
    const restored = loadStoredMessages(
      messagesStorageKey,
      userName,
      storeName,
      Boolean(effectiveOpportunityId),
    );
    loadedMessagesKeyRef.current = messagesStorageKey;
    setMessages(restored);
    setLoadedMessagesKey(messagesStorageKey);
  }, [
    conversationStorageKey,
    accessTokenStorageKey,
    messagesStorageKey,
    userName,
    storeName,
    effectiveOpportunityId,
  ]);

  useEffect(() => {
    // Não sobrescrever o histórico de outra identidade/contexto com um
    // snapshot do render anterior (React executa effects após o commit).
    if (loadedMessagesKey !== messagesStorageKey ||
      loadedMessagesKeyRef.current !== messagesStorageKey) return;
    if (skipNextMessagesPersistenceRef.current) {
      skipNextMessagesPersistenceRef.current = false;
      return;
    }

    // Preservar mensagens já gravadas de forma síncrona pelo retorno da API.
    // Uma renderização concorrente não pode substituí-las por estado antigo.
    let persisted: ChatMessage[] = [];
    try {
      const raw = localStorage.getItem(messagesStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) persisted = parsed;
    } catch { /* histórico local inválido */ }

    // A saudação local é apenas uma tela inicial, não parte do atendimento.
    // Quando houver mensagem real, não reintroduzi-la por um effect atrasado.
    const hasRealConversation = [...persisted, ...messages].some(
      (item) => item?.role === "user" ||
        (item?.role === "assistant" && !String(item.id || "").startsWith("welcome-")),
    );
    const merged = hasRealConversation
      ? persisted.filter((item) => !String(item?.id || "").startsWith("welcome-"))
      : [...persisted];
    for (const entry of messages) {
      if (hasRealConversation && String(entry?.id || "").startsWith("welcome-")) continue;
      const index = merged.findIndex((saved) => saved?.id === entry.id);
      if (index < 0) merged.push(entry);
      else if (entry.cards?.length && !merged[index]?.cards?.length) {
        merged[index] = { ...merged[index], cards: entry.cards };
      }
    }
    localStorage.setItem(messagesStorageKey, JSON.stringify(merged));
  }, [messages, messagesStorageKey, loadedMessagesKey]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container || !open) return;
    if (!shouldFollowBottomRef.current && !forceScrollRef.current) return;
    container.scrollTop = container.scrollHeight;
    forceScrollRef.current = false;
  }, [messages, isSending, open]);

  function handleMessagesScroll() {
    const container = messagesRef.current;
    if (!container) return;
    shouldFollowBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 90;
  }

  const addMessageOnce = useCallback((incoming: ChatMessage) => {
    if (!incoming?.id) return;

    const contentKey = getMessageContentKey(incoming);

    if (renderedMessageIdsRef.current[incoming.id]) return;
    if (contentKey && renderedMessageContentKeysRef.current[contentKey]) return;

    renderedMessageIdsRef.current[incoming.id] = true;
    if (contentKey) {
      renderedMessageContentKeysRef.current[contentKey] = true;
    }

    setMessages((current) => {
      const exists = current.some((item) => {
        if (item.id === incoming.id) return true;

        const currentContentKey = getMessageContentKey(item);
        return Boolean(contentKey && currentContentKey === contentKey);
      });

      if (exists) return current;

      return [...current, incoming];
    });
  }, []);

  const persistAssistantResponse = useCallback(
    (incoming: ChatMessage) => {
      if (!incoming?.id || !String(incoming.content || "").trim()) return;

      const contentKey = getMessageContentKey(incoming);

      /**
       * IMPORTANTE:
       * Persistimos primeiro no localStorage e só depois sincronizamos o
       * estado React.
       *
       * Na retomada pós-login o PageViewer/Contexto de autenticação ainda
       * pode causar uma nova renderização do ChatWidget. Se dependermos
       * apenas do callback assíncrono de setMessages(), uma renderização
       * concorrente pode recarregar o storage antigo e a resposta comercial
       * (principalmente CONFIRM_PURCHASE) "sumir" da tela.
       */
      let storedMessages: ChatMessage[] = [];

      try {
        const rawStored = localStorage.getItem(messagesStorageKey);
        const parsedStored = rawStored ? JSON.parse(rawStored) : [];

        if (Array.isArray(parsedStored)) {
          storedMessages = parsedStored;
        }
      } catch {
        storedMessages = [];
      }

      const alreadyStored = storedMessages.some((item) => {
        if (item?.id === incoming.id) return true;

        return Boolean(
          contentKey &&
          getMessageContentKey(item) === contentKey,
        );
      });

      const persistedMessages = alreadyStored
        ? storedMessages
        : [...storedMessages, incoming];

      /**
       * Esta gravação é síncrona. Assim a mensagem já está protegida antes
       * de qualquer useEffect disparado por userName/userId/storeName.
       */
      localStorage.setItem(
        messagesStorageKey,
        JSON.stringify(persistedMessages),
      );

      renderedMessageIdsRef.current[incoming.id] = true;

      if (contentKey) {
        renderedMessageContentKeysRef.current[contentKey] = true;
      }

      setMessages((current) => {
        const exists = current.some((item) => {
          if (item.id === incoming.id) return true;

          return Boolean(
            contentKey &&
            getMessageContentKey(item) === contentKey,
          );
        });

        if (exists) {
          // O texto pode já ter chegado via polling antes do payload com cards.
          // Mesclar os dados visuais, sem duplicar a mensagem.
          if (!incoming.cards?.length) return current;
          return current.map((item) =>
            item.id === incoming.id || getMessageContentKey(item) === contentKey
              ? { ...item, cards: incoming.cards }
              : item,
          );
        }

        return [...current, incoming];
      });
    },
    [messagesStorageKey],
  );

  const persistConversationAccess = useCallback((response: ChatResponse) => {
    const previousId = conversationIdRef.current;
    const nextId = response.conversationId || previousId;
    if (nextId !== previousId && !response.conversationAccessToken) {
      accessTokenRef.current = "";
      localStorage.removeItem(accessTokenStorageKey);
    }
    if (response.conversationAccessToken) {
      accessTokenRef.current = response.conversationAccessToken;
      localStorage.setItem(accessTokenStorageKey, response.conversationAccessToken);
    }
    if (response.conversationId) {
      conversationIdRef.current = response.conversationId;
      localStorage.setItem(conversationStorageKey, response.conversationId);
    }
  }, [accessTokenStorageKey, conversationStorageKey]);

  const syncMessages = useCallback(async (): Promise<boolean> => {
    const conversationId =
      conversationIdRef.current ||
      localStorage.getItem(conversationStorageKey) ||
      "";

    if (!conversationId) return false;

    // Sem credencial anônima, não consultamos históricos protegidos.
    // Um usuário autenticado continua autorizado pelo JWT da instância chatApi.
    if (!userId && !accessTokenRef.current) {
      // Não apagar a referência: a credencial pode ser restaurada após autenticação.
      return false;
    }

    try {
      const response = await chatApi.get<PublicMessagesResponse>(
        `/api/chat/messages/${encodeURIComponent(conversationId)}`,
        {
          headers: accessTokenRef.current
            ? { "X-Conversation-Token": accessTokenRef.current }
            : {}
        },
      );

      if (!response.data?.success || !Array.isArray(response.data.messages)) {
        return false;
      }
      // Ignorar resposta de uma conversa que foi trocada durante a requisição.
      if (conversationIdRef.current !== conversationId ||
        localStorage.getItem(conversationStorageKey) !== conversationId) {
        return false;
      }

      /**
       * O backend é a fonte oficial do histórico da conversa.
       * Substituímos o estado pelo histórico retornado para impedir que
       * deduplicações locais escondam a confirmação pós-login.
       */
      const synchronizedMessages: ChatMessage[] = response.data.messages
        .filter((item) => item.role !== "system")
        .map((item): ChatMessage => ({
          id: String(item.id),
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content || "").trim(),
          cards: undefined,
        }))
        .filter((item) => Boolean(item.id) && Boolean(item.content));

      const synchronizedIds: Record<string, boolean> = {};
      const synchronizedContentKeys: Record<string, boolean> = {};

      synchronizedMessages.forEach((item) => {
        synchronizedIds[item.id] = true;
        const contentKey = getMessageContentKey(item);
        if (contentKey) synchronizedContentKeys[contentKey] = true;
      });

      renderedMessageIdsRef.current = synchronizedIds;
      renderedMessageContentKeysRef.current = synchronizedContentKeys;

      // O endpoint de histórico ainda retorna apenas texto. Os cards são
      // metadados da resposta comercial: preservar a versão já recebida
      // em memória ou armazenada localmente ao sincronizar as mensagens.
      let storedWithCards: ChatMessage[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(messagesStorageKey) || "[]");
        if (Array.isArray(parsed)) storedWithCards = parsed;
      } catch { /* histórico local inválido não bloqueia o chat */ }

      // Um retorno vazio não deve apagar mensagens locais já apresentadas.
      // Pode ocorrer enquanto o backend ainda processa a última resposta.
      if (synchronizedMessages.length === 0 && storedWithCards.length > 0) {
        return false;
      }

      const merged = synchronizedMessages.map((entry) => {
        const previous = [...messages, ...storedWithCards].find((item) =>
          item?.cards?.length &&
          (item.id === entry.id || getMessageContentKey(item) === getMessageContentKey(entry)),
        );
        return previous ? { ...entry, cards: previous.cards } : entry;
      });
      // Preservar mensagens locais que ainda não chegaram ao endpoint de histórico.
      // Não substituir mensagens oficiais por versões locais.
      const officialIds = new Set(merged.map((entry) => entry.id));
      const officialContent = new Set(merged.map(getMessageContentKey));
      const pending = storedWithCards.filter((entry) =>
        entry?.id && !officialIds.has(entry.id) &&
        !officialContent.has(getMessageContentKey(entry)) &&
        /^(user-local|assistant|assistant-opportunity|error|welcome|solicitacao-indisponivel|business-selection-error|identify-customer-error)-/.test(entry.id)
      );
      const reconciled = [...merged, ...pending];
      localStorage.setItem(messagesStorageKey, JSON.stringify(reconciled));
      skipNextMessagesPersistenceRef.current = true;
      setMessages(reconciled);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 403) {
        // Token ausente, revogado ou associado a outra conversa.
        // Não insistir no polling e nunca usar a oportunidade como atalho
        // para ler o histórico privado de outra pessoa.
        // Manter ID, token e histórico locais para permitir recuperação.
        // Não repetir chamadas a cada 3s enquanto a credencial estiver inválida.
        console.warn("[CHATWIDGET] Histórico não autorizado; referência local preservada.");
        return false;
      }
      console.error("Erro ao sincronizar mensagens do chat:", error);
      return false;
    }
  }, [conversationStorageKey, accessTokenStorageKey, messagesStorageKey, userId]);

  useEffect(() => {
    if (!open) return;

    syncMessages();

    const interval = window.setInterval(syncMessages, 3000);

    return () => window.clearInterval(interval);
  }, [open, syncMessages]);

  /**
   * ============================================================
   * BOOTSTRAP AUTOMÁTICO DA OPORTUNIDADE
   * ============================================================
   *
   * Ao abrir o chat por /pagina/:slug?o=TOKEN, inicia a conversa
   * automaticamente com o contexto recebido da campanha.
   */
  useEffect(() => {
    if (
      !open ||
      !opportunityId ||
      isGranConecta
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        void bootstrapOpportunity();
      }, userId ? 300 : 120);

    return () =>
      window.clearTimeout(timer);
    // bootstrapOpportunity é intencionalmente acionado por mudança
    // de contexto/open; as refs internas evitam chamadas duplicadas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    opportunityId,
    isGranConecta,
    conversationStorageKey,

    /**
     * FUNDAMENTAL PARA A RETOMADA PÓS-LOGIN:
     *
     * Em oportunidades, conversationStorageKey não muda quando o visitante
     * passa a ser um usuário autenticado (isso é proposital para preservar a
     * mesma conversationId). Por isso, sem userId nas dependências, este
     * useEffect não executava novamente depois do login.
     *
     * O PageViewer grava granconecta_opportunity_resume_after_login após a
     * autenticação. Quando userId muda de undefined/null para o UUID real,
     * executamos novamente o bootstrap e o CommercialFlow consegue vincular
     * customerUserId e continuar para confirmação/pagamento.
     */
    userId,
    opportunityResumeSignal,
  ]);

  function resolveOpportunityToken(): string {
    const explicitToken =
      String(
        opportunityToken || "",
      ).trim();

    if (explicitToken) {
      return explicitToken;
    }

    try {
      const params =
        new URLSearchParams(
          window.location.search,
        );

      return String(
        params.get("o") || "",
      ).trim();
    } catch {
      return "";
    }
  }

  function buildOpportunityReturnPath(
    token: string,
  ): string {
    const resolvedSlug =
      String(
        storeSlug || "",
      ).trim();

    if (!resolvedSlug || !token) {
      return window.location.pathname +
        window.location.search;
    }

    return (
      `/pagina/${encodeURIComponent(resolvedSlug)}` +
      `?o=${encodeURIComponent(token)}` +
      `&continue=opportunity`
    );
  }

  async function waitForNavigationFeedback(
    milliseconds = 1200,
  ): Promise<void> {
    /*
     * Garante que a mensagem do assistente seja realmente pintada
     * na tela antes de trocar de rota.
     */
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
  }

  async function handleChatAction(
    action?: ChatResponse["action"],
  ) {
    if (!action?.type) {
      return;
    }

    if (action.type === "OPEN_BUSINESS_CHAT") {


      console.log("[DOT HANDOFF ORIGEM]", {
        storeId,
        storeName,
        chatbotTipo,
        callbackDisponivel: typeof onOpenBusinessChat,
      });

      console.log(
        "[DOT WIDGET] Ação de encaminhamento recebida:",
        action
      );

      console.log(
        "[DOT WIDGET] Callback disponível:",
        typeof onOpenBusinessChat
      );
      const payload = action.payload || {};
      if (!payload.storeId || !payload.opportunityId || !payload.opportunityToken) {
        addMessageOnce({
          id: createMessageId("business-selection-error"), role: "assistant",
          content: "Não consegui validar os dados do atendimento especializado. Selecione o profissional novamente.", error: true
        });
        return;
      }
      if (!onOpenBusinessChat) {
        addMessageOnce({
          id: createMessageId("business-selection-error"), role: "assistant",
          content: "O atendimento especializado não está disponível nesta tela.", error: true
        });
        return;
      }
      onOpenBusinessChat(payload);
      return;
    }

    if (action.type === "OPEN_PARTNER_REGISTRATION") {
      const payload = action.payload || {};
      const tipo = payload.tipo === "PRESTADOR" ? "PRESTADOR" : "MORADOR";
      const params = new URLSearchParams();
      params.set("tipo", tipo);
      params.set("empreendedor", payload.empreendedor === "1" ? "1" : "0");
      params.set("ramo", payload.ramo === "loja" ? "loja" : "servico");
      params.set("moraEmCondominio", tipo === "PRESTADOR" ? "0" : "1");
      for (const key of ["nome", "email", "telefone", "cep", "categoria"] as const) {
        const value = String(payload[key] || "").trim();
        if (value) params.set(key, value);
      }
      // Navegação interna: não envia dados para domínios de terceiros.
      await waitForNavigationFeedback(700);
      navigate(`/cadastro?${params.toString()}`);
      return;
    }

    if (action.type === "OPEN_SOLICITACAO_MODAL") {
      const payload = action.payload || {};
      if (!onSolicitacaoDireta) {
        addMessageOnce({
          id: createMessageId("solicitacao-indisponivel"), role: "assistant",
          content: "Não consegui abrir o formulário de solicitação nesta tela. Tente novamente pela página inicial.", error: true
        });
        return;
      }
      onSolicitacaoDireta(payload);
      return;
    }

    if (action.type === "SELECT_CAMPAIGN_BUSINESS") {
      const payload = action.payload || {};
      const slug = String(payload.storeSlug || "").trim();
      const token = String(payload.opportunityToken || "").trim();
      const candidateUrl = String(payload.url || "").trim();
      let target = "";

      // Só aceitamos rotas internas de páginas de negócios.
      if (candidateUrl) {
        try {
          const parsed = new URL(candidateUrl, window.location.origin);
          if (
            parsed.origin === window.location.origin &&
            /^\/pagina\/[^/]+\/?$/.test(parsed.pathname)
          ) {
            target = parsed.pathname + parsed.search;
          }
        } catch {
          // URL inválida: tentamos a rota derivada do slug.
        }
      }

      if (!target && slug) {
        target = `/pagina/${encodeURIComponent(slug)}` +
          (token ? `?o=${encodeURIComponent(token)}` : "");
      }

      if (target) {
        await waitForNavigationFeedback(700);
        navigate(target);
      } else {
        addMessageOnce({
          id: createMessageId("business-selection-error"),
          role: "assistant",
          content: "Este negócio ainda não possui uma página de atendimento disponível. Vou manter sua conversa; você pode pedir ao DOT outra forma de contato.",
          error: true,
        });
      }
      return;
    }

    if (action.type !== "IDENTIFY_OPPORTUNITY_CUSTOMER") {
      return;
    }

    if (
      processingOpportunityActionRef.current
    ) {
      return;
    }

    processingOpportunityActionRef.current =
      true;

    try {
      const payload =
        action.payload || {};

      const token =
        String(
          payload.opportunityToken ||
          resolveOpportunityToken() ||
          "",
        ).trim();

      const resolvedOpportunityId =
        String(
          payload.opportunityId ||
          currentOpportunityIdRef.current ||
          "",
        ).trim();

      const resolvedSlug =
        String(
          payload.storeSlug ||
          storeSlug ||
          "",
        ).trim();

      const resolvedName =
        String(
          payload.nome ||
          userName ||
          "",
        )
          .trim()
          .replace(/\s+/g, " ");

      const resolvedEmail =
        String(
          payload.email ||
          "",
        )
          .trim()
          .toLowerCase();

      const resolvedPhone =
        payload.telefone
          ? String(
            payload.telefone,
          ).trim()
          : "";

      if (
        !token ||
        !resolvedSlug ||
        !resolvedEmail
      ) {
        throw new Error(
          "Não foi possível continuar a identificação do cliente.",
        );
      }

      const response =
        await chatApi.post(
          `/api/marketing/opportunities/public/${encodeURIComponent(
            token,
          )}/identify-customer`,
          {
            slug:
              resolvedSlug,

            nome:
              resolvedName ||
              "Cliente GranConecta",

            email:
              resolvedEmail,

            telefone:
              resolvedPhone ||
              undefined,
          },
        );

      const result =
        response.data;

      if (!result?.success) {
        throw new Error(
          result?.message ||
          "Não foi possível verificar seu cadastro.",
        );
      }

      const returnPath =
        buildOpportunityReturnPath(
          token,
        );

      const contextToPersist = {
        opportunityId:
          result.opportunityId ||
          resolvedOpportunityId ||
          opportunityId ||
          null,

        token,

        storeSlug:
          resolvedSlug,

        storeId:
          payload.storeId ||
          storeId ||
          null,

        storeName:
          payload.storeName ||
          storeName ||
          null,

        nome:
          resolvedName ||
          result?.customer?.nome ||
          null,

        email:
          resolvedEmail,

        telefone:
          resolvedPhone ||
          result?.customer?.telefone ||
          null,

        returnPath,
      };

      localStorage.setItem(
        "granconecta_opportunity_customer_context",
        JSON.stringify(
          contextToPersist,
        ),
      );

      if (
        result.status ===
        "LOGIN_REQUIRED"
      ) {
        /*
         * Pequena pausa para o cliente conseguir ler:
         * "Agora vou verificar seu cadastro..."
         */
        await waitForNavigationFeedback(1200);

        const loginUrl =
          `/login/morador?email=${encodeURIComponent(
            result.email ||
            resolvedEmail,
          )}` +
          `&redirect=${encodeURIComponent(
            returnPath,
          )}`;

        console.log(
          "[CHATWIDGET OPPORTUNITY] E-mail já cadastrado; redirecionando para login",
        );

        navigate(
          loginUrl,
        );

        return;
      }

      if (
        result.status ===
        "REGISTRATION_REQUIRED"
      ) {
        await waitForNavigationFeedback(1200);

        const customer =
          result.customer || {};

        const registrationUrl =
          `/cadastro?email=${encodeURIComponent(
            customer.email ||
            resolvedEmail,
          )}` +
          `&nome=${encodeURIComponent(
            customer.nome ||
            resolvedName ||
            "",
          )}` +
          `&telefone=${encodeURIComponent(
            customer.telefone ||
            resolvedPhone ||
            "",
          )}` +
          `&redirect=${encodeURIComponent(
            returnPath,
          )}`;

        console.log(
          "[CHATWIDGET OPPORTUNITY] E-mail não cadastrado; redirecionando para cadastro",
        );

        navigate(
          registrationUrl,
        );

        return;
      }

      /**
       * Caso futuramente a rota já identifique um usuário autenticado,
       * basta voltar à oportunidade.
       */
      if (
        result.status ===
        "IDENTIFIED"
      ) {
        navigate(
          returnPath,
        );
      }
    } catch (error: any) {
      console.error(
        "[CHATWIDGET OPPORTUNITY] Falha ao identificar cliente",
        error?.response?.data ||
        error,
      );

      addMessageOnce({
        id:
          createMessageId(
            "identify-customer-error",
          ),
        role:
          "assistant",
        content:
          error?.response?.data?.message ||
          error?.message ||
          "Não consegui verificar seu cadastro agora. Tente novamente.",
        error:
          true,
      });
    } finally {
      processingOpportunityActionRef.current =
        false;
    }
  }

  async function bootstrapOpportunity() {
    const normalizedOpportunityId =
      String(opportunityId || "").trim();

    if (
      !normalizedOpportunityId ||
      isSendingRef.current
    ) {
      return;
    }

    const storedConversationId =
      conversationIdRef.current ||
      localStorage.getItem(
        conversationStorageKey,
      ) ||
      "";

    /**
     * ============================================================
     * RETOMADA PÓS-LOGIN
     * ============================================================
     *
     * O PageViewer grava esta chave depois de vincular o usuário
     * autenticado à oportunidade.
     *
     * Nesse cenário NÃO podemos simplesmente retornar porque já
     * existe conversationId. Precisamos chamar o backend novamente
     * com:
     *
     * - a MESMA conversationId;
     * - opportunityBootstrap = true;
     * - userId autenticado;
     * - opportunityId.
     *
     * Assim o GranConectaChatService retoma o CommercialFlow
     * exatamente do ponto AGUARDANDO_LOGIN.
     */
    let resumeAfterLogin = false;
    let resumeAfterPayment = false;

    console.log(
      "[CHATWIDGET OPPORTUNITY] Avaliando retomada",
      {
        opportunityId: normalizedOpportunityId,
        userId: userId || null,
        storedConversationId: storedConversationId || null,
        hasResumeMarker: Boolean(
          localStorage.getItem(OPPORTUNITY_RESUME_KEY),
        ),
        opportunityResumeSignal,
      },
    );

    try {
      const rawResume =
        localStorage.getItem(
          OPPORTUNITY_RESUME_KEY,
        );

      if (rawResume) {
        const parsedResume =
          JSON.parse(rawResume);

        const resumeOpportunityId =
          String(
            parsedResume?.opportunityId ||
            "",
          ).trim();

        const resumeUserId =
          String(
            parsedResume?.userId ||
            "",
          ).trim();

        const currentUserId =
          String(
            userId ||
            "",
          ).trim();

        resumeAfterLogin =
          resumeOpportunityId ===
          normalizedOpportunityId &&
          Boolean(currentUserId) &&
          (
            !resumeUserId ||
            resumeUserId === currentUserId
          );
      }
    } catch (error) {
      console.warn(
        "[CHATWIDGET OPPORTUNITY] Marcador de retomada inválido; removendo",
        error,
      );

      localStorage.removeItem(
        OPPORTUNITY_RESUME_KEY,
      );
    }

    try {
      const rawPaymentResume = localStorage.getItem(PAYMENT_RESUME_KEY);

      if (rawPaymentResume) {
        const parsedPaymentResume = JSON.parse(rawPaymentResume);
        resumeAfterPayment =
          String(parsedPaymentResume?.opportunityId || "").trim() ===
          normalizedOpportunityId;
      }
    } catch (error) {
      console.warn("[CHATWIDGET OPPORTUNITY] Marcador pós-pagamento inválido", error);
      localStorage.removeItem(PAYMENT_RESUME_KEY);
    }

    /**
     * Fluxo normal:
     * se já existe conversa e NÃO estamos voltando do login,
     * apenas sincronizamos as mensagens.
     */
    if (
      storedConversationId &&
      !resumeAfterLogin &&
      !resumeAfterPayment
    ) {
      const restored = await syncMessages();
      if (restored) return;
      // Referência local inválida: tentar bootstrap sem reutilizar o ID antigo.
      // A autorização da oportunidade continua sendo responsabilidade da API.
    }

    /**
     * A proteção normal por opportunityId continua valendo.
     * Na retomada pós-login, entretanto, permitimos um novo
     * bootstrap da MESMA oportunidade.
     */
    if (
      !resumeAfterLogin &&
      !resumeAfterPayment &&
      bootstrappedOpportunityRef.current ===
      normalizedOpportunityId
    ) {
      return;
    }

    bootstrappedOpportunityRef.current =
      normalizedOpportunityId;

    isSendingRef.current =
      true;

    setIsSending(
      true,
    );

    try {
      console.log(
        "[CHATWIDGET OPPORTUNITY] Executando bootstrap",
        {
          opportunityId:
            normalizedOpportunityId,

          conversationId:
            storedConversationId ||
            null,

          resumeAfterLogin,

          userId:
            userId ||
            null,
        },
      );

      const response =
        await chatApi.post<ChatResponse>(
          "/api/chat/messages",
          {
            /**
             * Mensagem técnica.
             *
             * O backend deve reconhecer opportunityBootstrap e não
             * persistir este conteúdo como fala real do cliente.
             */
            message:
              resumeAfterLogin
                ? "Retomar atendimento da oportunidade após login."
                : resumeAfterPayment
                  ? "Retomar atendimento da oportunidade após pagamento."
                  : "Continuar atendimento da oportunidade.",

            /**
             * FUNDAMENTAL:
             * na volta do login reutilizamos a conversa existente.
             */
            conversationId:
              conversationIdRef.current || undefined,
            conversationAccessToken: accessTokenRef.current || undefined,

            opportunityId:
              normalizedOpportunityId,

            opportunityBootstrap:
              true,

            /**
             * Na retomada pós-login este userId já é o usuário
             * autenticado e permite ao backend ligar o CommercialFlow
             * ao cliente correto.
             */
            userId,
            userName,
            userType,
            condominioId,

            storeId:
              isGranConecta
                ? undefined
                : storeId,

            lojaId:
              isGranConecta
                ? undefined
                : storeId,

            storeName:
              isGranConecta
                ? "GranConecta"
                : storeName,

            storeSlug:
              isGranConecta
                ? undefined
                : storeSlug ||
                undefined,

            chatbotTipo:
              isGranConecta
                ? "GRANCONECTA"
                : chatbotTipo,

            chatbotOwnerId:
              isGranConecta
                ? undefined
                : storeId,

            origem:
              isGranConecta
                ? "CHAT_HOME"
                : "LANDING_PAGE",
          },
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
          "Não foi possível iniciar a continuidade do atendimento.",
        );
      }

      persistConversationAccess(response.data);
      const returnedConversationId =
        response.data.conversationId;

      if (
        response.data.opportunityId
      ) {
        currentOpportunityIdRef.current =
          response.data.opportunityId;
      }

      if (
        returnedConversationId
      ) {
        conversationIdRef.current =
          returnedConversationId;

        localStorage.setItem(
          conversationStorageKey,
          returnedConversationId,
        );
      }

      const bootstrapMessage =
        String(
          response.data.message ||
          response.data.commercialFlow?.message ||
          "",
        ).trim();

      if (bootstrapMessage) {
        /**
         * Na retomada pós-login usamos sempre um ID local único.
         *
         * O responseId retornado pelo backend pode apontar para uma
         * mensagem já existente no histórico/persistência. Se usarmos esse
         * mesmo ID, a proteção de deduplicação pode concluir que a mensagem
         * já foi renderizada e impedir justamente a confirmação comercial.
         *
         * A deduplicação por conteúdo continua impedindo duplicatas reais.
         */
        persistAssistantResponse({
          id: createMessageId(
            resumeAfterLogin
              ? "assistant-opportunity-resume"
              : resumeAfterPayment
                ? "assistant-opportunity-payment-resume"
                : "assistant-opportunity",
          ),
          role: "assistant",
          content: bootstrapMessage,
          cards: response.data.cards,
        });
      }

      console.log(
        "[CHATWIDGET OPPORTUNITY] Resposta do bootstrap recebida",
        {
          opportunityId: normalizedOpportunityId,
          conversationId:
            returnedConversationId ||
            storedConversationId ||
            null,
          resumeAfterLogin,
          flowState:
            response.data.flowState ||
            response.data.commercialFlow?.state ||
            null,
          nextAction:
            response.data.nextAction ||
            response.data.commercialFlow?.nextAction ||
            response.data.action?.type ||
            null,
          hasMessage: Boolean(bootstrapMessage),
          message: bootstrapMessage || null,
        },
      );

      await handleChatAction(
        response.data.action,
      );

      /**
       * A sincronização é aditiva, portanto pode ser executada também no
       * pós-login. Além de reconciliar o histórico, ela funciona como uma
       * segunda garantia caso o backend já tenha persistido a mensagem de
       * confirmação comercial.
       */
      await syncMessages();

      /**
       * Só removemos o marcador DEPOIS que o backend respondeu
       * com sucesso.
       *
       * Se houver erro de rede/backend, ele permanece e a retomada
       * poderá ser tentada novamente.
       */
      if (
        resumeAfterLogin
      ) {
        localStorage.removeItem(
          OPPORTUNITY_RESUME_KEY,
        );

        console.log(
          "[CHATWIDGET OPPORTUNITY] Retomada pós-login concluída",
          {
            opportunityId:
              normalizedOpportunityId,

            conversationId:
              returnedConversationId ||
              storedConversationId ||
              null,
          },
        );
      }

      if (resumeAfterPayment) {
        localStorage.removeItem(PAYMENT_RESUME_KEY);
        console.log(
          "[CHATWIDGET OPPORTUNITY] Retomada pós-pagamento concluída",
          {
            opportunityId: normalizedOpportunityId,
            conversationId:
              returnedConversationId || storedConversationId || null,
            flowState:
              response.data.flowState ||
              response.data.commercialFlow?.state ||
              null,
          },
        );
      }
    } catch (error: any) {
      console.error(
        "[CHATWIDGET OPPORTUNITY] Falha no bootstrap",
        error?.response?.data ||
        error,
      );

      /**
       * Libera nova tentativa.
       *
       * O marcador de pós-login NÃO é removido aqui.
       */
      bootstrappedOpportunityRef.current =
        "";
    } finally {
      isSendingRef.current =
        false;

      setIsSending(
        false,
      );
    }
  }

  async function sendMessage(content: string) {
    const normalizedMessage = content.trim();

    if (!normalizedMessage || isSendingRef.current) return;

    stopListening();
    stopSpeaking();
    shouldFollowBottomRef.current = true;
    forceScrollRef.current = true;
    isSendingRef.current = true;

    const userMessage: ChatMessage = {
      id: createMessageId("user-local"),
      role: "user",
      content: normalizedMessage,
    };

    // Ao iniciar o atendimento real, retirar a apresentação provisória.
    // Assim ela não reaparece após o polling nem fica no fim da conversa.
    setMessages((current) => current.filter(
      (item) => !String(item.id).startsWith("welcome-"),
    ));
    try {
      const stored = JSON.parse(localStorage.getItem(messagesStorageKey) || "[]");
      if (Array.isArray(stored)) {
        localStorage.setItem(messagesStorageKey, JSON.stringify(
          stored.filter((item) => !String(item?.id || "").startsWith("welcome-")),
        ));
      }
    } catch { /* O histórico oficial será sincronizado normalmente. */ }
    addMessageOnce(userMessage);

    setMessage("");
    setIsSending(true);

    try {
      const storedConversationId =
        conversationIdRef.current ||
        localStorage.getItem(conversationStorageKey) ||
        "";

      const response = await chatApi.post<ChatResponse>("/api/chat/messages", {
        message: normalizedMessage,
        conversationId: storedConversationId || undefined,
        conversationAccessToken: accessTokenRef.current || undefined,
        userId,
        userName,
        userType,
        condominioId,
        opportunityId: isGranConecta
          ? undefined
          : currentOpportunityIdRef.current || effectiveOpportunityId || undefined,

        storeId: isGranConecta ? undefined : storeId,
        lojaId: isGranConecta ? undefined : storeId,
        storeName: isGranConecta ? "GranConecta" : storeName,
        storeSlug:
          isGranConecta
            ? undefined
            : storeSlug || undefined,

        chatbotTipo: isGranConecta
          ? "GRANCONECTA"
          : chatbotTipo,

        chatbotOwnerId: isGranConecta
          ? undefined
          : storeId,

        origem: isGranConecta
          ? "CHAT_HOME"
          : "LANDING_PAGE",
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          "O atendimento não retornou uma resposta.",
        );
      }

      persistConversationAccess(response.data);
      const returnedConversationId = response.data.conversationId;

      if (!isGranConecta && response.data.opportunityId) {
        currentOpportunityIdRef.current =
          response.data.opportunityId;
      }

      if (returnedConversationId) {
        conversationIdRef.current = returnedConversationId;

        localStorage.setItem(
          conversationStorageKey,
          returnedConversationId,
        );
      }

      if (response.data.message) {
        persistAssistantResponse({
          id: response.data.responseId || createMessageId("assistant"),
          role: "assistant",
          content: response.data.message,
          cards: response.data.cards,
        });
        speakAnswer(response.data.message);
      }

      await handleChatAction(
        response.data.action,
      );

      await syncMessages();
    } catch (error: any) {
      console.error("Erro completo do ChatWidget:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        baseURL: error?.config?.baseURL,
        url: error?.config?.url,
      });

      addMessageOnce({
        id: createMessageId("error"),
        role: "assistant",
        content:
          error?.response?.data?.message ||
          error?.message ||
          "Não consegui responder agora. Tente novamente.",
        error: true,
      });
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(message);
  }

  function handleCloseChat() {
    // Fechar a janela não encerra a conversa nem apaga o contexto comercial.
    // O botão "+" permanece responsável por iniciar uma nova conversa.
    setMessage("");
    stopListening();
    stopSpeaking();
    onClose();
  }

  function startNewConversation() {
    stopListening();
    stopSpeaking();
    conversationIdRef.current = "";
    accessTokenRef.current = "";
    renderedMessageIdsRef.current = {};
    renderedMessageContentKeysRef.current = {};
    bootstrappedOpportunityRef.current = "";

    localStorage.removeItem(conversationStorageKey);
    localStorage.removeItem(accessTokenStorageKey);
    accessTokenRef.current = "";

    /*
     * Se existe opportunityId, não criamos uma saudação local.
     * Limpamos as mensagens e deixamos o useEffect disparar novamente
     * o bootstrap real no backend.
     */
    if (opportunityId) {
      localStorage.removeItem(messagesStorageKey);
      setMessage("");
      setMessages([]);
      return;
    }

    const welcomeMessage =
      createWelcomeMessage(
        userName,
        storeName,
        false,
      );

    localStorage.setItem(
      messagesStorageKey,
      JSON.stringify([welcomeMessage]),
    );

    setMessage("");
    setMessages([welcomeMessage]);
  }

  return (
    <div
      className={`chat-widget ${open ? 'gc-chatbot-open' : ''}`}
      data-user-id={userId || ""}
      data-user-type={userType || ""}
      data-store-id={storeId}
    >
      {/* 3. MUDADO DE "isOpen" PARA "open" PARA OBEDECER AO ESTADO PASSADO PELO PAI */}
      {open && (
        <section
          className="chat-widget__window"
          aria-label={`Atendimento ${storeName}`}
        >
          <header className="chat-widget__header">
            <div className="chat-widget__identity">
              <div className="chat-widget__avatar" aria-hidden="true">
                <span aria-hidden="true">✦</span>
              </div>

              <div className="chat-widget__heading">
                <strong className="chat-widget__title">
                  {isGranConecta ? "DOT · GranConecta" : `Assistente de ${storeName}`}
                </strong>

                <span className="chat-widget__status">
                  <span
                    className="chat-widget__status-dot"
                    aria-hidden="true"
                  />
                  Atendimento online
                </span>
              </div>
            </div>

            <div className="chat-widget__header-actions">
              <button type="button" className="chat-widget__new-chat" onClick={() => setVoiceOptionsOpen((current) => !current)}
                title="Preferências de voz" aria-label="Configurar voz do atendimento">♫</button>
              {isSpeaking && <button type="button" className="chat-widget__new-chat" onClick={stopSpeaking}
                aria-label="Parar resposta falada" title="Parar áudio">■</button>}
              <button
                type="button"
                className="chat-widget__new-chat"
                onClick={startNewConversation}
                title="Nova conversa"
                aria-label="Iniciar nova conversa"
              >
                +
              </button>

              <button
                type="button"
                className="chat-widget__close"
                onClick={handleCloseChat}
                aria-label="Fechar atendimento"
                title="Fechar"
              >
                x
              </button>
            </div>
          </header>

          {voiceOptionsOpen && (
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #ddd", fontSize: 13 }}>
              <strong>Preferências de voz do atendimento</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                <label><input type="checkbox" checked={voiceSettings.input} disabled={!isVoiceSupported}
                  onChange={(e) => saveVoiceSettings(e.target.checked, voiceSettings.output)} /> Usar microfone</label>
                <label><input type="checkbox" checked={voiceSettings.output} disabled={!isSpeechOutputSupported}
                  onChange={(e) => saveVoiceSettings(voiceSettings.input, e.target.checked)} /> Ouvir respostas</label>
                <button type="button" onClick={() => { saveVoiceSettings(voiceSettings.input, voiceSettings.output); setVoiceOptionsOpen(false); }}>Continuar</button>
              </div>
              {!isVoiceSupported && <small>Reconhecimento de voz indisponível neste navegador. O chat por texto continua funcionando.</small>}
            </div>
          )}
          <div
            ref={messagesRef}
            className="chat-widget__messages"
            onScroll={handleMessagesScroll}
            aria-live="polite"
          >
            {!isGranConecta && Boolean(opportunityId) && (
              <div className="chat-widget__message chat-widget__message--assistant">
                <span className="gc-message-avatar gc-message-avatar--assistant" aria-label={`Assistente de ${storeName}`}>
                  <span className="gc-bot-mark" aria-hidden="true">✦</span>
                </span>
                <div className="gc-message-content">
                  <span className="gc-message-author">Assistente de {storeName}</span>
                  <div className="gc-message-bubble">
                    Olá! Seja bem-vindo ao atendimento de <strong>{storeName}</strong>.
                    Sou o assistente virtual deste negócio. O DOT GranConecta
                    encaminhou sua solicitação e vou continuar o atendimento por aqui.
                  </div>
                </div>
              </div>
            )}
            {messages.map((item) => (
              <div
                key={item.id}
                className={[
                  "chat-widget__message",
                  `chat-widget__message--${item.role}`,
                  item.error ? "chat-widget__message--error" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className={`gc-message-avatar gc-message-avatar--${item.role}`} aria-label={item.role === "assistant" ? (isGranConecta ? "Assistente GranConecta" : `Assistente de ${storeName}`) : "Cliente"}>
                  {item.role === "assistant" ? <span className="gc-bot-mark" aria-hidden="true">✦</span> : <span aria-hidden="true">{getCustomerInitials(userName)}</span>}
                </span>
                <div className="gc-message-content">
                  <span className="gc-message-author">{item.role === "assistant" ? (isGranConecta ? "DOT · GranConecta" : storeName) : (userName || "Visitante")}</span>
                  <div className="gc-message-bubble">
                    <MessageContent content={item.content} formatted={item.role === "assistant" && !item.error} />
                  </div>
                  {item.role === "assistant" && !userId && /para continuar com segurança, entre na sua conta ou cadastre-se/i.test(item.content) && (
                    <div className="gc-auth-actions" aria-label="Continuar atendimento">
                      <button type="button" onClick={() => navigate(`/login/morador?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>Entrar na minha conta</button>
                      <button type="button" onClick={() => navigate(`/cadastro?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>Criar cadastro</button>
                    </div>
                  )}
                  {item.role === "assistant" && item.cards?.length ? (
                    <div className="gc-business-grid">
                      {item.cards.map((card, index) => (
                        <article className="gc-business-card" key={card.id}>
                          <BusinessCover card={card} />
                          <div className="gc-business-card__body">
                            <span className="gc-business-card__kind">{card.tipo === "LOJA" ? "Loja" : "Profissional"} · {card.categoria || "GranConecta"}</span>
                            <strong>{card.name}</strong>
                            {card.descricao ? <p>{card.descricao}</p> : null}
                            <button type="button" disabled={isSending}
                              onClick={() => void sendMessage(String(index + 1))}>
                              {card.tipo === "LOJA" ? "Conhecer loja" : "Solicitar atendimento"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="chat-widget__message chat-widget__message--assistant chat-widget__typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="chat-widget__suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="chat-widget__suggestion"
                  disabled={isSending}
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {voiceError && <div role="status" style={{ padding: "4px 12px", fontSize: 12 }}>{voiceError}</div>}
          <form className="chat-widget__form" onSubmit={handleSubmit}>
            <input
              className="chat-widget__input"
              value={message}
              disabled={isSending}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Digite sua dúvida..."
              aria-label="Mensagem"
              autoComplete="off"
            />

            {voiceSettings.input && isVoiceSupported && (
              <button type="button" className="chat-widget__send" disabled={isSending}
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? "Parar microfone" : "Falar com o DOT"}
                title={isListening ? "Parar gravação" : "Falar"}>{isListening ? "Parar" : "🎙"}</button>
            )}
            <button
              type="submit"
              className="chat-widget__send"
              disabled={!message.trim() || isSending}
              aria-label="Enviar mensagem"
              title="Enviar"
            >
              Enviar
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function createWelcomeMessage(
  userName?: string,
  storeName?: string,
  hasOpportunity = false,
): ChatMessage {
  const normalizedStoreName = String(storeName || "").trim();

  const isGranConecta =
    !normalizedStoreName ||
    normalizedStoreName.toUpperCase() === "GRANCONECTA";

  const greeting =
    `Olá${userName ? `, ${userName}` : ""}! 👋 Eu sou o Conecta.`;

  if (isGranConecta) {
    return {
      id: createMessageId("welcome"),
      role: "assistant",
      content:
        `${greeting} Sou o assistente virtual do GranConecta e estou aqui para ajudar você a encontrar o que procura e escolher a opção que fizer mais sentido. ` +
        "Posso tirar dúvidas, ajudar a encontrar profissionais, serviços e negócios e acompanhar você nos próximos passos por aqui. " +
        "Se em algum momento preferir falar com uma pessoa, também posso encaminhar seu atendimento. " +
        "O que você está procurando hoje?",
    };
  }

  if (hasOpportunity) {
    return {
      id: createMessageId("welcome"),
      role: "assistant",
      content:
        `${greeting} Agora estou te atendendo pelo ${normalizedStoreName}. ` +
        "Já recebi o contexto do seu atendimento no GranConecta, então você não precisa repetir o que já informou. " +
        "Vou continuar daqui e ajudar você no próximo passo. Se preferir falar com uma pessoa, também posso encaminhar seu atendimento.",
    };
  }

  return {
    id: createMessageId("welcome"),
    role: "assistant",
    content:
      `${greeting} Sou o assistente virtual do ${normalizedStoreName}. ` +
      "Posso ajudar você a conhecer as opções disponíveis, tirar dúvidas e escolher o que fizer mais sentido para o que você procura. " +
      "Quando o atendimento permitir, também posso ajudar com contratação, pagamento e agendamento por aqui. " +
      "E, se preferir falar com uma pessoa, posso encaminhar seu atendimento. " +
      "Me conta: o que você está procurando?",
  };
}

function getMessageContentKey(message: Pick<ChatMessage, "role" | "content">): string {
  const role = message.role === "user" ? "user" : "assistant";
  const content = String(message.content || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  return content ? `${role}:${content}` : "";
}

function loadStoredMessages(
  storageKey: string,
  userName?: string,
  storeName?: string,
  hasOpportunity = false,
): ChatMessage[] {
  try {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : null;

    if (Array.isArray(parsed) && parsed.length > 0) {
      const hasRealConversation = parsed.some((item) =>
        item?.role === "user" ||
        (item?.role === "assistant" && !String(item?.id || "").startsWith("welcome-")),
      );
      return hasRealConversation
        ? parsed.filter((item) => !String(item?.id || "").startsWith("welcome-"))
        : parsed;
    }
  } catch {
    localStorage.removeItem(storageKey);
  }

  /*
   * Em oportunidades comerciais, a saudação inicial é responsabilidade
   * exclusiva do backend. Assim evitamos que o frontend use userName
   * incorreto/antigo e gere uma abertura duplicada.
   */
  if (hasOpportunity) {
    return [];
  }

  return [
    createWelcomeMessage(
      userName,
      storeName,
      false,
    ),
  ];
}

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function InlineContent({ content }: { content: string }) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return (
    <>
      {content.split(urlPattern).map((part, index) => {
        if (!/^https?:\/\//i.test(part)) {
          return part.split(/(\*\*[^*]+\*\*)/g).map((piece, pieceIndex) =>
            /^\*\*[^*]+\*\*$/.test(piece)
              ? <strong key={`${index}-${pieceIndex}`}>{piece.slice(2, -2)}</strong>
              : piece,
          );
        }
        const cleanUrl = part.replace(/[.,;!?]+$/g, "");
        const trailingText = part.slice(cleanUrl.length);
        return (
          <span key={`${part}-${index}`}>
            <a href={cleanUrl} target="_blank" rel="noopener noreferrer"
              className="chat-widget__message-link">Ver página</a>
            {trailingText}
          </span>
        );
      })}
    </>
  );
}

/**
 * Transforma descrições de catálogo em texto corrido em itens separados.
 * Mantém o texto original e só ativa quando encontra ao menos dois preços
 * associados a serviços/produtos. Não interfere em respostas comuns.
 */
function normalizeInlineCatalog(content: string): string {
  if ((content.match(/R\$\s*\d[\d.,]*/gi) || []).length < 2) return content;

  const marker = /(?:avaliação|pacote|sessão|consulta|produto|serviço|plano|promoção)\b/gi;
  const matches = Array.from(content.matchAll(marker));
  if (matches.length < 2) return content;

  // A descrição precisa conter preços entre os marcadores. Assim não
  // dividimos textos comuns que apenas mencionam vários serviços.
  const starts: number[] = [];
  for (const match of matches) {
    const start = match.index ?? 0;
    const after = content.slice(start);
    const price = after.match(/R\$\s*\d[\d.,]*/i);
    if (!price || price.index === undefined) continue;
    const priceEnd = start + price.index + price[0].length;
    const nextMarker = matches.find((m) => (m.index ?? 0) > start);
    if (nextMarker && (nextMarker.index ?? 0) < priceEnd) continue;
    starts.push(start);
  }
  if (starts.length < 2) return content;

  const first = starts[0];
  const intro = content.slice(0, first).replace(/(?:\s*[-–:]\s*|\s*,?\s*e\s+o?\s*)$/i, "").trim();
  const items: string[] = [];
  let tail = "";

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = starts[i + 1] ?? content.length;
    const chunk = content.slice(start, end);
    const price = chunk.match(/R\$\s*\d[\d.,]*/i);
    if (!price || price.index === undefined) return content;
    const priceEnd = price.index + price[0].length;
    let body = chunk.slice(0, priceEnd).replace(/[,;\s]+$/g, "").trim();
    body = body.replace(/(?:\s*,?\s*e\s+o?\s*)$/i, "");
    items.push(`${i + 1}. ${body}`);
    const remainder = chunk.slice(priceEnd);
    if (i === starts.length - 1) tail = remainder.replace(/^[\s.,;:]+/, "").trim();
  }

  return [intro, ...items, tail].filter(Boolean).join("\n");
}

function MessageContent({ content, formatted = false }: { content: string; formatted?: boolean }) {
  if (!formatted) return <InlineContent content={content} />;

  const lines = normalizeInlineCatalog(content).replace(/\r\n/g, "\n").split("\n");
  const isItem = (line: string) => /^\s*(?:\d{1,2}[.)]|[-•*])\s+/.test(line);
  const itemMatch = (line: string) => line.match(/^\s*(?:(\d{1,2})[.)]|[-•*])\s+(.+)$/);
  const blocks: Array<{ kind: "text" | "list" | "heading"; lines: string[] }> = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const heading = /^#{1,3}\s+/.test(line);
    const kind = heading ? "heading" : isItem(line) ? "list" : "text";
    const last = blocks[blocks.length - 1];
    if (last && last.kind === kind && kind === "list") last.lines.push(line);
    else blocks.push({ kind, lines: [line] });
  }

  return (
    <div className="gc-rich-message">
      {blocks.map((block, blockIndex) => {
        if (block.kind === "heading") {
          return <div className="gc-rich-heading" key={blockIndex}>
            <InlineContent content={block.lines[0].replace(/^#{1,3}\s+/, "")} />
          </div>;
        }
        if (block.kind === "list") {
          return <div className="gc-rich-options" key={blockIndex}>
            {block.lines.map((line, itemIndex) => {
              const match = itemMatch(line);
              const number = match?.[1] || String(itemIndex + 1);
              const body = match?.[2] || line;
              const titleSplit = body.match(/^([^:]{3,70}):\s*(.+)$/);
              return (
                <div className="gc-rich-option" key={itemIndex}>
                  <span className="gc-rich-option-number">{number}</span>
                  <div className="gc-rich-option-body">
                    {titleSplit ? <>
                      <strong className="gc-rich-option-title"><InlineContent content={titleSplit[1]} /></strong>
                      <div><InlineContent content={titleSplit[2]} /></div>
                    </> : <InlineContent content={body} />}
                  </div>
                </div>
              );
            })}
          </div>;
        }
        return <p className="gc-rich-paragraph" key={blockIndex}>
          <InlineContent content={block.lines[0]} />
        </p>;
      })}
    </div>
  );
}

function BusinessCover({ card }: { card: BusinessCard }) {
  const [failed, setFailed] = useState(false);
  const source = String(card.capaUrl || card.logoUrl || "").trim();
  const safeSource = /^https:\/\//i.test(source) || /^\/[^/]/.test(source) ? source : "";
  useEffect(() => setFailed(false), [source]);
  return <div className={`gc-business-cover gc-business-cover--${card.tipo.toLowerCase()}`}>
    {safeSource && !failed
      ? <img src={safeSource} alt={`Capa de ${card.name}`} loading="lazy" onError={() => setFailed(true)} />
      : <span aria-hidden="true">{card.tipo === "LOJA" ? "🛍️" : "🛠️"}</span>}
  </div>;
}

function getCustomerInitials(name?: string): string {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "👤";
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
}
