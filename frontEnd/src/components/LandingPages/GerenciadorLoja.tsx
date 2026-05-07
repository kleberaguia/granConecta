import  { useState, useRef } from "react";
import { EditorPanel } from "./preview/EditorPanel";
import { IframeViewer } from "./preview/IframeViewer";

export const GerenciadorLoja = () => {
  // A ÚNICA REF FICA AQUI
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [aiData, setAiData] = useState({
    sectionOrder: ['header', 'hero', 'vitrine', 'sobre', 'gallery', 'testimonials', 'faq', 'cta', 'footer'],
    store_name: "Minha Loja",
    // ... restante do seu estado inicial
  });

  const handleInputChange = (field: string, value: any) => {
    setAiData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen w-full">
      {/* PASSANDO A REF PARA O EDITOR */}
      <EditorPanel 
        iframeRef={iframeRef} 
        aiData={aiData} 
        handleInputChange={handleInputChange} 
      />

      {/* PASSANDO A MESMA REF PARA O VISUALIZADOR */}
      <IframeViewer 
        iframeRef={iframeRef} 
        aiData={aiData} 
      />
    </div>
  );
};