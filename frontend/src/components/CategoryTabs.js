import React from 'react';
import { Box, Tabs, Tab, tabsClasses } from '@mui/material';

const CategoryTabs = ({ categories, value, onChange }) => {
  return (
    <Box 
      sx={{ 
        position: 'sticky', 
        top: { xs: 56, md: 64 }, 
        zIndex: 1000, 
        width: '100%',
        bgcolor: 'background.default',
        // Removida qualquer menção a bordas aqui
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
          height: 48, // Trava a altura para o Skeleton ser idêntico
          '& .MuiTab-root': { 
            fontWeight: 600, 
            textTransform: 'none', 
            fontSize: '0.9rem',
            minWidth: 100,
            minHeight: 48,
            color: 'text.secondary',
            transition: 'all 0.2s',
            '&.Mui-selected': {
              color: 'primary.main',
              fontWeight: 700,
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