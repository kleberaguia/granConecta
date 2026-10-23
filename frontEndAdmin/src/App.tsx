import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./admin/Dashboard";
import Products from "./admin/Products";
import NovoProduto from "./admin/produtos/NovoProduto";
import EditarProduto from "./admin/produtos/EditarProduto";
import HomeEditor from "./admin/home/HomeEditor";
import MenuBuilder from "./components/MenuBuilder/MenuBuilder";
import PageEditor from "./admin/content/PageEditor";
import AdminModeracao from "./components/AdminModeracao/AdminModeracao";
import AdminPlans from "./admin/Plans/AdminPlans";
import AdminMarketing from "./admin/Marketing/AdminMarketing";
import AdminChatInbox from "./components/AdminChatInbox/AdminChatInbox";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<Dashboard />}
            />

            <Route
              path="Plans/AdminPlans"
              element={<AdminPlans />}
            />

            <Route
              path="marketing"
              element={<AdminMarketing />}
            />

            {/* =====================================================
             * CENTRAL DE ATENDIMENTO OMNICHANNEL
             * Instagram | WhatsApp | Loja | Prestador
             * ===================================================== */}
            <Route
              path="atendimentos"
              element={
                <AdminChatInbox
                  title="Central de Atendimento"
                />
              }
            />

            <Route
              path="products"
              element={<Products />}
            />

            <Route
              path="produtos/NovoProduto"
              element={<NovoProduto />}
            />

            <Route
              path="produtos/editar/:id"
              element={<EditarProduto />}
            />

            <Route
              path="home-editor"
              element={<HomeEditor />}
            />

            <Route
              path="menu-builder"
              element={<MenuBuilder />}
            />

            <Route
              path="edit-content/*"
              element={<PageEditor />}
            />

            <Route
              path="moderacao"
              element={<AdminModeracao />}
            />
          </Route>

          {/* Rota pega-tudo */}
          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}