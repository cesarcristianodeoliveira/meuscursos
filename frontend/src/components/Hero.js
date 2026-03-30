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
import { Send, Clear, WarningAmber, Lock, Psychology } from '@mui/icons-material';
import { useCourse } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { blue, grey, red, green, orange } from '@mui/material/colors';
import prompts from '../utils/prompts';

/**
 * Componente de Progresso Circular Estilizado
 */
function CircularProgressWithLabel({ value, status }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        thickness={4} 
        size={100}
        sx={{ 
          color: value === 100 ? green[500] : 'primary.main',
          filter: 'drop-shadow(0 0 8px rgba(25, 118, 210, 0.2))'
        }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <Typography variant="h6" fontWeight="800">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

const Hero = ({ topic, setTopic, onGenerate }) => {
  const [randomPlaceholder, setRandomPlaceholder] = useState('');
  const { user, loading: authLoading } = useAuth(); 
  const { resolvedMode } = useAppTheme();

  const { 
    isGenerating, 
    progress, 
    statusMessage, 
    selectedProvider, 
    setSelectedProvider, 
    providers 
  } = useCourse();

  // --- LÓGICA DE TRAVAS (Alinhado com Backend) ---
  const hasNoCredits = user && user.role !== 'admin' && (user.credits <= 0 || !user.credits);
  const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];
  const isChecking = currentProvider?.quotaLabel?.toLowerCase().includes('verificando');
  const isProviderDisabled = !currentProvider?.enabled && !isChecking;

  const updatePlaceholder = useCallback(() => {
    if (prompts?.length > 0) {
      const randomIndex = Math.floor(Math.random() * prompts.length);
      setRandomPlaceholder(prompts[randomIndex]);
    }
  }, []);

  useEffect(() => {
    if (!isGenerating && !topic) {
      updatePlaceholder();
      const interval = setInterval(updatePlaceholder, 8000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, topic, updatePlaceholder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authLoading || isGenerating || !topic.trim()) return;

    if (!isProviderDisabled && !isChecking && !hasNoCredits) {
      onGenerate(); 
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', width: '100%', minHeight: '70vh',
      py: { xs: 4, md: 8 }
    }}>
      <Container maxWidth="md">
        {/* Header com Gradiente */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900, 
              fontSize: { xs: '2.8rem', md: '4.5rem' }, 
              letterSpacing: '-0.04em',
              mb: 2,
              lineHeight: 1.1
            }}
          >
            O que vamos <br />
            <Box component="span" sx={{ 
              background: `linear-gradient(90deg, ${blue[400]}, ${blue[700]})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              aprender hoje?
            </Box>
          </Typography>
          <Typography variant='h6' color='text.secondary' sx={{ opacity: 0.7, maxWidth: 500, mx: 'auto' }}>
            Crie cursos com lições, exercícios e certificados.
          </Typography>
        </Box>

        <Container maxWidth='sm' sx={{ p: 0 }}>
          {!isGenerating ? (
            <Zoom in={!isGenerating}>
              <Paper 
                elevation={0}
                component="form" 
                onSubmit={handleSubmit}
                sx={{ 
                  border: '1px solid', 
                  borderColor: hasNoCredits ? orange[300] : 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: resolvedMode === 'light' 
                    ? '0 25px 50px -12px rgba(0,0,0, 0.08)' 
                    : '0 25px 50px -12px rgba(0,0,0, 0.5)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:focus-within': { borderColor: 'primary.main', transform: 'scale(1.01)' }
                }}
              >
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder={hasNoCredits ? "Créditos esgotados..." : randomPlaceholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={hasNoCredits || authLoading}
                  InputProps={{
                    disableUnderline: true,
                    sx: { p: 3, fontSize: '1.2rem', fontWeight: 500 },
                    endAdornment: (
                      <InputAdornment position="end">
                        {topic ? (
                          <IconButton onClick={() => setTopic('')} size="small"><Clear /></IconButton>
                        ) : (
                          <Tooltip title="Sugestão">
                            <span>
                              <IconButton 
                                onClick={() => setTopic(randomPlaceholder)} 
                                color="primary" 
                                disabled={hasNoCredits}
                              >
                                <Psychology fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </InputAdornment>
                    )
                  }}
                />

                {/* Footer do Card de Input */}
                <Box sx={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: '1px solid', borderColor: 'divider', p: 2, 
                  bgcolor: resolvedMode === 'light' ? grey[50] : 'rgba(255,255,255,0.02)'
                }}>
                  <FormControl size="small">
                    <Select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      sx={{ borderRadius: 2, minWidth: 140, bgcolor: 'background.paper' }}
                    >
                      {providers.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" fontWeight={700}>{p.name}</Typography>
                            <Typography variant="caption" sx={{ 
                              color: p.enabled ? green[600] : (p.quotaLabel?.includes('Ver') ? blue[500] : red[400]),
                              fontSize: '0.65rem', textTransform: 'uppercase'
                            }}>
                              {p.quotaLabel}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {(isProviderDisabled || hasNoCredits) && (
                      <Tooltip title={hasNoCredits ? "Limite atingido" : "IA Offline"}>
                        <WarningAmber sx={{ color: hasNoCredits ? orange[500] : red[500] }} />
                      </Tooltip>
                    )}
                    
                    <IconButton 
                      color='secondary'
                      type="submit" 
                      disabled={!topic.trim() || isProviderDisabled || hasNoCredits || authLoading}
                      sx={{ 
                        width: 50, height: 50,
                        bgcolor: (topic.trim() && !isProviderDisabled && !hasNoCredits) ? 'secondary.main' : 'action.disabledBackground',
                        color: 'white', '&:hover': { bgcolor: 'secondary.dark' }
                      }}
                    >
                      {authLoading ? <CircularProgress size={24} color="inherit" /> : (hasNoCredits ? <Lock /> : <Send />)}
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </Zoom>
          ) : (
            /* Layout de Geração Ativa */
            <Fade in={isGenerating}>
              <Box sx={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                p: { xs: 4, md: 6 }, borderRadius: 6, bgcolor: 'background.paper',
                border: '1px solid', borderColor: 'divider', textAlign: 'center',
                boxShadow: '0 30px 60px rgba(0,0,0,0.1)'
              }}>
                <CircularProgressWithLabel value={progress} />
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  {statusMessage}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 350 }}>
                  {progress < 30 && "A IA está estruturando o currículo ideal..."}
                  {progress >= 30 && progress < 70 && "Escrevendo lições e criando desafios..."}
                  {progress >= 70 && progress < 95 && "Buscando imagens e gerando metadados..."}
                  {progress >= 95 && "Tudo pronto! Salvando na sua biblioteca..."}
                </Typography>
              </Box>
            </Fade>
          )}
        </Container>
      </Container>
    </Box>
  );
};

export default Hero;