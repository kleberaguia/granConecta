
import {
    Plus,
    Trash2,
    Layout,
    Palette,
    Briefcase,
    Type,
    Settings2
} from "lucide-react";
import { ColorPicker } from "./EditorUI"; // Mantendo seu padrão

export const ServicesEditor = ({ aiData, handleInputChange }: any) => {
    const services = aiData.services_items || [];

    const addService = () => {
        if (services.length < 8) { // Limite razoável para o grid
            const newService = {
                title: "Novo Serviço",
                desc: "Descreva brevemente o que você oferece.",
                icon: "fa-tools"
            };
            handleInputChange("services_items", [...services, newService]);
        }
    };

    const updateService = (index: number, field: string, value: string) => {
        const newServices = [...services];
        newServices[index] = { ...newServices[index], [field]: value };
        handleInputChange("services_items", newServices);
    };

    const removeService = (index: number) => {
        const filtered = services.filter((_: any, idx: number) => idx !== index);
        handleInputChange("services_items", filtered);
    };

    return (
        <div className="space-y-4">
            {/* CONFIGURAÇÕES GERAIS DA SEÇÃO */}
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings2 size={14} className="text-orange-500" />
                        <span className="text-[10px] font-black uppercase text-gray-500">Configuração da Seção</span>
                    </div>
                    {/* Switch de Visibilidade */}
                    <label className="relative inline-flex items-center cursor-pointer scale-75">
                        <input
                            type="checkbox"
                            checked={aiData.show_services !== false}
                            onChange={(e) => handleInputChange("show_services", e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                            <Layout size={10} /> Estilo
                        </label>
                        <select
                            value={aiData.services_mode || "cards"}
                            onChange={(e) => handleInputChange("services_mode", e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="cards">Cards Modernos</option>
                            <option value="list">Lista Executiva</option>
                            <option value="glass">Efeito Vidro (Dark)</option>
                            <option value="minimal">Bordas Minimalistas</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                            <Type size={10} /> Alinhamento
                        </label>
                        <select
                            value={aiData.services_align || "center"}
                            onChange={(e) => handleInputChange("services_align", e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold outline-none"
                        >
                            <option value="left">Esquerda</option>
                            <option value="center">Centralizado</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                    <input
                        value={aiData.services_title || ""}
                        onChange={(e) => handleInputChange("services_title", e.target.value)}
                        className="w-full font-bold text-[12px] bg-transparent outline-none placeholder:text-gray-300"
                        placeholder="Título da Seção (Ex: Nossos Serviços)"
                    />
                    <ColorPicker
                        label="Cor do Ícone"
                        value={aiData.services_icon_color || "#f39c12"}
                        onChange={(v: string) => handleInputChange("services_icon_color", v)}
                    />
                    <ColorPicker
                        label="Fundo da Seção de Serviços"
                        value={aiData.services_bg_section || "#ffffff"}
                        onChange={(v: string) => handleInputChange("services_bg_section", v)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                            <Palette size={10} /> Cor do Card
                        </label>
                        <ColorPicker
                            value={aiData.services_card_bg || "#ffffff"}
                            onChange={(v: string) => handleInputChange("services_card_bg", v)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                            <Type size={10} /> Tamanho Titulo
                        </label>
                        <select
                            value={aiData.services_title_size || "1.2rem"}
                            onChange={(e) => handleInputChange("services_title_size", e.target.value)}
                            className="w-full p-2 bg-gray-50 border rounded-lg text-[10px] font-bold outline-none"
                        >
                            <option value="1rem">Pequeno</option>
                            <option value="1.2rem">Médio</option>
                            <option value="1.5rem">Grande</option>
                            <option value="1.8rem">Extra</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1 mt-3">
                    <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                        <Palette size={10} /> Cor do Texto (Card)
                    </label>
                    <ColorPicker
                        value={aiData.services_card_text_color || "#1a252f"}
                        onChange={(v: string) => handleInputChange("services_card_text_color", v)}
                    />
                </div>
            </div>

            {/* ITENS DE SERVIÇO */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1 px-1">
                    <Briefcase size={12} className="text-gray-400" />
                    <span className="text-[9px] font-black uppercase text-gray-400">Serviços Listados</span>
                </div>

                {services.map((service: any, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-gray-100 relative group shadow-sm hover:border-orange-200 transition-colors">
                        <button
                            onClick={() => removeService(i)}
                            className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>

                        <div className="flex gap-3">
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <i className={`fas ${service.icon || 'fa-tools'} text-gray-400 text-[14px]`}></i>
                                </div>
                                <input
                                    value={service.icon}
                                    onChange={(e) => updateService(i, "icon", e.target.value)}
                                    className="w-12 text-[8px] text-center bg-gray-100 rounded p-1 outline-none"
                                    placeholder="fa-icon"
                                />
                            </div>

                            <div className="flex-1 space-y-2">
                                <input
                                    value={service.title}
                                    onChange={(e) => updateService(i, "title", e.target.value)}
                                    className="w-full font-bold text-[11px] bg-transparent outline-none focus:border-b focus:border-orange-300"
                                    placeholder="Título do Serviço"
                                />
                                <textarea
                                    value={service.desc}
                                    onChange={(e) => updateService(i, "desc", e.target.value)}
                                    className="w-full text-[10px] h-12 bg-gray-50 p-2 rounded-lg resize-none outline-none text-gray-600 border border-transparent focus:border-gray-200"
                                    placeholder="Breve descrição..."
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addService}
                    className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> NOVO SERVIÇO ({services.length}/8)
                </button>
            </div>
        </div>
    );
};