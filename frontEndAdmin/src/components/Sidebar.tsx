import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { 
  Drawer, List, ListItemButton, ListItemText, Box, Toolbar, 
  ListItemIcon, Collapse, Divider, ListSubheader, CircularProgress 
} from "@mui/material";

// Ícones
import WebIcon from '@mui/icons-material/Web';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import EditIcon from '@mui/icons-material/Edit';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import RuleIcon from '@mui/icons-material/Rule';

// IMPORTANTE: Importe sua API
import api from '../api/api'; 

// Tipagem
interface MenuItem {
  id: string;
  name: string;
  path?: string;
  submenu?: MenuItem[];
}

// --- COMPONENTE DE ITEM DINÂMICO ---
const DynamicSidebarItem = ({ item }: { item: MenuItem }) => {
  const [open, setOpen] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const handleClick = () => setOpen(!open);

  if (hasSubmenu) {
    return (
      <>
        <ListItemButton onClick={handleClick}>
          <ListItemIcon><WebIcon /></ListItemIcon>
          <ListItemText primary={item.name} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.submenu?.map((subItem) => (
              <ListItemButton 
                key={subItem.id} 
                sx={{ pl: 4 }} 
                component={Link} 
                to={`/admin/edit-content${subItem.path}`}
              >
                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={subItem.name} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </>
    );
  }

  return (
    <ListItemButton component={Link} to={`/admin/edit-content${item.path}`}>
      <ListItemIcon><ArticleIcon /></ListItemIcon>
      <ListItemText primary={item.name} />
    </ListItemButton>
  );
};

export default function Sidebar() {
  const drawerWidth = 240;
  
  // ESTADO PARA O MENU DINÂMICO
  const [siteMenu, setSiteMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FUNÇÃO PARA BUSCAR DO BACKEND ---
  const fetchMenuFromApi = async () => {
    try {
      // Usa a mesma rota que você testou no MenuBuilder
      const response = await api.get('/menu');
      const data = response.data;

      if (Array.isArray(data)) {
        setSiteMenu(data);
      }
    } catch (error) {
      console.error("Erro ao carregar menu no Sidebar:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- EFEITO: CARREGAR E OUVIR ATUALIZAÇÕES ---
  useEffect(() => {
    // 1. Carrega na primeira vez
    fetchMenuFromApi();

    // 2. Define a função que será chamada quando o MenuBuilder salvar
    const handleUpdate = () => {
      console.log("Sidebar detectou alteração! Recarregando...");
      fetchMenuFromApi();
    };

    // 3. Adiciona o ouvinte
    window.addEventListener("menuUpdated", handleUpdate);

    // 4. Limpeza
    return () => {
      window.removeEventListener("menuUpdated", handleUpdate);
    };
  }, []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />

      <Box sx={{ overflow: 'auto' }}>
        <List>
          
          {/* ZONA 1: SISTEMA (FIXO) */}
          <ListSubheader>Gestão Paroquial</ListSubheader>

          <ListItemButton component={Link} to="/admin/dashboard">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton component={Link} to="/admin/moderacao">
            <ListItemIcon><RuleIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Crivo de Moderação" />
          </ListItemButton>

          <ListItemButton component={Link} to="/admin/products">
            <ListItemIcon><Inventory2Icon /></ListItemIcon>
            <ListItemText primary="Produtos/Loja" />
          </ListItemButton>

          <ListItemButton component={Link} to="/admin/home-editor">
            <ListItemIcon><ViewQuiltIcon /></ListItemIcon>
            <ListItemText primary="Editar Layout Home" />
          </ListItemButton>

          <ListItemButton component={Link} to="/admin/menu-builder">
            <ListItemIcon><SettingsSuggestIcon /></ListItemIcon>
            <ListItemText primary="Configurar Menu" />
          </ListItemButton>

          <Divider sx={{ my: 2 }} />
          
          {/* ZONA 2: CONTEÚDO DO SITE (DINÂMICO - VEM DO BANCO) */}
          <ListSubheader>Conteúdo do Site</ListSubheader>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            siteMenu.length === 0 ? (
               <ListItemText 
                 primary="Menu vazio" 
                 secondary="Configure no Menu Builder" 
                 sx={{ pl: 2, fontStyle: 'italic', color: 'gray' }} 
               />
            ) : (
              siteMenu.map((item) => (
                 <DynamicSidebarItem key={item.id} item={item} />
              ))
            )
          )}

        </List>
      </Box>
    </Drawer>
  );
}