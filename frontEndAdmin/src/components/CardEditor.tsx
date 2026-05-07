import { useState, useEffect } from 'react';
import { TextField, MenuItem, Select, FormControl, InputLabel, type SelectChangeEvent } from '@mui/material';
import api from '../api/api'; // Ajuste o caminho conforme sua estrutura

// 1. DEFINA O TIPO DO CARD
// Isso diz ao TypeScript quais campos existem no objeto card
interface Card {
  id?: number;
  titulo: string;
  icone: string;
  linkUrl?: string;    // Opcional (?) pois pode ser nulo no banco
  textoBotao?: string; // Opcional
  ordem?: number;
}

// 2. DEFINA O TIPO DAS PROPS DO COMPONENTE
// Isso diz o que o componente espera receber do pai
interface CardEditorProps {
  card: Card;
  onChange: (updatedCard: Card) => void; // Uma função que recebe um Card e não retorna nada
}

// 3. APLIQUE A TIPAGEM NO COMPONENTE
// Adicione ": CardEditorProps" logo após desestruturar as props
export default function CardEditor({ card, onChange }: CardEditorProps) {
  
  // Estado para a lista de páginas que vem da API
  // Também tipamos o estado como um array de objetos com id, title e slug
  const [pages, setPages] = useState<{ id: string; title: string; slug: string }[]>([]);

  useEffect(() => {
    // Exemplo de rota que retorna lista simples: [{id: 1, title: 'História', slug: '/historia'}]
    api.get('/pages') 
       .then(res => setPages(res.data))
       .catch(err => console.error("Erro ao listar páginas", err));
  }, []);

  // Handler genérico para mudanças no Select (O MUI exige tipagem específica no evento do Select)
  const handleSelectChange = (e: SelectChangeEvent) => {
     onChange({ ...card, linkUrl: e.target.value });
  };

  return (
    <div>
       {/* Campo Título */}
       <TextField 
          label="Título do Card"
          value={card.titulo || ''} // Garante que não quebre se for null/undefined
          onChange={(e) => onChange({...card, titulo: e.target.value})}
          fullWidth 
          margin="normal"
       />

       {/* Campo Link (Select) */}
       <FormControl fullWidth margin="normal">
          <InputLabel id="link-select-label">Ao clicar, ir para:</InputLabel>
          <Select
            labelId="link-select-label"
            value={card.linkUrl || ''}
            label="Ao clicar, ir para:"
            onChange={handleSelectChange} // Usamos o handler tipado acima
          >
             <MenuItem value="">
                <em>Sem link (Apenas informativo)</em>
             </MenuItem>
             
             {/* Lista as páginas vindas da API */}
             {pages.map((page) => (
                <MenuItem key={page.id} value={page.slug}>
                   {page.title} (Página Interna)
                </MenuItem>
             ))}
             
             <MenuItem disabled divider />
             <MenuItem value="/contato">Fale Conosco (Sistema)</MenuItem>
          </Select>
       </FormControl>

       {/* Campo Texto do Botão */}
       <TextField 
          label="Texto do Botão"
          value={card.textoBotao || ''}
          onChange={(e) => onChange({...card, textoBotao: e.target.value})}
          fullWidth 
          margin="normal"
          placeholder="Ex: Saiba Mais"
       />
    </div>
  );
}