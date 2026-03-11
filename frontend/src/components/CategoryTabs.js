import React from 'react';
import { Box, Tabs, Tab, useTheme, tabsClasses } from '@mui/material';

const CategoryTabs = ({ categories, value, onChange }) => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        position: 'sticky', 
        zIndex: 1000, 
        width: '100%',
        bgcolor: theme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.75)' 
          : 'hsla(204, 14%, 7%, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Categorias de cursos"
        sx={{
          minHeight: 48,
          '& .MuiTab-root': { 
            fontWeight: 600, 
            textTransform: 'none', 
            fontSize: '0.9rem',
            minWidth: 100,
            minHeight: 48,
            color: 'text.secondary',
            transition: 'all 0.2s', // Suaviza a troca de cor
            '&.Mui-selected': {
              color: 'primary.main',
              fontWeight: 700, // Dá um leve destaque ao selecionado
            },
            '&:hover': {
                color: 'primary.light',
                opacity: 1
            }
          },
          [`& .${tabsClasses.scrollButtons}`]: {
            '&.Mui-disabled': { opacity: 0.3 },
          },
        }}
      >
        {categories.map((cat) => (
          <Tab 
            key={cat} 
            label={cat} 
            value={cat} 
            disableRipple 
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default CategoryTabs;