import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // 👈 Importe o useAuth
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Avatar
} from "@mui/material";
import {
  Home, ShoppingBag, Briefcase, UserCircle
} from "lucide-react";

// --- Tipos ---
const PerfilSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // 👈 Use o contexto em vez de localStorage manual

  // Se por algum motivo o user sumir, volta pro login
  if (!user) {
    navigate("/login/morador");
    return null;
  }

  const handleSelect = (role: string) => {
    const p = role.toUpperCase();
   
    if (p === 'MORADOR') navigate('/dashboard');
    else if (p === 'PRESTADOR') navigate('/prestador/admin');
    else if (p === 'EMPREENDEDOR') navigate('/dashboard-empreendedor');
    else if (p === 'ADMIN') navigate('/admin/dashboard');
  };

  const getProfileConfig = (perfil: string) => { // Use string ou sua Role tipada
    // Padronizamos para maiúsculo para evitar erro de digitação
    const p = perfil.toUpperCase();

    switch (p) {
      case "MORADOR":
        return {
          title: "Morador",
          desc: "Acesse as notícias, reservas e comunicados do Gran Reserva.",
          icon: <Home size={32} />,
          color: "#2e7d32", // Verde
          badge: (user.tipo === 'MORADOR' || !!user.condominio_id) ? "Residente Verificado" : ""
        };
      case "EMPREENDEDOR":
        return {
          title: "Empreendedor",
          desc: "Gerencie seus produtos e vendas para seus vizinhos.",
          icon: <ShoppingBag size={32} />,
          color: "#ed6c02", // Laranja
          badge: "Negócio Local"
        };
      case "PRESTADOR":
        return {
          title: "Prestador",
          desc: "Painel de serviços e orçamentos profissionais.",
          icon: <Briefcase size={32} />,
          color: "#0288d1", // Azul
          // Aqui usamos o seu padrão de conta aprovada
          badge: user.tipo === 'EXTERNO' ? "Parceiro Externo" : "Prestador Local"
        };
      case "ADMIN":
        return {
          title: "Administrador",
          desc: "Acessar área administrativa total",
          icon: <UserCircle size={32} />,
          color: "#d32f2f", // Vermelho para Admin é mais comum
          badge: "Sistema"
        };
      default:
        return {
          title: "Perfil",
          desc: "Acesse seu painel",
          icon: <UserCircle size={32} />,
          color: "#757575",
          badge: ""
        };
    }
  };
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)",
        p: 3
      }}
    >
      <Box sx={{ maxWidth: 900, width: "100%" }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h4" sx={{ color: "#fff", fontWeight: "bold", mb: 1 }}>
            Olá, {user.name?.split(' ')[0]}!
          </Typography>
          <Typography sx={{ color: "#aaa", fontSize: "1.1rem" }}>
            Como você deseja navegar no <strong>GranConecta</strong> agora?
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {/* Mapeia os perfis que o backend enviou para o usuário */}
          {(() => {
            const roles: string[] = [];

            // Se tem condomínio, ele pode ver o card de Morador
            if (user.condominio_id) roles.push('MORADOR');

            // Se é prestador ou empreendedor, ele pode ver o card Profissional
            if (user.tipo === 'PRESTADOR' || user.is_empreendedor) roles.push('PRESTADOR');

            // Se for ADMIN, você pode adicionar também
            if (user.tipo === 'ADMIN') roles.push('ADMIN');

            // 2. Agora fazemos o map sobre esse novo array 'roles'
            return roles.map((perfilRole) => {
              const config = getProfileConfig(perfilRole);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={perfilRole}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: "#252525",
                      color: "#fff",
                      border: "1px solid #333",
                      transition: "0.3s",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        borderColor: config.color,
                        boxShadow: `0 10px 20px ${config.color}20`
                      }
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleSelect(perfilRole)}
                      sx={{ height: '100%', p: 2 }}
                    >
                      {/* ... restante do seu código igual ... */}
                      <CardContent sx={{ textAlign: "center" }}>
                        <Avatar sx={{ bgcolor: `${config.color}20`, color: config.color, width: 64, height: 64, mx: "auto", mb: 2 }}>
                          {config.icon}
                        </Avatar>
                        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                          {config.title}
                        </Typography>
                        {/* ... etc ... */}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            });
          })()}
        </Grid>

        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Typography
            onClick={logout}
            sx={{ color: "#666", cursor: "pointer", "&:hover": { color: "#ff6b6b" } }}
          >
            Sair da conta
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PerfilSelectorPage;