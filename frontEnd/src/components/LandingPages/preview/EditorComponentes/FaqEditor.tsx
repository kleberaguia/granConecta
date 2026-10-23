
import { HelpCircle, Trash2, Plus, Layout, Palette } from "lucide-react";
import { InputField } from "./EditorUI";
import { ColorPicker } from "./EditorComponent";

interface FaqEditorProps {
    aiData: any;
    handleInputChange: (field: string, value: any) => void;
}

export const FaqEditor = ({ aiData, handleInputChange }: FaqEditorProps) => {
    const faqs = aiData.faq || [];

    const addFaq = () => {
        const newFaq = { pergunta: "Nova Pergunta?", resposta: "Escreva a resposta aqui..." };
        handleInputChange("faq", [...faqs, newFaq]);
    };

    const updateFaq = (index: number, field: string, value: string) => {
        const newFaqs = [...faqs];
        newFaqs[index][field] = value;
        handleInputChange("faq", newFaqs);
    };

    const removeFaq = (index: number) => {
        handleInputChange("faq", faqs.filter((_: any, i: number) => i !== index));
    };

    return (
        <div className="space-y-6 pb-10"> {/* Adicionado padding bottom para evitar sobreposição no editor */}
            
            {/* CONFIGURAÇÕES DE ESTILO E ESPAÇAMENTO */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Layout size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Layout & Espaçamento</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400">Estilo Visual</label>
                        <select
                            value={aiData.faq_variant || "modern"}
                            onChange={(e) => handleInputChange("faq_variant", e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="modern">Cards Modernos</option>
                            <option value="minimal">Minimalista (Linhas)</option>
                            <option value="boxed">Boxed (Colorido)</option>
                            <option value="accordion">Acordeão Interativo</option>
                            <option value="split">Lado a Lado (Split)</option>
                            <option value="glass">Glassmorphism</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400">Margem Inferior (Bot)</label>
                        <select
                            value={aiData.faq_margin_bottom || "py-24"}
                            onChange={(e) => handleInputChange("faq_margin_bottom", e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] outline-none"
                        >
                            <option value="py-12">Pequeno</option>
                            <option value="py-24">Padrão</option>
                            <option value="py-32">Grande</option>
                            <option value="py-40">Extra Grande</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* CONFIGURAÇÕES DE CORES PERSONALIZADAS */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Palette size={14} className="text-pink-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Cores da Seção</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                        label="Fundo (BG)"
                        value={aiData.faq_bg_color || "#ffffff"}
                        onChange={(v: string) => handleInputChange("faq_bg_color", v)}
                    />
                    <ColorPicker
                        label="Título/Texto"
                        value={aiData.faq_text_color || "#111827"}
                        onChange={(v: string) => handleInputChange("faq_text_color", v)}
                    />
                    <ColorPicker
                        label="Destaque/Ícone"
                        value={aiData.faq_accent_color || "#F16622"}
                        onChange={(v: string) => handleInputChange("faq_accent_color", v)}
                    />
                    <ColorPicker
                        label="Fundo do Card"
                        value={aiData.faq_card_bg || "#f9fafb"}
                        onChange={(v: string) => handleInputChange("faq_card_bg", v)}
                    />
                </div>
            </div>

            {/* TÍTULO E CONTEÚDO */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <HelpCircle size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Conteúdo Principal</span>
                </div>

                <InputField
                    label="Título Principal"
                    value={aiData.faq_titulo || "Dúvidas Frequentes"}
                    onChange={(v: string) => handleInputChange("faq_titulo", v)}
                />
                
                <InputField
                    label="Subtítulo (Opcional)"
                    value={aiData.faq_subtitulo || ""}
                    onChange={(v: string) => handleInputChange("faq_subtitulo", v)}
                />
            </div>

            {/* LISTA DE PERGUNTAS */}
            <div className="space-y-3">
                {faqs.map((f: any, i: number) => (
                    <div
                        key={i}
                        className="p-4 bg-white rounded-2xl border border-gray-100 group relative shadow-sm hover:border-blue-200 transition-all animate-in fade-in slide-in-from-top-2"
                    >
                        <button
                            onClick={() => removeFaq(i)}
                            className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-red-50 z-10 hover:bg-red-50"
                        >
                            <Trash2 size={12} />
                        </button>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-bold text-gray-400 uppercase">Pergunta</label>
                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                    <input
                                        value={f.pergunta}
                                        onChange={(e) => updateFaq(i, "pergunta", e.target.value)}
                                        className="bg-transparent w-full font-bold text-[11px] outline-none text-gray-700"
                                        placeholder="Ex: Como funciona a entrega?"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[8px] font-bold text-gray-400 uppercase">Resposta</label>
                                <div className="flex gap-2 p-2 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <textarea
                                        value={f.resposta}
                                        onChange={(e) => updateFaq(i, "resposta", e.target.value)}
                                        className="w-full text-[11px] h-20 bg-transparent outline-none resize-none text-gray-500 leading-relaxed"
                                        placeholder="Sua resposta aqui..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addFaq}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                >
                    <div className="p-2 bg-gray-50 rounded-full group-hover:bg-blue-100 transition-colors">
                        <Plus size={20} className="text-gray-400 group-hover:text-blue-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-blue-600">Adicionar Pergunta</span>
                </button>
            </div>
        </div>
    );
};