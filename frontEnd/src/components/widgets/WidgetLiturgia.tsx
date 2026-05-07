import React, { useState, useEffect } from 'react';
import { type ITodayLiturgy } from '../../interfaces/types'
import { truncateText } from '../../utils/text';

const WidgetLiturgia: React.FC = () => {
  const [liturgy, setLiturgy] = useState<ITodayLiturgy | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLiturgy = async () => {
      try {
       
        //const response = await fetch('/api/liturgy/today');
        const response  =  await fetch('/mock-liturgy-today.json')
        const data: ITodayLiturgy = await response.json()
        setLiturgy(data)

      } catch (error) {
        console.error("Erro ao buscar liturgia:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiturgy();
  }, []);

  if (isLoading) {
    return <p>Carregando Liturgia...</p>;
  }

  if (!liturgy) {
    return <p>Liturgia  de hoje não disponivel</p>
  }
  const snippet = truncateText(liturgy.reflection, 100);
  return (
    <div className="liturgy-widget">
      <h4>{liturgy.liturgyTitle}</h4>
      <p>
        {snippet}
      </p>
    </div>
  );
};

export default WidgetLiturgia;