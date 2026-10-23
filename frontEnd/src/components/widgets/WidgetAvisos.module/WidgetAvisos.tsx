import React, { useState, useEffect } from 'react';
// 1. Importe o CSS Module
import style from './WidgetAvisos.module.css';

// (Você pode mover esta interface para seu types.ts)
interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
}

const WidgetAvisos: React.FC = () => {
  // 2. Estados para dados e loading
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Lógica de 'fetch'
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/mock-announcements.json');
        const data = await response.json();
        setAnnouncements(data.slice(0, 3)); 

      } catch (error) {
        console.error("Erro ao buscar avisos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // 5. Renderização do Loading
  if (isLoading) {
    return <p>Carregando avisos...</p>;
  }

  // 6. Renderização de "Vazio"
  if (announcements.length === 0) {
    return <p>Nenhum aviso no momento.</p>;
  }

  // 7. Renderização da Lista
  return (
    <div className={style.listContainer}>
      {announcements.map(item => (
        <div key={item._id} className={style.item}>
          <h4 className={style.title}>{item.title}</h4>
          <p className={style.content}>{item.content}</p>
        </div>
      ))}
    </div>
  );
};

export default WidgetAvisos;