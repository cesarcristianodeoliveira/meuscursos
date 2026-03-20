import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, TextField, Typography, Paper, 
  CircularProgress, Zoom, Fade, 
  Toolbar, MenuItem, Select, FormControl,
  Container,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Send, ContentCopy, Clear } from '@mui/icons-material';
import { useCourse } from '../contexts/CourseContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { blue } from '@mui/material/colors';
import prompts from '../utils/prompts';

function CircularProgressWithLabel({ value }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        thickness={4.5} 
        size={80}
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
  const [randomPlaceholder, setRandomPlaceholder] = useState('');

  const { 
    isGenerating, 
    progress, 
    statusMessage, 
    selectedProvider, 
    setSelectedProvider, 
    providers 
  } = useCourse();
  
  const { resolvedMode } = useAppTheme();

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  };

  const updatePlaceholder = useCallback(() => {
    const newPlaceholder = getRandomPrompt();
    setRandomPlaceholder(newPlaceholder);
  }, []);

  const handleUsePrompt = () => {
    setTopic(randomPlaceholder);
  };

  const handleClear = () => {
    setTopic('');
  };

  useEffect(() => {
    if (!isGenerating && !topic) {
      updatePlaceholder();
      const interval = setInterval(() => {
        if (!topic) updatePlaceholder();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, topic, updatePlaceholder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerate();
    }
  };

  return (
    <>
      <Toolbar />
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 2,
          py: { xs: 2, md: 4 },
          width: '100%',
        }}
      >
        {/* TITULOS */}
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Typography variant="h3" sx={{ fontWeight: 600, display: 'inline-block', mr: 1 }}>
            O que você quer
          </Typography>
          <Typography 
            variant="h3"
            sx={{ 
              fontWeight: 600,
              background: `linear-gradient(90deg, ${blue[300]} 0%, ${blue[700]} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              display: 'inline-block'
            }}
          >
            aprender?
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography 
            align='center' 
            variant='h4' 
            color='text.secondary'
            sx={{ fontSize: { xs: '1.25rem', md: '2.0243rem' }, fontWeight: 500 }}
          >
            Cursos com Inteligência Artificial
          </Typography>
        </Box>

        {/* FORMULÁRIO */}
        <Container maxWidth='sm' sx={{ px: [0] }}>
          {!isGenerating ? (
            <Zoom in={!isGenerating}>
              <Paper 
                elevation={0}
                component="form" 
                onSubmit={handleSubmit}
                sx={{ 
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: resolvedMode === 'light' ? '0 10px 40px rgba(0,0,0, 0.04)' : '0 10px 40px rgba(0,0,0, 0.4)',
                  overflow: 'hidden',
                  borderRadius: 2
                }}
              >
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder={randomPlaceholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  autoComplete="off"
                  sx={{ '.MuiInputBase-input': { p: 0, height: 'auto' } }}
                  InputProps={{
                    disableUnderline: true,
                    sx: { p: 2, fontSize: '1.2rem', fontWeight: 500, pr: 7 },
                    endAdornment: (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 16 }}>
                        {topic ? (
                          <IconButton size="small" onClick={handleClear} sx={{ '&:hover': { color: 'error.main' } }}>
                            <Clear fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton size="small" onClick={handleUsePrompt} color="primary" title="Usar sugestão">
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        )}
                      </InputAdornment>
                    )
                  }}
                />

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderTop: '1px solid', borderColor: 'divider',
                  p: 1.5, px: 2
                }}>
                  
                  {/* SELETOR DE PROVEDOR COM FEEDBACK DE COTA */}
                  <FormControl size="small">
                    <Select
                      color='secondary'
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      variant="outlined"
                      sx={{ minWidth: 140, borderRadius: 1.5 }}
                    >
                      {providers.map((p) => (
                        <MenuItem key={p.id} value={p.id} disabled={!p.enabled}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {p.name}
                            </Typography>
                            <Typography variant="caption" color={p.enabled ? "text.secondary" : "error"}>
                              {p.quotaLabel}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <IconButton 
                    color='primary'
                    type="submit" 
                    disabled={!topic.trim()}
                    sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Paper>
            </Zoom>
          ) : (
            <Fade in={isGenerating}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: { xs: 4, md: 6 }, 
                borderRadius: 4, 
                bgcolor: resolvedMode === 'light' ? 'rgba(25, 118, 210, 0.02)' : 'rgba(25, 118, 210, 0.05)',
                border: '1px dashed',
                borderColor: 'primary.light'
              }}>
                <CircularProgressWithLabel value={progress} />
                <Typography variant="h5" sx={{ mt: 3, fontWeight: 700, color: 'text.primary', textAlign: 'center' }}>
                  {statusMessage}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, textAlign: 'center', maxWidth: 500 }}>
                  {progress < 100 
                    ? "Nossa IA está estruturando módulos, criando exercícios e gerando material técnico de alta qualidade." 
                    : "Finalizando a indexação e salvando seu novo curso..."}
                </Typography>
              </Box>
            </Fade>
          )}
        </Container>
      </Box>
    </>
  );
};

export default Hero;