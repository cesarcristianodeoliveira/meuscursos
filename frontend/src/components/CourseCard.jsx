import React from 'react';
import { Link } from 'react-router-dom';
import { urlFor } from '../client';
import timeAgo from '../utils/timeAgo';
import { useCourse } from '../contexts/CourseContext';
import { 
  Card, Box, CardMedia, CardActionArea, Typography, Chip, 
  Rating
} from '@mui/material';
import { RocketLaunch, AccessTime, AutoStoriesOutlined, TimerOutlined, Percent } from '@mui/icons-material';
import StarIcon from '@mui/icons-material/Star';

const CourseCard = ({ course }) => {
  const { getCourseProgress } = useCourse();
  const progressPercentage = getCourseProgress(course);
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 0,
        display: 'flex', overflow: 'hidden' 
      }}
    >
      <CardActionArea 
        component={Link} 
        to={`/curso/${course.slug?.current}`}
        sx={{ 
          display: 'flex', 
          // 'column' no mobile (xs), 'row' a partir do sm
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: 'center',
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
              height: { xs: 128, sm: '100%' },
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
              height: { xs: 160, sm: '100%' },
              minWidth: { xs: '100%', sm: 256 },
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RocketLaunch sx={{ fontSize: 32, color: 'text.disabled' }} />
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
              label={course.category.name || "Geral"} 
              size="small"
              variant="outlined"
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
              mb: 1,
              lineHeight: 1.3,
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

          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: .5,
              }}
            >
              <Rating 
                size="small" 
                name="half-rating-read" 
                defaultValue={course.rating} precision={0.5} readOnly 
                emptyIcon={<StarIcon style={{ opacity: 0.75 }} fontSize="inherit" />}
              />
              <Typography variant='caption' color="text.secondary" lineHeight={1}>{course.rating}</Typography>
            </Box>

            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: 1
              }}
            >
              {/* <IconButton color='inherit' onClick={handleDownloadPDF}><PictureAsPdf /></IconButton> */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AutoStoriesOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" lineHeight={1}>
                  {course.modules?.length || 0} aulas
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" lineHeight={1}>
                  {course.estimatedTime}h
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Percent sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" lineHeight={1}>
                  {progressPercentage}
                </Typography>
              </Box>
            </Box>
          </Box>

        </Box>
      </CardActionArea>
    </Card>
  );
};

export default CourseCard;