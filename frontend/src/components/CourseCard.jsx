import React from 'react';
import { Link } from 'react-router-dom';
import { urlFor } from '../client';
import timeAgo from '../utils/timeAgo';
import { 
  Card, Box, CardMedia, CardActionArea, Typography, Chip 
} from '@mui/material';
import { RocketLaunch, AccessTime } from '@mui/icons-material';

const CourseCard = ({ course }) => {
  return (
    <Card sx={{ display: 'flex', overflow: 'hidden', mb: 2 }}>
      <CardActionArea 
        component={Link} 
        to={`/curso/${course.slug?.current}`}
        sx={{ 
          display: 'flex', 
          // 'column' no mobile (xs), 'row' a partir do sm
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: 'stretch',
          justifyContent: 'flex-start'
        }}
      >
        {/* Imagem do Card */}
        {course.thumbnail ? (
          <CardMedia
            component="img"
            sx={{ 
              // Largura total no mobile, largura fixa no desktop
              width: { xs: '100%', sm: 256 },
              // Altura fixa no mobile para não ficar gigante, 100% no desktop
              height: { xs: 180, sm: 'auto' },
              minWidth: { xs: '100%', sm: 256 }, 
              objectFit: 'cover',
            }}
            image={urlFor(course.thumbnail).url()}
            alt={course.title}
          />
        ) : (
          <Box
            sx={{
              width: { xs: '100%', sm: 256 },
              height: { xs: 150, sm: '100%' },
              minWidth: { xs: '100%', sm: 256 },
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RocketLaunch sx={{ fontSize: 40, color: 'text.disabled' }} />
          </Box>
        )}

        {/* Conteúdo do Card */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1,
          p: 2,
          overflow: 'hidden' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip 
              label={course.category || "Geral"} 
              size="small"
              variant="outlined"
              sx={{ 
                borderRadius: 1,
                fontSize: '0.7rem',
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" lineHeight={1}>
                {timeAgo(course._createdAt)}
              </Typography>
            </Box>
          </Box>

          <Typography 
            component="h2" 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              mb: 1,
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, sm: 1 }, // Permite 2 linhas no mobile
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.title}
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2
            }}
          >
            {course.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
            <Typography variant="caption" color="primary.main" fontWeight={600}>
              {course.modules?.length || 0} aulas
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default CourseCard;