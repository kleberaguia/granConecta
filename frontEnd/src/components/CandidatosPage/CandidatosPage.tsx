import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";

interface Candidato {
  id: string;
  solicitacaoId: string;
  prestadorId: string;
  mensagem: string;
  valor_proposto: number;
  status: string;
  createdAt: string;
}

export default function CandidatosPage() {
  const { id } = useParams(); // id da solicitação
  const navigate = useNavigate();
  const [candidaturas, setCandidaturas] = useState<Candidato[]>([]);

  useEffect(() => {
    async function load() {
      const res = await axios.get(`/api/servicos/${id}/candidaturas`);
      setCandidaturas(res.data);
    }
    load();
  }, [id]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Candidatos</Typography>

      {candidaturas.map((c) => (
        <Card key={c.id} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">Proposta: R$ {c.valor_proposto}</Typography>
            <Typography sx={{ mt: 1 }}>{c.mensagem}</Typography>

            <Button
              sx={{ mt: 2 }}
              variant="contained"
              onClick={() => navigate(`/solicitacoes/${id}/candidato/${c.id}`)}
            >
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
