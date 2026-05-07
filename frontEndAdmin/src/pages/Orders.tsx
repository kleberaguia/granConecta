import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { Paper, Typography, Button } from "@mui/material";
import api from "../api/api";

interface Order {
    id: number;
    customer: { id: number; name: string };
    items: { id: number; produto: { nome: string }; quantidade: number }[];
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const res = await api.get("/orders");
        setOrders(res.data);
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/orders/${id}`);
        loadOrders();
    };

    const columns: GridColDef<Order>[] = [
        { field: "id", headerName: "ID", width: 90 },
        {
            field: "customer",
            headerName: "Cliente",
            width: 200,
            valueGetter: (params: { row: Order }) => params.row.customer?.name,
        },
        {
            field: "items",
            headerName: "Itens",
            width: 300,
            valueGetter: (params: { row: Order }) =>
                params.row.items.map((i) => `${i.produto.nome} (x${i.quantidade})`).join(", "),
        },
        {
            field: "actions",
            headerName: "Ações",
            width: 150,
            renderCell: (params: { row: Order }) => (
                <Button color="error" onClick={() => handleDelete(params.row.id)}>
                    Excluir
                </Button>
            ),
        },
    ];

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Pedidos
            </Typography>
            <DataGrid
                rows={orders}
                columns={columns}
                autoHeight
                disableRowSelectionOnClick
            />
        </Paper>
    );
}
