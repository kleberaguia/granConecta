import {Trash2, Layout, Palette} from "lucide-react";
import { ColorPicker } from "./EditorUI"; // Assumindo que tens este componente

export const TestimonialsEditor = ({ aiData, handleInputChange }: any) => {
    const testimonials = aiData.testimonials || [];

    const addTestimonial = () => {
        if (testimonials.length < 6) { // Limite de 6 para não quebrar o layout
            const newTest = { nome: "Novo Cliente", texto: "Adorei o resultado!", cargo: "Cliente" };
            handleInputChange("testimonials", [...testimonials, newTest]);
        }
    };

    const updateTestimonial = (index: number, field: string, value: string) => {
        const newTests = [...testimonials];
        newTests[index] = { ...newTests[index], [field]: value };
        handleInputChange("testimonials", newTests);
    };

    return (
        <div className="space-y-4">
            {/* CONFIGURAÇÕES GERAIS */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Palette size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Aparência</span>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                        <Layout size={10} /> Estilo do Layout
                    </label>
                    <select 
                        value={aiData.test_style || "cards"}
                        onChange={(e) => handleInputChange("test_style", e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="cards">Cards Modernos (Grid)</option>
                        <option value="minimal">Lista Minimalista</option>
                        <option value="bubble">Bolhas de Conversa</option>
                    </select>
                </div>

                <ColorPicker 
                    label="Cor de Fundo da Secção"
                    value={aiData.test_bg_color || "#ffffff"}
                    onChange={(v: string) => handleInputChange("test_bg_color", v)}
                />
            </div>

            {/* LISTA DE DEPOIMENTOS */}
            <div className="space-y-3">
                {testimonials.map((t: any, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-gray-100 relative group shadow-sm">
                        <button 
                            onClick={() => handleInputChange("testimonials", testimonials.filter((_: any, idx: number) => idx !== i))}
                            className="absolute -top-2 -right-2 p-1 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={10} />
                        </button>
                        
                        <div className="space-y-2">
                            <input 
                                value={t.nome} 
                                onChange={(e) => updateTestimonial(i, "nome", e.target.value)}
                                className="w-full font-bold text-[11px] bg-transparent outline-none border-b border-transparent focus:border-blue-200"
                                placeholder="Nome do Cliente"
                            />
                            <textarea 
                                value={t.texto} 
                                onChange={(e) => updateTestimonial(i, "texto", e.target.value)}
                                className="w-full text-[10px] h-14 bg-gray-50 p-2 rounded-lg resize-none outline-none text-gray-600"
                                placeholder="O depoimento..."
                            />
                        </div>
                    </div>
                ))}

                <button onClick={addTestimonial} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all">
                    + ADICIONAR DEPOIMENTO ({testimonials.length}/6)
                </button>
            </div>
        </div>
    );
};