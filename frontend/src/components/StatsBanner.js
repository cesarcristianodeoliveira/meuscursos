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
      }}
    >
      <Icon sx={{ color: 'text.secondary', fontSize: 32 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: .5 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width={32} height={16} />
            <Skeleton variant="text" width={64} height={16} />
          </>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box 
      sx={{ 
        mb: 2, 
        bgcolor: 'background.paper',
      }}
    >
      <Grid container spacing={isMobile ? 2 : 0} alignItems="center">
        <Grid size={{ xs: 12, md: 3 }}>
          <StatItem icon={MenuBook} label="Cursos" value={stats.courses} loading={fetching} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatItem icon={CategoryOutlined} label="Categorias" value={stats.categories} loading={fetching} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatItem icon={AutoStoriesOutlined} label="Aulas" value={stats.lessons} loading={fetching} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatItem icon={AssignmentOutlined} label="Exercícios" value={stats.quizzes} loading={fetching} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatsBanner;