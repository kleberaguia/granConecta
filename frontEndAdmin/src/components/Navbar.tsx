import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  // 1. Pegue o 'logout' do Cérebro
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate("/home-editor"); 
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" noWrap>
          Painel Administrativo
        </Typography>
        <Button color="inherit" onClick={handleLogout}>
          Sair
        </Button>
      </Toolbar>
    </AppBar>
  );
}