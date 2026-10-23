// templates/components/FeaturesComponent.ts

interface FeaturesComponentProps {
  aiData: any;
  variant?: string;
  estilo?: any;
  tokens?: any;
}

export const FeaturesComponent = ({
  aiData,
  variant = "mjv-features",
  estilo,
  tokens
}: FeaturesComponentProps) => {

  const primary = estilo?.primary_color || "#DE1F5A";
  const cardBg = tokens?.cardBg || "rgba(255, 255, 255, 0.03)";
  const borderRadius = tokens?.borderRadius || "0px"; // Quadrados perfeitos como na foto

  // Extrai os blocos de vantagens vindo do JSON da inteligência artificial
  const recursos = aiData?.features || aiData?.beneficios || [
    { title: "LOREM IPSUM DOLOR", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec." },
    { title: "LOREM IPSUM DOLOR", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec." },
    { title: "LOREM IPSUM DOLOR", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec." }
  ];

  /**
   * =====================================================
   * VARIANT: GYM-IMPACT (Layout Idêntico à Foto da Academia)
   * =====================================================
   */
  const cardsHtml = recursos.map((item: any, index: number) => {
    // Garante o formato "01", "02", "03"
    const numeroItem = String(index + 1).padStart(2, '0');
    
    return `
      <div 
        class="relative p-8 bg-black/40 border transition-all duration-300 group"
        style="
          background: ${cardBg};
          border-color: ${primary}40;
          border-radius: ${borderRadius};
          backdrop-filter: blur(12px);
        "
        onmouseover="this.style.borderColor='${primary}'; this.style.boxShadow='0 0 30px ${primary}40'"
        onmouseout="this.style.borderColor='${primary}40'; this.style.boxShadow='none'"
      >
        <div 
          class="text-4xl font-black mb-4 tracking-tighter transition-transform duration-300 group-hover:scale-105 origin-left"
          style="color: ${primary}; font-style: italic;"
        >
          ${numeroItem}
        </div>

        <h3 class="text-white text-sm font-black uppercase tracking-wider mb-3">
          ${item.title || item.title_text || "LOREM IPSUM DOLOR"}
        </h3>

        <p class="text-gray-400 text-xs leading-relaxed m-0">
          ${item.description || item.text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec."}
        </p>
      </div>
    `;
  }).join("");

  return `
    <section id="features-section" class="py-20 bg-[#0E0E0E]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${cardsHtml}
        </div>
      </div>
    </section>
  `;
};