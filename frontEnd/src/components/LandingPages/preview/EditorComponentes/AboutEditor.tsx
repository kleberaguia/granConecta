import { useRef } from "react"; // 1. Importe o useRef
import { Info, AlignLeft, Plus, Trash2, Upload } from "lucide-react";
import { InputField } from "./EditorUI";
import { ColorPicker } from "./EditorComponent";

export const AboutEditor = ({ aiData, handleInputChange }: any) => {
    // 2. Declare o ref aqui dentro
    const sobreFileInputRef = useRef<HTMLInputElement>(null);

    const hasContent = aiData.sobre_titulo || aiData.sobre_texto;

    const handleAdd = () => {
        handleInputChange("sobre_titulo", "Nossa História");
        handleInputChange("sobre_texto", "Escreva aqui a trajetória da sua empresa...");
        handleInputChange("show_sobre", true);
    };

    const handleRemove = () => {
        handleInputChange("sobre_titulo", "");
        handleInputChange("sobre_texto", "");
        handleInputChange("sobre_img_url", "");
        handleInputChange("show_sobre", false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <ColorPicker
                    label="Cor de Fundo"
                    value={aiData.sobre_bg_color || "#f9fafb"}
                    onChange={(v: string) => handleInputChange("sobre_bg_color", v)}
                />
                <p className="text-[8px] text-gray-400 uppercase font-bold">Destaque a seção</p>
            </div>
            {!hasContent ? (
                <button
                    onClick={handleAdd}
                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                >
                    <Plus size={24} className="text-gray-400 group-hover:text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-blue-700 tracking-widest">
                        Inserir Seção Sobre
                    </span>
                </button>
            ) : (
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4 relative">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Conteúdo Institucional</span>
                        </div>
                        <button onClick={handleRemove} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <InputField
                        label="Título da Seção"
                        value={aiData.sobre_titulo}
                        onChange={(v: string) => handleInputChange("sobre_titulo", v)}
                        placeholder="Ex: Nossa História"
                    />

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1 mb-1">
                            <AlignLeft size={10} /> Descrição
                        </label>
                        <textarea
                            value={aiData.sobre_texto}
                            onChange={(e) => handleInputChange("sobre_texto", e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-[11px] h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    {/* --- CAMPO DE IMAGEM ADICIONADO --- */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-400">Imagem Lateral</label>
                        <div
                            onClick={() => sobreFileInputRef.current?.click()}
                            className="relative h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-400 transition-all"
                        >
                            {aiData.sobre_img_url ? (
                                <img src={aiData.sobre_img_url} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <>
                                    <Upload size={16} className="text-gray-300 mb-1" />
                                    <span className="text-[8px] text-gray-400 font-bold uppercase">Subir Foto Lateral</span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={sobreFileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e: any) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => handleInputChange("sobre_img_url", reader.result);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};