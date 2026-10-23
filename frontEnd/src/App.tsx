import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./theme.css"
import "./landingPage.css";


// --- LAYOUT ---
import Layout from "./components/Layouts/Layout";

// --- PÁGINAS PÚBLICAS ---
import HomePage from "./components/pages/home/HomePage";
import ServiceShowcase from "./components/ServiceShowcase/ServiceShowcase";
import PageViewer from "./components/PageViewer/PageViewer";
import NotFoundPage from "./components/pages/NotFoundPage";
import PaymentResult from "./components/LoginPage/PaymentResult";

// --- AUTH ---
import LoginPage from "./components/LoginPage/LoginPage";
import RegisterPage from "./components/LoginPage/RegisterPage";
import ForgotPasswordPage from "./components/LoginPage/ForgotPasswordPage";
import VerifyEmailPage from "./components/LoginPage/VerifyEmailPage";
import BusinessTeamInvitationPage from "./components/pages/BusinessTeamInvitation/BusinessTeamInvitationPage";
import CentralAtendimentoPage from "./components/CentralAtendimentoPage/CentralAtendimentoPage";

// --- PERFIL / DASH ---
import PerfilSelectorPage from "./components/PerfilSelectorPage/PerfilSelectorPage";
import PerfilUsuarioPage from "./components/pages/PerfilUsuarioPage";
import MoradorDashboard from "./components/dashboard/MoradorDashboard";
import PrestadorDashboard from "./components/dashboard/PrestadorDashboard";

// --- UI ---
import { Box, CircularProgress } from "@mui/material";
import { StoreFront } from "./components/pages/StoreFront";
import EmpreendedorDashboard from "./components/pages/EmpreendedorDashboard/EmpreendedorDashboard";
import ExplorarLojas from "./components/pages/ExplorarLojas";
import { Checkout } from "./components/Checkout/Checkout";
import PaymentInstructions from "./components/LoginPage/PaymentInstructions";
import { Toaster } from "react-hot-toast";
import Gerador from "./components/LandingPages/Gerador";
import ViewPage from "./components/LandingPages/ViewPage";
import Preview from "./components/LandingPages/Preview";
import { ResultProvider } from "./components/LandingPages/ResultContext";
import Marketplace from "./components/Layouts/Marketplace";
import { PedidoConfirmado } from "./components/pages/PedidoConfirmado/PedidoConfirmado";
import { PedidoDetalhe } from "./components/PedidosList/PedidoDetalhe";
import ServicoEnviado from "./components/ServicoEnviado/ServicoEnviado";
import ServicoDetalhes from "./components/PedidosList/ServicoDetalhes";
import DocumentoLegalPage from "./components/documentos-legais/DocumentoLegalPage";
import GeneratorPageSetup from "./components/LandingPages/GeneratorPageSetup";
import ComunidadePage from "./components/comunidade/ComunidadePage";

/* ---------------- CONTEXT ---------------- */


const ContextWrapper = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);
const GeradorContextWrapper = () => (
  <ResultProvider>
    <Outlet />
  </ResultProvider>
);
/* ---------------- PRIVATE ROUTE ---------------- */



function PrivateRoute({ element, roles }: { element: JSX.Element; roles?: string[] }) {
  const { token, user, isAuthenticated } = useAuth();
  const u = user as any;

  if (token && !user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token || !user || !isAuthenticated) {
    return <Navigate to="/login/morador" replace />;
  }

  const tipoUsuario = u?.tipo?.toUpperCase();
  const eAdmin = tipoUsuario === 'ADMIN';

  // Se não passamos roles específicas, apenas estar logado basta
  if (!roles) return element;

  // Normalizamos as roles permitidas para facilitar a comparação
  const rolesPermitidas = roles.map(r => r.toUpperCase());

  // Lógica Especial para MORADOR (mantendo sua regra de condomínio)
  if (rolesPermitidas.includes("MORADOR")) {
    const temCondominio = !!(u?.condominio_id || u?.condominio);
    if (tipoUsuario === "MORADOR" || temCondominio || eAdmin) {
      return element;
    }
  }

  // Lógica para VISITANTE ou outras roles
  if (eAdmin || rolesPermitidas.includes(tipoUsuario)) {
    return element;
  }

  // Se chegou aqui, não tem permissão
  return <Navigate to="/" replace />;
}

/* ---------------- ROUTER ---------------- */



const router = createBrowserRouter([
  {
    element: <ContextWrapper />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          /* --------- PÚBLICO --------- */
          { index: true, element: <HomePage /> },

          { path: "vitrine", element: <ServiceShowcase /> },
          { path: "servicos/:categoryTag", element: <ServiceShowcase /> },


          /* --------- AUTH --------- */
          { path: "login/morador", element: <LoginPage tipo="MORADOR" /> },
          { path: "login/prestador", element: <LoginPage tipo="PRESTADOR" /> },
          { path: "cadastro", element: <RegisterPage /> },
          { path: "verificar-codigo", element: <VerifyEmailPage /> },
          { path: "esqueci-senha", element: <ForgotPasswordPage /> },
          { path: "convite-equipe", element: <BusinessTeamInvitationPage /> },
          { path: "central-atendimento", element: <PrivateRoute element={<CentralAtendimentoPage />} /> },

          /* --------- LOGADO --------- */
          {
            path: "selecionar-perfil",
            element: <PrivateRoute element={<PerfilSelectorPage />} />
          },
          // {
          //   path: "perfil",
          //   element: <PrivateRoute element={<PerfilUsuarioPage />} />
          // },
          {
            path: "editar-perfil",
            element: <PrivateRoute element={<PerfilUsuarioPage />} />
          },

          {
            path: "dashboard", // Pode manter "dashboard" ou "dashboard-morador"
            element: <PrivateRoute element={<MoradorDashboard />} roles={["MORADOR", "VISITANTE", "ADMIN"]} />
          },

          {
            path: "dashboard-empreendedor",
            // Se quiser manter apenas morador aqui:
            element: <PrivateRoute element={<EmpreendedorDashboard />} roles={["MORADOR"]} />
          },
          {
            path: "prestador/admin",
            element: <PrivateRoute element={<PrestadorDashboard />} roles={["PRESTADOR"]} />
          },

          {
            path: '/pagamento-orientacoes',
            element: <PaymentInstructions />
          },

          {
            path: "/explorar", element: <ExplorarLojas />
          },
          {
            path: "/explorar/:categoria",
            element: <ExplorarLojas />
          },
          {
            path: "/checkout", element: <Checkout />
          },
          {
            path: "/marketplace", element: <Marketplace />

          },
          {
            path: "/pedido-confirmado", element: <PedidoConfirmado />
          },

          {
            path: "/pedido/:id", element: <PedidoDetalhe />
          },
          {
            path: "/servico/:id", element: <ServicoDetalhes />

          },
          { path: "servico-enviado/:categoryTag", element: <ServicoEnviado /> },



          { path: "/generator-page-setup", element: <GeneratorPageSetup /> },


          { path: "comunidade", element:<ComunidadePage />},


          {
            element: <GeradorContextWrapper />,
            children: [
              { path: "/gerador", element: <Gerador /> },
              { path: "/preview", element: <Preview /> },
              { path: "/publicado", element: <ViewPage /> },

            ]
          },
          { path: "/lojas/:slug", element: <StoreFront /> },

          { path: "/documentos-legais/:slug", element: <DocumentoLegalPage /> },


        ]
      },

      {
        path: "pagamento/resultado",
        element: <PaymentResult />,
      },

      /* --------- CMS --------- */
      { path: "pagina/:slug", element: <PageViewer /> },

      /* --------- 404 REAL --------- */
      { path: "/404", element: <NotFoundPage /> },
      { path: "*", element: <Navigate to="/404" replace /> }
    ]
  }
]);

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {/* Envolvendo aqui, o contexto fica disponível para TODAS as rotas automaticamente */}
      <ResultProvider>
        <RouterProvider router={router} />
      </ResultProvider>

    </>
  );
}

// export default function App() {
//   return (
//     <>
//       <Toaster position="top-right" reverseOrder={false} />
//       <RouterProvider router={router} />
//       <ChatWidget />
//     </>
//   );
// }