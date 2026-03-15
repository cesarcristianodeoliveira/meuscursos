import React from 'react';
import { 
  Box, TextField, Button, Typography, Paper, 
  CircularProgress, InputAdornment, Zoom, Fade 
} from '@mui/material';
import { AutoAwesome, School } from '@mui/icons-material';
import { useCourse } from '../contexts/CourseContext';
import { grey } from '@mui/material/colors';
import { useAppTheme } from '../contexts/ThemeContext';

function CircularProgressWithLabel({ value }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        thickness={4.5} 
        sx={{ color: 'primary.main' }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography variant="h6" component="div" color="text.primary" fontWeight="bold">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

const Hero = ({ topic, setTopic, onGenerate }) => {
  const { isGenerating, progress, statusMessage } = useCourse();
  const { resolvedMode } = useAppTheme();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerate();
    }
  };

  return (
    <Box
      sx={{
        bgcolor: resolvedMode === 'light' ? grey[100] : grey[900],
        p: 4,
        width: '100%',
      }}
    >
      <Typography 
        align='center'
        variant="h4" 
        sx={{ 
          mb: .5, 
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        Meus Cursos
      </Typography>
      <Typography 
        align='center'
        color="text.secondary" 
        sx={{ 
          mb: 2,
          lineHeight: 1 
        }}
      >
        Gere cursos completos com inteligência artificial em segundos.
      </Typography>

      <Box sx={{ mx: 'auto', position: 'relative' }}>
        {!isGenerating ? (
          <Zoom in={!isGenerating}>
            <Paper 
              elevation={0}
              component="form" 
              onSubmit={handleSubmit}
              sx={{ 
                p: 0.5, display: 'flex', alignItems: 'center', borderRadius: 3,
                border: '1px solid', borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.3s ease',
                '&:focus-within': { 
                  borderColor: 'primary.main', 
                  boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.08)' 
                }
              }}
            >
              <TextField
                fullWidth
                variant="standard"
                placeholder="Ex: Fundamentos de React, Culinária Italiana..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ pl: 2 }}>
                      <School color="action" />
                    </InputAdornment>
                  ),
                  sx: { py: 1.5, px: 1, fontSize: '1.1rem' }
                }}
              />
              <Button 
                variant="contained" 
                type="submit" 
                disabled={!topic.trim()}
                sx={{ 
                  borderRadius: 2.5, 
                  px: 4, 
                  height: 56, 
                  fontWeight: 700, 
                  textTransform: 'none',
                  boxShadow: 2
                }}
              >
                <AutoAwesome />
              </Button>
            </Paper>
          </Zoom>
        ) : (
          <Fade in={isGenerating}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              p: 4, 
              borderRadius: 3, 
              bgcolor: 'rgba(25, 118, 210, 0.04)', // Tom azulado sutil
              border: '1px dashed',
              borderColor: 'primary.light'
            }}>
              <CircularProgressWithLabel value={progress} />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: 'text.primary' }}>
                {statusMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {progress < 100 
                  ? "Isso pode levar alguns instantes, estamos preparando o melhor conteúdo." 
                  : "Quase lá! Finalizando os últimos detalhes..."}
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
};

export default Hero;