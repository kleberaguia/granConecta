import React, { useState, useCallback } from "react";
import {
    Upload, Layout, Type, MousePointer2,
    AlignLeft, AlignCenter, AlignRight,
    Maximize, Search, Highlighter,
    Trash2,
    ChevronRight,
    Plus
} from "lucide-react";
import { InputField, ColorPicker } from "./EditorUI";
import toast from "react-hot-toast";

interface HeroEditorProps {
    aiData: any;
    handleInputChange: (field: string, value: any) => void;
    heroFileInputRef: React.RefObject<HTMLInputElement>;
    floatingFileInputRef: React.RefObject<HTMLInputElement>;
    primaryColor: string;
}

export const HeroEditor = ({
    aiData, handleInputChange, heroFileInputRef, primaryColor
}: HeroEditorProps) => {

    const [highlightWord, setHighlightWord] = useState("");
    const [highlightColor, setHighlightColor] = useState(primaryColor || "#3b82f6");
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const applyHighlight = useCallback(() => {
        if (!highlightWord || !aiData.titulo) {
            toast.error("Digite uma palavra para destacar");
            return;
        }
        const cleanTitle = aiData.titulo.replace(/<span.*?>(.*?)<\/span>/gi, '$1');
        const regex = new RegExp(`(${highlightWord})`, "gi");

        if (!regex.test(cleanTitle)) {
            toast.error("Palavra não encontrada no título");
            return;
        }

        const newTitle = cleanTitle.replace(regex, `<span style="color: ${highlightColor}">$1</span>`);
        handleInputChange("titulo", newTitle);
        setHighlightWord("");
        toast.success("Destaque aplicado!");
    }, [highlightWord, highlightColor, aiData.titulo, handleInputChange]);

    const addSlide = () => {
        const currentSlides = Array.isArray(aiData.hero_slides) ? aiData.hero_slides : [];
        const newSlide = {
            titulo: "Novo Slide de Impacto",
            subtitulo: "Descreva sua oferta aqui",
            bgUrl: aiData.bgUrl || "",
            buttonText: aiData.hero_button_text || "Saiba Mais"
        };

        const updatedSlides = [...currentSlides, newSlide];
        handleInputChange("hero_slides", updatedSlides);
        setActiveSlideIndex(updatedSlides.length - 1); // Foca no novo slide
        toast.success("Novo slide adicionado!");
    };

    const removeSlide = (index: number) => {
        if (aiData.hero_slides.length <= 1) {
            toast.error("Você precisa de pelo menos um slide");
            return;
        }
        const updatedSlides = aiData.hero_slides.filter((_: any, i: number) => i !== index);
        handleInputChange("hero_slides", updatedSlides);
        setActiveSlideIndex(0);
        toast.success("Slide removido");
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-10">

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <Layout size={16} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-gray-500">Gerenciar Slides</span>
                    </div>
                    <button
                        onClick={addSlide}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold hover:bg-blue-100 transition-all"
                    >
                        <Plus size={12} /> NOVO SLIDE
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {Array.isArray(aiData.hero_slides) && aiData.hero_slides.map((_slide: any, idx: number) => (
                        <div key={idx} className="relative flex-shrink-0">
                            <button
                                onClick={() => setActiveSlideIndex(idx)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 ${activeSlideIndex === idx ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                            >
                                Slide {idx + 1}
                                {activeSlideIndex === idx && <ChevronRight size={10} />}
                            </button>
                            {aiData.hero_slides.length > 1 && (
                                <button
                                    onClick={() => removeSlide(idx)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                >
                                    <Trash2 size={8} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- 1. ESTRUTURA, ALTURA E ESTILO --- */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Maximize size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Configurações de Layout</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Altura Hero</label>
                        <select value={aiData.hero_height || "85vh"} onChange={(e) => handleInputChange("hero_height", e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg text-[11px] font-bold outline-none">
                            <option value="60vh">Curto (60%)</option>
                            <option value="85vh">Padrão (85%)</option>
                            <option value="100vh">Tela Cheia (100%)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Posição Vertical</label>
                        <select value={aiData.hero_vertical || "center"} onChange={(e) => handleInputChange("hero_vertical", e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg text-[11px] font-bold outline-none">
                            <option value="top">Topo</option>
                            <option value="center">Centro</option>
                            <option value="bottom">Base</option>
                        </select>
                    </div>
                </div>

                {/* SELETOR DE MODO: CLASSIC VS SPLIT */}
                <div className="space-y-1 pt-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                        <Layout size={10} /> Estilo Visual do Hero
                    </label>
                    <select
                        value={aiData.hero_layout_mode || "classic"}
                        onChange={(e) => handleInputChange("hero_layout_mode", e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="classic">Tradicional (Fundo Inteiro)</option>
                        <option value="split">Split Moderno (Chapa de Cor)</option>
                    </select>
                </div>

                {/* CONFIGURAÇÕES ESPECÍFICAS DO MODO SPLIT */}
                {aiData.hero_layout_mode === 'split' && (
                    <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50/30 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-blue-600">Lado da Imagem</label>
                            <select
                                value={aiData.hero_img_position || "right"}
                                onChange={(e) => handleInputChange("hero_img_position", e.target.value)}
                                className="w-full p-2 bg-white border border-blue-200 rounded-lg text-[10px] font-bold"
                            >
                                <option value="right">Direita</option>
                                <option value="left">Esquerda</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-blue-600">Cor da Chapa</label>
                            <ColorPicker
                                value={aiData.hero_solid_color || primaryColor}
                                onChange={(v: string) => handleInputChange("hero_solid_color", v)}
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button onClick={() => handleInputChange("hero_bg_type", "image")} className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${aiData.hero_bg_type !== 'gradient' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>IMAGEM / FOTO</button>
                    <button onClick={() => handleInputChange("hero_bg_type", "gradient")} className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${aiData.hero_bg_type === 'gradient' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>DEGRADÊ PRO</button>
                </div>

                {aiData.hero_bg_type === 'gradient' ? (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-blue-50">
                        <div className="grid grid-cols-2 gap-2">
                            <ColorPicker label="Cor Inicial" value={aiData.hero_grad_1 || "#111111"} onChange={(v: string) => handleInputChange("hero_grad_1", v)} />
                            <ColorPicker label="Cor Final" value={aiData.hero_grad_2 || primaryColor} onChange={(v: string) => handleInputChange("hero_grad_2", v)} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div onClick={() => heroFileInputRef.current?.click()} className="relative h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-400 transition-all">
                            {aiData.bgUrl ? <img src={aiData.bgUrl} className="w-full h-full object-cover" /> : <div className="text-center"><Upload size={20} className="mx-auto text-gray-300 mb-1" /><span className="text-[9px] text-gray-400 font-bold uppercase">Subir Foto Background</span></div>}
                        </div>
                        <input type="file" ref={heroFileInputRef} className="hidden" accept="image/*" onChange={(e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => handleInputChange("bgUrl", reader.result);
                                reader.readAsDataURL(file);
                            }
                        }} />
                        <div className="p-2 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Opacidade do Filtro (Overlay)</label>
                                <span className="text-[10px] font-bold text-blue-600">{Math.round((aiData.hero_overlay_opacity ?? 0.4) * 100)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={aiData.hero_overlay_opacity ?? 0.4} onChange={(e) => handleInputChange("hero_overlay_opacity", parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg accent-blue-600 appearance-none cursor-pointer" />
                        </div>
                    </div>
                )}
            </div>

            {/* --- 2. TEXTOS E DESTAQUE --- */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Type size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Conteúdo & Copywriting</span>
                </div>

                <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <InputField
                        label="Texto do Badge"
                        value={aiData.hero_badge}
                        onChange={(v: string) => handleInputChange("hero_badge", v)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <ColorPicker
                            label="Fundo do Badge"
                            value={aiData.hero_badge_bg || primaryColor}
                            onChange={(v: string) => handleInputChange("hero_badge_bg", v)}
                        />
                        <ColorPicker
                            label="Cor do Texto"
                            value={aiData.hero_badge_color || "#ffffff"}
                            onChange={(v: string) => handleInputChange("hero_badge_color", v)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400">Fonte do Badge</label>
                        <select
                            value={aiData.hero_badge_font || "Montserrat"}
                            onChange={(e) => handleInputChange("hero_badge_font", e.target.value)}
                            className="w-full p-2 bg-white border rounded-lg text-[10px] font-bold outline-none"
                        >
                            <option value="Montserrat">Montserrat (Moderno)</option>
                            <option value="Inter">Inter (Clean)</option>
                            <option value="Fredoka One">Fredoka (Arredondado)</option>
                            <option value="Roboto">Roboto (Padrão)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <InputField label="Título do Hero" value={aiData.titulo} onChange={(v: string) => handleInputChange("titulo", v)} isLong />

                    {/* FERRAMENTA DE DESTAQUE */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-1">
                                <Highlighter size={10} /> Colorir palavra no título
                            </p>
                            <button
                                onClick={() => handleInputChange("titulo", aiData.titulo.replace(/<span.*?>(.*?)<\/span>/gi, '$1'))}
                                className="text-[8px] font-bold text-gray-400 hover:text-red-500 uppercase"
                            >
                                Limpar Destaques
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Digite a palavra exata..."
                                value={highlightWord}
                                onChange={(e) => setHighlightWord(e.target.value)}
                                className="w-full p-2 bg-white border border-blue-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center gap-2 bg-white p-1.5 rounded-lg border border-blue-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase ml-1">Cor:</span>
                                    <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="w-full h-6 rounded cursor-pointer border-none bg-transparent" />
                                </div>
                                <button onClick={applyHighlight} className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-blue-700 shadow-sm transition-all">Aplicar Cor</button>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLES DE COR, TAMANHO E FONTE */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Cor Título" value={aiData.hero_title_color || "#1a1a1a"} onChange={(v: string) => handleInputChange("hero_title_color", v)} />
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between">Tamanho <span>{aiData.hero_title_size || "52px"}</span></label>
                                <input type="range" min="30" max="100" value={parseInt(aiData.hero_title_size || "52")} onChange={(e) => handleInputChange("hero_title_size", e.target.value + "px")} className="w-full h-1 bg-gray-200 rounded-lg accent-blue-600 appearance-none cursor-pointer" />
                            </div>
                        </div>

                        {/* SELETOR DE FONTES MODERNAS */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                                <Type size={10} /> Fonte do Título
                            </label>
                            <select
                                value={aiData.hero_title_font || "Montserrat"}
                                onChange={(e) => handleInputChange("hero_title_font", e.target.value)}
                                className="w-full p-2 bg-white border rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Montserrat">Montserrat (Moderna/SaaS)</option>
                                <option value="Plus Jakarta Sans">Jakarta Sans (Trend 2026)</option>
                                <option value="Playfair Display">Playfair (Serifada Luxo)</option>
                                <option value="Syne">Syne (Artística/Impacto)</option>
                                <option value="Inter">Inter (Minimalista)</option>
                                <option value="Outfit">Outfit (Geométrica)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                    <InputField label="Subtítulo" value={aiData.subtitulo} onChange={(v: string) => handleInputChange("subtitulo", v)} isLong />
                    <div className="grid grid-cols-2 gap-3">
                        <ColorPicker label="Cor Sub" value={aiData.hero_sub_color || "#444444"} onChange={(v: string) => handleInputChange("hero_sub_color", v)} />
                        <div className="flex-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between">Tamanho <span>{aiData.hero_sub_size || "18px"}</span></label>
                            <input type="range" min="14" max="40" value={parseInt(aiData.hero_sub_size || "18")} onChange={(e) => handleInputChange("hero_sub_size", e.target.value + "px")} className="w-full h-1 bg-gray-100 rounded-lg accent-blue-600 appearance-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 3. BOTÃO E BUSCA --- */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <MousePointer2 size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Personalizar Botão (CTA)</span>
                </div>

                <InputField label="Texto do Botão" value={aiData.hero_button_text} onChange={(v: string) => handleInputChange("hero_button_text", v)} />

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between">Largura <span>{aiData.hero_button_padding_x || "35px"}</span></label>
                        <input type="range" min="15" max="100" step="5" value={parseInt(aiData.hero_button_padding_x || "35")} onChange={(e) => handleInputChange("hero_button_padding_x", e.target.value + "px")} className="w-full h-1 bg-gray-100 rounded-lg accent-blue-600 appearance-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase flex justify-between">Arredondar <span>{aiData.hero_button_radius || "8px"}</span></label>
                        <input type="range" min="0" max="50" step="2" value={parseInt(aiData.hero_button_radius || "8")} onChange={(e) => handleInputChange("hero_button_radius", e.target.value + "px")} className="w-full h-1 bg-gray-100 rounded-lg accent-blue-600 appearance-none" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <ColorPicker label="Cor Fundo" value={aiData.hero_button_bg || primaryColor} onChange={(v: string) => handleInputChange("hero_button_bg", v)} />
                    <ColorPicker label="Cor Texto" value={aiData.hero_button_color || "#ffffff"} onChange={(v: string) => handleInputChange("hero_button_color", v)} />
                </div>

                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-100 mt-2">
                    <div className="flex items-center gap-2 text-yellow-700">
                        <Search size={14} />
                        <span className="text-[10px] font-bold uppercase">Barra de Busca</span>
                    </div>
                    <button onClick={() => handleInputChange("hero_show_search", !aiData.hero_show_search)} className={`w-8 h-4 rounded-full relative transition-colors ${aiData.hero_show_search ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${aiData.hero_show_search ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                </div>
            </div>

            {/* --- 4. EXIBIÇÃO E ALINHAMENTO --- */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlignLeft size={16} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-gray-500">Alinhamento do Texto</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                        {['left', 'center', 'right'].map((align) => (
                            <button key={align} onClick={() => handleInputChange("hero_align", align)} className={`py-1.5 px-3 rounded-lg flex justify-center transition-all ${aiData.hero_align === align ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                {align === 'left' ? <AlignLeft size={14} /> : align === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};