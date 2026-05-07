import { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Box, Button, TextField, Paper, Typography } from "@mui/material";
import api from "../api/api";

interface Role {
  id: number;
  name: string;
}
interface User {
  id: number;
  email: string;
  name?: string;
  role?: Role;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  const handleCreate = async () => {
    await api.post("/users", { email, password });
    setEmail("");
    setPassword("");
    loadUsers();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/users/${id}`);
    loadUsers();
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "name", headerName: "Nome", width: 150 },
    { field: "role", headerName: "Role", width: 150, valueGetter: (params: { row: User }) => params.row.role?.name || "—"},
    {
      field: "actions",
      headerName: "Ações",
      width: 150,
      renderCell: (params) => (
        <Button color="error" onClick={() => handleDelete(params.row.id)}>Excluir</Button>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Usuários</Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" onClick={handleCreate}>Criar</Button>
      </Box>
      <DataGrid rows={users} columns={columns}  disableRowSelectionOnClick />
    </Paper>
  );
}
