import { Box, Toolbar } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar"; // Importe o Navbar
import { Outlet } from "react-router-dom"; // Onde as páginas aparecem

export default function Layout() {
  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
        <Sidebar />    
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>        
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}