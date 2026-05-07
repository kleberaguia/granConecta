import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

interface CheckoutFormProps {
  onSubmit: (data: {
    nome: string;
    email: string;
    telefone: string;
    endereco: string;
  }) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.email || !formData.telefone || !formData.endereco) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
      <Typography variant="h6">Dados para entrega</Typography>

      <TextField
        label="Nome completo"
        name="nome"
        value={formData.nome}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        label="E-mail"
        name="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        label="Telefone"
        name="telefone"
        value={formData.telefone}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        label="Endereço completo"
        name="endereco"
        value={formData.endereco}
        onChange={handleChange}
        fullWidth
        multiline
      />

      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Finalizar Compra
      </Button>
    </Box>
  );
};

export default CheckoutForm;