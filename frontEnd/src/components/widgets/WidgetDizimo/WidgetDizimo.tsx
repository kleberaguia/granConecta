import React from 'react';
// 1. Importe o CSS Module
import style from './WidgetDizimo.module.css';

interface WidgetDizimoProps {
  textoDeApoio: string | null;
}

const WidgetDizimo: React.FC<WidgetDizimoProps> = ({ textoDeApoio }) => {
  return (
    // 2. Aplique a classe principal
    <div className={style.widgetContainer}>
      
      {/* O texto principal (que já deve estar branco) */}
      {textoDeApoio && <p>{textoDeApoio}</p>}
      
      {/* 3. As informações de PIX/Banco, agora com classes */}
      <div className={style.tithingInfo}>
        <p><strong>PIX:</strong> (seu-pix@email.com)</p>
        <p><strong>Banco:</strong> 001 | <strong>Ag:</strong> 1234 | <strong>CC:</strong> 56789-0</p>
      </div>
    </div>
  );
};

export default WidgetDizimo;