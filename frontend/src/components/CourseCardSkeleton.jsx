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
        bgcolor: 'transparent',
        // Forçamos a altura exata do seu Card real no desktop para evitar o pulo de 4px
        minHeight: { xs: 'auto', sm: 172 }, 
        maxHeight: { xs: 'auto', sm: 172 },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: 'stretch',
        width: '100%'
      }}>
        
        {/* 1. Skeleton da Imagem - Ajustado para 172px no Desktop */}
        <Skeleton 
          variant="rectangular" 
          animation="wave"
          sx={{ 
            width: { xs: '100%', sm: 256 },
            height: { xs: 128, sm: 172 }, 
            minWidth: { xs: '100%', sm: 256 },
          }} 
        />

        {/* 2. Skeleton do Conteúdo */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1,
          p: 2,
          overflow: 'hidden',
          height: { sm: 172 },
          boxSizing: 'border-box'
        }}>
          
          {/* Linha 1: Chip e Tempo Ago */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Skeleton variant="rounded" width={60} height={24} animation="wave" />
            <Skeleton variant="text" width={80} height={14} animation="wave" sx={{ transform: 'none' }} />
          </Box>

          {/* Linha 2: Título (Simulando o h6 com altura de 28px) */}
          <Skeleton 
            variant="text" 
            width="85%" 
            height={28} 
            animation="wave" 
            sx={{ mb: 1.5, transform: 'none' }} 
          />

          {/* Linha 3 e 4: Descrição (2 linhas exatas) */}
          <Box sx={{ mb: 1 }}>
            <Skeleton variant="text" width="100%" height={16} animation="wave" sx={{ transform: 'none', mb: 0.8 }} />
            <Skeleton variant="text" width="90%" height={16} animation="wave" sx={{ transform: 'none' }} />
          </Box>

          {/* Linha Final: Footer com Rating e Ícones */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 'auto', // Faz o footer "grudar" na base dos 172px
            pb: 0.5 
          }}>
            {/* Espaço do Rating */}
            <Skeleton variant="text" width={40} height={16} animation="wave" sx={{ transform: 'none' }} />
            
            {/* Espaço dos 3 ícones (Aulas, Tempo, Porcentagem) */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Skeleton variant="circular" width={16} height={16} animation="wave" />
              <Skeleton variant="circular" width={16} height={16} animation="wave" />
              <Skeleton variant="circular" width={16} height={16} animation="wave" />
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default CourseCardSkeleton;