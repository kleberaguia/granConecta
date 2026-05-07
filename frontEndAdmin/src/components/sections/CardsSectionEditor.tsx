import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ScheduleIcon from '@mui/icons-material/Schedule';

// --- TIPAGEM DE UM CARD ---
interface CardItem {
  id: string;
  day: string;
  time: string;
  description: string;
}

// --- TIPAGEM DO COMPONENTE ---
interface CardsSectionEditorProps {
  data: {
    cards: CardItem[];
  };
  onChange: (newData: { cards: CardItem[] }) => void;
}

export default function CardsSectionEditor({
  data,
  onChange,
}: CardsSectionEditorProps) {
  
  const [cards, setCards] = useState<CardItem[]>(data.cards || []);

  // --- FUNÇÃO AUXILIAR PARA ATUALIZAR TUDO DE UMA VEZ ---
  const updateCards = (newCards: CardItem[]) => {
    setCards(newCards); // Atualiza visualmente
    onChange({ cards: newCards }); // Avisa o pai imediatamente
  };

  // 1. Manipula mudanças em um campo específico
  const handleCardChange = (index: number, field: keyof CardItem, value: string) => {
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    updateCards(updatedCards);
  };
  
  // 2. Adicionar novo card vazio
  const handleAddCard = () => {
    const newCard: CardItem = {
      // Dica: Adicionei um random para garantir que o ID nunca repita se clicar muito rápido
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      day: '',
      time: '',
      description: '',
    };
    updateCards([...cards, newCard]);
  };

  // 3. Remover card
  const handleRemoveCard = (indexToRemove: number) => {
    const updatedCards = cards.filter((_, index) => index !== indexToRemove);
    updateCards(updatedCards);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Gerenciador de Horários (Cards)</Typography>

      <Button 
        variant="contained" 
        startIcon={<ScheduleIcon />} 
        onClick={handleAddCard} 
        sx={{ mb: 2 }}
      >
        Adicionar Horário
      </Button>

      {/* Lista de Cards */}
      {cards.map((card, index) => (
        <Paper key={card.id} elevation={2} sx={{ p: 2, mb: 2, borderLeft: '4px solid #f9a825', bgcolor: '#fff' }}>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                Horário #{index + 1}
            </Typography>
            <IconButton color="error" onClick={() => handleRemoveCard(index)} size="small">
              <DeleteIcon />
            </IconButton>
          </Box>
          
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Dia (ex: Domingo)"
              size="small"
              value={card.day}
              onChange={(e) => handleCardChange(index, 'day', e.target.value)}
              sx={{ flex: 1 }}
              placeholder="Domingo"
            />
            <TextField
              label="Hora (ex: 19:00)"
              size="small"
              value={card.time}
              onChange={(e) => handleCardChange(index, 'time', e.target.value)}
              sx={{ width: '120px' }} // Tamanho fixo menor para hora fica elegante
              placeholder="00:00"
            />
          </Box>
          
          <TextField
            label="Descrição (Tipo de Missa/Local)"
            size="small"
            fullWidth
            multiline
            rows={1}
            value={card.description}
            onChange={(e) => handleCardChange(index, 'description', e.target.value)}
            placeholder="Missa da Família - Matriz"
          />

        </Paper>
      ))}
      
      {cards.length === 0 && (
         <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed #ccc', borderRadius: 2, color: '#999' }}>
            Nenhum horário cadastrado. Clique no botão acima para adicionar.
         </Box>
      )}

    </Box>
  );
}