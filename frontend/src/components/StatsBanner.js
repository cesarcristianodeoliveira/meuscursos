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
        justifyContent: 'center',
        gap: 2,
        // Forçamos uma altura mínima para o item não variar entre loading e dado real
        height: 40, 
      }}
    >
      <Icon sx={{ color: 'text.secondary', fontSize: 32 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loading ? (
          <>
            <Skeleton 
              variant="text" 
              width={24} 
              height={16} 
              animation="wave" 
              sx={{ transform: 'none', mb: 0.5 }} 
            />
            <Skeleton 
              variant="text" 
              width={56} 
              height={12} 
              animation="wave" 
              sx={{ transform: 'none' }} 
            />
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{ 
        width: '100%',
        // Removidas as margens e paddings que causavam a assimetria
        // O respiro será controlado pelo Dashboard para ser idêntico em cima e embaixo
      }}
    >
      <Grid container spacing={isMobile ? 3 : 2} alignItems="center">
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatItem icon={CategoryOutlined} label="Categorias" value={stats.categories} loading={fetching} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatItem icon={MenuBook} label="Cursos" value={stats.courses} loading={fetching} />
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