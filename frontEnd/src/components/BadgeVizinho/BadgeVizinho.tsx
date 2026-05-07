// src/components/BadgeVizinho.tsx
import { Chip, Tooltip } from "@mui/material";
import { Home, Globe } from "lucide-react";

interface BadgeVizinhoProps {
  tipo: 'MORADOR' | 'EXTERNO' | string;
}

export const BadgeVizinho = ({ tipo }: BadgeVizinhoProps) => {
  const isNeighbor = tipo === 'MORADOR';
  return (
    <Tooltip title={isNeighbor ? "Mora no condomínio" : "Parceiro externo"}>
      <Chip
        icon={isNeighbor ? <Home size={14} color="#2e7d32" /> : <Globe size={14} color="#666" />}
        label={isNeighbor ? "VIZINHO" : "EXTERNO"}
        size="small"
        sx={{
          fontWeight: 'bold', fontSize: '0.65rem', height: 22,
          bgcolor: isNeighbor ? '#e8f5e9' : '#f5f5f5',
          color: isNeighbor ? '#2e7d32' : '#666',
          border: `1px solid ${isNeighbor ? '#a5d6a7' : '#e0e0e0'}`
        }}
      />
    </Tooltip>
  );
};