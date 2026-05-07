import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api, { TOKEN_KEY } from "../api/api";

// ✅ AJUSTE 1: A Interface deve bater com o que o backend retorna
interface User {
  id: string; // Backend retorna UUID (String), não number
  nome: string;
  email: string;
  tipo: string;
  status: string;
  foto?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (status: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarStorage = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStorage = localStorage.getItem('@GranConecta:user'); // Recupera usuário salvo

      if (token && userStorage) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(JSON.parse(userStorage));
      }
      setIsLoading(false);
    };

    carregarStorage();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // ✅ AJUSTE 2: Enviar 'password' em vez de 'senha'
      const response = await api.post("/auth/login", {
        email: email,
        password: password
      });

      const { token, user: userResponse } = response.data;
      if (!token) {
        throw new Error("API não retornou um token.");
      }

      // Salva no Storage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('@GranConecta:user', JSON.stringify(userResponse)); // Salva os dados do usuário

      // Configura o Axios para as próximas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Atualiza o estado com os dados REAIS do backend
      setUser(userResponse);

    } catch (error) {
      throw error; // Repassa o erro para o formulário exibir
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('@GranConecta:user');
    api.defaults.headers.common['Authorization'] = undefined; // Limpa o header
    setUser(null);
  };

  const updateUser = (data: any) => {
    setUser((prev: any) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
};