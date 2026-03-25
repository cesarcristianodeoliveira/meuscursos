import React from 'react';
import { Box, Tabs, Tab, tabsClasses, Container } from '@mui/material';

const CategoryTabs = ({ categories, value, onChange }) => {
  return (
    <Box 
      // O ID de ancoragem agora fica dentro do componente para precisão
      id="tabs-scroll-point"
      sx={{ 
        position: 'sticky', 
        top: { xs: 56, md: 64 }, 
        zIndex: 1000, 
        width: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xl">
        <Tabs
          value={value}
          onChange={onChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor='secondary'
          aria-label="Categorias de cursos"
          sx={{
            minHeight: 48,
            height: 48, 
            '& .MuiTab-root': { 
              fontWeight: 600, 
              textTransform: 'none', 
              fontSize: '0.9rem',
              minWidth: 100,
              minHeight: 48,
              color: 'text.secondary',
              transition: 'all 0.2s',
              '&.Mui-selected': {
                color: 'secondary.main',
                fontWeight: 700,
              },
              '&:hover': {
                color: 'secondary.light',
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
      </Container>
    </Box>
  );
};

export default CategoryTabs;