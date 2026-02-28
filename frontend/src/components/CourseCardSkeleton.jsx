import React from 'react';
import { Card, Box, Skeleton } from '@mui/material';

const CourseCardSkeleton = () => {
  return (
    <Card sx={{ display: 'flex', overflow: 'hidden', mb: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: 'stretch',
        width: '100%'
      }}>
        
        {/* Skeleton da Imagem - Altura exata do real */}
        <Skeleton 
          variant="rectangular" 
          animation="wave"
          sx={{ 
            width: { xs: '100%', sm: 256 },
            height: { xs: 180, sm: 160 }, // Fixamos 160 no desktop para casar com o conteúdo
            minWidth: { xs: '100%', sm: 256 },
          }} 
        />

        {/* Skeleton do Conteúdo */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1,
          p: 2,
          overflow: 'hidden',
          height: { sm: 160 } // Força a mesma altura da imagem no desktop
        }}>
          {/* Linha 1: Chip e Tempo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Skeleton variant="rounded" width={60} height={20} animation="wave" />
            <Skeleton variant="text" width={70} height={18} animation="wave" />
          </Box>

          {/* Linha 2: Título (Simulando 1 linha) */}
          <Skeleton 
            variant="text" 
            width="80%" 
            height={24} // Altura de uma linha h6
            animation="wave" 
            sx={{ mb: 1, transform: 'none' }} // transform: none tira o respiro extra do Skeleton
          />

          {/* Linha 3 e 4: Descrição (Simulando exatamente 2 linhas) */}
          <Box sx={{ mb: 1 }}>
            <Skeleton variant="text" width="95%" height={18} animation="wave" sx={{ transform: 'none', mb: 0.5 }} />
            <Skeleton variant="text" width="60%" height={18} animation="wave" sx={{ transform: 'none' }} />
          </Box>

          {/* Linha Final: Footer */}
          <Box sx={{ mt: 'auto' }}>
            <Skeleton variant="text" width={50} height={18} animation="wave" sx={{ transform: 'none' }} />
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default CourseCardSkeleton;