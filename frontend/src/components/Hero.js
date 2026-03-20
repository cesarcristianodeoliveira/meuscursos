import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, TextField, Typography, Paper, 
  CircularProgress, Zoom, Fade, 
  Toolbar, MenuItem, Select, FormControl,
  Container,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { Send, ContentCopy, Clear, WarningAmber } from '@mui/icons-material';
import { useCourse } from '../contexts/CourseContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { blue, grey, red } from '@mui/material/colors';
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

  // Bloqueio visual se o provedor selecionado estiver sem cota
  const currentProvider = providers.find(p => p.id === selectedProvider);
  const isProviderDisabled = currentProvider ? !currentProvider.enabled : false;

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
    if (topic.trim() && !isGenerating && !isProviderDisabled) {
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
          <Typography variant="h3" sx={{ fontWeight: 600, display: 'inline-block', mr: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
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
              display: 'inline-block',
              fontSize: { xs: '2rem', md: '3rem' }
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
            sx={{ fontSize: { xs: '1.1rem', md: '1.8rem' }, fontWeight: 500 }}
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
                  border: '1px solid', 
                  borderColor: isProviderDisabled ? red[300] : 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: resolvedMode === 'light' ? '0 10px 40px rgba(0,0,0, 0.04)' : '0 10px 40px rgba(0,0,0, 0.4)',
                  overflow: 'hidden',
                  borderRadius: 3,
                  transition: 'border-color 0.3s ease'
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
                    sx: { p: 2.5, fontSize: '1.1rem', fontWeight: 500, pr: 7 },
                    endAdornment: (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 16 }}>
                        {topic ? (
                          <IconButton size="small" onClick={handleClear} sx={{ '&:hover': { color: 'error.main' } }}>
                            <Clear fontSize="small" />
                          </IconButton>
                        ) : (
                          <Tooltip title="Usar sugestão">
                            <IconButton size="small" onClick={handleUsePrompt} color="primary">
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
                  p: 1.5, px: 2,
                  bgcolor: resolvedMode === 'light' ? grey[50] : 'rgba(255,255,255,0.02)'
                }}>
                  
                  <FormControl size="small">
                    <Select
                      color='primary'
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      variant="outlined"
                      sx={{ 
                        minWidth: 160, 
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        '& .MuiSelect-select': { py: 0.5 }
                      }}
                    >
                      {providers.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                            <Typography variant="body2" fontWeight={700} color={p.enabled ? "text.primary" : "text.disabled"}>
                              {p.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: p.enabled ? blue[600] : red[400],
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                              }}
                            >
                              {p.quotaLabel}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isProviderDisabled && (
                       <Tooltip title="Este provedor atingiu o limite da hora. Troque de provedor ou aguarde.">
                        <WarningAmber sx={{ color: red[400], mr: 1 }} fontSize="small" />
                       </Tooltip>
                    )}
                    
                    <IconButton 
                      color='primary'
                      type="submit" 
                      disabled={!topic.trim() || isGenerating || isProviderDisabled}
                      sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        width: 45, 
                        height: 45,
                        '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' }, 
                        '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                        transition: 'all 0.2s'
                      }}
                    >
                      <Send fontSize="small" />
                    </IconButton>
                  </Box>
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
                borderRadius: 5, 
                bgcolor: resolvedMode === 'light' ? 'rgba(25, 118, 210, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                border: '2px dashed',
                borderColor: 'primary.light',
                textAlign: 'center'
              }}>
                <CircularProgressWithLabel value={progress} />
                
                <Typography variant="h5" sx={{ mt: 3, fontWeight: 800, color: 'text.primary' }}>
                  {statusMessage}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 450, lineHeight: 1.6 }}>
                  {progress < 100 
                    ? "Isso pode levar até 2 minutos. Estamos gerando conteúdo técnico exaustivo." 
                    : "Quase lá! Estamos salvando seu novo curso no banco de dados."}
                </Typography>

                <Paper elevation={0} sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1.5s infinite' }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {progress < 50 ? "SABIA? Nossos cursos usam Llama 3.3 para máxima precisão técnica." : "DICA: O certificado é gerado automaticamente ao final."}
                  </Typography>
                </Paper>
              </Box>
            </Fade>
          )}
        </Container>
      </Box>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            70% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.7; }
          }
        `}
      </style>
    </>
  );
};

export default Hero;