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
  Lock,
  MessageCircle,
  Home,
  Compass,
  Sparkles,
  UsersRound,
  CircleUserRound,
  Bell
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
  const [isEntradaOpen, setIsEntradaOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const location = useLocation();
  const isHomePage = location.pathname === "/";
  // A HomePage controla tanto o DOT principal quanto o chat do especialista.
  const [homeChatVisible, setHomeChatVisible] = useState(false);
  useEffect(() => {
    const updateVisibility = (event: Event) => {
      setHomeChatVisible(Boolean((event as CustomEvent<{ open: boolean }>).detail?.open));
    };
    window.addEventListener("granconecta:chat-visibility", updateVisibility);
    return () => window.removeEventListener("granconecta:chat-visibility", updateVisibility);
  }, []);
  useEffect(() => {
    if (!isHomePage) setHomeChatVisible(false);
  }, [isHomePage]);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();

  const u = user as any;

  const [naoVistosTotal, setNaoVistosTotal] = useState<number>(0);
  const [notificacoesProfissionalTotal, setNotificacoesProfissionalTotal] = useState<number>(0);
  const [temCentralAtendimento, setTemCentralAtendimento] = useState(false);

  const fetchNaoVistosTotal = async () => {
    const ehUsuarioComunidade = !!(
      u?.tipo === "MORADOR" ||
      u?.tipo === "VISITANTE" ||
      u?.is_interno ||
      u?.condominio_id ||
      u?.condominio_nome
    );

    if (!isAuthenticated || !ehUsuarioComunidade) {
      setNaoVistosTotal(0);
      return;
    }

    try {
      const { data } = await api.get("/home/contador-nao-vistos");
      setNaoVistosTotal(Number(data?.total ?? 0));
    } catch {
      setNaoVistosTotal(0);
    }
  };

  const fetchNotificacoesProfissionalTotal = async () => {
    const ehUsuarioProfissional = !!(
      u?.tipo === "PRESTADOR" ||
      u?.tipo === "EMPREENDEDOR" ||
      u?.is_prestador ||
      u?.is_empreendedor
    );

    if (!isAuthenticated || !ehUsuarioProfissional) {
      setNotificacoesProfissionalTotal(0);
      return;
    }

    try {
      const { data } = await api.get("/notificacoes");
      const lista = Array.isArray(data) ? data : [];

      setNotificacoesProfissionalTotal(
        lista.filter((item: any) => item?.lido !== true).length
      );
    } catch {
      setNotificacoesProfissionalTotal(0);
    }
  };

  const fetchCentralAtendimentoAccess = async () => {
    if (!isAuthenticated) {
      setTemCentralAtendimento(false);
      return;
    }

    try {
      const { data } = await api.get("/business-team/my-businesses");
      const businesses = Array.isArray(data?.businesses) ? data.businesses : [];

      setTemCentralAtendimento(businesses.length > 0);
    } catch {
      // Não interfere no restante do menu caso a consulta falhe.
      setTemCentralAtendimento(false);
    }
  };

  const isAdmin = u?.tipo === "ADMIN";
  const ehVisitante = u?.tipo === "VISITANTE";
  const ehMoradorVinculado = !!(
    u?.is_interno ||
    u?.condominio_id ||
    u?.condominio_nome ||
    ehVisitante
  );
  const ehPrestador = !!(u?.tipo === "PRESTADOR" || u?.is_prestador);

  const statusConta = (u?.status_conta || u?.status || "").toUpperCase();
  const perfis = u?.perfis || [];
  const temPerfilAprovado = perfis.some((p: any) =>
    (p.status || "").toUpperCase() === "APROVADO" ||
    (p.status_aprovacao || "").toUpperCase() === "APROVADO"
  );

  const isAprovadoGeral =
    statusConta === "APROVADO" ||
    temPerfilAprovado ||
    u?.ativo === true ||
    u?.ativo === 1;

  const isBloqueado = u?.ativo === 0 || u?.ativo === false;

  const isInterno =
    u?.is_interno === 1 ||
    !!u?.condominio_id ||
    !!u?.condominio_nome;

  const tipoParaBadge = isInterno ? "MORADOR" : "EXTERNO";

  const podeGerenciarNegocio =
    (u?.is_empreendedor === 1 || u?.is_empreendedor === true) &&
    !isBloqueado;

  const fotoUrl = u?.perfil?.foto_perfil_url || u?.foto_perfil_url || "";

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsEntradaOpen(false);
  };

  const handleNavigation = (path: string) => {
    closeMenu();
    setTimeout(() => {
      navigate(path);
    }, 50);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate("/");
  };

  useEffect(() => {
    fetchNaoVistosTotal();
    fetchNotificacoesProfissionalTotal();
    fetchCentralAtendimentoAccess();

    const off = onNaoVistosChanged(() => {
      fetchNaoVistosTotal();
      fetchNotificacoesProfissionalTotal();
    });

    return off;
  }, [isAuthenticated, user?.id, u?.tipo]);

  useEffect(() => {
    const refreshUserStatus = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const res = await api.get(`/users/${user.id}`);
          if (res.data) updateUser(res.data);
        } catch (e) {
          console.error("Erro ao sincronizar dados");
        }
      }
    };

    refreshUserStatus();
  }, [location.pathname]);

  const isBottomNavActive = (item: "home" | "explore" | "community" | "profile") => {
    if (item === "home") return location.pathname === "/";
    if (item === "explore") {
      return (
        location.pathname === "/marketplace" ||
        location.pathname.startsWith("/pagina/") ||
        location.search.includes("tipo=prestadores")
      );
    }
    if (item === "community") return location.pathname.startsWith("/comunidade");
    return (
      location.pathname === "/dashboard" ||
      location.pathname === "/editar-perfil" ||
      location.pathname.startsWith("/prestador/admin") ||
      location.pathname.startsWith("/dashboard-empreendedor") ||
      location.pathname.startsWith("/admin/dashboard")
    );
  };

  const handleProfileNavigation = () => {
    if (!isAuthenticated || !user) {
      handleNavigation("/login/morador");
      return;
    }

    if (isAdmin) {
      handleNavigation("/admin/dashboard");
      return;
    }

    if (ehPrestador) {
      handleNavigation(isAprovadoGeral ? "/prestador/admin" : "/pagamento-orientacoes");
      return;
    }

    if (podeGerenciarNegocio) {
      handleNavigation(isAprovadoGeral ? "/dashboard-empreendedor" : "/pagamento-orientacoes");
      return;
    }

    if (ehMoradorVinculado || ehVisitante) {
      handleNavigation("/dashboard");
      return;
    }

    handleNavigation("/editar-perfil");
  };

  return (
    <div className={style.layoutContainer}>
      <header className={style.header}>
        <div className={style.container}>
          <div className={style.headerContent}>
            <Link to="/" className={style.logoLink} onClick={closeMenu}>
              <img
                src={`${API_URL}/uploads/images/logo1.png`}
                alt="Gran Conecta Logo"
                className={style.logoImg}
              />
            </Link>

            <nav className={style.navDesktop}>
              <div className={style.navItem}>
                <Link
                  to="/"
                  className={style.navLinkSimple}
                  onClick={closeMenu}
                >
                  Início
                </Link>
              </div>

              <div className={style.navItem}>
                <Link
                  to="/marketplace"
                  className={style.navLinkSimple}
                  onClick={closeMenu}
                >
                  Lojas
                </Link>
              </div>

              <div className={style.navItem}>
                <Link
                  to="/?tipo=prestadores"
                  className={style.navLinkSimple}
                  onClick={closeMenu}
                >
                  Prestadores
                </Link>
              </div>

              <div className={style.navItem}>
                <div className={style.navSubmenuButton}>
                  <button className={style.navLinkButton} type="button">
                    <div className={style.navLinkContent}>
                      <span>Entrada</span>
                      <ChevronDown size={14} />
                    </div>
                  </button>

                  <div className={style.dropdownMenu}>
                    <div className={style.dropdownContent}>
                      <Link
                        to="/login/morador"
                        className={style.dropdownLink}
                        onClick={closeMenu}
                      >
                        Morador
                      </Link>

                      <Link
                        to="/login/prestador"
                        className={style.dropdownLink}
                        onClick={closeMenu}
                      >
                        Prestador
                      </Link>

                      <Link
                        to="/cadastro"
                        className={style.dropdownLink}
                        onClick={closeMenu}
                      >
                        Cadastro
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {!isAuthenticated && (
                <div className={style.navItem}>
                  <Link
                    to="/cadastro"
                    className={style.navLinkSimple}
                    onClick={closeMenu}
                  >
                    Entrar / Cadastrar
                  </Link>
                </div>
              )}

              {isAuthenticated && user && (
                <div className={style.navItem}>
                  <button className={style.navLinkButton} type="button">
                    <div
                      className={style.navLinkContent}
                      style={{ gap: 10, position: "relative" }}
                    >
                      {(ehPrestador || podeGerenciarNegocio
                        ? notificacoesProfissionalTotal
                        : naoVistosTotal) > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -6,
                              minWidth: 18,
                              height: 18,
                              padding: "0 6px",
                              borderRadius: 999,
                              background: "#ef4444",
                              color: "white",
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              lineHeight: 1,
                              zIndex: 10
                            }}
                          >
                            {(ehPrestador || podeGerenciarNegocio
                              ? notificacoesProfissionalTotal
                              : naoVistosTotal) > 99
                              ? "99+"
                              : (ehPrestador || podeGerenciarNegocio
                                ? notificacoesProfissionalTotal
                                : naoVistosTotal)}
                          </span>
                        )}

                      {fotoUrl ? (
                        <img
                          src={fotoUrl.startsWith("http") ? fotoUrl : `${API_URL}${fotoUrl}`}
                          className={style.avatarCircle}
                          alt="Perfil"
                        />
                      ) : (
                        <div className={style.avatarPlaceholder}>
                          <UserIcon size={18} color="#FFD700" />
                        </div>
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          lineHeight: 1.1
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          {user.name?.split(" ")[0]}
                        </span>
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
                        <p className={style.userEmail}>
                          {u?.perfil?.categoriaidoPrincipal?.name}
                        </p>
                      </div>

                      <div className={style.dividerHorizontal} />

                      {isAdmin && (
                        <button
                          onClick={() => handleNavigation("/admin/dashboard")}
                          className={style.dropdownLink}
                          style={btnReset}
                        >
                          <ShieldCheck size={16} />
                          Painel Administrativo
                        </button>
                      )}

                      {(ehMoradorVinculado || ehVisitante) && (
                        <button
                          onClick={() => handleNavigation("/dashboard")}
                          className={style.dropdownLink}
                          style={btnReset}
                        >
                          <LayoutDashboard size={16} />
                          {ehVisitante ? "Minhas Solicitações" : "Meu Painel Morador"}
                        </button>
                      )}

                      {(ehPrestador || podeGerenciarNegocio) && (
                        <button
                          onClick={() => handleNavigation(
                            ehPrestador ? "/prestador/admin" : "/dashboard-empreendedor"
                          )}
                          className={style.dropdownLink}
                          style={btnReset}
                        >
                          <Bell size={16} color="#2563eb" />
                          Notificações
                          {notificacoesProfissionalTotal > 0 && (
                            <span
                              style={{
                                marginLeft: "auto",
                                minWidth: 20,
                                height: 20,
                                padding: "0 6px",
                                borderRadius: 999,
                                background: "#ef4444",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              {notificacoesProfissionalTotal > 99
                                ? "99+"
                                : notificacoesProfissionalTotal}
                            </span>
                          )}
                        </button>
                      )}

                      {/* {(ehPrestador || podeGerenciarNegocio) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleNavigation(
                        ehPrestador ? "/prestador/admin" : "/dashboard-empreendedor"
                      )
                    }
                    className={style.mobileLink}
                  >
                    <Bell size={18} color="#2563eb" />
                    Notificações
                    {notificacoesProfissionalTotal > 0 && (
                      <span
                        style={{
                          marginLeft: "auto",
                          minWidth: 20,
                          height: 20,
                          padding: "0 6px",
                          borderRadius: 999,
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {notificacoesProfissionalTotal > 99
                          ? "99+"
                          : notificacoesProfissionalTotal}
                      </span>
                    )}
                  </button>
                )} */}

                      {temCentralAtendimento && (
                        <button
                          onClick={() => handleNavigation("/central-atendimento")}
                          className={style.dropdownLink}
                          style={btnReset}
                        >
                          <MessageCircle size={16} color="#2563eb" />
                          Central de Atendimento
                        </button>
                      )}

                      {ehPrestador && (
                        <button
                          onClick={() => {
                            if (isAprovadoGeral) {
                              handleNavigation("/prestador/admin");
                            } else {
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
                          {isAprovadoGeral ? (
                            <ShieldCheck size={16} color="#10b981" />
                          ) : (
                            <Lock size={16} color="#f59e0b" />
                          )}
                          Painel de Serviços {!isAprovadoGeral && "(Bloqueado)"}
                        </button>
                      )}

                      {podeGerenciarNegocio && (
                        <button
                          onClick={() => {
                            if (isAprovadoGeral) {
                              handleNavigation("/dashboard-empreendedor");
                            } else {
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
                          {isAprovadoGeral ? (
                            <Store size={16} color="#10b981" />
                          ) : (
                            <Lock size={16} color="#f59e0b" />
                          )}
                          Gerenciar Negócios {!isAprovadoGeral && "(Bloqueado)"}
                        </button>
                      )}

                      {isBloqueado && (
                        <div
                          className={style.dropdownLink}
                          style={{ color: "#ef4444", fontSize: "0.8rem" }}
                        >
                          Conta bloqueada
                        </div>
                      )}

                      <div className={style.dividerHorizontal} />

                      <button
                        onClick={() => handleNavigation("/editar-perfil")}
                        className={style.dropdownLink}
                        style={btnReset}
                      >
                        <Settings size={16} />
                        Configurações
                      </button>

                      <button
                        onClick={handleLogout}
                        className={`${style.dropdownLink} ${style.logoutButton}`}
                        style={btnReset}
                      >
                        <LogOut size={16} />
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </nav>

            <button
              className={style.mobileMenuButton}
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className={style.mobileMenuOverlay}>
          <nav className={style.mobileNav}>
            <Link to="/" className={style.mobileLink} onClick={closeMenu}>
              Início
            </Link>

            <Link to="/marketplace" className={style.mobileLink} onClick={closeMenu}>
              Lojas
            </Link>

            <Link to="/?tipo=prestadores" className={style.mobileLink} onClick={closeMenu}>
              Prestadores
            </Link>

            <button
              type="button"
              className={style.mobileLink}
              onClick={() => setIsEntradaOpen(!isEntradaOpen)}
              style={btnResetMobile}
            >
              Entrada
              <ChevronDown size={16} />
            </button>

            {isEntradaOpen && (
              <div className={style.mobileSubmenu}>
                <Link
                  to="/login/morador"
                  className={style.mobileLink}
                  onClick={closeMenu}
                >
                  Morador
                </Link>

                <Link
                  to="/login/prestador"
                  className={style.mobileLink}
                  onClick={closeMenu}
                >
                  Prestador
                </Link>

                <Link
                  to="/cadastro"
                  className={style.mobileLink}
                  onClick={closeMenu}
                >
                  Cadastro
                </Link>
              </div>
            )}

            <div className={style.dividerHorizontal} />

            {isAuthenticated && user ? (
              <>
                <div className={style.mobileUserSection}>
                  <p className={style.userLabel}>Olá, {user.name?.split(" ")[0]}</p>
                  <BadgeVizinho tipo={tipoParaBadge} />
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleNavigation("/admin/dashboard")}
                    className={style.mobileLink}
                  >
                    <ShieldCheck size={18} />
                    Painel Administrativo
                  </button>
                )}

                {(ehMoradorVinculado || ehVisitante) && (
                  <button
                    type="button"
                    onClick={() => handleNavigation("/dashboard")}
                    className={style.mobileLink}
                  >
                    <LayoutDashboard size={18} />
                    {ehVisitante ? "Minhas Solicitações" : "Meu Painel Morador"}
                  </button>
                )}

                {temCentralAtendimento && (
                  <button
                    type="button"
                    onClick={() => handleNavigation("/central-atendimento")}
                    className={style.mobileLink}
                  >
                    <MessageCircle size={18} color="#2563eb" />
                    Central de Atendimento
                  </button>
                )}

                {ehPrestador && (
                  <button
                    type="button"
                    onClick={() =>
                      isAprovadoGeral
                        ? handleNavigation("/prestador/admin")
                        : handleNavigation("/pagamento-orientacoes")
                    }
                    className={style.mobileLink}
                  >
                    <ShieldCheck
                      size={18}
                      color={isAprovadoGeral ? "#10b981" : "#f59e0b"}
                    />
                    Painel de Serviços
                  </button>
                )}

                {podeGerenciarNegocio && (
                  <button
                    type="button"
                    onClick={() =>
                      isAprovadoGeral
                        ? handleNavigation("/dashboard-empreendedor")
                        : handleNavigation("/pagamento-orientacoes")
                    }
                    className={style.mobileLink}
                  >
                    <Store
                      size={18}
                      color={isAprovadoGeral ? "#10b981" : "#f59e0b"}
                    />
                    Gerenciar Negócios
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNavigation("/editar-perfil")}
                  className={style.mobileLink}
                >
                  <Settings size={18} />
                  Configurações
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${style.mobileLink} ${style.logoutColor}`}
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </>
            ) : (
              <Link to="/cadastro" className={style.mobileLink} onClick={closeMenu}>
                Entrar / Cadastrar
              </Link>
            )}
          </nav>
        </div>
      )}

      <main className={style.mainContent}>
        <Outlet />
      </main>

      {!chatOpen && !(isHomePage && homeChatVisible) && (
        <button
          type="button"
          onClick={() => {
            if (isHomePage) {
              setHomeChatVisible(true);
              window.dispatchEvent(new Event("granconecta:open-dot"));
            } else {
              setChatOpen(true);
            }
          }}
          aria-label="Abrir assistente GranConecta"
          title="Falar com o GranConecta"
          className={style.floatingChatButton}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            width: 58,
            height: 58,
            borderRadius: "50%",
            border: "none",
            background: "#120a8f",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(18, 10, 143, 0.35)",
            zIndex: 1500,
          }}
        >
          <MessageCircle size={28} />
        </button>
      )}

      <nav className={style.bottomNav} aria-label="Navegação principal mobile">
        <button
          type="button"
          className={`${style.bottomNavItem} ${isBottomNavActive("home") ? style.bottomNavItemActive : ""}`}
          onClick={() => handleNavigation("/")}
          aria-label="Início"
        >
          <Home size={21} />
          <span>Início</span>
        </button>

        <button
          type="button"
          className={`${style.bottomNavItem} ${isBottomNavActive("explore") ? style.bottomNavItemActive : ""}`}
          onClick={() => handleNavigation("/marketplace")}
          aria-label="Explorar"
        >
          <Compass size={21} />
          <span>Explorar</span>
        </button>

        <button
          type="button"
          className={`${style.bottomNavItem} ${style.bottomNavAi}`}
          onClick={() => {
            if (isHomePage) {
              console.log("[DOT LAYOUT] Solicitando abertura do DOT");

              window.dispatchEvent(
                new CustomEvent("granconecta:open-dot")
              );
            } else {
              setChatOpen(true);
            }
          }}
          aria-label="Pedir à IA"
        >
          <span className={style.bottomNavAiIcon}>
            <Sparkles size={22} />
          </span>
          <span>IA</span>
        </button>

        <button
          type="button"
          className={`${style.bottomNavItem} ${isBottomNavActive("community") ? style.bottomNavItemActive : ""}`}
          onClick={() => handleNavigation("/comunidade")}
          aria-label="Comunidade"
        >
          <UsersRound size={21} />
          <span>Comunidade</span>
          {!ehPrestador && !podeGerenciarNegocio && naoVistosTotal > 0 && (
            <span className={style.bottomNavBadge}>
              {naoVistosTotal > 99 ? "99+" : naoVistosTotal}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`${style.bottomNavItem} ${isBottomNavActive("profile") ? style.bottomNavItemActive : ""}`}
          onClick={handleProfileNavigation}
          aria-label={isAuthenticated ? "Minha conta" : "Entrar"}
        >
          <CircleUserRound size={21} />
          <span>{isAuthenticated ? "Eu" : "Entrar"}</span>
        </button>
      </nav>

      {/* <ChatWidget
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        storeId=""
        storeName="GranConecta"
        userId={user?.id}
        userName={user?.name}
        userType={u?.tipo}
        condominioId={u?.condominio_id}
      /> */}

      {!isHomePage && (
        <ChatWidget
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          storeId=""
          storeName="GranConecta"
          userId={user?.id}
          userName={user?.name}
          userType={u?.tipo}
          condominioId={u?.condominio_id}
        />
      )}
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
  fontSize: "0.9rem"
};

const btnResetMobile = {
  width: "100%",
  textAlign: "left" as const,
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontFamily: "inherit"
};