
import { Eye, EyeOff } from "lucide-react";

// Input Padrão
export const InputField = ({ label, value, onChange, isLong = false }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
    {isLong ? (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm h-20 outline-none focus:ring-2 ring-blue-500/20 transition-all"
      />
    ) : (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
      />
    )}
  </div>
);

// Seletor de Cores
export const ColorPicker = ({ label, value, onChange }: any) => (
  <div className="flex flex-col items-center gap-1">
    <label className="text-[8px] font-bold text-gray-400 uppercase">{label}</label>
    <input 
      type="color" 
      value={value || "#ffffff"} 
      onChange={(e) => onChange(e.target.value)} 
      className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform p-0 bg-transparent" 
    />
  </div>
);

// Toggle de Visibilidade da Seção
export const SectionToggle = ({ section, aiData, onToggle }: any) => {
  const isVisible = aiData[`show_${section}`] !== false;
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onToggle(`show_${section}`, !isVisible); }} 
      className={`p-1.5 rounded-lg transition-all ${isVisible ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-100'}`}
    >
      {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
    </button>
  );
};