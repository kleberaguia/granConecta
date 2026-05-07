import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../../../api/api";
import { Box, Button, Paper, Typography } from "@mui/material";
export interface Candidatura {
  id: string;
  solicitacaoId: string;
  prestadorId: string;
  mensagem: string;
  valor_proposto: number;
  status: string;
  createdAt: string;
  prestador?: {
    id: string;
    nome: string;
    foto?: string;
    nota?: number;
    totalServicos?: number;
  };
}

export default function CandidaturaDetalhePage() {
const { solicitacaoId, candidaturaId } = useParams();
  const navigate = useNavigate();

  const [candidatura, setCandidatura] = useState<Candidatura | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidaturaId) return;

    api
      .get(`/api/servicos/candidaturas/${candidaturaId}`)
      .then((res) => {
        setCandidatura(res.data as Candidatura);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [candidaturaId]);

  const aceitar = async () => {
    await api.post("/api/servicos/candidaturas/aceitar", {
      candidaturaId,
    });
    navigate(`/morador/solicitacoes/${solicitacaoId}`);
  };

  const recusar = async () => {
    await api.post("/api/servicos/candidaturas/recusar", {
      candidaturaId,
    });
    navigate(`/morador/solicitacoes/${solicitacaoId}`);
  };

  if (loading) return <p>Carregando...</p>;
  if (!candidatura) return <p>Candidatura não encontrada.</p>;

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Proposta de {candidatura.prestador?.nome ?? "Prestador"}
        </Typography>

        {candidatura.prestador?.foto && (
          <img
            src={candidatura.prestador.foto}
            alt="Foto do Prestador"
            style={{ width: 120, borderRadius: "50%", marginBottom: 20 }}
          />
        )}

        <Typography sx={{ mb: 1 }}>
          Mensagem: {candidatura.mensagem}
        </Typography>

        <Typography sx={{ mb: 1 }}>
          Valor proposto: R$ {candidatura.valor_proposto}
        </Typography>

        <Typography sx={{ mb: 1 }}>
          Status: {candidatura.status}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button variant="contained" color="success" onClick={aceitar}>
            Aceitar Prestador
          </Button>

          <Button variant="outlined" color="error" onClick={recusar}>
            Recusar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
