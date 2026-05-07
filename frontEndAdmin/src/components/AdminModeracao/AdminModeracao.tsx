import { useEffect, useState } from "react";
import { Box, Typography, Card, Button, Chip, Avatar, Grid } from "@mui/material";
import api from "../../api/api";

export default function AdminModeracao() {
    const [pendentes, setPendentes] = useState<any[]>([]); // Adicione tipagem inicial
    const fetchPendentes = async () => {
        try {
            const response = await api.get("/users/pendentes-aprovacao");
            setPendentes(response.data);
        } catch (error) {
            console.error("Erro ao buscar pendentes", error);
        }
    };

    const handleDecisao = async (id: string, status: "APROVADO" | "REJEITADO") => {
        try {
            // No Admin, não usamos formData. Apenas enviamos a decisão para o ID específico.
            await api.patch(`/users/analisar/${id}`, { status });
            
            // Remove o usuário da lista visualmente ou recarrega
            setPendentes(prev => prev.filter(u => u.id !== id));
            alert(`Perfil ${status} com sucesso!`);
        } catch (error) {
            alert("Erro ao processar decisão.");
        }
    };

    useEffect(() => { fetchPendentes(); }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Crivo de Moderação
            </Typography>
            
            {pendentes.length === 0 ? (
                <Typography color="text.secondary">Nenhum perfil aguardando aprovação.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {pendentes.map((u: any) => (
                        <Grid size={{xs:12, md:6}} key={u.id}>
                            <Card sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', boxShadow: 3 }}>
                                <Avatar src={u.foto_perfil_url} sx={{ width: 70, height: 70 }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6">{u.nome}</Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                                        "{u.descricao_bio}"
                                    </Typography>
                                    <Chip label={u.plano} size="small" color="primary" variant="outlined" />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Button 
                                        variant="contained" 
                                        color="success" 
                                        onClick={() => handleDecisao(u.id, "APROVADO")}
                                    >
                                        Aprovar
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        onClick={() => handleDecisao(u.id, "REJEITADO")}
                                    >
                                        Reprovar
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}