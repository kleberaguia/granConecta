import React from "react";
import {Image as ImageIcon, Upload, Share2, Palette, ShieldCheck } from "lucide-react";

interface FooterEditorProps {
  aiData: any;
  handleInputChange: (field: string, value: any) => void;
  renderInput: (label: string, value: string, field: string) => React.ReactNode;
  footerLogoInputRef: React.RefObject<HTMLInputElement>;
  handleFooterLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FooterEditor = ({
  aiData,
  handleInputChange,
  renderInput,
  footerLogoInputRef,
  handleFooterLogoUpload
}: FooterEditorProps) => {
  return (
    <div className="space-y-4">
      {/* --- 1. CORES E ESTILO --- */}
      <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase text-gray-500">Aparência do Rodapé</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Fundo (Background)</label>
            <input 
              type="color" 
              value={aiData.footer_bg || "#111827"}
              onChange={(e) => handleInputChange("footer_bg", e.target.value)} 
              className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Cor do Texto</label>
            <input 
              type="color" 
              value={aiData.footer_text || "#ffffff"}
              onChange={(e) => handleInputChange("footer_text", e.target.value)} 
              className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Variante de Layout</label>
          <select 
            value={aiData.footer_variant || "centered"}
            onChange={(e) => handleInputChange("footer_variant", e.target.value)} 
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="centered">✨ Clássico Centralizado</option>
            <option value="minimal">🍃 Minimalista (Lite)</option>
            <option value="corporate">🏢 Corporativo (Largo)</option>
          </select>
        </div>
      </div>

      {/* --- 2. LOGO DO RODAPÉ --- */}
      <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase text-gray-500">Identidade Visual</span>
        </div>
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border">
          <div className="h-12 w-20 border border-dashed rounded-lg flex items-center justify-center text-gray-400 bg-white overflow-hidden">
            {aiData.footer_logo_url ? (
              <img src={aiData.footer_logo_url} className="h-full w-full object-contain p-1" alt="Footer Logo" />
            ) : (
              <ImageIcon size={18} />
            )}
          </div>
          <button
            onClick={() => footerLogoInputRef.current?.click()}
            className="flex-1 px-3 py-2.5 bg-gray-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Upload size={14} />
            {aiData.footer_logo_url ? "Trocar Logo" : "Subir Logo"}
          </button>
          <input type="file" ref={footerLogoInputRef} className="hidden" accept="image/*" onChange={handleFooterLogoUpload} />
        </div>
      </div>

      {/* --- 3. REDES SOCIAIS --- */}
      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase text-blue-600">Links Sociais</span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {renderInput("Instagram URL", aiData.instagram_url, "instagram_url")}
          {renderInput("Facebook URL", aiData.facebook_url, "facebook_url")}
          {renderInput("WhatsApp", aiData.whatsapp_url, "whatsapp_url")}
          {renderInput("LinkedIn", aiData.linkedin_url, "linkedin_url")}
        </div>
      </div>

      {/* --- 4. TEXTOS E PRIVACIDADE --- */}
      <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase text-gray-500">Finalização</span>
        </div>
        
        {renderInput("Breve Descrição", aiData.footer_desc, "footer_desc")}
        {renderInput("Copyright", aiData.copyright, "copyright")}

        <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
          <input
            type="checkbox"
            checked={aiData.show_footer_links !== false}
            onChange={(e) => handleInputChange("show_footer_links", e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-[11px] font-bold text-gray-600 uppercase">Mostrar Links de Privacidade</span>
        </label>
      </div>
    </div>
  );
};