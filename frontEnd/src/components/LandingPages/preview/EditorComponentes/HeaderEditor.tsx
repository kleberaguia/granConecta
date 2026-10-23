import React from "react";
import { Image, Layout, Eye, EyeOff, Upload } from "lucide-react";
import { ColorPicker } from "./EditorUI";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import { API_URL } from "../../../../utils/config";

interface HeaderEditorProps {
    aiData: any;
    handleInputChange: (field: string, value: any) => void;
    logoFileInputRef: React.RefObject<HTMLInputElement>;
    textColor: string;
}

const headerTypographyOptions = [
    { name: "Montserrat", style: "Moderna/Versátil" },
    { name: "Inter", style: "Interface Moderna" },
    { name: "Poppins", style: "Geométrica/Limpa" },
    { name: "Roboto", style: "Padrão Corporativo" },
    { name: "Oswald", style: "Rústica/Condensada" },
    { name: "Anton", style: "Impacto Máximo" },
    { name: "Playfair Display", style: "Luxo Clássico" },
    { name: "Cinzel", style: "Elegância Imperial" },
    { name: "Liby Baskerville", style: "Autoridade" },
    { name: "Cormorant Garamond", style: "Alta Costura" },
    { name: "Great Vibes", style: "Manuscrita Elegante" },
    { name: "Caveat", style: "Escrita à Mão Casual" },
];

export const HeaderEditor = ({
    aiData,
    handleInputChange,
    logoFileInputRef,
    textColor
}: HeaderEditorProps) => {

    const menuItems = [
        { id: 'hero', label: 'Início' },
        { id: 'vitrine', label: 'Vitrine/Produtos' },
        { id: 'gallery', label: 'Galeria/Fotos' },
        { id: 'sobre', label: 'Sobre Nós' },
        { id: 'testimonials', label: 'Depoimentos' },
        { id: 'faq', label: 'Dúvidas' },
        { id: 'cta', label: 'Contato' }
    ];

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const loading = toast.loading("Subindo logotipo...");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post("/lojas/store/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const { filename } = response.data;

            if (filename) {
                // Aqui salvamos apenas o nome do arquivo, como na capa
                handleInputChange("logo_url", filename);
                toast.success("Logo atualizada!", { id: loading });
            } else {
                toast.error("Erro na resposta do servidor", { id: loading });
            }
        } catch (error: any) {
            console.error("Erro no upload da logo:", error);
            toast.error("Erro ao subir imagem", { id: loading });
        }
    };

    const getLogoSrc = (url: string) => {
        if (!url) return "";
        if (url.startsWith("data:") || url.startsWith("http")) return url;
        return `${API_URL}/uploads/images/${url}`;
    };

    return (
        <div className="space-y-4">

            {/* --- 1. LOGO E DIMENSÕES --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Image size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Logotipo e Posição</span>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        onClick={() => logoFileInputRef.current?.click()}
                        className="w-14 h-14 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all p-1"
                    >
                        {aiData.logo_url ? (
                            <img
                                src={getLogoSrc(aiData.logo_url)}
                                /* Alterado de max-w-full max-h-full para object-contain 
                                   e garantindo que o arredondamento seja aplicado corretamente 
                                */
                                className="w-full h-full object-contain"
                                alt="Logo"
                                style={{ borderRadius: aiData.logo_radius || '0px' }}
                            />
                        ) : (
                            <Upload size={16} className="text-gray-300" />
                        )}
                    </div>

                    <div className="flex-1 space-y-2">
                        {/* Posição da Logo */}
                        <div className="grid grid-cols-3 gap-1">
                            {['left', 'center', 'right'].map((pos) => (
                                <button
                                    key={pos}
                                    onClick={() => handleInputChange("logo_position", pos)}
                                    className={`py-1 text-[9px] font-bold uppercase rounded border ${aiData.logo_position === pos ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200'}`}
                                >
                                    {pos === 'left' ? 'Esq' : pos === 'center' ? 'Centro' : 'Dir'}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => logoFileInputRef.current?.click()}
                            className="w-full py-1.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-lg hover:bg-blue-100"
                        >
                            {aiData.logo_url ? "Trocar Imagem" : "Subir Logo"}
                        </button>
                        <input
                            type="file" ref={logoFileInputRef}
                            className="hidden"
                            accept="image/*" onChange={handleLogoUpload} />
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-50">
                    <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between mb-1">
                        Largura da Logo <span>{aiData.logo_width || 120}px</span>
                    </label>
                    <input
                        type="range" min="40" max="250" step="5"
                        value={aiData.logo_width || 120}
                        onChange={(e) => handleInputChange("logo_width", parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between mb-1">
                        Arredondamento <span>{aiData.logo_radius || "0px"}</span>
                    </label>
                    <input
                        type="range" min="0" max="100" step="2"
                        value={parseInt(aiData.logo_radius || "0")}
                        onChange={(e) => handleInputChange("logo_radius", e.target.value + "px")}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
            </div>

            {/* --- 2. ESTILO E CORES --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
                {/* 1. Tipografia */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Fonte e Tamanho</label>
                    <select
                        value={aiData.header_font || "Montserrat"}
                        onChange={(e) => handleInputChange("header_font", e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold outline-none"
                    >
                        {headerTypographyOptions.map((font) => (
                            <option key={font.name} value={font.name}>{font.name}</option>
                        ))}
                    </select>

                    <div className="pt-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between mb-1">
                            Tamanho do Texto <span>{aiData.menu_size || 14}px</span>
                        </label>
                        <input
                            type="range" min="10" max="22" step="1"
                            value={aiData.menu_size || 14}
                            onChange={(e) => handleInputChange("menu_size", parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>

                {/* 2. Estilo do Formato (Padrão, Glass, Arredondado) */}
                <div className="space-y-2 pt-2 border-t border-gray-50">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Formato do Menu</label>
                    <div className="grid grid-cols-3 gap-1">
                        {[
                            { id: 'full', label: 'Padrão' },
                            { id: 'glass', label: 'Glass' },
                            { id: 'floating', label: 'Flutuante' }
                        ].map((style) => (
                            <button
                                key={style.id}
                                onClick={() => handleInputChange("header_style_type", style.id)}
                                className={`py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${aiData.header_style_type === style.id || (!aiData.header_style_type && style.id === 'full') ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Tipo de Preenchimento (Sólido vs Degradê) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tipo de Cor</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleInputChange("header_bg_type", "solid")}
                            className={`py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${aiData.header_bg_type !== 'gradient' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                        >
                            Sólido
                        </button>
                        <button
                            onClick={() => handleInputChange("header_bg_type", "gradient")}
                            className={`py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${aiData.header_bg_type === 'gradient' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                        >
                            Degradê
                        </button>
                    </div>
                </div>

                {/* 4. Color Pickers Dinâmicos */}
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                    {aiData.header_bg_type === 'gradient' ? (
                        <div className="grid grid-cols-3 gap-2">
                            <ColorPicker label="Cor 1" value={aiData.header_grad_1 || "#ffffff"} onChange={(v: any) => handleInputChange("header_grad_1", v)} />
                            <ColorPicker label="Cor 2" value={aiData.header_grad_2 || "#f8fafc"} onChange={(v: any) => handleInputChange("header_grad_2", v)} />
                            <ColorPicker label="Links" value={aiData.header_text_color || textColor} onChange={(v: any) => handleInputChange("header_text_color", v)} />
                        </div>
                    ) : (
                        <div className="flex justify-around items-center">
                            <ColorPicker label="Fundo" value={aiData.header_bg || "#ffffff"} onChange={(v: any) => handleInputChange("header_bg", v)} />
                            <ColorPicker label="Links" value={aiData.header_text_color || textColor} onChange={(v: any) => handleInputChange("header_text_color", v)} />
                        </div>
                    )}
                </div>
            </div>

            {/* --- 3. COMPORTAMENTO FIXO --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-700 uppercase">Menu Fixo no Topo</span>
                    <small className="text-[9px] text-gray-400 italic">Segue a tela ao rolar</small>
                </div>
                <button
                    onClick={() => handleInputChange("header_sticky", !aiData.header_sticky)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${aiData.header_sticky ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${aiData.header_sticky ? 'left-6' : 'left-1'}`} />
                </button>
            </div>

            {/* --- 4. LINKS DO MENU (VISIBILIDADE) --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2 mb-2">
                    <Layout size={14} className="text-blue-600" /> Itens de Navegação
                </label>
                {menuItems.map((item) => {
                    const key = `show_${item.id}`;
                    const isVisible = aiData[key] !== false;
                    return (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-all border-b border-gray-50 last:border-0">
                            <span className="text-[11px] font-bold text-gray-600">{item.label}</span>
                            <button
                                onClick={() => handleInputChange(key, !isVisible)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${isVisible ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}
                            >
                                {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                <span className="text-[9px] font-black uppercase">{isVisible ? "Ativo" : "Oculto"}</span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* --- 5. BOTÃO DE AÇÃO (CTA) --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-700 uppercase">Botão de Destaque</span>
                        <small className="text-[9px] text-gray-400 italic">Posicionado à direita no menu</small>
                    </div>
                    <button
                        onClick={() => handleInputChange("header_show_cta_button", !aiData.header_show_cta_button)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${aiData.header_show_cta_button ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${aiData.header_show_cta_button ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {aiData.header_show_cta_button && (
                    <div className="space-y-3 pt-2 border-t border-gray-50 animate-in fade-in slide-in-from-top-1">
                        <input
                            type="text"
                            placeholder="Texto do Botão (ex: WhatsApp)"
                            className="w-full p-2.5 bg-gray-50 border rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-blue-500"
                            value={aiData.header_cta_text || ""}
                            onChange={(e) => handleInputChange("header_cta_text", e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <ColorPicker
                                label="Fundo"
                                value={aiData.header_cta_bg || "#22c55e"}
                                onChange={(v: string) => handleInputChange("header_cta_bg", v)}
                            />
                            <ColorPicker
                                label="Texto"
                                value={aiData.header_cta_color || "#ffffff"}
                                onChange={(v: string) => handleInputChange("header_cta_color", v)}
                            />
                        </div>

                        {/* Ajuste de Arredondamento para o Botão */}
                        <div className="pt-2">
                            <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between mb-1">
                                Arredondamento <span>{aiData.header_cta_radius || 8}px</span>
                            </label>
                            <input
                                type="range" min="0" max="30" step="2"
                                value={aiData.header_cta_radius || 8}
                                onChange={(e) => handleInputChange("header_cta_radius", parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};