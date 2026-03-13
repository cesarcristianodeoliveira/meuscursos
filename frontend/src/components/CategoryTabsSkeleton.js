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
        // Removemos a borda e ajustamos para 48px exatos
        minHeight: 48, 
        maxHeight: 48, 
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" spacing={1}>
          {[100, 120, 85, 130, 95, 110].map((width, i) => (
            <Box 
              key={i} 
              sx={{ 
                minWidth: 100, 
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