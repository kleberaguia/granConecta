import { ChevronUp, ChevronDown, GripVertical, Eye, EyeOff } from "lucide-react";
export const SortableSections = ({ aiData, handleInputChange }: any) => {
  const sections = aiData.sectionOrder || ['header', 'hero', 'gallery', 'cta', 'footer'];
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sections];
    const nextIndex = direction === 'up' ? index - 1 : index + 1;

    if (nextIndex < 0 || nextIndex >= newOrder.length) return;
    [newOrder[index], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[index]];
    handleInputChange("sectionOrder", newOrder);
  };

  const toggleVisibility = (sectionId: string) => {
    const field = `show_${sectionId}`;
    handleInputChange(field, aiData[field] === false ? true : false);
  };

  return (
    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
      <h3 className="text-[10px] font-black uppercase text-gray-400 mb-3 ml-1 flex items-center gap-2">
        <GripVertical size={14} /> Organizar Estrutura do Site
      </h3>
      
      {sections.map((id: string, index: number) => (
        <div 
          key={id} 
          className="flex items-center justify-between bg-white p-2 px-3 rounded-xl border border-gray-100 shadow-sm group transition-all hover:border-blue-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-gray-700 capitalize">
              {id === 'cta' ? 'Chamada (CTA)' : id}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Botão Visibilidade */}
            <button 
              onClick={() => toggleVisibility(id)}
              className={`p-1.5 rounded-lg transition-colors ${aiData[`show_${id}`] === false ? 'text-red-400 bg-red-50' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              {aiData[`show_${id}`] === false ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>

            {/* Setas de Ordenação */}
            <div className="flex flex-col">
              <button 
                disabled={index === 0}
                onClick={() => moveSection(index, 'up')}
                className="text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
              >
                <ChevronUp size={16} />
              </button>
              <button 
                disabled={index === sections.length - 1}
                onClick={() => moveSection(index, 'down')}
                className="text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};