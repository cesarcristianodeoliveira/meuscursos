import React from 'react';
import { Box, Grid, Typography, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import { 
  MenuBook, 
  AutoStoriesOutlined, 
  AssignmentOutlined, 
  CategoryOutlined 
} from '@mui/icons-material';

const StatItem = ({ icon: Icon, label, value, loading }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        // Forçamos uma altura mínima para o item não variar entre loading/dado
        height: 40, 
      }}
    >
      <Icon sx={{ color: 'text.secondary', fontSize: 32 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loading ? (
          <>
            {/* transform: 'none' remove as margens automáticas do Skeleton de texto */}
            <Skeleton variant="text" width={24} height={16} animation="wave" sx={{ transform: 'none', mb: 0.5 }} />
            <Skeleton variant="text" width={56} height={12} animation="wave" sx={{ transform: 'none' }} />
          </>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ lineHeight: 1, fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1, mt: 0.5 }}>
              {label}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

const StatsBanner = ({ stats, fetching }) => {
  const theme = useTheme();
  // Ajustei para 'sm' para casar com o comportamento de Grid comum, 
  // mas mantive sua lógica de espaçamento.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{ 
        mb: 2, // Aumentei um pouco o respiro inferior
        py: 1, // Padding vertical para garantir que o Grid não encoste nas bordas
        bgcolor: 'background.paper',
      }}
    >
      {/* Usamos Grid v2 ou o container padrão com tamanho fixo */}
      <Grid container spacing={isMobile ? 3 : 2} alignItems="center">
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatItem icon={MenuBook} label="Cursos" value={stats.courses} loading={fetching} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatItem icon={CategoryOutlined} label="Categorias" value={stats.categories} loading={fetching} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatItem icon={AutoStoriesOutlined} label="Aulas" value={stats.lessons} loading={fetching} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatItem icon={AssignmentOutlined} label="Exercícios" value={stats.quizzes} loading={fetching} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatsBanner;