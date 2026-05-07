import { BrowserRouter, Routes, Route } from "react-router-dom";
import Gerador from "./components/Gerador";
import PreviewEditor from "./components/Preview"; // Este agora é o nosso Editor completo
import ViewPage from "./components/ViewPage"; // Novo componente para visualização final
import { ResultProvider } from "./components/ResultContext";

// Importando fontes globais para garantir que o Preview e o Editor as vejam
import "./index.css"; 

export default function App() {
  return (
    <BrowserRouter>
      <ResultProvider>
        <Routes>
          {/* 1. Onde você gera o HTML inicial via IA ou Formulário */}
          <Route path="/" element={<Gerador />} />
          
          {/* 2. O Editor com Sidebar, Drag-and-Drop e Edição de Links */}
          <Route path="/preview" element={<PreviewEditor />} />

          {/* 3. A página de visualização final (O que o cliente veria) */}
          <Route path="/publicado" element={<ViewPage />} />
        </Routes>
      </ResultProvider>
    </BrowserRouter>
  );
}