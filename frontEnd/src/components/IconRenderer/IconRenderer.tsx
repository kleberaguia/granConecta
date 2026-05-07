import React from 'react';
// 1. Importe os ícones que você vai usar da biblioteca
import { 
  Clock, 
  BookOpen, 
  Heart, 
  Calendar, 
  Sparkles // Um ícone "padrão"
} from 'lucide-react';

// 2. Defina as props
interface IconRendererProps {
  iconName: string | null;
  className?: string; // Para passar classes como 'card-icon'
}

// 3. Crie o componente
const IconRenderer: React.FC<IconRendererProps> = ({ iconName, className }) => {
  
  // 4. Use um 'switch' para decidir qual ícone renderizar
  switch (iconName) {
    case 'Clock':
      return <Clock className={className} />;
      
    case 'BookOpen':
      return <BookOpen className={className} />;

    case 'Heart':
      return <Heart className={className} />;

    case 'Calendar':
      return <Calendar className={className} />;

    // 5. Um 'default' caso o ícone no mock esteja errado
    default:
      return <Sparkles className={className} />;
  }
};

export default IconRenderer;