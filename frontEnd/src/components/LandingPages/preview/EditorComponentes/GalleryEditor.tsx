import React, { useState, useCallback } from "react";
import { Image as ImageIcon, Trash2, Plus, Layout, Type, Target, Bold, Italic, Loader2 } from "lucide-react";
import { InputField, ColorPicker } from "./EditorUI";
import api from "../../../../api/api"; 
import toast from "react-hot-toast";

interface GalleryEditorProps {
    aiData: any;
    handleInputChange: (field: string, value: any) => void;
    galleryFileInputRef: React.RefObject<HTMLInputElement>;
}

export const GalleryEditor = ({
    aiData,
    handleInputChange,
    galleryFileInputRef,
}: GalleryEditorProps) => {
    const [isUploading, setIsUploading] = useState(false);

    // ✅ UPLOAD OTIMIZADO: Evita duplicidade e trata erros de rede
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Imagem muito grande! Máximo 5MB.");
            return;
        }

        setIsUploading(true);
        const loadingToast = toast.loading("Enviando para seu portfólio...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post("/lojas/store/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const imageUrl = response.data.url || response.data.path;

            if (imageUrl) {
                const currentGallery = Array.isArray(aiData.galeria) ? [...aiData.galeria] : [];
                handleInputChange("galeria", [
                    ...currentGallery, 
                    { url: imageUrl, caption: "" }
                ]);
                toast.success("Trabalho adicionado!", { id: loadingToast });
            }
        } catch (err) {
            toast.error("Falha no upload.", { id: loadingToast });
        } finally {
            setIsUploading(false);
            e.target.value = ""; // Limpa o input para permitir subir a mesma foto se necessário
        }
    };

    const removeImage = useCallback((index: number) => {
        const newGallery = aiData.galeria.filter((_: any, i: number) => i !== index);
        handleInputChange("galeria", newGallery);
    }, [aiData.galeria, handleInputChange]);

    return (
        <div className="space-y-4">
            {/* --- 1. CABEÇALHO DINÂMICO --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Type size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Configuração de Título</span>
                </div>

                <InputField
                    label="Título da Galeria (Portfólio)"
                    value={aiData.galeria_titulo || "Nossos Trabalhos"}
                    onChange={(v: string) => handleInputChange("galeria_titulo", v)}
                    placeholder="Ex: Projetos Realizados, Antes e Depois..."
                />

                <div className="grid grid-cols-2 gap-3">
                    <ColorPicker 
                        label="Cor do Título"
                        value={aiData.galeria_title_color || "#1a1a1a"}
                        onChange={(v: string) => handleInputChange("galeria_title_color", v)}
                    />
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Estilo</label>
                        <div className="flex gap-1 h-8">
                            <button
                                onClick={() => handleInputChange("galeria_title_bold", !aiData.galeria_title_bold)}
                                className={`flex-1 rounded-lg border flex items-center justify-center transition-all ${aiData.galeria_title_bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                                <Bold size={12} />
                            </button>
                            <button
                                onClick={() => handleInputChange("galeria_title_italic", !aiData.galeria_title_italic)}
                                className={`flex-1 rounded-lg border flex items-center justify-center transition-all ${aiData.galeria_title_italic ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                                <Italic size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 2. LAYOUT E AMBIENTE --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Layout size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Aparência Visual</span>
                </div>

                <select
                    value={aiData.gallery_layout || "modern-card"}
                    onChange={(e) => handleInputChange("gallery_layout", e.target.value)}
                    className="w-full p-2 bg-gray-50 border rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="modern-card">📐 Grid (Equilibrado)</option>
                    <option value="masonry">🎨 Mosaico (Dinâmico)</option>
                    <option value="carousel">🎞️ Carrossel (Horizontal)</option>
                    <option value="polaroid">📸 Estilo Polaroid (Retrô)</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                        label="Fundo Seção"
                        value={aiData.galeria_bg_color || "#ffffff"}
                        onChange={(v: string) => handleInputChange("galeria_bg_color", v)}
                    />
                    <div className="flex flex-col justify-center gap-1">
                         <label className="text-[9px] font-black text-gray-400 uppercase">Degradê?</label>
                         <button 
                            onClick={() => handleInputChange("galeria_bg_gradient_active", !aiData.galeria_bg_gradient_active)}
                            className={`w-full py-1 rounded border text-[9px] font-bold uppercase transition-all ${aiData.galeria_bg_gradient_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                         >
                            {aiData.galeria_bg_gradient_active ? 'Ativado' : 'Desativado'}
                         </button>
                    </div>
                </div>
            </div>

            {/* --- 3. GERENCIADOR DE PORTFÓLIO --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={14} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-gray-500">Imagens ({aiData.galeria?.length || 0})</span>
                    </div>
                    <button
                        disabled={isUploading}
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        ADICIONAR
                    </button>
                    <input type="file" ref={galleryFileInputRef} className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {aiData.galeria?.map((item: any, idx: number) => (
                        <div key={idx} className="group relative aspect-square rounded-lg border overflow-hidden shadow-sm bg-gray-50">
                            <img src={item.url || item} className="w-full h-full object-cover" alt="" />
                            <button
                                onClick={() => removeImage(idx)}
                                className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {(!aiData.galeria || aiData.galeria.length === 0) && (
                        <div className="col-span-4 py-8 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-300">
                             <ImageIcon size={24} className="mb-2 opacity-20" />
                             <span className="text-[9px] font-bold uppercase">Nenhum trabalho postado</span>
                        </div>
                    )}
                </div>

                {/* --- EDITOR DE LEGENDAS (Aumenta o SEO e Prova Social) --- */}
                {aiData.galeria?.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-50 max-h-40 overflow-y-auto custom-scrollbar">
                        {aiData.galeria.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                <img src={item.url || item} className="w-6 h-6 rounded object-cover" />
                                <input
                                    type="text"
                                    value={item.caption || ""}
                                    placeholder="Descreva este trabalho..."
                                    onChange={(e) => {
                                        const newGal = [...aiData.galeria];
                                        newGal[idx] = { ...newGal[idx], caption: e.target.value };
                                        handleInputChange("galeria", newGal);
                                    }}
                                    className="flex-1 bg-transparent text-[10px] outline-none font-medium border-none focus:ring-0"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 4. CTA DE CONVERSÃO DA GALERIA --- */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Target size={14} className="text-green-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Ação pós-Galeria</span>
                </div>

                <InputField
                    label="Chamada (CTA)"
                    value={aiData.gallery_cta_text || "Solicitar Orçamento Agora"}
                    onChange={(v: string) => handleInputChange("gallery_cta_text", v)}
                />
                <div className="grid grid-cols-2 gap-2">
                    <ColorPicker label="Fundo Botão" value={aiData.gallery_cta_bg || "#3b82f6"} onChange={(v:any) => handleInputChange("gallery_cta_bg", v)} />
                    <ColorPicker label="Cor do Texto" value={aiData.gallery_cta_text_color || "#ffffff"} onChange={(v:any) => handleInputChange("gallery_cta_text_color", v)} />
                </div>
            </div>
        </div>
    );
};