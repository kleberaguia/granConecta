import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton } from '@mui/material';
import { Visibility, CheckCircle } from '@mui/icons-material';

export const StoreOrders = ({ orders }: any) => {
    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3 }}>
            <Table>
                <TableHead sx={{ bgcolor: '#fcfcfc' }}>
                    <TableRow>
                        <TableCell><strong>Pedido</strong></TableCell>
                        <TableCell><strong>Cliente</strong></TableCell>
                        <TableCell><strong>Endereço</strong></TableCell>
                        <TableCell><strong>Total</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="right"><strong>Ações</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map((order: any) => (
                        <TableRow key={order.id} hover>
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>{order.customer?.nome}</TableCell>
                            <TableCell>{order.deliveryAddress}</TableCell>
                            <TableCell>R$ {Number(order.totalAmount).toFixed(2)}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={order.status.toUpperCase()} 
                                    color={order.status === 'pendente' ? 'warning' : 'success'} 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell align="right">
                                <IconButton color="primary" title="Ver detalhes"><Visibility /></IconButton>
                                <IconButton color="success" title="Marcar como entregue"><CheckCircle /></IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};