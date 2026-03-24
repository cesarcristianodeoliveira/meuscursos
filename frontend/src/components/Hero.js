import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, TextField, Typography, Paper, 
  CircularProgress, Zoom, Fade, 
  MenuItem, Select, FormControl,
  Container,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { Send, ContentCopy, Clear, WarningAmber } from '@mui/icons-material';
import { useCourse } from '../contexts/CourseContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { blue, grey, red, green } from '@mui/material/colors';
import prompts from '../utils/prompts';

function CircularProgressWithLabel({ value }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        thickness={4.5} 
        size={80}
        sx={{ 
          color: 'primary.main',
          filter: 'drop-shadow(0 0 8px rgba(25, 118, 210, 0.3))'
        }}
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

  const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];
  
  // Lógica de bloqueio aprimorada para o Render
  const isChecking = currentProvider?.quotaLabel.includes('Verificando') || currentProvider?.quotaLabel.includes('Consultando');
  const isProviderDisabled = !currentProvider?.enabled && !isChecking;

  const updatePlaceholder = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setRandomPlaceholder(prompts[randomIndex]);
  }, []);

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
    if (topic.trim() && !isGenerating && !isProviderDisabled && !isChecking) {
      onGenerate();
    }
  };

  return (
    <>
      <Box 
        sx={{ 
          alignItems: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          width: '100%',
          minHeight: '100vh' 
        }}
      >
        <Box
          sx={{
            alignItems: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%',
            px: 2, 
            py: 4, 
          }}
        >
          {/* TITULOS */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, display: 'inline-block', mr: 1.5, fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: '-0.02em' }}>
              O que vamos
            </Typography>
            <Typography 
              variant="h3"
              sx={{ 
                fontWeight: 800,
                // background: `linear-gradient(135deg, ${blue[400]} 0%, ${blue[700]} 100%)`,
                background: `linear-gradient(135deg, ${blue[300]} 0%, ${blue[700]} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                display: 'inline-block',
                fontSize: { xs: '2rem', md: '3.5rem' },
                letterSpacing: '-0.02em'
              }}
            >
              aprender?
            </Typography>
          </Box>

          <Typography 
            align='center' 
            variant='h5' 
            color='text.secondary'
            sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '2.0243rem' }, fontWeight: 400, opacity: 0.8 }}
          >
            Cursos com Inteligência Artifical.
          </Typography>

          {/* FORMULÁRIO */}
          <Container maxWidth='sm' sx={{ px: { xs: 0, sm: 2 } }}>
            {!isGenerating ? (
              <Zoom in={!isGenerating}>
                <Paper 
                  elevation={0}
                  component="form" 
                  onSubmit={handleSubmit}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: isProviderDisabled ? red[200] : (isChecking ? blue[100] : 'divider'),
                    bgcolor: 'background.paper',
                    boxShadow: resolvedMode === 'light' ? '0 20px 60px rgba(0,0,0, 0.05)' : '0 20px 60px rgba(0,0,0, 0.3)',
                    overflow: 'hidden',
                    borderRadius: 4,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder={randomPlaceholder}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    autoComplete="off"
                    disabled={isGenerating}
                    InputProps={{
                      disableUnderline: true,
                      sx: { p: 3, fontSize: { xs: '1rem', md: '1.25rem' }, pr: 9, transition: 'none' },
                      endAdornment: (
                        <InputAdornment position="end" sx={{ position: 'absolute', right: 16, ml: [0] }}>
                          {topic ? (
                            <IconButton onClick={() => setTopic('')}>
                              <Clear />
                            </IconButton>
                          ) : (
                            <Tooltip placement='left' title="Usar sugestão">
                              <IconButton onClick={() => setTopic(randomPlaceholder)} color="primary">
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                          )}
                        </InputAdornment>
                      )
                    }}
                  />

                  <Box sx={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid', borderColor: 'divider',
                    p: 2, bgcolor: resolvedMode === 'light' ? grey[50] : 'rgba(255,255,255,0.01)'
                  }}>
                    
                    <FormControl size="small">
                      <Select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        variant="outlined"
                        sx={{ 
                          minWidth: 128, borderRadius: 2, bgcolor: 'background.paper',
                          '& .MuiSelect-select': { py: 1, display: 'flex', alignItems: 'center' }
                        }}
                      >
                        {providers.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1 }}>
                                {p.name}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: p.enabled ? green[600] : (p.quotaLabel.includes('Verificando') ? blue[500] : red[400]),
                                  fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', mt: 0.5
                                }}
                              >
                                {p.quotaLabel}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {isProviderDisabled && (
                        <Tooltip placement='left' title="Limite atingido.">
                          <WarningAmber sx={{ color: red[500] }} />
                        </Tooltip>
                      )}
                      
                      <IconButton 
                        color='secondary'
                        type="submit" 
                        disabled={!topic.trim() || isGenerating || isProviderDisabled || isChecking}
                        sx={{ 
                          // bgcolor: 'secondary.main', color: 'white', 
                          width: 48, height: 48,
                          // '&:hover': { bgcolor: 'secondary.dark' },
                          // '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                        }}
                      >
                        {isChecking ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Zoom>
            ) : (
              <Fade in={isGenerating}>
                <Box sx={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', 
                  p: { xs: 4, md: 8 }, borderRadius: 6, 
                  bgcolor: resolvedMode === 'light' ? 'white' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid', borderColor: 'divider', textAlign: 'center',
                  boxShadow: '0 30px 90px rgba(0,0,0,0.1)'
                }}>
                  <CircularProgressWithLabel value={progress} />
                  <Typography variant="h5" sx={{ mt: 4, fontWeight: 800 }}>
                    {statusMessage}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 400 }}>
                    {progress < 90 
                      ? "Nossa IA está estruturando os módulos e criando exercícios personalizados para você." 
                      : "Finalizando! Estamos salvando seu curso e preparando o ambiente de estudo."}
                  </Typography>
                </Box>
              </Fade>
            )}
          </Container>
        </Box>
      </Box>

      <style>
        {`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}
      </style>
    </>
  );
};

export default Hero;