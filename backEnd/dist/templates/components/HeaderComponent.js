"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderComponent = void 0;
const HeaderComponent = ({ aiData }) => {
    const bgColor = aiData?.header_bg || '#ffffff';
    return `
        <header id="header-section" class="fixed top-0 w-full z-[100] border-b transition-all duration-300 shadow-sm" 
                style="background-color: ${bgColor}; min-height: 80px; display: flex; align-items: center;">
            
            <div class="max-w-7xl mx-auto px-6 w-full">
                <div class="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-4 py-2">
                    
                    <div class="area-left flex items-center h-full"></div>
                    
                    <div class="area-center flex justify-center items-center h-full"></div>
                    
                    <div class="area-right flex justify-end items-center h-full gap-4"></div>

                </div>
            </div>
        </header>
        <div id="header-spacer" style="height: 100px;"></div>
    `;
};
exports.HeaderComponent = HeaderComponent;
