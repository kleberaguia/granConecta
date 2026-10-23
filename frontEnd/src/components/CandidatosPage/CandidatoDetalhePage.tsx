"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Paper, Typography, Button, Avatar } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

export default function CandidatoDetalhePage() {
  const { solicitacaoId, candidaturaId } = useParams();
 const navigate = useNavigate();

  const [candidatura, setCandidatura] = useState<any>(null);
  const [prestador, setPrestador] = useState<any>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    async function load() {
      try {
        // 1) buscar a candidatura
        const candRes = await axios.get(`/api/servicos/candidaturas/${candidaturaId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCandidatura(candRes.data);

        // 2) buscar dados do prestador
        const userRes = await axios.get(`/api/users/${candRes.data.prestadorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setPrestador(userRes.data);

      } catch (error) {
        console.error("Erro ao carregar dados", error);
      }
    }

    load();
  }, [token, candidaturaId]);


  async function aceitar() {
    try {
      await axios.post(
        "/api/servicos/candidaturas/aceitar",
        { candidaturaId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Prestador aceito com sucesso!");
      navigate(`/morador/solicitacoes/${solicitacaoId}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao aceitar candidato.");
    }
  }

  async function recusar() {
    try {
      await axios.post(
        "/api/servicos/candidaturas/recusar",
        { candidaturaId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Candidato recusado.");
      navigate(`/morador/solicitacoes/${solicitacaoId}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao recusar candidato.");
    }
  }

  if (!prestador || !candidatura) return <p>Carregando...</p>;

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={prestador.fotoUrl} sx={{ width: 70, height: 70 }} />
          <Box>
            <Typography variant="h5">{prestador.nome}</Typography>
            <Typography>Nota: {prestador.notaMedia || "-"}</Typography>
            <Typography>
              Serviços concluídos: {prestador.servicosRealizados || 0}
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ mt: 3 }}>
          <strong>Mensagem:</strong> {candidatura.mensagem}
        </Typography>

        <Typography sx={{ mt: 2 }}>
          <strong>Valor Proposto:</strong> R$ {candidatura.valor_proposto}
        </Typography>

        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          <Button variant="contained" color="primary" onClick={aceitar}>
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
