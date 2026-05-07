import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Settings,
  Lock
} from "lucide-react";
import { Box } from "@mui/material";

import style from "./Layout.module.css";
import api, { API_URL } from "../../api/api";
import ChatWidget from "../ChatWidget/ChatWidget";
import { useAuth } from "../../context/AuthContext";
import { BadgeVizinho } from "../BadgeVizinho/BadgeVizinho";
import { onNaoVistosChanged } from "../../utils/naoVistosBus";
import toast from "react-hot-toast";

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [_openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();

  const u = user as any;

  // ✅ Badge de não vistos
  const [naoVistosTotal, setNaoVistosTotal] = useState<number>(0);

  const fetchNaoVistosTotal = async () => {
    if (!isAuthenticated) {
      setNaoVistosTotal(0);
      return;
    }
    try {
      const { data } = await api.get("/home/contador-nao-vistos");
      setNaoVistosTotal(Number(data?.total ?? 0));
    } catch { /* silencioso */ }
  };

  // --- LÓGICA DE PERMISSÕES UNIFICADA ---
  const isAdmin = u?.tipo === "ADMIN";
  const ehMoradorVinculado = !!(u?.is_interno || u?.condominio_id || u?.condominio_nome);
  const ehPrestador = !!(u?.tipo === "PRESTADOR" || u?.is_prestador);

  // ✅ CAPTURA O STATUS DO USUÁRIO OU DO PERFIL
  const statusConta = (u?.status_conta || u?.status || "").toUpperCase();
  const perfis = u?.perfis || [];
  const temPerfilAprovado = perfis.some((p: any) =>
    (p.status || "").toUpperCase() === "APROVADO" ||
    (p.status_aprovacao || "").toUpperCase() === "APROVADO"
  );

  // ✅ TRAVA DE APROVAÇÃO: Se qualquer um estiver aprovado ou ativo, o cadeado some.
  const isAprovadoGeral = statusConta === "APROVADO" || temPerfilAprovado || u?.ativo === true || u?.ativo === 1;
  const isBloqueado = u?.ativo === 0 || u?.ativo === false;

  const isInterno = u?.is_interno === 1 || !!u?.condominio_id || !!u?.condominio_nome;
  const tipoParaBadge = isInterno ? "MORADOR" : "EXTERNO";

  const podeGerenciarNegocio = (u?.is_empreendedor === 1 || u?.is_empreendedor === true) && !isBloqueado;
  const fotoUrl = u?.perfil?.foto_perfil_url || u?.foto_perfil_url || '';

  const closeMenu = () => {
    setIsMenuOpen(false);
    setOpenSubmenu(null);
  };

  const handleNavigation = (path: string) => {
    closeMenu();
    setTimeout(() => { navigate(path); }, 50);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate("/");
  };

  useEffect(() => {
    fetchNaoVistosTotal();
    const off = onNaoVistosChanged(() => fetchNaoVistosTotal());
    return off;
  }, [isAuthenticated]);

  useEffect(() => {
    const refreshUserStatus = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const res = await api.get(`/users/${user.id}`);
          if (res.data) updateUser(res.data);
        } catch (e) { console.error("Erro ao sincronizar dados"); }
      }
    };
    refreshUserStatus();
  }, [location.pathname]);

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoadingMenu(true);
      try {
        const response = await api.get("/menu");
        let baseMenu = Array.isArray(response.data) ? response.data : [];
        const itemMarketplace = { name: "🛍️ Lojas", path: "/marketplace" };
        const itemPrestadores = { name: "🛍️ Prestadores", path: "/" };
        baseMenu = [itemMarketplace, itemPrestadores, ...baseMenu];
        setMenuItems(baseMenu);
      } catch (error) { setMenuItems([]); }
      finally { setIsLoadingMenu(false); }
    };
    fetchMenuData();
  }, []);

  return (
    <div className={style.layoutContainer}>
      <header className={style.header}>
        <div className={style.container}>
          <div className={style.headerContent}>
            {/* Logo */}
            <Link to="/" className={style.logoLink} onClick={closeMenu}>
              <div className={style.logoIconWrapper}><span className={style.logoIconText}>G</span></div>
              <div className={style.logoTextWrapper}>
                <h1 className={style.logoText}>GranConecta</h1>
                <p className={style.logoSubtitle}>Gran Reserva Paulista</p>
              </div>
            </Link>

            <nav className={style.navDesktop}>
              {/* 1. MENU PÚBLICO (Sempre visível) */}
              {!isLoadingMenu &&
                menuItems.map((item) => (
                  item.name !== "Prestadores" && (
                    <div key={item.name} className={style.navItem}>
                      {item.submenu ? (
                        <div className={style.navSubmenuButton}>
                          <button className={style.navLinkButton}>
                            <div className={style.navLinkContent}>
                              <span>{item.name}</span>
                              <ChevronDown size={14} />
                            </div>
                          </button>
                          <div className={style.dropdownMenu}>
                            <div className={style.dropdownContent}>
                              {item.submenu.map((sub: any) => (
                                <Link key={sub.path} to={sub.path} className={style.dropdownLink} onClick={closeMenu}>
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link to={item.path || "#"} className={style.navLinkSimple}>{item.name}</Link>
                      )}
                    </div>
                  )
                ))}

              {/* 2. ÁREA DE PERFIL (Logado) */}
              {isAuthenticated && user && (
                <div className={style.navItem}>
                  <button className={style.navLinkButton}>
                    <div className={style.navLinkContent} style={{ gap: 10, position: "relative" }}>
                      {naoVistosTotal > 0 && (
                        <span style={{
                          position: "absolute", top: -6, right: -6, minWidth: 18, height: 18,
                          padding: "0 6px", borderRadius: 999, background: "#ef4444",
                          color: "white", fontSize: 12, display: "flex", alignItems: "center",
                          justifyContent: "center", fontWeight: 700, lineHeight: 1, zIndex: 10,
                        }}>
                          {naoVistosTotal > 99 ? "99+" : naoVistosTotal}
                        </span>
                      )}
                      {fotoUrl ? (
                        <img
                          src={fotoUrl.startsWith('http') ? fotoUrl : `${API_URL}${fotoUrl}`}
                          className={style.avatarCircle}
                          alt="Perfil"
                        />
                      ) : (
                        <div className={style.avatarPlaceholder}>
                          <UserIcon size={18} color="#FFD700" />
                        </div>
                      )}
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{user.nome?.split(" ")[0] || user.nome?.split(" ")[0]}</span>
                        <BadgeVizinho tipo={tipoParaBadge} />
                      </Box>
                      <ChevronDown size={14} />
                    </div>
                  </button>

                  <div className={style.dropdownMenu} style={{ right: 0, left: "auto" }}>
                    <div className={style.dropdownContent}>
                      <div className={style.userHeaderDropdown}>
                        <p className={style.userLabel}>Acesso {user.tipo}</p>
                        <p className={style.userEmail}>{user.email}</p>
                      </div>

                      <div className={style.dividerHorizontal} />

                      {isAdmin && (
                        <button onClick={() => handleNavigation("/admin/dashboard")} className={style.dropdownLink} style={btnReset}>
                          <ShieldCheck size={16} /> Painel Administrativo
                        </button>
                      )}

                      {ehMoradorVinculado && (
                        <button onClick={() => handleNavigation("/dashboard")} className={style.dropdownLink} style={btnReset}>
                          <LayoutDashboard size={16} /> Meu Painel Morador
                        </button>
                      )}

                      {/* 3. PRESTADOR UNIFICADO */}
                      {ehPrestador && (
                        <button
                          onClick={() => {
                            if (isAprovadoGeral) handleNavigation("/prestador/admin");
                            else {
                              toast.error("Assinatura pendente! Redirecionando para pagamento...");
                              handleNavigation("/pagamento-orientacoes");
                            }
                          }}
                          className={style.dropdownLink}
                          style={{
                            ...btnReset,
                            opacity: isAprovadoGeral ? 1 : 0.6,
                            cursor: isAprovadoGeral ? "pointer" : "not-allowed"
                          }}
                        >
                          {isAprovadoGeral ? <ShieldCheck size={16} color="#10b981" /> : <Lock size={16} color="#f59e0b" />}
                          Painel de Serviços {!isAprovadoGeral && "(Bloqueado)"}
                        </button>
                      )}

                      {/* 4. EMPREENDEDOR UNIFICADO */}
                      {podeGerenciarNegocio && (
                        <button
                          onClick={() => {
                            if (isAprovadoGeral) handleNavigation("/dashboard-empreendedor");
                            else {
                              toast.error("Ative seu plano para gerenciar seu negócio.");
                              handleNavigation("/pagamento-orientacoes");
                            }
                          }}
                          className={style.dropdownLink}
                          style={{
                            ...btnReset,
                            opacity: isAprovadoGeral ? 1 : 0.6,
                            cursor: isAprovadoGeral ? "pointer" : "not-allowed"
                          }}
                        >
                          {isAprovadoGeral ? <Store size={16} color="#10b981" /> : <Lock size={16} color="#f59e0b" />}
                          Gerenciar Negócios {!isAprovadoGeral && "(Bloqueado)"}
                        </button>
                      )}

                      {isBloqueado && (
                        <div className={style.dropdownLink} style={{ color: "#ef4444", fontSize: "0.8rem" }}>🚫 Conta bloqueada</div>
                      )}

                      <div className={style.dividerHorizontal} />
                      <button onClick={() => handleNavigation("/editar-perfil")} className={style.dropdownLink} style={btnReset}><Settings size={16} /> Configurações</button>
                      <button onClick={handleLogout} className={style.logoutButton}><LogOut size={16} /> Sair</button>
                    </div>
                  </div>
                </div>
              )}
            </nav>

            <button className={style.mobileMenuButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <div className={style.mobileMenuOverlay}>
          <nav className={style.mobileNav}>
            {/* Itens Dinâmicos do Menu */}
            {!isLoadingMenu && menuItems.map((item) => (
              item.name !== "Prestadores" && (
                <div key={item.name} className={style.mobileNavItem}>
                  {item.submenu ? (
                    <>
                      <div className={style.mobileNavLabel}>{item.name}</div>
                      <div className={style.mobileSubmenu}>
                        {item.submenu.map((sub: any) => (
                          <Link key={sub.path} to={sub.path} className={style.mobileLink} onClick={closeMenu}>
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link to={item.path || "#"} className={style.mobileLink} onClick={closeMenu}>
                      {item.name}
                    </Link>
                  )}
                </div>
              )
            ))}

            <div className={style.dividerHorizontal} />

            {/* Opções do Usuário Logado no Mobile */}
            {isAuthenticated && user ? (
              <>
                <div className={style.mobileUserSection}>
                  <p className={style.userLabel}>Olá, {user.nome?.split(" ")[0]}</p>
                  <BadgeVizinho tipo={tipoParaBadge} />
                </div>

                {isAdmin && (
                  <button onClick={() => handleNavigation("/admin/dashboard")} className={style.mobileLink}>
                    <ShieldCheck size={18} /> Painel Administrativo
                  </button>
                )}

                {ehMoradorVinculado && (
                  <button onClick={() => handleNavigation("/dashboard")} className={style.mobileLink}>
                    <LayoutDashboard size={18} /> Meu Painel Morador
                  </button>
                )}

                {ehPrestador && (
                  <button
                    onClick={() => isAprovadoGeral ? handleNavigation("/prestador/admin") : handleNavigation("/pagamento-orientacoes")}
                    className={style.mobileLink}
                  >
                    <ShieldCheck size={18} color={isAprovadoGeral ? "#10b981" : "#f59e0b"} />
                    Painel de Serviços
                  </button>
                )}

                <button onClick={() => handleNavigation("/editar-perfil")} className={style.mobileLink}>
                  <Settings size={18} /> Configurações
                </button>

                <button onClick={handleLogout} className={`${style.mobileLink} ${style.logoutColor}`}>
                  <LogOut size={18} /> Sair
                </button>
              </>
            ) : (
              <Link to="/cadastro" className={style.mobileLink} onClick={closeMenu}>Entrar / Cadastrar</Link>
            )}
          </nav>
        </div>
      )}

      <main className={style.mainContent}><Outlet /></main>
      <ChatWidget />
    </div>
  );
}

const btnReset = {
  width: "100%",
  textAlign: "left" as const,
  background: "none",
  border: "none",
  padding: "10px 16px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: "0.9rem",
};