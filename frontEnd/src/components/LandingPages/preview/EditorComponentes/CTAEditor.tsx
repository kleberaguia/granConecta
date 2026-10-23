import React, { useRef } from "react";
import { MousePointerClick, Palette, Type, Image as ImageIcon, Trash2, Maximize2, Bold, Italic, Sparkles } from "lucide-react";
// Importamos o componente que substitui o renderInput
import { InputField } from "./EditorUI"; 

export const CTAEditor = ({ aiData, handleInputChange }: any) => {
  const ctaImageRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleInputChange("cta_image", reader.result);
      reader.readAsDataURL(file);
    }
  };

  const isVisualVariant = aiData.cta_variant === 'glassmorphism' || aiData.cta_variant === 'split';

  return (
    <div className="space-y-4">
      {/* --- 1. ESTILO E VARIANTES --- */}
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
        <label className="text-[9px] font-black text-blue-400 uppercase ml-1">Estilo Visual</label>
        <select 
          value={aiData.cta_variant || "minimal-elegant"}
          onChange={(e) => handleInputChange("cta_variant", e.target.value)} 
          className="w-full p-2.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-[11px] font-bold outline-none shadow-sm"
        >
          <option value="minimal-elegant">Minimalista & Elegante</option>
          <option value="glassmorphism">Glassmorphism (Efeito Vidro)</option>
          <option value="split">Dividido (Texto + Imagem)</option>
          <option value="centered-card">Card Centralizado Escuro</option>
        </select>
      </div>

      {/* --- 2. ESPAÇAMENTO E ESTRUTURA --- */}
      <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
            <Maximize2 size={14} className="text-purple-600" />
            <span className="text-[10px] font-black uppercase text-gray-500">Estrutura e Respiro</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Padding Vertical</label>
                <select 
                    value={aiData.cta_padding_y || "80px"}
                    onChange={(e) => handleInputChange("cta_padding_y", e.target.value)}
                    className="w-full p-2 bg-gray-50 border rounded-lg text-[10px] font-bold"
                >
                    <option value="40px">Compacto (40px)</option>
                    <option value="80px">Padrão (80px)</option>
                    <option value="120px">Espaçoso (120px)</option>
                    <option value="160px">Extra (160px)</option>
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Arredondamento</label>
                <select 
                    value={aiData.cta_border_radius || "0px"}
                    onChange={(e) => handleInputChange("cta_border_radius", e.target.value)}
                    className="w-full p-2 bg-gray-50 border rounded-lg text-[10px] font-bold"
                >
                    <option value="0px">Quadrado</option>
                    <option value="20px">Suave (20px)</option>
                    <option value="40px">Curvo (40px)</option>
                    <option value="80px">Cápsula</option>
                </select>
            </div>
        </div>
      </div>

      {/* --- 3. IMAGEM --- */}
      {isVisualVariant && (
        <div className="p-3 bg-white rounded-xl border border-dashed border-gray-300 space-y-3">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-black uppercase text-gray-500">Imagem de Fundo/Lateral</span>
             {aiData.cta_image && (
               <button onClick={() => handleInputChange("cta_image", null)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={14}/></button>
             )}
          </div>
          {aiData.cta_image ? (
            <img src={aiData.cta_image} className="w-full h-32 object-cover rounded-lg shadow-inner" alt="CTA Preview" />
          ) : (
            <button 
              onClick={() => ctaImageRef.current?.click()}
              className="w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-300 transition-all"
            >
              <ImageIcon size={24} />
              <span className="text-[10px] font-bold mt-2">SUBIR IMAGEM</span>
            </button>
          )}
          <input type="file" ref={ctaImageRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
      )}

      {/* --- 4. TEXTOS E TIPOGRAFIA --- */}
      <div className="space-y-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
            <Type size={14} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase text-gray-500">Textos e Fontes</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
            <select 
                value={aiData.cta_font_family || "inherit"}
                onChange={(e) => handleInputChange("cta_font_family", e.target.value)}
                className="p-2 bg-gray-50 border rounded-lg text-[10px] font-bold"
            >
                <option value="inherit">Fonte Padrão</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair (Elegante)</option>
                <option value="Poppins">Poppins (Moderna)</option>
                <option value="Inter">Inter</option>
            </select>
            <div className="flex gap-1">
                <button 
                    onClick={() => handleInputChange("cta_font_bold", !aiData.cta_font_bold)}
                    className={`flex-1 p-1 rounded-lg border transition-all ${aiData.cta_font_bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                >
                    <Bold size={12} className="mx-auto" />
                </button>
                <button 
                    onClick={() => handleInputChange("cta_font_italic", !aiData.cta_font_italic)}
                    className={`flex-1 p-1 rounded-lg border transition-all ${aiData.cta_font_italic ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                >
                    <Italic size={12} className="mx-auto" />
                </button>
            </div>
        </div>

        {/* ✅ Substituímos renderInput por InputField */}
        <InputField 
          label="Título de Apoio" 
          value={aiData.cta_overline || ""} 
          onChange={(v: string) => handleInputChange("cta_overline", v)} 
        />
        <InputField 
          label="Título Principal" 
          value={aiData.cta_titulo || ""} 
          onChange={(v: string) => handleInputChange("cta_titulo", v)} 
        />
        <InputField 
          label="Subtítulo" 
          value={aiData.cta_subtitulo || ""} 
          onChange={(v: string) => handleInputChange("cta_subtitulo", v)} 
        />
        <InputField 
          label="Texto do Botão" 
          value={aiData.cta_button_text || ""} 
          onChange={(v: string) => handleInputChange("cta_button_text", v)} 
        />
      </div>

      {/* --- 5. DESIGN AVANÇADO --- */}
      <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
            <Palette size={14} className="text-orange-600" />
            <span className="text-[10px] font-black uppercase text-gray-500">Design da Seção</span>
        </div>

        <div className="space-y-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Gradiente no Fundo</label>
                <input 
                    type="checkbox" 
                    checked={aiData.cta_bg_gradient_active || false} 
                    onChange={(e) => handleInputChange("cta_bg_gradient_active", e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600"
                />
            </div>

            {aiData.cta_bg_gradient_active ? (
                <div className="flex items-center gap-2 justify-center">
                    <input type="color" value={aiData.cta_bg_grad_1 || "#fdfaf7"} onChange={(e) => handleInputChange("cta_bg_grad_1", e.target.value)} className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" />
                    <Sparkles size={10} className="text-gray-300" />
                    <input type="color" value={aiData.cta_bg_grad_2 || "#fff5e6"} onChange={(e) => handleInputChange("cta_bg_grad_2", e.target.value)} className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" />
                </div>
            ) : (
                <div className="flex items-center justify-between px-1">
                     <label className="text-[9px] font-bold text-gray-500 uppercase">Cor Sólida</label>
                     <input type="color" value={aiData.cta_bg_color || "#fdfaf7"} onChange={(e) => handleInputChange("cta_bg_color", e.target.value)} className="w-12 h-6 rounded cursor-pointer border-none shadow-sm" />
                </div>
            )}
        </div>

        <div className="flex items-center justify-between px-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase">Cor do Texto Global</label>
            <input type="color" value={aiData.cta_title_color || "#5c4a33"} onChange={(e) => handleInputChange("cta_title_color", e.target.value)} className="w-12 h-6 rounded cursor-pointer" />
        </div>

        {/* --- 6. DESIGN DO BOTÃO --- */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <MousePointerClick size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase text-gray-500">Design do Botão</span>
            </div>

            <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Gradiente no Botão</label>
                <input 
                    type="checkbox" 
                    checked={aiData.cta_btn_gradient_active || false} 
                    onChange={(e) => handleInputChange("cta_btn_gradient_active", e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                />
            </div>

            {aiData.cta_btn_gradient_active ? (
                <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-lg justify-center border border-blue-100">
                    <input type="color" value={aiData.cta_btn_grad_1 || "#3b82f6"} onChange={(e) => handleInputChange("cta_btn_grad_1", e.target.value)} className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" />
                    <span className="text-[10px] text-blue-300">➔</span>
                    <input type="color" value={aiData.cta_btn_grad_2 || "#8b5cf6"} onChange={(e) => handleInputChange("cta_btn_grad_2", e.target.value)} className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" />
                </div>
            ) : (
                <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Cor do Botão</label>
                    <input type="color" value={aiData.cta_button_bg || "#3b82f6"} onChange={(e) => handleInputChange("cta_button_bg", e.target.value)} className="w-12 h-6 rounded cursor-pointer border-none shadow-sm" />
                </div>
            )}
            
            <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Cor do Texto do Botão</label>
                <input type="color" value={aiData.cta_button_text_color || "#ffffff"} onChange={(e) => handleInputChange("cta_button_text_color", e.target.value)} className="w-12 h-6 rounded cursor-pointer border-none shadow-sm" />
            </div>
        </div>
      </div>
    </div>
  );
};