import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 1. Importe TUDO o que precisa
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import Layout from "./components/Layout"; // O Layout que contém o Sidebar
import Dashboard from "./admin/Dashboard";
import Products from "./admin/Products"; // A sua página de Produtos
import NovoProduto from "./admin/produtos/NovoProduto";
import EditarProduto from "./admin/produtos/EditarProduto";
import HomeEditor from "./admin/home/HomeEditor";
import MenuBuilder from "./components/MenuBuilder/MenuBuilder";
import PageEditor from "./admin/content/PageEditor";
import AdminModeracao from "./components/AdminModeracao/AdminModeracao";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="produtos/NovoProduto" element={<NovoProduto />} />
            <Route path="produtos/editar/:id" element={<EditarProduto />} />
            <Route path="home-editor" element={<HomeEditor />} />
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="menu-builder" element={<MenuBuilder />} />
            <Route path="edit-content/*" element={<PageEditor />} />
            <Route
              path="/admin/moderacao"
              element={<AdminModeracao />}
            />
            {/* <Route path="pages/edit/:id" element={<PageEditor />} />
            <Route path="/admin/pages/new" element={<PageEditor />} /> */}
          </Route>

          {/* Rota Pega-Tudo */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}