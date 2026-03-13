import React from 'react';
import { Card, Box, Skeleton } from '@mui/material';

const CourseCardSkeleton = () => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 0,
        display: 'flex', 
        overflow: 'hidden',
        bgcolor: 'background.paper', // Usar a cor do card real em vez de transparent
        minHeight: { xs: 'auto', sm: 172 }, 
        maxHeight: { xs: 'auto', sm: 172 },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: 'center', // Alinhado ao centro como no real
        justifyContent: 'flex-start',
        width: '100%'
      }}>
        
        {/* 1. Imagem - Proporção exata */}
        <Skeleton 
          variant="rectangular" 
          animation="wave"
          sx={{ 
            width: { xs: '100%', sm: 256 },
            height: { xs: 128, sm: 172 }, 
            minWidth: { xs: '100%', sm: 256 },
          }} 
        />

        {/* 2. Conteúdo - Espelhamento de Paddings e Margens */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1,
          p: 2,
          width: '100%',
          height: '100%', // Para o mt: 'auto' funcionar perfeitamente
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          
          {/* Categoria e Tempo Ago */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Skeleton variant="rounded" width={50} height={20} animation="wave" sx={{ borderRadius: 1 }} />
            <Skeleton variant="text" width={60} height={14} animation="wave" sx={{ transform: 'none' }} />
          </Box>

          {/* Título - Simulando 1 linha (ou 2 no mobile) */}
          <Skeleton 
            variant="text" 
            width="80%" 
            height={24} 
            animation="wave" 
            sx={{ mb: 1, transform: 'none' }} 
          />

          {/* Descrição - 2 linhas */}
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width="100%" height={14} animation="wave" sx={{ transform: 'none', mb: 0.5 }} />
            <Skeleton variant="text" width="95%" height={14} animation="wave" sx={{ transform: 'none' }} />
          </Box>

          {/* Footer - Rating e Status */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 'auto' // Empurra para a base
          }}>
            {/* Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Skeleton variant="circular" width={16} height={16} animation="wave" />
              <Skeleton variant="text" width={20} height={14} animation="wave" sx={{ transform: 'none' }} />
            </Box>
            
            {/* Ícones de Aulas, Tempo e Progressão */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Skeleton variant="circular" width={14} height={14} animation="wave" />
                  <Skeleton variant="text" width={30} height={12} animation="wave" sx={{ transform: 'none' }} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default CourseCardSkeleton;