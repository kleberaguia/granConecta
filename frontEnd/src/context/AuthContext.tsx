import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../api/api";

// --- INTERFACES ---
export interface Product {
  id: string;
  name: string;
  price: number | string;
  description: string;
  imageUrl?: string;
  storeId: string;
  usuarioId: string;
}

interface User {
  id?: string;
  nome: string;
  email: string;
  tipo: 'MORADOR' | 'PRESTADOR' | 'ADMIN' | 'EXTERNO';
  condominio_id: string;
  condominio_nome?: string;
  bloco?: string;
  apartamento?: string;
  complemento?: string;
  storeId?: string;
  status: string;
  telefone: string;
  descricao_bio: string;
  plano: string | '';
  is_empreendedor?: number | boolean;
  lojaId?: string;
  slug?: string;
  categoria?: string;
  categoria_tipo?: string;
  perfis?: any[];
  foto_perfil_url: string | null | ''
}

export type CartItem = {
  id: string;
  name: string;
  price: number | string;
  image?: string;
  quantity: number;
  storeId: string;
};

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  cart: Record<string, CartItem[]>;
  addToCart: (storeId: string, item: Product) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  removeFromCart: (storeId: string, productId: string) => void;
  updateCartQuantity: (storeId: string, productId: string, delta: number) => void;
  updateUser: (userData: any) => void;
  clearCart: (storeId?: string) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartItem[]>>({});
  const [_activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- KEY SEGURA (guest + user separado corretamente)
  const getCartKey = (userId?: string | null) =>
    `@App:cart:${userId || "guest"}`;

  // =========================
  // LOAD USER INIT
  // =========================
  useEffect(() => {
    const storagedUser = localStorage.getItem('@App:user');
    const storagedToken = localStorage.getItem('@App:token');

    if (storagedToken && storagedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`;
      setUser(JSON.parse(storagedUser));
      setToken(storagedToken);
    }

    setLoading(false);
  }, []);

  // =========================
  // LOAD CART (DEPENDE DO USER)
  // =========================
  useEffect(() => {
    const key = getCartKey(user?.id);

    const savedCart = localStorage.getItem(key);

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      setCart({});
    }
  }, [user]);

  // =========================
  // SAVE CART
  // =========================
  useEffect(() => {
    const key = getCartKey(user?.id);
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, user]);

  // =========================
  // UPDATE USER
  // =========================
  const updateUser = (userData: any) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('@App:user', JSON.stringify(updatedUser));
  };

  // =========================
  // LOGIN (MERGE SAFE)
  // =========================
  const login = (newToken: string, userData: User) => {
    localStorage.setItem('@App:token', newToken);
    localStorage.setItem('@App:user', JSON.stringify(userData));

    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    setUser(userData);
    setToken(newToken);

    const guestKey = getCartKey(null);
    const userKey = getCartKey(userData.id);

    const guestCart = localStorage.getItem(guestKey);

    if (guestCart) {
      const parsed = JSON.parse(guestCart);

      const existingUserCart =
        JSON.parse(localStorage.getItem(userKey) || "{}");

      const merged = { ...existingUserCart };

      Object.keys(parsed).forEach(storeId => {
        merged[storeId] = [
          ...(merged[storeId] || []),
          ...parsed[storeId]
        ];
      });

      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey);
      setCart(merged);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem('@App:token');
    localStorage.removeItem('@App:user');
    localStorage.clear();

    delete api.defaults.headers.common['Authorization'];

    setUser(null);
    setToken(null);
    setCart({});
    setActiveStoreId(null);
  };

  // =========================
  // ADD TO CART
  // =========================
  const addToCart = (storeId: string, item: Product) => {
    setCart(prev => {
      const storeCart = prev[storeId] || [];

      const existing = storeCart.find(p => p.id === item.id);

      const updatedStoreCart = existing
        ? storeCart.map(p =>
          p.id === item.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
        : [...storeCart, { ...item, quantity: 1 }];

      return {
        ...prev,
        [storeId]: updatedStoreCart
      };
    });

    setActiveStoreId(storeId);
  };

  // =========================
  // UPDATE QUANTITY
  // =========================
  const updateCartQuantity = (storeId: string, productId: string, delta: number) => {
    setCart(prev => {
      const storeCart = prev[storeId] || [];

      const updated = storeCart
        .map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter(item => item.quantity > 0);

      return {
        ...prev,
        [storeId]: updated
      };
    });
  };

  // =========================
  // REMOVE
  // =========================
  const removeFromCart = (storeId: string, productId: string) => {
    setCart(prev => {
      const storeCart = prev[storeId] || [];

      return {
        ...prev,
        [storeId]: storeCart.filter(p => p.id !== productId)
      };
    });
  };

  // =========================
  // CLEAR
  // =========================
  const clearCart = (storeId?: string) => {
    if (!storeId) {
      setCart({});
      return;
    }

    setCart(prev => ({
      ...prev,
      [storeId]: []
    }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      cart,
      login,
      logout,
      setUser,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      updateUser
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);