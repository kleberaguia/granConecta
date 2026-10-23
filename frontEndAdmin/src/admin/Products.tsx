import { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Paper, Typography, Box, Button, IconButton, Avatar } from "@mui/material";
// <<< NOVOS ÍCONES
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add'; // Opcional, para o botão "Novo"
import api from "../api/api";
import { useNavigate } from "react-router-dom";

// <<< INTERFACE ATUALIZADA
interface Produto {
  id: number;
  name: string;
  description: string;
  price: number;
  status: boolean;
  imagemUrl: string; // <<< Adicionado campo da imagem
}

export default function Products() {
  const [products, setProducts] = useState<Produto[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get("/produtos/vitrine");
      setProducts(res.data);
      console.log("Produtos: Carregados!");
    } catch (error: any) {
      console.error("FALHA AO CARREGAR PRODUTOS:", error);
      alert(`Falha ao carregar produtos: ${error.message}`);
    }
  };

  const handleAddNew = () => {
    navigate("/admin/produtos/NovoProduto");
  };

  const handleEdit = (id: number) => {
    navigate(`/admin/produtos/editar/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        // 2. Chama o Backend para apagar
        await api.delete(`/produtos/delete/${id}`);
        
        // 3. Atualiza a lista na tela visualmente (filtra tirando o item apagado)
        setProducts((currentProducts) => 
          currentProducts.filter((prod) => prod.id !== id)
        );
        
        alert("Produto excluído com sucesso!");
        
      } catch (error: any) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir o produto. Tente novamente.");
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: "imagemUrl",
      headerName: "Imagem",
      width: 80,
      renderCell: (params) => (
        <Avatar src={params.value} variant="rounded" />
      )
    },
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Nome", width: 200 },
    { field: "description", headerName: "Descrição", width: 150 },
    { field: "price", headerName: "Preço", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 100, // <<< Largura ajustada (20 era muito pouco)
      renderCell: (params) => {
        return params.value === true ? "Ativo" : "Inativo";
      }
    },
    // <<< NOVA COLUNA DE AÇÕES (EDITAR/REMOVER)
    {
      field: "actions",
      headerName: "Ações",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleEdit(params.id as number)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.id as number)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      {/* <<< BOX COM O TÍTULO E O BOTÃO "NOVO" */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          Adicionar Produto
        </Button>
      </Box>

      {/* <<< DATA GRID COM ALTURA DEFINIDA */}
      <Box sx={{ height: 600, width: '100%', minWidth: 0 }}>
        <DataGrid
          rows={products}
          columns={columns}
          // autoHeight foi removido para usar a altura do Box
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
    </Paper>
  );
}