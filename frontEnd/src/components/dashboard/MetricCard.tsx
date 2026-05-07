import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        border: '1px solid #e2e8f0',
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        height: '100%'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 48, 
          height: 48, 
          borderRadius: 3, 
          bgcolor: `${color}15`, // Cor com 15% de transparência
          color: color 
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight="500">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b' }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MetricCard;