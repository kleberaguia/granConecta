
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

// 1. O CONTAINER SANFONADO (ACCORDION)
export const AccordionItem = ({ title, id, active, onToggle, children, icon, action }: any) => {
  const isOpen = active === id;
  return (
    <div className={`border rounded-2xl transition-all mb-2 ${isOpen ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100 bg-white shadow-sm'}`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer" 
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center gap-3">
          <span className={isOpen ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
          <span className={`text-[11px] font-black uppercase tracking-wider ${isOpen ? 'text-blue-600' : 'text-gray-700'}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {isOpen ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// 2. O INPUT DE TEXTO PADRONIZADO
export const InputField = ({ label, value, onChange, isLong = false }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
    {isLong ? (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-20 outline-none focus:ring-2 ring-blue-500/20 transition-all resize-none"
      />
    ) : (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
      />
    )}
  </div>
);

// 3. O SELETOR DE CORES REDONDO
export const ColorPicker = ({ label, value, onChange }: any) => (
  <div className="flex flex-col items-center gap-1">
    <label className="text-[8px] font-bold text-gray-400 uppercase">{label}</label>
    <div className="relative group">
      <input 
        type="color" 
        value={value || "#ffffff"} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-9 h-9 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform p-0 bg-transparent overflow-hidden" 
      />
    </div>
  </div>
);

// 4. O TOGGLE DE VISIBILIDADE (OLHINHO)
export const SectionToggle = ({ section, aiData, onToggle }: any) => {
  const isVisible = aiData[`show_${section}`] !== false;
  return (
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        onToggle(`show_${section}`, !isVisible); 
      }} 
      className={`p-1.5 rounded-lg transition-all ${isVisible ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}
    >
      {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
    </button>
  );
};