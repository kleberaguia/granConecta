import React, { useState, useEffect } from 'react';

// Supondo que você tenha um tipo para os horários
interface IMassSchedule {
  _id: string;
  dayOfWeek: string;
  massTime: string;
}

const WidgetMissas: React.FC = () => {
  const [schedules, setSchedules] = useState<IMassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Este componente busca seus PRÓPRIOS dados
    const fetchSchedules = async () => {
      try {
        // (Limitado a 3, por exemplo)
        //const response = await fetch('/api/mass-schedules?limit=3'); 
        const response = await fetch('/mock-mass-schedules.json')
        const data = await response.json();
        setSchedules(data);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  if (isLoading) {
    return <p>Carregando horários...</p>;
  }

  return (
    <div className="schedule-list">
      {schedules.map(schedule => (
        <div key={schedule._id} className="schedule-item">
          <span>{schedule.dayOfWeek}</span>
          <span>{schedule.massTime}</span>
        </div>
      ))}
    </div>
  );
};

export default WidgetMissas;