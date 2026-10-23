import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, Container, Fade, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import api from "../../api/api";
import { slugify } from "../../utils/slugify";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6954?q=80&w=2000";

export default function ServicoEnviado() {
    const { categoryTag } = useParams();
    const navigate = useNavigate();
    const [capa, setCapa] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCapa = async () => {
            try {
                // Buscamos a categoria para pegar a imagem de fundo correspondente
                const res = await api.get("/tipos-combo");
                const categoria = res.data.find((item: any) => 
                    item.slug === categoryTag || slugify(item.nome) === categoryTag
                );
                
                if (categoria?.capa_url || categoria?.imagem_url) {
                    setCapa(categoria.capa_url || categoria.imagem_url);
                }
            } catch (error) {
                console.error("Erro ao buscar capa:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCapa();
    }, [categoryTag]);

    const handleBack = () => navigate("/");

    if (loading) return (
        <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
            <CircularProgress color="primary" />
        </Box>
    );

    return (
        <Box
            sx={{
                position: "relative",
                height: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                // Background com Overlay para legibilidade
                backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url(${capa || FALLBACK_IMAGE})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <Fade in timeout={1000}>
                <Container maxWidth="sm">
                    <Box
                        sx={{
                            textAlign: "center",
                            color: "white",
                            p: 4,
                            borderRadius: 4,
                            backdropFilter: "blur(8px)",
                            bgcolor: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                        }}
                    >
                        <CheckCircleOutlineIcon 
                            sx={{ fontSize: 80, color: "#10b981", mb: 2 }} 
                        />
                        
                        <Typography variant="h3" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                            Solicitação Enviada!
                        </Typography>

                        <Typography variant="h5" sx={{ mb: 4, fontWeight: 300, opacity: 0.9 }}>
                            Logo entraremos em contato para confirmar os detalhes do seu atendimento de 
                            <Box component="span" sx={{ color: "#3b82f6", fontWeight: 'bold', ml: 1 }}>
                                {categoryTag?.replace(/-/g, ' ')}
                            </Box>.
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                            sx={{
                                py: 2,
                                px: 4,
                                borderRadius: 3,
                                fontWeight: "bold",
                                fontSize: "1.1rem",
                                textTransform: "none",
                                bgcolor: "white",
                                color: "#0f172a",
                                "&:hover": {
                                    bgcolor: "#f1f5f9",
                                    transform: "translateY(-2px)",
                                },
                                transition: "all 0.3s ease",
                            }}
                        >
                            Voltar para o Granconecta
                        </Button>
                    </Box>
                </Container>
            </Fade>
        </Box>
    );
}