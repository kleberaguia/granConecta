import { Table, TableBody, TableCell, TableHead, TableRow, Chip, Paper, TableContainer } from '@mui/material';

export const ListaLeads = ({ leads }: { leads: any[] }) => (
  <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
    <Table>
      <TableHead sx={{ bgcolor: '#f8fafc' }}>
        <TableRow>
          <TableCell><b>Tipo</b></TableCell>
          <TableCell><b>Detalhes</b></TableCell>
          <TableCell><b>Data</b></TableCell>
          <TableCell><b>Status</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <Chip 
                label={lead.tipoInteracao.replace('_', ' ')} 
                color={lead.tipoInteracao === 'CONTATO_WHATSAPP' ? 'success' : 'primary'} 
                size="small" 
              />
            </TableCell>
            <TableCell>
              {lead.metaData?.name || lead.metaData?.titulo || "Interesse Geral"}
            </TableCell>
            <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
            <TableCell><Chip label="Novo" size="small" variant="outlined" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);