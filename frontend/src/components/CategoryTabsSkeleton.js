import React from 'react';
import { Box, Skeleton, Container, Stack } from '@mui/material';

const CategoryTabsSkeleton = () => {
  return (
    <Box 
      sx={{ 
        position: 'sticky', 
        top: { xs: 56, md: 64 }, 
        zIndex: 1000, 
        width: '100%',
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: 49, // 48px das abas + 1px da borda
        maxHeight: 49, 
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" spacing={1}>
          {/* Criamos larguras variadas para simular categorias reais (Ex: Recentes, Design, etc) */}
          {[100, 120, 85, 130, 95, 110].map((width, i) => (
            <Box 
              key={i} 
              sx={{ 
                minWidth: 100, // Mesma largura mínima da Tab real
                height: 48, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Skeleton 
                variant="text" 
                width={width - 40} 
                height={20} 
                animation="wave" 
                sx={{ transform: 'none' }} 
              />
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default CategoryTabsSkeleton;