import React, { useState, useRef, useEffect } from 'react';

// 1. Definição dos Tipos (Interfaces)
interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatResponse {
  reply: string;
}

const ChatWidget: React.FC = () => {
  // --- ESTADOS COM TIPAGEM ---
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Olá! Sou o assistente virtual da Paróquia. Posso ajudar com horários, avisos ou dúvidas sobre a fé.'
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Referência para o scroll (HTMLDivElement)
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- CONFIGURAÇÃO DA API ---
  // ATENÇÃO: Substitua pelo seu URL do Ngrok atual
  const API_URL = "http://127.0.0.1:5000/chat";

  // Efeito para scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- LÓGICA DE ENVIO ---
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Adiciona mensagem do utilizador
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history: messages // <--- O Segredo está aqui!
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na rede');
      }

      const data: ChatResponse = await response.json();

      // Adiciona resposta do Bot
      const botMessage: Message = { sender: 'bot', text: data.reply };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Erro:", error);
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: 'Desculpe, estou sem ligação ao servidor da paróquia de momento.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tipagem do evento de teclado
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div style={styles.wrapper}>

      {/* JANELA DO CHAT */}
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Cabeçalho */}
          <div style={styles.header}>
            <span>⛪ Assistente Paroquial</span>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>✖</button>
          </div>

          {/* Área de Mensagens */}
          <div style={styles.messagesArea}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                ...styles.messageBubble,
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? '#e1f5fe' : '#f1f1f1',
              }}>
                {/* Tratamento de quebras de linha */}
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            ))}

            {isLoading && (
              <div style={{ ...styles.messageBubble, alignSelf: 'flex-start', fontStyle: 'italic', color: '#888' }}>
                A consultar documentos...
              </div>
            )}

            {/* Elemento invisível para scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input */}
          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress} // React usa onKeyDown preferencialmente
              placeholder="Digite a sua dúvida..."
              disabled={isLoading}
            />
            <button onClick={sendMessage} style={styles.sendBtn} disabled={isLoading}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={styles.fab}>
          💬 Dúvidas?
        </button>
      )}
    </div>
  );
};

// --- ESTILOS (CSS-in-JS com tipagem CSSProperties) ---
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    fontFamily: 'Segoe UI, sans-serif',
  },
  fab: {
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    padding: '15px 25px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s',
  },
  chatWindow: {
    width: '350px',
    height: '500px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#004aad',
    color: 'white',
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
  },
  messagesArea: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '10px 15px',
    borderRadius: '15px',
    fontSize: '14px',
    lineHeight: '1.4',
    wordWrap: 'break-word',
  },
  inputArea: {
    padding: '10px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    outline: 'none',
  },
  sendBtn: {
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default ChatWidget;