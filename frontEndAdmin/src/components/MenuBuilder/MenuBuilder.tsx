import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  Tooltip,
  Divider
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  SubdirectoryArrowRight as SubIcon
} from '@mui/icons-material';
// Importação da sua instância API configurada
import api from '../../api/api';

// --- TIPAGEM ---
interface MenuItem {
  id: string;
  name: string;
  path: string;
  submenu: MenuItem[];
  status?: 'saved' | 'unsaved';
}

export default function MenuBuilder() {
  // Inicia vazio, pois vamos carregar da API
  //const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
  {
    id: 'admin-mod',
    name: 'Crivo de Moderação',
    path: '/admin/moderacao', // Certifique-se que esta rota existe no seu App.tsx
    submenu: [],
    status: 'unsaved' // Ele aparecerá em vermelho até você clicar em "Salvar Menu"
  }
]);
  
  // Estados do Modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string | null, parentId: string | null }>({ id: null, parentId: null });
  const [formData, setFormData] = useState({ name: '', path: '' });

  // --- HELPERS (Movidos para cima para serem usados no useEffect) ---

  // Recursiva: Marca tudo como 'saved' (Verde)
  const markAllAsSaved = (items: MenuItem[]): MenuItem[] => {
    return items.map(item => ({
      ...item,
      status: 'saved',
      submenu: markAllAsSaved(item.submenu || [])
    }));
  };

  // Recursiva: Marca item editado como 'unsaved' (Vermelho)
  const updateTree = (items: MenuItem[], idToFind: string, newData: Partial<MenuItem>): MenuItem[] => {
    return items.map(item => {
      if (item.id === idToFind) {
        return { ...item, ...newData, status: 'unsaved' };
      }
      if (item.submenu.length > 0) {
        return { ...item, submenu: updateTree(item.submenu, idToFind, newData) };
      }
      return item;
    });
  };

  // Recursiva: Adiciona item novo
  const addItemToTree = (items: MenuItem[], parentId: string | null, newItem: MenuItem): MenuItem[] => {
    if (parentId === null) {
      return [...items, newItem];
    }
    return items.map(item => {
      if (item.id === parentId) {
        return { ...item, submenu: [...item.submenu, newItem] };
      }
      if (item.submenu.length > 0) {
        return { ...item, submenu: addItemToTree(item.submenu, parentId, newItem) };
      }
      return item;
    });
  };

  // Recursiva: Remove item
  const deleteFromTree = (items: MenuItem[], idToDelete: string): MenuItem[] => {
    return items
      .filter(item => item.id !== idToDelete)
      .map(item => ({
        ...item,
        submenu: deleteFromTree(item.submenu, idToDelete)
      }));
  };

  // --- CARREGAR DADOS DA API ---
 useEffect(() => {
    const fetchMenu = async () => {
      try {
        // CORREÇÃO: Rota no plural conforme o backend
        const response = await api.get('/menu'); 
        const data = response.data;

        console.log('aquiii ', data)

        if (Array.isArray(data)) {
          const formatted = markAllAsSaved(data);
          console.log('formatted ', formatted)
          setMenuItems(formatted);
        }
      } catch (e) {
        console.error("Erro ao buscar menu da API:", e);
      }
    };

    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- HANDLERS DO MODAL E AÇÕES ---

  const handleOpenAdd = (parentId: string | null) => {
    setFormData({ name: '', path: '' });
    setEditingItem({ id: null, parentId });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setFormData({ name: item.name, path: item.path });
    setEditingItem({ id: item.id, parentId: null });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir? Isso marcará a alteração para salvar.")) {
      setMenuItems(deleteFromTree(menuItems, id));
      
    }
  };

  const handleSaveInternal = () => {
    if (editingItem.id) {
      // Edição
      const updatedMenu = updateTree(menuItems, editingItem.id, formData);
      setMenuItems(updatedMenu);
    } else {
      // Criação -> Status UNSAVED
      const newItem: MenuItem = {
        id: Date.now().toString(), // ID temporário
        name: formData.name,
        path: formData.path,
        submenu: [],
        status: 'unsaved' // <--- Novo item nasce vermelho
      };
      const updatedMenu = addItemToTree(menuItems, editingItem.parentId, newItem);
      setMenuItems(updatedMenu);
    }
    setDialogOpen(false);
  };

  // --- SALVAR NO BACKEND (API) ---
  const handleSaveMenuToDatabase = async () => {
    try {
      const allSaved = markAllAsSaved(menuItems);
      setMenuItems(allSaved);

      await api.post('/menu/store', { items: allSaved }); 
      window.dispatchEvent(new Event("menuUpdated"));
      
      alert("Menu salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar menu:", error);
      alert("Erro ao conectar com o servidor.");
    }
  };

  // --- COMPONENTE RECURSIVO DE LISTA ---
  const MenuListRecursive = ({ items, level = 0 }: { items: MenuItem[], level?: number }) => {
    const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
    const toggleOpen = (id: string) => {
      setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getBorderColor = (status?: string) => {
      if (status === 'unsaved') return '#ef5350'; // Vermelho
      if (status === 'saved') return '#66bb6a';   // Verde
      return 'transparent';
    };

    return (
      <List component="div" disablePadding>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem 
              sx={{ 
                pl: 2 + (level * 4),
                borderBottom: '1px solid #f0f0f0',
                bgcolor: level === 0 ? '#fafafa' : '#fff',
                borderLeft: `4px solid ${getBorderColor(item.status)}`,
                transition: 'border-left-color 0.3s ease'
              }}
              secondaryAction={
                <Box>
                  <Tooltip title="Novo Submenu">
                    <IconButton edge="end" onClick={() => handleOpenAdd(item.id)}>
                       <SubIcon fontSize="small" color="action" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton edge="end" onClick={() => handleOpenEdit(item)}>
                      <EditIcon fontSize="small" color="action" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton edge="end" color="error" onClick={() => handleDelete(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              {item.submenu && item.submenu.length > 0 ? (
                <IconButton onClick={() => toggleOpen(item.id)} size="small" sx={{ mr: 1 }}>
                  {openItems[item.id] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              ) : (
                <Box sx={{ width: 28, mr: 1 }} /> 
              )}
              
              <ListItemText 
                primary={
                  <Typography 
                    fontWeight={level === 0 ? 'bold' : 'normal'}
                    sx={{ color: item.status === 'unsaved' ? '#d32f2f' : 'inherit' }}
                  >
                    {item.name} {item.status === 'unsaved' && '*'}
                  </Typography>
                }
                secondary={item.path || "(Grupo)"}
              />
            </ListItem>

            {item.submenu && item.submenu.length > 0 && (
              <Collapse in={openItems[item.id]} timeout="auto" unmountOnExit>
                <MenuListRecursive items={item.submenu} level={level + 1} />
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
             Configuração do Menu
             {menuItems.some(i => JSON.stringify(i).includes('"status":"unsaved"')) && (
                <Typography component="span" variant="caption" sx={{ ml: 2, color: 'red' }}>
                   (Alterações pendentes)
                </Typography>
             )}
          </Typography>
          
          <Box>
             <Button 
               variant="outlined" 
               startIcon={<AddIcon />} 
               onClick={() => handleOpenAdd(null)}
               sx={{ mr: 2 }}
             >
               Novo Item
             </Button>
             <Button 
               variant="contained" 
               color={menuItems.some(i => JSON.stringify(i).includes('"status":"unsaved"')) ? "error" : "success"} 
               startIcon={<SaveIcon />}
               onClick={handleSaveMenuToDatabase}
             >
               Salvar Menu
             </Button>
          </Box>
        </Box>

        <Divider />
        
        <Box sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            {menuItems.length === 0 ? (
                <Typography sx={{ p: 4, textAlign: 'center', color: 'gray' }}>
                    Nenhum menu encontrado ou banco vazio.
                </Typography>
            ) : (
                <MenuListRecursive items={menuItems} />
            )}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem.id ? "Editar" : "Novo Item"}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Rota"
              fullWidth
              margin="normal"
              helperText="Ex: /historia (Vazio se for apenas pai)"
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveInternal}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}