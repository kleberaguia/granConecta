
import { Store, Link2 } from "lucide-react";
import { InputField } from ".//EditorComponentes/EditorUI";

export const StoreSettingsEditor = ({ aiData, handleInputChange }: any) => {
  return (
    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Store size={14} className="text-blue-600" />
        <span className="text-[10px] font-black uppercase text-gray-500">Configurações de Publicação</span>
      </div>

      <InputField
        label="Nome da Loja / Negócio"
        value={aiData.store_name}
        onChange={(v: string) => handleInputChange("store_name", v)}
        placeholder="Ex: Pizzaria do Bairro"
      />

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
          <Link2 size={10} /> Link do Site (Slug)
        </label>
        <div className="flex items-center bg-gray-50 rounded-lg px-3 border border-gray-200">
          <span className="text-[10px] text-gray-400">meusite.com/</span>
          <input
            type="text"
            value={aiData.store_slug}
            onChange={(e) => handleInputChange("store_slug", e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            className="flex-1 p-2 bg-transparent text-xs font-bold outline-none"
            placeholder="nome-da-loja"
          />
        </div>
      </div>

      <InputField
        label="WhatsApp para Atendimento"
        value={aiData.store_whatsapp}
        onChange={(v: string) => handleInputChange("store_whatsapp", v)}
        placeholder="Ex: 11999999999"
      />
    </div>
  );
};