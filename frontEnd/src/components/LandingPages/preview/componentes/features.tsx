export const injectFeatures = (doc: Document, data: any, primaryColor: string) => {
    // 1. Localiza a seção de Benefícios/Features
    const featSection = (doc.getElementById("features-section") || doc.querySelector('section[id*="features"]') || doc.querySelector('section[id*="beneficios"]')) as HTMLElement;
    if (!featSection) return;

    // 2. Aplica a cor de fundo da seção
    if (data.features_bg_color) {
        featSection.style.setProperty('background-color', data.features_bg_color, 'important');
    }

    // 3. Busca ou cria o container de grid para os cards
    let container = (featSection.querySelector('.grid, #features-grid, [class*="grid"]') || featSection.querySelector('.flex-wrap')) as HTMLElement;
    
    if (!container && data.beneficios) {
        container = doc.createElement('div');
        container.id = "features-grid";
        container.className = "grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto p-8";
        featSection.appendChild(container);
    }

    if (container && data.beneficios) {
        const layout = data.features_layout || "modern-card";
        const cardBg = data.features_card_bg || "#ffffff";
        
        // Função auxiliar para contraste automático do texto no card
        const getCardTextColor = (hex: string) => {
            const r = parseInt(hex.substring(1, 3), 16), g = parseInt(hex.substring(3, 5), 16), b = parseInt(hex.substring(5, 7), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq < 128) ? '#ffffff' : '#111827';
        };

        const textColor = getCardTextColor(cardBg);

        // 4. Configura o grid baseado no layout
        container.style.display = "grid";
        container.className = "grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto p-8";

        // 5. Renderiza os Benefícios
        container.innerHTML = data.beneficios.map((item: any) => {
            let cardStyle = "";
            
            // Definição visual baseada no Layout escolhido no Editor
            switch (layout) {
                case 'minimal': 
                    cardStyle = `border: 1px solid #e5e7eb; background: ${cardBg}; box-shadow: none;`; break;
                case 'glass': 
                    cardStyle = `backdrop-filter: blur(10px); background: ${cardBg}aa; border: 1px solid #ffffff33;`; break;
                case 'flat': 
                    cardStyle = `background: ${cardBg}; box-shadow: none; border: none;`; break;
                default: // modern-card
                    cardStyle = `background: ${cardBg}; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #f3f4f6;`;
            }

            return `
                <div class="p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 group h-full flex flex-col" style="${cardStyle}">
                    
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" 
                         style="background-color: ${primaryColor}15; min-width: 48px;">
                        <svg class="w-6 h-6" style="color: ${primaryColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>

                    <div style="color: ${textColor}">
                        <h3 class="text-xl font-bold mb-4" style="color: inherit;">${item.titulo || 'Novo Benefício'}</h3>
                        <p class="leading-relaxed opacity-80" style="color: inherit;">${item.descricao || 'Descrição do diferencial.'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
};