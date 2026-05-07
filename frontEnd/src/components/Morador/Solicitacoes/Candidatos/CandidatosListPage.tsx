import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../../../api/api";

export interface Candidatura {
  id: string;
  solicitacaoId: string;
  prestadorId: string;
  mensagem: string;
  valor_proposto: number;
  status: string;
  createdAt: string;
}


export default function CandidatosListPage() {
   const { solicitacaoId } = useParams();
  const [candidatos, setCandidatos] = useState<Candidatura[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/api/servicos/${solicitacaoId}/candidaturas`)
      .then(res => {
        setCandidatos(res.data as Candidatura[]);
      })
      .catch(err => console.error(err));
  }, [solicitacaoId]);

  return (
    <div>
      <h2>Candidatos para a Solicitação</h2>

      {candidatos.map((candidato) => (
        <div
          key={candidato.id}
          onClick={() =>
            navigate(`/morador/solicitacoes/${solicitacaoId}/candidatos/${candidato.id}`)
          }
          style={{ cursor: "pointer", marginBottom: 20 }}
        >
          <p>Proposta: R$ {candidato.valor_proposto}</p>
          <p>Mensagem: {candidato.mensagem}</p>
          <p>Status: {candidato.status}</p>
        </div>
      ))}
    </div>
  );
}
