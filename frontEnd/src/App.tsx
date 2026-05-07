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

// --- AUTH ---
import LoginPage from "./components/LoginPage/LoginPage";
import RegisterPage from "./components/LoginPage/RegisterPage";
import ForgotPasswordPage from "./components/LoginPage/ForgotPasswordPage";
import VerifyEmailPage from "./components/LoginPage/VerifyEmailPage";

// --- PERFIL / DASH ---
import PerfilSelectorPage from "./components/PerfilSelectorPage/PerfilSelectorPage";
import PerfilUsuarioPage from "./components/pages/PerfilUsuarioPage";
import MoradorDashboard from "./components/dashboard/MoradorDashboard";
import PrestadorDashboard from "./components/dashboard/PrestadorDashboard";

// --- UI ---
import { Box, CircularProgress } from "@mui/material";
import ChatWidget from "./components/ChatWidget/ChatWidget";
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

function PrivateRoute({ element, role }: { element: JSX.Element; role?: string }) {
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

  if (role === "MORADOR") {
    // Permite se o tipo for MORADOR OU se ele tiver um condomínio vinculado (Prestador Interno)
    const temCondominio = !!(u?.condominio_id || u?.condominio);
    const eAdmin = u?.tipo === 'ADMIN';

    if (u?.tipo === "MORADOR" || temCondominio || eAdmin) {
      return element;
    }
  }

  if (role && u?.tipo !== role && u?.tipo !== 'ADMIN') {
    const tipo = user.tipo?.toUpperCase();
    if (tipo !== "ADMIN" && tipo !== role.toUpperCase()) {
      return <Navigate to="/" replace />;
    }
  }

  return element;
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
            element: <PrivateRoute element={<MoradorDashboard />} role="MORADOR" />
          },
          {
            path: "dashboard-empreendedor",
            element: <PrivateRoute element={<EmpreendedorDashboard />} role="MORADOR" />
          },
          {
            path: "prestador/admin",
            element: <PrivateRoute element={<PrestadorDashboard />} role="PRESTADOR" />
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
            element: <GeradorContextWrapper />,
            children: [
              { path: "/gerador", element: <Gerador /> },
              { path: "/preview", element: <Preview /> },
              { path: "/publicado", element: <ViewPage /> },

            ]
          },
          { path: "/lojas/:slug", element: <StoreFront /> },




        ]
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
      <ChatWidget />
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
