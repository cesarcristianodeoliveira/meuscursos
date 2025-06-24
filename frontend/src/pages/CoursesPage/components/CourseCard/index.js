import React from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { Link } from 'react-router-dom'; // To link to the course details page

function CourseCard({ course }) {
  // Destructure course properties, providing default values for safety
  const {
    // _id,
    title = 'Título Indisponível',
    slug,
    description = 'Nenhuma descrição disponível.',
    // image,
    level = 'Nível não informado',
    estimatedDuration = 'Duração não informada',
    price = 0,
    isProContent = false,
  } = course;

  // Generate the URL for the course image, if available
  // const imageUrl = image && image.asset && image.asset.url ? image.asset.url : 'https://via.placeholder.com/400x250?text=Sem+Imagem'; // Placeholder image

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea component={Link} to={`/cursos/${slug}`} sx={{ flexGrow: 1 }}>
        {/* <CardMedia
          id={_id}
          component="img"
          height="180" // Fixed height for consistency
          image={imageUrl}
          alt={title}
          sx={{ objectFit: 'cover' }} // Ensure image covers the area
        /> */}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography gutterBottom variant="h6" component="h2" sx={{ mr: 1 }}>
              {title}
            </Typography>
            {isProContent && (
              <Chip label="PRO" color="secondary" size="small" sx={{ ml: 'auto' }} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3, // Limit description to 3 lines
            WebkitBoxOrient: 'vertical',
          }}>
            {description}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label={level} size="small" variant="outlined" />
            <Chip label={estimatedDuration} size="small" variant="outlined" />
            <Chip label={price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`} size="small" variant="outlined" />
          </Box>
        </CardContent>
      </CardActionArea>
      {/* Optionally, you could add CardActions here for other buttons if needed */}
    </Card>
  );
}

export default CourseCard;